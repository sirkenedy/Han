# Database (Mongoose)

Learn how to integrate MongoDB with your Han Framework application using Mongoose, the elegant MongoDB object modeling library.

## Installation

```bash
npm install mongoose @types/mongoose
```

## Basic Setup

### 1. Create Database Module

```typescript
// database/database.module.ts
import { Module } from 'han-prev-core';
import mongoose from 'mongoose';

@Module({})
export class DatabaseModule {
  static async connect(uri: string) {
    try {
      await mongoose.connect(uri);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }
}
```

### 2. Connect in Main File

```typescript
// index.ts
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';
import { DatabaseModule } from './database/database.module';

const bootstrap = async () => {
  // Connect to MongoDB
  await DatabaseModule.connect('mongodb://localhost:27017/myapp');

  // Create Han app
  const app = await HanFactory.create(AppModule);
  await app.listen(3000);

  console.log('🚀 Server running on http://localhost:3000');
};

bootstrap();
```

## Defining Models

### Simple Model

```typescript
// models/user.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
```

### Model with Relationships

```typescript
// models/post.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  tags: string[];
  published: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    published: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Post = mongoose.model<IPost>('Post', PostSchema);
```

## Creating a Repository Service

```typescript
// user/user.service.ts
import { Injectable } from 'han-prev-core';
import { User, IUser } from '../models/user.model';

@Injectable()
export class UserService {
  async create(userData: Partial<IUser>) {
    const user = new User(userData);
    return await user.save();
  }

  async findAll() {
    return await User.find().select('-password');
  }

  async findById(id: string) {
    return await User.findById(id).select('-password');
  }

  async findByEmail(email: string) {
    return await User.findOne({ email });
  }

  async update(id: string, userData: Partial<IUser>) {
    return await User.findByIdAndUpdate(
      id,
      userData,
      { new: true, runValidators: true }
    ).select('-password');
  }

  async delete(id: string) {
    return await User.findByIdAndDelete(id);
  }

  async count() {
    return await User.countDocuments();
  }
}
```

## Using in Controllers

```typescript
// user/user.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body } from 'han-prev-core';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async create(@Body() userData: any) {
    return await this.userService.create(userData);
  }

  @Get()
  async findAll() {
    return await this.userService.findAll();
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
  async update(@Param('id') id: string, @Body() userData: any) {
    return await this.userService.update(id, userData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.userService.delete(id);
    return { message: 'User deleted successfully' };
  }
}
```

## Advanced Queries

### Filtering and Sorting

```typescript
@Injectable()
export class PostService {
  async findPublished(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return await Post.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('author', 'name email')
      .select('-__v');
  }

  async search(query: string) {
    return await Post.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { content: { $regex: query, $options: 'i' } },
      ],
    });
  }

  async findByTags(tags: string[]) {
    return await Post.find({
      tags: { $in: tags },
    });
  }
}
```

### Aggregation

```typescript
@Injectable()
export class AnalyticsService {
  async getUserStats() {
    return await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          avgAge: { $avg: '$age' },
        },
      },
    ]);
  }

  async getPostsByAuthor() {
    return await Post.aggregate([
      {
        $group: {
          _id: '$author',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'author',
        },
      },
      {
        $unwind: '$author',
      },
      {
        $project: {
          authorName: '$author.name',
          postCount: '$count',
          totalViews: 1,
        },
      },
      {
        $sort: { postCount: -1 },
      },
    ]);
  }
}
```

## Schema Middleware (Hooks)

### Pre-Save Hook

```typescript
import bcrypt from 'bcryptjs';

UserSchema.pre('save', async function (next) {
  // Only hash password if it's modified
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
```

### Post-Save Hook

```typescript
PostSchema.post('save', function (doc) {
  console.log(`New post created: ${doc.title}`);
});
```

### Pre-Remove Hook

```typescript
UserSchema.pre('remove', async function (next) {
  // Delete all posts by this user
  await Post.deleteMany({ author: this._id });
  next();
});
```

## Virtual Properties

```typescript
UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Include virtuals in JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });
```

## Instance Methods

```typescript
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Usage
const user = await User.findOne({ email });
const isMatch = await user.comparePassword(password);
```

## Static Methods

```typescript
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email });
};

// Usage
const user = await User.findByEmail('user@example.com');
```

## Validation

### Built-in Validators

