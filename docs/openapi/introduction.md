# OpenAPI Introduction

The **Han OpenAPI package** (`han-prev-openapi`) provides a powerful, type-safe way to generate OpenAPI 3.0 documentation for your API. It's designed to be more flexible and developer-friendly than alternatives, with automatic schema generation, extensive customization options, and beautiful Swagger UI integration.

## What is OpenAPI?

OpenAPI (formerly Swagger) is a specification for describing REST APIs. It allows you to:

- **Document your API** - Automatically generate interactive documentation
- **Validate requests** - Ensure requests match your specifications
- **Generate client SDKs** - Auto-generate client libraries in multiple languages
- **Test your API** - Use Swagger UI to test endpoints interactively
- **Maintain consistency** - Keep documentation in sync with code

## Installation

Install the package using npm:

```bash
npm install han-prev-openapi
```

Or with yarn:

```bash
yarn add han-prev-openapi
```

Or with pnpm:

```bash
pnpm add han-prev-openapi
```

### Requirements

- **Node.js**: >= 16.0.0
- **TypeScript**: >= 4.8.0
- **Han Framework**: `han-prev-core@^1.0.0`

### Quick Start

Once installed, you can start using it immediately:

```typescript
import { DocumentBuilder, SwaggerModule } from 'han-prev-openapi';
import { HanFactory } from 'han-prev-core';

const app = await HanFactory.create(AppModule);

const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .build();

const document = SwaggerModule.createDocument(app, config, [UserController]);
SwaggerModule.setup('/api-docs', app, document);

await app.listen(3000);
// 📚 Documentation available at http://localhost:3000/api-docs
```

## Why Use Han OpenAPI?

### ✅ Automatic Documentation

Generate comprehensive API documentation automatically from your code:

```typescript
@Controller('users')
@ApiTags('Users')
export class UserController {
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ description: 'Success', type: UserDto, isArray: true })
  findAll() {
    return [];
  }
}
```

This automatically creates:
- API endpoint documentation
- Request/response schemas
- Example values
- Interactive testing interface

### ✅ Type Safety

Full TypeScript support with IntelliSense:

```typescript
class CreateUserDto {
  @ApiProperty({
    description: 'User email',  // ← Autocomplete for all options
    example: 'user@example.com',
    format: 'email'
  })
  email: string;

  @ApiProperty({
    minimum: 18,              // ← Type-checked values
    maximum: 100,
    type: 'number'            // ← Validated types
  })
  age: number;
}
```

### ✅ Zero Configuration

Works out of the box with sensible defaults:

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .build();

const document = SwaggerModule.createDocument(app, config, controllers);
SwaggerModule.setup('/api-docs', app, document);

// That's it! Documentation is live at /api-docs
```

### ✅ Game-Changing Features

**Exclusive to Han** - features not found in any other framework:

- **[Live Contract Testing](/openapi/live-contract-testing)** - Validates responses match docs in real-time
- **[Example Harvester](/openapi/example-harvester)** - Auto-captures realistic examples from dev traffic
- **[Performance Budgets](/openapi/performance-budgets)** - Tracks response times and warns on violations

### ✅ Enhanced Beyond NestJS

Additional core features not found in NestJS:

- **Better type inference** - Automatic detection from TypeScript types
- **Convenience decorators** - `@ApiPropertyArray()`, `@ApiPropertyEnum()`
- **Bulk operations** - `@ApiDefaultResponses()` adds common responses
- **Flexible customization** - More Swagger UI options
- **Cleaner syntax** - Less boilerplate code

## Quick Comparison

### NestJS OpenAPI

```typescript
class CreateUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty({ enum: UserRole })
  role: UserRole;
}

@Post()
@ApiBadRequestResponse({ description: 'Bad request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Server error' })
create(@Body() dto: CreateUserDto) {}
```

### Han OpenAPI

```typescript
class CreateUserDto {
  @ApiProperty({
    description: 'User email',
    format: 'email',
    example: 'user@example.com'
  })
  email: string;

  @ApiPropertyArray({ description: 'User tags' })  // ← Cleaner!
  tags: string[];

  @ApiPropertyEnum(UserRole)                       // ← Simpler!
  role: UserRole;
}

@Post()
@ApiDefaultResponses()                             // ← One decorator for common responses!
create(@Body() dto: CreateUserDto) {}
```

## Basic Setup

Now that you have the package installed, let's set up your first API documentation:

### 1. Create a DTO

```typescript
import { ApiProperty } from 'han-prev-openapi';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com'
  })
  email: string;

  @ApiProperty({
    description: 'User age',
    minimum: 18,
    maximum: 100
  })
  age: number;
}
```

### 2. Document Your Controller

```typescript
import { Controller, Post, Body } from 'han-prev-core';
import { ApiTags, ApiOperation, ApiCreatedResponse } from 'han-prev-openapi';

@Controller('users')
@ApiTags('Users')
export class UserController {
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ description: 'User created', type: UserDto })
  create(@Body() dto: CreateUserDto) {
    return { id: '1', ...dto };
  }
}
```

### 3. Setup Swagger UI

```typescript
import { HanFactory } from 'han-prev-core';
import { DocumentBuilder, SwaggerModule } from 'han-prev-openapi';

async function bootstrap() {
  const app = await HanFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config, [UserController]);
  SwaggerModule.setup('/api-docs', app, document);

  await app.listen(3000);
}

