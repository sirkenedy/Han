import "reflect-metadata";
import { ApiPropertyOptions } from "../interfaces/decorator-options.interface";
import { OPENAPI_METADATA_KEYS } from "../constants";

/**
 * Decorator to define OpenAPI property metadata for DTOs
 *
 * @example
 * ```typescript
 * class CreateUserDto {
 *   @ApiProperty({ description: 'User email', example: 'user@example.com' })
 *   email: string;
 *
 *   @ApiProperty({ description: 'User age', minimum: 18, maximum: 100 })
 *   age: number;
 * }
 * ```
 */
export function ApiProperty(
  options: ApiPropertyOptions = {},
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    // Get design type from TypeScript
    const designType = Reflect.getMetadata("design:type", target, propertyKey);

    // Auto-detect type if not specified
    if (!options.type && designType) {
      if (designType === String) options.type = "string";
      else if (designType === Number) options.type = "number";
      else if (designType === Boolean) options.type = "boolean";
      else if (designType === Array) options.type = "array";
      else if (designType === Object) options.type = "object";
    }

    // Get existing properties metadata
    const existingProperties =
      Reflect.getMetadata(
        OPENAPI_METADATA_KEYS.API_PROPERTY,
        target.constructor,
      ) || {};

    // Add new property
    existingProperties[propertyKey] = {
      ...options,
      propertyKey: String(propertyKey),
    };

    // Store updated metadata
    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_PROPERTY,
      existingProperties,
      target.constructor,
    );
  };
}

/**
 * Shorthand for optional property
 */
export function ApiPropertyOptional(
  options: ApiPropertyOptions = {},
): PropertyDecorator {
  return ApiProperty({ ...options, required: false });
}

/**
 * Decorator for array properties
 */
export function ApiPropertyArray(
  options: Omit<ApiPropertyOptions, "type"> & { items?: any } = {},
): PropertyDecorator {
  return ApiProperty({ ...options, type: "array" });
}

/**
 * Decorator for enum properties
 */
export function ApiPropertyEnum(
  enumObject: object,
  options: Omit<ApiPropertyOptions, "enum"> = {},
): PropertyDecorator {
  const enumValues = Object.values(enumObject);
  return ApiProperty({ ...options, enum: enumValues });
}
