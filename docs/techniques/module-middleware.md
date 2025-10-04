# Module-Level Middleware

Module-level middleware is one of Han Framework's most powerful features, allowing you to configure middleware at the module level with fine-grained control over which routes they apply to.

## Why Module Middleware?

Traditional middleware approaches have limitations:

```typescript
// ❌ Problem: Must repeat on every controller
@Controller('users')
@UseMiddleware(AuthMiddleware)
export class UserController { }

@Controller('posts')
@UseMiddleware(AuthMiddleware)
export class PostController { }

@Controller('comments')
@UseMiddleware(AuthMiddleware)
export class CommentController { }
```

Module middleware solves this:

```typescript
// ✅ Configure once for the entire module
@Module({
  controllers: [UserController, PostController, CommentController],
})
export class AppModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('*'); // All routes in module
  }
}
```

## Quick Start

### 1. Implement HanModule Interface

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
      .forRoutes(UserController);
  }
}
```

### 2. Apply to All Routes

```typescript
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, AuthMiddleware)
      .forRoutes('*'); // All routes
  }
}
```

### 3. Exclude Specific Routes

```typescript
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude('users/login', 'users/register') // Public routes
      .forRoutes(UserController);
  }
}
```

## Route Targeting

### By Controller Class

```typescript
consumer
  .apply(AuthMiddleware)
  .forRoutes(UserController, ProductController, OrderController);
```

### By Path Pattern

```typescript
// Exact path
consumer.apply(AuthMiddleware).forRoutes('users');

// Wildcard
consumer.apply(AuthMiddleware).forRoutes('users/*');

// Parameter routes
consumer.apply(AuthMiddleware).forRoutes('users/:id');
```

### By HTTP Method

```typescript
import { RequestMethod } from 'han-prev-core';

consumer
  .apply(ValidationMiddleware)
  .forRoutes(
    { path: 'users', method: RequestMethod.POST },
    { path: 'users/:id', method: RequestMethod.PUT },
  );
```

### Mix and Match

```typescript
consumer
  .apply(AuthMiddleware)
  .forRoutes(
    UserController,      // Entire controller
    'admin/*',          // All admin routes
    { path: 'api/protected', method: RequestMethod.POST },
  );
```

## Exclusions

### Basic Exclusion

```typescript
consumer
  .apply(AuthMiddleware)
  .exclude('users/login', 'users/register')
  .forRoutes(UserController);
```

### Exclude by HTTP Method

```typescript
consumer
  .apply(RateLimitMiddleware)
  .exclude({ path: 'users/health', method: RequestMethod.GET })
  .forRoutes(UserController);
```

### Multiple Exclusions

```typescript
consumer
  .apply(AuthMiddleware)
  .exclude(
    'users/login',
    'users/register',
    'users/forgot-password',
    { path: 'users/verify', method: RequestMethod.GET },
  )
  .forRoutes(UserController);
```

## Multiple Middleware Groups

You can configure multiple middleware groups in the same module:

```typescript
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    // Logger for all routes
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');

    // Auth for all except login/register
    consumer
      .apply(AuthMiddleware)
      .exclude('users/login', 'users/register')
      .forRoutes(UserController);

    // Validation only for POST/PUT
    consumer
      .apply(ValidationMiddleware)
      .forRoutes(
        { path: 'users', method: RequestMethod.POST },
        { path: 'users/:id', method: RequestMethod.PUT },
      );

    // Rate limit for sensitive operations
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes(
        { path: 'users/password-reset', method: RequestMethod.POST },
      );
  }
}
```

## Real-World Examples

### Authentication Module

```typescript
@Module({
  controllers: [AuthController, UserController, ProfileController],
  providers: [JwtMiddleware, AuthService],
})
export class AuthModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .exclude(
        'auth/login',
        'auth/register',
        'auth/refresh',
        'auth/verify-email',
      )
      .forRoutes('*');
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

    // Rate limit for write operations only
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

### Admin Module with Multiple Guards

```typescript
@Module({
  controllers: [AdminController, DashboardController],
  providers: [
    AdminAuthMiddleware,
    RoleMiddleware,
    AuditLogMiddleware,
  ],
})
export class AdminModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    // Authentication
    consumer
      .apply(AdminAuthMiddleware)
      .forRoutes('*');

    // Role check
    consumer
      .apply(RoleMiddleware)
      .exclude('admin/login')
      .forRoutes(AdminController);

    // Audit logging for all admin actions
    consumer
      .apply(AuditLogMiddleware)
      .forRoutes(
        { path: 'admin/*', method: RequestMethod.POST },
        { path: 'admin/*', method: RequestMethod.PUT },
        { path: 'admin/*', method: RequestMethod.DELETE },
      );
  }
}
```

