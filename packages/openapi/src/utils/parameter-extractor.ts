import "reflect-metadata";

/**
 * Utility to extract parameter information from methods
 */
export class ParameterExtractor {
  /**
   * Get parameter types from a method using TypeScript design:paramtypes metadata
   */
  static getParameterTypes(target: any, propertyKey: string): any[] {
    const types = Reflect.getMetadata("design:paramtypes", target, propertyKey);
    return types || [];
  }

  /**
   * Get parameter decorators metadata
   * This returns information about which parameter has which decorator
   */
  static getParameterDecorators(target: any, propertyKey: string): any[][] {
    const decorators = Reflect.getMetadata(
      "design:paramdecorators",
      target,
      propertyKey,
    );
    return decorators || [];
  }

  /**
   * Find the parameter index that has @Body() decorator
   * Returns -1 if not found
   */
  static findBodyParameterIndex(target: any, propertyKey: string): number {
    // Check for Han's Body decorator metadata
    const bodyMetadata = Reflect.getMetadata("body:index", target, propertyKey);
    if (bodyMetadata !== undefined) {
      return bodyMetadata;
    }

    // Fallback: try to find from parameter metadata
    const paramTypes = this.getParameterTypes(target, propertyKey);
    const paramMetadata =
      Reflect.getMetadata("param:metadata", target, propertyKey) || [];

    for (let i = 0; i < paramMetadata.length; i++) {
      const meta = paramMetadata[i];
      if (meta && meta.type === "body") {
        return i;
      }
    }

    return -1;
  }

  /**
   * Get the type of the @Body() parameter
   */
  static getBodyParameterType(target: any, propertyKey: string): any | null {
    const bodyIndex = this.findBodyParameterIndex(target, propertyKey);
    if (bodyIndex === -1) {
      return null;
    }

    const paramTypes = this.getParameterTypes(target, propertyKey);
    if (bodyIndex < paramTypes.length) {
      return paramTypes[bodyIndex];
    }

    return null;
  }

  /**
   * Check if a parameter type is a DTO (class with @ApiProperty decorators)
   */
  static isDtoClass(type: any): boolean {
    if (!type || typeof type !== "function") {
      return false;
    }

    // Check if it has any @ApiProperty metadata
    const properties = Reflect.getMetadata("openapi:property", type);
    return properties !== undefined && Object.keys(properties).length > 0;
  }

  /**
   * Check if a type is a primitive type
   */
  static isPrimitive(type: any): boolean {
    return (
      type === String ||
      type === Number ||
      type === Boolean ||
      type === Date ||
      type === Object ||
      type === Array
    );
  }
}
