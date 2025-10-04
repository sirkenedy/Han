# Dependency Injection

Han Framework includes a powerful **dependency injection (DI) system** that manages the instantiation and lifecycle of your application's components. This allows you to write loosely coupled, testable code with ease.

## What is Dependency Injection?

Dependency Injection is a design pattern where a class receives its dependencies from external sources rather than creating them itself.

### Without DI ❌

```typescript
class UserService {
  private database = new Database(); // ❌ Tightly coupled
  private emailService = new EmailService(); // ❌ Hard to test

  async createUser(data: any) {
    const user = await this.database.save(data);
    await this.emailService.send(user.email, 'Welcome!');
    return user;
  }
}
```

### With DI ✅

```typescript
@Injectable()
class UserService {
  constructor(
    private database: Database, // ✅ Injected
    private emailService: EmailService, // ✅ Injected
  ) {}

  async createUser(data: any) {
    const user = await this.database.save(data);
    await this.emailService.send(user.email, 'Welcome!');
    return user;
  }
}
```

## Basic Usage

### 1. Mark Classes as Injectable

Use the `@Injectable()` decorator to mark a class as available for dependency injection:

```typescript
import { Injectable } from 'han-prev-core';

@Injectable()
export class UserService {
  getUsers() {
    return [{ id: 1, name: 'John' }];
  }
}
```

### 2. Register in Module

Add the service to a module's `providers` array:

```typescript
import { Module } from 'han-prev-core';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  controllers: [UserController],
  providers: [UserService], // ✅ Register here
})
export class UserModule {}
```

### 3. Inject into Consumer

Use constructor injection to receive dependencies:

```typescript
import { Controller, Get } from 'han-prev-core';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {} // ✅ Auto-injected

  @Get()
  getAll() {
    return this.userService.getUsers();
  }
}
```

That's it! The DI container automatically creates and injects the `UserService` instance.

## Custom Injection Tokens

Sometimes you need more control over what gets injected. Use the `@Inject()` decorator with custom string tokens:

### Basic Custom Injection

```typescript
import { Injectable, Inject } from 'han-prev-core';

@Injectable()
export class UserService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private db: Connection,

    @Inject('CONFIG_OPTIONS')
    private config: AppConfig,
  ) {}
}
```

### Register Custom Providers

In your module:

```typescript
@Module({
  providers: [
    UserService,
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: () => createDatabaseConnection(),
    },
    {
      provide: 'CONFIG_OPTIONS',
      useValue: {
        apiKey: process.env.API_KEY,
        timeout: 5000,
      },
    },
  ],
})
export class UserModule {}
```

## @InjectModel for Mongoose

For Mongoose models, use the convenient `@InjectModel()` decorator:

```typescript
import { Injectable, InjectModel } from 'han-prev-core';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User')
    private userModel: Model<UserDocument>,
  ) {}

  async findAll() {
    return this.userModel.find().exec();
  }

  async create(userData: User) {
    return this.userModel.create(userData);
  }
}
```

Register the model in your module:

```typescript
import mongoose from 'mongoose';
import { UserSchema } from './schemas/user.schema';

@Module({
  providers: [
    UserService,
    {
      provide: 'UserModel',
      useFactory: () => mongoose.model('User', UserSchema),
    },
  ],
})
export class UserModule {}
```

:::tip Why @InjectModel?
`@InjectModel('User')` is cleaner than `@Inject('UserModel')` and makes it clear you're injecting a Mongoose model.
:::

## Provider Types

Han Framework supports multiple provider types:

### 1. Class Providers (useClass)

```typescript
{
  provide: 'UserService',
  useClass: UserService,
}

// Shorthand for same token and class:
UserService // Equivalent to above
```

### 2. Value Providers (useValue)

```typescript
{
  provide: 'CONFIG',
  useValue: {
    apiKey: 'secret-key',
    timeout: 5000,
  },
}
```

### 3. Factory Providers (useFactory)

```typescript
{
  provide: 'DATABASE_CONNECTION',
  useFactory: () => {
    return mongoose.connect(process.env.MONGODB_URI);
  },
}
```

### 4. Factory with Dependencies

```typescript
{
  provide: 'EmailService',
  useFactory: (config: ConfigService) => {
    return new EmailService(config.get('SMTP_HOST'));
  },
  inject: ['ConfigService'], // Dependencies
}
```

### 5. Async Factory Providers

```typescript
{
  provide: 'ASYNC_CONNECTION',
  useFactory: async () => {
    const connection = await createConnection();
    await connection.initialize();
    return connection;
  },
}
```

## Complete Example

Here's a real-world example with multiple dependencies:

```typescript
// config.service.ts
@Injectable()
export class ConfigService {
  get(key: string): string {
    return process.env[key] || '';
  }
}

// database.service.ts
@Injectable()
export class DatabaseService {
  constructor(
    @Inject('DB_CONNECTION')
    private connection: Connection,
  ) {}

  async query(sql: string) {
    return this.connection.execute(sql);
  }
}

// email.service.ts
@Injectable()
export class EmailService {
  constructor(private config: ConfigService) {}

  async send(to: string, subject: string, body: string) {
    const smtp = this.config.get('SMTP_HOST');
    // Send email logic
  }
}

// user.service.ts
@Injectable()
export class UserService {
  constructor(
    @InjectModel('User')
    private userModel: Model<UserDocument>,
    private emailService: EmailService,
    private databaseService: DatabaseService,
  ) {}

  async createUser(data: CreateUserDto) {
    // Create user
    const user = await this.userModel.create(data);

    // Send welcome email
    await this.emailService.send(
      user.email,
      'Welcome!',
      'Thanks for joining!'
    );

    // Log to database
    await this.databaseService.query(
      `INSERT INTO logs (action, user_id) VALUES ('user_created', ${user.id})`
    );

    return user;
  }
}

// user.module.ts
@Module({
  providers: [
    UserService,
    EmailService,
    DatabaseService,
    ConfigService,
    {
      provide: 'UserModel',
      useFactory: () => mongoose.model('User', UserSchema),
    },
    {
      provide: 'DB_CONNECTION',
      useFactory: (config: ConfigService) => {
        return createConnection(config.get('DATABASE_URL'));
      },
      inject: ['ConfigService'],
    },
  ],
  controllers: [UserController],
})
export class UserModule {}
```

## Scope

By default, providers are **singletons** - one instance shared across the entire application. You can customize this:

```typescript
{
  provide: 'TransientService',
  useClass: TransientService,
  scope: 'transient', // New instance every time
}
```

Available scopes:
- **`singleton`** (default) - One instance shared globally
- **`transient`** - New instance for each injection

## Best Practices

### 1. Use Constructor Injection

```typescript
// ✅ Good
@Injectable()
export class UserService {
  constructor(private database: Database) {}
}

// ❌ Avoid
@Injectable()
export class UserService {
  database: Database;

  setDatabase(db: Database) {
    this.database = db;
  }
}
```

### 2. Use Interfaces for Abstraction

```typescript
interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

@Injectable()
export class UserService {
  constructor(
    @Inject('IEmailService')
    private emailService: IEmailService,
  ) {}
}

// Can swap implementations easily
@Module({
  providers: [
    {
      provide: 'IEmailService',
      useClass: SendGridEmailService, // or MailgunEmailService
    },
  ],
})
export class AppModule {}
```

### 3. Prefer @InjectModel for Models

```typescript
// ✅ Good - Clear intent
@InjectModel('User')
private userModel: Model<UserDocument>

// ⚠️ Less clear
@Inject('UserModel')
private userModel: Model<UserDocument>
```

### 4. Avoid Circular Dependencies

```typescript
// ❌ Circular dependency
// user.service.ts
@Injectable()
export class UserService {
  constructor(private orderService: OrderService) {}
}

// order.service.ts
@Injectable()
export class OrderService {
  constructor(private userService: UserService) {}
}

// ✅ Solution: Extract shared logic
@Injectable()
export class SharedService {
  // Common logic here
}

@Injectable()
export class UserService {
  constructor(private shared: SharedService) {}
}

@Injectable()
export class OrderService {
  constructor(private shared: SharedService) {}
}
```

## Difference Between @Inject and @InjectModel

| Feature | @Inject | @InjectModel |
|---------|---------|--------------|
| **Purpose** | Generic DI | Mongoose models only |
| **Token** | Any string | Model name (auto-appends "Model") |
| **Usage** | `@Inject('EmailService')` | `@InjectModel('User')` |
| **Example** | Services, configs, connections | Database models |

```typescript
// Under the hood, these are equivalent:
@InjectModel('User')           // Cleaner
@Inject('UserModel')           // More explicit
```

## Testing with DI

Dependency injection makes testing easy:

```typescript
describe('UserService', () => {
  let userService: UserService;
  let mockUserModel: any;
  let mockEmailService: any;

  beforeEach(() => {
    // Create mocks
    mockUserModel = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    };

    mockEmailService = {
      send: jest.fn(),
    };

    // Inject mocks
    userService = new UserService(mockUserModel, mockEmailService);
  });

  it('should create user and send email', async () => {
    mockUserModel.create.mockResolvedValue({ id: 1, email: 'test@example.com' });

    await userService.createUser({ email: 'test@example.com' });

    expect(mockUserModel.create).toHaveBeenCalled();
    expect(mockEmailService.send).toHaveBeenCalledWith(
      'test@example.com',
      expect.any(String),
      expect.any(String)
    );
  });
});
```

## Next Steps

- Learn about [Modules](/fundamentals/modules) to organize your providers
- Explore [Middleware](/techniques/middleware) for request processing
- Check out [Database Integration](/techniques/mongoose) for Mongoose setup

## Additional Resources

- [INJECTION_GUIDE.md](https://github.com/your-org/han-framework/blob/main/packages/core/INJECTION_GUIDE.md) - Detailed injection guide
- [Custom Providers Example](https://github.com/your-org/han-framework/tree/main/examples/custom-providers)
