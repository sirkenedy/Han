# MongoDB/Mongoose Documentation Index

Complete guide to using MongoDB with Han Framework's `han-prev-mongoose` package.

## 📚 Documentation Structure

### 1. [Main Guide](./mongoose.md) - **START HERE**
Complete MongoDB integration guide covering:
- ✅ Installation & Setup
- ✅ Quick Start (5-minute tutorial)
- ✅ Core Concepts (Schemas, Models, DI)
- ✅ CRUD Operations (with 20+ examples)
- ✅ Advanced Queries & Filters
- ✅ Relationships (One-to-Many, Many-to-Many)
- ✅ Multiple Database Connections
- ✅ Transactions (Single & Cross-Database)
- ✅ Pagination & Search

### 2. [Advanced Features](./mongoose-advanced.md)
Deep dive into advanced Mongoose capabilities:
- ✅ Aggregation Pipelines (with real examples)
- ✅ Indexing Strategies
- ✅ Middleware/Hooks (Pre/Post)
- ✅ Virtual Properties
- ✅ Instance & Static Methods
- ✅ Query Helpers
- ✅ Plugins (Reusable functionality)
- ✅ Text Search
- ✅ Geospatial Queries
- ✅ Change Streams

### 3. Transaction Guides
#### [ACID Compliance Guide](../../packages/mongoose/ACID_COMPLIANCE.md)
- ✅ ACID guarantees explained
- ✅ Single vs Cross-Database transactions
- ✅ Two-Phase Commit (2PC) pattern
- ✅ When to use which strategy
- ✅ Real-world examples
- ✅ Rollback handling

### 4. Comparison & Analysis
#### [vs NestJS Mongoose](../../packages/mongoose/COMPARISON.md)
- ✅ Feature-by-feature comparison
- ✅ Performance benchmarks
- ✅ Pros & cons of each
- ✅ Migration guide
- ✅ Decision matrix

#### [Production Review](../../packages/mongoose/PRODUCTION_REVIEW.md)
- ✅ Production readiness assessment
- ✅ Critical issues & fixes
- ✅ Performance analysis
- ✅ Security review
- ✅ Scalability assessment

### 5. Package Information
#### [Improvements Summary](../../packages/mongoose/IMPROVEMENTS_SUMMARY.md)
- ✅ What was fixed
- ✅ New features added
- ✅ Performance metrics
- ✅ Upgrade guide

#### [README](../../packages/mongoose/README.md)
- ✅ Quick overview
- ✅ Installation
- ✅ Basic usage
- ✅ API reference

---

## 🚀 Quick Links

