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

### Why Use Multiple Databases?

As your application grows, you may need to separate data into different databases for various reasons:

**Common Use Cases:**
- 📊 **Data Segregation** - Separate application data from logs and analytics
- 🔒 **Compliance** - Keep sensitive data in separate, more secure databases
- ⚡ **Performance** - Reduce load by distributing data across databases
- 🌍 **Multi-tenancy** - Each tenant gets their own database
- 📈 **Scalability** - Scale different data types independently
- 🔄 **Data Lifecycle** - Different retention policies for different data

**Real-World Example:**
An e-commerce platform might use:
- **APP Database** - Products, users, orders (critical data)
- **LOG Database** - Audit logs, user activity (high write volume)
- **ANALYTICS Database** - Reports, metrics (read-heavy queries)

### Configuration

The `han-prev-mongoose` package makes multi-database setup simple with two approaches:

#### Method 1: forRootMultiple (Recommended)

This is the **cleanest and most efficient way** to configure multiple databases. All connections are defined in one place.

**When to use:**
- ✅ You know all database URIs at startup
- ✅ All databases use environment variables
- ✅ You want centralized configuration

```typescript
// app.module.ts
import { Module } from 'han-prev-core';
import { MongooseModule } from 'han-prev-mongoose';

@Module({
  imports: [
    MongooseModule.forRootMultiple({
      connections: [
        {
          name: 'APP',  // Connection identifier
          uri: process.env.APP_DATABASE_URL || 'mongodb://localhost:27017/myapp',
          options: {
            maxPoolSize: 25,  // Higher pool for main database
            minPoolSize: 2,
          }
        },
        {
          name: 'LOG',  // Separate connection for logs
          uri: process.env.LOG_DATABASE_URL || 'mongodb://localhost:27017/myapp-logs',
          options: {
            maxPoolSize: 10,  // Lower pool for logs
            minPoolSize: 1,
          }
        },
        {
          name: 'ANALYTICS',  // Read-heavy analytics database
          uri: process.env.ANALYTICS_DATABASE_URL || 'mongodb://localhost:27017/myapp-analytics',
          options: {
            maxPoolSize: 5,  // Even lower pool for analytics
          }
        }
      ]
    }),
  ],
})
export class AppModule {}
```

**💡 Tip:** Name your connections descriptively (APP, LOG, ANALYTICS) to make it clear which database handles what data.

#### Method 2: Async Configuration

Use this when you need to **load configuration dynamically** from a config service, environment files, or external sources.

**When to use:**
- ✅ Database URIs come from ConfigService
- ✅ You need to perform async operations before connecting
- ✅ Configuration depends on runtime values

```typescript
// app.module.ts
import { ConfigModule, ConfigService } from './config';

@Module({
  imports: [
    ConfigModule.forRoot(),  // Load config first
    MongooseModule.forRootMultipleAsync({
      inject: [ConfigService],  // Inject dependencies
      useFactory: async (config: ConfigService) => ({
        connections: [
          {
            name: 'APP',
            uri: config.get('APP_DATABASE_URL'),  // From config service
            options: {
              maxPoolSize: config.get('DB_POOL_SIZE', 25),  // Dynamic pool size
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

**💡 Tip:** Use async configuration when your database settings come from encrypted config files, secret managers (AWS Secrets, Vault), or need to be fetched from remote services.

### Model Registration

Once your databases are configured, you need to **register models** to specific databases. This tells Mongoose which models belong to which database.

**Think of it like this:** Each model needs a "home" database where it will store its data.

#### Organizing Models by Database

Create a central database module that registers all models to their respective databases:

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
    // APP database models - Main application data
    MongooseModule.forFeature([
      UserSchema,      // Users are stored in APP database
      ProductSchema,   // Products are stored in APP database
    ], 'APP'),         // Second parameter specifies the connection

    // LOG database models - Audit and activity logs
    MongooseModule.forFeature([
      AuditLogSchema,  // Logs are stored separately for performance
    ], 'LOG'),

    // ANALYTICS database models - Metrics and reports
    MongooseModule.forFeature([
      MetricSchema,    // Analytics data stored separately
    ], 'ANALYTICS'),
  ],
  exports: [MongooseModule],  // Export to make available to other modules
})
export class DatabaseModule {}
```

