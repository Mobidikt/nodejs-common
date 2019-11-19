import Knex = require("knex");

export class DbProvider {

	public current: Knex;
	public db: Knex;

	constructor(db: Knex) {
		this.db = db;
	}

	public async transaction<T>(func: () => Promise<T>) {
		const trx = await this.db.transaction();
		this.current = trx;
		try {
			const result = await func();
			trx.commit();
			return result;
		} catch (e) {
			trx.rollback();
			throw e;
		} finally {
			this.current = this.db;
		}
	}

}