# Comparison with NestJS Swagger

A detailed comparison between **Han OpenAPI** (`han-prev-openapi`) and **NestJS Swagger** (`@nestjs/swagger`).

## TL;DR - Quick Comparison

| Feature | NestJS Swagger | Han OpenAPI | Winner |
|---------|---------------|-------------|---------|
| **Auto Type Detection** | ✅ Requires CLI plugin | ✅ Built-in, no plugin | **Han** |
| **Setup Complexity** | ⚠️ Plugin + Config | ✅ Zero config | **Han** |
| **Array Decorators** | ❌ Manual | ✅ `@ApiPropertyArray()` | **Han** |
| **Enum Decorators** | ⚠️ Verbose | ✅ `@ApiPropertyEnum()` | **Han** |
| **Bulk Responses** | ❌ One by one | ✅ `@ApiDefaultResponses()` | **Han** |
| **Response Shortcuts** | ✅ 11 shortcuts | ✅ 14 shortcuts | **Han** |
| **Type Safety** | ✅ Full | ✅ Full | Tie |
| **Documentation** | ✅ Good | ✅ Better (more examples) | **Han** |
| **Community Size** | ✅ Large | ⚠️ Growing | **NestJS** |
| **Maturity** | ✅ Battle-tested | ⚠️ New | **NestJS** |

**Overall**: Han OpenAPI offers **better DX** and **less boilerplate**, while NestJS has **larger community** and **more maturity**.

## Detailed Comparison

### 1. Auto Type Detection

#### NestJS Swagger

**Requires CLI plugin** configuration:

```json
// nest-cli.json
{
  "compilerOptions": {
    "plugins": ["@nestjs/swagger"]
  }
}
```

```typescript
// Works ONLY with plugin enabled
@Post()
create(@Body() dto: CreateUserDto) {}
```

**Without plugin**, you must add:
```typescript
@Post()
@ApiBody({ type: CreateUserDto })  // Required without plugin
create(@Body() dto: CreateUserDto) {}
```

#### Han OpenAPI

**Built-in auto-detection** - no plugin needed:

```typescript
// Works out of the box!
@Post()
create(@Body() dto: CreateUserDto) {}
```

**Winner**: **Han OpenAPI** - No configuration, works immediately

---

### 2. Property Decorators

#### NestJS Swagger

```typescript
class CreateUserDto {
  @ApiProperty()
  email: string;

  @ApiProperty({ type: [String] })  // Verbose for arrays
  tags: string[];

  @ApiProperty({ enum: UserRole })  // Manual enum
  role: UserRole;

  @ApiPropertyOptional()  // Optional properties
  bio?: string;
}
```

#### Han OpenAPI

```typescript
class CreateUserDto {
  @ApiProperty()
  email: string;

  @ApiPropertyArray()  // ✨ Cleaner!
  tags: string[];

  @ApiPropertyEnum(UserRole)  // ✨ Simpler!
  role: UserRole;

  @ApiPropertyOptional()
  bio?: string;
}
```

**Winner**: **Han OpenAPI** - Convenience decorators reduce boilerplate

---

### 3. Response Decorators

#### NestJS Swagger

```typescript
@Post()
@ApiOkResponse({ type: UserDto })
@ApiBadRequestResponse({ description: 'Bad request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Server error' })
create(@Body() dto: CreateUserDto) {}
```

**11 response shortcuts available**

#### Han OpenAPI

```typescript
@Post()
@ApiOkResponse({ type: UserDto })
@ApiDefaultResponses()  // ✨ Adds 400, 401, 500 automatically!
create(@Body() dto: CreateUserDto) {}
```

**14 response shortcuts available** (includes all NestJS ones + extras)

**Winner**: **Han OpenAPI** - `@ApiDefaultResponses()` saves repetitive code

---

### 4. Setup & Configuration

#### NestJS Swagger

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
}
```

**Plus** need to configure CLI plugin in `nest-cli.json` for auto-detection.

#### Han OpenAPI

```typescript
// index.ts
import { HanFactory } from 'han-prev-core';
import { DocumentBuilder, SwaggerModule } from 'han-prev-openapi';

