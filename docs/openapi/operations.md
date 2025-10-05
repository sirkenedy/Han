# Operations

Learn how to document your API endpoints (operations) using decorators. Operations represent the HTTP methods (GET, POST, PUT, DELETE, etc.) that can be performed on your API endpoints.

## Basic Operation Documentation

Use `@ApiOperation()` to add metadata to your endpoints:

```typescript
import { Controller, Get, Post, Put, Delete } from 'han-prev-core';
import { ApiTags, ApiOperation } from 'han-prev-openapi';

@Controller('users')
@ApiTags('Users')
export class UserController {
  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Returns a paginated list of all users in the system'
  })
  findAll() {
    return [];
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a single user by their unique identifier',
    operationId: 'getUserById'
  })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user account with the provided information'
  })
  create(@Body() dto: CreateUserDto) {
    return {};
  }
}
```

## Response Documentation

Document different response scenarios using response decorators:

### Success Responses

```typescript
import {
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse
} from 'han-prev-openapi';

@Get()
@ApiOkResponse({
  description: 'Users retrieved successfully',
  type: UserDto,
  isArray: true
})
findAll() {
  return [];
}

@Post()
@ApiCreatedResponse({
  description: 'User created successfully',
  type: UserDto
})
create(@Body() dto: CreateUserDto) {
  return {};
}

@Delete(':id')
@ApiNoContentResponse({
  description: 'User deleted successfully'
})
remove(@Param('id') id: string) {
  return;
}
```

### Error Responses

```typescript
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse
} from 'han-prev-openapi';

@Post()
@ApiCreatedResponse({ description: 'User created', type: UserDto })
@ApiBadRequestResponse({ description: 'Invalid input data' })
@ApiConflictResponse({ description: 'Email already exists' })
create(@Body() dto: CreateUserDto) {
  return {};
}

@Get(':id')
@ApiOkResponse({ description: 'User found', type: UserDto })
@ApiNotFoundResponse({ description: 'User not found' })
@ApiUnauthorizedResponse({ description: 'Authentication required' })
findOne(@Param('id') id: string) {
  return {};
}

@Delete(':id')
@ApiNoContentResponse({ description: 'User deleted' })
@ApiNotFoundResponse({ description: 'User not found' })
@ApiForbiddenResponse({ description: 'Insufficient permissions' })
remove(@Param('id') id: string) {
  return;
}
```

### Multiple Response Codes

```typescript
@Get(':id')
@ApiResponse({ status: 200, description: 'Success', type: UserDto })
@ApiResponse({ status: 304, description: 'Not Modified' })
@ApiResponse({ status: 404, description: 'Not Found' })
@ApiResponse({ status: 500, description: 'Internal Server Error' })
findOne(@Param('id') id: string) {
  return {};
}
```

### Default Responses

Use `@ApiDefaultResponses()` to add common error responses:

```typescript
import { ApiDefaultResponses } from 'han-prev-openapi';

@Post()
@ApiCreatedResponse({ description: 'Success', type: UserDto })
@ApiDefaultResponses()  // Adds 400, 401, 500 responses
create(@Body() dto: CreateUserDto) {
  return {};
}
```

## Parameter Documentation

### Path Parameters

```typescript
import { ApiParam } from 'han-prev-openapi';

@Get(':id')
@ApiParam({
  name: 'id',
  description: 'User ID',
  type: 'string',
  example: 'user-123'
})
findOne(@Param('id') id: string) {
  return {};
}

@Get(':userId/posts/:postId')
@ApiParam({ name: 'userId', description: 'User ID', type: 'string' })
@ApiParam({ name: 'postId', description: 'Post ID', type: 'string' })
getUserPost(
  @Param('userId') userId: string,
  @Param('postId') postId: string
) {
  return {};
}
```

### Query Parameters

