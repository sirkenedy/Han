/**
 * Contract validation utilities
 * Validates API responses against declared schemas
 */

import { ContractViolation } from "../interfaces/telemetry.interface";
import { OpenAPISchema } from "../interfaces/openapi.interface";

/**
 * Validate a response against an OpenAPI schema
 */
export function validateResponseAgainstSchema(
  data: any,
  schema: OpenAPISchema,
  method: string,
  path: string,
): ContractViolation[] {
  const violations: ContractViolation[] = [];

  if (!schema) {
    return violations;
  }

  // Validate type
  const actualType = getActualType(data);
  const expectedType = schema.type || "object";

  // Skip validation if no type specified
  if (schema.type && actualType !== expectedType) {
    violations.push({
      method,
      path,
      type: "type_mismatch",
      message: `Response type mismatch. Expected '${expectedType}', got '${actualType}'`,
      expected: expectedType,
      actual: actualType,
      timestamp: new Date(),
      suggestion: `Update the response type or fix the schema declaration`,
    });
  }

  // Validate object properties
  if (expectedType === "object" && schema.properties) {
    const objectViolations = validateObjectProperties(
      data,
      schema,
      method,
      path,
    );
    violations.push(...objectViolations);
  }

  // Validate array items
  if (expectedType === "array" && schema.items) {
    const arrayViolations = validateArrayItems(data, schema, method, path);
    violations.push(...arrayViolations);
  }

  return violations;
}

/**
 * Validate object properties
 */
function validateObjectProperties(
  data: any,
  schema: OpenAPISchema,
  method: string,
  path: string,
): ContractViolation[] {
  const violations: ContractViolation[] = [];

  if (!data || typeof data !== "object") {
    return violations;
  }

  const properties = schema.properties || {};
  const required = schema.required || [];

  // Check for missing required fields
  for (const requiredField of required) {
    if (!(requiredField in data)) {
      violations.push({
        method,
        path,
        type: "missing_field",
        message: `Missing required field: '${requiredField}'`,
        expected: `Field '${requiredField}' should be present`,
        actual: `Field '${requiredField}' is missing`,
        timestamp: new Date(),
        suggestion: `Add the '${requiredField}' field to the response or remove it from required fields`,
      });
    }
  }

  // Check for type mismatches in properties
  for (const [propName, propSchema] of Object.entries(properties)) {
    if (propName in data) {
      const actualType = getActualType(data[propName]);
      const expectedType = (propSchema as OpenAPISchema).type;

      if (expectedType && actualType !== expectedType) {
        // Special case: null values
        if (data[propName] === null) {
          const nullable = (propSchema as OpenAPISchema).nullable;
          if (!nullable) {
            violations.push({
              method,
              path,
              type: "type_mismatch",
              message: `Field '${propName}' is null but not marked as nullable`,
              expected: expectedType,
              actual: "null",
              timestamp: new Date(),
              suggestion: `Either return a non-null value or mark the field as nullable in the schema`,
            });
          }
        } else {
          violations.push({
            method,
            path,
            type: "type_mismatch",
            message: `Field '${propName}' has wrong type. Expected '${expectedType}', got '${actualType}'`,
            expected: expectedType,
            actual: actualType,
            timestamp: new Date(),
            suggestion: `Fix the type of '${propName}' or update the schema`,
          });
        }
      }

      // Recursively validate nested objects
      if (
        expectedType === "object" &&
        (propSchema as OpenAPISchema).properties
      ) {
        const nestedViolations = validateObjectProperties(
          data[propName],
          propSchema as OpenAPISchema,
          method,
          path,
        );
        violations.push(...nestedViolations);
      }
    }
  }

  // Check for unexpected fields (strict mode)
  for (const dataKey of Object.keys(data)) {
    if (!(dataKey in properties) && schema.additionalProperties === false) {
      violations.push({
        method,
        path,
        type: "unexpected_field",
        message: `Unexpected field '${dataKey}' in response`,
        expected: `Only defined properties: ${Object.keys(properties).join(", ")}`,
        actual: `Found unexpected field: '${dataKey}'`,
        timestamp: new Date(),
        suggestion: `Remove the '${dataKey}' field or add it to the schema`,
      });
    }
  }

  return violations;
}

/**
 * Validate array items
 */
function validateArrayItems(
  data: any,
  schema: OpenAPISchema,
  method: string,
  path: string,
): ContractViolation[] {
  const violations: ContractViolation[] = [];

  if (!Array.isArray(data)) {
    return violations;
  }

  const itemSchema = schema.items as OpenAPISchema;
  if (!itemSchema) {
    return violations;
  }

  // Validate each item in the array
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const itemType = getActualType(item);
    const expectedType = itemSchema.type || "object";

    if (itemSchema.type && itemType !== expectedType) {
      violations.push({
        method,
        path,
        type: "type_mismatch",
        message: `Array item at index ${i} has wrong type. Expected '${expectedType}', got '${itemType}'`,
        expected: expectedType,
        actual: itemType,
        timestamp: new Date(),
        suggestion: `Ensure all array items match the declared type`,
      });
    }

    // Recursively validate objects in array
    if (expectedType === "object" && itemSchema.properties) {
      const itemViolations = validateObjectProperties(
        item,
        itemSchema,
        method,
        path,
      );
      violations.push(...itemViolations);
    }
  }

  return violations;
}

/**
 * Get the actual type of a value
 */
function getActualType(value: any): string {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  const type = typeof value;

  if (type === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }

  return type;
}

/**
 * Validate response status code
 */
export function validateResponseStatus(
  actualStatus: number,
  declaredStatuses: number[],
  method: string,
  path: string,
): ContractViolation | null {
  if (declaredStatuses.length === 0) {
    // No statuses declared, skip validation
    return null;
  }

  if (!declaredStatuses.includes(actualStatus)) {
    return {
      method,
      path,
      type: "status_mismatch",
      message: `Response status ${actualStatus} is not documented`,
      expected: `One of: ${declaredStatuses.join(", ")}`,
      actual: actualStatus,
      timestamp: new Date(),
      suggestion: `Add @ApiResponse({ status: ${actualStatus} }) to document this status code`,
    };
  }

  return null;
}

/**
 * Format violations for console output
 */
export function formatViolationsForConsole(
  violations: ContractViolation[],
): string {
  if (violations.length === 0) {
    return "";
  }

  const lines: string[] = [];
  lines.push("\n❌ Contract Violations Detected\n");

  for (const violation of violations) {
    lines.push(`Endpoint: ${violation.method} ${violation.path}`);
    lines.push(`Type: ${violation.type}`);
    lines.push(`Message: ${violation.message}`);
    lines.push(`Expected: ${JSON.stringify(violation.expected)}`);
    lines.push(`Actual: ${JSON.stringify(violation.actual)}`);
    if (violation.suggestion) {
      lines.push(`💡 Suggestion: ${violation.suggestion}`);
    }
    if (violation.location) {
      lines.push(
        `Location: ${violation.location.file}:${violation.location.line}`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}
