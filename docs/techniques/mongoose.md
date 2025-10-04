# Database - MongoDB with Mongoose

Learn how to integrate MongoDB with your Han Framework application using the official `han-prev-mongoose` package.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Basic Usage](#basic-usage)
- [Multiple Databases](#multiple-databases)
- [Transactions](#transactions)
- [Advanced Features](#advanced-features)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)
- [Performance Optimization](#performance-optimization)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Migration Guides](#migration-guides)
- [API Reference](#api-reference)

---

## Introduction

The `han-prev-mongoose` package provides first-class MongoDB integration for Han Framework with:

- 🎨 **Decorator-based schemas** - Define models using TypeScript decorators
- 🔄 **Multiple database support** - Connect to multiple MongoDB instances
- 💪 **Cross-database transactions** - Atomic operations across databases (unique feature!)
- 💉 **Dependency injection** - Seamless integration with Han's DI system
- 🔧 **Type-safe** - Full TypeScript support with IntelliSense
- ⚡ **High performance** - Optimized connection pooling and query execution
- 🛡️ **Production-ready** - Battle-tested with comprehensive error handling

---

## Installation

### Step 1: Install Dependencies

```bash
npm install han-prev-mongoose mongoose reflect-metadata
npm install --save-dev @types/node
```

### Step 2: Enable Decorators

Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "target": "ES2020",
    "module": "commonjs"
  }
}
```

### Step 3: Import reflect-metadata

In your main file (e.g., `index.ts`):

```typescript
import 'reflect-metadata';
```

---

## Quick Start

### 1. Configure Database Connection

```typescript
// app.module.ts
import { Module } from 'han-prev-core';
import { MongooseModule } from 'han-prev-mongoose';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    MongooseModule.forRoot({
      uri: 'mongodb://localhost:27017/myapp',
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      }
    }),
    UserModule,
  ],
})
export class AppModule {}
```

### 2. Define a Schema

```typescript
// user/user.schema.ts
import { Schema, Prop } from 'han-prev-mongoose';
import { Document } from 'mongoose';

export interface User extends Document {
  name: string;
  email: string;
  age: number;
  createdAt: Date;
  updatedAt: Date;
}

@Schema({ timestamps: true })
export class UserSchema {
  @Prop({ type: String, required: true, minlength: 2, maxlength: 50 })
  name!: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true })
  email!: string;

  @Prop({ type: Number, min: 0, max: 150 })
  age?: number;
}
```

### 3. Register Model in Module

```typescript
// user/user.module.ts
import { Module } from 'han-prev-core';
import { MongooseModule } from 'han-prev-mongoose';
import { UserSchema } from './user.schema';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    MongooseModule.forFeature([UserSchema])
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
```

### 4. Use Model in Service

```typescript
// user/user.service.ts
import { Injectable } from 'han-prev-core';
import { InjectModel } from 'han-prev-mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('UserSchema') private userModel: Model<User>
  ) {}

  async create(createUserDto: Partial<User>): Promise<User> {
    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: Partial<User>): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<User | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
```

### 5. Create Controller

```typescript
// user/user.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body } from 'han-prev-core';
import { UserService } from './user.service';

@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() body: any) {
    return this.userService.create(body);
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.userService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
```

🎉 **That's it!** Your API is ready. Start your server and test:

```bash
# Create user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","age":30}'

# Get all users
curl http://localhost:3000/users

# Get user by ID
curl http://localhost:3000/users/507f1f77bcf86cd799439011

# Update user
curl -X PUT http://localhost:3000/users/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{"age":31}'

# Delete user
curl -X DELETE http://localhost:3000/users/507f1f77bcf86cd799439011
```

---

## Core Concepts

### Schema Definition

Schemas define the structure of your documents. You can use decorators or traditional approach:

#### Decorator-based (Recommended)

```typescript
import { Schema, Prop } from 'han-prev-mongoose';

@Schema({ timestamps: true })
export class ProductSchema {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;

  @Prop({ type: String, enum: ['electronics', 'clothing', 'books'] })
  category?: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];
}
```

#### Traditional Approach

```typescript
import { MongooseSchema } from 'han-prev-mongoose';

