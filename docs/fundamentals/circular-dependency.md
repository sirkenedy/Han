# Circular Dependency

A circular dependency occurs when two or more modules or providers depend on each other, creating a dependency loop. Han Framework helps you identify and resolve these issues to keep your application architecture clean and maintainable.

## What is a Circular Dependency?

A circular dependency happens when:
- **Module A** imports **Module B**
- **Module B** imports **Module A** (directly or indirectly)

Or when:
- **Service A** depends on **Service B**
- **Service B** depends on **Service A**

This creates a loop that can cause initialization problems and make your code harder to understand and maintain.

### Simple Example

```typescript
// ❌ Circular Dependency Problem

// user.service.ts
@Injectable()
export class UserService {
  constructor(private orderService: OrderService) {} // Depends on OrderService

  getUserOrders(userId: string) {
    return this.orderService.getOrdersByUser(userId);
  }
}

// order.service.ts
@Injectable()
export class OrderService {
  constructor(private userService: UserService) {} // Depends on UserService

  getOrdersByUser(userId: string) {
    const user = this.userService.findById(userId); // Circular!
    return this.orders.filter(o => o.userId === user.id);
  }
}
```

## Why are Circular Dependencies Bad?

### 1. Initialization Problems

The dependency injection container can't determine which service to create first:

```
UserService needs OrderService
OrderService needs UserService
Which one creates first? 🤔
```

### 2. Harder to Understand

Circular dependencies make code flow harder to follow:

```typescript
// Where does the logic start?
UserService → OrderService → UserService → ?
```

### 3. Tight Coupling

Services become tightly coupled, making them:
- Harder to test
- Harder to reuse
- Harder to modify

### 4. Maintenance Issues

Changes in one service can unexpectedly affect the other.

## Detecting Circular Dependencies

Han Framework will log warnings when circular dependencies are detected during module initialization:

```
Warning: Possible circular dependency detected
  UserModule → OrderModule → UserModule
```

### Manual Detection

Look for these patterns in your code:

```typescript
// ❌ Module circular dependency
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
```

```typescript
// ❌ Provider circular dependency
// user.service.ts
export class UserService {
  constructor(private orderService: OrderService) {}
}

// order.service.ts
export class OrderService {
  constructor(private userService: UserService) {}
}
```

## How to Resolve Circular Dependencies

### Solution 1: Extract Shared Logic

Create a shared module/service for common functionality:

```typescript
// ❌ Before - Circular dependency
@Injectable()
export class UserService {
  constructor(private orderService: OrderService) {}

  getUserWithOrders(userId: string) {
    return {
      user: this.findById(userId),
      orders: this.orderService.getOrdersByUser(userId),
    };
  }
}

@Injectable()
export class OrderService {
  constructor(private userService: UserService) {}

  getOrdersByUser(userId: string) {
    const user = this.userService.findById(userId);
    return this.orders.filter(o => o.userId === user.id);
  }
}

// ✅ After - Shared service
@Injectable()
export class UserOrderService {
  constructor(
    private userService: UserService,
    private orderService: OrderService,
  ) {}

  getUserWithOrders(userId: string) {
    return {
      user: this.userService.findById(userId),
      orders: this.orderService.getOrdersByUser(userId),
    };
  }

  getOrderWithUser(orderId: string) {
    const order = this.orderService.findById(orderId);
    const user = this.userService.findById(order.userId);
    return { order, user };
  }
}

@Injectable()
export class UserService {
  // No dependency on OrderService anymore!
  findById(userId: string) {
    return this.users.find(u => u.id === userId);
  }
}

@Injectable()
export class OrderService {
  // No dependency on UserService anymore!
  findById(orderId: string) {
    return this.orders.find(o => o.id === orderId);
  }

  getOrdersByUser(userId: string) {
    return this.orders.filter(o => o.userId === userId);
  }
}
```

### Solution 2: Use Events/Event Emitters

Decouple services using events:

```typescript
// ❌ Before - Direct dependency
@Injectable()
export class UserService {
  constructor(private emailService: EmailService) {}

  async createUser(data: any) {
    const user = await this.save(data);
    await this.emailService.sendWelcomeEmail(user); // Direct call
    return user;
  }
}

// ✅ After - Event-based
import { EventEmitter } from 'events';

const eventBus = new EventEmitter();

@Injectable()
export class UserService {
  async createUser(data: any) {
    const user = await this.save(data);
    eventBus.emit('user.created', user); // Emit event
    return user;
  }
}

@Injectable()
export class EmailService {
  constructor() {
    // Listen for events
    eventBus.on('user.created', (user) => {
      this.sendWelcomeEmail(user);
    });
  }

  async sendWelcomeEmail(user: any) {
    console.log(`Sending welcome email to ${user.email}`);
  }
}
```

### Solution 3: Lazy Injection (forwardRef)

Use lazy injection when you absolutely need the dependency:

```typescript
import { Injectable, Inject } from 'han-prev-core';

// ⚠️ Use sparingly - not ideal but sometimes necessary
@Injectable()
export class UserService {
  private _orderService: OrderService;

  constructor(
    @Inject('OrderService')
    orderServiceGetter: () => OrderService,
  ) {
    // Lazy initialization
    Object.defineProperty(this, '_orderService', {
      get: () => orderServiceGetter(),
    });
  }

  getUserOrders(userId: string) {
    return this._orderService.getOrdersByUser(userId);
  }
}
```

### Solution 4: Refactor to Remove Dependency

Often, the best solution is to restructure your code:

```typescript
// ❌ Before - Services depend on each other
@Injectable()
export class UserService {
  constructor(private orderService: OrderService) {}

  getUserDashboard(userId: string) {
    const orders = this.orderService.getOrdersByUser(userId);
    return { user: this.findById(userId), orders };
  }
}

@Injectable()
export class OrderService {
  constructor(private userService: UserService) {}

  getOrderDetails(orderId: string) {
    const order = this.findById(orderId);
    const user = this.userService.findById(order.userId);
    return { order, user };
  }
}

// ✅ After - Controller handles composition
@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private orderService: OrderService,
  ) {}

  @Get(':id/dashboard')
  getUserDashboard(@Param('id') id: string) {
    const user = this.userService.findById(id);
    const orders = this.orderService.getOrdersByUser(id);
    return { user, orders };
  }
}

@Controller('orders')
export class OrderController {
  constructor(
    private orderService: OrderService,
    private userService: UserService,
  ) {}

  @Get(':id')
  getOrderDetails(@Param('id') id: string) {
    const order = this.orderService.findById(id);
    const user = this.userService.findById(order.userId);
    return { order, user };
  }
}

// Services are now independent
@Injectable()
export class UserService {
  findById(userId: string) {
    return this.users.find(u => u.id === userId);
  }
}

@Injectable()
export class OrderService {
  findById(orderId: string) {
    return this.orders.find(o => o.id === orderId);
  }

  getOrdersByUser(userId: string) {
    return this.orders.filter(o => o.userId === userId);
  }
}
```

### Solution 5: Use Module forwardRef

For module-level circular dependencies:

```typescript
// ❌ Before - Circular module imports
// user.module.ts
@Module({
  imports: [OrderModule], // Error: circular import
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

// order.module.ts
@Module({
  imports: [UserModule], // Error: circular import
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}

// ✅ Better - Extract shared module
@Module({
  providers: [SharedService],
  exports: [SharedService],
})
export class SharedModule {}

@Module({
  imports: [SharedModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

@Module({
  imports: [SharedModule],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}

// ✅ Or - Import in root module only
@Module({
  imports: [
    UserModule,
    OrderModule,
  ],
  providers: [UserOrderFacade],
})
export class AppModule {}
```

## Real-World Examples

### Example 1: E-commerce Circular Dependency

