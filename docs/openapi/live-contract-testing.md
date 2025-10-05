# Live Contract Testing

> **Never let your API docs lie again.** Live Contract Testing automatically validates that your API responses match your OpenAPI documentation in real-time during development.

## The Problem

You've experienced this before:

```typescript
// Your documentation says this
@ApiOkResponse({ type: UserDto })
class UserDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;  // ← Documentation says email is required
  @ApiProperty() name: string;
}

// But your code returns this
@Get(':id')
findOne(@Param('id') id: string) {
  return { id: '123', name: 'John' };  // ❌ Missing email field!
}
```

**The result?** Your consumers integrate based on your docs, then their apps break in production because the actual response doesn't match.

## The Solution

Han's Live Contract Testing **automatically validates every response** against your declared schemas during development:

```typescript
@Controller('users')
export class UserController {
  @Get(':id')
  @ApiContractTesting({ enabled: true })  // ← Enable contract testing
  @ApiOkResponse({ type: UserDto })
  findOne(@Param('id') id: string) {
    return { id: '123', name: 'John' };
  }
}
```

**Result:** You get instant feedback in your console:

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

## Quick Start

> **⚠️ IMPORTANT:** Telemetry features (including Live Contract Testing) are **DISABLED by default**. You must **explicitly enable** them in your development environment. **NEVER enable telemetry in production** due to performance and security concerns.

### 1. Enable the Telemetry Middleware

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
      contractTesting: {
        enabled: true,
        strict: false,        // Don't throw errors, just warn
        continueOnViolation: true
      }
    }));
    console.log('🚀 Live Contract Testing enabled (development mode)');
  }

  await app.listen(3000);
}

bootstrap();
```

### 2. Add Contract Testing to Your Endpoints

```typescript
import { Controller, Get, Post, Body, Param } from 'han-prev-core';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiContractTesting,
} from 'han-prev-openapi';

@Controller('users')
@ApiTags('Users')
export class UserController {
  @Get()
  @ApiContractTesting()  // ← Automatically validates response
  @ApiOkResponse({ description: 'Success', type: UserDto, isArray: true })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiContractTesting()
  @ApiOkResponse({ description: 'User found', type: UserDto })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  @ApiContractTesting()
  @ApiCreatedResponse({ description: 'User created', type: UserDto })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}
```

### 3. Define Your DTOs with @ApiProperty

```typescript
import { ApiProperty } from 'han-prev-openapi';

export class UserDto {
  @ApiProperty({ description: 'User ID', example: 'usr_123' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'john@example.com' })
  email: string;

  @ApiProperty({ description: 'User name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'User age', minimum: 18, example: 25 })
  age: number;

  @ApiProperty({ description: 'Created date', example: '2024-01-01T00:00:00Z' })
  createdAt: Date;
}
```

### 4. Test It!

Start your server and make a request:

```bash
curl http://localhost:3000/users/123
```

If your response doesn't match the schema, you'll see violations in your terminal **immediately**.

## How It Works

1. **You add decorators** to define your API contract (`@ApiOkResponse`, `@ApiProperty`)
2. **Han intercepts responses** during development
3. **Validates in real-time** against your declared schemas
4. **Reports violations** with helpful suggestions

```
┌─────────────────────────────────────────────────┐
│ Your Code                                        │
│  - Endpoint decorated with @ApiContractTesting  │
│  - Response schema defined with @ApiOkResponse  │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│ Han Telemetry Middleware                         │
│  - Intercepts response                           │
│  - Extracts metadata from decorators             │
│  - Validates response against schema             │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│ Validation Result                                │
│  ✓ Pass: Response matches schema                 │
│  ❌ Fail: Violations logged to console           │
└─────────────────────────────────────────────────┘
```

## Configuration Options

### Global Configuration

Configure contract testing globally when setting up middleware:

```typescript
app.use(createTelemetryMiddleware({
  enabled: true,
  contractTesting: {
    enabled: true,              // Enable contract testing
    strict: false,              // Don't throw errors (just log warnings)
    continueOnViolation: true,  // Keep processing request even if violations found
    onViolation: (violation) => {
      // Custom handler for violations
      console.log(`Violation in ${violation.path}:`, violation.message);
      // Could send to monitoring service, etc.
    }
  }
}));
```

### Per-Endpoint Configuration

Override global settings for specific endpoints:

```typescript
@Get()
@ApiContractTesting({
  enabled: true,
  strict: true,  // ← Throw errors for THIS endpoint only
  override: true
})
@ApiOkResponse({ type: UserDto, isArray: true })
findAll() {
  return this.userService.findAll();
}
```

## Validation Types

Live Contract Testing checks for several types of violations:

### 1. Missing Required Fields

```typescript
export class UserDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;  // Required by default
}

// Response
{ id: '123' }  // ❌ Missing email

// Violation
❌ Missing required field: 'email'
Expected: Field 'email' should be present
Actual: Field 'email' is missing
💡 Suggestion: Add the 'email' field to the response or mark it as optional
```

### 2. Type Mismatches

```typescript
export class UserDto {
  @ApiProperty({ type: 'number' })
  age: number;
}

// Response
{ age: '25' }  // ❌ String instead of number

// Violation
❌ Field 'age' has wrong type
Expected: 'number'
Actual: 'string'
💡 Suggestion: Convert 'age' to number or update the schema
```

### 3. Nullable Field Issues

```typescript
export class UserDto {
  @ApiProperty({ nullable: false })
  email: string;
}

// Response
{ email: null }  // ❌ null but not marked as nullable

// Violation
❌ Field 'email' is null but not marked as nullable
Expected: 'string'
Actual: 'null'
💡 Suggestion: Either return a non-null value or mark the field as nullable
```

### 4. Unexpected Fields

```typescript
export class UserDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
}

