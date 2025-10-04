# Exception Filters

Exception filters are specialized components that handle **errors and exceptions** throughout your application. They catch exceptions thrown by route handlers, guards, pipes, or interceptors, and transform them into proper HTTP responses.

## What are Exception Filters?

Exception filters are classes that implement the `ExceptionFilter` interface. They catch exceptions and decide how to respond to the client:

```typescript
import { Injectable } from 'han-prev-core';
import { ExceptionFilter, Catch } from 'han-prev-common';

@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: any) {
    const response = host.switchToHttp().getResponse();
    const request = host.switchToHttp().getRequest();

    response.status(500).json({
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message || 'Internal server error',
    });
  }
}
```

## Request Flow with Exception Filters

Understanding when exception filters execute:

```
Request
  ↓
Middleware
  ↓
Guards
  ↓
Pipes
  ↓
Route Handler
  ↓
Interceptors
  ↓
Exception Filters ← Catch errors from any layer
  ↓
Response (Error)
```

## Why Use Exception Filters?

### 1. Centralized Error Handling

Handle all errors in one place instead of repeating try-catch blocks:

```typescript
// ❌ Without filter - Repetitive error handling
@Controller('users')
export class UserController {
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.userService.findById(id);
    } catch (error) {
      return {
        statusCode: 404,
        message: 'User not found',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post()
  async create(@Body() data: any) {
    try {
      return await this.userService.create(data);
    } catch (error) {
      return {
        statusCode: 400,
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// ✅ With filter - Clean controllers
@Controller('users')
@UseFilters(HttpExceptionFilter)
export class UserController {
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id); // Filter catches errors
  }

  @Post()
  create(@Body() data: any) {
    return this.userService.create(data); // Filter catches errors
  }
}
```

### 2. Consistent Error Responses

Ensure all errors follow the same format:

```typescript
// All errors return:
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User with ID 123 not found",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Logging and Monitoring

Automatically log all exceptions:

```typescript
@Injectable()
@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: any) {
    console.error('Exception caught:', exception);
    // Send to monitoring service
    // Log to database
    // Send alert
  }
}
```

## Creating an Exception Filter

### Step 1: Create the Filter Class

```typescript
// http-exception.filter.ts
import { Injectable } from 'han-prev-core';
import { ExceptionFilter, Catch } from 'han-prev-common';

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: any) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.statusCode || 500;
    const message = exception.message || 'Internal server error';

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message: message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
```

### Step 2: Register in Module

```typescript
// app.module.ts
import { Module } from 'han-prev-core';
import { UserController } from './user.controller';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Module({
  controllers: [UserController],
  providers: [HttpExceptionFilter], // ✅ Register filter
})
export class AppModule {}
```

### Step 3: Apply to Routes

```typescript
// user.controller.ts
import { Controller, Get, UseFilters } from 'han-prev-core';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Controller('users')
export class UserController {
  @Get(':id')
  @UseFilters(HttpExceptionFilter) // ✅ Apply filter
  findOne(@Param('id') id: string) {
    if (!id) {
      throw new Error('User ID is required');
    }
    return this.userService.findById(id);
  }
}
```

## Custom Exception Classes

Create custom exception classes for better error handling:

### HttpException

```typescript
// exceptions/http-exception.ts
export class HttpException extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'HttpException';
  }
}
```

### Specific Exception Classes

```typescript
// exceptions/not-found.exception.ts
export class NotFoundException extends HttpException {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;

    super(message, 404, 'NOT_FOUND');
  }
}

// exceptions/bad-request.exception.ts
export class BadRequestException extends HttpException {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
  }
}

// exceptions/unauthorized.exception.ts
export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// exceptions/forbidden.exception.ts
export class ForbiddenException extends HttpException {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

// exceptions/conflict.exception.ts
export class ConflictException extends HttpException {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
```

### Usage

```typescript
@Injectable()
export class UserService {
  findById(id: string) {
    const user = this.users.find(u => u.id === id);

    if (!user) {
      throw new NotFoundException('User', id);
    }

    return user;
  }

