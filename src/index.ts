import BaseCtrl from './System/BaseCtrl'
// export { BaseCtrl as BaseCtrl };

import BaseSQL from './System/BaseSQL'
// export { BaseSQL as BaseSQL };

import BaseM from './System/BaseM'
// export { BaseM as BaseM };

import { ModelValidatorSys } from './System/ModelValidatorSys'
// export { ModelValidatorSys as ModelValidatorSys };

import { ErrorSys } from './System/ErrorSys';
// export { ErrorSys, BaseSQL };

import { UserSys } from './System/UserSys'

import { ResponseSys } from './System/ResponseSys'

import MainRequest from './System/MainRequest'
// export { MainRequest as MainRequest };

import { ModelOneRuleC } from './Components/ModelOneRuleC'

import { ModelRulesC } from './Components/ModelRulesC'

// /* LEGO ошибок */
import ErrorSysMiddleware from './System/Middleware/ErrorSysMiddleware'

/* Создает объект запроса */
import RequestSysMiddleware from './System/Middleware/RequestSysMiddleware'

/* Создает объект ответа */
import ResponseSysMiddleware from './System/Middleware/ResponseSysMiddleware'

// /* проверка авторизации на уровне приложения */
import AuthSysMiddleware from './System/Middleware/AuthSysMiddleware'

import { RedisSys } from './System/RedisSys';

const Middleware =  {
    ErrorSysMiddleware,
    RequestSysMiddleware,
    ResponseSysMiddleware,
    AuthSysMiddleware
};

export {
    BaseCtrl,
    BaseSQL,
    BaseM,
    ModelValidatorSys,
    ModelOneRuleC,
    ModelRulesC,
    ErrorSys,
    UserSys,
    ResponseSys,
    RedisSys,
    Middleware,
    MainRequest
}