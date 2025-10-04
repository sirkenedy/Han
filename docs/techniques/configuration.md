# Configuration

Learn how to manage application configuration, environment variables, and settings in your Han Framework application.

## Environment Variables

### Automatic Loading (Recommended)

**Han Framework automatically loads your `.env` files** - no manual imports needed! 🎉

Just create a `.env` file in your project root and start coding:

```bash
# .env
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=your-secret-key-here
API_KEY=abc123xyz
```

```typescript
// index.ts
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';

const bootstrap = async () => {
  // .env is automatically loaded before app creation
  const app = await HanFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`Server running on port ${port}`);
};

bootstrap();
```

**No `dotenv` import required!** Han Framework automatically loads environment variables from the following files (in order of priority):

1. `.env.{NODE_ENV}.local` (highest priority - e.g., `.env.production.local`)
2. `.env.{NODE_ENV}` (e.g., `.env.production`, `.env.development`)
3. `.env.local`
4. `.env` (lowest priority)

::: tip Why Multiple .env Files?
- **`.env`** - Default values for all environments
- **`.env.local`** - Local overrides (git-ignored)
- **`.env.{NODE_ENV}`** - Environment-specific values (e.g., `.env.production`)
- **`.env.{NODE_ENV}.local`** - Local environment-specific overrides (git-ignored)

Variables defined in higher priority files override those in lower priority files.
:::

### Basic Setup

Simply create a `.env` file - Han Framework handles the rest automatically:

```bash
# .env
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=your-secret-key-here
API_KEY=abc123xyz
```

## Configuration Service

### Creating a Config Service

```typescript
// config/config.service.ts
import { Injectable } from 'han-prev-core';

@Injectable()
export class ConfigService {
  get(key: string): string {
    const value = process.env[key];

    if (!value) {
      throw new Error(`Configuration key "${key}" not found`);
    }

    return value;
  }

  getOptional(key: string, defaultValue?: string): string {
    return process.env[key] || defaultValue || '';
  }

  getNumber(key: string): number {
    const value = this.get(key);
    const num = parseInt(value, 10);

    if (isNaN(num)) {
      throw new Error(`Configuration key "${key}" is not a valid number`);
    }

    return num;
  }

  getBoolean(key: string): boolean {
    const value = this.get(key).toLowerCase();
    return value === 'true' || value === '1';
  }

  isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  isTest(): boolean {
    return this.get('NODE_ENV') === 'test';
  }
}
```

### Using Config Service

```typescript
// database/database.service.ts
import { Injectable } from 'han-prev-core';
import { ConfigService } from '../config/config.service';
import mongoose from 'mongoose';

@Injectable()
export class DatabaseService {
  constructor(private configService: ConfigService) {}

  async connect() {
    const uri = this.configService.get('DATABASE_URL');
    await mongoose.connect(uri);
    console.log('Connected to database');
  }
}
```

## Typed Configuration

### Creating Configuration Types

```typescript
// config/types/database.config.ts
export interface DatabaseConfig {
  url: string;
  name: string;
  options: {
    useNewUrlParser: boolean;
    useUnifiedTopology: boolean;
    retryWrites: boolean;
  };
}

// config/types/app.config.ts
export interface AppConfig {
  name: string;
  version: string;
  port: number;
  env: 'development' | 'production' | 'test';
  apiPrefix: string;
}

// config/types/auth.config.ts
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
}
```

### Configuration Factory

```typescript
// config/config.factory.ts
import { AppConfig, DatabaseConfig, AuthConfig } from './types';

export class ConfigFactory {
  static createAppConfig(): AppConfig {
    return {
      name: process.env.APP_NAME || 'Han App',
      version: process.env.APP_VERSION || '1.0.0',
      port: parseInt(process.env.PORT || '3000', 10),
      env: (process.env.NODE_ENV as any) || 'development',
      apiPrefix: process.env.API_PREFIX || '/api',
    };
  }

  static createDatabaseConfig(): DatabaseConfig {
    return {
      url: process.env.DATABASE_URL!,
      name: process.env.DATABASE_NAME || 'myapp',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        retryWrites: true,
      },
    };
  }

  static createAuthConfig(): AuthConfig {
    return {
      jwtSecret: process.env.JWT_SECRET!,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    };
  }
}
```

