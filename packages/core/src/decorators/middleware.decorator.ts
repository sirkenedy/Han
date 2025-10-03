/**
 * Decorator to apply middleware to routes or controllers.
 * Supports:
 * - Function middleware: @UseMiddleware(myFunc)
 * - Class instance: @UseMiddleware(new LoggerMiddleware())
 * - Class reference: @UseMiddleware(LoggerMiddleware) - auto-instantiated
 *
 * @param middleware - Array of middleware (functions, instances, or class constructors)
 */
export function UseMiddleware(
  ...middleware: any[]
): MethodDecorator & ClassDecorator {
  return function (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) {
    if (propertyKey) {
      // Method decorator (route-level)
      const existingMiddleware =
        Reflect.getMetadata("middleware", target, propertyKey) || [];
      Reflect.defineMetadata(
        "middleware",
        [...existingMiddleware, ...middleware],
        target,
        propertyKey,
      );
    } else {
      // Class decorator (controller-level)
      const existingMiddleware =
        Reflect.getMetadata("controller:middleware", target.prototype) || [];
      Reflect.defineMetadata(
        "controller:middleware",
        [...existingMiddleware, ...middleware],
        target.prototype,
      );
    }
  };
}
