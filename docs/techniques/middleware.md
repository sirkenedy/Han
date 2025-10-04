# Middleware

Middleware functions are executed during the request-response cycle, allowing you to process requests before they reach route handlers. They're perfect for logging, authentication, request transformation, and more.

## What is Middleware?

Middleware is a function that has access to the request object, response object, and the next middleware function in the application's request-response cycle.

```typescript
function logger(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next(); // Pass control to next middleware
}
```

## Creating Middleware

### Function-Based Middleware

```typescript
// logger.middleware.ts
export function loggerMiddleware(req: any, res: any, next: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
}
```

### Class-Based Middleware

```typescript
import { Injectable, MiddlewareFunction } from 'han-prev-core';

@Injectable()
export class LoggerMiddleware implements MiddlewareFunction {
  use(req: any, res: any, next: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
  }
}
```

## Applying Middleware

### Global Middleware

Apply to all routes in your application:

```typescript
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';
import { loggerMiddleware } from './middleware/logger.middleware';

const app = await HanFactory.create(AppModule);
const expressApp = app.getHttpServer();

// Apply global middleware
expressApp.use(loggerMiddleware);

await app.listen(3000);
```

### Module-Level Middleware

Apply to specific modules:

```typescript
import { Module, MiddlewareConsumer } from 'han-prev-core';
import { UserController } from './user.controller';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  controllers: [UserController],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes(UserController);
  }
}
```

### Route-Specific Middleware

```typescript
import { Module, MiddlewareConsumer } from 'han-prev-core';
import { UserController } from './user.controller';
import { AuthMiddleware } from './middleware/auth.middleware';

@Module({
  controllers: [UserController],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'users/profile', method: 'GET' });
  }
}
```

## Common Middleware Examples

### 1. Request Logger

```typescript
import { Injectable } from 'han-prev-core';

@Injectable()
export class RequestLoggerMiddleware {
  use(req: any, res: any, next: any) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log({
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.headers['user-agent'],
      });
    });

    next();
  }
}
```

### 2. CORS Middleware

```typescript
import { Injectable } from 'han-prev-core';

@Injectable()
export class CorsMiddleware {
  use(req: any, res: any, next: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  }
}
```

### 3. Authentication Middleware

```typescript
import { Injectable } from 'han-prev-core';

@Injectable()
export class AuthMiddleware {
  use(req: any, res: any, next: any) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      const decoded = this.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  private verifyToken(token: string) {
    // JWT verification logic
    return { id: 1, email: 'user@example.com' };
  }
}
```

### 4. Request Validation

```typescript
import { Injectable } from 'han-prev-core';

@Injectable()
export class ValidationMiddleware {
  use(req: any, res: any, next: any) {
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!req.headers['content-type']?.includes('application/json')) {
        return res.status(400).json({
          error: 'Content-Type must be application/json',
        });
      }

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          error: 'Request body cannot be empty',
        });
      }
    }

    next();
  }
}
```

### 5. Rate Limiting

```typescript
import { Injectable } from 'han-prev-core';

@Injectable()
export class RateLimitMiddleware {
  private requests = new Map();
  private limit = 100;
  private windowMs = 15 * 60 * 1000; // 15 minutes

  use(req: any, res: any, next: any) {
    const ip = req.ip;
    const now = Date.now();
    const userRequests = this.requests.get(ip) || [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      (timestamp: number) => now - timestamp < this.windowMs
    );

    if (validRequests.length >= this.limit) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: this.windowMs / 1000,
      });
    }

    validRequests.push(now);
    this.requests.set(ip, validRequests);
    next();
  }
}
```

### 6. Request ID

```typescript
import { Injectable } from 'han-prev-core';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware {
  use(req: any, res: any, next: any) {
    const requestId = req.headers['x-request-id'] || randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  }
}
```

### 7. Body Parser

```typescript
import { Injectable } from 'han-prev-core';

@Injectable()
export class BodyParserMiddleware {
  use(req: any, res: any, next: any) {
    if (req.headers['content-type']?.includes('application/json')) {
      let body = '';

      req.on('data', (chunk: any) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          req.body = JSON.parse(body);
          next();
        } catch (error) {
          res.status(400).json({ error: 'Invalid JSON' });
        }
      });
    } else {
      next();
    }
  }
}
```