  create(email: string) {
    const existing = this.users.find(u => u.email === email);

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    return this.createUser(email);
  }
}
```

## Common Exception Filter Examples

### 1. Standard HTTP Exception Filter

Handle HTTP exceptions with proper status codes:

```typescript
import { Injectable } from 'han-prev-core';
import { ExceptionFilter, Catch } from 'han-prev-common';
import { HttpException } from '../exceptions/http-exception';

@Injectable()
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: any) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    response.status(exception.statusCode).json({
      success: false,
      error: {
        code: exception.code || 'HTTP_ERROR',
        message: exception.message,
        statusCode: exception.statusCode,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
```

### 2. Validation Exception Filter

Handle validation errors:

```typescript
import { Injectable } from 'han-prev-core';
import { ExceptionFilter, Catch } from 'han-prev-common';

export class ValidationException extends Error {
  constructor(public errors: Record<string, string[]>) {
    super('Validation failed');
    this.name = 'ValidationException';
  }
}

@Injectable()
@Catch(ValidationException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: any) {
    const response = host.switchToHttp().getResponse();
    const request = host.switchToHttp().getRequest();

    response.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        fields: exception.errors,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
```

Usage:

```typescript
@Post()
create(@Body() data: any) {
  const errors: Record<string, string[]> = {};

  if (!data.email) {
    errors.email = ['Email is required'];
  }
  if (!data.password || data.password.length < 8) {
    errors.password = ['Password must be at least 8 characters'];
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationException(errors);
  }

  return this.userService.create(data);
}
```

**Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "fields": {
      "email": ["Email is required"],
      "password": ["Password must be at least 8 characters"]
    },
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/users"
  }
}
```

### 3. Database Exception Filter

Handle database errors:

```typescript
import { Injectable } from 'han-prev-core';
import { ExceptionFilter, Catch } from 'han-prev-common';

@Injectable()
@Catch()
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: any) {
    const response = host.switchToHttp().getResponse();
    const request = host.switchToHttp().getRequest();

    let statusCode = 500;
    let message = 'Database error';
    let code = 'DATABASE_ERROR';

    // Mongoose duplicate key error
    if (exception.code === 11000) {
      statusCode = 409;
      message = 'Duplicate entry';
      code = 'DUPLICATE_KEY';
    }

    // Mongoose validation error
    if (exception.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
      code = 'VALIDATION_ERROR';
    }

    // Mongoose cast error (invalid ID)
    if (exception.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid ID format';
      code = 'INVALID_ID';
    }

    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
```

### 4. All Exceptions Filter

Catch all unhandled exceptions:

```typescript
import { Injectable } from 'han-prev-core';
import { ExceptionFilter, Catch } from 'han-prev-common';

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: any) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.statusCode || 500;
    const message = exception.message || 'Internal server error';

    // Log the error
    console.error({
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: exception.stack || exception,
    });

    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message: isDevelopment ? message : 'An error occurred',
        timestamp: new Date().toISOString(),
        path: request.url,
        ...(isDevelopment && { stack: exception.stack }),
      },
    });
  }
}
```

### 5. Logging Exception Filter

Log all exceptions to monitoring service:

```typescript
import { Injectable } from 'han-prev-core';
import { ExceptionFilter, Catch } from 'han-prev-common';

@Injectable()
@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggerService) {}

  catch(exception: any, host: any) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.statusCode || 500;

    // Log to console
    this.logger.error({
      message: exception.message,
      stack: exception.stack,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });

    // Send to external monitoring (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(exception, request);
    }

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        message: exception.message || 'Internal server error',
        timestamp: new Date().toISOString(),
      },
    });
  }

  private sendToMonitoring(exception: any, request: any) {
    // Send to Sentry, Datadog, etc.
  }
}
```

### 6. Rate Limit Exception Filter

Handle rate limiting errors:

```typescript
import { Injectable } from 'han-prev-core';
import { ExceptionFilter, Catch } from 'han-prev-common';

export class RateLimitException extends Error {
  constructor(public retryAfter: number) {
    super('Too many requests');
    this.name = 'RateLimitException';
  }
}

@Injectable()
@Catch(RateLimitException)
export class RateLimitExceptionFilter implements ExceptionFilter {
  catch(exception: RateLimitException, host: any) {
    const response = host.switchToHttp().getResponse();
    const request = host.switchToHttp().getRequest();

    response
      .status(429)
      .header('Retry-After', String(exception.retryAfter))
      .json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: exception.retryAfter,
          timestamp: new Date().toISOString(),
          path: request.url,
        },
      });
  }
}
```

### 7. Authentication Exception Filter

Handle authentication errors:

```typescript
import { Injectable } from 'han-prev-core';
import { ExceptionFilter, Catch } from 'han-prev-common';
import { UnauthorizedException } from '../exceptions/unauthorized.exception';

@Injectable()
@Catch(UnauthorizedException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: UnauthorizedException, host: any) {
    const response = host.switchToHttp().getResponse();
    const request = host.switchToHttp().getRequest();

    response.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: exception.message,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
      meta: {
        loginUrl: '/auth/login',
        registerUrl: '/auth/register',
      },
    });
  }
}
```

## Applying Exception Filters

### 1. Route-Level Filters

Apply to specific routes:

```typescript
@Controller('users')
export class UserController {
  @Get(':id')
  @UseFilters(HttpExceptionFilter) // ✅ Only this route
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Get()
  findAll() {
    return this.userService.findAll(); // No filter
  }
}
```

### 2. Controller-Level Filters

Apply to all routes in controller:

```typescript
@Controller('users')
@UseFilters(HttpExceptionFilter) // ✅ All routes
export class UserController {
  @Get(':id')    // Has filter
  findOne() {}

  @Post()        // Has filter
  create() {}
}
```

### 3. Global Filters

Apply to all routes in application:

```typescript
// index.ts
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';

const app = await HanFactory.create(AppModule);

// Global filter
app.useGlobalFilters(new AllExceptionsFilter());

await app.listen(3000);
```

### 4. Multiple Filters

Chain multiple filters for specific exceptions:

```typescript
@Controller('users')
@UseFilters(
  HttpExceptionFilter,
  ValidationExceptionFilter,
  DatabaseExceptionFilter,
)
export class UserController {
  @Post()
  create(@Body() data: any) {
    return this.userService.create(data);
  }
}
```

Filters are tried in order until one matches the exception type.

## Filters with Dependencies

Inject services into filters:

```typescript
import { Injectable, Inject } from 'han-prev-core';
import { ExceptionFilter, Catch } from 'han-prev-common';
import { LoggerService } from '../services/logger.service';
import { NotificationService } from '../services/notification.service';

@Injectable()
@Catch()
export class MonitoringExceptionFilter implements ExceptionFilter {
  constructor(
    private logger: LoggerService,
    private notifications: NotificationService,
  ) {}

  catch(exception: any, host: any) {
    const request = host.switchToHttp().getRequest();
    const response = host.switchToHttp().getResponse();

    // Log error
    this.logger.error({
      message: exception.message,
      stack: exception.stack,
      path: request.url,
    });

    // Send alert for 500 errors
    if (exception.statusCode >= 500) {
      this.notifications.sendAlert({
        title: 'Server Error',
        message: exception.message,
        severity: 'critical',
      });
    }

    response.status(exception.statusCode || 500).json({
      success: false,
      error: {
        message: exception.message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
```

## Real-World Example: E-commerce API

Complete exception handling for an e-commerce platform:

### Custom Exceptions

```typescript
// exceptions/product-not-found.exception.ts
export class ProductNotFoundException extends HttpException {
  constructor(productId: string) {
    super(`Product ${productId} not found`, 404, 'PRODUCT_NOT_FOUND');
  }
}

// exceptions/insufficient-stock.exception.ts
export class InsufficientStockException extends HttpException {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`,
      400,
      'INSUFFICIENT_STOCK',
    );
  }
}

// exceptions/payment-failed.exception.ts
export class PaymentFailedException extends HttpException {
  constructor(public reason: string) {
    super(`Payment failed: ${reason}`, 402, 'PAYMENT_FAILED');
  }
}
```

### Exception Filter

```typescript
// filters/ecommerce-exception.filter.ts
import { Injectable } from 'han-prev-core';
import { ExceptionFilter, Catch } from 'han-prev-common';
import { HttpException } from '../exceptions/http-exception';

@Injectable()
@Catch(HttpException)
export class EcommerceExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: any) {
    const response = host.switchToHttp().getResponse();
    const request = host.switchToHttp().getRequest();