// Response (with additionalProperties: false)
{
  id: '123',
  email: 'test@example.com',
  password: 'secret'  // ❌ Not in schema
}

// Violation
❌ Unexpected field 'password' in response
Expected: Only defined properties: id, email
Actual: Found unexpected field: 'password'
💡 Suggestion: Remove the 'password' field or add it to the schema
```

### 5. Undocumented Status Codes

```typescript
@Get(':id')
@ApiOkResponse({ status: 200, type: UserDto })
@ApiNotFoundResponse({ status: 404 })
findOne(@Param('id') id: string) {
  if (!user) {
    res.status(500).json({ error: 'Database error' });  // ❌ 500 not documented
  }
}

// Violation
❌ Response status 500 is not documented
Expected: One of: 200, 404
Actual: 500
💡 Suggestion: Add @ApiInternalServerErrorResponse({ status: 500 }) to document this status code
```

## Real-World Examples

### Example 1: User CRUD API

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param } from 'han-prev-core';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiContractTesting,
} from 'han-prev-openapi';

@Controller('users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiContractTesting()  // ← Enable validation
  @ApiOkResponse({
    description: 'List of users',
    type: UserDto,
    isArray: true
  })
  async findAll(): Promise<UserDto[]> {
    const users = await this.userService.findAll();
    // Contract testing ensures this matches UserDto[]
    return users;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiContractTesting()
  @ApiOkResponse({ description: 'User found', type: UserDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<UserDto> {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Contract testing ensures this matches UserDto
    return user;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiContractTesting()
  @ApiCreatedResponse({ description: 'User created', type: UserDto })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
    const user = await this.userService.create(createUserDto);
    // Contract testing ensures this matches UserDto
    return user;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiContractTesting()
  @ApiOkResponse({ description: 'User updated', type: UserDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserDto> {
    const user = await this.userService.update(id, updateUserDto);
    return user;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiContractTesting()
  @ApiOkResponse({ description: 'User deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.userService.remove(id);
  }
}
```

### Example 2: Complex Nested Objects

```typescript
export class AddressDto {
  @ApiProperty() street: string;
  @ApiProperty() city: string;
  @ApiProperty() country: string;
  @ApiProperty({ nullable: true }) apartment?: string;
}

export class UserProfileDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty({ type: AddressDto })  // ← Nested object
  address: AddressDto;
  @ApiProperty({ type: 'string', isArray: true })  // ← Array of strings
  roles: string[];
}

@Get('profile/:id')
@ApiContractTesting()  // ← Validates nested objects too!
@ApiOkResponse({ type: UserProfileDto })
async getProfile(@Param('id') id: string): Promise<UserProfileDto> {
  return {
    id: '123',
    email: 'john@example.com',
    name: 'John Doe',
    address: {
      street: '123 Main St',
      city: 'New York',
      country: 'USA',
      apartment: null  // ✓ OK because nullable
    },
    roles: ['user', 'admin']  // ✓ Array of strings
  };
}
```

### Example 3: Conditional Responses

```typescript
@Get('orders/:id')
@ApiContractTesting()
@ApiOkResponse({
  description: 'Order found',
  type: OrderDto,
  status: 200
})
@ApiNotFoundResponse({
  description: 'Order not found',
  status: 404,
  schema: {
    type: 'object',
    properties: {
      statusCode: { type: 'number' },
      message: { type: 'string' }
    }
  }
})
async getOrder(@Param('id') id: string, @Res() res: Response) {
  const order = await this.orderService.findOne(id);

  if (!order) {
    // Contract testing validates this against 404 schema
    return res.status(404).json({
      statusCode: 404,
      message: 'Order not found'
    });
  }

  // Contract testing validates this against OrderDto
  return res.status(200).json(order);
}
```

## Strict Mode

In strict mode, contract violations throw errors instead of just logging warnings:

```typescript
@Get()
@ApiContractTesting({
  strict: true,              // ← Throw errors on violations
  continueOnViolation: false  // ← Stop processing
})
@ApiOkResponse({ type: UserDto })
findAll() {
  return { id: '123' };  // Missing required fields
}
```

**Result:** Request fails with error:

```bash
Error: Contract violations detected: 2 violations
  at validateContract (telemetry.middleware.ts:123)
  ...
```

**Use case:** Enable strict mode in CI/CD to prevent deploying code with contract violations:

```typescript
app.use(createTelemetryMiddleware({
  contractTesting: {
    enabled: true,
    strict: process.env.CI === 'true',  // Strict in CI, lenient in dev
  }
}));
```

## Custom Violation Handlers

Handle violations programmatically:

```typescript
app.use(createTelemetryMiddleware({
  contractTesting: {
    enabled: true,
    onViolation: (violation) => {
      // Log to external service
      logger.error('Contract violation detected', {
        endpoint: `${violation.method} ${violation.path}`,
        type: violation.type,
        message: violation.message
      });

      // Send to Slack/Discord
      notifyTeam({
        title: 'API Contract Violation',
        message: violation.message,
        endpoint: `${violation.method} ${violation.path}`
      });

      // Store in database for reporting
      db.violations.create(violation);
    }
  }
}));
```

## Production Safety

> **⚠️ CRITICAL:** Telemetry features are **DISABLED by default** and **MUST NOT** be enabled in production.

### Why Telemetry Should Never Run in Production

1. **Performance Impact** - Validation and tracking adds overhead
2. **Security Risk** - Captures request/response data that may contain sensitive information
3. **Storage Concerns** - Data accumulation over time
4. **Not Designed for Production** - These features are development/testing tools

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
    contractTesting: { enabled: true }
  }));
}

// ❌ WRONG: Always enabled (dangerous!)
app.use(createTelemetryMiddleware({
  enabled: true,  // Will run in production!
  contractTesting: { enabled: true }
}));
```

### Production Warning

If you accidentally enable telemetry in production, you'll see this warning:

```bash
⚠️  WARNING: Telemetry features are enabled in PRODUCTION environment!
   This is NOT recommended due to performance and security concerns.
   Telemetry should only be enabled in development.
```

## Best Practices

### 1. Always Use Contract Testing During Development

```typescript
// ✅ Good - Enable for all endpoints
@Controller('users')
export class UserController {
  @Get()
  @ApiContractTesting()  // ← Always validate
  @ApiOkResponse({ type: UserDto, isArray: true })
  findAll() { ... }
}
```

### 2. Document All Response Scenarios

```typescript
// ✅ Good - All possible responses documented
@Get(':id')
@ApiContractTesting()
@ApiOkResponse({ status: 200, type: UserDto })
@ApiNotFoundResponse({ status: 404 })
@ApiUnauthorizedResponse({ status: 401 })
@ApiInternalServerErrorResponse({ status: 500 })
findOne(@Param('id') id: string) { ... }

// ❌ Bad - Missing error cases
@Get(':id')
@ApiContractTesting()
@ApiOkResponse({ status: 200, type: UserDto })
findOne(@Param('id') id: string) {
  // Can return 404, 401, 500 but not documented!
}
```

### 3. Use Nullable for Optional Fields

```typescript
// ✅ Good - Explicitly nullable
export class UserDto {
  @ApiProperty() id: string;
  @ApiProperty({ nullable: true }) middleName?: string;
}

// ❌ Bad - Optional but not nullable
export class UserDto {
  @ApiProperty() id: string;
  @ApiProperty() middleName?: string;  // Will fail if value is null
}
```

### 4. Keep Schemas in Sync with Code

```typescript
// ✅ Good - Schema matches actual return type
export class UserDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
}

@Get()
@ApiContractTesting()
@ApiOkResponse({ type: UserDto })
findAll(): UserDto[] {  // ← Return type matches DTO
  return this.userService.findAll();
}

// ❌ Bad - Schema doesn't match return type
@Get()
@ApiContractTesting()
@ApiOkResponse({ type: UserDto })
findAll(): any {  // ← Loses type safety
  return this.userService.findAll();
}
```

## Troubleshooting

### Violation: "Missing required field"

**Cause:** Your response is missing a field declared in your DTO.

**Solution:**
- Add the field to your response, OR
- Mark the field as optional: `@ApiProperty({ nullable: true })`

### Violation: "Type mismatch"

**Cause:** The field type in your response doesn't match the DTO.

**Solution:**
- Ensure your response returns the correct type
- Check database queries return proper types
- Verify type conversions

### Violation: "Unexpected field"

**Cause:** Your response includes fields not in the schema.

**Solution:**
- Add the field to your DTO, OR
- Remove the field from your response, OR
- Allow additional properties: `@ApiProperty({ additionalProperties: true })`

## Performance Impact

Live Contract Testing has **minimal performance impact**:

- **Development:** ~5-10ms added per request (after response sent)
- **Production:** 0ms (disabled by default)
- Validation happens **asynchronously** after response is sent
- Does not block or delay user requests

## Summary

Live Contract Testing ensures your API **always matches your documentation**:

✅ Catches doc/code mismatches instantly
✅ Validates all response fields and types
✅ Works with nested objects and arrays
✅ Zero configuration required
✅ Disabled in production automatically
✅ Customizable violation handling

**Result:** Your consumers can **trust** your API documentation. No more "docs say X but API returns Y" issues.

## Next Steps

- [Example Harvester](/openapi/example-harvester) - Auto-capture realistic examples
- [Performance Budgets](/openapi/performance-budgets) - Track response times
- [Complete API Reference](/openapi/api-reference)
