# @han-prev/mongoose

Elegant MongoDB integration for Han Framework with decorator-based schemas.

## Features

- 🎨 **Decorator-based schemas** - Define models using TypeScript decorators
- 💉 **Dependency injection** - Inject models and connections into services seamlessly
- 🔧 **Type-safe** - Full TypeScript support with intellisense
- ⚡ **Developer-friendly** - Intuitive API that reduces boilerplate
- 🔌 **Plugin support** - Use Mongoose plugins easily
- 🎯 **Schema hooks** - Pre/post middleware support
- 📦 **Virtual properties** - Define virtuals with decorators
- 🔄 **Transaction support** - Built-in transaction helpers with automatic retry
- 🌐 **Multiple database connections** - Connect to multiple MongoDB instances
- 🔀 **Cross-database transactions** - Perform atomic operations across databases
- 🚀 **High performance** - Optimized connection pooling and transaction management

## Installation

```bash
npm install han-prev-mongoose mongoose
```

## Quick Start

### 1. Configure Root Module

```typescript
import { Module } from 'han-prev-core';
import { MongooseModule } from 'han-prev-mongoose';

@Module({
  imports: [
    MongooseModule.forRoot({
      uri: 'mongodb://localhost:27017/myapp',
    }),
  ],
})
export class AppModule {}
```

### 2. Define Schema with Decorators

```typescript
import { Schema, Prop } from 'han-prev-mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, minlength: 2 })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true, minlength: 8 })
  password: string;

  @Prop({ default: true })
  isActive: boolean;
}
```

### 3. Register Model in Feature Module

```typescript
import { Module } from 'han-prev-core';
import { MongooseModule } from 'han-prev-mongoose';
import { User } from './user.schema';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [MongooseModule.forFeature([User])],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
```

### 4. Inject Model into Service

```typescript
import { Injectable } from 'han-prev-core';
import { InjectModel } from 'han-prev-mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private userModel: Model<User>
  ) {}

  async create(userData: Partial<User>) {
    const user = new this.userModel(userData);
    return await user.save();
  }

  async findAll() {
    return await this.userModel.find().exec();
  }

  async findById(id: string) {
    return await this.userModel.findById(id).exec();
  }
}
```

## Advanced Features

### Multiple Database Connections

Connect to multiple MongoDB databases for better data separation:

```typescript
// app.module.ts
@Module({
  imports: [
    MongooseModule.forRootMultiple({
      connections: [
        {
          name: 'APP',
          uri: process.env.APP_DATABASE_URL,
          options: { maxPoolSize: 25 }
        },
        {
          name: 'LOG',
          uri: process.env.LOG_DATABASE_URL,
          options: { maxPoolSize: 10 }
        }
      ]
    }),
  ],
})
export class AppModule {}

// Register models to specific connections
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema }
    ], 'APP'),

    MongooseModule.forFeature([
      { name: 'AuditLog', schema: AuditLogSchema }
    ], 'LOG'),
  ],
})
export class DatabaseModule {}
```

### Inject Connections

```typescript
import { InjectConnection } from 'han-prev-mongoose';

@Injectable()
export class DataService {
  constructor(
    @InjectConnection('APP') private appConnection: Connection,
    @InjectConnection('LOG') private logConnection: Connection,
  ) {}
}
```

### Cross-Database Transactions

Perform atomic operations across multiple databases with automatic retry:

```typescript
import { withCrossDbTransaction } from 'han-prev-mongoose';

@Injectable()
export class UserService {
  constructor(
    @InjectConnection('APP') private appConnection: Connection,
    @InjectConnection('LOG') private logConnection: Connection,
  ) {}

  async createUserWithAudit(userData: any) {
    const result = await withCrossDbTransaction(
      [
        { name: 'APP', connection: this.appConnection },
        { name: 'LOG', connection: this.logConnection }
      ],
      async (txn) => {
        const appSession = txn.getSession('APP');
        const logSession = txn.getSession('LOG');

        // Create user in APP database
        const [user] = await User.create([userData], { session: appSession });

        // Create audit log in LOG database
        await AuditLog.create([{
          action: 'USER_CREATED',
          userId: user._id,
          timestamp: new Date()
        }], { session: logSession });

        return user;
      },
      { maxRetries: 3, timeout: 30000 }
    );

    if (!result.success) throw result.error;
    return result.data;
  }
}
```

### Single Database Transactions

```typescript
import { withTransaction } from 'han-prev-mongoose';

@Injectable()
export class TransferService {
  constructor(
    @InjectConnection() private connection: Connection
  ) {}

  async transferFunds(fromId: string, toId: string, amount: number) {
    const result = await withTransaction(
      this.connection,
      async (session) => {
        await Account.findByIdAndUpdate(
          fromId,
          { $inc: { balance: -amount } },
          { session }
        );

        await Account.findByIdAndUpdate(
          toId,
          { $inc: { balance: amount } },
          { session }
        );
      }
    );

    if (!result.success) throw result.error;
    return result.data;
  }
}
```

### Relationships

```typescript
@Schema()
export class Post extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ type: Schema.Types.ObjectId, ref: 'User' })
  author: User;

  @Prop([{ type: Schema.Types.ObjectId, ref: 'User' }])
  likes: User[];
}
```

### Enums

```typescript
@Schema()
export class Order extends Document {
  @Prop({ enum: ['pending', 'processing', 'completed', 'cancelled'] })
  status: string;

  @Prop({ type: Number, min: 0 })
  total: number;
}
```

### Nested Objects

```typescript
@Schema()
export class Address {
  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  country: string;
}

@Schema()
export class Customer extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Address })
  address: Address;
}
```

## API Reference

### MongooseModule

#### `forRoot(options: MongooseModuleOptions)`
Configure a single database connection.

#### `forRootMultiple(options: MongooseMultipleConnectionsOptions)`
Configure multiple database connections.

#### `forFeature(models: Array<Model>, connectionName?: string)`
Register models for a specific connection.

### Decorators

- `@Schema(options?)` - Mark a class as a Mongoose schema
- `@Prop(options?)` - Define a schema property
- `@InjectModel(modelName)` - Inject a Mongoose model
- `@InjectConnection(connectionName?)` - Inject a Mongoose connection

### Transaction Utilities

- `withTransaction(connection, callback, options?)` - Execute a single-database transaction
- `withCrossDbTransaction(connections, callback, options?)` - Execute a cross-database transaction
- `CrossDbTransaction` - Advanced transaction manager class

## License

MIT © Han Framework Team
