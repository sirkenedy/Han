import {
  OpenAPISchema,
  OpenAPIResponse,
  OpenAPIParameter,
  OpenAPISecurityRequirement,
} from "./openapi.interface";
import {
  ContractTestingOptions,
  ExampleHarvesterOptions,
  PerformanceBudgetOptions,
} from "./telemetry.interface";

/**
 * Options for API decorators
 */

export interface ApiPropertyOptions {
  description?: string;
  required?: boolean;
  type?: "string" | "number" | "integer" | "boolean" | "array" | "object";
  format?: string;
  example?: any;
  examples?: Record<string, any>;
  default?: any;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  items?: OpenAPISchema;
  properties?: Record<string, OpenAPISchema>;
  additionalProperties?: boolean | OpenAPISchema;
}

export interface ApiResponseOptions {
  status?: number | "default" | "2XX" | "3XX" | "4XX" | "5XX";
  description: string;
  type?: any;
  isArray?: boolean;
  schema?: OpenAPISchema;
  headers?: Record<string, any>;
  content?: Record<string, any>;
}

export interface ApiOperationOptions {
  summary?: string;
  description?: string;
  operationId?: string;
  deprecated?: boolean;
  tags?: string[];
}

export interface ApiParamOptions {
  name: string;
  description?: string;
  required?: boolean;
  type?: "string" | "number" | "integer" | "boolean" | "array";
  format?: string;
  example?: any;
  enum?: any[];
  schema?: OpenAPISchema;
}

export interface ApiQueryOptions {
  name: string;
  description?: string;
  required?: boolean;
  type?: "string" | "number" | "integer" | "boolean" | "array";
  format?: string;
  example?: any;
  enum?: any[];
  isArray?: boolean;
  schema?: OpenAPISchema;
}

export interface ApiBodyOptions {
  description?: string;
  required?: boolean;
  type?: any;
  isArray?: boolean;
  schema?: OpenAPISchema;
  examples?: Record<string, any>;
}

export interface ApiHeaderOptions {
  name: string;
  description?: string;
  required?: boolean;
  type?: "string" | "number" | "integer" | "boolean";
  example?: any;
  schema?: OpenAPISchema;
}

export interface ApiSecurityOptions {
  name: string;
  scopes?: string[];
}

export interface ApiBearerAuthOptions {
  name?: string;
  description?: string;
  bearerFormat?: string;
}

export interface ApiBasicAuthOptions {
  name?: string;
  description?: string;
}

export interface ApiOAuth2Options {
  name?: string;
  description?: string;
  flows?: {
    authorizationCode?: {
      authorizationUrl: string;
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
    implicit?: {
      authorizationUrl: string;
      scopes: Record<string, string>;
    };
    password?: {
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
    clientCredentials?: {
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
  };
}

export interface ApiApiKeyOptions {
  name?: string;
  in: "header" | "query" | "cookie";
  description?: string;
  keyName: string;
}

export interface ApiTagOptions {
  name: string;
  description?: string;
  externalDocs?: {
    description?: string;
    url: string;
  };
}

export interface ApiExcludeEndpointOptions {
  disable?: boolean;
}

export interface ApiProducesOptions {
  contentTypes: string[];
}

export interface ApiConsumesOptions {
  contentTypes: string[];
}

export interface ApiExtraModelsOptions {
  models: any[];
}

/**
 * Phase 1 Feature Decorator Options
 */

/**
 * Options for @ApiContractTesting decorator
 * Enables live contract testing for an endpoint
 */
export interface ApiContractTestingOptions extends ContractTestingOptions {
  /** Override global settings for this endpoint */
  override?: boolean;
}

/**
 * Options for @ApiHarvestExamples decorator
 * Enables automatic example harvesting for an endpoint
 */
export interface ApiHarvestExamplesOptions extends ExampleHarvesterOptions {
  /** Category/tag for this example */
  category?: string;
  /** Priority for this example (higher = more likely to be featured) */
  priority?: number;
}

/**
 * Options for @ApiPerformance decorator
 * Sets performance budgets and tracking for an endpoint
 */
export interface ApiPerformanceOptions extends PerformanceBudgetOptions {
  /** Endpoint name for reporting */
  name?: string;
  /** Track detailed performance breakdown */
  detailed?: boolean;
}
