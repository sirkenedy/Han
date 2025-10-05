/**
 * Utility functions for telemetry features
 */

import {
  HarvestedExample,
  PerformanceMetrics,
} from "../interfaces/telemetry.interface";

/**
 * Generate a unique ID for examples
 */
export function generateExampleId(): string {
  return `example_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize headers by removing sensitive information
 */
export function sanitizeHeaders(
  headers: Record<string, string>,
): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveHeaders = ["authorization", "cookie", "x-api-key", "api-key"];

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = "***REDACTED***";
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize request/response data by removing sensitive fields
 */
export function sanitizeData(data: any): any {
  if (!data || typeof data !== "object") {
    return data;
  }

  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "apiKey",
    "api_key",
    "creditCard",
    "ssn",
  ];
  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key of Object.keys(sanitized)) {
    if (
      sensitiveFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase()),
      )
    ) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Check if response should be sampled based on sampling rate
 */
export function shouldSample(samplingRate: number): boolean {
  return Math.random() < samplingRate;
}

/**
 * Calculate percentile from array of numbers
 */
export function calculatePercentile(
  numbers: number[],
  percentile: number,
): number {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Format performance metrics for console output
 */
export function formatPerformanceForConsole(
  metrics: PerformanceMetrics,
): string {
  const lines: string[] = [];
  const exceeded = metrics.exceeded;
  const emoji = exceeded ? "⚠️" : "✓";
  const status = exceeded ? "EXCEEDED" : "OK";

  lines.push(`\n${emoji} Performance Budget ${status}`);
  lines.push(`Endpoint: ${metrics.method} ${metrics.path}`);
  lines.push(`Target: ${formatDuration(metrics.budget)}`);
  lines.push(`Actual: ${formatDuration(metrics.duration)}`);

  if (exceeded) {
    const overBudget = metrics.duration - metrics.budget;
    const percentage = ((overBudget / metrics.budget) * 100).toFixed(1);
    lines.push(`Over Budget: +${formatDuration(overBudget)} (+${percentage}%)`);
  } else {
    const underBudget = metrics.budget - metrics.duration;
    const percentage = ((underBudget / metrics.budget) * 100).toFixed(1);
    lines.push(
      `Under Budget: -${formatDuration(underBudget)} (-${percentage}%)`,
    );
  }

  if (metrics.breakdown) {
    lines.push("\nBreakdown:");
    if (metrics.breakdown.database !== undefined) {
      lines.push(`  Database: ${formatDuration(metrics.breakdown.database)}`);
    }
    if (metrics.breakdown.external !== undefined) {
      lines.push(`  External: ${formatDuration(metrics.breakdown.external)}`);
    }
    if (metrics.breakdown.processing !== undefined) {
      lines.push(
        `  Processing: ${formatDuration(metrics.breakdown.processing)}`,
      );
    }
  }

  return lines.join("\n");
}

/**
 * Extract query parameters from URL
 */
export function extractQueryParams(url: string): Record<string, any> {
  const params: Record<string, any> = {};
  const urlObj = new URL(url, "http://dummy.com");

  for (const [key, value] of urlObj.searchParams.entries()) {
    params[key] = value;
  }

  return params;
}

/**
 * Determine if development environment
 */
export function isDevelopment(): boolean {
  return (
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev"
  );
}

/**
 * Determine if production environment
 */
export function isProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" || process.env.NODE_ENV === "prod"
  );
}

/**
 * Get storage directory for telemetry data
 */
export function getStorageDirectory(): string {
  return process.env.HAN_TELEMETRY_DIR || ".han/telemetry";
}

/**
 * Categorize example based on response characteristics
 */
export function categorizeExample(example: HarvestedExample): string[] {
  const tags: string[] = [];

  // Status code tags
  if (example.response.status >= 200 && example.response.status < 300) {
    tags.push("success");
  } else if (example.response.status >= 400 && example.response.status < 500) {
    tags.push("client-error");
  } else if (example.response.status >= 500) {
    tags.push("server-error");
  }

  // Response characteristics
  if (Array.isArray(example.response.body)) {
    tags.push("array-response");
    if (example.response.body.length === 0) {
      tags.push("empty-result");
    }
    if (example.response.body.length > 10) {
      tags.push("large-result");
    }
  } else if (
    example.response.body === null ||
    example.response.body === undefined
  ) {
    tags.push("null-response");
  } else if (typeof example.response.body === "object") {
    tags.push("object-response");

    // Check for null/undefined fields (edge cases)
    const hasNullFields = Object.values(example.response.body).some(
      (v) => v === null || v === undefined,
    );
    if (hasNullFields) {
      tags.push("has-null-fields");
    }
  }

  // Query parameters
  if (Object.keys(example.request.query).length > 0) {
    tags.push("with-query-params");
  }

  // Performance
  if (example.response.duration < 100) {
    tags.push("fast");
  } else if (example.response.duration > 1000) {
    tags.push("slow");
  }

  return tags;
}

/**
 * Color code for console output
 */
export const ConsoleColors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

/**
 * Log with color
 */
export function logColored(
  message: string,
  color: keyof typeof ConsoleColors = "white",
): void {
  console.log(`${ConsoleColors[color]}${message}${ConsoleColors.reset}`);
}
