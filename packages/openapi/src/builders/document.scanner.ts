import "reflect-metadata";
import {
  OpenAPIDocument,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPISchema,
} from "../interfaces/openapi.interface";
import { DocumentBuilder } from "./document.builder";
import { SchemaGenerator, ParameterExtractor } from "../utils";
import { OPENAPI_METADATA_KEYS, CONTENT_TYPES } from "../constants";

/**
 * Scanner to automatically generate OpenAPI documentation from controllers
 */
export class DocumentScanner {
  private builder: DocumentBuilder;
  private scannedModels = new Set<any>();

  constructor(builder: DocumentBuilder) {
    this.builder = builder;
  }

  /**
   * Scan controllers and build OpenAPI document
   */
  scanControllers(controllers: any[]): OpenAPIDocument {
    const document = this.builder.getDocument();

    if (!document.paths) {
      document.paths = {};
    }

    for (const controller of controllers) {
      this.scanController(controller, document);
    }

    // Add scanned models to components/schemas
    this.addModelsToComponents(document);

    return this.builder.build();
  }

  /**
   * Scan a single controller
   */
  private scanController(
    controllerClass: any,
    document: Partial<OpenAPIDocument>,
  ): void {
    // Get controller metadata
    const controllerPath = Reflect.getMetadata("path", controllerClass) || "";
    const controllerTags =
      Reflect.getMetadata(OPENAPI_METADATA_KEYS.API_TAGS, controllerClass) ||
      [];
    const controllerSecurity =
      Reflect.getMetadata(
        OPENAPI_METADATA_KEYS.API_SECURITY,
        controllerClass,
      ) || [];
    const extraModels =
      Reflect.getMetadata(
        OPENAPI_METADATA_KEYS.API_EXTRA_MODELS,
        controllerClass,
      ) || [];

    // Add extra models
    extraModels.forEach((model: any) => this.scannedModels.add(model));

    // Get all methods
    const prototype = controllerClass.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) => name !== "constructor" && typeof prototype[name] === "function",
    );

    for (const methodName of methodNames) {
      const method = prototype[methodName];

      // Check if excluded
      const isExcluded = Reflect.getMetadata(
        OPENAPI_METADATA_KEYS.API_EXCLUDE,
        method,
      );
      if (isExcluded) continue;

      // Get route metadata
      const routeMetadata = Reflect.getMetadata("route", method);
      if (!routeMetadata) continue;

      const httpMethod = routeMetadata.method.toLowerCase();
      const routePath = routeMetadata.path || "";
      const fullPath = this.normalizePath(`/${controllerPath}/${routePath}`);

      // Initialize path if not exists
      if (!document.paths![fullPath]) {
        document.paths![fullPath] = {};
      }

      // Build operation
      const operation = this.buildOperation(
        method,
        controllerTags,
        controllerSecurity,
      );

      // Add operation to path
      (document.paths![fullPath] as any)[httpMethod] = operation;
    }
  }

  /**
   * Build operation from method metadata
   */
  private buildOperation(
    method: Function,
    controllerTags: string[],
    controllerSecurity: any[],
  ): OpenAPIOperation {
    const operation: Partial<OpenAPIOperation> = {
      responses: {},
    };

    // Get operation metadata
    const operationMeta = Reflect.getMetadata(
      OPENAPI_METADATA_KEYS.API_OPERATION,
      method,
    );
    if (operationMeta) {
      if (operationMeta.summary) operation.summary = operationMeta.summary;
      if (operationMeta.description)
        operation.description = operationMeta.description;
      if (operationMeta.operationId)
        operation.operationId = operationMeta.operationId;
      if (operationMeta.deprecated)
        operation.deprecated = operationMeta.deprecated;
      if (operationMeta.tags) {
        operation.tags = operationMeta.tags;
      }
    }

    // Add controller tags if no method tags
    if (!operation.tags && controllerTags.length > 0) {
      operation.tags = controllerTags;
    }

    // Get parameters (path, query, header)
    operation.parameters = this.buildParameters(method);

    // Get request body
    const requestBody = this.buildRequestBody(method);
    if (requestBody) {
      operation.requestBody = requestBody;
    }

    // Get responses
    operation.responses = this.buildResponses(method);

    // Get security
    const methodSecurity = Reflect.getMetadata(
      OPENAPI_METADATA_KEYS.API_SECURITY,
      method,
    );
    if (methodSecurity && methodSecurity.length > 0) {
      operation.security = methodSecurity.map((sec: any) => ({
        [sec.name]: sec.scopes || [],
      }));
    } else if (controllerSecurity && controllerSecurity.length > 0) {
      operation.security = controllerSecurity.map((sec: any) => ({
        [sec.name]: sec.scopes || [],
      }));
    }

    return operation as OpenAPIOperation;
  }

  /**
   * Build parameters from metadata
   */
  private buildParameters(method: Function): OpenAPIParameter[] {
    const parameters: OpenAPIParameter[] = [];

    // Path parameters
    const pathParams =
      Reflect.getMetadata(OPENAPI_METADATA_KEYS.API_PARAM, method) || [];
    parameters.push(
      ...pathParams.map((param: any) => this.buildParameter(param, "path")),
    );

    // Query parameters
    const queryParams =
      Reflect.getMetadata(OPENAPI_METADATA_KEYS.API_QUERY, method) || [];
    parameters.push(
      ...queryParams.map((param: any) => this.buildParameter(param, "query")),
    );

    // Header parameters
    const headerParams =
      Reflect.getMetadata(OPENAPI_METADATA_KEYS.API_HEADER, method) || [];
    parameters.push(
      ...headerParams.map((param: any) => this.buildParameter(param, "header")),
    );

    return parameters;
  }

  /**
   * Build a single parameter
   */
  private buildParameter(
    paramMeta: any,
    location: "path" | "query" | "header" | "cookie",
  ): OpenAPIParameter {
    const parameter: OpenAPIParameter = {
      name: paramMeta.name,
      in: location,
      required: location === "path" ? true : paramMeta.required || false,
    };

    if (paramMeta.description) parameter.description = paramMeta.description;
    if (paramMeta.deprecated) parameter.deprecated = paramMeta.deprecated;
    if (paramMeta.example !== undefined) parameter.example = paramMeta.example;

    if (paramMeta.schema) {
      parameter.schema = paramMeta.schema;
    } else {
      parameter.schema = {
        type: paramMeta.type || "string",
      };

      if (paramMeta.format) parameter.schema.format = paramMeta.format;
      if (paramMeta.enum) parameter.schema.enum = paramMeta.enum;
    }

    return parameter;
  }

  /**
   * Build request body from metadata
   */
  private buildRequestBody(method: Function): OpenAPIRequestBody | undefined {
    // First, check if there's explicit @ApiBody() metadata
    let bodyMeta = Reflect.getMetadata(OPENAPI_METADATA_KEYS.API_BODY, method);

    // If no @ApiBody(), try to auto-detect from @Body() parameter
    if (!bodyMeta) {
      bodyMeta = this.autoDetectBodyType(method);
      if (!bodyMeta) return undefined;
    }

    const requestBody: OpenAPIRequestBody = {
      required: bodyMeta.required !== false,
      content: {},
    };

    if (bodyMeta.description) {
      requestBody.description = bodyMeta.description;
    }

    // Determine content type
    const contentType = CONTENT_TYPES.JSON;

    // Build schema
    let schema: any;
    if (bodyMeta.schema) {
      schema = bodyMeta.schema;
    } else if (bodyMeta.type) {
      // If it's a class, generate schema and add to models
      if (typeof bodyMeta.type === "function") {
        this.scannedModels.add(bodyMeta.type);
        const schemaName = SchemaGenerator.getSchemaName(bodyMeta.type);

        if (bodyMeta.isArray) {
          schema = {
            type: "array",
            items: { $ref: `#/components/schemas/${schemaName}` },
          };
        } else {
          schema = { $ref: `#/components/schemas/${schemaName}` };
        }
      } else {
        schema = { type: bodyMeta.type };
      }
    }

    requestBody.content[contentType] = {
      schema,
      ...(bodyMeta.examples && { examples: bodyMeta.examples }),
    };

    return requestBody;
  }

  /**
   * Auto-detect body type from @Body() parameter decorator
   */
  private autoDetectBodyType(method: Function): any | null {
    // Try to get parameter types
    const paramTypes = Reflect.getMetadata("design:paramtypes", method);
    if (!paramTypes || paramTypes.length === 0) {
      return null;
    }

    // Look for body parameter metadata (this would be set by @Body() decorator)
    let bodyType = null;

    // Check each parameter to find the one with @Body() decorator
    for (let i = 0; i < paramTypes.length; i++) {
      const paramType = paramTypes[i];

      // Check if this parameter has body metadata
      const paramMeta = Reflect.getMetadata(`param:${i}`, method);
      if (paramMeta && paramMeta.type === "body") {
        bodyType = paramType;
        break;
      }
    }

    // If we found a body parameter and it's a class (not a primitive)
    if (bodyType && !ParameterExtractor.isPrimitive(bodyType)) {
      return {
        type: bodyType,
        required: true,
        description: `Auto-detected from @Body() parameter`,
      };
    }

    return null;
  }

  /**
   * Build responses from metadata
   */
  private buildResponses(method: Function): { [statusCode: string]: any } {
    const responses: any = {};
    const responsesMeta =
      Reflect.getMetadata(OPENAPI_METADATA_KEYS.API_RESPONSES, method) || [];

    if (responsesMeta.length === 0) {
      // Default response
      responses["200"] = {
        description: "Success",
      };
    } else {
      for (const responseMeta of responsesMeta) {
        const status = String(responseMeta.status || 200);
        const response: any = {
          description: responseMeta.description || "Success",
        };

        if (responseMeta.headers) {
          response.headers = responseMeta.headers;
        }

        if (responseMeta.content) {
          response.content = responseMeta.content;
        } else if (responseMeta.type) {
          const contentType = CONTENT_TYPES.JSON;
          response.content = {};

          let schema: any;
          if (responseMeta.schema) {
            schema = responseMeta.schema;
          } else if (typeof responseMeta.type === "function") {
            this.scannedModels.add(responseMeta.type);
            const schemaName = SchemaGenerator.getSchemaName(responseMeta.type);

            if (responseMeta.isArray) {
              schema = {
                type: "array",
                items: { $ref: `#/components/schemas/${schemaName}` },
              };
            } else {
              schema = { $ref: `#/components/schemas/${schemaName}` };
            }
          }

          response.content[contentType] = { schema };
        }

        responses[status] = response;
      }
    }

    return responses;
  }

  /**
   * Add scanned models to components/schemas
   */
  private addModelsToComponents(document: Partial<OpenAPIDocument>): void {
    if (!document.components) {
      document.components = { schemas: {} };
    }

    if (!document.components.schemas) {
      document.components.schemas = {};
    }

    for (const model of this.scannedModels) {
      const schemaName = SchemaGenerator.getSchemaName(model);
      const schema = SchemaGenerator.generateSchemaFromClass(model);
      document.components.schemas[schemaName] = schema;
    }
  }

  /**
   * Normalize path (remove duplicate slashes)
   */
  private normalizePath(path: string): string {
    return path.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  }
}
