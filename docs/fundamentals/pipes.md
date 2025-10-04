# Pipes

Pipes are transformation and validation tools that process data **before it reaches your route handler**. They transform input data, validate it, or throw exceptions if the data is invalid.

## What are Pipes?

Pipes are classes that implement the `PipeTransform` interface with a `transform()` method. They receive input data and return transformed or validated data:

```typescript
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new Error('Validation failed. Not a number.');
    }

    return val;
  }
}
```

## Request Flow with Pipes

Understanding when pipes execute:

```
Request
  ↓
Middleware
  ↓
Guards
  ↓
Pipes ← Transform/Validate data here
  ↓
Route Handler (receives clean data)
  ↓
Interceptors
  ↓
Response
```

## Why Use Pipes?

### 1. Data Validation

Ensure data meets requirements before processing:

```typescript
// ❌ Without pipe - Manual validation in every route
@Post()
create(@Body() data: any) {
  if (!data.email || !data.email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (!data.password || data.password.length < 8) {
    throw new Error('Password too short');
  }
  return this.userService.create(data);
}

// ✅ With pipe - Automatic validation
@Post()
create(@Body(ValidationPipe) data: CreateUserDto) {
  return this.userService.create(data); // Data is already validated
}
```

### 2. Data Transformation

Convert data types automatically:

```typescript
// ❌ Without pipe - Manual conversion
@Get(':id')
findOne(@Param('id') id: string) {
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    throw new Error('Invalid ID');
  }
  return this.userService.findById(userId);
}

// ✅ With pipe - Automatic conversion
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.userService.findById(id); // Already a number
}
```

### 3. Data Sanitization

Clean user input:

```typescript
@Post()
create(@Body(SanitizePipe) data: CreateUserDto) {
  // Data is sanitized (no HTML, no scripts)
  return this.userService.create(data);
}
```

## Built-in Pipes

Han Framework provides several built-in pipes:

### 1. ParseIntPipe

Convert string to number:

```typescript
import { Controller, Get, Param, ParseIntPipe } from 'han-prev-core';

@Controller('users')
export class UserController {
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // id is guaranteed to be a number
    return this.userService.findById(id);
  }
}
```

**Request:** `GET /users/123` → `id = 123` (number)
**Invalid:** `GET /users/abc` → Error: "Validation failed. Not a number."

### 2. ParseBoolPipe

Convert string to boolean:

```typescript
@Get()
findAll(@Query('active', ParseBoolPipe) active: boolean) {
  return this.userService.findAll({ active });
}
```

**Request:** `GET /users?active=true` → `active = true` (boolean)
**Request:** `GET /users?active=1` → `active = true`
**Request:** `GET /users?active=false` → `active = false`

### 3. ParseArrayPipe

Convert string to array:

```typescript
@Get()
findByIds(@Query('ids', ParseArrayPipe) ids: number[]) {
  return this.userService.findByIds(ids);
}
```

**Request:** `GET /users?ids=1,2,3` → `ids = [1, 2, 3]`

## Creating Custom Pipes

### Step 1: Create the Pipe Class

```typescript
// validation.pipe.ts
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any) {
    // Validate the value
    if (!value) {
      throw new Error('Validation failed. No value provided.');
    }

    // Return validated value
    return value;
  }
}
```

### Step 2: Register in Module

```typescript
// app.module.ts
import { Module } from 'han-prev-core';
import { UserController } from './user.controller';
import { ValidationPipe } from './pipes/validation.pipe';

@Module({
  controllers: [UserController],
  providers: [ValidationPipe], // ✅ Register pipe
})
export class AppModule {}
```

### Step 3: Apply to Routes

```typescript
// user.controller.ts
import { Controller, Post, Body } from 'han-prev-core';
import { ValidationPipe } from './pipes/validation.pipe';

@Controller('users')
export class UserController {
  @Post()
  create(@Body(ValidationPipe) data: any) {
    return this.userService.create(data);
  }
}
```

