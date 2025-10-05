/**
 * Telemetry data storage implementations
 */

import {
  TelemetryStorage,
  ContractViolation,
  HarvestedExample,
  PerformanceMetrics,
  PerformanceStats,
} from "../interfaces/telemetry.interface";

/**
 * In-memory storage implementation
 * Used in development mode for fast access
 */
export class MemoryTelemetryStorage implements TelemetryStorage {
  private violations: ContractViolation[] = [];
  private examples: Map<string, HarvestedExample[]> = new Map();
  private metrics: Map<string, PerformanceMetrics[]> = new Map();

  /**
   * Generate endpoint key for storage
   */
  private getEndpointKey(method: string, path: string): string {
    return `${method.toUpperCase()}:${path}`;
  }

  /**
   * Save a contract violation
   */
  async saveViolation(violation: ContractViolation): Promise<void> {
    this.violations.push(violation);
  }

  /**
   * Get contract violations with optional filters
   */
  async getViolations(filters?: {
    method?: string;
    path?: string;
    since?: Date;
  }): Promise<ContractViolation[]> {
    let filtered = this.violations;

    if (filters?.method) {
      filtered = filtered.filter((v) => v.method === filters.method);
    }

    if (filters?.path) {
      filtered = filtered.filter((v) => v.path === filters.path);
    }

    if (filters?.since) {
      filtered = filtered.filter((v) => v.timestamp >= filters.since!);
    }

    return filtered;
  }

  /**
   * Save a harvested example
   */
  async saveExample(example: HarvestedExample): Promise<void> {
    const key = this.getEndpointKey(example.method, example.path);
    const existing = this.examples.get(key) || [];
    existing.push(example);
    this.examples.set(key, existing);
  }

  /**
   * Get examples for an endpoint
   */
  async getExamples(method: string, path: string): Promise<HarvestedExample[]> {
    const key = this.getEndpointKey(method, path);
    return this.examples.get(key) || [];
  }

  /**
   * Approve an example for documentation
   */
  async approveExample(id: string): Promise<void> {
    for (const examples of this.examples.values()) {
      const example = examples.find((e) => e.id === id);
      if (example) {
        example.approved = true;
        return;
      }
    }
  }

  /**
   * Delete an example
   */
  async deleteExample(id: string): Promise<void> {
    for (const [key, examples] of this.examples.entries()) {
      const index = examples.findIndex((e) => e.id === id);
      if (index !== -1) {
        examples.splice(index, 1);
        this.examples.set(key, examples);
        return;
      }
    }
  }

  /**
   * Save performance metrics
   */
  async saveMetrics(metrics: PerformanceMetrics): Promise<void> {
    const key = this.getEndpointKey(metrics.method, metrics.path);
    const existing = this.metrics.get(key) || [];
    existing.push(metrics);
    this.metrics.set(key, existing);
  }

  /**
   * Get performance statistics for an endpoint
   */
  async getStats(
    method: string,
    path: string,
    since?: Date,
  ): Promise<PerformanceStats> {
    const key = this.getEndpointKey(method, path);
    let allMetrics = this.metrics.get(key) || [];

    if (since) {
      allMetrics = allMetrics.filter((m) => m.timestamp >= since);
    }

    if (allMetrics.length === 0) {
      return {
        endpoint: key,
        requestCount: 0,
        average: 0,
        median: 0,
        p95: 0,
        p99: 0,
        min: 0,
        max: 0,
        budget: allMetrics[0]?.budget || 0,
        budgetViolationRate: 0,
        timeRange: {
          start: new Date(),
          end: new Date(),
        },
      };
    }

    const durations = allMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const budget = allMetrics[0].budget;
    const violations = allMetrics.filter((m) => m.exceeded).length;

    return {
      endpoint: key,
      requestCount: allMetrics.length,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: durations[Math.floor(durations.length / 2)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      min: durations[0],
      max: durations[durations.length - 1],
      budget,
      budgetViolationRate: (violations / allMetrics.length) * 100,
      timeRange: {
        start: allMetrics[0].timestamp,
        end: allMetrics[allMetrics.length - 1].timestamp,
      },
    };
  }

  /**
   * Clean up old data
   */
  async cleanup(olderThan: Date): Promise<void> {
    // Clean violations
    this.violations = this.violations.filter((v) => v.timestamp >= olderThan);

    // Clean examples
    for (const [key, examples] of this.examples.entries()) {
      const filtered = examples.filter((e) => e.timestamp >= olderThan);
      this.examples.set(key, filtered);
    }

    // Clean metrics
    for (const [key, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter((m) => m.timestamp >= olderThan);
      this.metrics.set(key, filtered);
    }
  }

  /**
   * Get all examples (for management/curation UI)
   */
  async getAllExamples(): Promise<HarvestedExample[]> {
    const all: HarvestedExample[] = [];
    for (const examples of this.examples.values()) {
      all.push(...examples);
    }
    return all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get recent violations (for debugging)
   */
  async getRecentViolations(limit: number = 10): Promise<ContractViolation[]> {
    return this.violations
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

/**
 * Singleton storage instance
 */
let storageInstance: TelemetryStorage | null = null;

/**
 * Get or create the telemetry storage instance
 */
export function getTelemetryStorage(): TelemetryStorage {
  if (!storageInstance) {
    storageInstance = new MemoryTelemetryStorage();
  }
  return storageInstance;
}

/**
 * Set a custom storage implementation
 */
export function setTelemetryStorage(storage: TelemetryStorage): void {
  storageInstance = storage;
}
