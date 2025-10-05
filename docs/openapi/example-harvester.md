# Example Harvester

> **Stop writing fake examples. Start capturing real ones.** The Example Harvester automatically captures realistic API examples from actual development traffic and adds them to your documentation.

## The Problem

Writing API examples manually is tedious and error-prone:

```typescript
@ApiOkResponse({
  description: 'User found',
  type: UserDto,
  example: {
    id: '1',              // ← Boring
    email: 'test@test.com',  // ← Fake
    name: 'Test User',      // ← Generic
    age: 25,               // ← Random guess
    createdAt: '2024-01-01'  // ← Made up date
  }
})
```

**Problems with manual examples:**
- Time-consuming to write
- Often unrealistic or outdated
- Miss edge cases (null values, empty arrays)
- Don't reflect production data patterns
- Get stale as APIs evolve

## The Solution

The Example Harvester **automatically captures real request/response pairs** from your development traffic:

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

**Result:** Every time you test your API in development, Han captures the **actual** request/response:

```bash
🎯 Example Harvested for GET /users/:id

Request:
  GET /users/usr_7k3m9p2q?include=profile

Response (200 OK - 145ms):
{
  "id": "usr_7k3m9p2q",
  "email": "sarah.chen@techcorp.io",
  "name": "Sarah Chen",
  "age": 34,
  "roles": ["admin", "user"],
  "profile": {
    "bio": "Senior Software Engineer",
    "avatar": "https://example.com/avatars/sarah.jpg"
  },
  "createdAt": "2024-09-15T10:32:00Z",
  "lastLogin": "2025-01-10T14:22:00Z"
}

Tags: success, object-response, with-query-params
Saved as: example_1234567890_abc123

Would you like to approve this example for documentation? [Y/n]
```

## Quick Start

> **⚠️ IMPORTANT:** Telemetry features (including Example Harvester) are **DISABLED by default**. You must **explicitly enable** them in your development environment. **NEVER enable telemetry in production** due to performance and security concerns.

### 1. Enable Example Harvesting

In your main application file (development only):

```typescript
import { HanFactory } from 'han-prev-core';
import { createTelemetryMiddleware } from 'han-prev-openapi';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HanFactory.create(AppModule);

  // ⚠️ ONLY enable telemetry in development
  if (process.env.NODE_ENV === 'development') {
    app.use(createTelemetryMiddleware({
      enabled: true,  // Must explicitly enable
      exampleHarvester: {
        enabled: true,              // Enable example harvesting
        async: true,                // Don't block responses
        sampling: 1.0,              // Capture 100% of requests
        maxExamplesPerEndpoint: 10, // Store up to 10 examples per endpoint
        autoSave: false             // Require manual approval
      }
    }));
    console.log('🚀 Example Harvester enabled (development mode)');
  }

  await app.listen(3000);
}

bootstrap();
```

### 2. Add @ApiHarvestExamples to Endpoints

```typescript
import { Controller, Get, Post, Body, Param, Query } from 'han-prev-core';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiHarvestExamples,
} from 'han-prev-openapi';

@Controller('users')
@ApiTags('Users')
export class UserController {
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiHarvestExamples()  // ← Enable example harvesting
  @ApiOkResponse({ type: UserDto, isArray: true })
  findAll(@Query('page') page: number) {
    return this.userService.findAll(page);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiHarvestExamples()
  @ApiOkResponse({ type: UserDto })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiHarvestExamples({ category: 'creation' })  // ← Add custom category
  @ApiCreatedResponse({ type: UserDto })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}
```

### 3. Use Your API Normally

Just use your API during development:

```bash
# Testing your API
curl http://localhost:3000/users
curl http://localhost:3000/users/123
curl -X POST http://localhost:3000/users -d '{"email":"test@example.com"}'
```

**Han automatically captures each request/response as an example!**

### 4. Review and Approve Examples

View captured examples:

```bash
# View all captured examples
npx han-openapi examples list

# View examples for a specific endpoint
npx han-openapi examples list --endpoint "GET /users/:id"

# Approve an example
npx han-openapi examples approve example_1234567890_abc123

# Delete an example
npx han-openapi examples delete example_1234567890_abc123
```

## How It Works

