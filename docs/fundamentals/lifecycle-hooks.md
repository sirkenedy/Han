# Lifecycle Hooks

Lifecycle hooks give you visibility into key moments in the lifecycle of your application's modules, providers, and controllers. They allow you to execute custom logic during initialization, startup, and shutdown phases.

## What are Lifecycle Hooks?

Lifecycle hooks are special methods that Han Framework calls automatically at specific points during your application's lifecycle. They let you:

- **Initialize resources** when the application starts
- **Set up database connections** before handling requests
- **Clean up resources** when the application shuts down
- **Perform health checks** during startup
- **Close connections** gracefully during shutdown

## Available Lifecycle Hooks

Han Framework provides four lifecycle hooks:

| Hook | When It's Called | Use Case |
|------|------------------|----------|
| `onModuleInit` | After module dependencies are resolved | Initialize module resources |
| `onApplicationBootstrap` | After all modules are initialized | Application-wide setup |
| `onModuleDestroy` | Before module is destroyed | Clean up module resources |
| `onApplicationShutdown` | Before application shuts down | Graceful shutdown |

## Hook Execution Order

```
Application Start:
1. Dependencies resolved
2. onModuleInit() ──────────> Called on all providers/controllers
3. onApplicationBootstrap() ─> Called on all providers/controllers
4. Application ready ✓

Application Shutdown:
1. Shutdown signal received
2. onModuleDestroy() ───────> Called on all providers/controllers
3. onApplicationShutdown() ─> Called on all providers/controllers
4. Application stopped ✓
```

## OnModuleInit

Called **after all module dependencies are resolved** but before the application starts accepting requests.

### When to Use

- Initialize database connections
- Load configuration
- Set up caches
- Validate dependencies
- Perform pre-startup checks

### Basic Example

```typescript
import { Injectable, OnModuleInit } from 'han-prev-core';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private connection: any;

  onModuleInit() {
    console.log('DatabaseService: Initializing...');
    this.connection = this.createConnection();
    console.log('DatabaseService: Initialized ✓');
  }

  private createConnection() {
    // Create database connection
    return { connected: true };
  }
}
```

### Async OnModuleInit

For async operations, return a Promise:

```typescript
@Injectable()
export class CacheService implements OnModuleInit {
  private cache: any;

  async onModuleInit() {
    console.log('CacheService: Connecting to Redis...');
    this.cache = await this.connectToRedis();
    console.log('CacheService: Connected to Redis ✓');
  }

  private async connectToRedis() {
    // Simulate async connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { connected: true };
  }
}
```

### In Controllers

Controllers can also use lifecycle hooks:

```typescript
import { Controller, Get, OnModuleInit } from 'han-prev-core';

@Controller('users')
export class UserController implements OnModuleInit {
  private readonly cache = new Map();

  onModuleInit() {
    console.log('UserController: Warming up cache...');
    this.warmUpCache();
  }

  private warmUpCache() {
    // Pre-load frequently accessed data
    this.cache.set('admin', { id: 1, role: 'admin' });
  }

  @Get()
  getUsers() {
    return Array.from(this.cache.values());
  }
}
```

## OnApplicationBootstrap

Called **after all modules are initialized** and ready. This is the last hook before the application starts accepting requests.

### When to Use

- Final application-wide setup
- Start background jobs
- Register event listeners
- Perform health checks
- Log startup information

### Example

```typescript
import { Injectable, OnApplicationBootstrap } from 'han-prev-core';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  onApplicationBootstrap() {
    console.log('🚀 Application is ready!');
    this.startBackgroundJobs();
    this.logSystemInfo();
  }

  private startBackgroundJobs() {
    // Start scheduled tasks
    setInterval(() => {
      console.log('Running background job...');
    }, 60000); // Every minute
  }

  private logSystemInfo() {
    console.log('Node version:', process.version);
    console.log('Environment:', process.env.NODE_ENV);
  }
}
```

### Health Check Example