```typescript
// ❌ Problem: Circular dependency
@Injectable()
export class ProductService {
  constructor(private inventoryService: InventoryService) {}

  getProductWithStock(productId: string) {
    const product = this.findById(productId);
    const stock = this.inventoryService.getStock(productId);
    return { ...product, stock };
  }
}

@Injectable()
export class InventoryService {
  constructor(private productService: ProductService) {}

  updateStock(productId: string, quantity: number) {
    const product = this.productService.findById(productId);
    // Update stock logic
  }
}

// ✅ Solution: Create a facade service
@Injectable()
export class ProductService {
  findById(productId: string) {
    return this.products.find(p => p.id === productId);
  }

  updateProduct(productId: string, data: any) {
    // Update logic
  }
}

@Injectable()
export class InventoryService {
  getStock(productId: string) {
    return this.inventory[productId] || 0;
  }

  updateStock(productId: string, quantity: number) {
    this.inventory[productId] = quantity;
  }
}

@Injectable()
export class ProductInventoryFacade {
  constructor(
    private productService: ProductService,
    private inventoryService: InventoryService,
  ) {}

  getProductWithStock(productId: string) {
    const product = this.productService.findById(productId);
    const stock = this.inventoryService.getStock(productId);
    return { ...product, stock };
  }

  updateProductAndStock(productId: string, productData: any, stockQty: number) {
    this.productService.updateProduct(productId, productData);
    this.inventoryService.updateStock(productId, stockQty);
  }
}
```

### Example 2: Authentication Circular Dependency

```typescript
// ❌ Problem: Circular dependency
@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    // Validate password
    return this.generateToken(user);
  }
}

@Injectable()
export class UserService {
  constructor(private authService: AuthService) {}

  async createUser(data: any) {
    const user = await this.save(data);
    const token = await this.authService.generateToken(user); // Circular!
    return { user, token };
  }
}

// ✅ Solution: Separate concerns
@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    return this.generateToken(user);
  }

  generateToken(user: any) {
    // Generate JWT token
    return 'token';
  }
}

@Injectable()
export class UserService {
  async createUser(data: any) {
    const user = await this.save(data);
    return user; // Just return user
  }

  findByEmail(email: string) {
    return this.users.find(u => u.email === email);
  }
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Post('register')
  async register(@Body() data: any) {
    const user = await this.userService.createUser(data);
    const token = await this.authService.generateToken(user);
    return { user, token };
  }

  @Post('login')
  async login(@Body() credentials: any) {
    return this.authService.login(credentials.email, credentials.password);
  }
}
```

### Example 3: Notification System

```typescript
// ❌ Problem: Circular dependency
@Injectable()
export class NotificationService {
  constructor(private userService: UserService) {}

  async sendNotification(userId: string, message: string) {
    const user = await this.userService.findById(userId);
    // Send notification
  }
}

@Injectable()
export class UserService {
  constructor(private notificationService: NotificationService) {}

  async updateUser(userId: string, data: any) {
    const user = await this.update(userId, data);
    await this.notificationService.sendNotification(
      userId,
      'Your profile was updated'
    );
    return user;
  }
}

// ✅ Solution: Use events
import { EventEmitter } from 'events';

const eventBus = new EventEmitter();

@Injectable()
export class UserService {
  async updateUser(userId: string, data: any) {
    const user = await this.update(userId, data);
    eventBus.emit('user.updated', { userId, user });
    return user;
  }
}

@Injectable()
export class NotificationService {
  constructor(private userService: UserService) {
    // Subscribe to events
    eventBus.on('user.updated', this.handleUserUpdate.bind(this));
  }

  private async handleUserUpdate({ userId }: any) {
    await this.sendNotification(userId, 'Your profile was updated');
  }

  async sendNotification(userId: string, message: string) {
    const user = await this.userService.findById(userId);
    console.log(`Sending to ${user.email}: ${message}`);
  }
}
```

## Best Practices

### 1. Keep Dependencies One-Way

```typescript
// ✅ Good - Clear dependency direction
UserController → UserService → UserRepository → Database
```

### 2. Use Layered Architecture

```
Controllers (Presentation Layer)
     ↓
Services (Business Logic Layer)
     ↓
Repositories (Data Access Layer)
     ↓
Database
```

### 3. Apply Dependency Inversion Principle