**💡 Why separate logs and analytics?**
- Logs have **high write volume** - separating them prevents slowing down your main database
- Analytics queries can be **resource-intensive** - running them on a separate database protects your app performance
- Different **backup and retention policies** - you might keep logs for 30 days but app data forever

### Using Multiple Connections

Now let's see how to **actually use** these models in your services. You can inject both models and connections.

#### Example: User Service with Audit Logging

This example shows a **real-world pattern**: creating a user in the main database while logging the action to a separate audit database.

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
    // Inject models (they know which DB they belong to)
    @InjectModel('UserSchema') private userModel: Model<User>,
    @InjectModel('AuditLogSchema') private auditLogModel: Model<AuditLog>,

    // Inject connections (for health checks, transactions, etc.)
    @InjectConnection('APP') private appConnection: Connection,
    @InjectConnection('LOG') private logConnection: Connection,
  ) {}

  /**
   * Create a user and log the action to audit database
   * This demonstrates writing to TWO different databases
   */
  async createWithAudit(userData: Partial<User>): Promise<User> {
    // 1. Create user in APP database
    const user = await this.userModel.create(userData);

    // 2. Log action in LOG database (separate database!)
    await this.auditLogModel.create({
      action: 'USER_CREATED',
      userId: user._id,
      details: { email: user.email },
      timestamp: new Date()
    });

    return user;
  }

  /**
   * Get connection health status
   * Useful for health check endpoints
   */
  async getConnectionStats() {
    return {
      app: {
        readyState: this.appConnection.readyState,  // 0=disconnected, 1=connected
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

**🔍 Understanding the Flow:**
1. `@InjectModel('UserSchema')` - Automatically injects the model from the APP database
2. `@InjectModel('AuditLogSchema')` - Automatically injects the model from the LOG database
3. Each model "knows" which database it belongs to (set during registration)
4. You can write to both databases in the same method
5. Connections can be injected for advanced operations (transactions, health checks)

**⚠️ Important:** Notice we're writing to two databases **without a transaction** here. If you need atomic operations across databases, see the [Transactions](#transactions) section below.

---

## Transactions

### Why Use Transactions?

**Transactions ensure data consistency** when you need to perform multiple operations that must **all succeed or all fail together**.

**Real-World Scenario - E-commerce Order:**
Imagine placing an order that:
1. Creates an order record
2. Decreases inventory
3. Charges payment

**Without transactions:** If step 2 fails, you have an order without inventory reduction - data inconsistency!

**With transactions:** If any step fails, ALL changes are rolled back automatically - data stays consistent!

### Transaction Types in han-prev-mongoose

| Type | Use Case | ACID Guarantee | Speed |
|------|----------|----------------|-------|
| **Single-DB** | Operations in ONE database | ✅ Full ACID | ⚡ Fast |
| **Cross-DB (Parallel)** | NON-critical cross-database ops | ⚠️ Best effort | ⚡ Fast |
| **Cross-DB (2PC)** | CRITICAL cross-database ops | ✅ Strong ACID | 🐌 Slower |

### Single Database Transactions

Use **single-database transactions** when all your operations happen in the same database. This is the most common scenario and provides **full ACID guarantees**.

#### When to Use:
- ✅ All operations are in the same database
- ✅ You need data consistency (order + inventory example)
- ✅ Operations must be atomic (all succeed or all fail)
- ✅ You need automatic rollback on errors

#### Real Example: Creating an Order

This example shows a **production-ready order creation** with automatic inventory updates and rollback.

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

  /**
   * Create an order and update inventory atomically
   * If inventory update fails, order creation is automatically rolled back
   */
  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    const result = await withTransaction(
      this.connection,
      async (session) => {
        // 1. Create order (passes session for transaction)
        const [order] = await this.orderModel.create([orderData], { session });

        // 2. Update inventory for each item
        for (const item of orderData.items) {
          const inventory = await this.inventoryModel.findByIdAndUpdate(
            item.productId,
            { $inc: { quantity: -item.quantity } },  // Decrease quantity
            { session, new: true }  // Include in transaction
          );

          // Validation: Check if inventory is sufficient
          if (!inventory || inventory.quantity < 0) {
            // Throwing error here will ROLLBACK everything!
            throw new Error(`Insufficient inventory for product ${item.productId}`);
          }
        }

        return order;
      },
      {
        maxRetries: 3,      // Retry on transient errors
        timeout: 30000,     // 30 second timeout
      }
    );

    // Check if transaction succeeded
    if (!result.success) {
      throw result.error || new Error('Transaction failed');
    }

    return result.data!;
  }
}
```

**🔍 What Happens on Error:**
1. If inventory is insufficient, an error is thrown
2. The transaction **automatically rolls back**
3. The order is NOT created (even though create() was called)
4. Inventory is NOT modified
5. Data remains consistent!

**💡 Pro Tip:** The `withTransaction` helper includes automatic retry logic for transient errors (network issues, write conflicts), making it production-ready out of the box.

### Cross-Database Transactions

**Cross-database transactions** let you perform atomic operations across **multiple databases**. This is a **unique feature** of han-prev-mongoose not available in @nestjs/mongoose!

#### Why You Need This

**Scenario:** Your app uses separate databases for orders, payments, and audit logs (for performance). But when processing a payment, you need to:
1. Update order status in ORDERS database
2. Record payment in PAYMENTS database
3. Log the action in AUDIT database

**Problem:** If step 2 fails, you have an updated order but no payment record - **data inconsistency across databases!**

**Solution:** Cross-database transactions ensure ALL databases commit together or ALL roll back.

#### Two Strategies Available

The package provides **two strategies** with different trade-offs:

**1. Parallel Commits (withCrossDbTransaction)** - ⚡ Fast, Best-Effort
- Commits all databases in parallel
- ✅ Fast performance
- ⚠️ Small risk of partial failure
- 👍 Use for: Logs, analytics, non-critical operations

**2. Two-Phase Commit (withTwoPhaseCommit)** - 🔒 Safer, Sequential
- Commits databases sequentially
- ✅ Stronger consistency guarantees
- 🐌 Slightly slower
- 👍 Use for: Payments, orders, critical business data

#### Method 1: Parallel Commits (Faster)

Best for **non-critical operations** where a missing log entry is acceptable.

**⚠️ Important:** For cross-database transactions, you need to inject **BOTH**:
1. **Models** (`@InjectModel`) - To perform database operations
2. **Connections** (`@InjectConnection`) - To create transaction sessions

```typescript
import { Injectable } from 'han-prev-core';
import {
  InjectConnection,
  InjectModel,
  withCrossDbTransaction,
} from 'han-prev-mongoose';
import { Connection, Model } from 'mongoose';
import { Order } from './order.schema';
import { Payment } from './payment.schema';
import { AuditLog } from './audit-log.schema';

@Injectable()
export class PaymentService {
  constructor(
    // Inject the connections (needed for transaction sessions)
    @InjectConnection('ORDERS') private ordersConnection: Connection,
    @InjectConnection('PAYMENTS') private paymentsConnection: Connection,
    @InjectConnection('AUDIT') private auditConnection: Connection,

    // Inject the models (needed to perform database operations)
    @InjectModel('OrderSchema') private orderModel: Model<Order>,
    @InjectModel('PaymentSchema') private paymentModel: Model<Payment>,
    @InjectModel('AuditLogSchema') private auditLogModel: Model<AuditLog>,
  ) {}

  /**
   * Process payment with audit logging (non-critical)
   * Uses parallel commits for better performance
   */
  async processPaymentFast(paymentData: ProcessPaymentDto) {
    const result = await withCrossDbTransaction(
      [
        { name: 'ORDERS', connection: this.ordersConnection },
        { name: 'PAYMENTS', connection: this.paymentsConnection },
        { name: 'AUDIT', connection: this.auditConnection },  // Audit is nice-to-have
      ],
      async (txn) => {
        // Get session for each database
        const ordersSession = txn.getSession('ORDERS');
        const paymentsSession = txn.getSession('PAYMENTS');
        const auditSession = txn.getSession('AUDIT');

        // Update order status in ORDERS database
        const [order] = await this.orderModel.create([{
          ...paymentData,
          status: 'paid'
        }], { session: ordersSession });

        // Record payment in PAYMENTS database
        await this.paymentModel.create([{
          orderId: order._id,
          amount: paymentData.amount,
          status: 'completed'
        }], { session: paymentsSession });

        // Log to AUDIT database (if this fails, we can tolerate it)
        await this.auditLogModel.create([{
          action: 'PAYMENT_PROCESSED',
          orderId: order._id
        }], { session: auditSession });

        return order;
      }
    );

    return result.data;
  }
}
```

#### Method 2: Two-Phase Commit (Safer)

Best for **critical operations** where data must be 100% consistent across databases.

**⚠️ Important:** Just like Method 1, you need to inject **BOTH** connections and models.

```typescript
import { Injectable } from 'han-prev-core';
import {
  InjectConnection,
  InjectModel,
  withTwoPhaseCommit,
} from 'han-prev-mongoose';
import { Connection, Model } from 'mongoose';
import { Order } from './order.schema';
import { Payment } from './payment.schema';

@Injectable()
export class PaymentService {
  constructor(
    // Inject the connections (for transaction sessions)
    @InjectConnection('ORDERS') private ordersConnection: Connection,
    @InjectConnection('PAYMENTS') private paymentsConnection: Connection,

    // Inject the models (for database operations)
    @InjectModel('OrderSchema') private orderModel: Model<Order>,
    @InjectModel('PaymentSchema') private paymentModel: Model<Payment>,
  ) {}

  /**
   * Process payment with strong consistency guarantees
   * Uses two-phase commit for critical operations
   */
  async processPaymentSafe(paymentData: ProcessPaymentDto) {
    const result = await withTwoPhaseCommit(
      [
        { name: 'ORDERS', connection: this.ordersConnection },
        { name: 'PAYMENTS', connection: this.paymentsConnection },
      ],
      async (txn) => {
        const ordersSession = txn.getSession('ORDERS');
        const paymentsSession = txn.getSession('PAYMENTS');

        // Update order - critical operation
        const [order] = await this.orderModel.create([{
          ...paymentData,
          status: 'paid'
        }], { session: ordersSession });

        // Record payment - critical operation
        await this.paymentModel.create([{
          orderId: order._id,
          amount: paymentData.amount,
          status: 'completed'
        }], { session: paymentsSession });

        return order;
      },
      {
        maxRetries: 5,      // More retries for critical ops
        timeout: 60000,     // Longer timeout (60s)
      }
    );

    // Always check for success with critical operations
    if (!result.success) {
      console.error('Payment transaction failed:', result.error);
      throw new Error('Payment processing failed');
    }

    return result.data;
  }
}
```

**🤔 Why Inject Both Connections AND Models?**

You might wonder: "If models already know their database, why inject connections?"

- **Models** (`@InjectModel`) - Used to perform operations (create, find, update, delete)
- **Connections** (`@InjectConnection`) - Used to create transaction sessions

The transaction utility needs the **raw connection** to create sessions, while your code needs the **models** to perform operations using those sessions.

**🔍 The Difference:**

| Aspect | Parallel (`withCrossDbTransaction`) | Two-Phase (`withTwoPhaseCommit`) |
|--------|-------------------------------------|----------------------------------|
| **Commit Strategy** | All databases commit in parallel | Databases commit sequentially |
| **Performance** | ⚡ Faster | 🐌 ~10ms slower per DB |
| **Consistency** | ⚠️ Best effort | ✅ Stronger guarantees |
| **Rollback** | Automatic during operations | Automatic + detects commit failures |
| **Use For** | Logs, analytics, events | Orders, payments, critical data |

**💡 Pro Tip:** For **financial transactions or orders**, always use `withTwoPhaseCommit`. For **logging and analytics**, use `withCrossDbTransaction` for better performance.

**📚 Learn More:** For a deep dive into ACID guarantees and when to use each strategy, see the [ACID Compliance Guide](../../packages/mongoose/ACID_COMPLIANCE.md).

---

## Best Practices

### 1. Schema Design

#### ✅ Do: Use Specific Types and Validation

```typescript
@Schema({ timestamps: true })
export class UserSchema {
  @Prop({
    type: String,
    required: [true, 'Name is required'],
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    trim: true
  })
  name!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  })
  email!: string;
}
```

#### ❌ Don't: Use Generic Types Without Validation

```typescript
@Schema()
export class UserSchema {
  @Prop()
  name!: string;

