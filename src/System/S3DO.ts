import * as AWS from 'aws-sdk';

/**
 * Параметры объекта для заливки
 * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
 */
export interface S3objectParamsI {
	Bucket: any;
	Key: string;
	ContentType: string;
	ContentLength: number;
	Body: any; // Buffer.from
	GrantFullControl?: string;
	ACL?: string; // private | public-read | public-read-write | authenticated-read | aws-exec-read | bucket-owner-read | bucket-owner-full-control
	GrantRead?: string;
	GrantReadACP?: string;
	GrantWriteACP?: string;
	CacheControl?: string;
	Metadata?: { [key: string]: string };
}

/** Параметры объекта для получения файла */
export interface getS3objectParamsI {
	Bucket: any;
	Key: string;
}

/** Параметры объекта для смены типа приватности */
export interface setS3objectAclParamsI {
	Bucket: any;
	Key: string;
	ACL?: string; // private | public-read | public-read-write | authenticated-read | aws-exec-read | bucket-owner-read | bucket-owner-full-control
}

/** Класс для роботы с S3 like */
export class S3DO {
	private conf: S3confI;

	protected spacesEndpoint: any;

	constructor(conf: S3confI) {
		this.conf = conf;
	}

	/**
     * Залить объект на s3
     * @param object
     */
	upload(object: S3objectParamsI): Promise<string> {
		return new Promise((resolve, reject) => {
			new AWS.S3({
				endpoint: (new AWS.Endpoint(this.conf.endpoint)).host,
				accessKeyId: this.conf.access,
				secretAccessKey: this.conf.secret,
				s3ForcePathStyle: true,
			})
				.putObject(object)
				.promise()
				.then((data: any) => {
					resolve(`${this.conf.baseUrl}/${object.Key}`);
				})
				.catch((e: any) => reject(e));
		});
	}

	/**
     * Получить объект
     * @param object
     */
	getObject(object: getS3objectParamsI): Promise<string> {
		return new Promise((resolve, reject) => {
			new AWS.S3({
				endpoint: (new AWS.Endpoint(this.conf.endpoint)).host,
				accessKeyId: this.conf.access,
				secretAccessKey: this.conf.secret,
				s3ForcePathStyle: true,
			})
				.getObject(object)
				.promise()
				.then((data: any) => {
					resolve(`${this.conf.baseUrl}/${object.Key}`);
				})
				.catch((e: any) => reject(e));
		});
	}

	/**
     * поменять права доступа у объекта
     * @param object
     */
	setObjectAcl(object: setS3objectAclParamsI): Promise<string> {
		return new Promise((resolve, reject) => {
			new AWS.S3({
				endpoint: (new AWS.Endpoint(this.conf.endpoint)).host,
				accessKeyId: this.conf.access,
				secretAccessKey: this.conf.secret,
				s3ForcePathStyle: true,
			})
				.putObjectAcl(object)
				.promise()
				.then((data: any) => {
					resolve(`${this.conf.baseUrl}/${object.Key}`);
				})
				.catch((e: any) => reject(e));
		});
	}
}
