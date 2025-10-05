/**
 * Request Chain Executor
 * Executes request chains with variable extraction and dependency injection
 */

import {
  RequestChain,
  ChainedRequest,
  VariableExtraction,
  RequestDependency,
  SavedRequest,
} from "../interfaces/developer-experience.interface";

export interface ChainExecutionResult {
  success: boolean;
  executedRequests: SavedRequest[];
  variables: Record<string, any>;
  errors?: ChainExecutionError[];
  totalDuration: number;
}

export interface ChainExecutionError {
  requestId: string;
  requestName: string;
  error: string;
  step: number;
}

/**
 * Chain Executor
 */
export class ChainExecutor {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(
    baseUrl: string = "",
    defaultHeaders: Record<string, string> = {},
  ) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
  }

  /**
   * Execute a request chain
   */
  async executeChain(chain: RequestChain): Promise<ChainExecutionResult> {
    const startTime = Date.now();
    const executedRequests: SavedRequest[] = [];
    const variables: Record<string, any> = {};
    const errors: ChainExecutionError[] = [];

    // Sort requests by order
    const sortedRequests = [...chain.requests].sort(
      (a, b) => a.order - b.order,
    );

    for (const [index, chainedRequest] of sortedRequests.entries()) {
      try {
        // Inject dependencies from previous requests
        const processedConfig = this.injectDependencies(
          chainedRequest.config,
          chainedRequest.dependencies || [],
          variables,
        );

        // Execute the request
        const savedRequest = await this.executeRequest(
          chainedRequest,
          processedConfig,
        );

        executedRequests.push(savedRequest);

        // Extract variables for next requests
        if (chainedRequest.variableExtraction && savedRequest.response) {
          this.extractVariables(
            chainedRequest.variableExtraction,
            savedRequest.response,
            variables,
          );
        }
      } catch (error) {
        errors.push({
          requestId: chainedRequest.id,
          requestName: `${chainedRequest.method} ${chainedRequest.endpoint}`,
          error: error instanceof Error ? error.message : String(error),
          step: index + 1,
        });

        // Stop execution on error
        break;
      }
    }

    const totalDuration = Date.now() - startTime;

    return {
      success: errors.length === 0,
      executedRequests,
      variables,
      errors: errors.length > 0 ? errors : undefined,
      totalDuration,
    };
  }

  /**
   * Execute a single request
   */
  private async executeRequest(
    chainedRequest: ChainedRequest,
    config: typeof chainedRequest.config,
  ): Promise<SavedRequest> {
    const startTime = Date.now();

    // Build URL
    let url = this.buildUrl(chainedRequest.endpoint, config.pathParams);

    // Add query parameters
    if (config.query) {
      const queryString = new URLSearchParams(
        this.flattenObject(config.query),
      ).toString();
      url += `?${queryString}`;
    }

    // Build headers
    const headers = {
      ...this.defaultHeaders,
      ...config.headers,
    };

    // Build fetch options
    const fetchOptions: RequestInit = {
      method: chainedRequest.method,
      headers,
    };

    // Add body for non-GET requests
    if (config.body && chainedRequest.method !== "GET") {
      if (typeof config.body === "object") {
        fetchOptions.body = JSON.stringify(config.body);
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
      } else {
        fetchOptions.body = config.body;
      }
    }

    // Execute request
    const response = await fetch(url, fetchOptions);
    const duration = Date.now() - startTime;

    // Parse response
    let responseBody: any;
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      responseBody = await response.json();
    } else if (contentType.includes("text/")) {
      responseBody = await response.text();
    } else {
      responseBody = await response.blob();
    }

    // Build response headers object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Create saved request
    const savedRequest: SavedRequest = {
      id: this.generateId(),
      name: `${chainedRequest.method} ${chainedRequest.endpoint}`,
      endpoint: chainedRequest.endpoint,
      method: chainedRequest.method,
      timestamp: new Date(),
      request: {
        headers: config.headers,
        query: config.query,
        body: config.body,
        pathParams: config.pathParams,
      },
      response: {
        status: response.status,
        headers: responseHeaders,
        body: responseBody,
        duration,
      },
    };

    return savedRequest;
  }

  /**
   * Inject dependencies from variables into request config
   */
  private injectDependencies(
    config: ChainedRequest["config"],
    dependencies: RequestDependency[],
    variables: Record<string, any>,
  ): ChainedRequest["config"] {
    const processedConfig = JSON.parse(JSON.stringify(config)); // Deep clone

    for (const dep of dependencies) {
      const variableValue = variables[dep.variableName];

      if (variableValue === undefined) {
        console.warn(
          `Variable "${dep.variableName}" not found in chain variables`,
        );
        continue;
      }

      // Apply transformation if specified
      let finalValue = variableValue;
      if (dep.transform) {
        finalValue = this.applyTransform(dep.transform, variableValue);
      }

      // Inject into target location
      this.setValueByPath(
        processedConfig,
        dep.target,
        dep.targetPath,
        finalValue,
      );
    }

    return processedConfig;
  }

  /**
   * Extract variables from response
   */
  private extractVariables(
    extractions: VariableExtraction[],
    response: SavedRequest["response"],
    variables: Record<string, any>,
  ): void {
    if (!response) return;

    for (const extraction of extractions) {
      let sourceData: any;

      // Get source data based on extraction source
      if (extraction.source === "response.body") {
        sourceData = response.body;
      } else if (extraction.source === "response.headers") {
        sourceData = response.headers;
      } else if (extraction.source === "response.status") {
        sourceData = response.status;
      } else {
        continue;
      }

      // Extract value by path
      let value = this.getValueByPath(sourceData, extraction.path);

      // Apply transformation
      if (extraction.transform) {
        value = this.applyVariableTransform(extraction.transform, value);
      }

      if (extraction.customTransform) {
        try {
          // Execute custom JavaScript transform
          const transformFn = new Function(
            "value",
            `return ${extraction.customTransform}`,
          );
          value = transformFn(value);
        } catch (error) {
          console.error(
            `Failed to apply custom transform for "${extraction.name}":`,
            error,
          );
        }
      }

      // Save variable
      variables[extraction.name] = value;
    }
  }

  /**
   * Apply transformation to a dependency value
   */
  private applyTransform(transform: string, value: any): any {
    // Simple template replacement
    return transform.replace(/\$\{value\}/g, String(value));
  }

  /**
   * Apply transformation to extracted variable
   */
  private applyVariableTransform(
    transform: VariableExtraction["transform"],
    value: any,
  ): any {
    switch (transform) {
      case "toString":
        return String(value);
      case "toNumber":
        return Number(value);
      case "toBoolean":
        return Boolean(value);
      default:
        return value;
    }
  }

  /**
   * Get value from object by path (supports dot notation and array indices)
   */
  private getValueByPath(obj: any, path: string): any {
    const parts = path.split(".");
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      // Handle array indices
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = current[key]?.[parseInt(index, 10)];
      } else {
        current = current[part];
      }
    }

    return current;
  }

  /**
   * Set value in object by path
   */
  private setValueByPath(
    config: any,
    target: RequestDependency["target"],
    targetPath: string,
    value: any,
  ): void {
    const parts = targetPath.split(".");
    let current = config;

    // Navigate to parent object
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }

    // Set final value
    const finalKey = parts[parts.length - 1];
    current[finalKey] = value;
  }

  /**
   * Build URL with path parameters
   */
  private buildUrl(
    endpoint: string,
    pathParams?: Record<string, string>,
  ): string {
    let url = this.baseUrl + endpoint;

    if (pathParams) {
      for (const [key, value] of Object.entries(pathParams)) {
        url = url.replace(`:${key}`, encodeURIComponent(value));
        url = url.replace(`{${key}}`, encodeURIComponent(value));
      }
    }

    return url;
  }

  /**
   * Flatten nested object for query parameters
   */
  private flattenObject(
    obj: Record<string, any>,
    prefix = "",
  ): Record<string, string> {
    const flattened: Record<string, string> = {};

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}[${key}]` : key;

      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        Object.assign(flattened, this.flattenObject(value, fullKey));
      } else {
        flattened[fullKey] = String(value);
      }
    }

    return flattened;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