```typescript
import { ApiQuery } from 'han-prev-openapi';

@Get()
@ApiQuery({
  name: 'page',
  description: 'Page number',
  required: false,
  type: 'integer',
  example: 1
})
@ApiQuery({
  name: 'limit',
  description: 'Items per page',
  required: false,
  type: 'integer',
  example: 10
})
@ApiQuery({
  name: 'search',
  description: 'Search query',
  required: false,
  type: 'string'
})
findAll(
  @Query('page') page: number = 1,
  @Query('limit') limit: number = 10,
  @Query('search') search?: string
) {
  return [];
}
```

### Query with Enums

```typescript
@Get()
@ApiQuery({
  name: 'status',
  description: 'Filter by status',
  required: false,
  enum: ['active', 'inactive', 'pending'],
  example: 'active'
})
findAll(@Query('status') status?: string) {
  return [];
}
```

### Array Query Parameters

```typescript
@Get()
@ApiQuery({
  name: 'tags',
  description: 'Filter by tags',
  required: false,
  isArray: true,
  type: 'string',
  example: ['javascript', 'typescript']
})
findAll(@Query('tags') tags?: string[]) {
  return [];
}
```

### Header Parameters

```typescript
import { ApiHeader } from 'han-prev-openapi';

@Get()
@ApiHeader({
  name: 'X-API-Version',
  description: 'API version',
  required: true,
  example: 'v1'
})
@ApiHeader({
  name: 'X-Request-ID',
  description: 'Unique request identifier',
  required: false
})
findAll(
  @Headers('X-API-Version') version: string,
  @Headers('X-Request-ID') requestId?: string
) {
  return [];
}
```

## Request Body Documentation

### Simple Request Body

```typescript
import { ApiBody } from 'han-prev-openapi';

@Post()
@ApiBody({
  description: 'User data',
  type: CreateUserDto,
  required: true
})
create(@Body() dto: CreateUserDto) {
  return {};
}
```

### Array Request Body

```typescript
@Post('bulk')
@ApiBody({
  description: 'Multiple users',
  type: CreateUserDto,
  isArray: true
})
createMany(@Body() dtos: CreateUserDto[]) {
  return {};
}
```

### Custom Schema

```typescript
@Post()
@ApiBody({
  description: 'Complex data',
  schema: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' }
        }
      },
      settings: {
        type: 'object',
        properties: {
          theme: { type: 'string', enum: ['light', 'dark'] },
          notifications: { type: 'boolean' }
        }
      }
    }
  }
})
create(@Body() data: any) {
  return {};
}
```

### With Examples

```typescript
@Post()
@ApiBody({
  description: 'User data',
  type: CreateUserDto,
  examples: {
    user1: {
      value: {
        email: 'john@example.com',
        name: 'John Doe',
        age: 25
      }
    },
    user2: {
      value: {
        email: 'jane@example.com',
        name: 'Jane Smith',
        age: 30
      }
    }
  }
})
create(@Body() dto: CreateUserDto) {
  return {};
}
```

## Content Types

### Consume Content Types

```typescript
import { ApiConsumes } from 'han-prev-openapi';

@Post('upload')
@ApiConsumes('multipart/form-data')
@ApiBody({
  description: 'File upload',
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary'
      },
      description: {
        type: 'string'
      }
    }
  }
})
uploadFile(@Body() data: any) {
  return {};
}

@Post('json')
@ApiConsumes('application/json')
createWithJson(@Body() dto: CreateUserDto) {
  return {};
}

@Post('form')
@ApiConsumes('application/x-www-form-urlencoded')
createWithForm(@Body() data: any) {
  return {};
}
```

### Produce Content Types

```typescript
import { ApiProduces } from 'han-prev-openapi';

@Get()
@ApiProduces('application/json')
@ApiOkResponse({ type: UserDto, isArray: true })
findAll() {
  return [];
}

@Get(':id/export')
@ApiProduces('text/csv', 'application/pdf')
exportUser(@Param('id') id: string) {
  return {};
}
```

