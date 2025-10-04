# Interceptors

Interceptors are powerful tools that allow you to **transform responses**, **handle exceptions**, **log requests**, **implement caching**, and more. They execute **before and after** route handlers, giving you full control over the request-response cycle.

## What are Interceptors?

Interceptors are classes that implement the `HanInterceptor` interface. They can:

- Transform the response before sending it to the client
- Transform the exception before sending error response
- Add extra logic before/after route handler execution
- Override the return value completely

```typescript
import { Injectable } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';

@Injectable()
export class LoggingInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    console.log('Before route handler...');

    const now = Date.now();

    return next.handle().then((data) => {
      console.log(`After route handler... ${Date.now() - now}ms`);
      return data;
    });
  }
}
```

## Request-Response Flow

Understanding when interceptors execute:

```
Request
  ↓
Middleware
  ↓
Guards
  ↓
Interceptor (BEFORE) ← You are here
  ↓
Route Handler
  ↓
Interceptor (AFTER) ← You are here again
  ↓
Response
```

## Why Use Interceptors?

### 1. Response Transformation

Wrap all responses in a standard format:

```typescript
// ❌ Without interceptor - Inconsistent responses
@Get('users')
getUsers() {
  return [{ id: 1, name: 'John' }]; // Raw array
}

@Get('posts')
getPosts() {
  return { posts: [...] }; // Custom object
}

// ✅ With interceptor - Consistent format
// All responses become:
{
  "success": true,
  "data": [...],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Exception Handling

Transform errors into user-friendly responses:

```typescript
// ❌ Without interceptor
{
  "message": "Cannot read property 'id' of undefined",
  "stack": "Error at..."
}

// ✅ With interceptor
{
  "success": false,
  "error": "Something went wrong",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. Logging

Automatically log all requests and responses:

```typescript
@Injectable()
export class LoggingInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    console.log(`Request: ${request.method} ${request.url}`);

    return next.handle().then((data) => {
      console.log(`Response:`, data);
      return data;
    });
  }
}
```

## Creating an Interceptor

### Step 1: Create the Interceptor Class

```typescript
// transform.interceptor.ts
import { Injectable } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';

@Injectable()
export class TransformInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    // Code before route handler

    return next.handle().then((data) => {
      // Code after route handler
      // Transform the response
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    });
  }
}
```

### Step 2: Register in Module

```typescript
// app.module.ts
import { Module } from 'han-prev-core';
import { UserController } from './user.controller';
import { TransformInterceptor } from './interceptors/transform.interceptor';

@Module({
  controllers: [UserController],
  providers: [TransformInterceptor], // ✅ Register interceptor
})
export class AppModule {}
```

### Step 3: Apply to Routes

```typescript
// user.controller.ts
import { Controller, Get, UseInterceptors } from 'han-prev-core';
import { TransformInterceptor } from './interceptors/transform.interceptor';

@Controller('users')
export class UserController {
  @Get()
  @UseInterceptors(TransformInterceptor) // ✅ Apply interceptor
  findAll() {
    return [{ id: 1, name: 'John' }];
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": [{ "id": 1, "name": "John" }],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Common Interceptor Examples

### 1. Response Transformation

Wrap all responses in a standard format:

```typescript
import { Injectable } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';

@Injectable()
export class TransformInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().then((data) => {
      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
        path: context.switchToHttp().getRequest().url,
      };
    });
  }
}
```

### 2. Logging Interceptor

Log request and response details:

```typescript
import { Injectable } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';

@Injectable()
export class LoggingInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const now = Date.now();

    console.log(`→ ${method} ${url}`);
    if (Object.keys(body || {}).length > 0) {
      console.log(`  Body:`, body);
    }

    return next.handle().then((data) => {
      const duration = Date.now() - now;

      console.log(`← ${method} ${url} - ${duration}ms`);
      console.log(`  Response:`, data);

      return data;
    });
  }
}
```

### 3. Error Handling Interceptor

Transform exceptions into user-friendly errors:

```typescript
import { Injectable } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';