### Getting Started (5 minutes)
1. [Installation](./mongoose.md#installation) - Install dependencies
2. [Quick Start](./mongoose.md#quick-start) - Build your first API
3. [Core Concepts](./mongoose.md#core-concepts) - Understand the basics

### Common Tasks
- [CRUD Operations](./mongoose.md#basic-usage) - Create, Read, Update, Delete
- [Queries & Filters](./mongoose.md#querying) - Find data efficiently
- [Relationships](./mongoose.md#relationships) - Connect your data
- [Pagination](./mongoose.md#advanced-queries) - Handle large datasets

### Advanced Topics
- [Multiple Databases](./mongoose.md#multiple-databases) - Connect to multiple DBs
- [Transactions](./mongoose.md#transactions) - Ensure data consistency
- [Aggregation](./mongoose-advanced.md#aggregation) - Complex data analysis
- [Performance](./mongoose-advanced.md#indexing) - Optimize queries

### Production
- [ACID Compliance](../../packages/mongoose/ACID_COMPLIANCE.md) - Transaction guarantees
- [Production Review](../../packages/mongoose/PRODUCTION_REVIEW.md) - Deployment checklist
- [Best Practices](#best-practices) - Tips for production apps

---

## 📖 Learning Path

### Beginner (Day 1)
1. Read [Installation](./mongoose.md#installation)
2. Follow [Quick Start](./mongoose.md#quick-start)
3. Practice [CRUD Operations](./mongoose.md#basic-usage)
4. Try [Basic Queries](./mongoose.md#querying)

### Intermediate (Week 1)
1. Learn [Relationships](./mongoose.md#relationships)
2. Implement [Pagination](./mongoose.md#advanced-queries)
3. Add [Validation](./mongoose-advanced.md#middleware-hooks)
4. Use [Virtual Properties](./mongoose-advanced.md#virtual-properties)

### Advanced (Month 1)
1. Master [Aggregation](./mongoose-advanced.md#aggregation)
2. Optimize with [Indexes](./mongoose-advanced.md#indexing)
3. Implement [Multiple Databases](./mongoose.md#multiple-databases)
4. Handle [Transactions](./mongoose.md#transactions)

### Expert (Ongoing)
1. Understand [ACID Compliance](../../packages/mongoose/ACID_COMPLIANCE.md)
2. Review [Production Checklist](../../packages/mongoose/PRODUCTION_REVIEW.md)
3. Compare with [NestJS](../../packages/mongoose/COMPARISON.md)
4. Contribute improvements

---

## 💡 Best Practices

### Schema Design
```typescript
// ✅ Good - Specific types and validation
@Schema({ timestamps: true })
export class UserSchema {
  @Prop({ type: String, required: true, minlength: 2, maxlength: 50 })
  name!: string;

  @Prop({ type: String, required: true, unique: true, lowercase: true, index: true })
  email!: string;
}

// ❌ Bad - No validation
@Schema()
export class UserSchema {
  @Prop()
  name!: string;

  @Prop()
  email!: string;
}
```

### Query Optimization
```typescript
// ✅ Good - Select only needed fields
const users = await this.userModel
  .find({ active: true })
  .select('name email')
  .lean()  // Plain objects, faster
  .exec();

// ❌ Bad - Fetch everything
const users = await this.userModel.find({ active: true }).exec();
```

### Error Handling
```typescript
// ✅ Good - Specific error handling
try {
  const user = await this.userModel.create(userData);
  return user;
} catch (error: any) {
  if (error.code === 11000) {
    throw new Error('Email already exists');
  }
  if (error.name === 'ValidationError') {
    throw new Error(`Validation failed: ${error.message}`);
  }
  throw error;
}

// ❌ Bad - Generic error
const user = await this.userModel.create(userData);
```

### Transactions
```typescript
// ✅ Good - Use appropriate transaction type
// For critical operations (orders, payments)
await withTwoPhaseCommit([...], async (txn) => { ... });

// For non-critical (logs, analytics)
await withCrossDbTransaction([...], async (txn) => { ... });

// ❌ Bad - Using wrong transaction type
await withCrossDbTransaction([...], async (txn) => {
  // Critical financial operation - should use 2PC!
});
```

---

## 🔧 Common Patterns

### Repository Pattern
```typescript
// Create a base repository
export abstract class BaseRepository<T extends Document> {
  constructor(protected model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  async findAll(): Promise<T[]> {
    return this.model.find().exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  // ... more methods
}

// Use it
export class UserRepository extends BaseRepository<User> {
  constructor(@InjectModel('UserSchema') userModel: Model<User>) {
    super(userModel);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findOne({ email }).exec();
  }
}
```

### Service Layer Pattern
```typescript
// Keep services focused on business logic
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService
  ) {}

  async createUser(data: CreateUserDto): Promise<User> {
    // Validation
    await this.validateUserData(data);

    // Create user
    const user = await this.userRepository.create(data);

    // Send welcome email (don't await - fire and forget)
    this.emailService.sendWelcome(user.email);

    // Audit log
    await this.auditService.log('USER_CREATED', user._id);

    return user;
  }
}
```

### DTO Pattern
```typescript
// Use DTOs for data transfer
export class CreateUserDto {
  @IsString()
  @Length(2, 50)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

// Use in controller
@Post()
async create(@Body() dto: CreateUserDto) {
  return this.userService.create(dto);
}
```

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: "Cannot overwrite model"
```typescript
// Problem: Model registered twice
// Solution: Check if model already exists
if (!mongoose.models.User) {
  mongoose.model('User', UserSchema);
}
```

#### Issue: "Document not updating"
```typescript
// Problem: Not returning updated document
const user = await this.userModel.findByIdAndUpdate(id, data);  // ❌

// Solution: Use { new: true }
const user = await this.userModel.findByIdAndUpdate(id, data, { new: true });  // ✅
```

#### Issue: "Transaction timeout"
```typescript
// Problem: Default timeout too short
await withTransaction(connection, async (session) => {
  // Long operation
});

// Solution: Increase timeout
await withTransaction(connection, async (session) => {
  // Long operation
}, { timeout: 60000 });  // 60 seconds
```

#### Issue: "Validation not running on update"
```typescript
// Problem: Validators not running by default
await this.model.findByIdAndUpdate(id, data);  // ❌

// Solution: Use runValidators
await this.model.findByIdAndUpdate(id, data, { runValidators: true });  // ✅
```

---

## 📊 Performance Tips

### 1. Use Lean Queries for Read-Only Data
```typescript
// 5-10x faster for large datasets
const users = await this.userModel.find().lean().exec();
```

### 2. Create Proper Indexes
```typescript
// Index frequently queried fields
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ name: 'text' });  // For text search
```

### 3. Use Projection (Select)
```typescript
// Fetch only what you need
const users = await this.userModel
  .find()
  .select('name email')  // Only these fields
  .exec();
```

### 4. Batch Operations
```typescript
// Use insertMany for bulk inserts
await this.userModel.insertMany(users);  // Much faster than loop

// Use bulkWrite for complex operations
await this.userModel.bulkWrite([
  { insertOne: { document: user1 } },
  { updateOne: { filter: { _id: id }, update: data } },
  { deleteOne: { filter: { _id: id } } }
]);
```

### 5. Connection Pooling
```typescript
// Configure appropriate pool size
MongooseModule.forRoot({
  uri: dbUri,
  options: {
    maxPoolSize: 25,     // Max connections
    minPoolSize: 2,      // Min connections
    maxIdleTimeMS: 60000 // Close idle connections
  }
});
```

---

## 🎯 Real-World Use Cases

### E-Commerce
- [Order Management](./mongoose.md#transactions) - Handle orders with transactions
- [Inventory Tracking](./mongoose-advanced.md#aggregation) - Real-time stock updates
- [Product Search](./mongoose-advanced.md#text-search) - Full-text search

### Social Media
- [Feed Aggregation](./mongoose-advanced.md#aggregation) - User feeds
- [Follower System](./mongoose.md#relationships) - Many-to-Many relationships
- [Real-time Updates](./mongoose-advanced.md#change-streams) - Live notifications

### SaaS Applications
- [Multi-tenancy](./mongoose.md#multiple-databases) - Separate tenant data
- [Audit Logging](./mongoose.md#transactions) - Track all changes
- [Analytics](./mongoose-advanced.md#aggregation) - Usage metrics

---

## 🤝 Contributing

Found an issue or want to improve the docs?

1. Open an issue: https://github.com/sirkenedy/han/issues
2. Submit a PR with improvements
3. Share your use cases and examples

---

## 📞 Support

- **Documentation**: You're reading it!
- **Examples**: See [mongoose.md](./mongoose.md) and [mongoose-advanced.md](./mongoose-advanced.md)
- **Issues**: https://github.com/sirkenedy/han/issues
- **Discussions**: https://github.com/sirkenedy/han/discussions

---

## 🎓 Additional Resources

### Official Docs
- [Mongoose Official Docs](https://mongoosejs.com/docs/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [MongoDB University](https://university.mongodb.com/) - Free courses

### Video Tutorials
- MongoDB Basics (coming soon)
- Advanced Aggregation (coming soon)
- Performance Optimization (coming soon)

### Blog Posts
- "Building Scalable Apps with Han + MongoDB" (coming soon)
- "Cross-Database Transactions Explained" (coming soon)
- "MongoDB Performance Tuning" (coming soon)

---

**Last Updated**: 2025-10-04
**Package Version**: 1.1.0
**Status**: Production Ready ✅

*Happy coding with Han Framework + MongoDB! 🚀*
