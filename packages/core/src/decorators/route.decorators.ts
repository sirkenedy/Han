import { MetadataStorage, RouteMetadata } from "./metadata";

function createRouteDecorator(method: RouteMetadata["method"]) {
  return function (path: string = "", middleware: any[] = []): MethodDecorator {
    return function (
      target: any,
      propertyKey: string | symbol,
      descriptor?: PropertyDescriptor,
    ) {
      const route: RouteMetadata = {
        method,
        path,
        methodName: propertyKey as string,
        middleware,
      };
      MetadataStorage.addRoute(target, route);
      return descriptor;
    };
  };
}

export const Get = createRouteDecorator("get");
export const Post = createRouteDecorator("post");
export const Put = createRouteDecorator("put");
export const Delete = createRouteDecorator("delete");
export const Patch = createRouteDecorator("patch");
