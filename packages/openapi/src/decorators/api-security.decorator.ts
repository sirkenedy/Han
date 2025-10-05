import "reflect-metadata";
import {
  ApiSecurityOptions,
  ApiBearerAuthOptions,
  ApiBasicAuthOptions,
  ApiOAuth2Options,
  ApiApiKeyOptions,
} from "../interfaces/decorator-options.interface";
import { OPENAPI_METADATA_KEYS } from "../constants";

/**
 * Generic security decorator
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiSecurity('bearer')
 * findAll() {
 *   return users;
 * }
 * ```
 */
export function ApiSecurity(
  name: string,
  scopes: string[] = [],
): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      // Method decorator
      const existingSecurity =
        Reflect.getMetadata(
          OPENAPI_METADATA_KEYS.API_SECURITY,
          descriptor.value,
        ) || [];

      existingSecurity.push({ name, scopes });

      Reflect.defineMetadata(
        OPENAPI_METADATA_KEYS.API_SECURITY,
        existingSecurity,
        descriptor.value,
      );

      return descriptor;
    } else {
      // Class decorator
      const existingSecurity =
        Reflect.getMetadata(OPENAPI_METADATA_KEYS.API_SECURITY, target) || [];

      existingSecurity.push({ name, scopes });

      Reflect.defineMetadata(
        OPENAPI_METADATA_KEYS.API_SECURITY,
        existingSecurity,
        target,
      );

      return target;
    }
  };
}

/**
 * Bearer token authentication decorator
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiBearerAuth()
 * findAll() {
 *   return users;
 * }
 * ```
 */
export function ApiBearerAuth(
  name: string = "bearer",
): MethodDecorator & ClassDecorator {
  return ApiSecurity(name);
}

/**
 * Basic authentication decorator
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiBasicAuth()
 * findAll() {
 *   return users;
 * }
 * ```
 */
export function ApiBasicAuth(
  name: string = "basic",
): MethodDecorator & ClassDecorator {
  return ApiSecurity(name);
}

/**
 * OAuth2 authentication decorator
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiOAuth2(['read:users', 'write:users'])
 * findAll() {
 *   return users;
 * }
 * ```
 */
export function ApiOAuth2(
  scopes: string[] = [],
  name: string = "oauth2",
): MethodDecorator & ClassDecorator {
  return ApiSecurity(name, scopes);
}

/**
 * API Key authentication decorator
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiApiKey()
 * findAll() {
 *   return users;
 * }
 * ```
 */
export function ApiApiKey(
  name: string = "api-key",
): MethodDecorator & ClassDecorator {
  return ApiSecurity(name);
}

/**
 * Cookie authentication decorator
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiCookieAuth()
 * findAll() {
 *   return users;
 * }
 * ```
 */
export function ApiCookieAuth(
  name: string = "cookie",
): MethodDecorator & ClassDecorator {
  return ApiSecurity(name);
}