  @Prop()
  email!: string;
}
```

### 2. Query Optimization

#### ✅ Do: Select Only Required Fields

```typescript
// Good - Fetch only what you need
async findUsers() {
  return this.userModel
    .find({ active: true })
    .select('name email')  // Only these fields
    .lean()  // Plain objects, faster
    .exec();
}
```

#### ❌ Don't: Fetch Everything

```typescript
// Bad - Fetches all fields
async findUsers() {
  return this.userModel.find({ active: true }).exec();
}
```

### 3. Error Handling

#### ✅ Do: Handle Specific Errors

```typescript
async createUser(userData: CreateUserDto) {
  try {
    const user = await this.userModel.create(userData);
    return user;
  } catch (error: any) {
    // Duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      throw new Error(`${field} already exists`);
    }

    // Validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(', ');
      throw new Error(`Validation failed: ${messages}`);
    }

    // Cast error (invalid ObjectId)
    if (error.name === 'CastError') {
      throw new Error(`Invalid ${error.path}: ${error.value}`);
    }

    throw error;
  }
}
```

#### ❌ Don't: Generic Error Handling

```typescript
async createUser(userData: CreateUserDto) {
  try {
    return await this.userModel.create(userData);
  } catch (error) {
    throw new Error('Failed to create user');
  }
}
```

### 4. Indexes

#### ✅ Do: Index Frequently Queried Fields

```typescript
// Index single fields
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

