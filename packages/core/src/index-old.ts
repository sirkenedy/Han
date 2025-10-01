// Make sure reflect-metadata is imported
import 'reflect-metadata';

// Re-export selectively from common to avoid conflicts
export {
  Type,
  DynamicModule,
  ExecutionContext,
  HttpArgumentsHost,
  CanActivate,
  HanInterceptor,
  CallHandler,
  HanMiddleware,
  MiddlewareFunction,
  CONTROLLER_METADATA,
  MODULE_METADATA,
  INJECTABLE_METADATA,
  ROUTE_METADATA,
  PARAM_METADATA,
  RequestMethod,
  ParameterType,
  isFunction,
  isString,
  isUndefined,
  isObject,
  isEmpty,
  HanError,
  HttpException
} from 'han-prev-common';

// Core framework exports
export * from './core/han.factory';
export * from './decorators';
export * from './utils';