# Middleware

Middleware functions are executed during the request-response cycle, allowing you to process requests before they reach route handlers. They're perfect for logging, authentication, request transformation, and more.

## Why Use Middleware?

Middleware is the backbone of modern web applications, acting as a **pipeline** through which all requests flow. Think of middleware as checkpoints that inspect, modify, or block requests before they reach your business logic.

**Common Use Cases:**
- 🔐 **Authentication** - Verify user identity before accessing protected routes
- 📊 **Logging** - Track all requests for debugging and analytics
- ✅ **Validation** - Ensure requests meet your requirements
- 🛡️ **Security** - Add headers, sanitize input, prevent attacks
- ⚡ **Performance** - Compress responses, cache data, optimize delivery
- 🔄 **Request/Response Transformation** - Modify data before/after processing

::: tip Benefits
- **Separation of Concerns** - Keep business logic clean and focused
- **Reusability** - Write once, apply anywhere in your app
- **Flexibility** - Apply to all routes, specific modules, or individual endpoints
- **Maintainability** - Easy to add, remove, or modify without changing route handlers
:::

## What is Middleware?

Middleware is a function that has access to the **request object** (`req`), **response object** (`res`), and the **next middleware function** (`next`) in the application's request-response cycle.

```typescript
function logger(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next(); // ⚠️ IMPORTANT: Always call next() to pass control to the next middleware
}
```

**The Request Flow:**
```
Client Request → Middleware 1 → Middleware 2 → ... → Route Handler → Response
                     ↓              ↓                        ↓
                  Logging        Auth Check            Business Logic
```

## Creating Middleware

Han Framework supports two middleware styles: **function-based** (simple, quick) and **class-based** (powerful, injectable). Choose based on your needs.

### Function-Based Middleware

**When to use:** Simple, stateless middleware that doesn't need dependency injection.

**Perfect for:**
- Basic logging
- Simple request/response modifications
- Quick prototypes

```typescript
// logger.middleware.ts
export function loggerMiddleware(req: any, res: any, next: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
}
```

✅ **Pros:** Simple, lightweight, easy to understand
❌ **Cons:** No dependency injection, harder to test

### Class-Based Middleware

**When to use:** Complex middleware that needs services, databases, or configuration.

**Perfect for:**
- Authentication (needs JWT service)
- Database operations (needs repositories)
- Complex validation (needs external services)

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

✅ **Pros:** Dependency injection, testable, reusable
❌ **Cons:** More boilerplate, slightly more complex

::: tip Choosing Between Function and Class
- **Use Functions** for simple, one-off middleware (logging, CORS)
- **Use Classes** when you need services or complex logic (auth, database operations)
:::

**Comparison:**

| Feature | Function-Based | Class-Based |
|---------|---------------|-------------|
| Setup | ⚡ Fast | 📝 More code |
| DI Support | ❌ No | ✅ Yes |
| Testability | 🟡 Moderate | ✅ Easy |
| Reusability | ✅ Yes | ✅ Yes |
| Best For | Simple tasks | Complex logic |

## Applying Middleware

Middleware can be applied at three levels: **globally** (all routes), **module-level** (specific features), or **route-specific** (individual endpoints). Choose the right scope for your needs.

### Global Middleware

**When to use:** Functionality needed across your **entire application**.

**Examples:** Request logging, security headers, CORS, compression, body parsing

**Runs on:** Every single request to your application

```typescript
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';
import { loggerMiddleware } from './middleware/logger.middleware';

const app = await HanFactory.create(AppModule);
const expressApp = app.getHttpServer();

// Apply global middleware - affects ALL routes
expressApp.use(loggerMiddleware);

await app.listen(3000);
```

::: warning Performance Note
Global middleware runs on **every request**. Keep it lightweight to avoid performance issues!
:::

### Module-Level Middleware

**When to use:** Functionality needed for a **specific feature or domain**.