## Common Pipe Examples

### 1. Email Validation Pipe

Validate email format:

```typescript
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class EmailValidationPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value) {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }

    return value.toLowerCase().trim();
  }
}
```

Usage:

```typescript
@Post('register')
register(
  @Body('email', EmailValidationPipe) email: string,
  @Body('password') password: string,
) {
  return this.authService.register(email, password);
}
```

### 2. Trim Pipe

Remove whitespace:

```typescript
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class TrimPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string') {
      return value;
    }

    return value.trim();
  }
}
```

### 3. Uppercase Pipe

Convert to uppercase:

```typescript
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class UppercasePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string') {
      return value;
    }

    return value.toUpperCase();
  }
}
```

### 4. Default Value Pipe

Provide default value if empty:

```typescript
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class DefaultValuePipe implements PipeTransform {
  constructor(private defaultValue: any) {}

  transform(value: any) {
    if (value === undefined || value === null || value === '') {
      return this.defaultValue;
    }

    return value;
  }
}
```

Usage:

```typescript
@Get()
findAll(
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
) {
  return this.userService.findAll({ limit, page });
}
```

**Request:** `GET /users` → `limit=10, page=1` (defaults applied)
**Request:** `GET /users?limit=20&page=2` → `limit=20, page=2`

### 5. Sanitization Pipe

Remove dangerous characters:

```typescript
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any) {
    if (typeof value === 'string') {
      // Remove HTML tags
      value = value.replace(/<[^>]*>/g, '');

      // Remove script tags
      value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

      // Remove event handlers
      value = value.replace(/on\w+="[^"]*"/gi, '');
    }

    if (typeof value === 'object' && value !== null) {
      for (const key in value) {
        value[key] = this.transform(value[key]);
      }
    }

    return value;
  }
}
```

### 6. UUID Validation Pipe

Validate UUID format:

```typescript
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class UUIDValidationPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      throw new Error('Invalid UUID format');
    }

    return value;
  }
}
```

### 7. JSON Parse Pipe

Parse JSON strings:

```typescript
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class ParseJSONPipe implements PipeTransform {
  transform(value: string) {
    try {
      return JSON.parse(value);
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }
}
```

### 8. File Size Validation Pipe

Validate file upload size:

```typescript
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  private maxSize = 5 * 1024 * 1024; // 5MB

  transform(file: any) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > this.maxSize) {
      throw new Error(`File too large. Max size: ${this.maxSize / 1024 / 1024}MB`);
    }

    return file;
  }
}
```

### 9. Password Strength Pipe

Validate password strength:

```typescript
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class PasswordStrengthPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value) {
      throw new Error('Password is required');
    }

    if (value.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(value)) {
      throw new Error('Password must contain uppercase letter');
    }

    if (!/[a-z]/.test(value)) {
      throw new Error('Password must contain lowercase letter');
    }

    if (!/[0-9]/.test(value)) {
      throw new Error('Password must contain number');
    }

    if (!/[!@#$%^&*]/.test(value)) {
      throw new Error('Password must contain special character (!@#$%^&*)');
    }

    return value;
  }
}
```

### 10. Object Validation Pipe

Validate object structure:

```typescript
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class ObjectValidationPipe implements PipeTransform {
  constructor(private requiredFields: string[]) {}

  transform(value: any) {
    if (typeof value !== 'object' || value === null) {
      throw new Error('Value must be an object');
    }

    // Check required fields
    for (const field of this.requiredFields) {
      if (!(field in value)) {
        throw new Error(`Missing required field: ${field}`);
      }

      if (value[field] === null || value[field] === undefined || value[field] === '') {
        throw new Error(`Field ${field} cannot be empty`);
      }
    }

    return value;
  }
}
```

Usage:

```typescript
@Post()
create(
  @Body(new ObjectValidationPipe(['name', 'email', 'password'])) data: any,
) {
  return this.userService.create(data);
}
```

## Applying Pipes

### 1. Parameter-Level Pipes

