/**
 * Example Harvester Decorator
 * Automatically captures real request/response examples from development traffic
 */

import { OPENAPI_METADATA_KEYS } from "../constants";
import { ApiHarvestExamplesOptions } from "../interfaces/decorator-options.interface";

/**
 * Enable automatic example harvesting for an endpoint
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @ApiHarvestExamples({ enabled: true, sampling: 0.1 })
 *   @ApiOkResponse({ type: UserDto, isArray: true })
 *   findAll() {
 *     return this.userService.findAll();
 *   }
 * }
 * ```
 *
 * @param options - Example harvesting configuration options
 */
export function ApiHarvestExamples(
  options: ApiHarvestExamplesOptions = {},
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const defaults: ApiHarvestExamplesOptions = {
      enabled: process.env.NODE_ENV !== "production",
      async: true,
      sampling: 1.0, // 100% in development
      maxExamplesPerEndpoint: 10,
      autoSave: false, // Requires manual approval by default
      ...options,
    };

    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_HARVEST_EXAMPLES,
      defaults,
      target.constructor,
      propertyKey,
    );

    return descriptor;
  };
}

/**
 * Get example harvesting metadata from a method
 */
export function getHarvestExamplesMetadata(
  target: any,
  propertyKey: string | symbol,
): ApiHarvestExamplesOptions | undefined {
  return Reflect.getMetadata(
    OPENAPI_METADATA_KEYS.API_HARVEST_EXAMPLES,
    target.constructor,
    propertyKey,
  );
}