```
┌─────────────────────────────────────────────────┐
│ Developer Tests API in Development               │
│   curl http://localhost:3000/users/123           │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│ Han Telemetry Middleware                         │
│  - Intercepts request/response                   │
│  - Checks if @ApiHarvestExamples is enabled      │
│  - Applies sampling rate (if configured)         │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│ Example Processor                                │
│  - Sanitizes sensitive data (passwords, tokens)  │
│  - Categorizes example (success, error, etc.)    │
│  - Adds metadata (duration, tags)                │
│  - Stores in memory/file/database                │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│ Example Storage                                  │
│  - Saves to .han/telemetry/examples.json         │
│  - Awaits manual approval                        │
│  - Can be exported to OpenAPI docs               │
└─────────────────────────────────────────────────┘
```

## Configuration Options

### Global Configuration

```typescript
app.use(createTelemetryMiddleware({
  exampleHarvester: {
    enabled: true,                    // Enable harvesting
    async: true,                      // Process asynchronously
    sampling: 0.5,                    // Capture 50% of requests
    maxExamplesPerEndpoint: 10,       // Max examples per endpoint
    autoSave: false,                  // Require manual approval
    storagePath: '.han/telemetry',    // Where to store examples
    shouldHarvest: (req, res) => {
      // Custom filter: only harvest successful responses
      return res.statusCode >= 200 && res.statusCode < 300;
    }
  }
}));
```

### Per-Endpoint Configuration

```typescript
@Get()
@ApiHarvestExamples({
  enabled: true,
  sampling: 1.0,              // Capture 100% for this endpoint
  category: 'pagination',     // Custom category
  priority: 10,               // Higher priority for featuring
  autoSave: true              // Auto-approve examples
})
@ApiOkResponse({ type: UserDto, isArray: true })
findAll() {
  return this.userService.findAll();
}
```

## Real-World Examples

### Example 1: Capturing Pagination

```typescript
@Controller('products')
@ApiTags('Products')
export class ProductController {
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiHarvestExamples({ category: 'pagination' })
  @ApiOkResponse({ type: ProductDto, isArray: true })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = 'createdAt:desc'
  ) {
    return this.productService.findAll({ page, limit, sort });
  }
}
```

**Test it:**
```bash
curl "http://localhost:3000/products?page=1&limit=5&sort=price:asc"
```

**Harvested Example:**
```json
{
  "id": "example_1234567890",
  "method": "GET",
  "path": "/products",
  "request": {
    "query": {
      "page": 1,
      "limit": 5,
      "sort": "price:asc"
    }
  },
  "response": {
    "status": 200,
    "body": [
      {
        "id": "prod_123",
        "name": "Laptop Pro 15",
        "price": 1299.99,
        "category": "Electronics",
        "inStock": true
      },
      {
        "id": "prod_124",
        "name": "Wireless Mouse",
        "price": 29.99,
        "category": "Accessories",
        "inStock": true
      }
      // ... 3 more products
    ],
    "duration": 87
  },
  "tags": ["success", "array-response", "with-query-params", "pagination"],
  "approved": false
}
```

### Example 2: Capturing Edge Cases

```typescript
@Get()
@ApiHarvestExamples()
@ApiOkResponse({ type: UserDto, isArray: true })
async findAll(@Query('filter') filter?: string) {
  const users = await this.userService.findAll(filter);
  return users;
}
```

**Test with different scenarios:**

```bash
# Normal case
curl http://localhost:3000/users
# Harvested: Array with users

# Empty result
curl http://localhost:3000/users?filter=nonexistent
# Harvested: Empty array [], tagged as "empty-result"

# User with null fields
# Harvested: User with null lastLogin, tagged as "has-null-fields"
```

**Result:** You automatically capture **3 different examples** showing various scenarios!

### Example 3: Error Responses

```typescript
@Get(':id')
@ApiHarvestExamples()
@ApiOkResponse({ type: UserDto })
@ApiNotFoundResponse({ description: 'User not found' })
async findOne(@Param('id') id: string) {
  const user = await this.userService.findOne(id);
  if (!user) {
    throw new NotFoundException('User not found');
  }
  return user;
}
```

**Test both success and error:**

```bash
# Success case
curl http://localhost:3000/users/123
# Harvested: 200 response with UserDto

# Error case
curl http://localhost:3000/users/nonexistent
# Harvested: 404 response with error message
```

**Both examples are captured** and tagged appropriately (`success` vs `client-error`).

### Example 4: Conditional Harvesting

```typescript
@Post()
@ApiHarvestExamples({
  shouldHarvest: (req, res) => {
    // Only harvest successful creations, not validation errors
    return res.statusCode === 201;
  }
})
@ApiCreatedResponse({ type: UserDto })
async create(@Body() createUserDto: CreateUserDto) {
  return this.userService.create(createUserDto);
}
```

