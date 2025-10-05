/**
 * Telemetry Middleware
 * Handles contract testing, example harvesting, and performance tracking
 */

import { Request, Response, NextFunction } from "express";
import { getTelemetryStorage } from "../telemetry/storage";
import {
  validateResponseAgainstSchema,
  validateResponseStatus,
  formatViolationsForConsole,
} from "../telemetry/validator";
import {
  generateExampleId,
  sanitizeHeaders,
  sanitizeData,
  shouldSample,
  categorizeExample,
  formatPerformanceForConsole,
  isDevelopment,
  isProduction,
  logColored,
} from "../telemetry/utils";
import {
  TelemetryConfig,
  HarvestedExample,
  PerformanceMetrics,
  ContractViolation,
} from "../interfaces/telemetry.interface";
import { OPENAPI_METADATA_KEYS } from "../constants";

/**
 * Default telemetry configuration
 * IMPORTANT: Telemetry is DISABLED by default for security and performance.
 * Users must explicitly enable it in development environments.
 * NEVER enable telemetry in production.
 */
const DEFAULT_CONFIG: TelemetryConfig = {
  enabled: false, // DISABLED by default - must be explicitly enabled
  contractTesting: {
    enabled: false,
    strict: false,
    continueOnViolation: true,
  },
  exampleHarvester: {
    enabled: false,
    async: true,
    sampling: 1.0,
    maxExamplesPerEndpoint: 10,
    autoSave: false,
  },
  performanceTracking: {
    enabled: false,
    sampleRate: 1.0,
  },
  storage: {
    type: "memory",
    retentionDays: 7,
    autoCleanup: true,
  },
};

let globalConfig: TelemetryConfig = { ...DEFAULT_CONFIG };

/**
 * Configure telemetry globally
 *
 * IMPORTANT: Never enable telemetry in production!
 * Telemetry features are designed for development only.
 */
export function configureTelemetry(config: Partial<TelemetryConfig>): void {
  // Warn if trying to enable in production
  if (isProduction() && config.enabled) {
    console.warn(
      "\n⚠️  WARNING: Telemetry features are enabled in PRODUCTION environment!\n" +
        "   This is NOT recommended due to performance and security concerns.\n" +
        "   Telemetry should only be enabled in development.\n",
    );
  }

  globalConfig = { ...globalConfig, ...config };
}

/**
 * Get current telemetry configuration
 */
export function getTelemetryConfig(): TelemetryConfig {
  return globalConfig;
}

/**
 * Create telemetry middleware
 * This middleware should be added to your Han application to enable Phase 1 features
 *
 * @example
 * ```typescript
 * import { HanFactory } from 'han-prev-core';
 * import { createTelemetryMiddleware } from 'han-prev-openapi';
 *
 * const app = await HanFactory.create(AppModule);
 * app.use(createTelemetryMiddleware());
 * ```
 */
export function createTelemetryMiddleware(config?: Partial<TelemetryConfig>) {
  if (config) {
    configureTelemetry(config);
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!globalConfig.enabled) {
      return next();
    }

    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;

    // Store route handler metadata
    const routeMetadata = {
      method: req.method,
      path: req.route?.path || req.path,
      handler: null as any,
      handlerName: null as string | null,
    };

    // Intercept response
    const interceptResponse = async (body: any) => {
      const duration = Date.now() - startTime;
      const storage = getTelemetryStorage();

      try {
        // Get handler metadata if available
        const { handler, handlerName } = routeMetadata;

        // Performance tracking
        if (
          globalConfig.performanceTracking?.enabled &&
          handler &&
          handlerName
        ) {
          await trackPerformance(
            handler,
            handlerName,
            req,
            res,
            duration,
            storage,
          );
        }

        // Contract testing
        if (globalConfig.contractTesting?.enabled && handler && handlerName) {
          await validateContract(handler, handlerName, req, res, body, storage);
        }

        // Example harvesting
        if (globalConfig.exampleHarvester?.enabled && handler && handlerName) {
          await harvestExample(
            handler,
            handlerName,
            req,
            res,
            body,
            duration,
            storage,
          );
        }
      } catch (error) {
        console.error("Telemetry middleware error:", error);
      }

      return body;
    };

    // Override res.send
    res.send = function (body: any) {
      interceptResponse(body).then(() => {
        originalSend.call(this, body);
      });
      return this;
    };

    // Override res.json
    res.json = function (body: any) {
      interceptResponse(body).then(() => {
        originalJson.call(this, body);
      });
      return this;
    };

    next();
  };
}

/**
 * Track performance metrics
 */
async function trackPerformance(
  handler: any,
  handlerName: string,
  req: Request,
  res: Response,
  duration: number,
  storage: any,
): Promise<void> {
  const performanceMetadata = Reflect.getMetadata(
    OPENAPI_METADATA_KEYS.API_PERFORMANCE,
    handler.constructor,
    handlerName,
  );

  if (!performanceMetadata) {
    return;
  }

  const { budget, p95, p99, warnOnExceed, failOnExceed } = performanceMetadata;
  const exceeded = duration > budget;

  const metrics: PerformanceMetrics = {
    method: req.method,
    path: req.route?.path || req.path,
    duration,
    budget,
    exceeded,
    percentageOfBudget: (duration / budget) * 100,
    timestamp: new Date(),
  };

  // Save metrics
  await storage.saveMetrics(metrics);

  // Warn if exceeded
  if (exceeded && warnOnExceed) {
    const formatted = formatPerformanceForConsole(metrics);
    logColored(formatted, "yellow");
  }

  // Fail if configured (for CI/CD)
  if (exceeded && failOnExceed) {
    throw new Error(
      `Performance budget exceeded: ${duration}ms > ${budget}ms for ${req.method} ${req.path}`,
    );
  }
}

