# Dynamic Modules

Dynamic Modules allow you to create **configurable, reusable modules** that can be customized with different options each time they're imported. This is essential for building flexible libraries and shared modules that need different configurations in different contexts.

## What are Dynamic Modules?

A Dynamic Module is a module that's created at runtime with custom configuration, rather than being statically defined. Instead of importing a fixed module, you call a static method (like `forRoot()` or `register()`) that returns a module configured with your specific options.

### Static Module (Regular)

```typescript
// ❌ Static - Same configuration everywhere
@Module({
  providers: [
    {
      provide: 'DATABASE_URL',
      useValue: 'mongodb://localhost:27017/myapp', // Hard-coded
    },
    DatabaseService,
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}

// Usage - can't customize
@Module({
  imports: [DatabaseModule], // Always uses localhost
})
export class AppModule {}
```

### Dynamic Module

```typescript
// ✅ Dynamic - Configurable per use
@Module({})
export class DatabaseModule {
  static forRoot(options: { url: string }): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DATABASE_URL',
          useValue: options.url, // Configurable!
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }
}

// Usage - customize for each environment
@Module({
  imports: [
    DatabaseModule.forRoot({
      url: process.env.DATABASE_URL, // Different per environment
    }),
  ],
})
export class AppModule {}
```

## Why Use Dynamic Modules?

### 1. Configuration Flexibility

Different configurations for different environments:

```typescript
// Development
DatabaseModule.forRoot({ url: 'mongodb://localhost:27017/dev' })

// Production
DatabaseModule.forRoot({ url: process.env.PROD_DATABASE_URL })

// Testing
DatabaseModule.forRoot({ url: 'mongodb://localhost:27017/test' })
```

### 2. Reusable Libraries

Create modules that work across different projects:

```typescript
// Your library module
export class CacheModule {
  static register(options: CacheOptions): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        {
          provide: 'CACHE_OPTIONS',
          useValue: options,
        },
        CacheService,
      ],
      exports: [CacheService],
    };
  }
}

// Project A - Redis cache
CacheModule.register({ type: 'redis', host: 'localhost' })

// Project B - Memory cache
CacheModule.register({ type: 'memory', ttl: 300 })
```

### 3. Feature Modules

Enable/disable features dynamically:

```typescript
export class EmailModule {
  static forRoot(options: { provider: 'sendgrid' | 'mailgun'; apiKey: string }): DynamicModule {
    const provider = options.provider === 'sendgrid'
      ? SendGridService
      : MailgunService;

    return {
      module: EmailModule,
      providers: [
        {
          provide: 'EMAIL_PROVIDER',
          useClass: provider,
        },
        {
          provide: 'API_KEY',
          useValue: options.apiKey,
        },
      ],
      exports: ['EMAIL_PROVIDER'],
    };
  }
}
```

## Creating a Dynamic Module

### Basic Dynamic Module

```typescript
import { Module, DynamicModule } from 'han-prev-core';
import { ConfigService } from './config.service';

interface ConfigOptions {
  apiKey: string;
  timeout?: number;
  debug?: boolean;
}

@Module({})
export class ConfigModule {
  static forRoot(options: ConfigOptions): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        ConfigService,
      ],
      exports: [ConfigService],
    };
  }
}
```

Using the dynamic module:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      apiKey: process.env.API_KEY,
      timeout: 5000,
      debug: true,
    }),
  ],
})
export class AppModule {}
```

### Dynamic Module with Factory

Use `useFactory` for complex initialization:

```typescript
@Module({})
export class DatabaseModule {
  static forRoot(options: { url: string; poolSize?: number }): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DATABASE_CONNECTION',
          useFactory: async () => {
            const connection = await mongoose.connect(options.url, {
              maxPoolSize: options.poolSize || 10,
            });
            console.log(`Connected to database: ${options.url}`);
            return connection;
          },
        },
        DatabaseService,
      ],
      exports: [DatabaseService, 'DATABASE_CONNECTION'],
    };
  }
}
```

### Dynamic Module with Dependencies

Inject other services into your factory:

```typescript
@Module({})
export class LoggerModule {
  static forRoot(options: { level: string }): DynamicModule {
    return {
      module: LoggerModule,
      providers: [
        {
          provide: 'LOGGER_OPTIONS',
          useValue: options,
        },
        {
          provide: 'LoggerService',
          useFactory: (configService: ConfigService) => {
            return new LoggerService({
              level: options.level,
              appName: configService.get('APP_NAME'),
            });
          },
          inject: ['ConfigService'], // Inject dependencies
        },
      ],
      exports: ['LoggerService'],
    };
  }
}
```

## Common Patterns

### Pattern 1: `forRoot()` - Global Configuration

Use `forRoot()` for **singleton configuration** shared across your entire app:

```typescript
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: 'DB_OPTIONS',
          useValue: options,
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
      global: true, // Makes it available globally
    };
  }
}