**Examples:** Authentication for user routes, special logging for payment processing, rate limiting for API endpoints

**Runs on:** Only routes within that module

```typescript
import { Module, MiddlewareConsumer } from 'han-prev-core';
import { UserController } from './user.controller';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  controllers: [UserController],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    // Only applies to UserController routes
    consumer.apply(LoggerMiddleware).forRoutes(UserController);
  }
}
```

**Why module-level?**
- ✅ Better organization - middleware lives with the feature
- ✅ Performance - only runs when needed
- ✅ Security - isolate sensitive operations

### Route-Specific Middleware

**When to use:** Functionality needed for **one or few endpoints**.

**Examples:** File upload validation, admin-only checks, specific rate limits

**Runs on:** Only the specified routes

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
      // Only runs on GET /users/profile
      .forRoutes({ path: 'users/profile', method: 'GET' });
  }
}
```

**Scope Comparison:**

| Scope | Applies To | Use When | Example |
|-------|-----------|----------|---------|
| **Global** | All routes | App-wide needs | Logging, CORS |
| **Module** | Module routes | Feature-specific | User auth |
| **Route** | Single route | Endpoint-specific | File upload |

## Common Middleware Examples

Real-world middleware patterns you can use in your applications right away.

### 1. Request Logger

**Why use it?** Track all HTTP requests for debugging, monitoring, and analytics.

**When to apply:** Globally - you want to log every request

**What it does:**
- Records request method, URL, and user agent
- Measures response time
- Logs HTTP status codes
- Helps identify slow endpoints and errors

```typescript
import { Injectable } from 'han-prev-core';

@Injectable()
export class RequestLoggerMiddleware {
  use(req: any, res: any, next: any) {
    const start = Date.now();

    // Listen for response completion
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

**Output Example:**
```json
{
  "method": "GET",
  "url": "/api/users",
  "status": 200,
  "duration": "45ms",
  "userAgent": "Mozilla/5.0..."
}
```

### 2. CORS Middleware

**Why use it?** Allow browsers to make cross-origin requests to your API.

**When to apply:** Globally - CORS headers needed for all API endpoints

**What it does:**
- Adds CORS headers to responses
- Handles preflight (OPTIONS) requests
- Allows requests from other domains

::: tip Pro Tip
For production, replace `'*'` with specific allowed origins:
```typescript
res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
```
:::

```typescript
import { Injectable } from 'han-prev-core';

@Injectable()
export class CorsMiddleware {
  use(req: any, res: any, next: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  }
}
```

### 3. Authentication Middleware

**Why use it?** Protect routes that require a logged-in user.

**When to apply:** Module or route-level - only on protected endpoints

**What it does:**
- Verifies JWT tokens
- Blocks unauthenticated requests
- Attaches user info to request object

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

**Why use it?** Ensure requests have correct format before processing.

**When to apply:** Route-level - only on endpoints that accept data

**What it does:**
- Validates Content-Type headers
- Checks for empty request bodies
- Prevents malformed requests from reaching your handlers

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

**Why use it?** Prevent abuse and ensure fair API usage.

**When to apply:** Globally or module-level - protect against spam/DDoS

**What it does:**
- Limits requests per IP address
- Returns 429 (Too Many Requests) when limit exceeded
- Protects your server from being overwhelmed

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

**Why use it?** Track requests across your application for debugging.

**When to apply:** Globally - every request should have a unique ID

**What it does:**
- Generates unique ID for each request
- Useful for tracing requests through microservices
- Helps correlate logs and errors

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

**Usage in logs:**
```typescript
console.log(`[${req.requestId}] Processing user request`);
// Output: [a3f2c890-...] Processing user request
```

### 7. Body Parser

**Why use it?** Parse JSON request bodies (usually handled by framework).

**When to apply:** Custom scenarios - framework includes body parsing by default

**What it does:**
- Reads raw request stream
- Parses JSON data
- Handles malformed JSON gracefully

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