```typescript
@Injectable()
export class HealthCheckService implements OnApplicationBootstrap {
  constructor(
    private databaseService: DatabaseService,
    private cacheService: CacheService,
  ) {}

  async onApplicationBootstrap() {
    console.log('Performing health checks...');

    const checks = [
      this.checkDatabase(),
      this.checkCache(),
      this.checkExternalAPI(),
    ];

    const results = await Promise.all(checks);

    if (results.every(r => r.healthy)) {
      console.log('✓ All health checks passed');
    } else {
      console.error('✗ Some health checks failed');
      throw new Error('Health check failed');
    }
  }

  private async checkDatabase() {
    try {
      await this.databaseService.ping();
      return { service: 'database', healthy: true };
    } catch (error) {
      return { service: 'database', healthy: false };
    }
  }

  private async checkCache() {
    try {
      await this.cacheService.ping();
      return { service: 'cache', healthy: true };
    } catch (error) {
      return { service: 'cache', healthy: false };
    }
  }

  private async checkExternalAPI() {
    // Check external dependencies
    return { service: 'api', healthy: true };
  }
}
```

## OnModuleDestroy

Called **before a module is destroyed**. Use this to clean up resources specific to a module.

### When to Use

- Close database connections
- Clear caches
- Cancel subscriptions
- Stop timers
- Release resources

### Example

```typescript
import { Injectable, OnModuleDestroy } from 'han-prev-core';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private connection: any;
  private readonly connections: any[] = [];

  async onModuleDestroy() {
    console.log('DatabaseService: Cleaning up...');

    // Close all active connections
    for (const conn of this.connections) {
      await conn.close();
    }

    await this.connection?.close();
    console.log('DatabaseService: Cleanup complete ✓');
  }
}
```

### Stop Background Tasks

```typescript
@Injectable()
export class SchedulerService implements OnModuleDestroy {
  private intervalId: NodeJS.Timeout;

  onModuleInit() {
    // Start interval
    this.intervalId = setInterval(() => {
      console.log('Running task...');
    }, 5000);
  }

  onModuleDestroy() {
    // Stop interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('Scheduler stopped');
    }
  }
}
```

## OnApplicationShutdown

Called **before the application shuts down**. This is the last chance to perform cleanup.

### When to Use

- Final cleanup tasks
- Flush logs
- Send shutdown notifications
- Save state
- Graceful shutdown

### Example

```typescript
import { Injectable, OnApplicationShutdown } from 'han-prev-core';

@Injectable()
export class LoggerService implements OnApplicationShutdown {
  private logs: string[] = [];

  async onApplicationShutdown(signal?: string) {
    console.log(`Application shutting down (signal: ${signal || 'unknown'})`);

    // Flush logs to file
    await this.flushLogs();

    // Send shutdown notification
    await this.notifyShutdown(signal);
  }

  private async flushLogs() {
    if (this.logs.length > 0) {
      // Write logs to file
      console.log(`Flushing ${this.logs.length} logs...`);
      this.logs = [];
    }
  }

  private async notifyShutdown(signal?: string) {
    // Send notification to monitoring service
    console.log('Sent shutdown notification');
  }
}
```

### Handle Shutdown Signals

```typescript
@Injectable()
export class AppService implements OnApplicationShutdown {
  async onApplicationShutdown(signal?: string) {
    const shutdownActions: { [key: string]: () => Promise<void> } = {
      'SIGTERM': async () => {
        console.log('Graceful shutdown (SIGTERM)');
        await this.gracefulShutdown();
      },
      'SIGINT': async () => {
        console.log('User interrupted (SIGINT)');
        await this.gracefulShutdown();
      },
      'uncaughtException': async () => {
        console.log('Crash detected, emergency shutdown');
        await this.emergencyShutdown();
      },
    };

    const action = shutdownActions[signal || 'default'];
    if (action) {
      await action();
    }
  }

  private async gracefulShutdown() {
    // Allow pending requests to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Graceful shutdown complete');
  }

  private async emergencyShutdown() {
    // Immediate shutdown
    console.log('Emergency shutdown complete');
  }
}
```

## Combining Multiple Hooks

You can implement multiple hooks in the same class:

```typescript
import {
  Injectable,
  OnModuleInit,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnApplicationShutdown
} from 'han-prev-core';

@Injectable()
export class DatabaseService
  implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy, OnApplicationShutdown
{
  private connection: any;

  async onModuleInit() {
    console.log('[1] Module Init: Connecting to database...');
    this.connection = await this.connect();
  }

  async onApplicationBootstrap() {
    console.log('[2] App Bootstrap: Database ready, running migrations...');
    await this.runMigrations();
  }

  async onModuleDestroy() {
    console.log('[3] Module Destroy: Closing database connections...');
    await this.connection?.close();
  }

  async onApplicationShutdown(signal?: string) {
    console.log(`[4] App Shutdown (${signal}): Final database cleanup...`);
    // Final cleanup if needed
  }

  private async connect() {
    return { connected: true };
  }

  private async runMigrations() {
    console.log('Migrations complete');
  }
}
```

## Real-World Examples

### Example 1: MongoDB Connection with Lifecycle

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from 'han-prev-core';
import mongoose from 'mongoose';

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private connection: typeof mongoose;

  async onModuleInit() {
    try {
      console.log('Connecting to MongoDB...');
      this.connection = await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        minPoolSize: 5,
      });
      console.log('✓ MongoDB connected');
    } catch (error) {
      console.error('✗ MongoDB connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.connection) {
      console.log('Disconnecting from MongoDB...');
      await this.connection.disconnect();
      console.log('✓ MongoDB disconnected');
    }
  }

  getConnection() {
    return this.connection;
  }
}
```

### Example 2: Cache Warming

```typescript
import { Injectable, OnModuleInit, InjectModel } from 'han-prev-core';
import { Model } from 'mongoose';

@Injectable()
export class CacheWarmingService implements OnModuleInit {
  private cache = new Map<string, any>();

  constructor(
    @InjectModel('User')
    private userModel: Model<any>,
    @InjectModel('Product')
    private productModel: Model<any>,
  ) {}

  async onModuleInit() {
    console.log('Warming up cache...');
    await Promise.all([
      this.warmUpUsers(),
      this.warmUpProducts(),
    ]);
    console.log(`✓ Cache warmed (${this.cache.size} items)`);
  }

  private async warmUpUsers() {
    const users = await this.userModel.find({ active: true }).limit(100);
    users.forEach(user => {
      this.cache.set(`user:${user.id}`, user);
    });
  }

  private async warmUpProducts() {
    const products = await this.productModel.find({ featured: true });
    products.forEach(product => {
      this.cache.set(`product:${product.id}`, product);
    });
  }

  get(key: string) {
    return this.cache.get(key);
  }
}
```

### Example 3: Task Scheduler

```typescript
import { Injectable, OnApplicationBootstrap, OnModuleDestroy } from 'han-prev-core';

@Injectable()
export class TaskScheduler implements OnApplicationBootstrap, OnModuleDestroy {
  private tasks: NodeJS.Timeout[] = [];

  onApplicationBootstrap() {
    console.log('Starting scheduled tasks...');

    // Run every hour
    this.scheduleTask(() => this.cleanupOldData(), 3600000);

    // Run every day
    this.scheduleTask(() => this.sendDailyReport(), 86400000);

    // Run every 5 minutes
    this.scheduleTask(() => this.healthCheck(), 300000);
  }

  onModuleDestroy() {
    console.log('Stopping scheduled tasks...');
    this.tasks.forEach(task => clearInterval(task));
    this.tasks = [];
  }

  private scheduleTask(task: () => void, interval: number) {
    const id = setInterval(task, interval);
    this.tasks.push(id);
  }

  private async cleanupOldData() {
    console.log('Cleaning up old data...');
  }

  private async sendDailyReport() {
    console.log('Sending daily report...');
  }

  private async healthCheck() {
    console.log('Performing health check...');
  }
}
```

### Example 4: WebSocket Server

```typescript
import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from 'han-prev-core';
import { WebSocketServer } from 'ws';

@Injectable()
export class WebSocketService implements OnApplicationBootstrap, OnApplicationShutdown {
  private wss: WebSocketServer;
  private clients = new Set<any>();

