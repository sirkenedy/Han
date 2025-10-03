import {
  BaseInterceptor,
  InterceptorContext,
  InterceptorResponse,
} from "../interfaces/interceptor.interface";

export class PerformanceInterceptor extends BaseInterceptor {
  constructor(private readonly slowThreshold: number = 1000) {
    super();
  }

  beforeHandle(context: InterceptorContext): void {
    context.startTime = Date.now();
  }

  afterHandle(
    context: InterceptorContext,
    response: InterceptorResponse,
  ): void {
    const { method, path, traceId, res } = context;
    const { duration } = response;

    // Add performance headers
    res.setHeader("X-Response-Time", `${duration}ms`);
    if (traceId) {
      res.setHeader("X-Trace-ID", traceId);
    }

    // Log slow requests
    if (duration > this.slowThreshold) {
      console.warn(
        `🐌 SLOW REQUEST: ${method} ${path} took ${duration}ms (threshold: ${this.slowThreshold}ms) - [${traceId}]`,
      );
    }
  }

  onError(context: InterceptorContext, error: any): void {
    const { method, path, traceId } = context;
    const duration = Date.now() - context.startTime;

    console.error(
      `⚡ PERFORMANCE ERROR: ${method} ${path} failed after ${duration}ms - [${traceId}]:`,
      error.message,
    );
  }
}
