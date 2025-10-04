# Guards

Guards are **authorization handlers** that determine whether a request should be handled by a route handler or not. They execute **after middleware** and **before route handlers**, making them perfect for implementing access control logic.

## What are Guards?

Guards are classes that implement the `CanActivate` interface. They return a boolean (or Promise/Observable of boolean) to indicate whether the request should proceed:

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
    // Return true to allow, false to deny
    return !!request.user;
  }
}
```

## Middleware vs Guards

Understanding the difference is crucial:

| Feature | Middleware | Guards |
|---------|-----------|---------|
| **Purpose** | Request processing, logging, CORS | Authorization, access control |
| **Returns** | `void` (calls `next()`) | `boolean` (allow/deny) |
| **When** | Before route handler | After middleware, before handler |
| **Access to** | `req`, `res`, `next` | `ExecutionContext` (richer context) |
| **Best for** | Transformation, validation | Authorization decisions |

**Example flow:**
```
Request → Middleware → Guards → Route Handler
```

## Why Use Guards?

### 1. Authorization Logic

Keep authorization separate from business logic:

```typescript
// ❌ Bad - Authorization in controller
@Controller('admin')
export class AdminController {
  @Get('users')
  getUsers(@Headers('authorization') auth: string) {
    if (!auth) {
      throw new Error('Unauthorized');
    }
    if (!this.isAdmin(auth)) {
      throw new Error('Unauthorized');
    }
    return this.userService.findAll();
  }
}

// ✅ Good - Guard handles authorization
@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  @Get('users')
  getUsers() {
    return this.userService.findAll();
  }
}
```

### 2. Reusability

Use the same guard across multiple routes:

```typescript
@Injectable()
export class RoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return request.user?.role === 'admin';
  }
}

// Use everywhere
@Controller('admin')
@UseGuards(RoleGuard)
export class AdminController {}

@Controller('settings')
@UseGuards(RoleGuard)
export class SettingsController {}
```

### 3. Clean Code

Declarative authorization is easier to read:

```typescript
@Controller('posts')
export class PostController {
  @Get()
  findAll() {} // Public

  @Post()
  @UseGuards(AuthGuard) // Protected
  create() {}

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard) // Admin only
  delete() {}
}
```

## Creating a Guard

### Step 1: Create the Guard Class

```typescript
// auth.guard.ts
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Check if user is authenticated
    if (!request.user) {
      return false; // Deny access
    }

    return true; // Allow access
  }
}
```

### Step 2: Register in Module

```typescript
// app.module.ts
import { Module } from 'han-prev-core';
import { UserController } from './user.controller';
import { AuthGuard } from './guards/auth.guard';

@Module({
  controllers: [UserController],
  providers: [AuthGuard], // ✅ Register guard
})
export class AppModule {}
```

### Step 3: Apply to Routes

```typescript
// user.controller.ts
import { Controller, Get, UseGuards } from 'han-prev-core';
import { AuthGuard } from './guards/auth.guard';

@Controller('users')
export class UserController {
  @Get('profile')
  @UseGuards(AuthGuard) // ✅ Protected route
  getProfile() {
    return { message: 'This is a protected route' };
  }

  @Get('public')
  getPublic() {
    return { message: 'This is a public route' };
  }
}
```

## Execution Context

Guards receive an `ExecutionContext` that provides access to request details:

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Get HTTP context
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get route handler details
    const handler = context.getHandler();
    const controllerClass = context.getClass();

    // Your authorization logic
    const apiKey = request.headers['x-api-key'];
    return apiKey === 'valid-api-key';
  }
}
```

## Common Guard Examples

### 1. Authentication Guard

Verify user is logged in:

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Check for valid session or token
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      return false;
    }

    try {
      // Verify token and attach user to request
      const user = this.verifyToken(token);
      request.user = user;
      return true;
    } catch (error) {
      return false;
    }
  }

  private verifyToken(token: string) {
    // JWT verification logic
    return { id: 1, email: 'user@example.com', role: 'user' };
  }
}
```

### 2. Role-Based Guard

Check user has required role:

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Verify user exists and is admin
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
  @UseGuards(AuthGuard, AdminGuard) // Both guards must pass
  getDashboard() {
    return { message: 'Admin dashboard' };
  }
}
```

### 3. Dynamic Role Guard

Accept roles as parameters:

```typescript
import { Injectable, SetMetadata } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

// Decorator to set required roles
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Get required roles from metadata
    const requiredRoles = Reflect.getMetadata('roles', context.getHandler());

    if (!requiredRoles) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Check if user has any of the required roles
    return requiredRoles.some((role: string) => user.roles?.includes(role));
  }
}
```

Usage:

```typescript
@Controller('posts')
export class PostController {
  @Get()
  findAll() {} // Public

  @Post()
  @UseGuards(RolesGuard)
  @Roles('editor', 'admin') // Either role works
  create() {}

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin') // Admin only
  delete() {}
}
```

### 4. API Key Guard

Validate API key:

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

Restrict by IP address:

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

    const ip = request.ip ? request.ip : request.connection.remoteAddress;

    return this.whitelist.includes(ip);
  }
}
```

### 6. Time-Based Guard

Allow access during business hours:

```typescript
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class BusinessHoursGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    // Monday-Friday (1-5), 9 AM - 5 PM
    const isWeekday = day >= 1 && day <= 5;
    const isBusinessHours = hour >= 9 && hour < 17;

    return isWeekday && isBusinessHours;
  }
}
```

### 7. Permission-Based Guard

Check fine-grained permissions:

```typescript
import { Injectable, SetMetadata } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

// Decorator to set required permissions
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

    // Check if user has ALL required permissions
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

  @Put(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('posts.update')
  update() {}

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('posts.delete', 'admin')
  delete() {}
}
```

## Applying Guards

### 1. Route-Level Guards

Apply to specific routes:

```typescript
@Controller('users')
export class UserController {
  @Get('profile')
  @UseGuards(AuthGuard) // ✅ Only this route
  getProfile() {
    return { message: 'Protected' };
  }

  @Get('public')
  getPublic() {
    return { message: 'Public' };
  }
}
```

### 2. Controller-Level Guards

Apply to all routes in controller:

```typescript
@Controller('admin')
@UseGuards(AuthGuard, AdminGuard) // ✅ All routes protected
export class AdminController {
  @Get('users')     // Protected
  getUsers() {}

  @Get('settings')  // Protected
  getSettings() {}
}
```

### 3. Global Guards

Apply to all routes in application:

```typescript
// index.ts
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';
import { AuthGuard } from './guards/auth.guard';

const app = await HanFactory.create(AppModule);
const expressApp = app.getHttpServer();

// Global guard
app.useGlobalGuards(new AuthGuard());

await app.listen(3000);
```

### 4. Multiple Guards

Chain multiple guards:

```typescript
@Controller('posts')
export class PostController {
  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard, PermissionsGuard)
  delete() {
    // All guards must pass
  }
}
```

Guards execute in order:
```
AuthGuard → AdminGuard → PermissionsGuard → Route Handler
```

## Guards with Dependencies

Inject services into guards:

```typescript
import { Injectable, Inject } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private userService: UserService,
    @Inject('JWT_SERVICE')
    private jwtService: any,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      return false;
    }

    try {
      const payload = await this.jwtService.verify(token);
      const user = await this.userService.findById(payload.userId);

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

## Async Guards

Handle asynchronous operations:

```typescript
@Injectable()
export class DatabaseAuthGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      return false;
    }

    try {
      // Async database lookup
      const user = await this.userService.findByToken(token);

      if (!user || !user.isActive) {
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

## Guard Execution Order

Guards execute in this order:

```
1. Global Guards (app.useGlobalGuards)
     ↓
2. Controller Guards (@UseGuards on controller)
     ↓
3. Route Guards (@UseGuards on method)
     ↓
4. Route Handler (your method)
```

Example:

```typescript
// 1. Global
app.useGlobalGuards(new LoggerGuard());

// 2. Controller
@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  // 3. Route
  @Get('users')
  @UseGuards(AdminGuard)
  getUsers() {
    // 4. Finally executed!
  }
}
```

Execution: `LoggerGuard → AuthGuard → AdminGuard → getUsers()`

## Error Handling

### Throw Exceptions

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!request.user) {
      throw new Error('Unauthorized');
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

## Real-World Example: Blog Platform

Complete guard implementation for a blog platform:

### Auth Guard

```typescript
// guards/auth.guard.ts
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';
import { JwtService } from '../services/jwt.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = this.extractToken(request);

    if (!token) {
      return false;
    }

    try {
      const payload = await this.jwtService.verify(token);
      const user = await this.userService.findById(payload.sub);

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

  private extractToken(request: any) {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    if (!authHeader.startsWith("Bearer ")) {
      return null;
    }

    return authHeader.split(" ")[1];
  }
}
```

### Role Guard

```typescript
// guards/role.guard.ts
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