Apply to specific parameters:

```typescript
@Controller('users')
export class UserController {
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number, // ✅ Only to this param
    @Query('include', ParseArrayPipe) include: string[],
  ) {
    return this.userService.findById(id, { include });
  }
}
```

### 2. Route-Level Pipes

Apply to all parameters in a route:

```typescript
@Controller('users')
export class UserController {
  @Post()
  @UsePipes(ValidationPipe) // ✅ All parameters
  create(@Body() createUserDto: any, @Query('notify') notify: boolean) {
    return this.userService.create(createUserDto, notify);
  }
}
```

### 3. Controller-Level Pipes

Apply to all routes in controller:

```typescript
@Controller('users')
@UsePipes(SanitizePipe) // ✅ All routes
export class UserController {
  @Post()       // Has pipe
  create() {}

  @Put(':id')   // Has pipe
  update() {}
}
```

### 4. Global Pipes

Apply to all routes in application:

```typescript
// index.ts
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';
import { ValidationPipe } from './pipes/validation.pipe';

const app = await HanFactory.create(AppModule);

// Global pipe
app.useGlobalPipes(new ValidationPipe());

await app.listen(3000);
```

### 5. Multiple Pipes

Chain multiple pipes:

```typescript
@Get(':id')
findOne(
  @Param('id', TrimPipe, ParseIntPipe) id: number,
) {
  return this.userService.findById(id);
}
```

Execution: `TrimPipe → ParseIntPipe → Route Handler`

## Pipes with Dependencies

Inject services into pipes:

```typescript
import { Injectable, Inject } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';
import { UserService } from '../user/user.service';

@Injectable()
export class UniqueEmailPipe implements PipeTransform {
  constructor(private userService: UserService) {}

  async transform(email: string): Promise<string> {
    const existingUser = await this.userService.findByEmail(email);

    if (existingUser) {
      throw new Error('Email already exists');
    }

    return email;
  }
}
```

## Async Pipes

Handle asynchronous validation:

```typescript
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class AsyncValidationPipe implements PipeTransform {
  async transform(value: any): Promise<any> {
    // Async database check
    const isValid = await this.validateInDatabase(value);

    if (!isValid) {
      throw new Error('Validation failed');
    }

    return value;
  }

  private async validateInDatabase(value: any): Promise<boolean> {
    // Database validation logic
    return true;
  }
}
```

## Real-World Example: User Registration

Complete validation pipeline for user registration:

### Create User DTO Validation Pipe

```typescript
// pipes/create-user-validation.pipe.ts
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';
import { UserService } from '../user/user.service';

interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  age?: number;
}

@Injectable()
export class CreateUserValidationPipe implements PipeTransform {
  constructor(private userService: UserService) {}

  async transform(value: CreateUserDto): Promise<CreateUserDto> {
    // Validate required fields
    if (!value.name || !value.email || !value.password) {
      throw new Error('Name, email, and password are required');
    }

    // Validate name
    if (value.name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.email)) {
      throw new Error('Invalid email format');
    }

    // Check email uniqueness
    const existingUser = await this.userService.findByEmail(value.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Validate password
    if (value.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    if (!/[A-Z]/.test(value.password)) {
      throw new Error('Password must contain uppercase letter');
    }

    if (!/[0-9]/.test(value.password)) {
      throw new Error('Password must contain number');
    }

    // Validate age (optional)
    if (value.age !== undefined) {
      if (value.age < 18) {
        throw new Error('Must be 18 or older');
      }

      if (value.age > 120) {
        throw new Error('Invalid age');
      }
    }

    // Sanitize data
    value.name = value.name.trim();
    value.email = value.email.toLowerCase().trim();

    return value;
  }
}
```

### Usage

```typescript
// user.controller.ts
import { Controller, Post, Body } from 'han-prev-core';
import { CreateUserValidationPipe } from './pipes/create-user-validation.pipe';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('register')
  async register(@Body(CreateUserValidationPipe) data: CreateUserDto) {
    // Data is validated and sanitized
    return this.userService.create(data);
  }
}
```

