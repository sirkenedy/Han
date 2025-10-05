# Han Framework OpenAPI

> 🚀 Advanced OpenAPI/Swagger integration for Han Framework with automatic documentation generation, type-safe decorators, and powerful customization options.

## Features

### 🎯 Core Features

✅ **Automatic API Documentation** - Generate OpenAPI 3.0 docs automatically from your code
✅ **Type-Safe Decorators** - Full TypeScript support with IntelliSense
✅ **Schema Auto-Generation** - Automatically generate schemas from DTOs
✅ **Auto Type Inference** - Automatically detects types from `@Body()` parameters (no explicit `@ApiBody()` needed!)
✅ **Swagger UI Integration** - Beautiful, interactive API documentation
✅ **Multiple Auth Strategies** - Bearer, Basic, OAuth2, API Key support
✅ **Extensive Customization** - Fine-tune every aspect of your documentation
✅ **Response Shortcuts** - Convenient decorators for common HTTP responses
✅ **Zero Configuration** - Works out of the box with sensible defaults
✅ **Enhanced Beyond NestJS** - Additional features and better developer experience

### 🚀 Phase 1 Game-Changing Features

> **Features that don't exist in any other framework**

✨ **[Live Contract Testing](#live-contract-testing)** - Automatically validates API responses match your docs in real-time
✨ **[Example Harvester](#example-harvester)** - Auto-captures realistic examples from actual development traffic
✨ **[Performance Budgets](#performance-budgets)** - Sets response time expectations and warns on violations

## Installation

```bash
npm install han-prev-openapi
```

## Quick Start

### 1. Create DTOs with Decorators

```typescript
import { ApiProperty } from 'han-prev-openapi';

export class CreateUserDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User password', minLength: 8, writeOnly: true })
  password: string;

  @ApiProperty({ description: 'User age', minimum: 18, maximum: 100 })
  age: number;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID', example: '123' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;
}
```

### 2. Document Your Controllers

```typescript
import { Controller, Get, Post, Body, Param } from 'han-prev-core';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from 'han-prev-openapi';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UserController {
  @Get()
  @ApiOperation({ summary: 'Get all users', description: 'Returns a paginated list of users' })
  @ApiOkResponse({ description: 'Users retrieved successfully', type: UserResponseDto, isArray: true })
  findAll() {
    return [];
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiOkResponse({ description: 'User found', type: UserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'User created successfully', type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  create(@Body() createUserDto: CreateUserDto) {
    return {};
  }
}
```

### 3. Setup Swagger UI

```typescript
import { HanFactory } from 'han-prev-core';
import { DocumentBuilder, SwaggerModule } from 'han-prev-openapi';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HanFactory.create(AppModule);

  // Create OpenAPI document
  const config = new DocumentBuilder()
    .setTitle('My Amazing API')
    .setDescription('The best API in the world')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addServer('http://localhost:3000', 'Development server')
    .addServer('https://api.example.com', 'Production server')
    .addTag('Users', 'User management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config, [UserController]);

  // Setup Swagger UI
  SwaggerModule.setup('/api-docs', app, document, {
    customSiteTitle: 'My API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(3000);
  console.log('🚀 Server running on http://localhost:3000');
  console.log('📚 Swagger UI: http://localhost:3000/api-docs');
}

bootstrap();
```

## Core Decorators

### Property Decorators

```typescript
class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'iPhone 15' })
  name: string;

  @ApiProperty({ description: 'Price in USD', minimum: 0, example: 999.99 })
  price: number;

  @ApiPropertyOptional({ description: 'Product description' })
  description?: string;

  @ApiPropertyEnum(ProductCategory, { description: 'Product category' })
  category: ProductCategory;

  @ApiPropertyArray({ description: 'Product tags', items: { type: 'string' } })
  tags: string[];
}
```

### Operation Decorators

```typescript
@Get()
@ApiOperation({
  summary: 'Get all products',
  description: 'Returns a paginated list of products with filtering options',
  operationId: 'getAllProducts',
})
@ApiOkResponse({ description: 'Success', type: ProductDto, isArray: true })
@ApiBadRequestResponse({ description: 'Invalid query parameters' })
findAll() {
  return [];
}
```

### Response Decorators

```typescript
@Post()
@ApiCreatedResponse({ description: 'Resource created', type: ProductDto })
@ApiBadRequestResponse({ description: 'Validation failed' })
@ApiUnauthorizedResponse({ description: 'Authentication required' })
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
@ApiConflictResponse({ description: 'Resource already exists' })
create(@Body() dto: CreateProductDto) {
  return {};
}
```

### Parameter Decorators

```typescript
@Get(':id')
@ApiParam({ name: 'id', description: 'Product ID', type: 'string' })
@ApiQuery({ name: 'includeDeleted', description: 'Include deleted products', required: false, type: 'boolean' })
@ApiHeader({ name: 'X-API-Version', description: 'API version', required: true })
findOne(
  @Param('id') id: string,
  @Query('includeDeleted') includeDeleted: boolean,
  @Headers('X-API-Version') version: string
) {
  return {};
}
```

### Security Decorators

```typescript
// Bearer Authentication
@Get()
@ApiBearerAuth()
findAll() {
  return [];
}

// Basic Authentication
@Get()
@ApiBasicAuth()
findAll() {
  return [];
}

// OAuth2
@Get()
@ApiOAuth2(['read:users', 'write:users'])
findAll() {
  return [];
}

// API Key
@Get()
@ApiApiKey()
findAll() {
  return [];
}

// Cookie Authentication
@Get()
@ApiCookieAuth()
findAll() {
  return [];
}
```

### Tag Decorators

```typescript
@Controller('products')
@ApiTags('Products', 'Inventory')
export class ProductController {
  // All methods will have 'Products' and 'Inventory' tags
}
```

## 🚀 Phase 1 Game-Changing Features

### Live Contract Testing

**Never let your API docs lie again.** Live Contract Testing automatically validates that your API responses match your OpenAPI documentation in real-time during development.

#### Quick Example

> **⚠️ NOTE:** Telemetry is **DISABLED by default**. Enable only in development.

```typescript
import { createTelemetryMiddleware } from 'han-prev-openapi';

// Enable in your main file (development only)
const app = await HanFactory.create(AppModule);

if (process.env.NODE_ENV === 'development') {
  app.use(createTelemetryMiddleware({
    enabled: true,  // Must explicitly enable
    contractTesting: { enabled: true }
  }));
}
```

```typescript
// Add to your controllers
@Controller('users')
export class UserController {
  @Get(':id')
  @ApiContractTesting()  // ← Enable contract validation
  @ApiOkResponse({ type: UserDto })
  findOne(@Param('id') id: string) {
    return { id: '123', name: 'John' };  // Missing 'email' field!
  }
}
```

**Result:** Instant feedback in your console:

```bash
❌ Contract Violations Detected

Endpoint: GET /users/:id
Type: missing_field
Message: Missing required field: 'email'
Expected: Field 'email' should be present
Actual: Field 'email' is missing
💡 Suggestion: Add the 'email' field to the response or remove it from required fields

Location: user.controller.ts:15
```

#### Why You Need This

- ✅ Catches doc/code mismatches **instantly** (not in production)
- ✅ Validates all response fields and types
- ✅ Works with nested objects and arrays
- ✅ Zero configuration required
- ✅ Disabled in production automatically

[**→ Full Live Contract Testing Documentation**](https://docs.han-framework.dev/openapi/live-contract-testing)

---

### Example Harvester

**Stop writing fake examples. Start capturing real ones.** The Example Harvester automatically captures realistic API examples from actual development traffic.

#### Quick Example

```typescript
@Controller('users')
export class UserController {
  @Get(':id')
  @ApiHarvestExamples({ enabled: true })  // ← Enable auto-capture
  @ApiOkResponse({ type: UserDto })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
}
```

**Use your API normally:**

```bash
curl http://localhost:3000/users/usr_7k3m9p2q
```

**Result:** Han automatically captures the real request/response:

```bash
🎯 Example Harvested for GET /users/:id

Response (200 OK - 145ms):
{
  "id": "usr_7k3m9p2q",
  "email": "sarah.chen@techcorp.io",
  "name": "Sarah Chen",
  "age": 34,
  "roles": ["admin", "user"],
  "createdAt": "2024-09-15T10:32:00Z",
  "lastLogin": "2025-01-10T14:22:00Z"
}

Tags: success, object-response
Saved as: example_1234567890

Would you like to approve this example for documentation? [Y/n]
```

#### Why You Need This

- ✅ Auto-captures **real** examples (not fake data)
- ✅ Sanitizes sensitive data automatically
- ✅ Captures edge cases (null values, empty arrays)
- ✅ Zero manual effort
- ✅ Examples always stay current

[**→ Full Example Harvester Documentation**](https://docs.han-framework.dev/openapi/example-harvester)

---

### Performance Budgets

**Don't let your API get slow.** Performance Budgets set response time expectations for each endpoint and warn you when budgets are exceeded.

#### Quick Example

```typescript
@Controller('products')
export class ProductController {
  @Get()
  @ApiPerformance({
    budget: 200,      // Target: 200ms
    p95: 500,         // 95% of requests < 500ms
    warnOnExceed: true
  })
  @ApiOkResponse({ type: ProductDto, isArray: true })
  async findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  @ApiFastEndpoint()  // ← Convenience: budget=100ms, p95=200ms
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post('bulk')
  @ApiSlowEndpoint()  // ← Convenience: budget=1000ms, p95=2000ms
  async bulkCreate(@Body() products: CreateProductDto[]) {
    return this.productService.bulkCreate(products);
  }
}
```

**Result:** Instant warnings when performance degrades:

```bash
⚠️  Performance Budget Exceeded

Endpoint: GET /products
Target:   200ms
Actual:   650ms (+450ms over budget)

Top slow operations:
1. Database query: 420ms (SELECT * FROM products)
2. Price calculation: 180ms
3. Serialization: 50ms

💡 Suggestions:
- Add database index on 'category' column (-200ms)
- Cache price calculations (-120ms)
- Use pagination (-100ms)

Estimated improvement: 650ms → 230ms ✓
```

#### Why You Need This

- ✅ Catches performance regressions **immediately**
- ✅ Sets expectations per endpoint
- ✅ Tracks average, P95, P99 percentiles
- ✅ CI/CD integration prevents slow deployments
- ✅ Zero impact on response times

[**→ Full Performance Budgets Documentation**](https://docs.han-framework.dev/openapi/performance-budgets)

---

## Advanced Features

### Custom Schemas

```typescript
@Post()
@ApiBody({
  description: 'Complex product data',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'iPhone 15' },
      specs: {
        type: 'object',
        properties: {
          cpu: { type: 'string' },
          ram: { type: 'number' },
        },
      },
    },
  },
})
create(@Body() data: any) {
  return {};
}
```

### Multiple Response Types

```typescript
@Get(':id')
@ApiOkResponse({ description: 'Product found', type: ProductDto })
@ApiNotFoundResponse({ description: 'Product not found' })
@ApiUnauthorizedResponse({ description: 'Not authenticated' })
findOne(@Param('id') id: string) {
  return {};
}
```

### Content Types

```typescript
@Post('upload')
@ApiConsumes('multipart/form-data')
@ApiProduces('application/json')
uploadFile(@Body() file: any) {
  return {};
}
```

### Extra Models

```typescript
@Controller('users')
@ApiExtraModels(AdminUserDto, GuestUserDto, SuperUserDto)
export class UserController {
  // These models will be included in the OpenAPI schema
}
```

### Deprecated Endpoints

```typescript
@Get('legacy')
@ApiDeprecated()
@ApiOperation({ summary: 'Legacy endpoint - use /v2/users instead' })
legacyEndpoint() {
  return {};
}
```

### Exclude Endpoints

```typescript
@Get('internal')
@ApiExcludeEndpoint()
internalEndpoint() {
  // This endpoint won't appear in Swagger docs
  return {};
}
```

## Authentication Schemes

### Bearer Token (JWT)

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .addBearerAuth({
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Enter JWT token',
  })
  .build();
```

### API Key

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .addApiKey({
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
    description: 'API Key for authentication',
  })
  .build();
```

### OAuth2

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .addOAuth2({
    type: 'oauth2',
    flows: {
      authorizationCode: {
        authorizationUrl: 'https://example.com/oauth/authorize',
        tokenUrl: 'https://example.com/oauth/token',
        scopes: {
          'read:users': 'Read user information',
          'write:users': 'Modify user information',
        },
      },
    },
  })
  .build();
```

## Customization

### Custom CSS

```typescript
SwaggerModule.setup('/api-docs', app, document, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #FF6B6B }
  `,
  customSiteTitle: 'My Custom API Docs',
  customfavIcon: '/favicon.ico',
});
```

### Multiple Servers

```typescript
const config = new DocumentBuilder()
  .addServer('http://localhost:3000', 'Local development')
  .addServer('https://staging.api.com', 'Staging')
  .addServer('https://api.example.com', 'Production')
  .build();
```

### Tags with External Docs

```typescript
const config = new DocumentBuilder()
  .addTag('Users', 'User management operations', {
    url: 'https://docs.example.com/users',
    description: 'Learn more about user management',
  })
  .build();
```

## Migration from NestJS

### Property Decorators

| NestJS | Han OpenAPI | Notes |
|--------|-------------|-------|
| `@ApiProperty()` | `@ApiProperty()` | ✅ Same |
| `@ApiPropertyOptional()` | `@ApiPropertyOptional()` | ✅ Same |
| - | `@ApiPropertyArray()` | ⭐ New convenience decorator |
| - | `@ApiPropertyEnum()` | ⭐ New convenience decorator |

### Response Decorators

| NestJS | Han OpenAPI | Notes |
|--------|-------------|-------|
| `@ApiResponse()` | `@ApiResponse()` | ✅ Same |
| `@ApiOkResponse()` | `@ApiOkResponse()` | ✅ Same |
| `@ApiCreatedResponse()` | `@ApiCreatedResponse()` | ✅ Same |
| - | `@ApiDefaultResponses()` | ⭐ New: adds common responses at once |

### Enhanced Features

Han OpenAPI includes additional features not in NestJS:

1. **Auto Body Type Detection** - Automatically infers types from `@Body()` parameters (no `@ApiBody()` needed!)
2. **Better Type Inference** - Automatic type detection from TypeScript
3. **Simplified Array Schemas** - `@ApiPropertyArray()` decorator
4. **Enum Helper** - `@ApiPropertyEnum()` for cleaner enum definitions
5. **Default Responses** - `@ApiDefaultResponses()` for common error responses
6. **Enhanced Customization** - More Swagger UI customization options

## API Reference

Full API reference available at: [https://docs.han-framework.dev/openapi](https://docs.han-framework.dev/openapi)

## Examples

Check the `examples/` directory for complete working examples:

- **Basic API** - Simple CRUD operations
- **Authentication** - JWT, OAuth2, API Key examples
- **Advanced Schemas** - Complex nested objects, polymorphism
- **File Upload** - Multipart form data handling
- **Pagination** - Paginated responses

## License

MIT © Han Framework Team
