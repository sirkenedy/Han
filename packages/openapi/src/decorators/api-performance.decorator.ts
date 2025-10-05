/**
 * Performance Budget Decorator
 * Sets performance expectations and tracks response times
 */

import { OPENAPI_METADATA_KEYS } from "../constants";
import { ApiPerformanceOptions } from "../interfaces/decorator-options.interface";

/**
 * Set performance budget for an endpoint
 *
 * @example
 * ```typescript
 * @Controller('products')
 * export class ProductController {
 *   @Get()
 *   @ApiPerformance({
 *     budget: 200,
 *     p95: 500,
 *     warnOnExceed: true
 *   })
 *   @ApiOkResponse({ type: ProductDto, isArray: true })
 *   findAll() {
 *     return this.productService.findAll();
 *   }
 * }
 * ```
 *
 * @param options - Performance budget configuration options
 */
export function ApiPerformance(
  options: ApiPerformanceOptions,
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const defaults: ApiPerformanceOptions = {
      warnOnExceed: process.env.NODE_ENV !== "production",
      failOnExceed: false,
      detailed: false,
      ...options,
    };

    // Validate budget is provided
    if (!defaults.budget) {
      throw new Error(
        '@ApiPerformance requires a "budget" option (in milliseconds)',
      );
    }

    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_PERFORMANCE,
      defaults,
      target.constructor,
      propertyKey,
    );

    return descriptor;
  };
}

/**
 * Get performance metadata from a method
 */
export function getPerformanceMetadata(
  target: any,
  propertyKey: string | symbol,
): ApiPerformanceOptions | undefined {
  return Reflect.getMetadata(
    OPENAPI_METADATA_KEYS.API_PERFORMANCE,
    target.constructor,
    propertyKey,
  );
}

/**
 * Convenience decorators for common performance budgets
 */

/**
 * Sets a fast performance budget (100ms target, 200ms p95)
 */
export function ApiFastEndpoint(): MethodDecorator {
  return ApiPerformance({ budget: 100, p95: 200, warnOnExceed: true });
}

/**
 * Sets a standard performance budget (200ms target, 500ms p95)
 */
export function ApiStandardEndpoint(): MethodDecorator {
  return ApiPerformance({ budget: 200, p95: 500, warnOnExceed: true });
}

/**
 * Sets a slow performance budget (1000ms target, 2000ms p95)
 */
export function ApiSlowEndpoint(): MethodDecorator {
  return ApiPerformance({ budget: 1000, p95: 2000, warnOnExceed: true });
}