```typescript
// ✅ Good - Depend on abstractions
interface IEmailService {
  send(to: string, message: string): Promise<void>;
}

@Injectable()
export class UserService {
  constructor(
    @Inject('IEmailService')
    private emailService: IEmailService,
  ) {}
}
```

### 4. Keep Services Focused

```typescript
// ✅ Good - Single responsibility
@Injectable()
export class UserService {
  findById(id: string) { }
  create(data: any) { }
  update(id: string, data: any) { }
}

// ❌ Avoid - Too many responsibilities
@Injectable()
export class UserService {
  findById(id: string) { }
  sendEmail(userId: string) { }
  processPayment(userId: string) { }
  generateReport(userId: string) { }
}
```

### 5. Use Composition in Controllers

```typescript
// ✅ Good - Controller composes services
@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private orderService: OrderService,
    private emailService: EmailService,
  ) {}

  @Get(':id/dashboard')
  async getDashboard(@Param('id') id: string) {
    const [user, orders] = await Promise.all([
      this.userService.findById(id),
      this.orderService.getOrdersByUser(id),
    ]);
    return { user, orders };
  }
}
```

## Common Anti-Patterns

### Anti-Pattern 1: God Service

```typescript
// ❌ Bad - Service does everything
@Injectable()
export class AppService {
  constructor(
    private userService: UserService,
    private orderService: OrderService,
    private productService: ProductService,
    // ... 20 more services
  ) {}

  // Everything happens here
}

// ✅ Good - Focused services
@Injectable()
export class OrderProcessingService {
  constructor(
    private orderService: OrderService,
    private paymentService: PaymentService,
  ) {}

  async processOrder(orderId: string) {
    // Focused logic
  }
}
```

### Anti-Pattern 2: Bidirectional Dependencies

```typescript
// ❌ Bad
UserService ←→ OrderService

// ✅ Good
UserService → SharedService ← OrderService
```

### Anti-Pattern 3: Deep Dependency Chains

```typescript
// ❌ Bad
A → B → C → D → E → F → G

// ✅ Good - Flatten
A → B
A → C
A → D
```

## Debugging Circular Dependencies

### 1. Check Import Statements

```typescript
// user.service.ts
import { OrderService } from './order.service'; // ⚠️ Check this

// order.service.ts
import { UserService } from './user.service'; // ⚠️ And this
```

### 2. Review Constructor Dependencies

```typescript
// Look for mutual dependencies
constructor(private orderService: OrderService) {} // in UserService
constructor(private userService: UserService) {}   // in OrderService
```

### 3. Trace Dependency Graph

```
Draw your dependencies:

UserModule
  ├─ UserService
  │   └─ OrderService ← Problem!
  └─ ...

OrderModule
  ├─ OrderService
  │   └─ UserService ← Problem!
  └─ ...
```

## Quick Reference

```typescript
// ❌ Circular dependency
ServiceA → ServiceB → ServiceA

// ✅ Solution 1: Extract shared
ServiceA → SharedService ← ServiceB

// ✅ Solution 2: Use events
ServiceA → Event → ServiceB

// ✅ Solution 3: Compose in controller
Controller → ServiceA
         → ServiceB

// ✅ Solution 4: Facade pattern
ServiceA ← Facade → ServiceB
```

## Testing Code with Circular Dependencies

```typescript
describe('Services without circular dependencies', () => {
  it('should create UserService independently', () => {
    const userService = new UserService();
    expect(userService).toBeDefined();
  });

  it('should create OrderService independently', () => {
    const orderService = new OrderService();
    expect(orderService).toBeDefined();
  });

  it('should work together via facade', () => {
    const userService = new UserService();
    const orderService = new OrderService();
    const facade = new UserOrderFacade(userService, orderService);

    const result = facade.getUserWithOrders('123');
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('orders');
  });
});
```

## Next Steps

- Learn about [Dependency Injection](/fundamentals/dependency-injection) for proper DI patterns
- Explore [Modules](/fundamentals/modules) for better module organization
- Check out [Providers](/fundamentals/providers) for service architecture

Clean architecture means no circular dependencies! 🚀