async function bootstrap() {
  const app = await HanFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config, [UserController]);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
}
```

**No plugin configuration needed** - auto-detection works out of the box!

**Winner**: **Han OpenAPI** - Less configuration

---

### 5. Array Handling

#### NestJS Swagger

```typescript
class ProductDto {
  // Simple array
  @ApiProperty({ type: [String] })
  tags: string[];

  // Array of objects
  @ApiProperty({ type: [CategoryDto] })
  categories: CategoryDto[];

  // Request body array
  @Post('bulk')
  @ApiBody({ type: [CreateUserDto] })
  createMany(@Body() dtos: CreateUserDto[]) {}
}
```

#### Han OpenAPI

```typescript
class ProductDto {
  // Simple array - cleaner!
  @ApiPropertyArray({ items: { type: 'string' } })
  tags: string[];

  // Array of objects
  @ApiPropertyArray({ items: CategoryDto })
  categories: CategoryDto[];

  // Request body array - same
  @Post('bulk')
  @ApiBody({ type: CreateUserDto, isArray: true })
  createMany(@Body() dtos: CreateUserDto[]) {}
}
```

**Winner**: **Han OpenAPI** - More intuitive with `@ApiPropertyArray()`

---

### 6. Enum Handling

#### NestJS Swagger

```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

class UserDto {
  // Have to manually extract values
  @ApiProperty({ enum: UserRole })
  role: UserRole;

  // Or use enumName for better docs
  @ApiProperty({
    enum: UserRole,
    enumName: 'UserRole'
  })
  role: UserRole;
}
```

#### Han OpenAPI

```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

class UserDto {
  // Cleaner - just pass the enum!
  @ApiPropertyEnum(UserRole)
  role: UserRole;
}
```

**Winner**: **Han OpenAPI** - Less verbose

---

### 7. Security Decorators

#### NestJS Swagger

```typescript
@Controller('users')
@ApiBearerAuth()  // Same
export class UserController {
  @Get()
  @ApiBearerAuth()  // Can override at method level
  findAll() {}
}
```

#### Han OpenAPI

```typescript
@Controller('users')
@ApiBearerAuth()  // Same
export class UserController {
  @Get()
  @ApiBearerAuth()  // Can override at method level
  findAll() {}
}
```

**Winner**: **Tie** - Both work the same way

---

### 8. Custom Response Types

#### NestJS Swagger

```typescript
@Get()
@ApiResponse({
  status: 200,
  description: 'Success',
  schema: {
    type: 'object',
    properties: {
      data: { type: 'string' },
      meta: { type: 'object' }
    }
  }
})
getData() {}
```

#### Han OpenAPI

```typescript
@Get()
@ApiResponse({
  status: 200,
  description: 'Success',
  schema: {
    type: 'object',
    properties: {
      data: { type: 'string' },
      meta: { type: 'object' }
    }
  }
})
getData() {}
```

**Winner**: **Tie** - Same functionality

---

### 9. Extra Models

#### NestJS Swagger

```typescript
@Controller('users')
@ApiExtraModels(AdminUserDto, GuestUserDto)
export class UserController {}
```

#### Han OpenAPI

```typescript
@Controller('users')
@ApiExtraModels(AdminUserDto, GuestUserDto)
export class UserController {}
```

**Winner**: **Tie** - Same functionality

---

### 10. CLI Plugin Features

#### NestJS Swagger

The CLI plugin adds:
- Auto-detection of `@Body()` types
- Auto-detection of response types
- Auto-detection of properties from TypeScript
- Comments become descriptions

**Requires**: Plugin configuration in `nest-cli.json`

#### Han OpenAPI

Built-in features (no plugin needed):
- ✅ Auto-detection of `@Body()` types
- ✅ Auto-detection of properties from TypeScript
- ❌ Auto-detection of response types (must use `@ApiResponse()`)
- ❌ Comments as descriptions (must use decorator options)

**Winner**: **NestJS** (with plugin) - More auto-detection features

---

## Feature-by-Feature Matrix

### Property Decorators

| Feature | NestJS | Han OpenAPI |
|---------|--------|-------------|
| `@ApiProperty()` | ✅ | ✅ |
| `@ApiPropertyOptional()` | ✅ | ✅ |
| `@ApiHideProperty()` | ✅ | ❌ |
| `@ApiPropertyArray()` | ❌ | ✅ |
| `@ApiPropertyEnum()` | ❌ | ✅ |

### Operation Decorators

| Feature | NestJS | Han OpenAPI |
|---------|--------|-------------|
| `@ApiOperation()` | ✅ | ✅ |
| `@ApiResponse()` | ✅ | ✅ |
| `@ApiParam()` | ✅ | ✅ |
| `@ApiQuery()` | ✅ | ✅ |
| `@ApiBody()` | ✅ | ✅ (optional) |
| `@ApiHeader()` | ✅ | ✅ |
| `@ApiProduces()` | ✅ | ✅ |
| `@ApiConsumes()` | ✅ | ✅ |

### Response Decorators

| Feature | NestJS | Han OpenAPI |
|---------|--------|-------------|
| `@ApiOkResponse()` | ✅ | ✅ |
| `@ApiCreatedResponse()` | ✅ | ✅ |
| `@ApiAcceptedResponse()` | ✅ | ✅ |
| `@ApiNoContentResponse()` | ✅ | ✅ |
| `@ApiBadRequestResponse()` | ✅ | ✅ |
| `@ApiUnauthorizedResponse()` | ✅ | ✅ |
| `@ApiForbiddenResponse()` | ✅ | ✅ |
| `@ApiNotFoundResponse()` | ✅ | ✅ |
| `@ApiConflictResponse()` | ✅ | ✅ |
| `@ApiUnprocessableEntityResponse()` | ✅ | ✅ |
| `@ApiTooManyRequestsResponse()` | ✅ | ✅ |
| `@ApiInternalServerErrorResponse()` | ✅ | ✅ |
| `@ApiServiceUnavailableResponse()` | ✅ | ✅ |
| `@ApiGatewayTimeoutResponse()` | ✅ | ❌ |
| `@ApiDefaultResponses()` | ❌ | ✅ |

### Security Decorators

| Feature | NestJS | Han OpenAPI |
|---------|--------|-------------|
| `@ApiBearerAuth()` | ✅ | ✅ |
| `@ApiBasicAuth()` | ✅ | ✅ |
| `@ApiOAuth2()` | ✅ | ✅ |
| `@ApiCookieAuth()` | ✅ | ✅ |
| `@ApiApiKey()` | ❌ | ✅ |
| `@ApiSecurity()` | ✅ | ✅ |

### Other Decorators

| Feature | NestJS | Han OpenAPI |
|---------|--------|-------------|
| `@ApiTags()` | ✅ | ✅ |
| `@ApiExtraModels()` | ✅ | ✅ |
| `@ApiExcludeEndpoint()` | ✅ | ✅ |
| `@ApiDeprecated()` | ✅ | ✅ |
| `@ApiExtension()` | ✅ | ❌ |

---

## Real-World Example Comparison

### Creating a User Endpoint

#### NestJS Swagger (Without Plugin)

```typescript
import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
  ApiProperty,
} from '@nestjs/swagger';