## Automatic Categorization

The Example Harvester automatically tags examples based on characteristics:

| Tag | Meaning | Example |
|-----|---------|---------|
| `success` | 2xx status code | 200 OK response |
| `client-error` | 4xx status code | 404 Not Found |
| `server-error` | 5xx status code | 500 Internal Server Error |
| `array-response` | Response is an array | `[{...}, {...}]` |
| `empty-result` | Empty array | `[]` |
| `large-result` | Array with >10 items | `[... 50 items]` |
| `null-response` | Response is null | `null` |
| `object-response` | Response is an object | `{...}` |
| `has-null-fields` | Object has null fields | `{ age: null }` |
| `with-query-params` | Request has query params | `?page=1&limit=10` |
| `fast` | Response < 100ms | 87ms response |
| `slow` | Response > 1000ms | 1250ms response |

## Sensitive Data Protection

The Harvester **automatically sanitizes** sensitive information:

```typescript
// Original response
{
  "id": "123",
  "email": "user@example.com",
  "password": "secret123",      // ← Sensitive
  "apiKey": "sk_live_abc123",   // ← Sensitive
  "creditCard": "4111111111111111"  // ← Sensitive
}

// Harvested example (sanitized)
{
  "id": "123",
  "email": "user@example.com",
  "password": "***REDACTED***",     // ← Sanitized
  "apiKey": "***REDACTED***",       // ← Sanitized
  "creditCard": "***REDACTED***"    // ← Sanitized
}
```

**Auto-sanitized fields:**
- `password`, `token`, `secret`, `apiKey`, `api_key`
- `creditCard`, `ssn`, `authorization`, `cookie`

### Custom Sanitization

```typescript
function customSanitizer(data: any): any {
  const sanitized = { ...data };

  // Remove internal fields
  delete sanitized._id;
  delete sanitized.__v;

  // Mask email partially
  if (sanitized.email) {
    sanitized.email = sanitized.email.replace(
      /(.{2})(.*)(@.*)/,
      (_, prefix, middle, domain) => prefix + '***' + domain
    );
  }

  return sanitized;
}

app.use(createTelemetryMiddleware({
  exampleHarvester: {
    enabled: true,
    sanitizer: customSanitizer
  }
}));
```

## Sampling

For high-traffic endpoints, use sampling to avoid capturing too many examples:

```typescript
@Get()
@ApiHarvestExamples({
  sampling: 0.1  // Only capture 10% of requests
})
@ApiOkResponse({ type: UserDto, isArray: true })
findAll() {
  return this.userService.findAll();
}
```

**Why sample?**
- Reduces storage usage
- Avoids duplicate examples
- Still captures edge cases over time

## Example Management CLI

Han provides a CLI to manage harvested examples:

### List Examples

```bash
# List all examples
npx han-openapi examples list

# Filter by endpoint
npx han-openapi examples list --endpoint "GET /users"

# Filter by tag
npx han-openapi examples list --tag success

# Filter by date
npx han-openapi examples list --since "2025-01-01"
```

### Approve Examples

```bash
# Approve a specific example
npx han-openapi examples approve example_1234567890

# Approve all examples for an endpoint
npx han-openapi examples approve-all --endpoint "GET /users"

# Approve by tag
npx han-openapi examples approve-all --tag empty-result
```

### Delete Examples

```bash
# Delete a specific example
npx han-openapi examples delete example_1234567890

# Delete old examples
npx han-openapi examples cleanup --older-than 30d

# Delete all unapproved examples
npx han-openapi examples delete --unapproved
```

### Export Examples

```bash
# Export approved examples to OpenAPI spec
npx han-openapi examples export --output openapi.json

# Export to Postman collection
npx han-openapi examples export --format postman --output collection.json
```

## Integrating Examples into Documentation

Once approved, examples are automatically added to your Swagger UI:

```typescript
@Get(':id')
@ApiHarvestExamples()
@ApiOkResponse({ type: UserDto })
findOne(@Param('id') id: string) {
  return this.userService.findOne(id);
}
```

**Swagger UI will show:**

```
Examples:

┌─────────────────────────────────────────────────────┐
│ Successful User Retrieval                            │
│ GET /users/usr_7k3m9p2q                              │
│                                                      │
│ Response (200 OK):                                   │
│ {                                                    │
│   "id": "usr_7k3m9p2q",                              │
│   "email": "sarah.chen@techcorp.io",                 │
│   "name": "Sarah Chen",                              │
│   "age": 34,                                         │
│   ...                                                │
│ }                                                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ User Not Found                                       │
│ GET /users/nonexistent                               │
│                                                      │
│ Response (404 Not Found):                            │
│ {                                                    │
│   "statusCode": 404,                                 │
│   "message": "User not found"                        │
│ }                                                    │
└─────────────────────────────────────────────────────┘
```