// Compound index for common queries
UserSchema.index({ status: 1, createdAt: -1 });

// Text index for search
UserSchema.index({ name: 'text', bio: 'text' });

// Partial index (only index certain documents)
UserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deleted: { $ne: true } } }
);
```

#### ❌ Don't: Over-Index

```typescript
// Bad - Too many indexes slow down writes
UserSchema.index({ field1: 1 });
UserSchema.index({ field2: 1 });
UserSchema.index({ field3: 1 });
// ... 20+ indexes
```

### 5. Pagination

#### ✅ Do: Implement Efficient Pagination

```typescript
async findPaginated(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    this.model
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    this.model.countDocuments().exec()
  ]);

  return {
    docs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  };
}
```

### 6. Transactions

#### ✅ Do: Use Appropriate Transaction Strategy

```typescript
// For critical operations (orders, payments)
await withTwoPhaseCommit([...], async (txn) => {
  // Strong ACID guarantees
});

// For non-critical operations (logs, analytics)
await withCrossDbTransaction([...], async (txn) => {
  // Fast, best-effort atomicity
});

// For single database
await withTransaction(connection, async (session) => {
  // Full ACID within one DB
});
```

---

## Performance Optimization

### 1. Use Lean Queries for Read-Only Data

```typescript
// 5-10x faster for large datasets
const users = await this.userModel
  .find()
  .lean()  // Returns plain JavaScript objects
  .exec();

