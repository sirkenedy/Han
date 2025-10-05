/**
 * Live Contract Testing Decorator
 * Automatically validates responses against OpenAPI schemas
 */

import { OPENAPI_METADATA_KEYS } from "../constants";
import { ApiContractTestingOptions } from "../interfaces/decorator-options.interface";

/**
 * Enable live contract testing for an endpoint
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @ApiContractTesting({ enabled: true })
 *   @ApiOkResponse({ type: UserDto, isArray: true })
 *   findAll() {
 *     return this.userService.findAll();
 *   }
 * }
 * ```
 *
 * @param options - Contract testing configuration options
 */
export function ApiContractTesting(
  options: ApiContractTestingOptions = {},
): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const defaults: ApiContractTestingOptions = {
      enabled: process.env.NODE_ENV !== "production",
      strict: false,
      continueOnViolation: true,
      ...options,
    };

    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_CONTRACT_TESTING,
      defaults,
      target.constructor,
      propertyKey,
    );

    return descriptor;
  };
}

/**
 * Get contract testing metadata from a method
 */
export function getContractTestingMetadata(
  target: any,
  propertyKey: string | symbol,
): ApiContractTestingOptions | undefined {
  return Reflect.getMetadata(
    OPENAPI_METADATA_KEYS.API_CONTRACT_TESTING,
    target.constructor,
    propertyKey,
  );
}
