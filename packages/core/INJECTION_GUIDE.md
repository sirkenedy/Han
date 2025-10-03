# Dependency Injection with @Inject and @InjectModel

Han Framework now supports custom dependency injection using `@Inject` and `@InjectModel` decorators, similar to NestJS.

## @Inject Decorator

Use `@Inject` to inject any custom provider by string token.

### Basic Usage

```typescript
import { Injectable, Inject } from 'han-prev-core';

@Injectable()
export class UserService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private dbConnection: Connection,

    @Inject('CONFIG_OPTIONS')
    private config: ConfigOptions,
  ) {}
}
```

### Registering Custom Providers

```typescript
import { Module } from 'han-prev-core';
import { UserService } from './user.service';
import mongoose from 'mongoose';

@Module({
  providers: [
    UserService,
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: () => {
        return mongoose.connect('mongodb://localhost/myapp');
      },
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

## @InjectModel Decorator

Use `@InjectModel` for Mongoose models - it's syntactic sugar that makes your code cleaner.

### Basic Usage

```typescript
import { Injectable, InjectModel } from 'han-prev-core';
import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User')
    private userModel: Model<UserDocument>,

    @InjectModel('Profile')
    private profileModel: Model<ProfileDocument>,
  ) {}

  async findAll() {
    return this.userModel.find().exec();
  }

  async create(userData: any) {
    return this.userModel.create(userData);
  }
}
```

### Defining Mongoose Schemas

```typescript
// schemas/user.schema.ts
import { Schema, Document } from 'mongoose';

export interface User {
  name: string;
  email: string;
  password: string;
}

export type UserDocument = User & Document;

export const UserSchema = new Schema<UserDocument>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, {
  timestamps: true,
});
```

### Registering Mongoose Models

```typescript
import { Module } from 'han-prev-core';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import mongoose from 'mongoose';
import { UserSchema } from './schemas/user.schema';
import { ProfileSchema } from './schemas/profile.schema';

@Module({
  providers: [
    UserService,
    {
      provide: 'UserModel',
      useFactory: () => mongoose.model('User', UserSchema),
    },
    {
      provide: 'ProfileModel',
      useFactory: () => mongoose.model('Profile', ProfileSchema),
    },
  ],
  controllers: [UserController],
})
export class UserModule {}
```

## Difference Between @Inject and @InjectModel

| Feature | @Inject | @InjectModel |
|---------|---------|--------------|
| **Purpose** | Generic dependency injection | Mongoose models only |
| **Token** | Any string | Model name (auto-appends "Model") |
| **Use Case** | Services, configs, connections, factories | Database models |
| **Example** | `@Inject('EmailService')` | `@InjectModel('User')` |

### Under the Hood

```typescript
// These are equivalent:
@InjectModel('User')           // Cleaner, semantic
@Inject('UserModel')           // Manual, explicit

// @InjectModel simply does:
export function InjectModel(modelName: string) {
  return Inject(`${modelName}Model`);
}
```

## Best Practices

### 1. Use @InjectModel for Mongoose Models

```typescript
// ✅ Good
@InjectModel('User')
private userModel: Model<UserDocument>

// ❌ Avoid
@Inject('UserModel')
private userModel: Model<UserDocument>
```

### 2. Use @Inject for Everything Else

```typescript
// ✅ Good
@Inject('DATABASE_CONNECTION')
private db: Connection

@Inject('ConfigService')
private config: ConfigService

// ❌ Don't use @InjectModel for non-models
@InjectModel('Config')  // Wrong! Not a Mongoose model
```

### 3. Type Your Injected Dependencies

```typescript
// ✅ Good - Typed
@InjectModel('User')
private userModel: Model<UserDocument>

// ❌ Avoid - Untyped
@InjectModel('User')
private userModel: any
```

## Complete Example

```typescript
// user.schema.ts
import { Schema, Document } from 'mongoose';

export interface User {
  name: string;
  email: string;
}

export type UserDocument = User & Document;

export const UserSchema = new Schema<UserDocument>({
  name: String,
  email: String,
});

// user.service.ts
import { Injectable, InjectModel, Inject } from 'han-prev-core';
import { Model } from 'mongoose';
import { UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User')
    private userModel: Model<UserDocument>,

    @Inject('EmailService')
    private emailService: EmailService,
  ) {}

  async create(userData: Partial<User>) {
    const user = await this.userModel.create(userData);
    await this.emailService.sendWelcomeEmail(user.email);
    return user;
  }

  async findAll() {
    return this.userModel.find().exec();
  }
}

// user.module.ts
import { Module } from 'han-prev-core';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import mongoose from 'mongoose';
import { UserSchema } from './schemas/user.schema';
import { EmailService } from '../email/email.service';

@Module({
  providers: [
    UserService,
    EmailService,
    {
      provide: 'UserModel',
      useFactory: () => mongoose.model('User', UserSchema),
    },
    {
      provide: 'EmailService',
      useClass: EmailService,
    },
  ],
  controllers: [UserController],
})
export class UserModule {}
```

## Migration from Type-based Injection

If you're currently using type-based injection, you can migrate gradually:

```typescript
// Before (type-based)
constructor(private userService: UserService) {}

// After (token-based for models)
constructor(
  @InjectModel('User') private userModel: Model<UserDocument>
) {}
```

Both approaches work simultaneously in Han Framework!