// Even faster with select
const users = await this.userModel
  .find()
  .select('name email')
  .lean()
  .exec();
```

### 2. Connection Pooling

```typescript
MongooseModule.forRoot({
  uri: dbUri,
  options: {
    maxPoolSize: 25,        // Maximum connections in pool
    minPoolSize: 2,         // Minimum connections to maintain
    maxIdleTimeMS: 60000,   // Close idle connections after 60s
    socketTimeoutMS: 45000, // Socket timeout
  }
});
```

### 3. Batch Operations

```typescript
// ✅ Good - Single bulk operation
await this.userModel.insertMany(users);  // Much faster

// ❌ Bad - Multiple individual operations
for (const user of users) {
  await this.userModel.create(user);  // Slow
}

// Advanced - Use bulkWrite for mixed operations
await this.userModel.bulkWrite([
  { insertOne: { document: user1 } },
  { updateOne: { filter: { _id: id1 }, update: { $set: data } } },
  { deleteOne: { filter: { _id: id2 } } }
]);
```

### 4. Projection (Field Selection)

```typescript
// Only fetch needed fields
const users = await this.userModel
  .find()
  .select('name email')  // Include only these
  .exec();

// Exclude fields
const users = await this.userModel
  .find()
  .select('-password -__v')  // Exclude these
  .exec();
