import "reflect-metadata";
import { ApiTagOptions } from "../interfaces/decorator-options.interface";
import { OPENAPI_METADATA_KEYS } from "../constants";

/**
 * Decorator to assign tags to operations or controllers
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @ApiTags('Users')
 * class UserController {
 *   // All methods will have 'Users' tag
 * }
 * ```
 */
export function ApiTags(...tags: string[]): MethodDecorator & ClassDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor,
  ) => {
    if (descriptor) {
      // Method decorator
      Reflect.defineMetadata(
        OPENAPI_METADATA_KEYS.API_TAGS,
        tags,
        descriptor.value,
      );
      return descriptor;
    } else {
      // Class decorator
      Reflect.defineMetadata(OPENAPI_METADATA_KEYS.API_TAGS, tags, target);
      return target;
    }
  };
}

/**
 * Decorator to add extra models to the OpenAPI schema
 * Useful for polymorphic types or models not directly referenced
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @ApiExtraModels(AdminUserDto, GuestUserDto)
 * class UserController {
 *   // AdminUserDto and GuestUserDto will be included in schemas
 * }
 * ```
 */
export function ApiExtraModels(...models: any[]): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_EXTRA_MODELS,
      models,
      target,
    );
    return target;
  };
}
