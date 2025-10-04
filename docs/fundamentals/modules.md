# Modules

Modules are the **organizational units** of Han Framework applications. They help you structure your code by grouping related components (controllers, providers, etc.) together.

## What is a Module?

A module is a class annotated with `@Module()` decorator. It acts as a container for organizing related functionality:

```typescript
import { Module } from 'han-prev-core';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

## Why Use Modules?

### 1. Organization

Keep related code together:

```
src/
├── users/
│   ├── user.controller.ts
│   ├── user.service.ts
│   └── user.module.ts       # Users module
├── products/
│   ├── product.controller.ts
│   ├── product.service.ts
│   └── product.module.ts    # Products module
└── app.module.ts            # Root module
```

### 2. Encapsulation

Modules hide internal implementation:

```typescript
@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,        // Private - only used internally
    EmailService,          // Private - only used internally
  ],
  exports: [UserService], // ✅ Public - can be imported by other modules
})
export class UserModule {}
```

### 3. Reusability

Import modules across your application:

```typescript
@Module({
  imports: [UserModule], // ✅ Reuse UserModule
  controllers: [AdminController],
})
export class AdminModule {}
```

## Creating a Module

### Basic Module

```typescript
// user.module.ts
import { Module } from 'han-prev-core';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],  // HTTP endpoints
  providers: [UserService],       // Business logic
})
export class UserModule {}
```

### Module with Imports

```typescript
// order.module.ts
import { Module } from 'han-prev-core';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { UserModule } from '../user/user.module';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [UserModule, ProductModule], // Import other modules
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
```

### Module with Exports

```typescript
// database.module.ts
import { Module } from 'han-prev-core';
import { DatabaseService } from './database.service';
import { UserRepository } from './repositories/user.repository';
import { ProductRepository } from './repositories/product.repository';

@Module({
  providers: [
    DatabaseService,
    UserRepository,
    ProductRepository,
  ],
  exports: [
    DatabaseService,      // ✅ Other modules can import this
    UserRepository,       // ✅ Other modules can import this
    ProductRepository,    // ✅ Other modules can import this
  ],
})
export class DatabaseModule {}
```

## Module Properties

### `controllers`

HTTP request handlers:

```typescript
@Module({
  controllers: [
    UserController,
    ProfileController,
    AuthController,
  ],
})
export class UserModule {}
```

### `providers`

Services, repositories, and other injectable classes:

```typescript
@Module({
  providers: [
    UserService,
    UserRepository,
    EmailService,
    LoggerService,
  ],
})
export class UserModule {}
```

### `imports`

Other modules to import:

```typescript
@Module({
  imports: [
    UserModule,
    ProductModule,
    DatabaseModule,
  ],
})
export class AppModule {}
```

### `exports`

Providers to make available to other modules:

```typescript
@Module({
  providers: [UserService, EmailService],
  exports: [UserService], // Only UserService is public
})
export class UserModule {}
```

## Root Module

Every application has one **root module** (usually `AppModule`):

```typescript
// app.module.ts
import { Module } from 'han-prev-core';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    UserModule,
    ProductModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Bootstrap the root module:

```typescript
// index.ts
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HanFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
```

## Feature Modules

Organize features into dedicated modules:

### User Module

```typescript
// users/user.module.ts
import { Module } from 'han-prev-core';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { EmailService } from './email.service';

@Module({
  controllers: [UserController],
  providers: [UserService, EmailService],
  exports: [UserService], // Other modules can use UserService
})
export class UserModule {}
```

### Product Module

```typescript
// products/product.module.ts
import { Module } from 'han-prev-core';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
```

### Order Module

```typescript
// orders/order.module.ts
import { Module } from 'han-prev-core';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { UserModule } from '../users/user.module';
import { ProductModule } from '../products/product.module';

@Module({
  imports: [UserModule, ProductModule], // Dependencies
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
```

## Shared Modules

Create modules for shared functionality:

```typescript
// shared/shared.module.ts
import { Module } from 'han-prev-core';
import { LoggerService } from './logger.service';
import { EmailService } from './email.service';
import { FileService } from './file.service';

@Module({
  providers: [
    LoggerService,
    EmailService,
    FileService,
  ],
  exports: [
    LoggerService,
    EmailService,
    FileService,
  ],
})
export class SharedModule {}
```

Use in other modules:

```typescript
@Module({
  imports: [SharedModule], // ✅ Get access to Logger, Email, File services
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

## Real-World Example: E-Commerce App

Complete module structure for an e-commerce application:

### App Module (Root)

```typescript
// app.module.ts
import { Module } from 'han-prev-core';
import { UserModule } from './users/user.module';
import { ProductModule } from './products/product.module';
import { OrderModule } from './orders/order.module';
import { PaymentModule } from './payment/payment.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    SharedModule,    // Global utilities
    UserModule,      // User management
    ProductModule,   // Product catalog
    OrderModule,     // Order processing
    PaymentModule,   // Payment handling
  ],
})
export class AppModule {}
```

### User Module

```typescript
// users/user.module.ts
import { Module } from 'han-prev-core';
import { UserController } from './user.controller';
import { ProfileController } from './profile.controller';
import { UserService } from './user.service';
import { ProfileService } from './profile.service';
import { SharedModule } from '../shared/shared.module';
import mongoose from 'mongoose';
import { UserSchema } from './schemas/user.schema';

@Module({
  imports: [SharedModule],
  controllers: [UserController, ProfileController],
  providers: [
    UserService,
    ProfileService,
    {
      provide: 'UserModel',
      useFactory: () => mongoose.model('User', UserSchema),
    },
  ],
  exports: [UserService], // OrderModule can use UserService
})
export class UserModule {}
```

### Product Module

```typescript
// products/product.module.ts
import { Module } from 'han-prev-core';
import { ProductController } from './product.controller';
import { CategoryController } from './category.controller';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { SharedModule } from '../shared/shared.module';
import mongoose from 'mongoose';
import { ProductSchema } from './schemas/product.schema';
import { CategorySchema } from './schemas/category.schema';

@Module({
  imports: [SharedModule],
  controllers: [ProductController, CategoryController],
  providers: [
    ProductService,
    CategoryService,
    {
      provide: 'ProductModel',
      useFactory: () => mongoose.model('Product', ProductSchema),
    },
    {
      provide: 'CategoryModel',
      useFactory: () => mongoose.model('Category', CategorySchema),
    },
  ],
  exports: [ProductService, CategoryService],
})
export class ProductModule {}
```

### Order Module

```typescript
// orders/order.module.ts
import { Module } from 'han-prev-core';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { UserModule } from '../users/user.module';
import { ProductModule } from '../products/product.module';
import { PaymentModule } from '../payment/payment.module';
import { SharedModule } from '../shared/shared.module';
import mongoose from 'mongoose';
import { OrderSchema } from './schemas/order.schema';

@Module({
  imports: [
    SharedModule,
    UserModule,      // Need UserService
    ProductModule,   // Need ProductService
    PaymentModule,   // Need PaymentService
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    {
      provide: 'OrderModel',
      useFactory: () => mongoose.model('Order', OrderSchema),
    },
  ],
  exports: [OrderService],
})
export class OrderModule {}
```

## Module Middleware

Configure middleware at the module level:

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

## Dynamic Modules

Create configurable modules:

```typescript
// database.module.ts
import { Module } from 'han-prev-core';
import { DatabaseService } from './database.service';

@Module({})
export class DatabaseModule {
  static forRoot(options: { url: string }) {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DATABASE_CONNECTION',
          useFactory: () => createConnection(options.url),
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }
}
```

Use it:

```typescript
@Module({
  imports: [
    DatabaseModule.forRoot({
      url: 'mongodb://localhost:27017/myapp',
    }),
  ],
})
export class AppModule {}
```

Learn more: [Dynamic Modules →](/fundamentals/dynamic-modules)

## Module Best Practices

### 1. One Feature Per Module

```typescript
// ✅ Good - Clear single purpose
@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}

