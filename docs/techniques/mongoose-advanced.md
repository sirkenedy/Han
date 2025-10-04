# MongoDB Advanced Features

This guide covers advanced Mongoose features including aggregation, indexing, middleware hooks, virtuals, and more.

## Table of Contents

- [Aggregation](#aggregation)
- [Indexing](#indexing)
- [Middleware (Hooks)](#middleware-hooks)
- [Virtual Properties](#virtual-properties)
- [Methods & Statics](#methods--statics)
- [Query Helpers](#query-helpers)
- [Plugins](#plugins)
- [Text Search](#text-search)
- [Geospatial Queries](#geospatial-queries)
- [Change Streams](#change-streams)

---

## Aggregation

Aggregation operations process data records and return computed results.

### Basic Aggregation

```typescript
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel('OrderSchema') private orderModel: Model<Order>
  ) {}

  async getOrderStats() {
    return this.orderModel.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$amount' },
          averageOrderValue: { $avg: '$amount' },
          maxOrderValue: { $max: '$amount' },
          minOrderValue: { $min: '$amount' }
        }
      }
    ]);
  }

  async getOrdersByStatus() {
    return this.orderModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
  }
}
```

### Advanced Aggregation Pipeline

```typescript
@Injectable()
export class ReportService {
  constructor(
    @InjectModel('OrderSchema') private orderModel: Model<Order>
  ) {}

  async getSalesReport(startDate: Date, endDate: Date) {
    return this.orderModel.aggregate([
      // Stage 1: Filter by date range
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      // Stage 2: Lookup user data
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      // Stage 3: Unwind array
      {
        $unwind: '$user'
      },
      // Stage 4: Unwind items
      {
        $unwind: '$items'
      },
      // Stage 5: Lookup product data
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'items.product'
        }
      },
      // Stage 6: Unwind product
      {
        $unwind: '$items.product'
      },
      // Stage 7: Group by product
      {
        $group: {
          _id: '$items.product.category',
          totalSales: {
            $sum: { $multiply: ['$items.quantity', '$items.price'] }
          },
          totalQuantity: { $sum: '$items.quantity' },
          uniqueCustomers: { $addToSet: '$user._id' }
        }
      },
      // Stage 8: Add computed fields
      {
        $addFields: {
          category: '$_id',
          uniqueCustomerCount: { $size: '$uniqueCustomers' }
        }
      },
      // Stage 9: Project final shape
      {
        $project: {
          _id: 0,
          category: 1,
          totalSales: 1,
          totalQuantity: 1,
          uniqueCustomerCount: 1,
          averageOrderValue: {
            $divide: ['$totalSales', '$uniqueCustomerCount']
          }
        }
      },
      // Stage 10: Sort by revenue
      {
        $sort: { totalSales: -1 }
      }
    ]);
  }

  async getTopCustomers(limit: number = 10) {
    return this.orderModel.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$amount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$amount' },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          totalSpent: 1,
          orderCount: 1,
          averageOrderValue: 1,
          lastOrderDate: 1
        }
      },
      {
        $sort: { totalSpent: -1 }
      },
      {
        $limit: limit
      }
    ]);
  }
}
```

### Time-based Aggregation

```typescript
@Injectable()
export class MetricsService {
  constructor(
    @InjectModel('EventSchema') private eventModel: Model<Event>
  ) {}

  async getDailyMetrics(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.eventModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $addFields: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          uniqueUserCount: { $size: '$uniqueUsers' }
        }
      },
      {
        $project: {
          _id: 0,
          date: 1,
          count: 1,
          uniqueUserCount: 1
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);
  }
}
```

---

## Indexing

Indexes improve query performance dramatically.

### Creating Indexes

```typescript
// In schema definition
import { MongooseSchema } from 'han-prev-mongoose';

export const UserMongooseSchema = new MongooseSchema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  age: Number,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  }
}, { timestamps: true });

// Single field index
UserMongooseSchema.index({ email: 1 }, { unique: true });

// Compound index
UserMongooseSchema.index({ name: 1, age: -1 });

// Text index for search
UserMongooseSchema.index({ name: 'text', bio: 'text' });

// TTL index (auto-delete after time)
UserMongooseSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// Geospatial index
UserMongooseSchema.index({ location: '2dsphere' });

// Partial index (only index documents meeting condition)
UserMongooseSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { deleted: { $ne: true } } }
);

// Sparse index (only index documents with the field)
UserMongooseSchema.index({ phone: 1 }, { sparse: true });
```

### Index Management Service

```typescript
@Injectable()
export class IndexService {
  constructor(
    @InjectModel('UserSchema') private userModel: Model<User>
  ) {}

  async listIndexes() {
    return this.userModel.collection.listIndexes().toArray();
  }

  async createIndex(fields: any, options?: any) {
    return this.userModel.collection.createIndex(fields, options);
  }

  async dropIndex(indexName: string) {
    return this.userModel.collection.dropIndex(indexName);
  }

  async getIndexStats() {
    const stats = await this.userModel.collection.stats();
    return {
      indexSizes: stats.indexSizes,
      nindexes: stats.nindexes,
      totalIndexSize: stats.totalIndexSize
    };
  }

  async analyzeQueryPerformance(query: any) {
    return this.userModel.find(query).explain('executionStats');
  }
}
```

---

## Middleware (Hooks)

Middleware (hooks) allow you to execute code before/after certain operations.

### Pre/Post Hooks

```typescript
import { MongooseSchema } from 'han-prev-mongoose';
import * as bcrypt from 'bcryptjs';

export const UserMongooseSchema = new MongooseSchema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  loginAttempts: { type: Number, default: 0 },
  lastLogin: Date
});

// Pre-save hook (hash password before saving)
UserMongooseSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Post-save hook (log creation)
UserMongooseSchema.post('save', function(doc) {
  console.log(`User ${doc.email} was saved`);
});

// Pre-find hook (exclude deleted users)
UserMongooseSchema.pre('find', function(next) {
  this.where({ deleted: { $ne: true } });
  next();
});

// Pre-remove hook (cascade delete)
UserMongooseSchema.pre('remove', async function(next) {
  await this.model('Post').deleteMany({ author: this._id });
  await this.model('Comment').deleteMany({ user: this._id });
  next();
});

// Post-update hook
UserMongooseSchema.post('findOneAndUpdate', function(doc) {
  if (doc) {
    console.log(`User ${doc._id} was updated`);
  }
});

// Error handling hook
UserMongooseSchema.post('save', function(error: any, doc: any, next: any) {
  if (error.code === 11000) {
    next(new Error('Email already exists'));
  } else {
    next(error);
  }
});
```

### Validation Hooks

```typescript
import { MongooseSchema } from 'han-prev-mongoose';

export const ProductMongooseSchema = new MongooseSchema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalPrice: Number
});

// Pre-validate hook
ProductMongooseSchema.pre('validate', function(next) {
  // Calculate final price before validation
  this.finalPrice = this.price * (1 - this.discount / 100);
  next();
});

// Custom async validator
ProductMongooseSchema.path('price').validate(async function(value) {
  if (value <= 0) {
    return false;
  }

  // Check if price is within allowed range for category
  const maxPrice = await getMaxPriceForCategory(this.category);
  return value <= maxPrice;
}, 'Price exceeds maximum allowed for this category');
```

---

## Virtual Properties

Virtuals are document properties that don't get persisted to MongoDB.

### Basic Virtuals

```typescript
import { MongooseSchema } from 'han-prev-mongoose';

export const UserMongooseSchema = new MongooseSchema({
  firstName: String,
  lastName: String,
  email: String,
  birthDate: Date
});

// Virtual getter
UserMongooseSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual setter
UserMongooseSchema.virtual('fullName').set(function(name: string) {
  const [firstName, lastName] = name.split(' ');
  this.firstName = firstName;
  this.lastName = lastName;
});

// Computed virtual
UserMongooseSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  const today = new Date();
  const age = today.getFullYear() - this.birthDate.getFullYear();
  const monthDiff = today.getMonth() - this.birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.birthDate.getDate())) {
    return age - 1;
  }
  return age;
});

// Include virtuals in JSON
UserMongooseSchema.set('toJSON', { virtuals: true });
UserMongooseSchema.set('toObject', { virtuals: true });
```

### Virtual Populate

```typescript
import { MongooseSchema } from 'han-prev-mongoose';

// User schema
export const UserMongooseSchema = new MongooseSchema({
  name: String,
  email: String
});

// Virtual populate posts
UserMongooseSchema.virtual('posts', {
  ref: 'PostSchema',
  localField: '_id',
  foreignField: 'author',
  count: false // Set to true to get count only
});

// Service usage
@Injectable()
export class UserService {
  constructor(
    @InjectModel('UserSchema') private userModel: Model<User>
  ) {}

  async findWithPosts(id: string) {
    return this.userModel
      .findById(id)
      .populate('posts')
      .exec();
  }

  async findWithPostCount(id: string) {
    const user = await this.userModel.findById(id);
    const postCount = await this.model('PostSchema')
      .countDocuments({ author: user._id });

    return {
      ...user.toObject(),
      postCount
    };
  }
}
```

---

## Methods & Statics

### Instance Methods

```typescript
import { MongooseSchema } from 'han-prev-mongoose';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export interface IUser extends Document {
  email: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): string;
  toPublicJSON(): any;
}

export const UserMongooseSchema = new MongooseSchema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

// Instance method - compare password
UserMongooseSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method - generate JWT
UserMongooseSchema.methods.generateAuthToken = function(): string {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

// Instance method - public JSON
UserMongooseSchema.methods.toPublicJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Usage in service
@Injectable()
export class AuthService {
  constructor(
    @InjectModel('UserSchema') private userModel: Model<IUser>
  ) {}

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid credentials');
    }

    const token = user.generateAuthToken();

    return {
      user: user.toPublicJSON(),
      token
    };
  }
}
```

### Static Methods

```typescript
import { MongooseSchema, Model } from 'han-prev-mongoose';

export interface UserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
  findActive(): Promise<IUser[]>;
  search(query: string): Promise<IUser[]>;
}

export const UserMongooseSchema = new MongooseSchema({
  email: { type: String, required: true },
  name: String,
  active: { type: Boolean, default: true },
  deletedAt: Date
});

// Static method - find by email
UserMongooseSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email, deletedAt: null });
};

// Static method - find active users
UserMongooseSchema.statics.findActive = function() {
  return this.find({
    active: true,
    deletedAt: null
  });
};

// Static method - search
UserMongooseSchema.statics.search = function(query: string) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } }
    ],
    deletedAt: null
  });
};

// Usage
@Injectable()
export class UserService {
  constructor(
    @InjectModel('UserSchema') private userModel: UserModel
  ) {}

  async findByEmail(email: string) {
    return this.userModel.findByEmail(email);
  }

  async getActiveUsers() {
    return this.userModel.findActive();
  }

  async search(query: string) {
    return this.userModel.search(query);
  }
}
```

---

## Query Helpers

Query helpers allow you to extend Mongoose's query builder.

```typescript
import { MongooseSchema } from 'han-prev-mongoose';

export const UserMongooseSchema = new MongooseSchema({
  name: String,
  age: Number,
  active: Boolean,
  premium: Boolean
});

// Query helper - by age range
UserMongooseSchema.query.byAgeRange = function(min: number, max: number) {
  return this.where('age').gte(min).lte(max);
};

// Query helper - active only
UserMongooseSchema.query.active = function() {
  return this.where('active').equals(true);
};

// Query helper - premium users
UserMongooseSchema.query.premium = function() {
  return this.where('premium').equals(true);
};

// Usage
@Injectable()
export class UserService {
  constructor(
    @InjectModel('UserSchema') private userModel: Model<User>
  ) {}

  async findActiveAdults() {
    return this.userModel
      .find()
      .byAgeRange(18, 100)
      .active()
      .exec();
  }

  async findPremiumUsers() {
    return this.userModel
      .find()
      .premium()
      .active()
      .sort('-createdAt')
      .exec();
  }
}
```

---

## Plugins

Plugins allow you to reuse schema functionality across models.

### Creating a Plugin

```typescript
// plugins/timestamp.plugin.ts
import { Schema } from 'mongoose';

export function timestampPlugin(schema: Schema, options: any = {}) {
  const { index } = options;

  schema.add({
    createdAt: { type: Date, default: Date.now, index },
    updatedAt: { type: Date, default: Date.now, index },
    createdBy: { type: Schema.Types.ObjectId, ref: 'UserSchema' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'UserSchema' }
  });

  schema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
  });

  schema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: new Date() });
    next();
  });
}

// plugins/soft-delete.plugin.ts
export function softDeletePlugin(schema: Schema) {
  schema.add({
    deleted: { type: Boolean, default: false, index: true },
    deletedAt: Date,
    deletedBy: { type: Schema.Types.ObjectId, ref: 'UserSchema' }
  });

  // Override find to exclude deleted
  schema.pre('find', function(next) {
    this.where({ deleted: { $ne: true } });
    next();
  });

  schema.pre('findOne', function(next) {
    this.where({ deleted: { $ne: true } });
    next();
  });

  // Add soft delete method
  schema.methods.softDelete = function(userId?: string) {
    this.deleted = true;
    this.deletedAt = new Date();
    if (userId) this.deletedBy = userId;
    return this.save();
  };

  // Add restore method
  schema.methods.restore = function() {
    this.deleted = false;
    this.deletedAt = undefined;
    this.deletedBy = undefined;
    return this.save();
  };

  // Static method to find deleted
  schema.statics.findDeleted = function() {
    return this.find({ deleted: true });
  };
}

// Usage
import { timestampPlugin, softDeletePlugin } from './plugins';

export const UserMongooseSchema = new MongooseSchema({
  name: String,
  email: String
});

UserMongooseSchema.plugin(timestampPlugin, { index: true });
UserMongooseSchema.plugin(softDeletePlugin);
```

### Pagination Plugin

```typescript
// plugins/pagination.plugin.ts
export function paginationPlugin(schema: Schema) {
  schema.statics.paginate = async function(
    query: any = {},
    options: {
      page?: number;
      limit?: number;
      sort?: any;
      select?: string;
      populate?: any;
    } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.find(query)
        .select(options.select)
        .sort(options.sort)
        .skip(skip)
        .limit(limit)
        .populate(options.populate || '')
        .exec(),
      this.countDocuments(query)
    ]);

    return {
      docs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    };
  };
}

// Usage
UserMongooseSchema.plugin(paginationPlugin);

@Injectable()
export class UserService {
  constructor(@InjectModel('UserSchema') private userModel: any) {}

  async findPaginated(page: number, limit: number) {
    return this.userModel.paginate(
      { active: true },
      {
        page,
        limit,
        sort: '-createdAt',
        select: 'name email',
        populate: 'profile'
      }
    );
  }
}
```

---

*Continue to [Real-World Examples](./mongoose-examples.md) for practical implementations.*
