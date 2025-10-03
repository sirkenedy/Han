# Middleware in Han Framework

Han Framework provides a flexible and developer-friendly middleware system that supports multiple patterns.

## Quick Start

### 1. Function Middleware (Simplest)

```typescript
import { Controller, Get, UseMiddleware } from 'han-prev-core';

const logger = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
};

@Controller('users')
@UseMiddleware(logger)  // ✅ Applied to all routes
export class UserController {
  @Get()
  findAll() {
    return [];
  }
}
```

### 2. Class Middleware (Recommended)

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

// ✅ All of these work:
@Controller('users')
@UseMiddleware(LoggerMiddleware)           // Auto-instantiated
export class UserController {}

@Controller('admin')
@UseMiddleware(new LoggerMiddleware())     // Manual instance
export class AdminController {}
```

### 3. Multiple Middleware

```typescript
@Controller('admin')
@UseMiddleware(AuthMiddleware, LoggerMiddleware, RateLimitMiddleware)
export class AdminController {
  @Get('users')
  @UseMiddleware(CacheMiddleware)  // Route-specific
  getUsers() {}
}
```

## Middleware Types

### 1. **Controller-Level Middleware**
Applied to all routes in the controller:

```typescript
@Controller('api')
@UseMiddleware(AuthMiddleware, LoggerMiddleware)
export class ApiController {
  @Get('users')      // Both middleware applied
  getUsers() {}

  @Post('users')     // Both middleware applied
  createUser() {}
}
```

### 2. **Route-Level Middleware**
Applied to specific routes only:

```typescript
@Controller('users')
export class UserController {
  @Get()
  findAll() {}  // No middleware

  @Get(':id')
  @UseMiddleware(ValidateIdMiddleware)  // Only this route
  findOne(@Param('id') id: string) {}

  @Post()
  @UseMiddleware(AuthMiddleware, ValidationMiddleware)  // Multiple
  create(@Body() data: any) {}
}
```

### 3. **Global Middleware**
Applied to all routes in the application:

```typescript
// main.ts or index.ts
import { HanFactory } from 'han-prev-core';
import express from 'express';

const app = await HanFactory.create(AppModule);
const expressApp = app.getHttpServer();

// Global middleware
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));

await app.listen(3000);
```

## Common Middleware Patterns

### Authentication Middleware

```typescript
import { Injectable } from 'han-prev-core';
import { HanMiddleware, MiddlewareFunction } from 'han-prev-common';

@Injectable()
export class AuthMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      try {
        // Verify JWT or session
        const user = verifyToken(token);
        req.user = user;
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    };
  }
}

// Usage
@Controller('admin')
@UseMiddleware(AuthMiddleware)
export class AdminController {}
```

### Logging Middleware

```typescript
@Injectable()
export class LoggerMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      const start = Date.now();

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

### CORS Middleware

```typescript
@Injectable()
export class CorsMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH');
      res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      next();
    };
  }
}
```

### Rate Limiting Middleware

```typescript
@Injectable()
export class RateLimitMiddleware implements HanMiddleware {
  private requests = new Map<string, number[]>();

  use(): MiddlewareFunction {
    return (req, res, next) => {
      const ip = req.ip;
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = 100;

      const requestTimes = this.requests.get(ip) || [];
      const recentRequests = requestTimes.filter(time => now - time < windowMs);

      if (recentRequests.length >= maxRequests) {
        return res.status(429).json({ error: 'Too many requests' });
      }

      recentRequests.push(now);
      this.requests.set(ip, recentRequests);
      next();
    };
  }
}
```

### Validation Middleware

```typescript
@Injectable()
export class ValidationMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      const { body } = req;

      if (!body.email || !body.password) {
        return res.status(400).json({
          error: 'Missing required fields: email, password',
        });
      }

      if (!/\S+@\S+\.\S+/.test(body.email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      next();
    };
  }
}
```

## Middleware with Dependencies

Middleware classes can use dependency injection:

```typescript
import { Injectable, Inject } from 'han-prev-core';
import { HanMiddleware, MiddlewareFunction } from 'han-prev-common';

@Injectable()
export class DatabaseLoggerMiddleware implements HanMiddleware {
  constructor(
    @Inject('LogService') private logService: LogService,
  ) {}

  use(): MiddlewareFunction {
    return async (req, res, next) => {
      await this.logService.log({
        method: req.method,
        path: req.path,
        timestamp: new Date(),
      });
      next();
    };
  }
}
```

## Middleware Execution Order

Middleware executes in this order:

1. **Global middleware** (Express-level)
2. **Controller-level middleware** (from `@UseMiddleware` on controller)
3. **Route-level middleware** (from `@UseMiddleware` on method)
4. **Route handler** (your controller method)

```typescript
// Global: app.use(globalLogger)
@Controller('api')
@UseMiddleware(ControllerAuth)        // 2nd
export class ApiController {
  @Get('users')
  @UseMiddleware(RouteCache)          // 3rd
  getUsers() {                        // 4th (finally!)
    return [];
  }
}
```

## Error Handling in Middleware

```typescript
@Injectable()
export class ErrorHandlerMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      try {
        // Do something risky
        next();
      } catch (error) {
        res.status(500).json({
          error: 'Internal server error',
          message: error.message,
        });
      }
    };
  }
}
```

## Async Middleware

Middleware can be async:

```typescript
@Injectable()
export class AsyncAuthMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return async (req, res, next) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        const user = await this.validateToken(token);
        req.user = user;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
      }
    };
  }

  private async validateToken(token: string) {
    // Async validation logic
    return { id: 1, email: 'user@example.com' };
  }
}
```

## Generate Middleware with CLI

```bash
# Generate a new middleware class
han generate middleware logger

# Output:
# CREATE src/middleware/logger.middleware.ts
```

## Best Practices

1. **Use classes for reusable middleware** - Better organization and testability
2. **Use functions for simple, one-off middleware** - Quick and easy
3. **Apply authentication at controller level** - Don't repeat on every route
4. **Use route-level for specific validation** - Only where needed
5. **Keep middleware focused** - One responsibility per middleware
6. **Name middleware descriptively** - `AuthMiddleware`, `LoggerMiddleware`
7. **Handle errors gracefully** - Don't crash the server

## Migration from Old Pattern

### Before (Required .use())
```typescript
@Controller('users')
@UseMiddleware(new LoggerMiddleware().use())  // ❌ Verbose
export class UserController {}
```

### After (Auto-resolved)
```typescript
@Controller('users')
@UseMiddleware(LoggerMiddleware)  // ✅ Clean!
export class UserController {}
```

Both patterns still work, but the new pattern is recommended for cleaner code.