### Post Ownership Guard

```typescript
// guards/post-ownership.guard.ts
import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';
import { PostService } from '../post/post.service';

@Injectable()
export class PostOwnershipGuard implements CanActivate {
  constructor(private postService: PostService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const postId = request.params.id;

    if (!user) {
      return false;
    }

    // Admin can access all posts
    if (user.role === 'admin') {
      return true;
    }

    // Check if user owns the post
    const post = await this.postService.findById(postId);

    if (!post) {
      return false;
    }

    return post.authorId === user.id;
  }
}
```

### Usage

```typescript
// post.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from 'han-prev-core';
import { PostService } from './post.service';
import { AuthGuard } from '../guards/auth.guard';
import { RoleGuard, Roles } from '../guards/role.guard';
import { PostOwnershipGuard } from '../guards/post-ownership.guard';

@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Get()
  findAll() {
    // Public - no guard
    return this.postService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // Public - no guard
    return this.postService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard) // Must be logged in
  create(@Body() data: any) {
    return this.postService.create(data);
  }

  @Put(':id')
  @UseGuards(AuthGuard, PostOwnershipGuard) // Must own the post
  update(@Param('id') id: string, @Body() data: any) {
    return this.postService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, PostOwnershipGuard) // Must own the post
  delete(@Param('id') id: string) {
    return this.postService.delete(id);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('editor', 'admin') // Editor or admin only
  publish(@Param('id') id: string) {
    return this.postService.publish(id);
  }
}
```

## Best Practices

### 1. Return Boolean

Always return boolean or Promise<boolean>:

```typescript
// ✅ Good
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    return true; // or false
  }
}

// ✅ Good - Async
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(): Promise<boolean> {
    return true;
  }
}

// ❌ Bad
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate() {
    // No return value
  }
}
```

### 2. Single Responsibility

One guard, one responsibility:

```typescript
// ✅ Good - Separate guards
export class AuthGuard implements CanActivate {} // Authentication
export class RoleGuard implements CanActivate {} // Authorization
export class RateLimitGuard implements CanActivate {} // Rate limiting

// ❌ Bad - Too many responsibilities
export class MegaGuard implements CanActivate {
  // Auth + Authorization + Rate limiting + More
}
```

### 3. Use Metadata for Dynamic Guards

```typescript
// ✅ Good - Configurable
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@UseGuards(RoleGuard)
@Roles('admin', 'editor')

// ❌ Bad - Hardcoded
export class AdminOrEditorGuard implements CanActivate {}
export class AdminOrModeratorGuard implements CanActivate {}
// Too many similar guards
```

### 4. Handle Errors Gracefully

```typescript
// ✅ Good
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const user = await this.validateToken();
      return !!user;
    } catch (error) {
      this.logger.error('Auth error:', error);
      return false; // Deny on error
    }
  }
}
```

### 5. Inject Dependencies

```typescript
// ✅ Good
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private logger: LoggerService,
  ) {}
}

// ❌ Avoid
export class AuthGuard implements CanActivate {
  userService = new UserService(); // Hard to test
}
```

## Testing Guards

Guards are easy to test in isolation:

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

Creates `src/guards/auth.guard.ts`:

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

## Next Steps

- Learn about [Interceptors](/fundamentals/interceptors) for response transformation
- Explore [Middleware](/fundamentals/middleware) for request processing
- Check out [Pipes](/fundamentals/pipes) for data validation and transformation

## Quick Reference

```typescript
// 1. Create guard
@Injectable()
export class MyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }
}

// 2. Register in module
@Module({
  providers: [MyGuard],
})
export class MyModule {}

// 3. Apply to route
@Get()
@UseGuards(MyGuard)
findAll() {}

// 4. Apply to controller
@Controller('users')
@UseGuards(MyGuard)
export class UserController {}

// 5. Apply globally
app.useGlobalGuards(new MyGuard());
```

Guards keep your routes secure and your code clean! 🔒
