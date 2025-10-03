# Third-Party Library Integration Guide

## Overview

Han Framework now supports seamless integration with third-party Node.js libraries (JWT, Mongoose, TypeORM, etc.) through enhanced dependency injection features while maintaining full backward compatibility.

## New Features Added

### 1. **Factory Providers** (`useFactory`)
Create providers using factory functions for complex initialization logic.

```typescript
@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: () => {
        return mongoose.connect('mongodb://localhost/mydb');
      },
    },
  ],
})
export class DatabaseModule {}
```

### 2. **Async Factory Providers**
Support for asynchronous initialization (perfect for database connections, config loading).

```typescript
@Module({
  providers: [
    {
      provide: 'CONFIG',
      useFactory: async () => {
        const config = await fetch('https://api.example.com/config');
        return config.json();
      },
    },
  ],
})
export class ConfigModule {}
```

### 3. **Dynamic Modules** (`.forRoot()` pattern)
Libraries can expose configurable modules like NestJS.

```typescript
// Library code
export class JwtModule {
  static forRoot(options: JwtOptions): DynamicModule {
    return {
      module: JwtModule,
      providers: [
        {
          provide: 'JWT_OPTIONS',
          useValue: options,
        },
        JwtService,
      ],
      exports: [JwtService],
      global: true, // Make available globally
    };
  }
}

// Usage
@Module({
  imports: [
    JwtModule.forRoot({
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
    }),
  ],
})
export class AppModule {}
```

### 4. **Lifecycle Hooks**
Providers can implement lifecycle methods for setup and cleanup.

```typescript
import { OnModuleInit, OnModuleDestroy } from 'han-prev-core';

export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private connection: any;

  async onModuleInit() {
    // Called when module is initialized
    this.connection = await mongoose.connect('mongodb://localhost/db');
    console.log('Database connected');
  }

  async onModuleDestroy() {
    // Called during graceful shutdown
    await this.connection.close();
    console.log('Database disconnected');
  }
}
```

### 5. **Provider Scopes**
Control provider lifetime (singleton by default, or transient).

```typescript
@Module({
  providers: [
    {
      provide: 'REQUEST_ID',
      useFactory: () => Math.random().toString(),
      scope: 'transient', // New instance per injection
    },
  ],
})
export class AppModule {}
```

### 6. **Dependency Injection in Factories**
Inject other providers into factory functions.

```typescript
@Module({
  providers: [
    ConfigService,
    {
      provide: 'DATABASE',
      useFactory: (config: ConfigService) => {
        return mongoose.connect(config.get('DB_URL'));
      },
      inject: [ConfigService], // Inject dependencies
    },
  ],
})
export class DatabaseModule {}
```

## Integration Patterns

### Pattern 1: Simple Library Integration
For libraries that are just classes/services:

```typescript
import { MongoClient } from 'mongodb';

@Module({
  providers: [
    {
      provide: 'MONGO_CLIENT',
      useFactory: async () => {
        const client = new MongoClient('mongodb://localhost:27017');
        await client.connect();
        return client;
      },
    },
  ],
  exports: ['MONGO_CLIENT'],
})
export class MongoModule {}
```

### Pattern 2: Configurable Modules
For libraries that need configuration:

```typescript
// passport.module.ts
export class PassportModule {
  static forRoot(strategy: any): DynamicModule {
    return {
      module: PassportModule,
      providers: [
        {
          provide: 'PASSPORT_STRATEGY',
          useValue: strategy,
        },
        PassportService,
      ],
      exports: [PassportService],
    };
  }
}

// Usage
@Module({
  imports: [
    PassportModule.forRoot(new JwtStrategy({
      secretOrKey: 'secret',
    })),
  ],
})
export class AuthModule {}
```

### Pattern 3: Express Middleware Integration
For Express-compatible middleware:

```typescript
const app = await HanFactory.create(AppModule);

// Direct middleware usage
app.use(passport.initialize());
app.use(helmet());
app.use(compression());

await app.listen(3000);
```

## Available Lifecycle Hooks

| Hook | Description | Use Case |
|------|-------------|----------|
| `OnModuleInit` | Called after module initialization | Database connections, cache warming |
| `OnModuleDestroy` | Called during graceful shutdown | Close connections, cleanup |
| `OnApplicationBootstrap` | Called when app is ready | Post-initialization tasks |
| `OnApplicationShutdown` | Called on shutdown signal | Save state, flush logs |

## Example: TypeORM Integration

```typescript
// typeorm.module.ts
import { DataSource } from 'typeorm';
import { DynamicModule, OnModuleInit } from 'han-prev-core';

export class TypeOrmModule {
  static forRoot(options: any): DynamicModule {
    return {
      module: TypeOrmModule,
      providers: [
        {
          provide: 'DATA_SOURCE',
          useFactory: async () => {
            const dataSource = new DataSource(options);
            await dataSource.initialize();
            return dataSource;
          },
        },
      ],
      exports: ['DATA_SOURCE'],
    };
  }
}

// Usage
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'password',
      database: 'mydb',
      entities: [User, Product],
    }),
  ],
})
export class AppModule {}
```

## Backward Compatibility

All existing code continues to work without changes:

```typescript
// ✅ Still works - no changes needed
@Module({
  providers: [SimpleService],
  controllers: [AppController],
})
export class AppModule {}
```

## Key Benefits

1. **Easy Integration** - Works with any Node.js library
2. **Flexible** - Multiple patterns for different needs
3. **Type-Safe** - Full TypeScript support
4. **Developer-Friendly** - Familiar patterns from NestJS
5. **Backward Compatible** - No breaking changes
6. **Production-Ready** - Lifecycle hooks for proper cleanup

## Migration Guide

No migration needed! Existing code works as-is. Use new features when needed:

```typescript
// Before (still works)
@Module({ providers: [MyService] })

// After (optional enhancement)
@Module({
  providers: [
    {
      provide: 'MY_SERVICE',
      useFactory: async () => new MyService(),
      scope: 'singleton'
    }
  ]
})
```
