import redis from 'ioredis';
import { knex, Knex } from 'knex';
import _ from 'lodash';
import { v4 as uuid4 } from 'uuid';

interface ConnectI{
	// Конфигруация редиса
	urlDbMaster: string;
	urlDbScan: string;

	// Если сканирование ключей настроено через sphinx
	sphinxDb?: Knex.Config;
	sphinxIndex?: string;
}

/** Обертка над редисом которая понимает async/await */
export class RedisSys {
	public redisMaster: redis.Redis;

	public redisScan: redis.Redis;

	public sphinxDb: Knex;

	public sphinxIndex: string;

	constructor(param: ConnectI) {
		// Базы данных для чтения
		this.redisMaster = new redis(param.urlDbMaster);
		this.redisScan = new redis(param.urlDbScan);

		// Насрройки sphinx
		if (param.sphinxDb && param.sphinxIndex) {
			this.sphinxDb = knex(param.sphinxDb);
			this.sphinxIndex = param.sphinxIndex;
		} else {
			console.log('Параметры sphinx для кеша не указаны!!!');
			console.log('sphinxDb>>>', param.sphinxDb);
			console.log('sphinxIndex>>>', param.sphinxIndex);
		}
	}

	/**
     * Получить значение из редиса
     * @param key
     */
	public async get(key: string): Promise<string> {
		// Пробуем получить ключ из кеша
		let kCaсheKey = await this.redisScan.get(key);

		// console.log('get-redis-scan',kCaсheKey);
		if (!kCaсheKey && this.sphinxDb) {
			kCaсheKey = await this.getFromSphinx(key);

			if (kCaсheKey) { // Если ключ в sphinx все таки есть записываем его в редис scan
				await this.redisScan.set(key, kCaсheKey, 'EX', 30 * 24 * 3600);
			}
		}
		// console.log('get-sphinx',kCaсheKey);

		let vData = null;
		if (kCaсheKey) { // Если ключ есть - можем запросить данные
			vData = await this.redisMaster.get(kCaсheKey);
		}

		return vData;
	}

	/**
     * Получить ключи по шаблону - медленный способ
     * @param sKeyPattern
     */
	public async keys(sKeyPattern: string): Promise<string[]> {
		let aKeys: string[] = [];
		if (this.sphinxDb) {
			aKeys = await this.scanFromSphinx(sKeyPattern);
		} else {
			aKeys = <any> await this.redisScan.keys(sKeyPattern);
		}
		return aKeys;
	}

	/**
     * Получить ключи по шаблону сканированием
     * @param keys
     */
	public async scan(sKeyPattern: string): Promise<string[]> {
		let aKeys: string[] = [];
		if (this.sphinxDb) {
			aKeys = await this.scanFromSphinx(sKeyPattern);
		} else {
			const iRedisSize = await this.redisScan.dbsize();
			aKeys = <any>(await this.redisScan.scan(0, 'MATCH', sKeyPattern, 'COUNT', iRedisSize))[1];
		}
		return aKeys;
	}

	/**
     * Получить количество ключей базы данных
     * @param keys
     */
	public async dbsize(): Promise<number> {
		return await this.redisScan.dbsize();
	}

	/**
     * Поместить значение в редис
     * @param key
     * @param val
     * @param time
     */
	public async set(key: string, val: string|number, time = 3600): Promise<string> {
		let kCaсheKey = await this.redisScan.get(key);

		// Записываем ключ если его нет при настройках sphinx
		if (!kCaсheKey && this.sphinxDb) {
			kCaсheKey = await this.setInSphinx(key);

			if (kCaсheKey) { // Записываем только если смогли сделать ключ
				await this.redisScan.set(key, kCaсheKey);
			}
		}

		// Записываем ключ если настроек сфинкс нет
		if (!kCaсheKey && !this.sphinxDb) {
			kCaсheKey = uuid4();
			// Кешируем на 1 день
			await this.redisScan.set(key, kCaсheKey, 'EX', 30 * 24 * 3600);
		}

		if (kCaсheKey) {
			await this.redisMaster.set(kCaсheKey, String(val), 'EX', time);
		}

		return kCaсheKey;
	}

	/**
	 * Найти и удалить ключи по шаблону
	 * @param sMatch
	 * @param iCount
	 */
	public async clear(sMatch: string): Promise<string[]> {
		const aKeys = await this.keys(sMatch);
		// console.log('=========================');
		// console.log('aKeys for match', sMatch);
		// console.log('aKeys for del', aKeys);
		// console.log('=========================');
		await this.del(aKeys);
		return aKeys;
	}

