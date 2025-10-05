/**
 * Developer Experience Feature Interfaces
 * Request Chaining, Postman Generation, Code Examples
 */

/**
 * Request Chaining Playground Interfaces
 */
export interface SavedRequest {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  timestamp: Date;
  request: {
    headers?: Record<string, string>;
    query?: Record<string, any>;
    body?: any;
    pathParams?: Record<string, string>;
  };
  response?: {
    status: number;
    headers?: Record<string, string>;
    body: any;
    duration: number;
  };
  variables?: Record<string, any>; // Extracted variables for chaining
}

export interface RequestChain {
  id: string;
  name: string;
  description?: string;
  requests: ChainedRequest[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChainedRequest {
  id: string;
  endpoint: string;
  method: string;
  order: number;
  config: {
    headers?: Record<string, string>;
    query?: Record<string, any>;
    body?: any;
    pathParams?: Record<string, string>;
  };
  variableExtraction?: VariableExtraction[];
  dependencies?: RequestDependency[];
}

export interface VariableExtraction {
  name: string; // Variable name to save
  source: "response.body" | "response.headers" | "response.status";
  path: string; // JSONPath or dot notation (e.g., "data.id", "headers.x-token")
  transform?: "toString" | "toNumber" | "toBoolean" | "custom";
  customTransform?: string; // JavaScript expression
}

export interface RequestDependency {
  variableName: string; // Variable from previous request
  target: "header" | "query" | "body" | "pathParam";
  targetPath: string; // Where to inject (e.g., "headers.Authorization", "body.userId")
  transform?: string; // Optional transformation (e.g., "Bearer ${value}")
}

export interface ChainPlaygroundConfig {
  enabled: boolean;
  maxSavedRequests?: number; // Max requests to save in localStorage
  maxChains?: number; // Max chains to save
  autoSave?: boolean; // Auto-save every request
  storageKey?: string; // Custom localStorage key
}

/**
 * Postman Generation Interfaces
 */
export interface PostmanCollection {
  info: PostmanInfo;
  item: PostmanItem[];
  auth?: PostmanAuth;
  variable?: PostmanVariable[];
  event?: PostmanEvent[];
}

export interface PostmanInfo {
  name: string;
  description?: string;
  version?: string;
  schema: string; // Postman collection schema version
}

export interface PostmanItem {
  name: string;
  description?: string;
  request: PostmanRequest;
  response?: PostmanResponse[];
  event?: PostmanEvent[];
}

export interface PostmanRequest {
  method: string;
  header?: PostmanHeader[];
  body?: PostmanBody;
  url: PostmanUrl;
  auth?: PostmanAuth;
  description?: string;
}

export interface PostmanHeader {
  key: string;
  value: string;
  type?: string;
  disabled?: boolean;
  description?: string;
}

export interface PostmanBody {
  mode: "raw" | "urlencoded" | "formdata" | "file" | "graphql";
  raw?: string;
  options?: {
    raw?: {
      language?: "json" | "xml" | "text" | "javascript";
    };
  };
  urlencoded?: Array<{ key: string; value: string; type?: string }>;
  formdata?: Array<{ key: string; value: string; type?: string }>;
}

export interface PostmanUrl {
  raw: string;
  protocol?: string;
  host?: string[];
  path?: string[];
  query?: Array<{ key: string; value: string; disabled?: boolean }>;
  variable?: PostmanVariable[];
}

export interface PostmanAuth {
  type: "bearer" | "basic" | "apikey" | "oauth2" | "noauth";
  bearer?: Array<{ key: string; value: string; type: string }>;
  basic?: Array<{ key: string; value: string; type: string }>;
  apikey?: Array<{ key: string; value: string; type: string }>;
  oauth2?: Array<{ key: string; value: string; type: string }>;
}

export interface PostmanVariable {
  key: string;
  value: string;
  type?: string;
  description?: string;
}

export interface PostmanEvent {
  listen: "prerequest" | "test";
  script: {
    type?: string;
    exec: string[];
  };
}

export interface PostmanResponse {
  name: string;
  originalRequest: PostmanRequest;
  status: string;
  code: number;
  header?: PostmanHeader[];
  body?: string;
}

export interface PostmanGeneratorConfig {
  enabled: boolean;
  includeExamples?: boolean; // Include example responses
  includeTests?: boolean; // Generate test scripts
  includeAuth?: boolean; // Include auth configuration
  baseUrl?: string; // Base URL for requests
  environmentVariables?: Record<string, string>; // Environment variables to include
}

/**
 * Code Examples Interfaces
 */
export type SupportedLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "curl"
  | "go"
  | "java"
  | "csharp"
  | "php"
  | "ruby"
  | "swift";

export interface CodeExample {
  language: SupportedLanguage;
  code: string;
  description?: string;
  dependencies?: string[]; // Required packages/libraries
}

export interface CodeExampleConfig {
  endpoint: string;
  method: string;
  parameters?: {
    path?: Record<string, any>;
    query?: Record<string, any>;
    header?: Record<string, any>;
    body?: any;
  };
  auth?: {
    type: "bearer" | "basic" | "apikey";
    value?: string;
  };
  baseUrl?: string;
}

export interface CodeGeneratorConfig {
  enabled: boolean;
  languages?: SupportedLanguage[]; // Languages to generate examples for
  includeComments?: boolean; // Include explanatory comments
  includeErrorHandling?: boolean; // Include try-catch blocks
  includeTypeDefinitions?: boolean; // Include TypeScript interfaces
  framework?: {
    // Framework-specific options
    typescript?: "fetch" | "axios" | "node-fetch";
    javascript?: "fetch" | "axios" | "jquery";
    python?: "requests" | "httpx" | "urllib";
  };
}

/**
 * Developer Experience Combined Configuration
 */
export interface DeveloperExperienceConfig {
  requestChaining?: ChainPlaygroundConfig;
  postmanGenerator?: PostmanGeneratorConfig;
  codeExamples?: CodeGeneratorConfig;
}