## Middleware Execution Order

Understanding the order is crucial:

```
1. Global Middleware (app.use)
2. Module Middleware (configure)
3. Controller Middleware (@UseMiddleware on controller)
4. Route Middleware (@UseMiddleware on method)
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
    return [];
  }
}
```

## Pattern Matching

### Wildcard Patterns

```typescript
consumer.apply(Auth).forRoutes('users/*');     // /users/anything
consumer.apply(Auth).forRoutes('*/admin');     // /anything/admin
consumer.apply(Auth).forRoutes('api/*/users'); // /api/anything/users
```

### Parameter Routes

```typescript
consumer.apply(ValidateId).forRoutes('users/:id');
consumer.apply(ValidateId).forRoutes('posts/:id/comments/:commentId');
```

### Multiple Patterns

```typescript
consumer
  .apply(AuthMiddleware)
  .forRoutes(
    'users/*',
    'posts/*',
    'comments/*',
  );
```

## Creating Module Middleware

### Basic Class Middleware

```typescript
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

      // Verify token
      try {
        const user = verifyToken(token);
        req.user = user;
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    };
  }
}
```

### Middleware with Dependencies

```typescript
@Injectable()
export class DatabaseLoggerMiddleware implements HanMiddleware {
  constructor(
    @Inject('LogService')
    private logService: LogService,
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

### Async Middleware

```typescript
@Injectable()
export class AsyncAuthMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return async (req, res, next) => {
      try {
        const token = req.headers.authorization?.split(' ')[1];
        const user = await this.validateTokenFromDatabase(token);
        req.user = user;
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    };
  }

  private async validateTokenFromDatabase(token: string) {
    // Async validation
  }
}
```

## Best Practices

### 1. Implement HanModule for Type Safety

```typescript
// ✅ Good
export class UserModule implements HanModule {
  configure(consumer: MiddlewareConsumer) {
    // TypeScript ensures correct method signature
  }
}

// ❌ Avoid
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
// ✅ Good - Clear and maintainable
consumer
  .apply(AuthMiddleware)
  .exclude('users/login', 'users/register')
  .forRoutes(UserController);

// ❌ Avoid - Harder to maintain
@Controller('users')
export class UserController {
  @Get('profile')
  @UseMiddleware(AuthMiddleware)
  getProfile() {}

  @Get('settings')
  @UseMiddleware(AuthMiddleware)
  getSettings() {}
  // etc...
}
```

### 4. Group Related Middleware

```typescript
// ✅ Good
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

## Comparison with Decorator Approach

### Before (Decorator-Only)

```typescript
@Controller('users')
@UseMiddleware(AuthMiddleware)
export class UserController {
  @Get()
  findAll() {} // Auth applied

  @Post('login')
  login() {} // ❌ Can't exclude easily
}
```

### After (Module Configuration)

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

// Controller - Clean!
@Controller('users')
export class UserController {
  @Get()
  findAll() {} // Auth applied

  @Post('login')
  login() {} // ✅ Auth excluded!
}
```

## Troubleshooting

### Middleware Not Executing

**Check:**
1. Module implements `HanModule` interface
2. Middleware registered in `providers` array
3. Route path matches correctly
4. Middleware class has `use()` method

### Wrong Execution Order

Remember: Global → Module → Controller → Route

### Route Not Matching

```typescript
// ❌ Won't match /api/users
consumer.apply(Auth).forRoutes('users');

// ✅ Will match /api/users
consumer.apply(Auth).forRoutes('api/users');

// ✅ Will match all /users routes
consumer.apply(Auth).forRoutes('users/*');
```

## When to Use Module Middleware

| Scenario | Recommendation |
|----------|----------------|
| Auth for entire module | ✅ Module middleware |
| Logging all requests | ✅ Module middleware |
| Rate limiting by endpoint | ✅ Module middleware |
| One-off route protection | ⚠️ Route decorator |
| CORS, helmet, body-parser | ⚠️ Global middleware |

## Next Steps

- Learn about [Middleware Basics](/fundamentals/middleware)
- Explore [Guards](/fundamentals/guards) for authorization
- Check out [Interceptors](/fundamentals/interceptors) for response transformation

## Additional Resources

- [MODULE_MIDDLEWARE_GUIDE.md](https://github.com/your-org/han-framework/blob/main/packages/core/MODULE_MIDDLEWARE_GUIDE.md)
- [NestJS Middleware](https://docs.nestjs.com/middleware) - Familiar pattern
