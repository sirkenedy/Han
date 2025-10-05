import "reflect-metadata";
import { OpenAPISchema } from "../interfaces/openapi.interface";
import { OPENAPI_METADATA_KEYS } from "../constants";

/**
 * Generate OpenAPI schema from a class or type
 */
export class SchemaGenerator {
  private static schemaCache = new Map<any, OpenAPISchema>();

  /**
   * Generate schema from a class decorated with @ApiProperty
   */
  static generateSchemaFromClass(classRef: any): OpenAPISchema {
    // Check cache first
    if (this.schemaCache.has(classRef)) {
      return this.schemaCache.get(classRef)!;
    }

    const properties =
      Reflect.getMetadata(OPENAPI_METADATA_KEYS.API_PROPERTY, classRef) || {};

    const schema: OpenAPISchema = {
      type: "object",
      properties: {},
      required: [],
    };

    // Process each property
    for (const [propertyName, propertyOptions] of Object.entries(properties)) {
      const options = propertyOptions as any;

      const propertySchema: OpenAPISchema = {
        type: options.type || "string",
      };

      // Add optional fields
      if (options.description) propertySchema.description = options.description;
      if (options.format) propertySchema.format = options.format;
      if (options.example !== undefined)
        propertySchema.example = options.example;
      if (options.default !== undefined)
        propertySchema.default = options.default;
      if (options.enum) propertySchema.enum = options.enum;
      if (options.minimum !== undefined)
        propertySchema.minimum = options.minimum;
      if (options.maximum !== undefined)
        propertySchema.maximum = options.maximum;
      if (options.minLength !== undefined)
        propertySchema.minLength = options.minLength;
      if (options.maxLength !== undefined)
        propertySchema.maxLength = options.maxLength;
      if (options.pattern) propertySchema.pattern = options.pattern;
      if (options.nullable) propertySchema.nullable = options.nullable;
      if (options.readOnly) propertySchema.readOnly = options.readOnly;
      if (options.writeOnly) propertySchema.writeOnly = options.writeOnly;
      if (options.deprecated) propertySchema.deprecated = options.deprecated;

      // Handle arrays
      if (options.type === "array" && options.items) {
        propertySchema.items = this.resolveSchemaOrRef(options.items);
      }

      // Handle nested objects
      if (options.type === "object" && options.properties) {
        propertySchema.properties = options.properties;
      }

      if (options.additionalProperties !== undefined) {
        propertySchema.additionalProperties = options.additionalProperties;
      }

      schema.properties![propertyName] = propertySchema;

      // Track required fields
      if (options.required !== false) {
        schema.required!.push(propertyName);
      }
    }

    // Remove required array if empty
    if (schema.required && schema.required.length === 0) {
      delete schema.required;
    }

    // Cache the schema
    this.schemaCache.set(classRef, schema);

    return schema;
  }

  /**
   * Resolve schema or create reference
   */
  private static resolveSchemaOrRef(
    value: any,
  ): OpenAPISchema | { $ref: string } {
    if (typeof value === "function") {
      // It's a class reference
      const className = value.name;
      return { $ref: `#/components/schemas/${className}` };
    } else if (typeof value === "object" && value !== null) {
      // It's already a schema object
      return value;
    } else {
      // Default to string
      return { type: "string" };
    }
  }

  /**
   * Clear schema cache
   */
  static clearCache(): void {
    this.schemaCache.clear();
  }

  /**
   * Get schema name from class
   */
  static getSchemaName(classRef: any): string {
    return classRef.name || "UnknownSchema";
  }

  /**
   * Generate schema for array of items
   */
  static generateArraySchema(
    itemType: any,
    isArray: boolean = false,
  ): OpenAPISchema {
    if (!isArray) {
      return this.resolveSchemaOrRef(itemType) as OpenAPISchema;
    }

    return {
      type: "array",
      items: this.resolveSchemaOrRef(itemType),
    };
  }

  /**
   * Generate schema for primitive types
   */
  static generatePrimitiveSchema(type: string, format?: string): OpenAPISchema {
    const schema: OpenAPISchema = { type: type as any };
    if (format) {
      schema.format = format;
    }
    return schema;
  }
}
