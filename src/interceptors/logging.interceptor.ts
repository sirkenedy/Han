import { BaseInterceptor, InterceptorContext, InterceptorResponse } from '../interfaces/interceptor.interface';

export class LoggingInterceptor extends BaseInterceptor {
  beforeHandle(context: InterceptorContext): void {
    const { method, path, traceId } = context;
    const clientIp = context.req.ip || context.req.socket.remoteAddress || 'unknown';

    console.log(`📥 ${method} ${path} - ${clientIp} - [${traceId}] - Started`);
  }

  afterHandle(context: InterceptorContext, response: InterceptorResponse): void {
    const { method, path, traceId } = context;
    const { statusCode, duration } = response;
    const statusEmoji = statusCode < 400 ? '✅' : statusCode < 500 ? '⚠️' : '❌';

    console.log(`📤 ${method} ${path} - ${statusCode} ${statusEmoji} - ${duration}ms - [${traceId}]`);
  }

  onError(context: InterceptorContext, error: any): void {
    const { method, path, traceId } = context;
    console.error(`💥 ${method} ${path} - Error - [${traceId}]:`, error.message);
  }
}