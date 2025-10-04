# Caching

Learn how to implement caching in your Han Framework application to improve performance and reduce database load.

## Why Caching?

**The Problem:** Your database can only handle so many queries per second. Every request that hits the database adds latency and load.

**Real-World Example:**
```typescript
// ❌ Without caching - hits database every time
@Get('products/:id')
async getProduct(@Param('id') id: string) {
  // 50ms database query on EVERY request
  return this.productService.findById(id);
}
// 1000 requests = 1000 database queries = Database overload! 💥
```

```typescript
// ✅ With caching - hits database once, serves from memory after
@Get('products/:id')
async getProduct(@Param('id') id: string) {
  const cached = this.cache.get(`product:${id}`);
  if (cached) return cached; // ⚡ Instant response from memory (1ms)

  const product = await this.productService.findById(id); // 50ms
  this.cache.set(`product:${id}`, product, 300); // Cache for 5 minutes
  return product;
}
// 1000 requests = 1 database query + 999 memory reads = Happy database! ✅
```

**Benefits:**
- ⚡ **10-100x Faster** - Memory is much faster than databases
- 📉 **Reduced Load** - Fewer database queries = lower costs
- 📈 **Better Scalability** - Handle 10x more traffic with same infrastructure
- 💰 **Cost Savings** - Smaller databases, fewer servers needed

**When to Use Caching:**
- ✅ Data that doesn't change often (products, categories, settings)
- ✅ Expensive computations (aggregations, reports)
- ✅ External API responses (rate-limited APIs)
- ❌ Real-time data (live prices, user sessions)
- ❌ User-specific data (unless cached per user)

## In-Memory Caching

### Simple Map-Based Cache

```typescript
// cache/simple-cache.service.ts
import { Injectable } from 'han-prev-core';

@Injectable()
export class SimpleCacheService {
  private cache = new Map<string, any>();

  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
```

### Cache with TTL (Time To Live)

```typescript
// cache/ttl-cache.service.ts
import { Injectable } from 'han-prev-core';

interface CacheEntry {
  value: any;
  expiresAt: number;
}

@Injectable()
export class TtlCacheService {
  private cache = new Map<string, CacheEntry>();

  set(key: string, value: any, ttlSeconds: number = 300): void {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
  }

  get(key: string): any {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}
```

## Redis Caching

### Setup

Install Redis client:

```bash
npm install redis
```

### Redis Service

```typescript
// cache/redis.service.ts
import { Injectable } from 'han-prev-core';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private client: RedisClientType;

  async connect(url: string = 'redis://localhost:6379') {
    this.client = createClient({ url });

    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    await this.client.connect();
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const stringValue = JSON.stringify(value);

    if (ttlSeconds) {
      await this.client.setEx(key, ttlSeconds, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  async get(key: string): Promise<any> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    await this.client.flushAll();
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
```

### Using Redis Service

```typescript
// user/user.service.ts
import { Injectable } from 'han-prev-core';
import { RedisService } from '../cache/redis.service';
import { User } from '../models/user.model';

@Injectable()
export class UserService {
  constructor(private redis: RedisService) {}

  async findById(id: string) {
    // Try cache first
    const cacheKey = `user:${id}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      console.log('Cache hit');
      return cached;
    }

    // Cache miss - fetch from database
    console.log('Cache miss');
    const user = await User.findById(id);

    if (user) {
      // Store in cache for 5 minutes
      await this.redis.set(cacheKey, user, 300);
    }

    return user;
  }

  async update(id: string, data: any) {
    const user = await User.findByIdAndUpdate(id, data, { new: true });

    // Invalidate cache
    await this.redis.delete(`user:${id}`);

    return user;
  }
}
```

## Cache Decorator

### Creating a Cache Decorator

```typescript
// decorators/cache.decorator.ts
import { RedisService } from '../cache/redis.service';

export function Cacheable(ttl: number = 300) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const redis: RedisService = this.redis;

      if (!redis) {
        return originalMethod.apply(this, args);
      }

      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);

      await redis.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}
```

### Using Cache Decorator

```typescript
import { Injectable } from 'han-prev-core';
import { Cacheable } from '../decorators/cache.decorator';

@Injectable()
export class ProductService {
  constructor(private redis: RedisService) {}

  @Cacheable(600) // Cache for 10 minutes
  async findAll() {
    console.log('Fetching from database');
    return await Product.find();
  }

  @Cacheable(300) // Cache for 5 minutes
  async findById(id: string) {
    return await Product.findById(id);
  }
}
```

## Cache Strategies

### Cache-Aside (Lazy Loading)

```typescript
async function getCacheAside(key: string) {
  // 1. Check cache
  let data = await redis.get(key);

  // 2. If not in cache, fetch from DB
  if (!data) {
    data = await database.get(key);

    // 3. Store in cache
    await redis.set(key, data, 300);
  }

  return data;
}
```

### Write-Through Cache

```typescript
async function writeThrough(key: string, value: any) {
  // 1. Write to cache
  await redis.set(key, value);

  // 2. Write to database
  await database.set(key, value);
}
```

### Write-Behind Cache

```typescript
class WriteBehindCache {
  private writeQueue: Array<{ key: string; value: any }> = [];

  async set(key: string, value: any) {
    // 1. Write to cache immediately
    await redis.set(key, value);

    // 2. Queue database write
    this.writeQueue.push({ key, value });

    // 3. Process queue asynchronously
    this.processQueue();
  }