// Usage - Import once in AppModule
@Module({
  imports: [
    DatabaseModule.forRoot({ url: process.env.DATABASE_URL }),
  ],
})
export class AppModule {}
```

### Pattern 2: `register()` - Local Configuration

Use `register()` for **local configuration** specific to each feature:

```typescript
@Module({})
export class CacheModule {
  static register(options: CacheOptions): DynamicModule {
    return {
      module: CacheModule,
      providers: [
        {
          provide: 'CACHE_OPTIONS',
          useValue: options,
        },
        CacheService,
      ],
      exports: [CacheService],
    };
  }
}

// Usage - Import in each feature module with different options
@Module({
  imports: [
    CacheModule.register({ ttl: 300 }), // 5 min cache
  ],
})
export class UserModule {}

@Module({
  imports: [
    CacheModule.register({ ttl: 3600 }), // 1 hour cache
  ],
})
export class ProductModule {}
```

### Pattern 3: `forFeature()` - Feature-Specific Configuration

Use `forFeature()` to register feature-specific providers:

```typescript
@Module({})
export class MongooseModule {
  static forRoot(options: { url: string }): DynamicModule {
    return {
      module: MongooseModule,
      providers: [
        {
          provide: 'MONGOOSE_CONNECTION',
          useFactory: () => mongoose.connect(options.url),
        },
      ],
      exports: ['MONGOOSE_CONNECTION'],
      global: true,
    };
  }

  static forFeature(models: { name: string; schema: any }[]): DynamicModule {
    const providers = models.map(model => ({
      provide: `${model.name}Model`,
      useFactory: () => mongoose.model(model.name, model.schema),
    }));

    return {
      module: MongooseModule,
      providers,
      exports: providers.map(p => p.provide),
    };
  }
}

// Usage
@Module({
  imports: [
    MongooseModule.forRoot({ url: process.env.DATABASE_URL }), // Once in AppModule
  ],
})
export class AppModule {}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Post', schema: PostSchema },
    ]),
  ],
})
export class UserModule {}
```

## Real-World Example: Email Module

Complete example of a configurable email module:

```typescript
// email.options.ts
export interface EmailOptions {
  provider: 'sendgrid' | 'mailgun' | 'smtp';
  apiKey?: string;
  smtpConfig?: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
  from?: string;
}

// email.service.ts
import { Injectable, Inject } from 'han-prev-core';

@Injectable()
export class EmailService {
  constructor(
    @Inject('EMAIL_OPTIONS')
    private options: EmailOptions,
    @Inject('EMAIL_PROVIDER')
    private provider: any,
  ) {}

  async send(to: string, subject: string, body: string) {
    return this.provider.send({
      to,
      subject,
      body,
      from: this.options.from || 'noreply@example.com',
    });
  }
}

// email.module.ts
import { Module, DynamicModule } from 'han-prev-core';
import { EmailService } from './email.service';
import { SendGridProvider } from './providers/sendgrid.provider';
import { MailgunProvider } from './providers/mailgun.provider';
import { SmtpProvider } from './providers/smtp.provider';

@Module({})
export class EmailModule {
  static forRoot(options: EmailOptions): DynamicModule {
    let provider;

    switch (options.provider) {
      case 'sendgrid':
        provider = {
          provide: 'EMAIL_PROVIDER',
          useFactory: () => new SendGridProvider(options.apiKey),
        };
        break;
      case 'mailgun':
        provider = {
          provide: 'EMAIL_PROVIDER',
          useFactory: () => new MailgunProvider(options.apiKey),
        };
        break;
      case 'smtp':
        provider = {
          provide: 'EMAIL_PROVIDER',
          useFactory: () => new SmtpProvider(options.smtpConfig),
        };
        break;
      default:
        throw new Error(`Unknown email provider: ${options.provider}`);
    }

    return {
      module: EmailModule,
      providers: [
        {
          provide: 'EMAIL_OPTIONS',
          useValue: options,
        },
        provider,
        EmailService,
      ],
      exports: [EmailService],
    };
  }
}

// Usage in AppModule
@Module({
  imports: [
    EmailModule.forRoot({
      provider: 'sendgrid',
      apiKey: process.env.SENDGRID_API_KEY,
      from: 'noreply@myapp.com',
    }),
  ],
})
export class AppModule {}
```

## Async Dynamic Modules

For modules that need async initialization:

```typescript
@Module({})
export class ConfigModule {
  static async forRootAsync(options: {
    useFactory: () => Promise<ConfigOptions>;
    inject?: any[];
  }): Promise<DynamicModule> {
    const configOptions = await options.useFactory();

    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: configOptions,
        },
        ConfigService,
      ],
      exports: [ConfigService],
    };
  }
}

