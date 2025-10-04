# Providers

Providers are the fundamental building blocks of Han Framework applications. They contain your **business logic**, **data access**, and **shared functionality**. Providers can be injected into controllers and other providers using **dependency injection**.

## What are Providers?

A provider is simply a class annotated with the `@Injectable()` decorator. This tells Han Framework that the class can be managed by the DI container and injected into other components.

```typescript
import { Injectable } from 'han-prev-core';

@Injectable()
export class UserService {
  getUsers() {
    return ['User 1', 'User 2', 'User 3'];
  }
}
```

## Why Use Providers?

### 1. Separation of Concerns

Keep your controllers clean and focused on handling HTTP requests:

```typescript
// ❌ Bad - Business logic in controller
@Controller('users')
export class UserController {
  @Post()
  async create(@Body() data: any) {
    // Validation logic
    if (!data.email || !data.email.includes('@')) {
      throw new Error('Invalid email');
    }

    // Business logic
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Data access
    const user = await db.users.create({ ...data, password: hashedPassword });

    // Side effects
    await emailService.send(user.email, 'Welcome!');

    return user;
  }
}

// ✅ Good - Clean controller, logic in service
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  create(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }
}
```

### 2. Reusability

Share logic across multiple controllers:

```typescript
@Injectable()
export class UserService {
  findById(id: string) {
    return this.users.find(u => u.id === id);
  }
}

// Used in multiple controllers
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}

@Controller('admin')
export class AdminController {
  constructor(private userService: UserService) {}

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}
```

### 3. Testability

Easy to mock and test:

```typescript
describe('UserController', () => {
  let controller: UserController;
  let mockUserService: any;

  beforeEach(() => {
    mockUserService = {
      findById: jest.fn().mockResolvedValue({ id: '1', name: 'John' })
    };
    controller = new UserController(mockUserService);
  });

  it('should return user', async () => {
    const result = await controller.getUser('1');
    expect(result).toEqual({ id: '1', name: 'John' });
  });
});
```

## Creating a Provider

### Step 1: Create the Service

```typescript
// user.service.ts
import { Injectable } from 'han-prev-core';

@Injectable()
export class UserService {
  private users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];

  findAll() {
    return this.users;
  }

  findById(id: number) {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  create(data: { name: string; email: string }) {
    const newUser = {
      id: this.users.length + 1,
      ...data,
    };
    this.users.push(newUser);
    return newUser;
  }

  update(id: number, data: Partial<{ name: string; email: string }>) {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    this.users[userIndex] = { ...this.users[userIndex], ...data };
    return this.users[userIndex];
  }

  delete(id: number) {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    this.users.splice(userIndex, 1);
    return { deleted: true };
  }
}
```

### Step 2: Register in Module

```typescript
// user.module.ts
import { Module } from 'han-prev-core';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService], // ✅ Register here
})
export class UserModule {}
```

### Step 3: Inject into Consumer

```typescript
// user.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body } from 'han-prev-core';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {} // ✅ Auto-injected

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(parseInt(id));
  }

  @Post()
  create(@Body() data: { name: string; email: string }) {
    return this.userService.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.userService.update(parseInt(id), data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.delete(parseInt(id));
  }
}
```

## Provider Dependencies

Providers can depend on other providers:

```typescript
// email.service.ts
@Injectable()
export class EmailService {
  send(to: string, subject: string, body: string) {
    console.log(`Sending email to ${to}: ${subject}`);
    // Email sending logic
  }
}

// user.service.ts
@Injectable()
export class UserService {
  constructor(private emailService: EmailService) {} // ✅ Inject EmailService

  async create(data: { name: string; email: string }) {
    const user = { id: Date.now(), ...data };

    // Send welcome email
    await this.emailService.send(
      user.email,
      'Welcome!',
      `Hello ${user.name}, welcome to our platform!`
    );

    return user;
  }
}

// user.module.ts
@Module({
  providers: [
    UserService,
    EmailService, // ✅ Register both
  ],
  controllers: [UserController],
})
export class UserModule {}
```

## Real-World Example: Blog API

Let's build a complete blog service with multiple providers:

### Database Service