    const errorResponse = {
      success: false,
      error: {
        code: exception.code,
        message: exception.message,
        statusCode: exception.statusCode,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    // Add helpful hints for common errors
    if (exception.code === 'PRODUCT_NOT_FOUND') {
      errorResponse.error['hint'] = 'Check if the product ID is correct or browse our catalog';
    }

    if (exception.code === 'INSUFFICIENT_STOCK') {
      errorResponse.error['hint'] = 'Try reducing the quantity or check back later';
    }

    if (exception.code === 'PAYMENT_FAILED') {
      errorResponse.error['hint'] = 'Please check your payment details and try again';
    }

    response.status(exception.statusCode).json(errorResponse);
  }
}
```

### Usage in Service

```typescript
// order.service.ts
@Injectable()
export class OrderService {
  async createOrder(items: OrderItem[]) {
    // Check stock
    for (const item of items) {
      const product = await this.productService.findById(item.productId);

      if (!product) {
        throw new ProductNotFoundException(item.productId);
      }

      if (product.stock < item.quantity) {
        throw new InsufficientStockException(
          item.productId,
          item.quantity,
          product.stock,
        );
      }
    }

    // Process payment
    try {
      await this.paymentService.charge(total);
    } catch (error) {
      throw new PaymentFailedException(error.message);
    }

    return this.createOrderRecord(items);
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for product ABC123. Requested: 5, Available: 2",
    "statusCode": 400,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/orders",
    "hint": "Try reducing the quantity or check back later"
  }
}
```

## Best Practices

### 1. Use Specific Exception Types

```typescript
// ✅ Good - Specific exceptions
throw new NotFoundException('User', id);
throw new BadRequestException('Invalid email format');
throw new UnauthorizedException();

// ❌ Bad - Generic errors
throw new Error('User not found');
throw new Error('Invalid request');
```

### 2. Catch Specific Exceptions

```typescript
// ✅ Good - Catch specific types
@Catch(HttpException)
export class HttpExceptionFilter {}

@Catch(ValidationException)
export class ValidationExceptionFilter {}

// ❌ Less specific
@Catch()
export class GenericFilter {}
```

### 3. Don't Expose Sensitive Information

```typescript
// ✅ Good - Safe error messages
response.json({
  error: {
    message: 'Authentication failed',
    code: 'UNAUTHORIZED',
  },
});

// ❌ Bad - Exposes internals
response.json({
  error: {
    message: exception.stack,
    database: 'mongodb://user:password@host',
  },
});
```

### 4. Log All Exceptions

```typescript
// ✅ Good
catch(exception: any, host: any) {
  this.logger.error('Exception occurred', exception);
  // Then respond to client
}
```

### 5. Different Responses for Environments

```typescript
// ✅ Good - Environment-aware
const isDev = process.env.NODE_ENV === 'development';

response.json({
  error: {
    message: exception.message,
    ...(isDev && { stack: exception.stack }),
  },
});
```

## Testing Exception Filters

```typescript
import { HttpExceptionFilter } from './http-exception.filter';
import { HttpException } from '../exceptions/http-exception';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/users/123',
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Not found', 404, 'NOT_FOUND');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({
        code: 'NOT_FOUND',
        message: 'Not found',
        statusCode: 404,
      }),
    });
  });
});
```

## Generating Exception Filters

Use the CLI to generate filters:

```bash
han generate filter http-exception
```

Creates `src/filters/http-exception.filter.ts`:

```typescript
import { Injectable } from 'han-prev-core';
import { ExceptionFilter, Catch } from 'han-prev-common';

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: any) {
    const response = host.switchToHttp().getResponse();

    response.status(500).json({
      message: exception.message || 'Internal server error',
    });
  }
}
```

## Next Steps

- Learn about [Middleware](/fundamentals/middleware) for request processing
- Explore [Guards](/fundamentals/guards) for authorization
- Check out [Interceptors](/fundamentals/interceptors) for response transformation

## Quick Reference

```typescript
// 1. Create custom exception
export class CustomException extends Error {
  constructor(public statusCode: number, public code: string) {
    super('Error message');
  }
}

// 2. Create filter
@Injectable()
@Catch(CustomException)
export class CustomFilter implements ExceptionFilter {
  catch(exception: CustomException, host: any) {
    const response = host.switchToHttp().getResponse();
    response.status(exception.statusCode).json({
      error: exception.message,
    });
  }
}

// 3. Register in module
@Module({
  providers: [CustomFilter],
})
export class AppModule {}

// 4. Apply to route
@Post()
@UseFilters(CustomFilter)
create() {}

// 5. Apply to controller
@Controller('users')
@UseFilters(CustomFilter)
export class UserController {}

// 6. Apply globally
app.useGlobalFilters(new CustomFilter());

// 7. Throw exception
throw new CustomException(404, 'NOT_FOUND');
```

Exception filters keep your error handling clean, consistent, and maintainable! 🛡️