export const ProductMongooseSchema = new MongooseSchema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, enum: ['electronics', 'clothing', 'books'] },
  tags: { type: [String], default: [] }
}, { timestamps: true });
```

### Model Registration

Register models in your feature modules:

```typescript
@Module({
  imports: [
    // Decorator-based
    MongooseModule.forFeature([ProductSchema]),

    // Traditional
    MongooseModule.forFeature([
      { name: 'Product', schema: ProductMongooseSchema }
    ])
  ],
})
export class ProductModule {}
```

### Dependency Injection

Inject models into services using `@InjectModel()`:

```typescript
@Injectable()
export class ProductService {
  constructor(
    @InjectModel('ProductSchema') private productModel: Model<Product>
  ) {}

  // or for traditional schemas
  constructor(
    @InjectModel('Product') private productModel: Model<Product>
  ) {}
}
```

---

## Basic Usage

### CRUD Operations

#### Create Documents

```typescript
@Injectable()
export class ProductService {
  constructor(
    @InjectModel('ProductSchema') private productModel: Model<Product>
  ) {}

  // Method 1: Using constructor
  async createOne(data: Partial<Product>): Promise<Product> {
    const product = new this.productModel(data);
    return product.save();
  }

  // Method 2: Using create()
  async createMany(products: Partial<Product>[]): Promise<Product[]> {
    return this.productModel.create(products);
  }

  // Method 3: Using insertMany() - faster for bulk
  async bulkCreate(products: Partial<Product>[]): Promise<Product[]> {
    return this.productModel.insertMany(products);
  }
}
```

#### Read Documents

```typescript
@Injectable()
export class ProductService {
  constructor(
    @InjectModel('ProductSchema') private productModel: Model<Product>
  ) {}

  // Find all
  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  // Find with conditions
  async findByCategory(category: string): Promise<Product[]> {
    return this.productModel.find({ category }).exec();
  }

  // Find one
  async findById(id: string): Promise<Product | null> {
    return this.productModel.findById(id).exec();
  }

  // Find with multiple conditions
  async findExpensive(minPrice: number): Promise<Product[]> {
    return this.productModel
      .find({
        price: { $gte: minPrice },
        category: { $in: ['electronics', 'jewelry'] }
      })
      .sort({ price: -1 })
      .limit(10)
      .exec();
  }

  // Count documents
  async count(): Promise<number> {
    return this.productModel.countDocuments().exec();
  }

  // Check if exists
  async exists(id: string): Promise<boolean> {
    const count = await this.productModel.countDocuments({ _id: id }).exec();
    return count > 0;
  }
}
```

#### Update Documents

```typescript
@Injectable()
export class ProductService {
  constructor(
    @InjectModel('ProductSchema') private productModel: Model<Product>
  ) {}

  // Update one by ID
  async updateById(id: string, data: Partial<Product>): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(id, data, {
        new: true,           // Return updated document
        runValidators: true  // Run schema validators
      })
      .exec();
  }

  // Update one by condition
  async updateByCondition(
    condition: any,
    data: Partial<Product>
  ): Promise<Product | null> {
    return this.productModel
      .findOneAndUpdate(condition, data, { new: true })
      .exec();
  }

  // Update many
  async updateMany(
    condition: any,
    data: Partial<Product>
  ): Promise<{ modifiedCount: number }> {
    const result = await this.productModel
      .updateMany(condition, data)
      .exec();
    return { modifiedCount: result.modifiedCount };
  }

  // Increment field
  async incrementPrice(id: string, amount: number): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(
        id,
        { $inc: { price: amount } },
        { new: true }
      )
      .exec();
  }

  // Add to array
  async addTag(id: string, tag: string): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(
        id,
        { $addToSet: { tags: tag } },  // Only add if not exists
        { new: true }
      )
      .exec();
  }
}
```

#### Delete Documents

```typescript
@Injectable()
export class ProductService {
  constructor(
    @InjectModel('ProductSchema') private productModel: Model<Product>
  ) {}

