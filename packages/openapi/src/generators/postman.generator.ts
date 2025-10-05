/**
 * Postman Collection Generator
 * Generates Postman collections from OpenAPI specifications
 */

import {
  OpenAPIDocument,
  OpenAPIPaths,
  OpenAPISchema,
} from "../interfaces/openapi.interface";
import {
  PostmanCollection,
  PostmanItem,
  PostmanRequest,
  PostmanUrl,
  PostmanBody,
  PostmanAuth,
  PostmanVariable,
  PostmanEvent,
  PostmanGeneratorConfig,
} from "../interfaces/developer-experience.interface";

const DEFAULT_CONFIG: Required<PostmanGeneratorConfig> = {
  enabled: true,
  includeExamples: true,
  includeTests: true,
  includeAuth: true,
  baseUrl: "{{baseUrl}}",
  environmentVariables: {},
};

/**
 * Postman Collection Generator
 */
export class PostmanGenerator {
  private config: Required<PostmanGeneratorConfig>;

  constructor(config: Partial<PostmanGeneratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate Postman collection from OpenAPI document
   */
  generateCollection(document: OpenAPIDocument): PostmanCollection {
    const collection: PostmanCollection = {
      info: {
        name: document.info.title,
        description: document.info.description,
        version: document.info.version,
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      item: [],
    };

    // Add authentication if configured
    if (this.config.includeAuth && document.components?.securitySchemes) {
      collection.auth = this.generateAuth(document.components.securitySchemes);
    }

    // Add environment variables
    if (Object.keys(this.config.environmentVariables).length > 0) {
      collection.variable = this.generateVariables(
        this.config.environmentVariables,
      );
    }

    // Generate items from paths
    if (document.paths) {
      collection.item = this.generateItems(document.paths, document);
    }

    return collection;
  }

  /**
   * Generate Postman items from OpenAPI paths
   */
  private generateItems(
    paths: OpenAPIPaths,
    document: OpenAPIDocument,
  ): PostmanItem[] {
    const items: PostmanItem[] = [];

    for (const [path, pathItem] of Object.entries(paths)) {
      const methods = [
        "get",
        "post",
        "put",
        "patch",
        "delete",
        "options",
        "head",
      ];

      for (const method of methods) {
        const operation = (pathItem as any)[method];
        if (!operation) continue;

        const item = this.generateItem(
          path,
          method.toUpperCase(),
          operation,
          document,
        );
        items.push(item);
      }
    }

    // Group by tags
    return this.groupItemsByTags(items);
  }

  /**
   * Generate a single Postman item
   */
  private generateItem(
    path: string,
    method: string,
    operation: any,
    document: OpenAPIDocument,
  ): PostmanItem {
    const item: PostmanItem = {
      name: operation.summary || `${method} ${path}`,
      description: operation.description,
      request: this.generateRequest(path, method, operation, document),
    };

    // Add test events if configured
    if (this.config.includeTests) {
      item.event = this.generateTestEvents(operation);
    }

    // Add example responses if configured
    if (this.config.includeExamples && operation.responses) {
      item.response = this.generateExampleResponses(
        path,
        method,
        operation,
        document,
      );
    }

    return item;
  }

  /**
   * Generate Postman request
   */
  private generateRequest(
    path: string,
    method: string,
    operation: any,
    document: OpenAPIDocument,
  ): PostmanRequest {
    const request: PostmanRequest = {
      method,
      url: this.generateUrl(path, operation),
      description: operation.description,
    };

    // Add headers
    const headers = this.generateHeaders(operation);
    if (headers.length > 0) {
      request.header = headers;
    }

    // Add request body
    if (operation.requestBody) {
      request.body = this.generateBody(operation.requestBody);
    }

    return request;
  }

  /**
   * Generate Postman URL
   */
  private generateUrl(path: string, operation: any): PostmanUrl {
    const url: PostmanUrl = {
      raw: `${this.config.baseUrl}${path}`,
      protocol: "http",
      host: ["{{baseUrl}}"],
      path: path.split("/").filter(Boolean),
    };

    // Add query parameters
    if (operation.parameters) {
      const queryParams = operation.parameters.filter(
        (p: any) => p.in === "query",
      );
      if (queryParams.length > 0) {
        url.query = queryParams.map((p: any) => ({
          key: p.name,
          value: this.getExampleValue(p.schema) || "",
          disabled: !p.required,
        }));
      }

      // Add path variables
      const pathParams = operation.parameters.filter(
        (p: any) => p.in === "path",
      );
      if (pathParams.length > 0) {
        url.variable = pathParams.map((p: any) => ({
          key: p.name,
          value: this.getExampleValue(p.schema) || "",
          description: p.description,
        }));
      }
    }

    return url;
  }

  /**
   * Generate request headers
   */
  private generateHeaders(operation: any): any[] {
    const headers: any[] = [];

    if (operation.parameters) {
      const headerParams = operation.parameters.filter(
        (p: any) => p.in === "header",
      );

      for (const param of headerParams) {
        headers.push({
          key: param.name,
          value: this.getExampleValue(param.schema) || "",
          description: param.description,
          disabled: !param.required,
        });
      }
    }

    return headers;
  }

  /**
   * Generate request body
   */
  private generateBody(requestBody: any): PostmanBody | undefined {
    const content = requestBody.content;
    if (!content) return undefined;

    // Prefer JSON format
    if (content["application/json"]) {
      const schema = content["application/json"].schema;
      const example = this.generateSchemaExample(schema);

      return {
        mode: "raw",
        raw: JSON.stringify(example, null, 2),
        options: {
          raw: {
            language: "json",
          },
        },
      };
    }

    // Form data
    if (content["application/x-www-form-urlencoded"]) {
      const schema = content["application/x-www-form-urlencoded"].schema;
      const formData = this.generateFormData(schema);

      return {
        mode: "urlencoded",
        urlencoded: formData,
      };
    }

    // Multipart form data
    if (content["multipart/form-data"]) {
      const schema = content["multipart/form-data"].schema;
      const formData = this.generateFormData(schema);

      return {
        mode: "formdata",
        formdata: formData,
      };
    }

    return undefined;
  }

  /**
   * Generate form data from schema
   */
  private generateFormData(schema: OpenAPISchema): Array<{
    key: string;
    value: string;
    type?: string;
  }> {
    const formData: Array<{ key: string; value: string; type?: string }> = [];

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const value = this.getExampleValue(propSchema as OpenAPISchema);
        formData.push({
          key,
          value: String(value || ""),
          type: "text",
        });
      }
    }

    return formData;
  }