	/**
     * Удалить ключи по ID
     * @param keys
     */
	public async del(keys: any[]): Promise<any> {
		if (keys.length > 0) {
			const aaKeys = _.chunk(keys, 1000);
			for (let i = 0; i < aaKeys.length; i++) {
				const aKeys = aaKeys[i];
				await this.redisMaster.del(aKeys);
			}
		}
	}

	// ============================================
	// SPHINX операции с ключами
	// ============================================

	/**
	* Генерация случайного числа в между двумя числами включительно
	* @param min
	* @param max
	*/
	private randomInteger(): bigint {
		const sUuid = uuid4();

		const aSymbol: number[] = [];
		for (let c = 0; c < sUuid.length; c++) {
			if (sUuid[c] !== '-') {
				let iSymbol = sUuid.charCodeAt(c);
				if (iSymbol >= 200) {
					iSymbol %= 200;
				}
				if (iSymbol >= 100) {
					iSymbol %= 100;
				}
				aSymbol.push(iSymbol);
			}
		}

		let sSymbol2 = aSymbol.join('');
		// console.log(sUuid, sSymbol2);
		sSymbol2 = sSymbol2.slice(0, 16);

		const iSymbol2 = BigInt(sSymbol2);
		// console.log(sUuid, iSymbol2);
		return iSymbol2;
	}

	/**
     * Получить значение из редиса
     * @param sKey
     */
	private async getFromSphinx(sKey: string): Promise<string> {
		sKey = this.clearKeyForMatch(sKey);

		sKey = String(sKey);
		const sql = `

            SELECT id FROM ${this.sphinxIndex}
			WHERE
				k = :key
			AND
				end_at > :end_at
            LIMIT 1
            ;
        `;
		const param = {
			key: sKey,
			end_at: (new Date().getTime() / 1000),
		};
		// console.log('>>>getFromSphinx>>>', this.sphinxDb.raw(sql, param).toString());
		let v: any = null;
		try {
			v = (await this.sphinxDb.raw(sql, param))[0][0];
		} catch (e) {
			console.log('>>>ERROR>>>', e);
		}
		if (v) {
			v = v.id;
		}
		// console.log( v);
		return v;
	}

	/**
     * Получить ключи по шаблону сканированием
     * @param keys
     */
	public async scanFromSphinx(sKey: string): Promise<string[]> {
		sKey = this.clearKeyForMatch(sKey);

		sKey = sKey.replace(/[*]/g, '%');

		// let aKeyNew:string[] = [];
		// for (let i = 0; i < aKey.length; i++) {
		// 	const vKey = aKey[i];

		// 	if(vKey){
		// 		aKeyNew.push('"*'+String(vKey)+'*"');
		// 	}
		// }
		// aKey = aKeyNew;

		// sKey = aKey.join('<<');

		const sql = `

            SELECT id FROM ${this.sphinxIndex}
			WHERE
				k LIKE :key
			AND
				end_at > :end_at
			LIMIT 50000
            ;
		`;

		const param = {
			key: sKey,
			end_at: (new Date().getTime() / 1000),
		};
		// console.log('>>>scanFromSphinx>>>', this.sphinxDb.raw(sql, param).toString());
		let a: any[] = null;
		try {
			a = (await this.sphinxDb.raw(sql, param))[0];
		} catch (e) {
			console.log('>>>ERROR>>>', e);
		}
		// console.log('>>>scanFromSphinx-VAL>>>', a);
		if (a) {
			a = a.map((v) => String(v.id));
		}
		return a;
	}

	/**
     * Поместить значение в редис
     * @param sKey
     * @param val
     * @param time
     */
	public async setInSphinx(sKey: string): Promise<string> {
		let out = ''; // Ответ

		const vData = {
			k: sKey,
			created_at: (new Date().getTime() / 1000),
			end_at: (new Date().getTime() / 1000) + (30 * 24 * 3600),
		};

		try {
			const idKey = (await this.sphinxDb(this.sphinxIndex)
				.insert(vData)
			)[0];

			if (idKey) {
				out = String(idKey);
			}
		} catch (e) {
			out = ''; // Если произошла ошибка возвращаем пустую строку
			console.log('>>>ERROR>>>', e);
		}

		return out;
	}

	// Очистка ключа для поиска
	public clearKeyForMatch(sKey: string): string {
		sKey = sKey.replace(/["]/g, '');

		return sKey;
	}

	/** Ждет выполнения запросов и закрывает соединение */
	public quit() {
		this.redisMaster.quit();
		this.redisScan.quit();
	}
}
