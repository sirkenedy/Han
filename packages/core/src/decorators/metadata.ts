export const METADATA_KEYS = {
  CONTROLLER: Symbol('controller'),
  ROUTES: Symbol('routes'),
  PARAMS: Symbol('params'),
  MIDDLEWARE: Symbol('middleware'),
  INJECTABLE: Symbol('injectable'),
  MODULE: Symbol('module'),
} as const;

export interface RouteMetadata {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  path: string;
  methodName: string;
  middleware?: any[];
}

export interface ControllerMetadata {
  path: string;
  middleware?: any[];
}

export interface InjectableMetadata {
  dependencies: string[];
}

export class MetadataStorage {
  private static storage = new Map<any, any>();

  static set(target: any, key: symbol, value: any): void {
    this.storage.set(`${target.constructor.name}_${key.toString()}`, value);
  }

  static get<T>(target: any, key: symbol): T | undefined {
    return this.storage.get(`${target.constructor.name}_${key.toString()}`);
  }

  static has(target: any, key: symbol): boolean {
    return this.storage.has(`${target.constructor.name}_${key.toString()}`);
  }

  static getRoutes(target: any): RouteMetadata[] {
    return this.get<RouteMetadata[]>(target, METADATA_KEYS.ROUTES) || [];
  }

  static addRoute(target: any, route: RouteMetadata): void {
    const routes = this.getRoutes(target);
    routes.push(route);
    this.set(target, METADATA_KEYS.ROUTES, routes);
  }

  static addParam(target: any, methodName: string, param: any): void {
    const key = `${target.constructor.name}_${methodName}_params`;
    const params = this.storage.get(key) || [];
    params.push(param);
    this.storage.set(key, params);
  }

  static getParams(target: any, methodName: string): any[] {
    const key = `${target.constructor.name}_${methodName}_params`;
    return this.storage.get(key) || [];
  }
}