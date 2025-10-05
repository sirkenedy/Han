/**
 * OpenAPI Specification interfaces
 * Based on OpenAPI 3.0.3 specification
 */

export interface OpenAPIDocument {
  openapi: string;
  info: OpenAPIInfo;
  servers?: OpenAPIServer[];
  paths: OpenAPIPaths;
  components?: OpenAPIComponents;
  security?: OpenAPISecurityRequirement[];
  tags?: OpenAPITag[];
  externalDocs?: OpenAPIExternalDocs;
}

export interface OpenAPIInfo {
  title: string;
  description?: string;
  termsOfService?: string;
  contact?: OpenAPIContact;
  license?: OpenAPILicense;
  version: string;
}

export interface OpenAPIContact {
  name?: string;
  url?: string;
  email?: string;
}

export interface OpenAPILicense {
  name: string;
  url?: string;
}

export interface OpenAPIServer {
  url: string;
  description?: string;
  variables?: Record<string, OpenAPIServerVariable>;
}

export interface OpenAPIServerVariable {
  enum?: string[];
  default: string;
  description?: string;
}

export interface OpenAPIPaths {
  [path: string]: OpenAPIPathItem;
}

export interface OpenAPIPathItem {
  summary?: string;
  description?: string;
  get?: OpenAPIOperation;
  put?: OpenAPIOperation;
  post?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  options?: OpenAPIOperation;
  head?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  trace?: OpenAPIOperation;
  servers?: OpenAPIServer[];
  parameters?: (OpenAPIParameter | OpenAPIReference)[];
}

export interface OpenAPIOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  externalDocs?: OpenAPIExternalDocs;
  operationId?: string;
  parameters?: (OpenAPIParameter | OpenAPIReference)[];
  requestBody?: OpenAPIRequestBody | OpenAPIReference;
  responses: OpenAPIResponses;
  callbacks?: Record<string, OpenAPICallback | OpenAPIReference>;
  deprecated?: boolean;
  security?: OpenAPISecurityRequirement[];
  servers?: OpenAPIServer[];
}

export interface OpenAPIParameter {
  name: string;
  in: "query" | "header" | "path" | "cookie";
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  schema?: OpenAPISchema | OpenAPIReference;
  example?: any;
  examples?: Record<string, OpenAPIExample | OpenAPIReference>;
}

export interface OpenAPIRequestBody {
  description?: string;
  content: Record<string, OpenAPIMediaType>;
  required?: boolean;
}

export interface OpenAPIMediaType {
  schema?: OpenAPISchema | OpenAPIReference;
  example?: any;
  examples?: Record<string, OpenAPIExample | OpenAPIReference>;
  encoding?: Record<string, OpenAPIEncoding>;
}

export interface OpenAPIEncoding {
  contentType?: string;
  headers?: Record<string, OpenAPIHeader | OpenAPIReference>;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface OpenAPIResponses {
  [statusCode: string]: OpenAPIResponse | OpenAPIReference;
}

export interface OpenAPIResponse {
  description: string;
  headers?: Record<string, OpenAPIHeader | OpenAPIReference>;
  content?: Record<string, OpenAPIMediaType>;
  links?: Record<string, OpenAPILink | OpenAPIReference>;
}

export interface OpenAPICallback {
  [expression: string]: OpenAPIPathItem;
}

export interface OpenAPIExample {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface OpenAPILink {
  operationRef?: string;
  operationId?: string;
  parameters?: Record<string, any>;
  requestBody?: any;
  description?: string;
  server?: OpenAPIServer;
}

export interface OpenAPIHeader {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  schema?: OpenAPISchema | OpenAPIReference;
  example?: any;
  examples?: Record<string, OpenAPIExample | OpenAPIReference>;
}

export interface OpenAPITag {
  name: string;
  description?: string;
  externalDocs?: OpenAPIExternalDocs;
}

export interface OpenAPIReference {
  $ref: string;
}

export interface OpenAPISchema {
  type?: "string" | "number" | "integer" | "boolean" | "array" | "object";
  format?: string;
  title?: string;
  description?: string;
  default?: any;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[];
  enum?: any[];
  properties?: Record<string, OpenAPISchema | OpenAPIReference>;
  additionalProperties?: boolean | OpenAPISchema | OpenAPIReference;
  items?: OpenAPISchema | OpenAPIReference;
  allOf?: (OpenAPISchema | OpenAPIReference)[];
  oneOf?: (OpenAPISchema | OpenAPIReference)[];
  anyOf?: (OpenAPISchema | OpenAPIReference)[];
  not?: OpenAPISchema | OpenAPIReference;
  nullable?: boolean;
  discriminator?: OpenAPIDiscriminator;
  readOnly?: boolean;
  writeOnly?: boolean;
  xml?: OpenAPIXML;
  externalDocs?: OpenAPIExternalDocs;
  example?: any;
  deprecated?: boolean;
}

export interface OpenAPIDiscriminator {
  propertyName: string;
  mapping?: Record<string, string>;
}

export interface OpenAPIXML {
  name?: string;
  namespace?: string;
  prefix?: string;
  attribute?: boolean;
  wrapped?: boolean;
}

export interface OpenAPIExternalDocs {
  description?: string;
  url: string;
}

export interface OpenAPIComponents {
  schemas?: Record<string, OpenAPISchema | OpenAPIReference>;
  responses?: Record<string, OpenAPIResponse | OpenAPIReference>;
  parameters?: Record<string, OpenAPIParameter | OpenAPIReference>;
  examples?: Record<string, OpenAPIExample | OpenAPIReference>;
  requestBodies?: Record<string, OpenAPIRequestBody | OpenAPIReference>;
  headers?: Record<string, OpenAPIHeader | OpenAPIReference>;
  securitySchemes?: Record<string, OpenAPISecurityScheme | OpenAPIReference>;
  links?: Record<string, OpenAPILink | OpenAPIReference>;
  callbacks?: Record<string, OpenAPICallback | OpenAPIReference>;
}

export interface OpenAPISecurityScheme {
  type: "apiKey" | "http" | "oauth2" | "openIdConnect";
  description?: string;
  name?: string;
  in?: "query" | "header" | "cookie";
  scheme?: string;
  bearerFormat?: string;
  flows?: OpenAPIOAuthFlows;
  openIdConnectUrl?: string;
}

export interface OpenAPIOAuthFlows {
  implicit?: OpenAPIOAuthFlow;
  password?: OpenAPIOAuthFlow;
  clientCredentials?: OpenAPIOAuthFlow;
  authorizationCode?: OpenAPIOAuthFlow;
}

export interface OpenAPIOAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export type OpenAPISecurityRequirement = Record<string, string[]>;
