import { Request, Response } from "express";

export interface InterceptorContext {
  req: Request;
  res: Response;
  method: string;
  path: string;
  startTime: number;
  traceId?: string;
}

export interface InterceptorResponse {
  statusCode: number;
  data?: any;
  error?: any;
  duration: number;
}

export interface HanInterceptor {
  // Called before the route handler
  beforeHandle?(context: InterceptorContext): void | Promise<void>;

  // Called after successful route handler execution
  afterHandle?(
    context: InterceptorContext,
    response: InterceptorResponse,
  ): void | Promise<void>;

  // Called when route handler throws an error (optional)
  onError?(context: InterceptorContext, error: any): void | Promise<void>;
}

export abstract class BaseInterceptor implements HanInterceptor {
  beforeHandle?(context: InterceptorContext): void | Promise<void>;
  afterHandle?(
    context: InterceptorContext,
    response: InterceptorResponse,
  ): void | Promise<void>;
  onError?(context: InterceptorContext, error: any): void | Promise<void>;
}

export interface InterceptorConstructor {
  new (...args: any[]): HanInterceptor;
}