  // Delete by ID
  async deleteById(id: string): Promise<Product | null> {
    return this.productModel.findByIdAndDelete(id).exec();
  }

  // Delete one by condition
  async deleteOne(condition: any): Promise<Product | null> {
    return this.productModel.findOneAndDelete(condition).exec();
  }

  // Delete many
  async deleteMany(condition: any): Promise<{ deletedCount: number }> {
    const result = await this.productModel.deleteMany(condition).exec();
    return { deletedCount: result.deletedCount };
  }

  // Soft delete (recommended for production)
  async softDelete(id: string): Promise<Product | null> {
    return this.productModel
      .findByIdAndUpdate(
        id,
        {
          deleted: true,
          deletedAt: new Date()
        },
        { new: true }
      )
      .exec();
  }
}
```

### Querying

#### Basic Queries

```typescript
// Find all electronics
const electronics = await this.productModel
  .find({ category: 'electronics' })
  .exec();

// Find products in price range
const affordable = await this.productModel
  .find({
    price: { $gte: 10, $lte: 100 }
  })
  .exec();

// Find by multiple values
const categories = await this.productModel
  .find({
    category: { $in: ['electronics', 'books'] }
  })
  .exec();

// Find with regex
const searchResults = await this.productModel
  .find({
    name: { $regex: 'laptop', $options: 'i' }  // Case insensitive
  })
  .exec();
```

#### Advanced Queries

```typescript
@Injectable()
export class ProductService {
  constructor(
    @InjectModel('ProductSchema') private productModel: Model<Product>
  ) {}

  // Pagination
  async findPaginated(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments().exec()
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total
      }
    };
  }

  // Search with filters
  async search(query: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
  }) {
    const filter: any = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } }
      ];
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.minPrice || query.maxPrice) {
      filter.price = {};
      if (query.minPrice) filter.price.$gte = query.minPrice;
      if (query.maxPrice) filter.price.$lte = query.maxPrice;
    }

    if (query.tags?.length) {
      filter.tags = { $all: query.tags };
    }

    return this.productModel.find(filter).exec();
  }

  // Select specific fields
  async findNamesOnly(): Promise<Partial<Product>[]> {
    return this.productModel
      .find()
      .select('name price')  // Only include these fields
      .exec();
  }

  // Exclude fields
  async findWithoutSensitiveData(): Promise<Partial<Product>[]> {
    return this.productModel
      .find()
      .select('-__v -internalNotes')  // Exclude these fields
      .exec();
  }

  // Lean queries (faster, returns plain objects)
  async findLean(): Promise<any[]> {
    return this.productModel
      .find()
      .lean()  // Returns plain JavaScript objects
      .exec();
  }
}
```

### Relationships

#### One-to-Many

```typescript
// schemas/post.schema.ts
import { Schema, Prop, MongooseSchema } from 'han-prev-mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class PostSchema {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true })
  content!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'UserSchema', required: true })
  author!: Types.ObjectId;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'UserSchema' }], default: [] })
  likes!: Types.ObjectId[];
}

// Service with population
@Injectable()
export class PostService {
  constructor(
    @InjectModel('PostSchema') private postModel: Model<Post>
  ) {}

  async findWithAuthor(id: string): Promise<Post | null> {
    return this.postModel
      .findById(id)
      .populate('author', 'name email')  // Populate with specific fields
      .exec();
  }

  async findWithAllRelations(id: string): Promise<Post | null> {
    return this.postModel
      .findById(id)
      .populate('author', 'name email')
      .populate('likes', 'name')
      .exec();
  }

  async findUserPosts(userId: string): Promise<Post[]> {
    return this.postModel
      .find({ author: userId })
      .populate('author')
      .sort({ createdAt: -1 })
      .exec();
  }
}
```

#### Many-to-Many

```typescript
// schemas/course.schema.ts
@Schema()
export class CourseSchema {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'UserSchema' }] })
  students!: Types.ObjectId[];
}

// schemas/user.schema.ts
@Schema()
export class UserSchema {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'CourseSchema' }] })
  enrolledCourses!: Types.ObjectId[];
}