// Usage
@Module({
  imports: [
    await ConfigModule.forRootAsync({
      useFactory: async () => {
        const config = await fetchConfigFromAPI();
        return config;
      },
    }),
  ],
})
export class AppModule {}
```

## DynamicModule Interface

The `DynamicModule` interface structure:

```typescript
interface DynamicModule {
  module: Type<any>;          // The module class
  providers?: any[];          // Providers to register
  controllers?: any[];        // Controllers to register
  imports?: any[];            // Modules to import
  exports?: any[];            // Providers/modules to export
  global?: boolean;           // Make globally available
}
```

## Best Practices

### 1. Use Clear Method Names

```typescript
// ✅ Good - Clear intent
DatabaseModule.forRoot(options)    // Global singleton
CacheModule.register(options)      // Local per module
MongooseModule.forFeature(models)  // Feature-specific

// ❌ Avoid - Unclear
DatabaseModule.create(options)
CacheModule.setup(options)
```

### 2. Validate Options

```typescript
static forRoot(options: DatabaseOptions): DynamicModule {
  if (!options.url) {
    throw new Error('Database URL is required');
  }

  if (!options.url.startsWith('mongodb://')) {
    throw new Error('Invalid MongoDB URL');
  }

  return {
    module: DatabaseModule,
    // ...
  };
}
```

### 3. Provide Type Safety

```typescript
// ✅ Good - Strongly typed options
interface CacheOptions {
  ttl: number;
  max?: number;
  strategy?: 'lru' | 'lfu';
}

static register(options: CacheOptions): DynamicModule {
  // TypeScript ensures valid options
}

// ❌ Avoid - Untyped options
static register(options: any): DynamicModule {
  // No type safety
}
```

### 4. Document Your Module

```typescript
/**
 * Configure the Email module for the application
 *
 * @param options - Email configuration options
 * @param options.provider - Email service provider ('sendgrid' | 'mailgun')
 * @param options.apiKey - API key for the email provider
 * @param options.from - Default sender email address
 *
 * @example
 * ```typescript
 * EmailModule.forRoot({
 *   provider: 'sendgrid',
 *   apiKey: process.env.SENDGRID_API_KEY,
 *   from: 'noreply@myapp.com'
 * })
 * ```
 */
static forRoot(options: EmailOptions): DynamicModule {
  // ...
}
```

### 5. Export What's Needed

```typescript
// ✅ Good - Export only public API
return {
  module: EmailModule,
  providers: [
    EmailService,
    SendGridProvider,  // Private
    ConfigService,     // Private
  ],
  exports: [EmailService], // Only public service
};

// ❌ Avoid - Exposing internals
return {
  module: EmailModule,
  providers: [...],
  exports: [EmailService, SendGridProvider, ConfigService], // Too much
};
```

## Common Use Cases

### 1. Database Connection

```typescript
DatabaseModule.forRoot({
  url: process.env.DATABASE_URL,
  poolSize: 10,
  retryAttempts: 3,
})
```

### 2. Authentication

```typescript
AuthModule.forRoot({
  jwtSecret: process.env.JWT_SECRET,
  expiresIn: '1d',
  strategy: 'jwt',
})
```

### 3. File Storage

```typescript
StorageModule.forRoot({
  provider: 's3',
  bucket: process.env.S3_BUCKET,
  region: 'us-east-1',
})
```

### 4. Rate Limiting

```typescript
RateLimitModule.forRoot({
  ttl: 60,
  limit: 100,
  skipIf: (req) => req.ip === 'admin',
})
```

### 5. Logging

```typescript
LoggerModule.forRoot({
  level: process.env.LOG_LEVEL || 'info',
  format: 'json',
  transports: ['console', 'file'],
})
```

## Testing Dynamic Modules

```typescript
describe('ConfigModule', () => {
  it('should create module with options', () => {
    const dynamicModule = ConfigModule.forRoot({
      apiKey: 'test-key',
      timeout: 5000,
    });

    expect(dynamicModule.module).toBe(ConfigModule);
    expect(dynamicModule.providers).toBeDefined();
    expect(dynamicModule.exports).toContain(ConfigService);
  });

  it('should throw error for invalid options', () => {
    expect(() => {
      ConfigModule.forRoot({} as any);
    }).toThrow('apiKey is required');
  });
});
```

## Quick Reference

```typescript
// 1. Define dynamic module
@Module({})
export class MyModule {
  static forRoot(options: MyOptions): DynamicModule {
    return {
      module: MyModule,
      providers: [
        { provide: 'OPTIONS', useValue: options },
        MyService,
      ],
      exports: [MyService],
    };
  }
}

// 2. Import with configuration
@Module({
  imports: [
    MyModule.forRoot({ key: 'value' }),
  ],
})
export class AppModule {}
```

## Next Steps

- Learn about [Lifecycle Hooks](/fundamentals/lifecycle-hooks) for module initialization
- Explore [Modules](/fundamentals/modules) for module basics
- Check out [Dependency Injection](/fundamentals/dependency-injection) for advanced DI

Dynamic modules are the key to building flexible, reusable libraries in Han Framework! 🚀