```

### 5. Caching Strategy

```typescript
@Injectable()
export class UserService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 60000; // 1 minute

  async findById(id: string): Promise<User | null> {
    // Check cache
    const cached = this.cache.get(id);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // Fetch from DB
    const user = await this.userModel.findById(id).lean().exec();

    // Cache result
    if (user) {
      this.cache.set(id, { data: user, timestamp: Date.now() });
    }

    return user;
  }

  // Clear cache on updates
  async update(id: string, data: Partial<User>) {
    this.cache.delete(id);
    return this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }
}
```

### 6. Aggregation Optimization

```typescript
// Use $match early to reduce documents
const results = await this.orderModel.aggregate([
  // 1. Filter first (reduces data early)
  { $match: { status: 'completed', createdAt: { $gte: startDate } } },

  // 2. Then lookup
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },

  // 3. Project only needed fields
  { $project: { _id: 1, total: 1, 'user.name': 1, 'user.email': 1 } }
]);
```

---

## Testing

### Setup Test Database

```typescript
// test/setup.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from 'han-prev-mongoose';

let mongoServer: MongoMemoryServer;

export async function setupTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  return MongooseModule.forRoot({ uri });
}

export async function closeTestDB() {
  await MongooseModule.closeAllConnections();
  await mongoServer.stop();
}

export async function clearTestDB() {
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}
```

### Unit Tests

```typescript
// user.service.spec.ts
import { Test } from '@nestjs/testing';
import { UserService } from './user.service';
import { setupTestDB, closeTestDB, clearTestDB } from '../test/setup';

describe('UserService', () => {
  let service: UserService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [await setupTestDB()],
      providers: [UserService],
    }).compile();

    service = moduleRef.get<UserService>(UserService);
  });

  afterAll(async () => {
    await closeTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  it('should create a user', async () => {
    const user = await service.create({
      name: 'John Doe',
      email: 'john@example.com'
    });

    expect(user).toBeDefined();
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
  });

  it('should find user by email', async () => {
    await service.create({
      name: 'Jane Doe',
      email: 'jane@example.com'
    });

    const user = await service.findByEmail('jane@example.com');
    expect(user).toBeDefined();
    expect(user?.name).toBe('Jane Doe');
  });

  it('should throw error for duplicate email', async () => {
    await service.create({
      name: 'John',
      email: 'duplicate@example.com'
    });

    await expect(
      service.create({
        name: 'Jane',
        email: 'duplicate@example.com'
      })
    ).rejects.toThrow('Email already exists');
  });
});
```

### Integration Tests

```typescript
// user.controller.e2e.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (POST)', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.name).toBe('John Doe');
        expect(res.body.email).toBe('john@example.com');
      });
  });

  it('/users (GET)', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Test User', email: 'test@example.com' });

    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });
});
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Cannot overwrite model"

**Problem:**
```
OverwriteModelError: Cannot overwrite `User` model once compiled
```

**Solution:**
```typescript
// Check if model already exists
if (!mongoose.models.User) {
  mongoose.model('User', UserSchema);
}

// Or use MongooseModule.forFeature (handles this automatically)
MongooseModule.forFeature([UserSchema])
```

#### Issue 2: "Document not updating"

**Problem:**
```typescript
const user = await this.userModel.findByIdAndUpdate(id, data);
// Returns old document
```

**Solution:**
```typescript
const user = await this.userModel.findByIdAndUpdate(
  id,
  data,
  { new: true }  // Return updated document
);
```

#### Issue 3: "Validation not running on update"

**Problem:**
```typescript
// Validators don't run by default on findByIdAndUpdate
await this.userModel.findByIdAndUpdate(id, { age: -5 });  // No error!
```

**Solution:**
```typescript
await this.userModel.findByIdAndUpdate(
  id,
  data,
  {
    new: true,
    runValidators: true  // Run schema validators
  }
);
```

