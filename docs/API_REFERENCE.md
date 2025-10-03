# 📋 Han Framework - API Reference

Complete API documentation for the Han Framework with detailed examples and type information.

---

## 🏭 HanFactory

The main factory class for creating Han Framework applications.

### `HanFactory.create(moduleClass, options?)`

Creates a new Han Framework application instance.

**Parameters:**

- `moduleClass` (class): The root module class decorated with `@Module`
- `options` (HanApplicationOptions, optional): Configuration options

**Returns:** `Promise<HanApplication>`

**Example:**

```typescript
import { HanFactory } from "han-framework";
import { AppModule } from "./app.module";

const app = await HanFactory.create(AppModule, {
  cors: true,
  helmet: true,
  globalPrefix: "/api/v1",
});
```

### `HanFactory.createMicroservice(moduleClass, options?)`

Creates a microservice application (TCP/Redis/NATS transport).

**Parameters:**

- `moduleClass` (class): The root module class
- `options` (MicroserviceOptions): Transport and connection options

**Returns:** `Promise<HanMicroservice>`

**Example:**

```typescript
const microservice = await HanFactory.createMicroservice(AppModule, {
  transport: Transport.TCP,
  options: { port: 3001 },
});
```

---

## 🎯 HanApplication

The main application interface providing all framework functionality.

### Properties

#### `app: Express`

Direct access to the underlying Express application instance.

```typescript
const app = await HanFactory.create(AppModule);
app.app.use("/custom", customMiddleware);
```

### Methods

#### `listen(port, callback?)`

Starts the HTTP server and begins listening for requests.

**Parameters:**

- `port` (number | string): Port number or named pipe
- `callback` (function, optional): Callback function executed when server starts

**Returns:** `Promise<any>`

**Examples:**

```typescript
// Basic usage
await app.listen(3000);

// With callback
await app.listen(3000, () => {
  console.log("Server is running!");
});

// Environment-based port
const port = process.env.PORT || 3000;
await app.listen(port);
```

#### `useGlobalInterceptors(...interceptors)`

Registers global interceptors that apply to all routes.

**Parameters:**

- `interceptors` (HanInterceptor[]): Array of interceptor classes or instances

**Returns:** `HanApplication` (chainable)

**Examples:**

```typescript
// Class-based interceptors (auto-instantiated)
app.useGlobalInterceptors(LoggingInterceptor, AuthInterceptor);

// Instance-based interceptors (with configuration)
app.useGlobalInterceptors(
  new PerformanceInterceptor(200),
  new RateLimitInterceptor({ limit: 100 }),
);

// Mixed usage
app.useGlobalInterceptors(LoggingInterceptor, new PerformanceInterceptor(150));
```

#### `onApplicationShutdown(callback)`

Registers a callback to execute during graceful shutdown.

**Parameters:**

- `callback` (function): Sync or async function to execute on shutdown

**Returns:** `void`

**Examples:**

```typescript
// Database cleanup
app.onApplicationShutdown(async () => {
  await database.close();
  console.log("Database connections closed");
});

// Multiple cleanup operations
app.onApplicationShutdown(async () => {
  await Promise.all([redis.quit(), mongodb.close(), queue.disconnect()]);
});

// Synchronous cleanup
app.onApplicationShutdown(() => {
  cache.clear();
  logger.flush();
});
```

#### `close()`

Manually closes the application and cleans up resources.

**Returns:** `Promise<void>`

```typescript
await app.close();
```

#### `init()`

Initializes the application without starting the HTTP server (useful for testing).

**Returns:** `Promise<void>`

```typescript
await app.init();
```

#### `enableCors()`

Manually enables CORS with default settings.

**Returns:** `HanApplication` (chainable)

```typescript
app.enableCors();
```

#### `useGlobalPrefix(prefix)`

Sets a global prefix for all routes.

**Parameters:**

- `prefix` (string): URL prefix (e.g., '/api', '/v1')

**Returns:** `HanApplication` (chainable)

```typescript
app.useGlobalPrefix("/api/v1");
```

#### `getUrl()`

Gets the server URL after the application has started listening.

**Returns:** `Promise<string>`

```typescript
await app.listen(3000);
const url = await app.getUrl(); // 'http://localhost:3000'
```

#### `getRoutes()`

Gets all registered routes in the application.

**Returns:** `RouteInfo[]`

```typescript
const routes = app.getRoutes();
console.log(routes); // Array of route information
```

---

## 🎛️ Configuration Options

### HanApplicationOptions

Main configuration interface for Han Framework applications.

```typescript
interface HanApplicationOptions {
  cors?: boolean | CorsOptions;
  helmet?: boolean | HelmetOptions;
  bodyParser?: boolean | BodyParserOptions;
  globalPrefix?: string;
  shutdownHooks?: ShutdownHooksOptions;
  environment?: EnvironmentOverride;
}
```