@Injectable()
export class ErrorInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().catch((error) => {
      const response = context.switchToHttp().getResponse();

      // Determine status code
      const statusCode = error.statusCode || 500;

      // Create user-friendly error response
      const errorResponse = {
        success: false,
        error: {
          message: error.message || 'Something went wrong',
          code: error.code || 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
      };

      response.status(statusCode).json(errorResponse);
      return null;
    });
  }
}
```

### 4. Caching Interceptor

Cache responses for improved performance:

```typescript
import { Injectable } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';

@Injectable()
export class CacheInterceptor implements HanInterceptor {
  private cache = new Map<string, any>();
  private cacheTTL = 60000; // 1 minute

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = request.url;

    // Check if cached
    if (this.cache.has(cacheKey)) {
      console.log(`Cache HIT: ${cacheKey}`);
      return Promise.resolve(this.cache.get(cacheKey));
    }

    console.log(`Cache MISS: ${cacheKey}`);

    // Execute handler and cache result
    return next.handle().then((data) => {
      this.cache.set(cacheKey, data);

      // Clear cache after TTL
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, this.cacheTTL);

      return data;
    });
  }
}
```

### 5. Timeout Interceptor

Automatically timeout long-running requests:

```typescript
import { Injectable } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';

@Injectable()
export class TimeoutInterceptor implements HanInterceptor {
  private timeout = 5000; // 5 seconds

  intercept(context: ExecutionContext, next: CallHandler) {
    return Promise.race([
      next.handle(),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout'));
        }, this.timeout);
      }),
    ]);
  }
}
```

### 6. Exclude Null Values

Remove null/undefined values from responses:

```typescript
import { Injectable } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';

@Injectable()
export class ExcludeNullInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().then((data) => {
      return this.removeNullValues(data);
    });
  }

  private removeNullValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return undefined;
    }

    if (Array.isArray(obj)) {
      return obj
        .map((item) => this.removeNullValues(item))
        .filter((item) => item !== undefined);
    }

    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        const value = this.removeNullValues(obj[key]);
        if (value !== undefined) {
          cleaned[key] = value;
        }
      }
      return cleaned;
    }

    return obj;
  }
}
```

**Before:**
```json
{
  "id": 1,
  "name": "John",
  "email": null,
  "phone": undefined
}
```

**After:**
```json
{
  "id": 1,
  "name": "John"
}
```

### 7. Pagination Interceptor

Add pagination metadata:

```typescript
import { Injectable, SetMetadata } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';

export const Paginate = () => SetMetadata('paginate', true);

@Injectable()
export class PaginationInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const shouldPaginate = Reflect.getMetadata('paginate', context.getHandler());

    if (!shouldPaginate) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;

    return next.handle().then((data) => {
      // Assume data is an array
      const total = data.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = data.slice(startIndex, endIndex);

      return {
        data: paginatedData,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: endIndex < total,
          hasPrev: page > 1,
        },
      };
    });
  }
}
```

Usage:

```typescript
@Controller('users')
export class UserController {
  @Get()
  @UseInterceptors(PaginationInterceptor)
  @Paginate()
  findAll() {
    return this.userService.findAll();
  }
}
```

**Request:** `GET /users?page=2&limit=5`

**Response:**
```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 5,
    "total": 100,
    "totalPages": 20,
    "hasNext": true,
    "hasPrev": true
  }
}
```

### 8. Performance Monitoring

Track response times and add performance headers:

```typescript
import { Injectable } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';

@Injectable()
export class PerformanceInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const start = process.hrtime();

    return next.handle().then((data) => {
      const diff = process.hrtime(start);
      const time = diff[0] * 1e3 + diff[1] * 1e-6;

      // Add performance headers
      response.setHeader('X-Response-Time', `${time.toFixed(2)}ms`);
      response.setHeader('X-Request-ID', request.id || 'unknown');

      // Log slow requests
      if (time > 1000) {
        console.warn(`Slow request: ${request.method} ${request.url} - ${time.toFixed(2)}ms`);
      }

      return data;
    });
  }
}
```

## Applying Interceptors

### 1. Route-Level Interceptors

Apply to specific routes:

```typescript
@Controller('users')
export class UserController {
  @Get()
  @UseInterceptors(TransformInterceptor) // ✅ Only this route
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id); // No interceptor
  }
}
```

### 2. Controller-Level Interceptors

Apply to all routes in controller:

```typescript
@Controller('users')
@UseInterceptors(TransformInterceptor) // ✅ All routes
export class UserController {
  @Get()       // Has interceptor
  findAll() {}