## Best Practices

### 1. Use Sampling for High-Traffic Endpoints

```typescript
// ✅ Good - Sample high-traffic endpoints
@Get()
@ApiHarvestExamples({ sampling: 0.1 })  // 10%
@ApiOkResponse({ type: UserDto, isArray: true })
findAll() { ... }

// ❌ Bad - Capture every request (too many examples)
@Get()
@ApiHarvestExamples({ sampling: 1.0 })  // 100%
@ApiOkResponse({ type: UserDto, isArray: true })
findAll() { ... }  // Called 1000x/day = 1000 examples!
```

### 2. Approve Examples Manually

```typescript
// ✅ Good - Review before approving
@Get()
@ApiHarvestExamples({ autoSave: false })
findAll() { ... }

// ❌ Bad - Auto-approve everything
@Get()
@ApiHarvestExamples({ autoSave: true })
findAll() { ... }  // Might capture bad data!
```

### 3. Test Edge Cases Deliberately

```typescript
// ✅ Good - Explicitly test edge cases
@Get()
@ApiHarvestExamples()
findAll(@Query('filter') filter: string) { ... }

// In your tests:
// - Test with no results → captures empty-result example
// - Test with null fields → captures has-null-fields example
// - Test with errors → captures error examples
```

### 4. Use Categories for Organization

```typescript
// ✅ Good - Categorize examples
@Post()
@ApiHarvestExamples({ category: 'user-creation' })
create() { ... }

@Post('bulk')
@ApiHarvestExamples({ category: 'bulk-operations' })
bulkCreate() { ... }
```

### 5. Clean Up Old Examples

```bash
# Run periodically to remove outdated examples
npx han-openapi examples cleanup --older-than 30d
```

## Performance Impact

Example Harvesting has **minimal performance impact**:

- **Development:** ~5-10ms added per request (asynchronous, after response sent)
- **Production:** 0ms (disabled by default)
- Storage: ~5-10KB per example
- Async processing means **zero impact on response time**

## Production Safety

> **⚠️ CRITICAL:** Telemetry features are **DISABLED by default** and **MUST NOT** be enabled in production.

### Why Example Harvesting Should Never Run in Production

1. **Security Risk** - Captures real user data including potentially sensitive information
2. **Privacy Concerns** - User requests/responses should not be logged without consent
3. **Performance Impact** - Additional processing and storage overhead
4. **Storage Costs** - Accumulates data over time

### Default Behavior (Safe)

```typescript
// Telemetry is DISABLED by default
app.use(createTelemetryMiddleware());
// Nothing happens - safe for production
```

### Recommended: Environment-Based Enabling

```typescript
// ✅ CORRECT: Only enable in development
if (process.env.NODE_ENV === 'development') {
  app.use(createTelemetryMiddleware({
    enabled: true,
    exampleHarvester: { enabled: true }
  }));
}

// ❌ WRONG: Always enabled (dangerous!)
app.use(createTelemetryMiddleware({
  enabled: true,  // Will run in production!
  exampleHarvester: { enabled: true }
}));
```

## Comparison with Manual Examples

| Manual Examples | Harvested Examples |
|----------------|-------------------|
| ❌ Time-consuming to write | ✅ Automatic capture |
| ❌ Often fake/unrealistic | ✅ Real production-like data |
| ❌ Get outdated | ✅ Always current |
| ❌ Miss edge cases | ✅ Captures all scenarios |
| ❌ 1-2 examples per endpoint | ✅ Multiple scenarios |
| ❌ Developer writes manually | ✅ Zero effort |

## Summary

The Example Harvester makes API documentation **effortless and accurate**:

✅ Auto-captures real examples from development
✅ Sanitizes sensitive data automatically
✅ Categorizes examples by type
✅ Supports sampling for high-traffic endpoints
✅ CLI for managing examples
✅ Zero performance impact (async)
✅ Disabled in production

**Result:** Your API documentation has **realistic, accurate examples** with **zero manual effort**.

## Next Steps

- [Live Contract Testing](/openapi/live-contract-testing) - Validate docs match code
- [Performance Budgets](/openapi/performance-budgets) - Track response times
- [Complete API Reference](/openapi/api-reference)
