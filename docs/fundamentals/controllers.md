# Controllers

Controllers are responsible for handling incoming **requests** and returning **responses** to the client. They define your application's routes and handle HTTP methods.

## Basic Controller

Create a controller using the `@Controller()` decorator:

```typescript
import { Controller, Get } from 'han-prev-core';

@Controller('users')
export class UserController {
  @Get()
  findAll() {
    return ['User 1', 'User 2', 'User 3'];
  }
}
```

- `@Controller('users')` - Base path for all routes in this controller
- `@Get()` - HTTP GET method handler
- Returns data that's automatically serialized to JSON

**Result:** `GET /users` → `["User 1", "User 2", "User 3"]`

## Routing

### HTTP Methods

Han Framework provides decorators for all HTTP methods:

```typescript
import { Controller, Get, Post, Put, Delete, Patch } from 'han-prev-core';

@Controller('products')
export class ProductController {
  @Get()
  findAll() {
    return [];
  }

  @Post()
  create() {
    return { id: 1, created: true };
  }

  @Put(':id')
  update() {
    return { updated: true };
  }

  @Patch(':id')
  partialUpdate() {
    return { patched: true };
  }

  @Delete(':id')
  remove() {
    return { deleted: true };
  }
}
```

### Route Paths

Combine controller and method paths:

```typescript
@Controller('api/v1/users')  // Base path
export class UserController {
  @Get()          // GET /api/v1/users
  findAll() {}

  @Get('active')  // GET /api/v1/users/active
  findActive() {}

  @Post('bulk')   // POST /api/v1/users/bulk
  createMany() {}
}
```

### Route Parameters

Capture dynamic segments:

```typescript
@Controller('users')
export class UserController {
  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id, name: 'John Doe' };
  }

  @Get(':userId/posts/:postId')
  getUserPost(
    @Param('userId') userId: string,
    @Param('postId') postId: string,
  ) {
    return { userId, postId };
  }
}
```

**Usage:**
- `GET /users/123` → `{ id: "123", name: "John Doe" }`
- `GET /users/123/posts/456` → `{ userId: "123", postId: "456" }`

### Wildcard Routes

```typescript
@Get('*')
catchAll() {
  return { message: 'Route not found' };
}

@Get('files/*')
getFile() {
  return { path: 'file path here' };
}
```

## Request Objects

### @Param() - Route Parameters

```typescript
@Get(':id')
findOne(@Param('id') id: string) {
  return { id };
}

// Get all params
@Get(':category/:id')
findProduct(@Param() params: any) {
  return { category: params.category, id: params.id };
}
```

### @Query() - Query Parameters

```typescript
@Get()
search(@Query('q') searchTerm: string) {
  return { searching: searchTerm };
}

// Multiple query params
@Get()
filter(
  @Query('limit') limit: number,
  @Query('offset') offset: number,
) {
  return { limit, offset };
}

// All query params
@Get()
findAll(@Query() query: any) {
  return { filters: query };
}
```

**Usage:** `GET /users?limit=10&offset=0`

### @Body() - Request Body

```typescript
@Post()
create(@Body() data: CreateUserDto) {
  return { created: true, data };
}

// Specific field
@Post()
create(@Body('email') email: string) {
  return { email };
}
```

**Usage:**
```bash
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### @Headers() - Request Headers

```typescript
@Get()
findAll(@Headers('authorization') auth: string) {
  return { token: auth };
}

// All headers
@Get()
findAll(@Headers() headers: any) {
  return { userAgent: headers['user-agent'] };
}
```

## Response Handling

### Automatic JSON Serialization

Return objects or arrays - they're automatically converted to JSON:

```typescript
@Get()
getUser() {
  return {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  }; // Automatically becomes JSON
}
```

### Manual Response

Access the Express response object for more control:

```typescript
import { Res } from 'express';

@Get()
customResponse(@Res() res: Response) {
  res.status(200).json({ custom: true });
}
```

:::warning
When you use `@Res()`, you're responsible for sending the response. The automatic serialization is disabled.
:::

### Status Codes

```typescript
import { HttpStatus } from 'han-prev-core';

@Post()
create(@Res() res: Response) {
  res.status(201).json({ created: true });
}