## Tags and Organization

### Controller-Level Tags

```typescript
@Controller('users')
@ApiTags('Users')
export class UserController {
  // All methods will have 'Users' tag
}

@Controller('admin/users')
@ApiTags('Admin', 'Users')
export class AdminUserController {
  // All methods will have 'Admin' and 'Users' tags
}
```

### Method-Level Tags

```typescript
@Controller('users')
@ApiTags('Users')
export class UserController {
  @Get()
  @ApiTags('Public')  // Overrides controller tags
  findAll() {
    return [];
  }

  @Get('me')
  @ApiTags('Users', 'Profile')  // Multiple tags
  getProfile() {
    return {};
  }
}
```

## Deprecated Endpoints

```typescript
import { ApiDeprecated } from 'han-prev-openapi';

@Get('legacy')
@ApiDeprecated()
@ApiOperation({
  summary: 'Legacy endpoint',
  description: 'This endpoint is deprecated. Use GET /v2/users instead'
})
legacyEndpoint() {
  return [];
}
```

## Exclude from Documentation

```typescript
import { ApiExcludeEndpoint } from 'han-prev-openapi';

@Get('internal')
@ApiExcludeEndpoint()
internalEndpoint() {
  // This endpoint won't appear in Swagger documentation
  return {};
}
```

## Complete CRUD Example

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from 'han-prev-core';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth
} from 'han-prev-openapi';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UserController {
  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Returns a paginated list of users with optional filtering'
  })
  @ApiQuery({ name: 'page', required: false, type: 'integer', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: 'integer', example: 10 })
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'inactive'],
    example: 'active'
  })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
    type: UserDto,
    isArray: true
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('status') status?: string
  ) {
    return [];
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a single user by their unique identifier'
  })
  @ApiParam({ name: 'id', description: 'User ID', example: 'user-123' })
  @ApiOkResponse({ description: 'User found', type: UserDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('id') id: string) {
    return {};
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new user',
    description: 'Creates a new user account with the provided information'
  })
  @ApiBody({ description: 'User data', type: CreateUserDto })
  @ApiCreatedResponse({ description: 'User created successfully', type: UserDto })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  create(@Body() dto: CreateUserDto) {
    return {};
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates an existing user with the provided information'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ description: 'Updated user data', type: UpdateUserDto })
  @ApiOkResponse({ description: 'User updated successfully', type: UserDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return {};
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Permanently deletes a user from the system'
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiNoContentResponse({ description: 'User deleted successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  remove(@Param('id') id: string) {
    return;
  }
}
```

## Best Practices

### 1. Use Clear Summaries

```typescript
// ✅ Good
@ApiOperation({ summary: 'Get all active users' })

// ❌ Too vague
@ApiOperation({ summary: 'Get users' })
```

### 2. Add Descriptions

```typescript
// ✅ Good
@ApiOperation({
  summary: 'Create user',
  description: 'Creates a new user account and sends a welcome email'
})

// ❌ Missing context
@ApiOperation({ summary: 'Create user' })
```

### 3. Document All Responses

```typescript
// ✅ Good
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

### 4. Use Operation IDs

```typescript
// ✅ Good - Easier to reference
@ApiOperation({
  summary: 'Get user',
  operationId: 'getUserById'
})

// Can be referenced in client SDKs as:
// api.getUserById(id)
```

### 5. Group Related Endpoints

```typescript
// ✅ Good
@Controller('users')
@ApiTags('Users')
export class UserController {}

@Controller('users/:userId/posts')
@ApiTags('User Posts')
export class UserPostController {}
```

## Next Steps

- [Security](/openapi/security) - Add authentication
- [Types and Parameters](/openapi/types-and-parameters) - Document DTOs
- [Decorators](/openapi/decorators) - Complete decorator reference

Document all your endpoints with clear summaries, descriptions, and response types!
