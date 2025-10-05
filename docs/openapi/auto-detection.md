# Automatic Type Detection

One of Han OpenAPI's most powerful features is **automatic type detection** - the framework automatically infers types from your TypeScript code, reducing boilerplate and making your API documentation effortless.

## Auto-Detect Request Body Types

Han OpenAPI automatically detects the type from `@Body()` parameters **without requiring `@ApiBody()`**!

### Basic Auto-Detection

```typescript
import { Controller, Post, Body } from 'han-prev-core';

class CreateUserDto {
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty() age: number;
}

@Controller('users')
export class UserController {
  @Post()
  create(@Body() dto: CreateUserDto) {
    // ✨ CreateUserDto is automatically detected!
    // OpenAPI schema is generated without @ApiBody()
    return {};
  }
}
```

This generates the same OpenAPI documentation as:

```typescript
@Post()
@ApiBody({ type: CreateUserDto })  // ← Not needed!
create(@Body() dto: CreateUserDto) {
  return {};
}
```

### How It Works

1. Han OpenAPI reads TypeScript's `design:paramtypes` metadata
2. Finds parameters decorated with `@Body()`
3. Extracts the parameter type
4. Automatically generates the OpenAPI request body schema
5. Adds the DTO to the components/schemas section

### When Auto-Detection Triggers

Auto-detection works when:

✅ Parameter has `@Body()` decorator
✅ Parameter type is a class (not a primitive)
✅ No explicit `@ApiBody()` decorator is present

```typescript
// ✅ Auto-detected
@Post()
create(@Body() dto: CreateUserDto) {}

// ✅ Auto-detected
@Post()
createMany(@Body() dtos: CreateUserDto[]) {}

// ❌ Not auto-detected (primitive type)
@Post()
create(@Body() data: string) {}

// ⚠️ Explicit @ApiBody() takes precedence
@Post()
@ApiBody({ type: CustomDto })
create(@Body() dto: CreateUserDto) {
  // Uses CustomDto, not CreateUserDto
}
```

## Benefits

### 1. Less Boilerplate

```typescript
// ❌ Without auto-detection (more code)
@Post()
@ApiBody({ type: CreateUserDto })
create(@Body() dto: CreateUserDto) {}

@Put(':id')
@ApiBody({ type: UpdateUserDto })
update(@Param('id') id: string, @Body() dto: UpdateUserDto) {}

// ✅ With auto-detection (cleaner)
@Post()
create(@Body() dto: CreateUserDto) {}

@Put(':id')
update(@Param('id') id: string, @Body() dto: UpdateUserDto) {}
```

### 2. Single Source of Truth

Type definition lives in one place:

```typescript
create(@Body() dto: CreateUserDto) {
  //           ↑
  // This is the only place you define the type
  // OpenAPI docs stay in sync automatically!
}
```

### 3. Refactoring Safety

Changing the DTO type automatically updates docs:

```typescript
// Before
create(@Body() dto: CreateUserDto) {}

// After - docs update automatically!
create(@Body() dto: CreateUserDtoV2) {}
```

## Auto-Detect Property Types

Property types are also automatically detected from TypeScript:

```typescript
class UserDto {
  @ApiProperty() id: string;        // ← Auto-detected as string
  @ApiProperty() name: string;      // ← Auto-detected as string
  @ApiProperty() age: number;       // ← Auto-detected as number
  @ApiProperty() active: boolean;   // ← Auto-detected as boolean
  @ApiProperty() createdAt: Date;   // ← Auto-detected as string (date-time)
  @ApiProperty() tags: string[];    // ← Auto-detected as array
}
```

You can still override when needed:

```typescript
class UserDto {
  @ApiProperty({ type: 'integer' })  // Override: use integer instead of number
  age: number;

  @ApiProperty({ type: 'string', format: 'uuid' })  // Override format
  id: string;
}
```

## Advanced Auto-Detection

### Nested Objects

Automatically detects nested object structures:

```typescript
class AddressDto {
  @ApiProperty() street: string;
  @ApiProperty() city: string;
}

class UserDto {
  @ApiProperty() name: string;
  @ApiProperty({ type: () => AddressDto })  // Circular reference support
  address: AddressDto;
}

@Post()
create(@Body() dto: UserDto) {
  // ✨ Entire nested structure auto-detected!
}
```

### Arrays

Detects array types automatically:

```typescript
class CreateUsersDto {
  @ApiPropertyArray({ items: { type: 'string' } })
  emails: string[];

  @ApiProperty({ type: [UserDto] })
  users: UserDto[];
}

@Post('bulk')
createMany(@Body() dto: CreateUsersDto) {
  // ✨ Array types auto-detected!
}
```

### Generic Types

Works with generic types:

```typescript
class PaginatedDto<T> {
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() data: T[];
}

// Still requires explicit type due to TypeScript limitations
@Post()
@ApiBody({ type: PaginatedDto<UserDto> })
create(@Body() dto: PaginatedDto<UserDto>) {}
```

## When to Use Explicit @ApiBody()

Use explicit `@ApiBody()` when you need:

### 1. Custom Descriptions