// Service
@Injectable()
export class CourseService {
  constructor(
    @InjectModel('CourseSchema') private courseModel: Model<Course>,
    @InjectModel('UserSchema') private userModel: Model<User>
  ) {}

  async enrollStudent(courseId: string, userId: string): Promise<void> {
    await Promise.all([
      this.courseModel.findByIdAndUpdate(
        courseId,
        { $addToSet: { students: userId } }
      ),
      this.userModel.findByIdAndUpdate(
        userId,
        { $addToSet: { enrolledCourses: courseId } }
      )
    ]);
  }

  async unenrollStudent(courseId: string, userId: string): Promise<void> {
    await Promise.all([
      this.courseModel.findByIdAndUpdate(
        courseId,
        { $pull: { students: userId } }
      ),
      this.userModel.findByIdAndUpdate(
        userId,
        { $pull: { enrolledCourses: courseId } }
      )
    ]);
  }

  async getCourseWithStudents(id: string): Promise<Course | null> {
    return this.courseModel
      .findById(id)
      .populate('students', 'name email')
      .exec();
  }
}
```

---

## Multiple Databases

### Configuration

#### Method 1: forRootMultiple

```typescript
// app.module.ts
import { Module } from 'han-prev-core';
import { MongooseModule } from 'han-prev-mongoose';

@Module({
  imports: [
    MongooseModule.forRootMultiple({
      connections: [
        {
          name: 'APP',
          uri: process.env.APP_DATABASE_URL || 'mongodb://localhost:27017/myapp',
          options: {
            maxPoolSize: 25,
            minPoolSize: 2,
          }
        },
        {
          name: 'LOG',
          uri: process.env.LOG_DATABASE_URL || 'mongodb://localhost:27017/myapp-logs',
          options: {
            maxPoolSize: 10,
            minPoolSize: 1,
          }
        },
        {
          name: 'ANALYTICS',
          uri: process.env.ANALYTICS_DATABASE_URL || 'mongodb://localhost:27017/myapp-analytics',
          options: {
            maxPoolSize: 5,
          }
        }
      ]
    }),
  ],
})
export class AppModule {}
```

#### Method 2: Async Configuration

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootMultipleAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        connections: [
          {
            name: 'APP',
            uri: config.get('APP_DATABASE_URL'),
            options: {
              maxPoolSize: config.get('DB_POOL_SIZE', 25),
            }
          },
          {
            name: 'LOG',
            uri: config.get('LOG_DATABASE_URL'),
          }
        ]
      })
    }),
  ],
})
export class AppModule {}
```

### Model Registration

```typescript
// database/database.module.ts
import { Module } from 'han-prev-core';
import { MongooseModule } from 'han-prev-mongoose';
import { UserSchema } from './schemas/user.schema';
import { ProductSchema } from './schemas/product.schema';
import { AuditLogSchema } from './schemas/audit-log.schema';
import { MetricSchema } from './schemas/metric.schema';

@Module({
  imports: [
    // APP database models
    MongooseModule.forFeature([
      UserSchema,
      ProductSchema,
    ], 'APP'),

    // LOG database models
    MongooseModule.forFeature([
      AuditLogSchema,
    ], 'LOG'),

    // ANALYTICS database models
    MongooseModule.forFeature([
      MetricSchema,
    ], 'ANALYTICS'),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
```

### Using Multiple Connections

```typescript
// user/user.service.ts
import { Injectable } from 'han-prev-core';
import { InjectModel, InjectConnection } from 'han-prev-mongoose';
import { Model, Connection } from 'mongoose';
import { User } from './user.schema';
import { AuditLog } from '../audit-log.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('UserSchema') private userModel: Model<User>,
    @InjectModel('AuditLogSchema') private auditLogModel: Model<AuditLog>,
    @InjectConnection('APP') private appConnection: Connection,
    @InjectConnection('LOG') private logConnection: Connection,
  ) {}

  async createWithAudit(userData: Partial<User>): Promise<User> {
    const user = await this.userModel.create(userData);

    // Log to separate database
    await this.auditLogModel.create({
      action: 'USER_CREATED',
      userId: user._id,
      details: { email: user.email },
      timestamp: new Date()
    });

    return user;
  }

  async getConnectionStats() {
    return {
      app: {
        readyState: this.appConnection.readyState,
        name: this.appConnection.name,
        collections: Object.keys(this.appConnection.collections),
      },
      log: {
        readyState: this.logConnection.readyState,
        name: this.logConnection.name,
      }
    };
  }
}
```