### Using Configuration Factory

```typescript
// config/config.module.ts
import { Module } from 'han-prev-core';
import { ConfigService } from './config.service';

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

## Environment-Specific Configuration

### Multiple Environment Files

```
.env                    # Default
.env.development        # Development
.env.production         # Production
.env.test              # Testing
```

### How It Works

Han Framework's automatic env loading happens before your application bootstraps:

```typescript
// This is handled automatically by HanFactory.create()
// You don't need to write this code!
import { EnvLoader } from 'han-prev-core';

// Auto-loads .env files based on NODE_ENV
EnvLoader.autoLoad();
```

The `EnvLoader` automatically:
- ✅ Detects your current environment (`NODE_ENV`)
- ✅ Loads the appropriate `.env` files in priority order
- ✅ Prevents duplicate loading if called multiple times
- ✅ Logs loaded files in development mode for debugging

## Validation

### Config Validation Schema

```typescript
// config/validation.ts
import Joi from 'joi';

const configSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  API_KEY: Joi.string().required(),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
});

export function validateConfig() {
  const { error, value } = configSchema.validate(process.env, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    throw new Error(
      `Configuration validation error: ${error.message}`
    );
  }

  return value;
}
```

### Using Validation

```typescript
// index.ts
import { validateConfig } from './config/validation';
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';

const bootstrap = async () => {
  // .env is automatically loaded by HanFactory.create()
  const app = await HanFactory.create(AppModule);

  // Validate configuration after app creation
  validateConfig();

  await app.listen(process.env.PORT || 3000);
};

bootstrap();
```

## Configuration Module Pattern

### Complete Configuration Module

```typescript
// config/config.ts
export class Config {
  // App
  static readonly APP_NAME = process.env.APP_NAME || 'Han App';
  static readonly APP_VERSION = process.env.APP_VERSION || '1.0.0';
  static readonly PORT = parseInt(process.env.PORT || '3000', 10);
  static readonly NODE_ENV = process.env.NODE_ENV || 'development';

  // Database
  static readonly DATABASE_URL = process.env.DATABASE_URL!;
  static readonly DATABASE_NAME = process.env.DATABASE_NAME || 'myapp';

  // Auth
  static readonly JWT_SECRET = process.env.JWT_SECRET!;
  static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
  static readonly BCRYPT_ROUNDS = parseInt(
    process.env.BCRYPT_ROUNDS || '10',
    10
  );

  // External Services
  static readonly REDIS_URL = process.env.REDIS_URL;
  static readonly SMTP_HOST = process.env.SMTP_HOST;
  static readonly SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);

  // Feature Flags
  static readonly ENABLE_LOGGING = process.env.ENABLE_LOGGING === 'true';
  static readonly ENABLE_SWAGGER = process.env.ENABLE_SWAGGER === 'true';

  // Helpers
  static isProduction(): boolean {
    return this.NODE_ENV === 'production';
  }

  static isDevelopment(): boolean {
    return this.NODE_ENV === 'development';
  }

  static isTest(): boolean {
    return this.NODE_ENV === 'test';
  }
}
```

### Usage

```typescript
import { Config } from './config/config';

console.log(`Starting ${Config.APP_NAME} v${Config.APP_VERSION}`);
console.log(`Environment: ${Config.NODE_ENV}`);
console.log(`Port: ${Config.PORT}`);

if (Config.isProduction()) {
  console.log('Running in production mode');
}
```

## Secrets Management

### Using Environment Variables for Secrets

```bash
# .env (NEVER commit to git)
JWT_SECRET=super-secret-key-change-in-production
DATABASE_PASSWORD=secure-password-here
API_KEY=your-api-key-here
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

### .gitignore

```
# Environment files
.env
.env.local
.env.*.local
.env.development
.env.production
.env.test

# Keep example file
!.env.example
```

### Example Environment File

```bash
# .env.example
NODE_ENV=development
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=your-jwt-secret-here
API_KEY=your-api-key-here
```

## Feature Flags