```typescript
@Post()
@ApiBody({
  description: 'User registration data with optional profile information',
  type: CreateUserDto
})
create(@Body() dto: CreateUserDto) {}
```

### 2. Examples

```typescript
@Post()
@ApiBody({
  type: CreateUserDto,
  examples: {
    user1: {
      value: { email: 'john@example.com', name: 'John' }
    },
    user2: {
      value: { email: 'jane@example.com', name: 'Jane' }
    }
  }
})
create(@Body() dto: CreateUserDto) {}
```

### 3. Custom Schemas

```typescript
@Post()
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      data: { type: 'string' },
      metadata: { type: 'object' }
    }
  }
})
create(@Body() data: any) {}
```

### 4. Array Bodies

```typescript
@Post('bulk')
@ApiBody({ type: CreateUserDto, isArray: true })
createMany(@Body() dtos: CreateUserDto[]) {}
```

### 5. Optional Bodies

```typescript
@Post()
@ApiBody({ type: CreateUserDto, required: false })
create(@Body() dto?: CreateUserDto) {}
```

## Comparison with NestJS

### NestJS

Requires CLI plugin for auto-detection:

```typescript
// Needs @nestjs/swagger plugin in nest-cli.json
@Post()
create(@Body() dto: CreateUserDto) {}
```

### Han OpenAPI

Auto-detection built-in - no plugin needed:

```typescript
// Works out of the box!
@Post()
create(@Body() dto: CreateUserDto) {}
```

## Best Practices

### 1. Let Auto-Detection Work

```typescript
// ✅ Good - let auto-detection work
@Post()
create(@Body() dto: CreateUserDto) {}

// ❌ Unnecessary - adds redundant code
@Post()
@ApiBody({ type: CreateUserDto })
create(@Body() dto: CreateUserDto) {}
```

### 2. Use DTOs for Complex Types

```typescript
// ✅ Good - DTO class with decorators
class CreateUserDto {
  @ApiProperty() email: string;
  @ApiProperty() name: string;
}

@Post()
create(@Body() dto: CreateUserDto) {}

// ❌ Avoid - plain object won't auto-detect
@Post()
create(@Body() data: { email: string; name: string }) {}
```

### 3. Add @ApiBody() Only When Needed

```typescript
// ✅ Good - auto-detection sufficient
@Post()
create(@Body() dto: CreateUserDto) {}

// ✅ Good - @ApiBody() adds value
@Post()
@ApiBody({
  description: 'Complex user data',
  examples: { ... }
})
create(@Body() dto: CreateUserDto) {}
```

### 4. Always Decorate DTO Properties

```typescript
// ✅ Good - properties documented
class CreateUserDto {
  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User name' })
  name: string;
}

// ❌ Missing - properties won't appear in schema
class CreateUserDto {
  email: string;  // No @ApiProperty!
  name: string;   // No @ApiProperty!
}
```

## Troubleshooting

### Auto-Detection Not Working?

Check these common issues:

1. **DTO not decorated**
   ```typescript
   // ❌ Won't work
   class UserDto {
     email: string;  // Missing @ApiProperty
   }

   // ✅ Works
   class UserDto {
     @ApiProperty() email: string;
   }
   ```

2. **Using primitive types**
   ```typescript
   // ❌ Won't auto-detect
   create(@Body() email: string) {}

   // ✅ Will auto-detect
   create(@Body() dto: CreateUserDto) {}
   ```

3. **TypeScript metadata not enabled**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "emitDecoratorMetadata": true,  // ← Must be true
       "experimentalDecorators": true  // ← Must be true
     }
   }
   ```

## Complete Example

```typescript
import { Controller, Post, Put, Body, Param } from 'han-prev-core';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from 'han-prev-openapi';

// DTO definitions
class CreateUserDto {
  @ApiProperty({ description: 'Email address', format: 'email' })
  email: string;

  @ApiProperty({ description: 'Full name', minLength: 2 })
  name: string;

  @ApiProperty({ description: 'Age', minimum: 18 })
  age: number;
}

class UpdateUserDto {
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() age?: number;
}

class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() name: string;
  @ApiProperty() age: number;
  @ApiProperty() createdAt: Date;
}

// Controller with auto-detection
@Controller('users')
@ApiTags('Users')
export class UserController {
  @Post()
  @ApiOperation({ summary: 'Create user' })
  @ApiCreatedResponse({ type: UserResponseDto })
  create(@Body() dto: CreateUserDto) {
    // ✨ CreateUserDto automatically detected!
    return {};
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiOkResponse({ type: UserResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    // ✨ UpdateUserDto automatically detected!
    return {};
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create multiple users' })
  @ApiBody({ type: CreateUserDto, isArray: true })  // ← Explicit for arrays
  createMany(@Body() dtos: CreateUserDto[]) {
    return {};
  }
}
```

## Next Steps

- [Types and Parameters](/openapi/types-and-parameters) - Learn about DTO documentation
- [Operations](/openapi/operations) - Document API endpoints
- [Security](/openapi/security) - Add authentication

Automatic type detection makes your API documentation effortless! 🚀