  async onApplicationBootstrap() {
    console.log('Starting WebSocket server...');

    this.wss = new WebSocketServer({ port: 8080 });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`Client connected (total: ${this.clients.size})`);

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`Client disconnected (total: ${this.clients.size})`);
      });
    });

    console.log('✓ WebSocket server started on port 8080');
  }

  async onApplicationShutdown() {
    console.log('Closing WebSocket server...');

    // Notify all clients
    this.clients.forEach(client => {
      client.send(JSON.stringify({ type: 'shutdown' }));
      client.close();
    });

    // Close server
    await new Promise<void>((resolve) => {
      this.wss.close(() => {
        console.log('✓ WebSocket server closed');
        resolve();
      });
    });
  }

  broadcast(message: any) {
    this.clients.forEach(client => {
      client.send(JSON.stringify(message));
    });
  }
}
```

## Best Practices

### 1. Handle Async Operations Properly

```typescript
// ✅ Good - Return promise
async onModuleInit() {
  await this.initializeDatabase();
  await this.loadConfig();
}

// ❌ Avoid - Not awaiting async operations
onModuleInit() {
  this.initializeDatabase(); // May not complete before app starts
  this.loadConfig();
}
```

### 2. Handle Errors Gracefully

```typescript
async onModuleInit() {
  try {
    await this.connect();
  } catch (error) {
    console.error('Failed to initialize:', error);
    throw error; // Prevent app from starting with bad state
  }
}
```

### 3. Clean Up Resources

```typescript
// ✅ Good - Always clean up
async onModuleDestroy() {
  if (this.connection) {
    await this.connection.close();
  }
  if (this.interval) {
    clearInterval(this.interval);
  }
}

// ❌ Avoid - Leaving resources open
async onModuleDestroy() {
  // Nothing cleaned up - memory leak!
}
```

### 4. Log Lifecycle Events

```typescript
async onModuleInit() {
  console.log(`[${this.constructor.name}] Initializing...`);
  await this.initialize();
  console.log(`[${this.constructor.name}] Initialized ✓`);
}
```

### 5. Keep Hooks Focused

```typescript
// ✅ Good - Single responsibility
async onModuleInit() {
  await this.initializeDatabase();
}

// ❌ Avoid - Too many responsibilities
async onModuleInit() {
  await this.initializeDatabase();
  await this.startWebSocketServer();
  await this.loadAllUsers();
  await this.sendWelcomeEmails();
  // Too much!
}
```

## Testing Lifecycle Hooks

```typescript
describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(() => {
    service = new DatabaseService();
  });

  it('should initialize on module init', async () => {
    await service.onModuleInit();
    expect(service.isConnected()).toBe(true);
  });

  it('should cleanup on module destroy', async () => {
    await service.onModuleInit();
    await service.onModuleDestroy();
    expect(service.isConnected()).toBe(false);
  });

  it('should handle initialization errors', async () => {
    // Mock connection to fail
    jest.spyOn(service as any, 'connect').mockRejectedValue(new Error('Connection failed'));

    await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
  });
});
```

## Common Patterns

### Pattern 1: Database Initialization

```typescript
onModuleInit() → Connect to database
onApplicationBootstrap() → Run migrations
onModuleDestroy() → Close connections
onApplicationShutdown() → Final cleanup
```

### Pattern 2: Cache Management

```typescript
onModuleInit() → Connect to cache
onApplicationBootstrap() → Warm up cache
onModuleDestroy() → Clear cache
```

### Pattern 3: Background Jobs

```typescript
onApplicationBootstrap() → Start jobs
onModuleDestroy() → Stop jobs
```

## Quick Reference

```typescript
import {
  Injectable,
  OnModuleInit,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnApplicationShutdown
} from 'han-prev-core';

@Injectable()
export class MyService
  implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy, OnApplicationShutdown
{
  async onModuleInit() {
    // Initialize module resources
  }

  async onApplicationBootstrap() {
    // Final app setup
  }

  async onModuleDestroy() {
    // Clean up module resources
  }

  async onApplicationShutdown(signal?: string) {
    // Final cleanup
  }
}
```

## Next Steps

- Learn about [Dynamic Modules](/fundamentals/dynamic-modules) for configurable modules
- Explore [Modules](/fundamentals/modules) for module organization
- Check out [Dependency Injection](/fundamentals/dependency-injection) for DI patterns

Lifecycle hooks help you build robust, production-ready applications! 🚀