```typescript
// config/feature-flags.ts
export class FeatureFlags {
  static readonly FEATURES = {
    newDashboard: process.env.FEATURE_NEW_DASHBOARD === 'true',
    advancedSearch: process.env.FEATURE_ADVANCED_SEARCH === 'true',
    darkMode: process.env.FEATURE_DARK_MODE === 'true',
    aiAssistant: process.env.FEATURE_AI_ASSISTANT === 'true',
  };

  static isEnabled(feature: keyof typeof FeatureFlags.FEATURES): boolean {
    return this.FEATURES[feature] || false;
  }
}

// Usage
if (FeatureFlags.isEnabled('newDashboard')) {
  // Show new dashboard
}
```

## Configuration per Environment

### Development Configuration

```typescript
// config/environments/development.ts
export const developmentConfig = {
  database: {
    url: 'mongodb://localhost:27017/myapp-dev',
    debug: true,
  },
  logging: {
    level: 'debug',
    prettyPrint: true,
  },
  cors: {
    origin: '*',
  },
};
```

### Production Configuration

```typescript
// config/environments/production.ts
export const productionConfig = {
  database: {
    url: process.env.DATABASE_URL!,
    debug: false,
  },
  logging: {
    level: 'error',
    prettyPrint: false,
  },
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  },
};
```

### Configuration Loader

```typescript
// config/loader.ts
import { developmentConfig } from './environments/development';
import { productionConfig } from './environments/production';

export function loadConfig() {
  const env = process.env.NODE_ENV || 'development';

  const configs = {
    development: developmentConfig,
    production: productionConfig,
  };

  return configs[env as keyof typeof configs] || developmentConfig;
}
```

## Best Practices

### 1. Never Commit Secrets

```
# ✅ Good
.env in .gitignore
Use environment variables
Use secret management services

# ❌ Bad
Hardcoded secrets in code
Commit .env files
Secrets in version control
```

### 2. Provide Defaults

```typescript
// ✅ Good - Has fallback
const port = parseInt(process.env.PORT || '3000', 10);

// ❌ Bad - No fallback
const port = parseInt(process.env.PORT, 10);
```

### 3. Validate Early

```typescript
// ✅ Good - Validate at startup
validateConfig();
const app = await HanFactory.create(AppModule);

// ❌ Bad - Fail at runtime
// Config error discovered when feature is used
```

### 4. Type Safety

```typescript
// ✅ Good - Type-safe
interface Config {
  port: number;
  nodeEnv: 'development' | 'production';
}

// ❌ Bad - No types
const config = {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
};
```

## Configuration with External Services

### AWS Secrets Manager

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

async function getSecret(secretName: string) {
  const client = new SecretsManagerClient({ region: 'us-east-1' });

  try {
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretName })
    );

    return JSON.parse(response.SecretString!);
  } catch (error) {
    console.error('Error fetching secret:', error);
    throw error;
  }
}

// Usage
const dbCredentials = await getSecret('prod/database/credentials');
```

### HashiCorp Vault

```typescript
import vault from 'node-vault';

async function getVaultSecret(path: string) {
  const client = vault({
    apiVersion: 'v1',
    endpoint: process.env.VAULT_ADDR,
    token: process.env.VAULT_TOKEN,
  });

  const result = await client.read(path);
  return result.data;
}
```

## Quick Reference

```typescript
// .env files are automatically loaded by Han Framework! 🎉

// Basic usage - just access process.env
const value = process.env.MY_VAR;

// With default value
const port = process.env.PORT || 3000;

// Convert to number
const maxConnections = parseInt(process.env.MAX_CONNECTIONS || '100', 10);

// Convert to boolean
const isEnabled = process.env.FEATURE_ENABLED === 'true';

// Required value with type assertion
const apiKey = process.env.API_KEY!;
if (!apiKey) throw new Error('API_KEY is required');

// Environment-specific config
const dbUrl = process.env.NODE_ENV === 'production'
  ? process.env.PROD_DATABASE_URL
  : process.env.DEV_DATABASE_URL;

// Validate config with Joi
import Joi from 'joi';
Joi.object({ PORT: Joi.number().required() }).validate(process.env);

// No manual dotenv import needed!
// import 'dotenv/config'; ❌ NOT NEEDED
```

## Next Steps

- Learn about [Security](/techniques/security) for securing your application
- Explore [Validation](/techniques/validation) for input validation
- Check out [Caching](/techniques/caching) for performance optimization

Proper configuration makes your application flexible and secure! ⚙️