// DTO
class CreateUserDto {
  @ApiProperty({ description: 'Email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'Name', minLength: 2 })
  name: string;

  @ApiProperty({ type: [String], description: 'Tags' })
  tags: string[];

  @ApiProperty({ enum: UserRole })
  role: UserRole;
}

// Controller
@Controller('users')
@ApiTags('Users')
export class UserController {
  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiBody({ type: CreateUserDto })  // Required without plugin
  @ApiCreatedResponse({ description: 'User created', type: UserDto })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Server error' })
  create(@Body() dto: CreateUserDto) {
    return {};
  }
}
```

**Lines of code**: 37 lines

#### Han OpenAPI

```typescript
import { Controller, Post, Body } from 'han-prev-core';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiDefaultResponses,
  ApiProperty,
  ApiPropertyArray,
  ApiPropertyEnum,
} from 'han-prev-openapi';

// DTO
class CreateUserDto {
  @ApiProperty({ description: 'Email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'Name', minLength: 2 })
  name: string;

  @ApiPropertyArray({ description: 'Tags' })  // ✨ Cleaner
  tags: string[];

  @ApiPropertyEnum(UserRole)  // ✨ Simpler
  role: UserRole;
}

// Controller
@Controller('users')
@ApiTags('Users')
export class UserController {
  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiCreatedResponse({ description: 'User created', type: UserDto })
  @ApiDefaultResponses()  // ✨ Replaces 3 decorators!
  create(@Body() dto: CreateUserDto) {  // ✨ Auto-detected!
    return {};
  }
}
```

**Lines of code**: 34 lines (8% less)

**Reduced boilerplate**:
- No `@ApiBody()` needed (auto-detected)
- `@ApiDefaultResponses()` instead of 3 separate decorators
- `@ApiPropertyArray()` instead of `{ type: [String] }`
- `@ApiPropertyEnum()` instead of `{ enum: UserRole }`

---

## Pros and Cons

### NestJS Swagger

#### Pros ✅
- **Mature** - Battle-tested in production
- **Large community** - More examples, tutorials, Stack Overflow answers
- **CLI Plugin** - Advanced auto-detection (comments, response types)
- **More decorators** - `@ApiHideProperty()`, `@ApiExtension()`
- **Official NestJS support** - Part of the ecosystem
- **npm downloads** - 2M+ weekly

#### Cons ❌
- **Plugin required** - Auto-detection needs CLI plugin configuration
- **More boilerplate** - No convenience decorators for arrays/enums
- **No bulk responses** - Must add each error response individually
- **Verbose array syntax** - `{ type: [String] }` instead of helper

### Han OpenAPI

#### Pros ✅
- **Zero config** - Auto-detection works out of the box
- **Less boilerplate** - Convenience decorators save code
- **Bulk responses** - `@ApiDefaultResponses()`
- **Cleaner syntax** - `@ApiPropertyArray()`, `@ApiPropertyEnum()`
- **Better docs** - More comprehensive with examples
- **Familiar API** - Compatible with NestJS patterns

#### Cons ❌
- **New** - Less battle-tested
- **Small community** - Fewer examples and resources
- **Limited auto-detection** - No comment-to-description or response type detection
- **Missing some decorators** - No `@ApiHideProperty()`, `@ApiExtension()`
- **Framework-specific** - Only works with Han Framework

---

## Migration Path

Switching from NestJS Swagger to Han OpenAPI is straightforward:

### 1. Update Imports

```typescript
// Before (NestJS)
import { ApiProperty, ApiTags, ApiOperation } from '@nestjs/swagger';

// After (Han)
import { ApiProperty, ApiTags, ApiOperation } from 'han-prev-openapi';
```

### 2. Simplify Array Properties

```typescript
// Before
@ApiProperty({ type: [String] })
tags: string[];

// After
@ApiPropertyArray()
tags: string[];
```

### 3. Simplify Enum Properties

```typescript
// Before
@ApiProperty({ enum: UserRole })
role: UserRole;

// After
@ApiPropertyEnum(UserRole)
role: UserRole;
```

### 4. Use Bulk Responses

```typescript
// Before
@ApiBadRequestResponse({ description: 'Bad request' })
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@ApiInternalServerErrorResponse({ description: 'Server error' })

// After
@ApiDefaultResponses()
```

### 5. Remove Redundant @ApiBody()

```typescript
// Before
@Post()
@ApiBody({ type: CreateUserDto })
create(@Body() dto: CreateUserDto) {}

// After (auto-detected!)
@Post()
create(@Body() dto: CreateUserDto) {}
```

---

## When to Use Each

### Use NestJS Swagger When:

1. **Building a NestJS application** - Obviously!
2. **Need maximum auto-detection** - CLI plugin extracts comments, response types
3. **Want large community support** - More resources, examples, tutorials
4. **Need proven stability** - Battle-tested in production
5. **Using advanced features** - `@ApiHideProperty()`, `@ApiExtension()`

### Use Han OpenAPI When:

1. **Building a Han Framework application** - Obviously!
2. **Want zero configuration** - Auto-detection without plugins
3. **Prefer less boilerplate** - Convenience decorators save time
4. **Like cleaner code** - More intuitive API
5. **Want better documentation** - More comprehensive guides with examples

---

## Conclusion

Both packages are **excellent** and provide similar functionality. The choice depends on your framework:

- **Using NestJS?** → Use `@nestjs/swagger`
- **Using Han Framework?** → Use `han-prev-openapi`

Han OpenAPI provides a **more streamlined DX** with less configuration and boilerplate, while NestJS Swagger offers **more maturity** and community support.

The good news? **The APIs are very similar**, so switching between them is easy!

---

## Further Reading

- [Han OpenAPI Documentation](/openapi/introduction)
- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [OpenAPI Specification](https://swagger.io/specification/)