## Middleware Execution Order

Middleware executes in the order it's registered:

```typescript
@Module({
  controllers: [UserController],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, CorsMiddleware, AuthMiddleware)
      .forRoutes(UserController);
    // Execution: Logger → CORS → Auth → Route Handler
  }
}
```

## Conditional Middleware

Apply middleware based on conditions:

```typescript
@Module({
  controllers: [UserController],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude({ path: 'users/public', method: 'GET' })
      .forRoutes(UserController);
  }
}
```

## Real-World Example

Complete API middleware setup:

```typescript
import { Module, MiddlewareConsumer } from 'han-prev-core';
import { UserController } from './user/user.controller';
import { PostController } from './post/post.controller';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { CorsMiddleware } from './middleware/cors.middleware';
import { AuthMiddleware } from './middleware/auth.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';

@Module({
  controllers: [UserController, PostController],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Global middleware for all routes
    consumer
      .apply(LoggerMiddleware, CorsMiddleware, RateLimitMiddleware)
      .forRoutes('*');

    // Auth middleware for protected routes
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'users/login', method: 'POST' },
        { path: 'users/register', method: 'POST' },
        { path: 'posts', method: 'GET' }
      )
      .forRoutes(UserController, PostController);
  }
}
```

## Best Practices

### 1. Always Call next()

```typescript
// ✅ Good
export class MyMiddleware {
  use(req: any, res: any, next: any) {
    // Do something
    next();
  }
}

// ❌ Bad - Hangs the request
export class MyMiddleware {
  use(req: any, res: any, next: any) {
    // Do something
    // Missing next()
  }
}
```

### 2. Handle Errors Properly

```typescript
// ✅ Good
export class MyMiddleware {
  use(req: any, res: any, next: any) {
    try {
      // Do something
      next();
    } catch (error) {
      next(error); // Pass error to error handler
    }
  }
}
```

### 3. Keep Middleware Focused

```typescript
// ✅ Good - Single responsibility
export class LoggerMiddleware { }
export class AuthMiddleware { }
export class ValidationMiddleware { }

// ❌ Bad - Too many responsibilities
export class MegaMiddleware {
  // Logging + Auth + Validation
}
```

### 4. Use Dependency Injection

```typescript
// ✅ Good
@Injectable()
export class AuthMiddleware {
  constructor(
    private jwtService: JwtService,
    private userService: UserService
  ) {}

  async use(req: any, res: any, next: any) {
    const user = await this.userService.findById(req.userId);
    next();
  }
}
```

## Testing Middleware

```typescript
import { LoggerMiddleware } from './logger.middleware';

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    middleware = new LoggerMiddleware();
    mockReq = { method: 'GET', url: '/users' };
    mockRes = {};
    mockNext = jest.fn();
  });

  it('should call next()', () => {
    middleware.use(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should log request details', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    middleware.use(mockReq, mockRes, mockNext);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('GET /users')
    );
  });
});
```

## Using Express Middleware

Han Framework is built on Express, so you can use Express middleware:

```typescript
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';

const app = await HanFactory.create(AppModule);
const expressApp = app.getHttpServer();

// Use Express middleware
expressApp.use(helmet());
expressApp.use(compression());

await app.listen(3000);
```

## Quick Reference

```typescript
// Function middleware
export function myMiddleware(req, res, next) {
  next();
}

// Class middleware
@Injectable()
export class MyMiddleware {
  use(req, res, next) {
    next();
  }
}

// Apply globally
expressApp.use(myMiddleware);

// Apply to module
@Module({})
export class MyModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MyMiddleware).forRoutes('*');
  }
}

// Apply to specific routes
consumer.apply(MyMiddleware).forRoutes(UserController);

// Exclude routes
consumer
  .apply(MyMiddleware)
  .exclude({ path: 'users/public', method: 'GET' })
  .forRoutes(UserController);
```

## Next Steps

- Learn about [Module Middleware](/techniques/module-middleware) for advanced patterns
- Explore [Guards](/fundamentals/guards) for authorization
- Check out [Interceptors](/fundamentals/interceptors) for response transformation

Middleware makes your application flexible and maintainable! ⚡
