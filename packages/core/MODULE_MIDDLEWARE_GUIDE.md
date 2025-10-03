# Module-Level Middleware in Han Framework

Han Framework now supports **module-level middleware configuration** - a powerful, NestJS-inspired pattern that lets you configure middleware at the module level with fine-grained control over which routes they apply to.

## Why Module-Level Middleware?

✅ **Centralized Configuration** - Configure all middleware for a module in one place
✅ **Route Targeting** - Apply middleware to specific controllers or routes
✅ **Exclusion Support** - Exclude specific routes from middleware
✅ **Cleaner Controllers** - No need to repeat `@UseMiddleware` on every controller
✅ **Better Organization** - Group related middleware with related modules

## Quick Start

### 1. Basic Module Middleware

```typescript
import { Module, HanModule, MiddlewareConsumer, Injectable } from 'han-prev-core';
import { UserController } from './user.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

@Module({
  controllers: [UserController],
  providers: [],
})
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(UserController);
  }
}
```

That's it! Now `AuthMiddleware` will be applied to all routes in `UserController`.

### 2. Multiple Middleware

```typescript
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware, LoggerMiddleware, RateLimitMiddleware)
      .forRoutes(UserController);
  }
}
```

### 3. Specific Routes

```typescript
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('users/*'); // All routes starting with /users/
  }
}
```

### 4. Exclude Routes

```typescript
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude('users/login', 'users/register')  // Public routes
      .forRoutes(UserController);
  }
}
```

## Advanced Patterns

### 1. HTTP Method-Specific Middleware

```typescript
import { RequestMethod } from 'han-prev-core';

export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ValidationMiddleware)
      .forRoutes(
        { path: 'users', method: RequestMethod.POST },
        { path: 'users/:id', method: RequestMethod.PUT },
      );
  }
}
```

### 2. Multiple Middleware Groups

```typescript
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    // Auth for all routes
    consumer
      .apply(AuthMiddleware)
      .forRoutes(UserController);

    // Validation only for POST/PUT
    consumer
      .apply(ValidationMiddleware)
      .forRoutes(
        { path: 'users', method: RequestMethod.POST },
        { path: 'users/:id', method: RequestMethod.PUT },
      );

    // Rate limiting for sensitive routes
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes({ path: 'users/password-reset', method: RequestMethod.POST });
  }
}
```

### 3. Wildcard Patterns

```typescript
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CacheMiddleware)
      .forRoutes('users/*/profile'); // Match /users/123/profile, /users/abc/profile, etc.
  }
}
```

### 4. Mix Controllers and Paths

```typescript
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        UserController,
        AdminController,
        'api/protected/*',
      );
  }
}
```

### 5. Complex Exclusion

```typescript
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        'users/login',
        'users/register',
        { path: 'users/verify', method: RequestMethod.GET },
      )
      .forRoutes(UserController);
  }
}
```

## Complete Example

```typescript
// middleware/auth.middleware.ts
import { Injectable } from 'han-prev-core';
import { HanMiddleware, MiddlewareFunction } from 'han-prev-common';

@Injectable()
export class AuthMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      // Verify token...
      next();
    };
  }
}

// middleware/logger.middleware.ts
@Injectable()
export class LoggerMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    };
  }
}

// user.controller.ts
import { Controller, Get, Post, Param, Body } from 'han-prev-core';

@Controller('users')
export class UserController {
  @Get()
  findAll() {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id };
  }

  @Post()
  create(@Body() data: any) {
    return { created: true };
  }

  @Post('login')
  login(@Body() credentials: any) {
    return { token: 'abc123' };
  }
}

// user.module.ts
import { Module, HanModule, MiddlewareConsumer, RequestMethod } from 'han-prev-core';
import { UserController } from './user.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { LoggerMiddleware } from '../middleware/logger.middleware';

@Module({
  controllers: [UserController],
  providers: [AuthMiddleware, LoggerMiddleware],
})
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    // Log all requests
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(UserController);

    // Auth for all routes EXCEPT login
    consumer
      .apply(AuthMiddleware)
      .exclude('users/login')
      .forRoutes(UserController);
  }
}
```

## Middleware Execution Order

Middleware executes in this priority:

1. **Global middleware** (Express app.use)
2. **Module-level middleware** (configure method)
3. **Controller-level middleware** (@UseMiddleware on controller)
4. **Route-level middleware** (@UseMiddleware on method)
5. **Route handler** (your controller method)

Example:

```typescript
// app.use(globalLogger) - 1st

@Module({...})
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ModuleAuth).forRoutes(UserController); // 2nd
  }
}

@Controller('users')
@UseMiddleware(ControllerCache) // 3rd
export class UserController {
  @Get()
  @UseMiddleware(RouteValidation) // 4th
  findAll() { // 5th (finally!)
    return [];
  }
}
```

## Route Matching

### String Paths

```typescript
consumer.apply(Auth).forRoutes('users');        // Exact: /users
consumer.apply(Auth).forRoutes('users/*');      // Wildcard: /users/anything
consumer.apply(Auth).forRoutes('users/:id');    // Param: /users/123
```

### Controller Classes