// ❌ Bad - Mixed concerns
@Module({
  controllers: [UserController, ProductController, OrderController],
  providers: [UserService, ProductService, OrderService],
})
export class AppModule {}
```

### 2. Export Only What's Needed

```typescript
// ✅ Good - Minimal public API
@Module({
  providers: [
    UserService,
    UserRepository,     // Private
    EmailService,       // Private
  ],
  exports: [UserService], // Only public interface
})
export class UserModule {}
```

### 3. Use Shared Modules

```typescript
// ✅ Good - Reusable utilities
@Module({
  providers: [LoggerService, EmailService],
  exports: [LoggerService, EmailService],
})
export class SharedModule {}

// Use everywhere
@Module({
  imports: [SharedModule],
  // ...
})
export class UserModule {}
```

### 4. Keep Dependencies Clear

```typescript
// ✅ Good - Clear dependencies
@Module({
  imports: [UserModule, ProductModule], // Explicit dependencies
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
```

### 5. Organize by Feature

```
src/
├── users/
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.module.ts
│   └── dto/
├── products/
│   ├── product.controller.ts
│   ├── product.service.ts
│   ├── product.module.ts
│   └── dto/
└── app.module.ts
```

## Module Loading

Modules are loaded in this order:

1. Import all modules
2. Register providers
3. Resolve dependencies
4. Create controller instances
5. Setup routes

```typescript
@Module({
  imports: [DatabaseModule],      // 1. Loaded first
  providers: [UserService],        // 2. Then providers
  controllers: [UserController],   // 3. Then controllers
})
export class UserModule {}
```

## Circular Dependencies

Avoid circular dependencies between modules:

```typescript
// ❌ Circular dependency
// user.module.ts
@Module({
  imports: [OrderModule], // Imports OrderModule
})
export class UserModule {}

// order.module.ts
@Module({
  imports: [UserModule], // Imports UserModule
})
export class OrderModule {}

// ✅ Solution: Extract shared module
@Module({
  providers: [SharedService],
  exports: [SharedService],
})
export class SharedModule {}

@Module({
  imports: [SharedModule],
})
export class UserModule {}

@Module({
  imports: [SharedModule],
})
export class OrderModule {}
```

## Testing Modules

Test modules in isolation:

```typescript
describe('UserModule', () => {
  it('should have UserController', () => {
    const controllers = Reflect.getMetadata('controllers', UserModule);
    expect(controllers).toContain(UserController);
  });

  it('should have UserService', () => {
    const providers = Reflect.getMetadata('providers', UserModule);
    expect(providers).toContain(UserService);
  });
});
```

## Quick Reference

```typescript
// 1. Create module
@Module({
  imports: [OtherModule],      // Modules to import
  controllers: [MyController], // HTTP handlers
  providers: [MyService],      // Injectable services
  exports: [MyService],        // Public API
})
export class MyModule {}

// 2. Import in root module
@Module({
  imports: [MyModule],
})
export class AppModule {}

// 3. Bootstrap
const app = await HanFactory.create(AppModule);
```

## Next Steps

- Learn about [Providers](/fundamentals/providers) to understand what goes in modules
- Explore [Dependency Injection](/fundamentals/dependency-injection) for advanced patterns
- Check out [Dynamic Modules](/fundamentals/dynamic-modules) for configurable modules
- See [Module Middleware](/techniques/module-middleware) for module-level middleware

## Module Organization Tips

### Small Applications

```typescript
@Module({
  controllers: [
    UserController,
    ProductController,
    OrderController,
  ],
  providers: [
    UserService,
    ProductService,
    OrderService,
  ],
})
export class AppModule {}
```

### Large Applications

```typescript
@Module({
  imports: [
    // Core modules
    SharedModule,
    DatabaseModule,

    // Feature modules
    UserModule,
    ProductModule,
    OrderModule,
    PaymentModule,
    NotificationModule,

    // Admin modules
    AdminModule,
  ],
})
export class AppModule {}
```

Modules keep your application organized, maintainable, and scalable! 🚀