---

## Transactions

### Single Database Transactions

```typescript
import { Injectable } from 'han-prev-core';
import { InjectConnection, withTransaction } from 'han-prev-mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class OrderService {
  constructor(
    @InjectConnection() private connection: Connection,
    @InjectModel('OrderSchema') private orderModel: Model<Order>,
    @InjectModel('InventorySchema') private inventoryModel: Model<Inventory>,
  ) {}

  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    const result = await withTransaction(
      this.connection,
      async (session) => {
        // 1. Create order
        const [order] = await this.orderModel.create([orderData], { session });

        // 2. Update inventory
        for (const item of orderData.items) {
          const inventory = await this.inventoryModel.findByIdAndUpdate(
            item.productId,
            { $inc: { quantity: -item.quantity } },
            { session, new: true }
          );

          if (!inventory || inventory.quantity < 0) {
            throw new Error(`Insufficient inventory for product ${item.productId}`);
          }
        }

        return order;
      },
      {
        maxRetries: 3,
        timeout: 30000,
      }
    );

    if (!result.success) {
      throw result.error || new Error('Transaction failed');
    }

    return result.data!;
  }
}
```

### Cross-Database Transactions

```typescript
import { Injectable } from 'han-prev-core';
import {
  InjectConnection,
  withCrossDbTransaction,
  withTwoPhaseCommit
} from 'han-prev-mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class PaymentService {
  constructor(
    @InjectConnection('ORDERS') private ordersConnection: Connection,
    @InjectConnection('PAYMENTS') private paymentsConnection: Connection,
    @InjectConnection('AUDIT') private auditConnection: Connection,
  ) {}

  // Method 1: Fast (best-effort atomicity)
  async processPaymentFast(paymentData: ProcessPaymentDto) {
    const result = await withCrossDbTransaction(
      [
        { name: 'ORDERS', connection: this.ordersConnection },
        { name: 'PAYMENTS', connection: this.paymentsConnection },
        { name: 'AUDIT', connection: this.auditConnection },
      ],
      async (txn) => {
        const ordersSession = txn.getSession('ORDERS');
        const paymentsSession = txn.getSession('PAYMENTS');
        const auditSession = txn.getSession('AUDIT');

        // Update order status
        const [order] = await Order.create([{
          ...paymentData,
          status: 'paid'
        }], { session: ordersSession });

        // Record payment
        await Payment.create([{
          orderId: order._id,
          amount: paymentData.amount,
          status: 'completed'
        }], { session: paymentsSession });

        // Audit log
        await AuditLog.create([{
          action: 'PAYMENT_PROCESSED',
          orderId: order._id
        }], { session: auditSession });

        return order;
      }
    );

    return result.data;
  }

  // Method 2: Safer (strong atomicity for critical operations)
  async processPaymentSafe(paymentData: ProcessPaymentDto) {
    const result = await withTwoPhaseCommit(
      [
        { name: 'ORDERS', connection: this.ordersConnection },
        { name: 'PAYMENTS', connection: this.paymentsConnection },
      ],
      async (txn) => {
        // Same operations as above
        // But with sequential commits for stronger guarantees
      },
      {
        maxRetries: 5,
        timeout: 60000,
      }
    );

    if (!result.success) {
      // Log critical error
      console.error('Payment transaction failed:', result.error);
      throw new Error('Payment processing failed');
    }

    return result.data;
  }
}
```

---

*[Continued in next part due to length...]*

Would you like me to continue with:
- Advanced Features (Aggregation, Indexes, Hooks, Virtuals)
- Real-World Examples (E-commerce, Social Media, etc.)
- Best Practices
- Performance Optimization
- Testing
- Troubleshooting
- Migration Guides
- API Reference

Let me know and I'll create the remaining comprehensive sections!