#### Issue 4: "Transaction timeout"

**Problem:**
```
Error: Transaction timeout
```

**Solution:**
```typescript
// Increase timeout for long operations
await withTransaction(
  connection,
  async (session) => {
    // Long-running operations
  },
  { timeout: 60000 }  // 60 seconds
);
```

#### Issue 5: "Connection pool exhausted"

**Problem:**
```
MongoServerSelectionError: connection pool exhausted
```

**Solution:**
```typescript
// Increase pool size
MongooseModule.forRoot({
  uri: dbUri,
  options: {
    maxPoolSize: 50,  // Increase from default 10
    minPoolSize: 5
  }
});
```

#### Issue 6: "Duplicate key error not caught"

**Problem:**
```typescript
try {
  await this.userModel.create({ email: 'existing@example.com' });
} catch (error) {
  console.log(error); // Generic error
}
```

**Solution:**
```typescript
try {
  await this.userModel.create({ email: 'existing@example.com' });
} catch (error: any) {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    throw new Error(`${field} already exists`);
  }
  throw error;
}
```

#### Issue 7: "Mongoose buffer timeout"

**Problem:**
```
MongooseError: Operation `users.find()` buffering timed out
```

**Solution:**
```typescript
// Ensure connection is established before queries
MongooseModule.forRoot({
  uri: dbUri,
  options: {
    serverSelectionTimeoutMS: 5000,
    bufferCommands: false  // Disable buffering
  }
});
```

---

## Migration Guides

### From @nestjs/mongoose to han-prev-mongoose

#### 1. Update Imports

```typescript
// Before (@nestjs/mongoose)
import { InjectModel } from '@nestjs/mongoose';
import { MongooseModule } from '@nestjs/mongoose';

// After (han-prev-mongoose)
import { InjectModel } from 'han-prev-mongoose';
import { MongooseModule } from 'han-prev-mongoose';
```

#### 2. Update Module Configuration

```typescript
// Before
MongooseModule.forRoot('mongodb://localhost/test')

// After
MongooseModule.forRoot({ uri: 'mongodb://localhost/test' })
```

#### 3. Multiple Connections

```typescript
// Before (@nestjs/mongoose)
MongooseModule.forRoot(uri1, { connectionName: 'db1' })
MongooseModule.forRoot(uri2, { connectionName: 'db2' })

// After (han-prev-mongoose) - Cleaner!
MongooseModule.forRootMultiple({
  connections: [
    { name: 'db1', uri: uri1 },
    { name: 'db2', uri: uri2 }
  ]
})
```

#### 4. Async Configuration

```typescript
// Before & After - Same API!
MongooseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    uri: config.get('MONGODB_URI')
  })
})
```

### From Plain Mongoose to han-prev-mongoose

#### 1. Replace Direct Mongoose Usage

```typescript
// Before (plain Mongoose)
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: String,
  email: String
});

const User = mongoose.model('User', UserSchema);

// After (han-prev-mongoose)
import { Schema, Prop, MongooseModule } from 'han-prev-mongoose';

@Schema()
export class UserSchema {
  @Prop({ type: String })
  name!: string;

  @Prop({ type: String })
  email!: string;
}

// In module
MongooseModule.forFeature([UserSchema])

// In service
@InjectModel('UserSchema') private userModel: Model<User>
```

#### 2. Replace Manual Transactions

```typescript
// Before (plain Mongoose)
const session = await mongoose.startSession();
session.startTransaction();
try {
  await User.create([userData], { session });
  await Post.create([postData], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}

// After (han-prev-mongoose)
await withTransaction(connection, async (session) => {
  await User.create([userData], { session });
  await Post.create([postData], { session });
});
```

---

## API Reference

### MongooseModule

#### Static Methods

##### `forRoot(options: MongooseModuleOptions)`
Configure a single database connection.

```typescript
MongooseModule.forRoot({
  uri: 'mongodb://localhost:27017/myapp',
  connectionName?: 'default',
  options?: {
    maxPoolSize: 10,
    minPoolSize: 2,
    // ... other mongoose options
  }
})
```

##### `forRootMultiple(options: MongooseMultipleConnectionsOptions)`
Configure multiple database connections.

