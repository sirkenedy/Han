# Guards

Guards are classes that determine whether a request should be handled by a route handler. They execute **after middleware** but **before route handlers**, making them perfect for authorization and access control.

## What are Guards?

Guards implement the `CanActivate` interface and return a boolean value indicating whether the request should proceed.

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  private validateRequest(request: any): boolean {
    return !!request.user;
  }
}
```

## When to Use Guards

### Middleware vs Guards

| Feature | Middleware | Guards |
|---------|-----------|---------|
| **Purpose** | Request processing, logging | Authorization, access control |
| **Returns** | `void` (calls `next()`) | `boolean` (allow/deny) |
| **Execution** | Before everything | After middleware, before handler |
| **Best for** | Transformation, logging | Access control decisions |

**Execution flow:**
```
Request → Middleware → Guards → Route Handler
```

### Benefits

**1. Separation of Concerns**
```typescript
// ✅ Good - Guard handles auth
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  @Get('users')
  getUsers() {
    return this.userService.findAll();
  }
}

// ❌ Bad - Auth logic in controller
@Controller('admin')
export class AdminController {
  @Get('users')
  getUsers(@Headers('authorization') auth: string) {
    if (!auth) throw new Error('Unauthorized');
    return this.userService.findAll();
  }
}
```

**2. Reusability**
```typescript
// Use the same guard across multiple routes
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {}

@Controller('settings')
@UseGuards(AdminGuard)
export class SettingsController {}
```

## Creating a Guard

### Step 1: Create Guard Class

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!request.user) {
      return false;
    }

    return true;
  }
}
```

### Step 2: Register in Module

```typescript
import { Module } from 'han-prev-core';
import { UserController } from './user.controller';
import { AuthGuard } from './guards/auth.guard';

@Module({
  controllers: [UserController],
  providers: [AuthGuard],
})
export class AppModule {}
```

### Step 3: Apply to Routes

```typescript
import { Controller, Get, UseGuards } from 'han-prev-core';
import { AuthGuard } from './guards/auth.guard';

@Controller('users')
export class UserController {
  @Get('profile')
  @UseGuards(AuthGuard)
  getProfile() {
    return { message: 'Protected route' };
  }

  @Get('public')
  getPublic() {
    return { message: 'Public route' };
  }
}
```

## Execution Context

Guards receive an `ExecutionContext` with request details:

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    const controllerClass = context.getClass();

    const apiKey = request.headers['x-api-key'];
    return apiKey === 'valid-key';
  }
}
```

## Common Guard Examples

### 1. Authentication Guard

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return false;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      return false;
    }

    const token = parts[1];

    try {
      const user = this.verifyToken(token);
      request.user = user;
      return true;
    } catch (error) {
      return false;
    }
  }

  private verifyToken(token: string) {
    return { id: 1, email: 'user@example.com', role: 'user' };
  }
}
```

### 2. Role-Based Guard

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!request.user) {
      return false;
    }

    return request.user.role === 'admin';
  }
}
```

Usage:
```typescript
@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @UseGuards(AuthGuard, AdminGuard)
  getDashboard() {
    return { message: 'Admin dashboard' };
  }
}
```

### 3. Dynamic Roles Guard

```typescript
import { Injectable, SetMetadata } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = Reflect.getMetadata('roles', context.getHandler());

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    return requiredRoles.some((role: string) => user.roles?.includes(role));
  }
}
```

Usage:
```typescript
@Controller('posts')
export class PostController {
  @Get()
  findAll() {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('editor', 'admin')
  create() {}

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  delete() {}
}
```

### 4. API Key Guard

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private validApiKeys = [
    'key-123-abc',
    'key-456-def',
    'key-789-ghi',
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      return false;
    }

    return this.validApiKeys.includes(apiKey);
  }
}
```

### 5. IP Whitelist Guard

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  private whitelist = [
    '127.0.0.1',
    '192.168.1.1',
    '10.0.0.1',
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip;

    return this.whitelist.includes(ip);
  }
}
```

### 6. Time-Based Guard

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class BusinessHoursGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    const isWeekday = day >= 1 && day <= 5;
    const isBusinessHours = hour >= 9 && hour < 17;

    return isWeekday && isBusinessHours;
  }
}
```

### 7. Permission Guard

```typescript
import { Injectable, SetMetadata } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = Reflect.getMetadata(
      'permissions',
      context.getHandler()
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    if (!user.permissions) {
      return false;
    }

    return requiredPermissions.every((permission: string) =>
      user.permissions.includes(permission)
    );
  }
}
```

Usage:
```typescript
@Controller('posts')
export class PostController {
  @Get(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('posts.read')
  findOne() {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions('posts.create')
  create() {}

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('posts.delete', 'admin')
  delete() {}
}
```

## Applying Guards

### Route-Level

```typescript
@Controller('users')
export class UserController {
  @Get('profile')
  @UseGuards(AuthGuard)
  getProfile() {
    return { message: 'Protected' };
  }

  @Get('public')
  getPublic() {
    return { message: 'Public' };
  }
}
```

### Controller-Level

```typescript
@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  @Get('users')
  getUsers() {}

  @Get('settings')
  getSettings() {}
}
```

### Global Guards

```typescript
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';
import { AuthGuard } from './guards/auth.guard';

const app = await HanFactory.create(AppModule);
app.useGlobalGuards(new AuthGuard());

await app.listen(3000);
```

## Guard Execution Order

Guards execute in this sequence:

```
1. Global Guards
     ↓
2. Controller Guards
     ↓
3. Route Guards
     ↓
4. Route Handler
```

Example:
```typescript
app.useGlobalGuards(new LoggerGuard());

@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  @Get('users')
  @UseGuards(AdminGuard)
  getUsers() {
    // Execution: LoggerGuard → AuthGuard → AdminGuard → getUsers()
  }
}
```

## Async Guards

Handle asynchronous operations:

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class AsyncAuthGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return false;
    }

    const token = authHeader.split(' ')[1];

    try {
      const user = await this.userService.findByToken(token);

      if (!user) {
        return false;
      }

      if (!user.isActive) {
        return false;
      }

      request.user = user;
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

## Guards with Dependencies

Inject services into guards:

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class DatabaseAuthGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      return false;
    }

    try {
      const payload = await this.jwtService.verify(token);
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        return false;
      }

      request.user = user;
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

## Error Handling

### Throw Exceptions

```typescript
@Injectable()
export class StrictAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!request.user) {
      throw new Error('Unauthorized - Please log in');
    }

    return true;
  }
}
```

### Custom Error Responses

```typescript
@Injectable()
export class CustomAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    if (!request.user) {
      response.status(401).json({
        error: 'Unauthorized',
        message: 'Please log in to access this resource',
        timestamp: new Date().toISOString(),
      });
      return false;
    }

    return true;
  }
}
```

## Real-World Example

Complete blog platform authorization:

### Role Guard

```typescript
import { Injectable, SetMetadata } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = Reflect.getMetadata('roles', context.getHandler());

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    return requiredRoles.some((role: string) => user.role === role);
  }
}
```

### Ownership Guard

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class PostOwnershipGuard implements CanActivate {
  constructor(private postService: PostService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const postId = request.params.id;

    if (!user) {
      return false;
    }

    if (user.role === 'admin') {
      return true;
    }

    const post = await this.postService.findById(postId);

    if (!post) {
      return false;
    }

    return post.authorId === user.id;
  }
}
```

### Using Guards

```typescript
import { Controller, Get, Post, Put, Delete, UseGuards } from 'han-prev-core';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard, Roles } from './guards/role.guard';
import { PostOwnershipGuard } from './guards/post-ownership.guard';

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Get()
  findAll() {
    return this.postService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() data: any) {
    return this.postService.create(data);
  }

  @Put(':id')
  @UseGuards(AuthGuard, PostOwnershipGuard)
  update(@Param('id') id: string, @Body() data: any) {
    return this.postService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, PostOwnershipGuard)
  delete(@Param('id') id: string) {
    return this.postService.delete(id);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('editor', 'admin')
  publish(@Param('id') id: string) {
    return this.postService.publish(id);
  }
}
```

## Best Practices

### 1. Return Boolean Values

```typescript
// ✅ Good
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    return true;
  }
}

// ✅ Good - Async
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate() {
    return true;
  }
}
```

### 2. Single Responsibility

```typescript
// ✅ Good - Separate guards
export class AuthGuard implements CanActivate {}
export class RoleGuard implements CanActivate {}
export class RateLimitGuard implements CanActivate {}

// ❌ Bad - Too many responsibilities
export class MegaGuard implements CanActivate {
  // Auth + Authorization + Rate limiting
}
```

### 3. Use Metadata for Configuration

```typescript
// ✅ Good - Configurable
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@UseGuards(RoleGuard)
@Roles('admin', 'editor')

// ❌ Bad - Hardcoded
export class AdminOrEditorGuard implements CanActivate {}
export class AdminOrModeratorGuard implements CanActivate {}
```

### 4. Handle Errors Gracefully

```typescript
@Injectable()
export class SafeAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    try {
      const user = await this.validateToken();
      return !!user;
    } catch (error) {
      this.logger.error('Auth error:', error);
      return false;
    }
  }
}
```

### 5. Use Dependency Injection

```typescript
// ✅ Good
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private logger: LoggerService
  ) {}
}

// ❌ Avoid
export class AuthGuard implements CanActivate {
  userService = new UserService();
}
```

## Testing Guards

```typescript
import { AuthGuard } from './auth.guard';
import { ExecutionContext } from 'han-prev-common';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    guard = new AuthGuard();

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          user: null,
        }),
      }),
    } as any;
  });

  it('should deny access without token', () => {
    const result = guard.canActivate(mockContext);
    expect(result).toBe(false);
  });

  it('should allow access with valid user', () => {
    mockContext.switchToHttp().getRequest().user = { id: 1 };
    const result = guard.canActivate(mockContext);
    expect(result).toBe(true);
  });
});
```

## Generating Guards

Use the CLI to generate guards:

```bash
han generate guard auth
```

This creates:

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return true;
  }
}
```

## Quick Reference

```typescript
// Create guard
@Injectable()
export class MyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }
}

// Register in module
@Module({
  providers: [MyGuard],
})
export class MyModule {}

// Apply to route
@Get()
@UseGuards(MyGuard)
findAll() {}

// Apply to controller
@Controller('users')
@UseGuards(MyGuard)
export class UserController {}

// Apply globally
app.useGlobalGuards(new MyGuard());
```

## Next Steps

- Learn about [Interceptors](/fundamentals/interceptors) for response transformation
- Explore [Middleware](/fundamentals/middleware) for request processing
- Check out [Pipes](/fundamentals/pipes) for data validation

Guards keep your routes secure and your code clean! 🔒
