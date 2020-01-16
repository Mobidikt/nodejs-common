import { SeoConfigI } from '../Components/Seo';
/**
 * Подключение к S3
 */
export interface S3confI {
    endpoint: string;
    bucket: string;
    baseUrl: string;
    access: string;
    secret: string;
}
export interface MainConfig {
    mysql: {
        client: string;
        connection: {
            host: string;
            user: string;
            password: string;
            database: string;
        };
        pool: {
            min: number;
            max: number;
        };
        migrations: {
            tableName: string;
            directory: string;
        };
        acquireConnectionTimeout: number;
    };
    redis: {
        url: string;
    };
    common: {
        env: string;
        oldCoreURL: string;
        errorMute: boolean;
        hook_url: string;
        port: number;
    };
    rabbit: {
        connection: string;
        queryList: string[];
    };
    S3: S3confI;
    S3DO: S3confI;
    S3DO256: S3confI;
    S3DO512: S3confI;
    S3DOPrivMsg512: S3confI;
    SeoConfig?: SeoConfigI;
}