```typescript
MongooseModule.forRootMultiple({
  connections: [
    { name: 'APP', uri: appUri, options?: {...} },
    { name: 'LOG', uri: logUri, options?: {...} }
  ]
})
```

##### `forRootAsync(options)`
Configure connection asynchronously.

```typescript
MongooseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    uri: config.get('DB_URI')
  }),
  connectionName?: 'default'
})
```

##### `forFeature(models, connectionName?)`
Register models for a feature module.

```typescript
MongooseModule.forFeature([
  UserSchema,
  { name: 'Product', schema: ProductSchema }
], 'APP')  // Optional connection name
```

##### `getConnection(name?: string): Connection`
Get a connection by name.

```typescript
const connection = MongooseModule.getConnection('APP');
```

##### `closeAllConnections(): Promise<void>`
Close all database connections.

```typescript
await MongooseModule.closeAllConnections();
```

##### `getHealthStatus()`
Get health status of all connections.

```typescript
const status = MongooseModule.getHealthStatus();
// Returns: { APP: { name, status, readyState, host }, ... }
```

### Decorators

#### `@Schema(options?)`
Mark a class as a Mongoose schema.

```typescript
@Schema({
  timestamps: true,
  collection: 'custom_collection_name'
})
export class UserSchema { }
```

#### `@Prop(options?)`
Define a schema property.

```typescript
@Prop({
  type: String,
  required: true,
  unique: true,
  index: true,
  default: 'value'
})
propertyName!: string;
```

#### `@InjectModel(modelName)`
Inject a Mongoose model.

```typescript
constructor(
  @InjectModel('UserSchema') private userModel: Model<User>
) {}
```

#### `@InjectConnection(connectionName?)`
Inject a Mongoose connection.

```typescript
constructor(
  @InjectConnection('APP') private connection: Connection
) {}
```

### Transaction Utilities

#### `withTransaction(connection, callback, options?)`
Execute a single-database transaction.

```typescript
const result = await withTransaction(
  connection,
  async (session) => {
    // Operations with session
  },
  {
    maxRetries: 3,
    timeout: 30000,
    readConcern: 'snapshot',
    writeConcern: 'majority'
  }
);
```

#### `withCrossDbTransaction(connections, callback, options?)`
Execute a cross-database transaction (parallel commits).

```typescript
const result = await withCrossDbTransaction(
  [
    { name: 'APP', connection: appConn },
    { name: 'LOG', connection: logConn }
  ],
  async (txn) => {
    const appSession = txn.getSession('APP');
    const logSession = txn.getSession('LOG');
    // Operations
  },
  options?
);
```

#### `withTwoPhaseCommit(connections, callback, options?)`
Execute a two-phase commit transaction (sequential commits, stronger ACID).

```typescript
const result = await withTwoPhaseCommit(
  connections,
  async (txn) => {
    // Operations
  },
  options?
);
```

---

## Additional Resources

### Official Documentation
- [Mongoose Official Docs](https://mongoosejs.com/docs/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [MongoDB University](https://university.mongodb.com/) - Free courses

### Package Documentation
- [ACID Compliance Guide](../../packages/mongoose/ACID_COMPLIANCE.md)
- [Advanced Features](./mongoose-advanced.md)
- [Production Review](../../packages/mongoose/PRODUCTION_REVIEW.md)
- [Comparison with NestJS](../../packages/mongoose/COMPARISON.md)

### Community
- [GitHub Issues](https://github.com/sirkenedy/han/issues)
- [GitHub Discussions](https://github.com/sirkenedy/han/discussions)
- [npm Package](https://www.npmjs.com/package/han-prev-mongoose)

---

## What's Next?

Explore more Han Framework features:
- [Validation](/techniques/validation) - Data validation with decorators
- [Configuration](/techniques/configuration) - Environment configuration
- [Caching](/techniques/caching) - Performance optimization
- [Authentication](/techniques/authentication) - User authentication
- [Guards](/techniques/guards) - Route protection

---

**🎉 You're now ready to build production-grade applications with MongoDB and Han Framework!**

*Last updated: 2025-10-04 | Package version: 1.1.0*
