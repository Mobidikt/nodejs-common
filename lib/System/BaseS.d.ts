import { ErrorSys } from './ErrorSys';
import { UserSys } from './UserSys';
import { MainRequest } from './MainRequest';
import { LogicSys } from './LogicSys';
/**
 * Класс для сервисов которые проксируют запросы к базе данных
 * объединяют под различные запросы SQL под единой логикой службы
 * автоматизируют рутинные операции
 */
export default class BaseS {
    errorSys: ErrorSys;
    userSys: UserSys;
    req: MainRequest;
    logicSys: LogicSys;
    constructor(req: MainRequest);
}