#### CORS Configuration

```typescript
// Simple enable/disable
const app = await HanFactory.create(AppModule, {
  cors: true, // Enables with smart defaults
});

// Advanced configuration
const app = await HanFactory.create(AppModule, {
  cors: {
    origin: ["https://yourdomain.com", "https://admin.yourdomain.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // 24 hours
  },
});
```

#### Helmet Security Configuration

```typescript
// Simple enable/disable
const app = await HanFactory.create(AppModule, {
  helmet: true, // Enables with production-ready defaults
});

// Advanced configuration
const app = await HanFactory.create(AppModule, {
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "https://trusted-cdn.com"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },
});
```

#### Shutdown Hooks Configuration

```typescript
const app = await HanFactory.create(AppModule, {
  shutdownHooks: {
    enabled: true, // Enable graceful shutdown (default: true)
    signals: ["SIGINT", "SIGTERM"], // Signals to handle
    gracefulTimeout: 15000, // 15 second timeout
  },
});
```

---

## 🎭 Decorators

### Module Decorators

#### `@Module(metadata)`

Defines a module with its dependencies, controllers, and providers.

**Parameters:**

- `metadata` (ModuleMetadata): Module configuration

```typescript
interface ModuleMetadata {
  imports?: any[]; // Modules to import
  controllers?: any[]; // Controllers to register
  providers?: any[]; // Providers for dependency injection
  exports?: any[]; // Providers to export to other modules
}
```

**Example:**

```typescript
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [UserController, AdminController],
  providers: [UserService, EmailService, ConfigService],
  exports: [UserService, ConfigService],
})
export class UserModule {}
```

### Controller Decorators

#### `@Controller(prefix?)`

Defines a controller class with an optional route prefix.

**Parameters:**

- `prefix` (string, optional): Route prefix for all methods in this controller

```typescript
@Controller("users")
export class UserController {
  // Routes will be prefixed with '/users'
}

@Controller() // No prefix
export class AppController {
  // Routes start at root level
}
```

### HTTP Method Decorators

#### `@Get(path?)`

#### `@Post(path?)`

#### `@Put(path?)`

#### `@Delete(path?)`

#### `@Patch(path?)`

Define HTTP route handlers.

**Parameters:**

- `path` (string, optional): Route path (default: empty string)

```typescript
@Controller("users")
export class UserController {
  @Get() // GET /users
  findAll() {}

  @Get(":id") // GET /users/:id
  findOne() {}

  @Post() // POST /users
  create() {}

  @Put(":id") // PUT /users/:id
  update() {}

  @Delete(":id") // DELETE /users/:id
  remove() {}
}
```

### Parameter Decorators

#### `@Param(key?)`

Extracts route parameters.

```typescript
@Get(':id')
findOne(@Param('id') id: string) {
  return { id };
}

@Get(':userId/posts/:postId')
findUserPost(
  @Param('userId') userId: string,
  @Param('postId') postId: string
) {
  return { userId, postId };
}
```

#### `@Body(key?)`

Extracts request body.

```typescript
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return this.userService.create(createUserDto);
}

@Post()
createWithEmail(@Body('email') email: string) {
  return this.userService.createWithEmail(email);
}
```

#### `@Query(key?)`

Extracts query parameters.

```typescript
@Get()
findAll(@Query('limit') limit: number, @Query('offset') offset: number) {
  return this.userService.findAll(limit, offset);
}

@Get()
search(@Query() searchParams: SearchDto) {
  return this.userService.search(searchParams);
}
```

#### `@Headers(key?)`

Extracts request headers.

```typescript
@Get()
findAll(@Headers('authorization') auth: string) {
  return this.userService.findAllForUser(auth);
}

@Get()
findWithHeaders(@Headers() headers: Record<string, string>) {
  return { headers };
}
```

### Provider Decorators

#### `@Injectable()`

Marks a class as injectable for dependency injection.

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
```

---

## 🔌 Interceptors

### HanInterceptor Interface

```typescript
interface HanInterceptor {
  beforeHandle?(context: InterceptorContext): void | Promise<void>;
  afterHandle?(
    context: InterceptorContext,
    response: InterceptorResponse,
  ): void | Promise<void>;
  onError?(context: InterceptorContext, error: any): void | Promise<void>;
}
```

### InterceptorContext

```typescript
interface InterceptorContext {
  req: Request; // Express request object
  res: Response; // Express response object
  method: string; // HTTP method (GET, POST, etc.)
  path: string; // Request path
  startTime: number; // Request start timestamp
  traceId: string; // Unique request trace ID
}
```

### InterceptorResponse

```typescript
interface InterceptorResponse {
  statusCode: number; // HTTP response status code
  data?: any; // Response data
  duration: number; // Request duration in milliseconds
}
```

### BaseInterceptor

Abstract base class for creating custom interceptors.

```typescript
import { BaseInterceptor } from "han-framework";

