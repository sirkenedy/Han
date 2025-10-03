export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const GITHUB_EVENTS = {
  PUSH: "push",
  PULL_REQUEST: "pull_request",
  RELEASE: "release",
} as const;

export const DEPLOYMENT_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  SUCCESS: "success",
  FAILED: "failed",
} as const;

export const DEFAULT_PORTS = {
  MIN: 3000,
  MAX: 9999,
} as const;
