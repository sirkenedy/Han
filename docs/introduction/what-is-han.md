# What is Han Framework?

Han Framework is a **modern, developer-friendly Node.js framework** for building efficient, scalable server-side applications. It combines the simplicity of Express with the power of TypeScript decorators and dependency injection.

## Philosophy

Han Framework was created with three core principles:

### 1. **Developer Experience First** 🎯

Writing code should be enjoyable, not frustrating. Han Framework provides:

- Clean, intuitive API that just makes sense
- Excellent error messages that actually help you fix the problem
- Comprehensive documentation with real-world examples
- Zero configuration to get started - sensible defaults everywhere

### 2. **Performance Matters** ⚡

Fast applications = happy users. Han Framework achieves this through:

- Smart caching and memoization
- Lazy-loading modules
- Optimized dependency resolution
- Minimal overhead on top of Express

### 3. **Flexibility Over Lock-in** 🔓

You should choose your tools, not be forced into them. Han Framework:

- Works with any database (Mongoose, TypeORM, Prisma, raw SQL)
- Supports any validation library (class-validator, Zod, Joi)
- Compatible with Express middleware ecosystem
- Easy to extend and customize

## Core Features

### TypeScript-First Design

```typescript
import { Controller, Get, Post, Body, Param } from 'han-prev-core';

@Controller('users')
export class UserController {
  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id, name: 'John Doe' };
  }

  @Post()
  create(@Body() userData: CreateUserDto) {
    return { id: '123', ...userData };
  }
}
```

Full TypeScript support with decorators, type inference, and excellent autocomplete in your IDE.

### Powerful Dependency Injection

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectModel('User')
    private userModel: Model<UserDocument>,

    @Inject('EmailService')
    private emailService: EmailService,
  ) {}

  async createUser(data: CreateUserDto) {
    const user = await this.userModel.create(data);
    await this.emailService.sendWelcome(user.email);
    return user;
  }
}
```

Automatic dependency resolution with constructor injection, custom tokens, and model injection.

### Modular Architecture

```typescript
@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [DatabaseModule],
  exports: [UserService],
})
export class UserModule {}
```

Organize your application into logical modules for better maintainability and reusability.

### Flexible Middleware System

```typescript
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

Apply middleware at global, module, controller, or route level with fine-grained control.

## Comparison with Other Frameworks

### vs NestJS

**Similarities:**
- Decorator-based syntax
- Dependency injection
- Module system
- TypeScript-first

**Differences:**
- ✅ **Simpler setup** - Zero config vs extensive configuration
- ✅ **Smaller bundle** - Lightweight core without unnecessary dependencies
- ✅ **Faster development** - Less boilerplate, more productivity
- ✅ **Flexible** - Not opinionated about libraries (validation, ORM, etc.)

### vs Express

**Similarities:**
- Built on top of Express
- Compatible with Express middleware
- Fast and lightweight

**Differences:**
- ✅ **TypeScript native** - First-class TS support with decorators
- ✅ **Dependency injection** - Automatic dependency management
- ✅ **Module system** - Better code organization
- ✅ **Reduced boilerplate** - Decorators vs manual routing

## When to Use Han Framework?

### ✅ Perfect For:

- **REST APIs** - Clean controller syntax with automatic routing
- **Microservices** - Lightweight and modular architecture
- **CRUD applications** - Built-in patterns for common operations
- **Real-time apps** - Works great with Socket.io and WebSockets
- **Enterprise applications** - Scalable architecture with DI and modules

### ⚠️ Consider Alternatives:

- **Serverless functions** - Too much overhead for single-function deployments
- **Static sites** - Use Next.js or Astro instead
- **GraphQL-first** - NestJS has better built-in GraphQL support

## Architecture Overview

```
┌─────────────────────────────────────────┐
│          Your Application               │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │ Module A │  │ Module B │            │
│  ├──────────┤  ├──────────┤            │
│  │ Controllers│ │ Controllers│          │
│  │ Providers │  │ Providers │          │
│  │ Middleware│  │ Middleware│          │
│  └──────────┘  └──────────┘            │
│                                         │
├─────────────────────────────────────────┤
│        Han Framework Core               │
│  - DI Container                         │
│  - Router Factory                       │
│  - Middleware System                    │
│  - Lifecycle Management                 │
├─────────────────────────────────────────┤
│            Express.js                   │
└─────────────────────────────────────────┘
```

## Next Steps

Ready to get started? Check out the [Getting Started](/introduction/getting-started) guide to build your first Han Framework application!

Or dive deeper into specific topics:

- [Controllers](/fundamentals/controllers) - Handle HTTP requests
- [Providers](/fundamentals/providers) - Business logic and services
- [Modules](/fundamentals/modules) - Organize your application
- [Dependency Injection](/fundamentals/dependency-injection) - Advanced DI patterns