```typescript
const ProductSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  category: {
    type: String,
    enum: {
      values: ['Electronics', 'Clothing', 'Books'],
      message: '{VALUE} is not a valid category',
    },
  },
  email: {
    type: String,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
});
```

### Custom Validators

```typescript
const UserSchema = new Schema({
  age: {
    type: Number,
    validate: {
      validator: function (value: number) {
        return value >= 18;
      },
      message: 'User must be at least 18 years old',
    },
  },
  username: {
    type: String,
    validate: {
      validator: async function (value: string) {
        const user = await User.findOne({ username: value });
        return !user;
      },
      message: 'Username already exists',
    },
  },
});
```

## Transactions

```typescript
@Injectable()
export class TransferService {
  async transferFunds(fromId: string, toId: string, amount: number) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Deduct from sender
      const sender = await Account.findByIdAndUpdate(
        fromId,
        { $inc: { balance: -amount } },
        { session, new: true }
      );

      if (!sender || sender.balance < 0) {
        throw new Error('Insufficient funds');
      }

      // Add to receiver
      await Account.findByIdAndUpdate(
        toId,
        { $inc: { balance: amount } },
        { session }
      );

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
```

## Indexing

```typescript
// Single field index
UserSchema.index({ email: 1 });

// Compound index
PostSchema.index({ author: 1, createdAt: -1 });

// Text index for search
PostSchema.index({ title: 'text', content: 'text' });

// Unique index
UserSchema.index({ username: 1 }, { unique: true });

// TTL index (auto-delete after time)
SessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });
```

## Population (Relationships)

```typescript
@Injectable()
export class PostService {
  async findWithAuthor(id: string) {
    return await Post.findById(id)
      .populate('author', 'name email')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name',
        },
      });
  }

  async findAllWithAuthors() {
    return await Post.find()
      .populate('author')
      .sort({ createdAt: -1 });
  }
}
```

## Environment Configuration

```typescript
// config/database.config.ts
export const getDatabaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';

  const configs = {
    development: {
      uri: 'mongodb://localhost:27017/myapp-dev',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
    production: {
      uri: process.env.MONGODB_URI!,
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        retryWrites: true,
        w: 'majority',
      },
    },
    test: {
      uri: 'mongodb://localhost:27017/myapp-test',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    },
  };

  return configs[env as keyof typeof configs];
};
```

## Error Handling

```typescript
@Injectable()
export class UserService {
  async create(userData: Partial<IUser>) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('Email already exists');
      }

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors)
          .map((err: any) => err.message)
          .join(', ');
        throw new Error(`Validation failed: ${messages}`);
      }

      throw error;
    }
  }
}
```

## Best Practices

### 1. Use Lean Queries for Read-Only

```typescript
// ✅ Good - Faster, returns plain objects
const users = await User.find().lean();

// ❌ Slower - Returns Mongoose documents
const users = await User.find();
```

### 2. Select Only Needed Fields

```typescript
// ✅ Good - Only fetch needed fields
const users = await User.find().select('name email');

// ❌ Bad - Fetches all fields
const users = await User.find();
```

### 3. Use Indexes Wisely

```typescript
// ✅ Good - Index frequently queried fields
UserSchema.index({ email: 1 });
PostSchema.index({ author: 1, createdAt: -1 });

// ❌ Bad - Too many indexes slow down writes
```

### 4. Handle Connection Errors

```typescript
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});
```

## Testing with MongoDB Memory Server

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

## Quick Reference

```typescript
// Create
const user = new User({ name: 'John', email: 'john@example.com' });
await user.save();
// or
await User.create({ name: 'John', email: 'john@example.com' });

// Read
await User.find();                          // All
await User.findById(id);                    // By ID
await User.findOne({ email: 'john@' });     // By query

// Update
await User.findByIdAndUpdate(id, { name: 'Jane' }, { new: true });
await User.updateMany({ active: false }, { deleted: true });

// Delete
await User.findByIdAndDelete(id);
await User.deleteMany({ deleted: true });

// Count
await User.countDocuments({ active: true });

// Aggregation
await User.aggregate([...]);
```

## Next Steps

- Learn about [Validation](/techniques/validation) for data validation
- Explore [Configuration](/techniques/configuration) for environment setup
- Check out [Caching](/techniques/caching) for performance optimization

MongoDB with Mongoose gives you powerful data modeling capabilities! 🗄️