```typescript
// database.service.ts
import { Injectable, Inject } from 'han-prev-core';
import { Model } from 'mongoose';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject('DB_CONNECTION')
    private connection: any,
  ) {}

  async query(sql: string) {
    return this.connection.execute(sql);
  }
}
```

### Logger Service

```typescript
// logger.service.ts
import { Injectable } from 'han-prev-core';

@Injectable()
export class LoggerService {
  log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  error(message: string, trace?: string) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
    if (trace) {
      console.error(trace);
    }
  }
}
```

### Post Service

```typescript
// post.service.ts
import { Injectable, InjectModel } from 'han-prev-core';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PostService {
  constructor(
    @InjectModel('Post')
    private postModel: Model<PostDocument>,
    private logger: LoggerService,
  ) {}

  async findAll() {
    this.logger.log('Finding all posts');
    return this.postModel.find().exec();
  }

  async findById(id: string) {
    this.logger.log(`Finding post ${id}`);
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      this.logger.error(`Post ${id} not found`);
      throw new Error('Post not found');
    }
    return post;
  }

  async create(data: Partial<Post>) {
    this.logger.log(`Creating post: ${data.title}`);
    const post = await this.postModel.create(data);
    return post;
  }

  async update(id: string, data: Partial<Post>) {
    this.logger.log(`Updating post ${id}`);
    const post = await this.postModel.findByIdAndUpdate(id, data, { new: true });
    if (!post) {
      throw new Error('Post not found');
    }
    return post;
  }

  async delete(id: string) {
    this.logger.log(`Deleting post ${id}`);
    const result = await this.postModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Post not found');
    }
    return { deleted: true };
  }
}
```

### Comment Service

```typescript
// comment.service.ts
import { Injectable, InjectModel } from 'han-prev-core';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { PostService } from '../post/post.service';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel('Comment')
    private commentModel: Model<CommentDocument>,
    private postService: PostService,
    private logger: LoggerService,
  ) {}

  async create(postId: string, data: Partial<Comment>) {
    // Verify post exists
    await this.postService.findById(postId);

    this.logger.log(`Creating comment on post ${postId}`);
    const comment = await this.commentModel.create({
      ...data,
      postId,
    });
    return comment;
  }

  async findByPost(postId: string) {
    this.logger.log(`Finding comments for post ${postId}`);
    return this.commentModel.find({ postId }).exec();
  }
}
```

### Module Configuration

```typescript
// blog.module.ts
import { Module } from 'han-prev-core';
import { PostController } from './post/post.controller';
import { CommentController } from './comment/comment.controller';
import { PostService } from './post/post.service';
import { CommentService } from './comment/comment.service';
import { LoggerService } from './logger/logger.service';
import mongoose from 'mongoose';
import { PostSchema } from './post/schemas/post.schema';
import { CommentSchema } from './comment/schemas/comment.schema';

@Module({
  controllers: [PostController, CommentController],
  providers: [
    PostService,
    CommentService,
    LoggerService,
    {
      provide: 'PostModel',
      useFactory: () => mongoose.model('Post', PostSchema),
    },
    {
      provide: 'CommentModel',
      useFactory: () => mongoose.model('Comment', CommentSchema),
    },
  ],
})
export class BlogModule {}
```

## Common Provider Patterns

### 1. Repository Pattern

```typescript
@Injectable()
export class UserRepository {
  constructor(
    @InjectModel('User')
    private userModel: Model<UserDocument>,
  ) {}

  async findAll() {
    return this.userModel.find().exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  async create(data: any) {
    return this.userModel.create(data);
  }

  async update(id: string, data: any) {
    return this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async getUser(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}
```

### 2. Factory Pattern

```typescript
@Injectable()
export class NotificationFactory {
  create(type: 'email' | 'sms' | 'push') {
    switch (type) {
      case 'email':
        return new EmailNotification();
      case 'sms':
        return new SMSNotification();
      case 'push':
        return new PushNotification();
      default:
        throw new Error('Unknown notification type');
    }
  }
}
```

### 3. Strategy Pattern

