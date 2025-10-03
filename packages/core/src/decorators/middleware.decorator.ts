export function UseMiddleware(...middleware: any[]): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    const existingMiddleware =
      Reflect.getMetadata("middleware", target, propertyKey) || [];
    Reflect.defineMetadata(
      "middleware",
      [...existingMiddleware, ...middleware],
      target,
      propertyKey,
    );
  };
}
