import "reflect-metadata";
import { ApiOperationOptions } from "../interfaces/decorator-options.interface";
import { OPENAPI_METADATA_KEYS } from "../constants";

/**
 * Decorator to define operation-level metadata
 *
 * @example
 * ```typescript
 * @Controller('users')
 * class UserController {
 *   @Get()
 *   @ApiOperation({ summary: 'Get all users', description: 'Returns a list of all users' })
 *   findAll() {
 *     return [];
 *   }
 * }
 * ```
 */
export function ApiOperation(options: ApiOperationOptions): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_OPERATION,
      options,
      descriptor.value,
    );
    return descriptor;
  };
}

/**
 * Decorator to mark an endpoint as deprecated
 */
export function ApiDeprecated(): MethodDecorator {
  return ApiOperation({ deprecated: true });
}

/**
 * Decorator to exclude an endpoint from OpenAPI documentation
 */
export function ApiExcludeEndpoint(): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_EXCLUDE,
      true,
      descriptor.value,
    );
    return descriptor;
  };
}