**Valid Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "age": 25
}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Invalid Request:**
```json
{
  "name": "J",
  "email": "invalid-email",
  "password": "weak"
}
```

**Error Response:**
```json
{
  "error": "Name must be at least 2 characters"
}
```

## Best Practices

### 1. Return Transformed Value

Always return a value:

```typescript
// ✅ Good
@Injectable()
export class ParseIntPipe implements PipeTransform {
  transform(value: string): number {
    return parseInt(value, 10);
  }
}

// ❌ Bad
@Injectable()
export class ParseIntPipe implements PipeTransform {
  transform(value: string) {
    parseInt(value, 10); // No return!
  }
}
```

### 2. Single Responsibility

One pipe, one transformation:

```typescript
// ✅ Good - Separate pipes
export class TrimPipe {} // Trim
export class UppercasePipe {} // Uppercase
export class EmailValidationPipe {} // Email validation

// ❌ Bad - Too many responsibilities
export class MegaPipe {
  // Trim + Uppercase + Validation + More
}
```

### 3. Throw Meaningful Errors

```typescript
// ✅ Good
throw new Error('Invalid email format. Must include @ and domain.');

// ❌ Bad
throw new Error('Invalid');
```

### 4. Use Type Annotations

```typescript
// ✅ Good - Clear types
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    return parseInt(value, 10);
  }
}

// ❌ Less clear
export class ParseIntPipe implements PipeTransform {
  transform(value: any): any {
    return parseInt(value, 10);
  }
}
```

### 5. Chain Pipes for Complex Validation

```typescript
// ✅ Good - Small, composable pipes
@Post()
create(
  @Body('email', TrimPipe, LowercasePipe, EmailValidationPipe) email: string,
) {}

// ❌ Bad - One huge pipe
@Post()
create(@Body('email', MegaValidationPipe) email: string) {}
```

## Testing Pipes

Pipes are easy to test:

```typescript
import { ParseIntPipe } from './parse-int.pipe';

describe('ParseIntPipe', () => {
  let pipe: ParseIntPipe;

  beforeEach(() => {
    pipe = new ParseIntPipe();
  });

  it('should parse valid integer', () => {
    expect(pipe.transform('123')).toBe(123);
  });

  it('should throw error for invalid integer', () => {
    expect(() => pipe.transform('abc')).toThrow('Validation failed');
  });

  it('should handle negative numbers', () => {
    expect(pipe.transform('-456')).toBe(-456);
  });
});
```

## Generating Pipes

Use the CLI to generate pipes:

```bash
han generate pipe parse-int
```

Creates `src/pipes/parse-int.pipe.ts`:

```typescript
import { Injectable } from 'han-prev-core';
import { PipeTransform } from 'han-prev-common';

@Injectable()
export class ParseIntPipe implements PipeTransform {
  transform(value: any) {
    return value;
  }
}
```

## Next Steps

- Learn about [Validation](/techniques/validation) for advanced validation with class-validator
- Explore [Guards](/fundamentals/guards) for authorization logic
- Check out [Interceptors](/fundamentals/interceptors) for response transformation

## Quick Reference

```typescript
// 1. Create pipe
@Injectable()
export class MyPipe implements PipeTransform {
  transform(value: any) {
    return transformedValue;
  }
}

// 2. Register in module
@Module({
  providers: [MyPipe],
})
export class MyModule {}

// 3. Apply to parameter
@Get(':id')
findOne(@Param('id', MyPipe) id: any) {}

// 4. Apply to route
@Post()
@UsePipes(MyPipe)
create() {}

// 5. Apply to controller
@Controller('users')
@UsePipes(MyPipe)
export class UserController {}

// 6. Apply globally
app.useGlobalPipes(new MyPipe());

// 7. Chain multiple pipes
@Param('id', TrimPipe, ParseIntPipe)
```

Pipes keep your data clean and validated! ✨
