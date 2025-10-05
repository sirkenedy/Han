/**
 * Telemetry and tracking interfaces for Phase 1 features
 */

/**
 * Configuration for Live Contract Testing
 */
export interface ContractTestingOptions {
  /** Enable contract testing (default: true in development, false in production) */
  enabled?: boolean;
  /** Throw errors on contract violations instead of just warnings */
  strict?: boolean;
  /** Continue processing even after violations */
  continueOnViolation?: boolean;
  /** Custom error handler for violations */
  onViolation?: (violation: ContractViolation) => void;
}

/**
 * Represents a contract violation between documentation and actual response
 */
export interface ContractViolation {
  /** HTTP method of the endpoint */
  method: string;
  /** Path of the endpoint */
  path: string;
  /** Type of violation */
  type:
    | "missing_field"
    | "type_mismatch"
    | "unexpected_field"
    | "status_mismatch"
    | "schema_violation";
  /** Human-readable message */
  message: string;
  /** Expected value from documentation */
  expected: any;
  /** Actual value from response */
  actual: any;
  /** Location in code where the handler is defined */
  location?: {
    file: string;
    line: number;
  };
  /** Timestamp of violation */
  timestamp: Date;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Configuration for Example Harvester
 */
export interface ExampleHarvesterOptions {
  /** Enable example harvesting (default: true in development) */
  enabled?: boolean;
  /** Harvest examples asynchronously to avoid blocking responses */
  async?: boolean;
  /** Sample rate (0.0 to 1.0) - only harvest percentage of requests */
  sampling?: number;
  /** Maximum number of examples to store per endpoint */
  maxExamplesPerEndpoint?: number;
  /** Storage path for harvested examples */
  storagePath?: string;
  /** Auto-save examples without manual approval */
  autoSave?: boolean;
  /** Filter function to determine if example should be harvested */
  shouldHarvest?: (req: any, res: any) => boolean;
}

/**
 * Represents a harvested API example
 */
export interface HarvestedExample {
  /** Unique identifier */
  id: string;
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** Request details */
  request: {
    headers: Record<string, string>;
    query: Record<string, any>;
    params: Record<string, any>;
    body?: any;
  };
  /** Response details */
  response: {
    status: number;
    headers: Record<string, string>;
    body: any;
    duration: number;
  };
  /** When this example was captured */
  timestamp: Date;
  /** User-provided summary */
  summary?: string;
  /** Whether this example has been approved for documentation */
  approved: boolean;
  /** Tags for categorizing examples */
  tags: string[];
}

/**
 * Configuration for Performance Budget Tracking
 */
export interface PerformanceBudgetOptions {
  /** Target response time in milliseconds */
  budget: number;
  /** 95th percentile target in milliseconds */
  p95?: number;
  /** 99th percentile target in milliseconds */
  p99?: number;
  /** Hard timeout in milliseconds */
  timeout?: number;
  /** Show warnings when budget is exceeded */
  warnOnExceed?: boolean;
  /** Throw errors when budget is exceeded (for CI/CD) */
  failOnExceed?: boolean;
  /** Custom handler for budget violations */
  onBudgetExceeded?: (metrics: PerformanceMetrics) => void;
}

/**
 * Performance metrics for an API endpoint
 */
export interface PerformanceMetrics {
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** Response time in milliseconds */
  duration: number;
  /** Target budget */
  budget: number;
  /** Whether budget was exceeded */
  exceeded: boolean;
  /** Percentage over/under budget */
  percentageOfBudget: number;
  /** Timestamp */
  timestamp: Date;
  /** Breakdown of time spent */
  breakdown?: {
    database?: number;
    external?: number;
    processing?: number;
  };
}

/**
 * Aggregated performance statistics
 */
export interface PerformanceStats {
  /** Endpoint identifier */
  endpoint: string;
  /** Total number of requests */
  requestCount: number;
  /** Average response time */
  average: number;
  /** Median response time */
  median: number;
  /** 95th percentile */
  p95: number;
  /** 99th percentile */
  p99: number;
  /** Minimum response time */
  min: number;
  /** Maximum response time */
  max: number;
  /** Target budget */
  budget: number;
  /** Percentage of requests that exceeded budget */
  budgetViolationRate: number;
  /** Time range for these stats */
  timeRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Global telemetry configuration
 */
export interface TelemetryConfig {
  /** Enable all telemetry features */
  enabled?: boolean;
  /** Contract testing configuration */
  contractTesting?: ContractTestingOptions;
  /** Example harvester configuration */
  exampleHarvester?: ExampleHarvesterOptions;
  /** Performance tracking configuration */
  performanceTracking?: {
    enabled?: boolean;
    sampleRate?: number;
  };
  /** Storage configuration */
  storage?: {
    /** Storage type */
    type?: "memory" | "sqlite" | "file";
    /** Storage path (for file/sqlite) */
    path?: string;
    /** Retention period in days */
    retentionDays?: number;
    /** Auto-cleanup old data */
    autoCleanup?: boolean;
  };
}

/**
 * Telemetry data storage interface
 */
export interface TelemetryStorage {
  /** Save a contract violation */
  saveViolation(violation: ContractViolation): Promise<void>;
  /** Get all violations */
  getViolations(filters?: {
    method?: string;
    path?: string;
    since?: Date;
  }): Promise<ContractViolation[]>;

  /** Save a harvested example */
  saveExample(example: HarvestedExample): Promise<void>;
  /** Get examples for an endpoint */
  getExamples(method: string, path: string): Promise<HarvestedExample[]>;
  /** Approve an example for documentation */
  approveExample(id: string): Promise<void>;
  /** Delete an example */
  deleteExample(id: string): Promise<void>;

  /** Save performance metrics */
  saveMetrics(metrics: PerformanceMetrics): Promise<void>;
  /** Get performance stats for an endpoint */
  getStats(
    method: string,
    path: string,
    since?: Date,
  ): Promise<PerformanceStats>;

  /** Clean up old data */
  cleanup(olderThan: Date): Promise<void>;
}