```typescript
consumer.apply(Auth).forRoutes(UserController);  // All routes in controller
```

### RouteInfo Objects

```typescript
consumer.apply(Auth).forRoutes(
  { path: 'users', method: RequestMethod.POST },
  { path: 'users/:id', method: RequestMethod.PUT },
);
```

## Best Practices

### 1. Implement HanModule Interface

```typescript
// ✅ Good - Type-safe
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    // TypeScript will ensure this method signature is correct
  }
}

// ❌ Avoid - No type safety
export class UserModule {
  configure(consumer: any) {
    // Easy to make mistakes
  }
}
```

### 2. Register Middleware as Providers

```typescript
@Module({
  controllers: [UserController],
  providers: [AuthMiddleware, LoggerMiddleware], // ✅ Register here
})
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(UserController);
  }
}
```

### 3. Use Exclusions for Public Routes

```typescript
// ✅ Good - Clear intent
consumer
  .apply(AuthMiddleware)
  .exclude('users/login', 'users/register')
  .forRoutes(UserController);

// ❌ Avoid - Harder to maintain
consumer.apply(AuthMiddleware).forRoutes('users/profile');
consumer.apply(AuthMiddleware).forRoutes('users/settings');
consumer.apply(AuthMiddleware).forRoutes('users/:id');
// etc...
```

### 4. Group Related Middleware

```typescript
// ✅ Good - Logical grouping
consumer
  .apply(AuthMiddleware, RoleMiddleware)  // Auth-related
  .forRoutes(AdminController);

consumer
  .apply(ValidationMiddleware, SanitizationMiddleware)  // Input-related
  .forRoutes({ path: 'users', method: RequestMethod.POST });
```

### 5. Use Method-Specific When Appropriate

```typescript
// ✅ Good - Only validate on write operations
consumer
  .apply(ValidationMiddleware)
  .forRoutes(
    { path: 'users', method: RequestMethod.POST },
    { path: 'users/:id', method: RequestMethod.PUT },
    { path: 'users/:id', method: RequestMethod.PATCH },
  );
```

## Common Patterns

### Authentication Module

```typescript
@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtMiddleware],
})
export class AuthModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .exclude('auth/login', 'auth/register', 'auth/refresh')
      .forRoutes(AuthController);
  }
}
```

### API Module with Rate Limiting

```typescript
@Module({
  controllers: [ApiController],
  providers: [RateLimitMiddleware, ApiKeyMiddleware],
})
export class ApiModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    // API key for all routes
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes(ApiController);

    // Rate limit for write operations
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes(
        { path: 'api/*', method: RequestMethod.POST },
        { path: 'api/*', method: RequestMethod.PUT },
        { path: 'api/*', method: RequestMethod.DELETE },
      );
  }
}
```

### Multi-Module Application

```typescript
@Module({
  imports: [UserModule, ProductModule, OrderModule],
  providers: [GlobalLoggerMiddleware],
})
export class AppModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply logger to all modules
    consumer
      .apply(GlobalLoggerMiddleware)
      .forRoutes('*');
  }
}
```

## Comparison with Other Approaches

| Approach | Use Case | Example |
|----------|----------|---------|
| **Global** | All routes in app | `app.use(middleware)` |
| **Module** | All routes in module(s) | `configure(consumer)` |
| **Controller** | All routes in controller | `@UseMiddleware(middleware)` |
| **Route** | Specific route only | `@Get() @UseMiddleware(middleware)` |

Choose the right level based on your needs:

- Global: CORS, helmet, body-parser
- Module: Auth for user module, API keys for API module
- Controller: Caching for product controller
- Route: Validation for specific POST route

## Migration from Decorator-Only Approach

### Before

```typescript
@Controller('users')
@UseMiddleware(AuthMiddleware)
export class UserController {
  @Get()
  findAll() {}

  @Post('login')
  @UseMiddleware() // How to skip auth here?
  login() {}
}
```

### After

```typescript
// Module
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude('users/login')
      .forRoutes(UserController);
  }
}

// Controller
@Controller('users')
export class UserController {
  @Get()
  findAll() {} // Auth applied

  @Post('login')
  login() {} // Auth excluded!
}
```

Much cleaner!

## Troubleshooting

### Middleware Not Executing

1. Check module implements `HanModule` interface
2. Verify middleware is registered as provider
3. Ensure route path matches correctly
4. Check middleware class has `use()` method

### Wrong Execution Order

Remember the order: Global → Module → Controller → Route

### Route Not Matching

```typescript
// ❌ Won't match /api/users
consumer.apply(Auth).forRoutes('users');

// ✅ Will match /api/users
consumer.apply(Auth).forRoutes('api/users');

// ✅ Will match all under /users
consumer.apply(Auth).forRoutes('users/*');
```

## Summary

Module-level middleware gives you:

✅ **Centralized control** - Configure all middleware in one place
✅ **Fine-grained targeting** - Apply to specific routes/methods
✅ **Easy exclusions** - Skip middleware for public routes
✅ **Cleaner code** - Less decorator repetition
✅ **Better organization** - Middleware stays with relevant modules

Perfect for building scalable, maintainable applications!