@Delete(':id')
remove(@Res() res: Response) {
  res.status(204).send();
}
```

## Complete CRUD Example

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from 'han-prev-core';

interface CreateUserDto {
  name: string;
  email: string;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
}

@Controller('users')
export class UserController {
  private users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];

  @Get()
  findAll(
    @Query('limit') limit: number = 10,
    @Query('offset') offset: number = 0,
  ) {
    return {
      data: this.users.slice(offset, offset + limit),
      total: this.users.length,
      limit,
      offset,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const user = this.users.find(u => u.id === parseInt(id));
    if (!user) {
      return { error: 'User not found' };
    }
    return user;
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    const newUser = {
      id: this.users.length + 1,
      ...createUserDto,
    };
    this.users.push(newUser);
    return newUser;
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const userIndex = this.users.findIndex(u => u.id === parseInt(id));
    if (userIndex === -1) {
      return { error: 'User not found' };
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateUserDto,
    };

    return this.users[userIndex];
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const userIndex = this.users.findIndex(u => u.id === parseInt(id));
    if (userIndex === -1) {
      return { error: 'User not found' };
    }

    this.users.splice(userIndex, 1);
    return { deleted: true };
  }
}
```

## Dependency Injection in Controllers

Controllers can inject services:

```typescript
import { Controller, Get } from 'han-prev-core';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}
```

## Async/Await

Controllers support async operations:

```typescript
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    return users;
  }

  @Post()
  async create(@Body() data: CreateUserDto) {
    const user = await this.userService.create(data);
    return user;
  }
}
```

## Middleware on Controllers

Apply middleware to all routes in a controller:

```typescript
import { Controller, Get, UseMiddleware } from 'han-prev-core';
import { AuthMiddleware } from './middleware/auth.middleware';

@Controller('admin')
@UseMiddleware(AuthMiddleware)  // Applied to all routes
export class AdminController {
  @Get('users')    // Protected
  getUsers() {}

  @Get('settings') // Protected
  getSettings() {}
}
```

Or on specific routes:

```typescript
@Controller('users')
export class UserController {
  @Get()
  findAll() {
    // Public
  }

  @Post()
  @UseMiddleware(AuthMiddleware) // Protected
  create() {}
}
```

## Error Handling

```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  const user = await this.userService.findById(id);

  if (!user) {
    throw new HttpException('User not found', 404);
  }

  return user;
}
```

## Best Practices

### 1. Keep Controllers Thin

```typescript
// ❌ Bad - Business logic in controller
@Controller('users')
export class UserController {
  @Post()
  async create(@Body() data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await db.users.create({ ...data, password: hashedPassword });
    await emailService.send(user.email, 'Welcome!');
    return user;
  }
}

// ✅ Good - Delegate to service
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  create(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }
}
```

### 2. Use DTOs for Type Safety

```typescript
// dto/create-user.dto.ts
export class CreateUserDto {
  name: string;
  email: string;
  password: string;
}

@Post()
create(@Body() createUserDto: CreateUserDto) {
  return this.userService.create(createUserDto);
}
```

### 3. Return Consistent Responses

```typescript
// ✅ Good - Consistent structure
@Get()
findAll() {
  return {
    success: true,
    data: this.users,
    total: this.users.length,
  };
}

@Post()
create(@Body() data: CreateUserDto) {
  const user = this.userService.create(data);
  return {
    success: true,
    data: user,
  };
}
```

### 4. Use HTTP Status Codes Properly

```typescript
@Post()
create(@Res() res: Response) {
  // 201 for created
  res.status(201).json({ created: true });
}

@Delete(':id')
remove(@Res() res: Response) {
  // 204 for no content
  res.status(204).send();
}

@Get(':id')
findOne(@Param('id') id: string, @Res() res: Response) {
  const user = this.findUser(id);
  if (!user) {
    // 404 for not found
    return res.status(404).json({ error: 'Not found' });
  }
  res.json(user);
}
```

## Next Steps

- Learn about [Providers](/fundamentals/providers) for business logic
- Explore [Middleware](/fundamentals/middleware) for request processing
- Check out [Guards](/fundamentals/guards) for authorization

## Additional Resources

- [Routing Guide](/fundamentals/routing)
- [Request Lifecycle](/fundamentals/request-lifecycle)
