// Common interfaces and types
export interface Type<T = {}> {
  new (...args: any[]): T;
}

export interface DynamicModule {
  module: Type<any>;
  providers?: any[];
  controllers?: any[];
  imports?: any[];
  exports?: any[];
}

export interface ModuleMetadata {
  providers?: any[];
  controllers?: any[];
  imports?: any[];
  exports?: any[];
}

export interface ExecutionContext {
  getHandler(): Function;
  getClass(): Type<any>;
  switchToHttp(): HttpArgumentsHost;
}

export interface HttpArgumentsHost {
  getRequest<T = any>(): T;
  getResponse<T = any>(): T;
  getNext<T = any>(): T;
}

export interface CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

export interface HanInterceptor<T = any, R = any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): R;
}

export interface CallHandler<T = any> {
  handle(): T;
}

export interface HanMiddleware {
  use(...args: any[]): any;
}

export type MiddlewareFunction = (req: any, res: any, next: any) => void;

// Common decorators
export const CONTROLLER_METADATA = "controller";
export const MODULE_METADATA = "module";
export const INJECTABLE_METADATA = "injectable";
export const ROUTE_METADATA = "route";
export const PARAM_METADATA = "param";

// HTTP Methods
export enum RequestMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
  ALL = "ALL",
  OPTIONS = "OPTIONS",
  HEAD = "HEAD",
}

// Parameter types
export enum ParameterType {
  BODY = "body",
  QUERY = "query",
  PARAM = "param",
  HEADERS = "headers",
  REQUEST = "request",
  RESPONSE = "response",
}

// Utility functions
export function isFunction(fn: any): fn is Function {
  return typeof fn === "function";
}

export function isString(str: any): str is string {
  return typeof str === "string";
}

export function isUndefined(obj: any): obj is undefined {
  return typeof obj === "undefined";
}

export function isObject(fn: any): fn is object {
  return !isUndefined(fn) && fn !== null && typeof fn === "object";
}

export function isEmpty(array: any): boolean {
  return !(array && array.length > 0);
}

// Error classes
export class HanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HanError";
  }
}

export class HttpException extends Error {
  constructor(
    message: string,
    private readonly status: number,
  ) {
    super(message);
    this.name = "HttpException";
  }

  getStatus(): number {
    return this.status;
  }

  getMessage(): string {
    return this.message;
  }
}
