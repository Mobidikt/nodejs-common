



/**
 * Ответ декодиирования тикена
 * Должен обновляться каждую неделю
 * Время действия токена 1 месяц
 * Если пользователь постоянно пользуется сайтом у него будет ощущение бесконечного токена
 * Токен скрыто обновляется если он старше 1 недели
 */

import { intersection } from "lodash";
import { AccessSys } from "../AccessSys";
import { faApiRequest } from "../ApiRequest";
import { P63Context } from "../P63Context";
import { UserSys } from "../UserSys";

/** проверка аутентификации на уровне приложения */
export default async function AuthSysMiddleware(ctx:P63Context): Promise<void> {
    ctx.sys.apikey = ctx.cookies.apikey || <string>ctx.headers.apikey;
    ctx.sys.srvkey = <string>ctx.headers.srvkey;
    ctx.apikey = ctx.sys.apikey;

    /* юзерь не авторизован */
    ctx.sys.bAuth = false;
    const userSys = new UserSys(ctx);

    // Инициализируем систему для пользователей
    try { // отправка ошибки в апи

        let vAuthResp = null;
        vAuthResp = await faApiRequest<any>(ctx, ctx.common.hook_url_auth, { apikey:ctx.sys.apikey });
        await userSys.init(vAuthResp);
        
    } catch (e) {
        await userSys.init({});
        ctx.sys.errorSys.warning(
            'auth_check',
            'Ошибка проверки авторизации',
        );
    }


    // if (await userSys.isAuth()) {
    //     await userSys.init();
    //     /* проставляем авторизацию */
    //     request.sys.bAuth = true;

    // }
    ctx.sys.userSys = userSys;
    ctx.sys.accessSys = new AccessSys(ctx);

    ctx.next();
}