```typescript
interface PaymentStrategy {
  process(amount: number): Promise<void>;
}

@Injectable()
export class StripePayment implements PaymentStrategy {
  async process(amount: number) {
    // Stripe logic
  }
}

@Injectable()
export class PayPalPayment implements PaymentStrategy {
  async process(amount: number) {
    // PayPal logic
  }
}

@Injectable()
export class PaymentService {
  constructor(
    @Inject('PAYMENT_STRATEGY')
    private strategy: PaymentStrategy,
  ) {}

  async makePayment(amount: number) {
    await this.strategy.process(amount);
  }
}
```

## Best Practices

### 1. Single Responsibility

Each provider should have one clear purpose:

```typescript
// ✅ Good - Single responsibility
@Injectable()
export class UserService {
  findAll() { }
  findById(id: string) { }
  create(data: any) { }
}

@Injectable()
export class EmailService {
  send(to: string, subject: string) { }
}

// ❌ Bad - Too many responsibilities
@Injectable()
export class UserService {
  findAll() { }
  sendEmail(to: string) { } // Should be in EmailService
  uploadFile(file: any) { } // Should be in FileService
  processPayment(amount: number) { } // Should be in PaymentService
}
```

### 2. Dependency Injection

Always use constructor injection:

```typescript
// ✅ Good
@Injectable()
export class UserService {
  constructor(
    private emailService: EmailService,
    private logger: LoggerService,
  ) {}
}

// ❌ Avoid
@Injectable()
export class UserService {
  emailService: EmailService;

  setEmailService(service: EmailService) {
    this.emailService = service;
  }
}
```

### 3. Error Handling

Handle errors appropriately:

```typescript
@Injectable()
export class UserService {
  async findById(id: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`Error finding user ${id}`, error.stack);
      throw error;
    }
  }
}
```

### 4. Use Interfaces

Define contracts with interfaces:

```typescript
interface IUserService {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User>;
  create(data: CreateUserDto): Promise<User>;
}

@Injectable()
export class UserService implements IUserService {
  async findAll() { }
  async findById(id: string) { }
  async create(data: CreateUserDto) { }
}
```

### 5. Keep Providers Stateless

Avoid storing state in providers:

```typescript
// ❌ Bad - Stateful
@Injectable()
export class UserService {
  private currentUser: User; // ❌ Don't store state

  setCurrentUser(user: User) {
    this.currentUser = user;
  }
}

// ✅ Good - Stateless
@Injectable()
export class UserService {
  getCurrentUser(userId: string) {
    return this.userModel.findById(userId);
  }
}
```

## Testing Providers

Providers are easy to test in isolation:

```typescript
import { UserService } from './user.service';
import { EmailService } from './email.service';

describe('UserService', () => {
  let userService: UserService;
  let mockEmailService: any;

  beforeEach(() => {
    mockEmailService = {
      send: jest.fn(),
    };
    userService = new UserService(mockEmailService);
  });

  it('should create user and send email', async () => {
    const userData = { name: 'John', email: 'john@example.com' };

    const result = await userService.create(userData);

    expect(result).toHaveProperty('id');
    expect(mockEmailService.send).toHaveBeenCalledWith(
      'john@example.com',
      expect.any(String),
      expect.any(String)
    );
  });

  it('should throw error when user not found', async () => {
    await expect(userService.findById('999')).rejects.toThrow('User not found');
  });
});
```

## Provider Scope

By default, providers are **singletons** (shared across the app). You can change this:

```typescript
@Module({
  providers: [
    {
      provide: UserService,
      useClass: UserService,
      scope: 'transient', // New instance every time
    },
  ],
})
export class UserModule {}
```

Available scopes:
- **`singleton`** (default) - One instance shared globally
- **`transient`** - New instance for each injection

## Next Steps

- Learn about [Modules](/fundamentals/modules) to organize your providers
- Explore [Dependency Injection](/fundamentals/dependency-injection) for advanced DI patterns
- Check out [Database Integration](/techniques/mongoose) for Mongoose usage

## Quick Reference

```typescript
// 1. Create provider
@Injectable()
export class MyService {
  doSomething() { }
}

// 2. Register in module
@Module({
  providers: [MyService],
})
export class MyModule {}

// 3. Inject into consumer
export class MyController {
  constructor(private myService: MyService) {}
}
```

That's it! Providers are simple yet powerful. Keep them focused, testable, and stateless for the best results. 🚀
