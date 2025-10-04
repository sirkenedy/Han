# Middleware

Middleware functions are executed **before** your route handlers, allowing you to process requests, modify responses, perform authentication, logging, and more.

## What is Middleware?

Middleware is a function that has access to the request, response, and next middleware in the application's request-response cycle.

```typescript
function middleware(req, res, next) {
  // Do something before route handler
  console.log('Request received');

  next(); // Pass control to next middleware
}
```

## Creating Middleware

### Function Middleware (Simplest)

```typescript
const logger = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
};
```

### Class-Based Middleware (Recommended)

```typescript
import { Injectable } from 'han-prev-core';
import { HanMiddleware, MiddlewareFunction } from 'han-prev-common';

@Injectable()
export class LoggerMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    };
  }
}
```

## Applying Middleware

### 1. Global Middleware (All Routes)

Apply to every request in your application:

```typescript
// index.ts
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';

const app = await HanFactory.create(AppModule);
const expressApp = app.getHttpServer();

// Global middleware
expressApp.use((req, res, next) => {
  console.log('Global middleware');
  next();
});

await app.listen(3000);
```

### 2. Route-Level Middleware

Apply to specific routes:

```typescript
import { Controller, Get, UseMiddleware } from 'han-prev-core';
import { AuthMiddleware } from './middleware/auth.middleware';

@Controller('users')
export class UserController {
  @Get()
  findAll() {
    return ['User 1', 'User 2'];
  }

  @Post()
  @UseMiddleware(AuthMiddleware) // ✅ Only this route
  create() {
    return { created: true };
  }
}
```

### 3. Controller-Level Middleware

Apply to all routes in a controller:

```typescript
@Controller('admin')
@UseMiddleware(AuthMiddleware) // ✅ All routes in controller
export class AdminController {
  @Get('users')     // Protected
  getUsers() {}

  @Get('settings')  // Protected
  getSettings() {}
}
```

### 4. Module-Level Middleware

Configure middleware at module level for fine-grained control:

```typescript
import { Module, HanModule, MiddlewareConsumer } from 'han-prev-core';
import { UserController } from './user.controller';
import { AuthMiddleware } from './middleware/auth.middleware';

@Module({
  controllers: [UserController],
  providers: [AuthMiddleware],
})
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude('users/login', 'users/register')
      .forRoutes(UserController);
  }
}
```

Learn more: [Module Middleware →](/techniques/module-middleware)

## Common Middleware Examples

### 1. Logger Middleware

Log all incoming requests:

```typescript
import { Injectable } from 'han-prev-core';
import { HanMiddleware, MiddlewareFunction } from 'han-prev-common';

@Injectable()
export class LoggerMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      const start = Date.now();

      // Log when response is finished
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log({
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString(),
        });
      });

      next();
    };
  }
}
```

### 2. Authentication Middleware

Verify user authentication:

```typescript
import { Injectable } from 'han-prev-core';
import { HanMiddleware, MiddlewareFunction } from 'han-prev-common';

@Injectable()
export class AuthMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No token provided',
        });
      }

      try {
        // Verify token (pseudo-code)
        const user = this.verifyToken(token);
        req.user = user;
        next();
      } catch (error) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token',
        });
      }
    };
  }

  private verifyToken(token: string) {
    // JWT verification logic
    return { id: 1, email: 'user@example.com' };
  }
}
```

### 3. CORS Middleware

Enable Cross-Origin Resource Sharing:

```typescript
@Injectable()
export class CorsMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    };
  }
}
```

:::tip Built-in CORS
Han Framework has built-in CORS support:
```typescript
const app = await HanFactory.create(AppModule, {
  cors: true, // or { origin: 'https://example.com' }
});
```
:::

### 4. Rate Limiting Middleware

Prevent API abuse:

```typescript
@Injectable()
export class RateLimitMiddleware implements HanMiddleware {
  private requests = new Map<string, number[]>();

  use(): MiddlewareFunction {
    return (req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute window
      const maxRequests = 100;

      // Get request times for this IP
      const requestTimes = this.requests.get(ip) || [];

      // Filter out old requests
      const recentRequests = requestTimes.filter(
        time => now - time < windowMs
      );

      // Check if limit exceeded
      if (recentRequests.length >= maxRequests) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Try again later.',
          retryAfter: Math.ceil(windowMs / 1000),
        });
      }

      // Add current request
      recentRequests.push(now);
      this.requests.set(ip, recentRequests);

      next();
    };
  }
}
```

### 5. Request Validation Middleware

Validate request body:

```typescript
@Injectable()
export class ValidationMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      const { body } = req;

      // Check required fields
      if (!body.email || !body.password) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Email and password are required',
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid email format',
        });
      }

      // Validate password length
      if (body.password.length < 8) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Password must be at least 8 characters',
        });
      }

      next();
    };
  }
}
```

### 6. Request ID Middleware

Add unique ID to each request:

```typescript
@Injectable()
export class RequestIdMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      const requestId = this.generateId();
      req.id = requestId;
      res.setHeader('X-Request-ID', requestId);
      next();
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### 7. Response Time Middleware

Track response times:

```typescript
@Injectable()
export class ResponseTimeMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      const start = process.hrtime();

      res.on('finish', () => {
        const diff = process.hrtime(start);
        const time = diff[0] * 1e3 + diff[1] * 1e-6;
        res.setHeader('X-Response-Time', `${time.toFixed(2)}ms`);
      });

      next();
    };
  }
}
```

## Middleware with Dependencies

Inject services into middleware:

```typescript
import { Injectable, Inject } from 'han-prev-core';
import { HanMiddleware, MiddlewareFunction } from 'han-prev-common';

@Injectable()
export class AuditMiddleware implements HanMiddleware {
  constructor(
    @Inject('LogService')
    private logService: LogService,
  ) {}

  use(): MiddlewareFunction {
    return async (req, res, next) => {
      await this.logService.log({
        method: req.method,
        path: req.path,
        user: req.user?.id,
        timestamp: new Date(),
      });
      next();
    };
  }
}
```

## Async Middleware

Handle asynchronous operations:

```typescript
@Injectable()
export class DatabaseMiddleware implements HanMiddleware {
  constructor(private dbService: DatabaseService) {}

  use(): MiddlewareFunction {
    return async (req, res, next) => {
      try {
        const user = await this.dbService.findUser(req.user.id);
        req.userData = user;
        next();
      } catch (error) {
        res.status(500).json({ error: 'Database error' });
      }
    };
  }
}
```

## Middleware Execution Order

Middleware executes in this order:

```
1. Global Middleware (app.use)
     ↓
2. Module Middleware (configure)
     ↓
3. Controller Middleware (@UseMiddleware on controller)
     ↓
4. Route Middleware (@UseMiddleware on method)
     ↓
5. Route Handler (your method)
```

Example:

```typescript
// 1. Global
app.use(globalLogger);

// 2. Module
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ModuleAuth).forRoutes(UserController);
  }
}

// 3. Controller
@Controller('users')
@UseMiddleware(ControllerCache)
export class UserController {
  // 4. Route
  @Get()
  @UseMiddleware(RouteValidation)
  findAll() {
    // 5. Finally executed!
  }
}
```

## Multiple Middleware

Apply multiple middleware to a route:

```typescript
@Controller('users')
export class UserController {
  @Post()
  @UseMiddleware(AuthMiddleware, ValidationMiddleware, RateLimitMiddleware)
  create(@Body() data: any) {
    return { created: true };
  }
}
```

They execute in order: Auth → Validation → RateLimit → Route Handler

## Error Handling in Middleware

```typescript
@Injectable()
export class ErrorMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      try {
        // Risky operation
        this.validateRequest(req);
        next();
      } catch (error) {
        res.status(400).json({
          error: 'Bad Request',
          message: error.message,
        });
      }
    };
  }
}
```

## Conditional Middleware

Execute middleware based on conditions:

```typescript
@Injectable()
export class ConditionalMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      // Only apply to POST requests
      if (req.method === 'POST') {
        // Do something
        console.log('POST request detected');
      }

      // Only apply to specific paths
      if (req.path.startsWith('/admin')) {
        // Check admin privileges
      }

      next();
    };
  }
}
```

## Generating Middleware

Use the CLI to generate middleware:

```bash
han generate middleware logger
```

Creates `src/middleware/logger.middleware.ts`:

```typescript
import { Injectable } from 'han-prev-core';
import { HanMiddleware, MiddlewareFunction } from 'han-prev-common';

