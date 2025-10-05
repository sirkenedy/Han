/**
 * Metadata keys for OpenAPI decorators
 */

export const OPENAPI_METADATA_KEYS = {
  API_PROPERTY: "openapi:property",
  API_RESPONSE: "openapi:response",
  API_RESPONSES: "openapi:responses",
  API_OPERATION: "openapi:operation",
  API_PARAM: "openapi:param",
  API_QUERY: "openapi:query",
  API_BODY: "openapi:body",
  API_HEADER: "openapi:header",
  API_SECURITY: "openapi:security",
  API_TAGS: "openapi:tags",
  API_EXCLUDE: "openapi:exclude",
  API_PRODUCES: "openapi:produces",
  API_CONSUMES: "openapi:consumes",
  API_EXTRA_MODELS: "openapi:extra_models",
  API_SCHEMA: "openapi:schema",
  // Phase 1 Features
  API_CONTRACT_TESTING: "openapi:contract_testing",
  API_HARVEST_EXAMPLES: "openapi:harvest_examples",
  API_PERFORMANCE: "openapi:performance",
} as const;

export const DEFAULT_OPENAPI_VERSION = "3.0.3";

export const HTTP_STATUS_CODES = {
  CONTINUE: 100,
  SWITCHING_PROTOCOLS: 101,
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  SEE_OTHER: 303,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const CONTENT_TYPES = {
  JSON: "application/json",
  XML: "application/xml",
  FORM_URL_ENCODED: "application/x-www-form-urlencoded",
  FORM_DATA: "multipart/form-data",
  TEXT_PLAIN: "text/plain",
  TEXT_HTML: "text/html",
} as const;