  /**
   * Generate test events
   */
  private generateTestEvents(operation: any): PostmanEvent[] {
    const events: PostmanEvent[] = [];

    // Generate basic status code tests
    const tests: string[] = [];

    if (operation.responses) {
      const successStatuses = Object.keys(operation.responses).filter((s) =>
        s.startsWith("2"),
      );

      if (successStatuses.length > 0) {
        tests.push(
          `pm.test("Status code is ${successStatuses[0]}", function () {`,
          `  pm.response.to.have.status(${successStatuses[0]});`,
          `});`,
          ``,
        );
      }

      // Add response time test
      tests.push(
        `pm.test("Response time is less than 500ms", function () {`,
        `  pm.expect(pm.response.responseTime).to.be.below(500);`,
        `});`,
        ``,
      );

      // Add JSON validation for JSON responses
      const jsonResponse =
        operation.responses["200"]?.content?.["application/json"];
      if (jsonResponse) {
        tests.push(
          `pm.test("Response is JSON", function () {`,
          `  pm.response.to.be.json;`,
          `});`,
          ``,
        );
      }
    }

    if (tests.length > 0) {
      events.push({
        listen: "test",
        script: {
          type: "text/javascript",
          exec: tests,
        },
      });
    }

    return events;
  }

  /**
   * Generate example responses
   */
  private generateExampleResponses(
    path: string,
    method: string,
    operation: any,
    document: OpenAPIDocument,
  ): any[] {
    const responses: any[] = [];

    if (operation.responses) {
      for (const [statusCode, response] of Object.entries(
        operation.responses as Record<string, any>,
      )) {
        const content = response.content?.["application/json"];
        if (content) {
          const example = this.generateSchemaExample(content.schema);

          responses.push({
            name: response.description || `${statusCode} Response`,
            originalRequest: this.generateRequest(
              path,
              method,
              operation,
              document,
            ),
            status: this.getStatusText(parseInt(statusCode, 10)),
            code: parseInt(statusCode, 10),
            header: [
              {
                key: "Content-Type",
                value: "application/json",
              },
            ],
            body: JSON.stringify(example, null, 2),
          });
        }
      }
    }

    return responses;
  }