bootstrap();
```

### 4. View Your Documentation

Start your server and visit:

- **Swagger UI**: http://localhost:3000/api-docs
- **JSON Spec**: http://localhost:3000/api-docs-json
- **YAML Spec**: http://localhost:3000/api-docs-yaml

## What You'll See

The Swagger UI provides:

1. **API Overview** - Title, description, version, servers
2. **Endpoint List** - All endpoints organized by tags
3. **Request Details** - Parameters, request body, headers
4. **Response Information** - Status codes, schemas, examples
5. **Interactive Testing** - Try out endpoints directly in the browser
6. **Model Schemas** - All DTO definitions with examples
7. **Authentication** - Test authenticated endpoints

## Core Concepts

### Decorators

Han OpenAPI uses decorators to add metadata to your code:

- **Property Decorators** - Document DTO properties (`@ApiProperty`)
- **Operation Decorators** - Document endpoints (`@ApiOperation`)
- **Response Decorators** - Document responses (`@ApiOkResponse`)
- **Parameter Decorators** - Document parameters (`@ApiParam`, `@ApiQuery`)
- **Security Decorators** - Add authentication (`@ApiBearerAuth`)
- **Tag Decorators** - Organize endpoints (`@ApiTags`)

### Document Builder

The `DocumentBuilder` creates the base OpenAPI specification:

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .setDescription('The best API ever')
  .setVersion('1.0.0')
  .addServer('http://localhost:3000', 'Local')
  .addBearerAuth()
  .addTag('Users', 'User management')
  .build();
```

### Swagger Module

The `SwaggerModule` generates and serves the documentation:

```typescript
// Create document from controllers
const document = SwaggerModule.createDocument(app, config, controllers);

// Setup Swagger UI
SwaggerModule.setup('/api-docs', app, document, {
  customSiteTitle: 'My API Docs',
  customCss: '.topbar { display: none }',
});
```

## Features Overview

### Automatic Schema Generation

DTOs are automatically converted to OpenAPI schemas:

```typescript
class UserDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
}

// Generates:
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "name": { "type": "string" },
    "email": { "type": "string" }
  },
  "required": ["id", "name", "email"]
}
```

### Multiple Response Types

Document different response scenarios:

```typescript
@Get(':id')
@ApiOkResponse({ description: 'Success', type: UserDto })
@ApiNotFoundResponse({ description: 'User not found' })
@ApiBadRequestResponse({ description: 'Invalid ID' })
findOne(@Param('id') id: string) {}
```

### Authentication Support

Multiple authentication strategies:

```typescript
// JWT Bearer
@ApiBearerAuth()

// API Key
@ApiApiKey()

// OAuth2
@ApiOAuth2(['read:users'])

// Basic Auth
@ApiBasicAuth()
```

### Request Validation

Document request requirements:

```typescript
@Post()
@ApiBody({ description: 'User data', type: CreateUserDto })
@ApiQuery({ name: 'sendEmail', required: false, type: 'boolean' })
create(@Body() dto: CreateUserDto, @Query('sendEmail') sendEmail: boolean) {}
```

## Best Practices

### 1. Document All DTOs

```typescript
// ✅ Good
class CreateUserDto {
  @ApiProperty({ description: 'Email address', example: 'user@example.com' })
  email: string;
}

// ❌ Missing documentation
class CreateUserDto {
  email: string;  // No @ApiProperty decorator
}
```

### 2. Use Descriptive Summaries

```typescript
// ✅ Good
@ApiOperation({
  summary: 'Create a new user account',
  description: 'Creates a user with the provided email and sends a welcome email'
})

// ❌ Too vague
@ApiOperation({ summary: 'Create user' })
```

### 3. Document All Responses

```typescript
// ✅ Good - All scenarios covered
@Post()
@ApiCreatedResponse({ description: 'User created', type: UserDto })
@ApiBadRequestResponse({ description: 'Validation failed' })
@ApiConflictResponse({ description: 'Email already exists' })
create() {}

// ❌ Missing error cases
@Post()
@ApiCreatedResponse({ description: 'Success', type: UserDto })
create() {}
```

### 4. Use Tags for Organization

```typescript
// ✅ Good - Organized by feature
@Controller('users')
@ApiTags('Users')
export class UserController {}

@Controller('posts')
@ApiTags('Posts')
export class PostController {}

// ❌ No tags - hard to navigate
@Controller('users')
export class UserController {}
```

### 5. Add Examples

```typescript
// ✅ Good - Clear examples
@ApiProperty({
  description: 'User email',
  example: 'john.doe@example.com'
})
email: string;

@ApiProperty({
  description: 'User age',
  example: 25,
  minimum: 18
})
age: number;
```

## Next Steps

- [Types and Parameters](/openapi/types-and-parameters) - Learn about documenting DTOs
- [Operations](/openapi/operations) - Document API endpoints
- [Security](/openapi/security) - Add authentication
- [Decorators](/openapi/decorators) - Complete decorator reference
- [Migration Guide](/openapi/migration) - Migrate from NestJS

## Need Help?

- 📚 [Full Documentation](https://docs.han-framework.dev/openapi)
- 💬 [Discord Community](https://discord.gg/hanframework)
- 🐛 [Report Issues](https://github.com/sirkenedy/Han/issues)
- 💡 [Request Features](https://github.com/sirkenedy/Han/discussions)

Happy documenting! 🎉