/**
 * Validate contract (Live Contract Testing)
 */
async function validateContract(
  handler: any,
  handlerName: string,
  req: Request,
  res: Response,
  body: any,
  storage: any,
): Promise<void> {
  const contractMetadata = Reflect.getMetadata(
    OPENAPI_METADATA_KEYS.API_CONTRACT_TESTING,
    handler.constructor,
    handlerName,
  );

  if (!contractMetadata || !contractMetadata.enabled) {
    return;
  }

  const violations: ContractViolation[] = [];

  // Get response metadata
  const responseMetadata = Reflect.getMetadata(
    OPENAPI_METADATA_KEYS.API_RESPONSES,
    handler.constructor,
    handlerName,
  );

  if (responseMetadata && responseMetadata.length > 0) {
    // Find matching response for status code
    const matchingResponse = responseMetadata.find(
      (r: any) => r.status === res.statusCode,
    );

    if (matchingResponse && matchingResponse.schema) {
      // Validate response against schema
      const schemaViolations = validateResponseAgainstSchema(
        body,
        matchingResponse.schema,
        req.method,
        req.route?.path || req.path,
      );
      violations.push(...schemaViolations);
    }

    // Validate status code is documented
    const declaredStatuses = responseMetadata.map((r: any) => r.status);
    const statusViolation = validateResponseStatus(
      res.statusCode,
      declaredStatuses,
      req.method,
      req.route?.path || req.path,
    );
    if (statusViolation) {
      violations.push(statusViolation);
    }
  }

  // Save and report violations
  if (violations.length > 0) {
    for (const violation of violations) {
      await storage.saveViolation(violation);
    }

    const formatted = formatViolationsForConsole(violations);
    logColored(formatted, "red");

    // Throw error in strict mode
    if (contractMetadata.strict && !contractMetadata.continueOnViolation) {
      throw new Error(
        `Contract violations detected: ${violations.length} violations`,
      );
    }

    // Call custom violation handler
    if (contractMetadata.onViolation) {
      for (const violation of violations) {
        contractMetadata.onViolation(violation);
      }
    }
  }
}

/**
 * Harvest example from request/response
 */
async function harvestExample(
  handler: any,
  handlerName: string,
  req: Request,
  res: Response,
  body: any,
  duration: number,
  storage: any,
): Promise<void> {
  const harvestMetadata = Reflect.getMetadata(
    OPENAPI_METADATA_KEYS.API_HARVEST_EXAMPLES,
    handler.constructor,
    handlerName,
  );

  if (!harvestMetadata || !harvestMetadata.enabled) {
    return;
  }

  // Check sampling rate
  if (!shouldSample(harvestMetadata.sampling || 1.0)) {
    return;
  }

  // Check if should harvest (custom filter)
  if (
    harvestMetadata.shouldHarvest &&
    !harvestMetadata.shouldHarvest(req, res)
  ) {
    return;
  }

  // Create harvested example
  const example: HarvestedExample = {
    id: generateExampleId(),
    method: req.method,
    path: req.route?.path || req.path,
    request: {
      headers: sanitizeHeaders(req.headers as Record<string, string>),
      query: req.query as Record<string, any>,
      params: req.params as Record<string, any>,
      body: sanitizeData(req.body),
    },
    response: {
      status: res.statusCode,
      headers: sanitizeHeaders(res.getHeaders() as Record<string, string>),
      body: sanitizeData(body),
      duration,
    },
    timestamp: new Date(),
    approved: harvestMetadata.autoSave || false,
    tags: categorizeExample({
      id: "",
      method: req.method,
      path: req.route?.path || req.path,
      request: {
        headers: {},
        query: req.query as Record<string, any>,
        params: req.params as Record<string, any>,
      },
      response: {
        status: res.statusCode,
        headers: {},
        body,
        duration,
      },
      timestamp: new Date(),
      approved: false,
      tags: [],
    }),
  };

  // Add custom category/tag
  if (harvestMetadata.category) {
    example.tags.push(harvestMetadata.category);
  }

  // Check max examples limit
  const existingExamples = await storage.getExamples(
    example.method,
    example.path,
  );
  if (
    existingExamples.length >= (harvestMetadata.maxExamplesPerEndpoint || 10)
  ) {
    // Skip if at limit (could implement LRU eviction here)
    return;
  }

  // Save example
  await storage.saveExample(example);

  // Log if not auto-saved
  if (!harvestMetadata.autoSave) {
    logColored(
      `\n🎯 Example harvested for ${example.method} ${example.path} (ID: ${example.id})`,
      "cyan",
    );
  }
}

/**
 * Middleware to set route handler metadata
 * This should be called in your route handlers
 */
export function setRouteHandler(handler: any, handlerName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    (req as any).__routeHandler = handler;
    (req as any).__routeHandlerName = handlerName;
    next();
  };
}