  /**
   * Generate authentication configuration
   */
  private generateAuth(securitySchemes: any): PostmanAuth | undefined {
    // Find the first security scheme
    const schemes = Object.values(securitySchemes);
    if (schemes.length === 0) return undefined;

    const scheme = schemes[0] as any;

    switch (scheme.type) {
      case "http":
        if (scheme.scheme === "bearer") {
          return {
            type: "bearer",
            bearer: [
              {
                key: "token",
                value: "{{bearerToken}}",
                type: "string",
              },
            ],
          };
        } else if (scheme.scheme === "basic") {
          return {
            type: "basic",
            basic: [
              { key: "username", value: "{{username}}", type: "string" },
              { key: "password", value: "{{password}}", type: "string" },
            ],
          };
        }
        break;

      case "apiKey":
        return {
          type: "apikey",
          apikey: [
            { key: "key", value: scheme.name, type: "string" },
            { key: "value", value: "{{apiKey}}", type: "string" },
            { key: "in", value: scheme.in, type: "string" },
          ],
        };

      case "oauth2":
        return {
          type: "oauth2",
        };
    }

    return undefined;
  }

  /**
   * Generate environment variables
   */
  private generateVariables(vars: Record<string, string>): PostmanVariable[] {
    return Object.entries(vars).map(([key, value]) => ({
      key,
      value,
      type: "string",
    }));
  }

  /**
   * Generate example from schema
   */
  private generateSchemaExample(schema: OpenAPISchema): any {
    if (schema.example !== undefined) {
      return schema.example;
    }

    if (schema.type === "object" && schema.properties) {
      const example: any = {};
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        example[key] = this.generateSchemaExample(propSchema as OpenAPISchema);
      }
      return example;
    }

    if (schema.type === "array" && schema.items) {
      return [this.generateSchemaExample(schema.items as OpenAPISchema)];
    }

    return this.getExampleValue(schema);
  }

  /**
   * Get example value for a schema
   */
  private getExampleValue(schema: OpenAPISchema): any {
    if (schema.example !== undefined) return schema.example;
    if (schema.default !== undefined) return schema.default;

    switch (schema.type) {
      case "string":
        if (schema.format === "email") return "user@example.com";
        if (schema.format === "date") return "2024-01-01";
        if (schema.format === "date-time") return "2024-01-01T00:00:00.000Z";
        if (schema.format === "uuid")
          return "123e4567-e89b-12d3-a456-426614174000";
        if (schema.enum) return schema.enum[0];
        return "string";

      case "number":
      case "integer":
        return schema.minimum || 0;

      case "boolean":
        return true;

      case "array":
        return [];

      case "object":
        return {};

      default:
        return null;
    }
  }

  /**
   * Get HTTP status text
   */
  private getStatusText(code: number): string {
    const statusTexts: Record<number, string> = {
      200: "OK",
      201: "Created",
      204: "No Content",
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      500: "Internal Server Error",
    };

    return statusTexts[code] || "Unknown";
  }

  /**
   * Group items by tags
   */
  private groupItemsByTags(items: PostmanItem[]): PostmanItem[] {
    // For now, return items as-is
    // Future enhancement: create folders for each tag
    return items;
  }

  /**
   * Export collection as JSON string
   */
  exportAsJson(collection: PostmanCollection): string {
    return JSON.stringify(collection, null, 2);
  }

  /**
   * Download collection as file
   */
  downloadCollection(collection: PostmanCollection, filename?: string): void {
    const json = this.exportAsJson(collection);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      filename || `${collection.info.name}.postman_collection.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