export class CustomInterceptor extends BaseInterceptor {
  beforeHandle(context: InterceptorContext): void {
    console.log(`Starting ${context.method} ${context.path}`);
  }

  afterHandle(
    context: InterceptorContext,
    response: InterceptorResponse,
  ): void {
    console.log(`Completed in ${response.duration}ms`);
  }

  onError(context: InterceptorContext, error: any): void {
    console.error(`Error in ${context.method} ${context.path}:`, error);
  }
}
```

### Built-in Interceptors

#### LoggingInterceptor

Provides request/response logging with trace IDs.

```typescript
app.useGlobalInterceptors(LoggingInterceptor);
```

**Output:**

```
📥 GET /users - 192.168.1.1 - [trace_1234567890_abc] - Started
📤 GET /users - 200 ✅ - 45ms - [trace_1234567890_abc]
```

#### PerformanceInterceptor

Monitors request performance and adds timing headers.

```typescript
app.useGlobalInterceptors(new PerformanceInterceptor(200)); // 200ms threshold
```

**Features:**

- Adds `X-Response-Time` header
- Adds `X-Trace-ID` header
- Warns about slow requests
- Logs performance data

---

## 🔧 Utilities and Helpers

### Environment Detection

```typescript
import { EnvironmentDetector } from "han-framework";

const envInfo = EnvironmentDetector.detect();
console.log(envInfo);
// {
//   platform: 'kubernetes',
//   containerized: true,
//   cloudProvider: 'aws',
//   nodeEnv: 'production'
// }
```

### Route Analytics

```typescript
import { RouteMapper } from "han-framework";

// Display comprehensive route analytics
RouteMapper.displayRoutes("http://localhost:3000", "development");
```

### Logger

```typescript
import { Logger } from "han-framework";

Logger.info("Application started");
Logger.warn("This is a warning");
Logger.error("An error occurred", error);
Logger.debug("Debug information");
```

---

## 🧪 Testing

### TestingModule

Create isolated testing environments for your modules.

```typescript
import { TestingModule } from "han-framework";

describe("UserController", () => {
  let app: TestingModule;
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    app = await TestingModule.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
    });

    controller = app.get(UserController);
    service = app.get(UserService);
  });

  afterEach(async () => {
    await app.close();
  });

  it("should find all users", async () => {
    const result = await controller.findAll();
    expect(result).toBeDefined();
  });
});
```

### Mocking Services

```typescript
const mockUserService = {
  findAll: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue({ id: 1, name: "John" }),
  create: jest.fn().mockResolvedValue({ id: 1, name: "John" }),
};

const app = await TestingModule.createTestingModule({
  controllers: [UserController],
  providers: [
    {
      provide: UserService,
      useValue: mockUserService,
    },
  ],
});
```

---

## 🚨 Error Handling

### Global Error Filter

```typescript
import { ExceptionFilter } from "han-framework";

export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, context: ExecutionContext): void {
    const response = context.switchToHttp().getResponse();
    const status = exception.getStatus ? exception.getStatus() : 500;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: context.switchToHttp().getRequest().url,
      message: exception.message,
    });
  }
}

// Register globally
app.useGlobalFilters(new GlobalExceptionFilter());
```

### HTTP Exceptions

```typescript
import { HttpException, HttpStatus } from 'han-framework';

@Get(':id')
async findOne(@Param('id') id: string) {
  const user = await this.userService.findOne(id);

  if (!user) {
    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  }

  return user;
}
```

---

## 📊 Type Definitions

### Core Types

```typescript
// Application types
export type HanApplication = {
  app: Express;
  listen(port: number | string, callback?: () => void): Promise<any>;
  useGlobalInterceptors(...interceptors: HanInterceptor[]): HanApplication;
  onApplicationShutdown(callback: () => Promise<void> | void): void;
  close(): Promise<void>;
  init(): Promise<void>;
};

// Configuration types
export interface HanApplicationOptions {
  cors?: boolean | CorsOptions;
  helmet?: boolean | HelmetOptions;
  bodyParser?: boolean | BodyParserOptions;
  globalPrefix?: string;
  shutdownHooks?: ShutdownHooksOptions;
}

// Module types
export interface ModuleMetadata {
  imports?: any[];
  controllers?: any[];
  providers?: any[];
  exports?: any[];
}

// Route types
export interface RouteInfo {
  method: string;
  path: string;
  handler: string;
  controller: string;
}
```

---

This API reference provides comprehensive documentation for all Han Framework features. For additional examples and guides, see the [main documentation](../README.md) and [examples](../examples/) directory.