@Injectable()
export class LoggerMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req: any, res: any, next: any) => {
      console.log('LoggerMiddleware executing...');
      next();
    };
  }
}
```

## Best Practices

### 1. Always Call next()

```typescript
// ✅ Good
use(): MiddlewareFunction {
  return (req, res, next) => {
    console.log('Processing...');
    next(); // ✅ Always call next
  };
}

// ❌ Bad - Request hangs
use(): MiddlewareFunction {
  return (req, res, next) => {
    console.log('Processing...');
    // ❌ Forgot to call next()
  };
}
```

### 2. Order Matters

```typescript
// ✅ Good - Auth before business logic
@UseMiddleware(AuthMiddleware, ValidationMiddleware, BusinessLogicMiddleware)

// ❌ Bad - Business logic before auth
@UseMiddleware(BusinessLogicMiddleware, AuthMiddleware)
```

### 3. Keep Middleware Focused

```typescript
// ✅ Good - Single responsibility
export class AuthMiddleware {
  // Only handles authentication
}

export class LoggerMiddleware {
  // Only handles logging
}

// ❌ Bad - Too many responsibilities
export class MegaMiddleware {
  // Auth + Logging + Validation + More
}
```

### 4. Use Dependency Injection

```typescript
// ✅ Good - Inject dependencies
@Injectable()
export class AuthMiddleware {
  constructor(private authService: AuthService) {}
}

// ❌ Avoid - Creating dependencies manually
export class AuthMiddleware {
  authService = new AuthService(); // Hard to test
}
```

### 5. Handle Errors Gracefully

```typescript
// ✅ Good
use(): MiddlewareFunction {
  return async (req, res, next) => {
    try {
      await this.validateToken(req.headers.authorization);
      next();
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
```

## Common Use Cases

### When to Use Each Level

| Level | Use Case | Example |
|-------|----------|---------|
| **Global** | Apply to every request | CORS, Body Parser, Helmet |
| **Module** | Apply to module routes | Auth for user module |
| **Controller** | Apply to all controller routes | Logging for admin controller |
| **Route** | Apply to specific route | Validation for POST endpoint |

### Performance Middleware

```typescript
@Injectable()
export class CompressionMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      // Enable compression for responses
      res.setHeader('Content-Encoding', 'gzip');
      next();
    };
  }
}
```

### Security Middleware

```typescript
@Injectable()
export class SecurityMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    };
  }
}
```

:::tip Built-in Security
Han Framework includes Helmet for security:
```typescript
const app = await HanFactory.create(AppModule, {
  helmet: true,
});
```
:::

## Testing Middleware

```typescript
describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    middleware = new AuthMiddleware();
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('should reject request without token', () => {
    const fn = middleware.use();
    fn(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should pass with valid token', () => {
    mockReq.headers.authorization = 'Bearer valid-token';

    const fn = middleware.use();
    fn(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});
```

## Next Steps

- Learn about [Guards](/fundamentals/guards) for authorization logic
- Explore [Interceptors](/fundamentals/interceptors) for response transformation
- Check out [Module Middleware](/techniques/module-middleware) for advanced configuration
- See [Pipes](/fundamentals/pipes) for data transformation

## Quick Reference

```typescript
// 1. Create middleware
@Injectable()
export class MyMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      // Your logic
      next();
    };
  }
}

// 2. Apply to route
@Get()
@UseMiddleware(MyMiddleware)
findAll() {}

// 3. Apply to controller
@Controller('users')
@UseMiddleware(MyMiddleware)
export class UserController {}

// 4. Apply to module
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MyMiddleware).forRoutes(UserController);
  }
}
```

Middleware is powerful! Use it wisely to keep your application clean, secure, and maintainable. 🚀