  private async processQueue() {
    while (this.writeQueue.length > 0) {
      const { key, value } = this.writeQueue.shift()!;
      await database.set(key, value);
    }
  }
}
```

## Cache Invalidation

### Time-Based Invalidation

```typescript
// Automatically expires after TTL
await redis.set('key', 'value', 300); // 5 minutes
```

### Event-Based Invalidation

```typescript
@Injectable()
export class UserService {
  constructor(private redis: RedisService) {}

  async update(id: string, data: any) {
    const user = await User.findByIdAndUpdate(id, data);

    // Invalidate specific user cache
    await this.redis.delete(`user:${id}`);

    // Invalidate list cache
    await this.redis.delete('users:all');

    return user;
  }
}
```

### Pattern-Based Invalidation

```typescript
async function invalidatePattern(pattern: string) {
  const keys = await redis.keys(pattern);

  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// Usage
await invalidatePattern('user:*');  // All user caches
await invalidatePattern('product:category:*');  // All product category caches
```

## Multi-Level Caching

```typescript
@Injectable()
export class MultiLevelCacheService {
  private memoryCache = new Map<string, any>();

  constructor(private redis: RedisService) {}

  async get(key: string): Promise<any> {
    // Level 1: Memory cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // Level 2: Redis cache
    const redisValue = await this.redis.get(key);
    if (redisValue) {
      this.memoryCache.set(key, redisValue);
      return redisValue;
    }

    // Level 3: Database
    const dbValue = await this.fetchFromDatabase(key);
    if (dbValue) {
      this.memoryCache.set(key, dbValue);
      await this.redis.set(key, dbValue, 300);
    }

    return dbValue;
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    this.memoryCache.set(key, value);
    await this.redis.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.redis.delete(key);
  }

  private async fetchFromDatabase(key: string): Promise<any> {
    // Database fetch logic
    return null;
  }
}
```

## Cache Warming

```typescript
@Injectable()
export class CacheWarmingService {
  constructor(
    private redis: RedisService,
    private productService: ProductService
  ) {}

  async warmCache() {
    console.log('Warming cache...');

    // Cache popular products
    const popular = await this.productService.findPopular();
    for (const product of popular) {
      await this.redis.set(`product:${product.id}`, product, 3600);
    }

    // Cache all categories
    const categories = await this.productService.getCategories();
    await this.redis.set('categories:all', categories, 7200);

    console.log('Cache warmed successfully');
  }
}
```

## Response Caching Middleware

```typescript
// middleware/cache.middleware.ts
import { Injectable } from 'han-prev-core';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class CacheMiddleware {
  constructor(private redis: RedisService) {}

  async use(req: any, res: any, next: any) {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `response:${req.url}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Override res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = (data: any) => {
      this.redis.set(cacheKey, data, 60); // Cache for 1 minute
      return originalJson(data);
    };

    next();
  }
}
```

## Cache Statistics

```typescript
@Injectable()
export class CacheStatsService {
  private hits = 0;
  private misses = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: `${hitRate.toFixed(2)}%`,
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
  }
}
```

## Best Practices

### 1. Set Appropriate TTL

```typescript
// ✅ Good - Vary TTL based on data volatility
await redis.set('static-config', data, 86400);    // 24 hours
await redis.set('user-profile', data, 3600);      // 1 hour
await redis.set('trending-posts', data, 300);     // 5 minutes

// ❌ Bad - Same TTL for everything
await redis.set('key', data, 300);
```

### 2. Cache Key Naming

```typescript
// ✅ Good - Descriptive, hierarchical keys
const key = `user:${userId}:profile`;
const key = `product:${productId}:reviews:page:${page}`;

// ❌ Bad - Generic keys
const key = `user${userId}`;
const key = `data`;
```

### 3. Handle Cache Failures Gracefully

```typescript
// ✅ Good - Fallback to database
async function getData(id: string) {
  try {
    const cached = await redis.get(`data:${id}`);
    if (cached) return cached;
  } catch (error) {
    console.error('Cache error:', error);
  }

  // Always fetch from database if cache fails
  return await database.get(id);
}
```

### 4. Invalidate on Updates

```typescript
// ✅ Good - Invalidate cache on update
async function updateUser(id: string, data: any) {
  await User.update(id, data);
  await redis.delete(`user:${id}`);
}

// ❌ Bad - Stale cache
async function updateUser(id: string, data: any) {
  await User.update(id, data);
  // Cache still has old data
}
```

## Testing Caching

```typescript
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let redis: RedisService;

  beforeAll(async () => {
    redis = new RedisService();
    await redis.connect();
  });

  afterAll(async () => {
    await redis.disconnect();
  });

  beforeEach(async () => {
    await redis.clear();
  });

  it('should set and get value', async () => {
    await redis.set('key', 'value');
    const result = await redis.get('key');
    expect(result).toBe('value');
  });

  it('should expire after TTL', async () => {
    await redis.set('key', 'value', 1);
    await new Promise(resolve => setTimeout(resolve, 1100));
    const result = await redis.get('key');
    expect(result).toBeNull();
  });
});
```

## Quick Reference

```typescript
// Set cache
await redis.set('key', value);
await redis.set('key', value, 300); // With TTL

// Get cache
const value = await redis.get('key');

// Delete cache
await redis.delete('key');

// Check existence
const exists = await redis.exists('key');

// Get TTL
const ttl = await redis.ttl('key');

// Clear all cache
await redis.clear();

// Pattern matching
const keys = await redis.keys('user:*');
```

## Next Steps

- Learn about [Configuration](/techniques/configuration) for cache settings
- Explore [Security](/techniques/security) for securing cached data
- Check out [Database](/techniques/mongoose) for data persistence

Caching is essential for building high-performance applications! ⚡