  @Get(':id')  // Has interceptor
  findOne() {}
}
```

### 3. Global Interceptors

Apply to all routes in application:

```typescript
// index.ts
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './interceptors/transform.interceptor';

const app = await HanFactory.create(AppModule);

// Global interceptor
app.useGlobalInterceptors(new TransformInterceptor());

await app.listen(3000);
```

### 4. Multiple Interceptors

Chain multiple interceptors:

```typescript
@Controller('users')
export class UserController {
  @Get()
  @UseInterceptors(
    LoggingInterceptor,
    CacheInterceptor,
    TransformInterceptor,
  )
  findAll() {
    return this.userService.findAll();
  }
}
```

Execution order:
```
Request
  ↓
LoggingInterceptor (before)
  ↓
CacheInterceptor (before)
  ↓
TransformInterceptor (before)
  ↓
Route Handler
  ↓
TransformInterceptor (after)
  ↓
CacheInterceptor (after)
  ↓
LoggingInterceptor (after)
  ↓
Response
```

## Interceptors with Dependencies

Inject services into interceptors:

```typescript
import { Injectable, Inject } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';
import { LoggerService } from '../services/logger.service';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class MonitoringInterceptor implements HanInterceptor {
  constructor(
    private logger: LoggerService,
    private metrics: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    this.logger.log(`Request started: ${request.method} ${request.url}`);

    return next.handle().then((data) => {
      const duration = Date.now() - start;

      this.logger.log(`Request completed: ${request.method} ${request.url} - ${duration}ms`);
      this.metrics.recordRequest(request.method, request.url, duration);

      return data;
    });
  }
}
```

## Async Interceptors

Handle asynchronous operations:

```typescript
@Injectable()
export class AsyncTransformInterceptor implements HanInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();

    // Async operation before handler
    const metadata = await this.fetchMetadata(request.user?.id);

    return next.handle().then(async (data) => {
      // Async operation after handler
      await this.logToDatabase(request, data);

      return {
        data,
        metadata,
        timestamp: new Date().toISOString(),
      };
    });
  }

  private async fetchMetadata(userId: string) {
    // Async database call
    return { userId, preferences: {} };
  }

  private async logToDatabase(request: any, data: any) {
    // Async logging
  }
}
```

## Real-World Example: API Response Standardization

Complete interceptor setup for a REST API:

### Standard Response Interceptor

```typescript
// interceptors/standard-response.interceptor.ts
import { Injectable } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';

@Injectable()
export class StandardResponseInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();

    return next.handle().then((data) => {
      return {
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
        },
      };
    });
  }
}
```

### Error Standardization Interceptor

```typescript
// interceptors/error-standardization.interceptor.ts
import { Injectable } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';

@Injectable()
export class ErrorStandardizationInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().catch((error) => {
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();

      const statusCode = error.statusCode || 500;
      const errorResponse = {
        success: false,
        error: {
          message: error.message || 'Internal server error',
          code: error.code || 'INTERNAL_ERROR',
          details: error.details || null,
        },
        meta: {
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
        },
      };

      response.status(statusCode).json(errorResponse);
      return null;
    });
  }
}
```

### Usage

```typescript
// app.module.ts
import { Module } from 'han-prev-core';
import { StandardResponseInterceptor } from './interceptors/standard-response.interceptor';
import { ErrorStandardizationInterceptor } from './interceptors/error-standardization.interceptor';

@Module({
  providers: [
    StandardResponseInterceptor,
    ErrorStandardizationInterceptor,
  ],
})
export class AppModule {}

// index.ts
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';
import { StandardResponseInterceptor } from './interceptors/standard-response.interceptor';
import { ErrorStandardizationInterceptor } from './interceptors/error-standardization.interceptor';

const app = await HanFactory.create(AppModule);

app.useGlobalInterceptors(
  new ErrorStandardizationInterceptor(),
  new StandardResponseInterceptor(),
);

await app.listen(3000);
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/users/1",
    "method": "GET"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND",
    "details": null
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/users/999",
    "method": "GET"
  }
}
```

## Best Practices

### 1. Return Data or Promise

Always return data or Promise:

```typescript
// ✅ Good
@Injectable()
export class MyInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().then((data) => {
      return data; // or transformed data
    });
  }
}

// ❌ Bad
@Injectable()
export class MyInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    next.handle(); // No return!
  }
}
```

### 2. Single Responsibility

One interceptor, one purpose:

```typescript
// ✅ Good - Separate interceptors
export class LoggingInterceptor {} // Logging
export class TransformInterceptor {} // Transformation
export class CacheInterceptor {} // Caching

// ❌ Bad - Too many responsibilities
export class MegaInterceptor {
  // Logging + Transformation + Caching + More
}
```

### 3. Handle Errors Gracefully

```typescript
// ✅ Good
@Injectable()
export class SafeInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().catch((error) => {
      console.error('Error:', error);
      // Handle error appropriately
      throw error; // or return default value
    });
  }
}
```

### 4. Use Metadata for Configuration

```typescript
// ✅ Good - Configurable
export const CacheTTL = (ttl: number) => SetMetadata('cache_ttl', ttl);

@Get()
@CacheTTL(60000) // 1 minute
findAll() {}

// ❌ Bad - Hardcoded
export class Cache60SecInterceptor {}
export class Cache120SecInterceptor {}
```

### 5. Order Matters

```typescript
// ✅ Good - Logical order
@UseInterceptors(
  ErrorHandlingInterceptor,  // Handle errors first
  LoggingInterceptor,        // Log everything
  TransformInterceptor,      // Transform last
)

// ❌ Bad - Illogical order
@UseInterceptors(
  TransformInterceptor,      // Transform too early
  ErrorHandlingInterceptor,  // Can't handle transform errors
)
```

## Testing Interceptors

Interceptors are easy to test:

```typescript
import { TransformInterceptor } from './transform.interceptor';
import { ExecutionContext, CallHandler } from 'han-prev-common';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor;
  let mockContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new TransformInterceptor();

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          url: '/users',
          method: 'GET',
        }),
      }),
    } as any;

    mockCallHandler = {
      handle: () => Promise.resolve({ id: 1, name: 'John' }),
    } as any;
  });

  it('should transform response', async () => {
    const result = await interceptor.intercept(mockContext, mockCallHandler);

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('timestamp');
  });

  it('should include original data', async () => {
    const result = await interceptor.intercept(mockContext, mockCallHandler);

    expect(result.data).toEqual({ id: 1, name: 'John' });
  });
});
```

## Generating Interceptors

Use the CLI to generate interceptors:

```bash
han generate interceptor transform
```

Creates `src/interceptors/transform.interceptor.ts`:

```typescript
import { Injectable } from 'han-prev-core';
import { HanInterceptor, ExecutionContext, CallHandler } from 'han-prev-common';

@Injectable()
export class TransformInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().then((data) => {
      return data;
    });
  }
}
```

## Next Steps

- Learn about [Pipes](/fundamentals/pipes) for data transformation and validation
- Explore [Guards](/fundamentals/guards) for authorization logic
- Check out [Middleware](/fundamentals/middleware) for request processing

## Quick Reference

```typescript
// 1. Create interceptor
@Injectable()
export class MyInterceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    // Before handler
    return next.handle().then((data) => {
      // After handler
      return transformedData;
    });
  }
}

// 2. Register in module
@Module({
  providers: [MyInterceptor],
})
export class MyModule {}

// 3. Apply to route
@Get()
@UseInterceptors(MyInterceptor)
findAll() {}

// 4. Apply to controller
@Controller('users')
@UseInterceptors(MyInterceptor)
export class UserController {}

// 5. Apply globally
app.useGlobalInterceptors(new MyInterceptor());
```

Interceptors give you powerful control over the request-response cycle! ⚡
