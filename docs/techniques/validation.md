# Validation

Learn how to validate incoming data in your Han Framework application to ensure data integrity and security.

## Why Validation?

**Never trust user input!** Validation is your first line of defense against bad data and security vulnerabilities.

### The Problem Without Validation

```typescript
// ❌ Dangerous - No validation
@Post('users')
create(@Body() userData: any) {
  // What if email is missing?
  // What if age is -100?
  // What if name contains SQL injection?
  await this.userService.create(userData);
}
```

**What could go wrong:**
- 💥 Database errors from invalid data
- 🔓 SQL injection attacks
- 🐛 Application crashes
- 😡 Poor user experience (vague errors)
- 🗃️ Data corruption

### The Solution: Automatic Validation

```typescript
// ✅ Safe - Automatic validation with DTOs
@Post('users')
create(@Body() userData: CreateUserDto) {
  // userData is guaranteed to be valid!
  return this.userService.create(userData);
}
```

**Benefits:**
- 🛡️ **Security** - Prevents injection attacks and malicious input
- ✅ **Data Integrity** - Only valid data reaches your database
- 📝 **Clear Errors** - Users get helpful error messages
- 🎯 **Type Safety** - TypeScript knows exactly what's in your data
- 🧹 **Clean Code** - Validation logic separated from business logic

## Using Pipes for Validation

Pipes transform and validate data before it reaches route handlers.

### Built-in Validation Pipe

```typescript
import { Controller, Post, Body, ValidationPipe } from 'han-prev-core';

@Controller('users')
export class UserController {
  @Post()
  create(@Body(ValidationPipe) userData: any) {
    return userData;
  }
}
```

## Class Validator (Recommended)

**What is it?** A decorator-based validation library that makes validation declarative and easy to read.

Install dependencies:

```bash
npm install class-validator class-transformer
```

### Creating DTOs (Data Transfer Objects)

**What are DTOs?** DTOs are classes that define the shape and validation rules for incoming data. Think of them as contracts that incoming data must satisfy.

**Why use DTOs?**
- 📋 **Self-documenting** - Validation rules are clear from the code
- 🔄 **Reusable** - Use the same DTO across multiple endpoints
- 🎯 **Type-safe** - Full TypeScript support
- 🧪 **Testable** - Easy to test validation logic

```typescript
// dto/create-user.dto.ts
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(50, { message: 'Name cannot exceed 50 characters' })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(100)
  password: string;

  @IsOptional() // This field is optional
  @IsInt({ message: 'Age must be a number' })
  @Min(13, { message: 'Must be at least 13 years old' })
  @Max(120, { message: 'Age seems invalid' })
  age?: number;
}
```

::: tip Custom Error Messages
Always provide custom error messages to help users understand what went wrong!
:::

### Using DTOs in Controllers

```typescript
import { Controller, Post, Body } from 'han-prev-core';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UserController {
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    // Data is already validated
    return this.userService.create(createUserDto);
  }
}
```

## Common Validators

### String Validators

```typescript
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Contains,
  IsAlpha,
  IsAlphanumeric,
  IsAscii,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class StringValidationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @MinLength(10)
  @MaxLength(200)
  description: string;

  @Contains('hello')
  greeting: string;

  @IsAlpha()
  alphabeticOnly: string;

  @IsAlphanumeric()
  alphanumericOnly: string;

  @IsUrl()
  website: string;

  @IsUUID()
  id: string;
}
```

### Number Validators

```typescript
import {
  IsNumber,
  IsInt,
  IsPositive,
  IsNegative,
  Min,
  Max,
  IsDivisibleBy,
} from 'class-validator';

export class NumberValidationDto {
  @IsNumber()
  price: number;

  @IsInt()
  quantity: number;

  @IsPositive()
  discount: number;

  @Min(0)
  @Max(100)
  percentage: number;

  @IsDivisibleBy(5)
  rating: number;
}
```

### Date Validators

```typescript
import {
  IsDate,
  MinDate,
  MaxDate,
} from 'class-validator';

export class DateValidationDto {
  @IsDate()
  birthDate: Date;

  @MinDate(new Date('2020-01-01'))
  startDate: Date;

  @MaxDate(new Date('2025-12-31'))
  endDate: Date;
}
```

### Array Validators

```typescript
import {
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ArrayNotEmpty,
  ArrayUnique,
} from 'class-validator';

export class ArrayValidationDto {
  @IsArray()
  @ArrayNotEmpty()
  tags: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  categories: string[];

  @IsArray()
  @ArrayUnique()
  uniqueItems: string[];
}
```

### Nested Object Validation

```typescript
import { ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  country: string;
}

export class CreateUserDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
```

## Custom Validators

### Creating Custom Validator

```typescript
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*]/.test(value);

          return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Password must contain uppercase, lowercase, number, and special character';
        },
      },
    });
  };
}

// Usage
export class CreateUserDto {
  @IsStrongPassword()
  password: string;
}
```

### Custom Async Validator

```typescript
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: true })
class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
  async validate(email: string) {
    const user = await User.findOne({ email });
    return !user;
  }

  defaultMessage() {
    return 'Email already exists';
  }
}

export function IsEmailUnique(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailUniqueConstraint,
    });
  };
}

// Usage
export class CreateUserDto {
  @IsEmail()
  @IsEmailUnique()
  email: string;
}
```

## Validation Groups

```typescript
import { IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString({ groups: ['create'] })
  name: string;

  @IsString({ groups: ['create', 'update'] })
  @MinLength(8, { groups: ['create'] })
  password: string;
}

// Validate with specific group
import { validate } from 'class-validator';

const dto = new UpdateUserDto();
const errors = await validate(dto, { groups: ['update'] });
```

## Conditional Validation

```typescript
import { IsString, IsEmail, ValidateIf } from 'class-validator';

export class ContactDto {
  @IsString()
  contactMethod: 'email' | 'phone';

  @ValidateIf(o => o.contactMethod === 'email')
  @IsEmail()
  email?: string;

  @ValidateIf(o => o.contactMethod === 'phone')
  @IsString()
  phone?: string;
}
```

## Validation Pipe Implementation

```typescript
// pipes/validation.pipe.ts
import { Injectable, PipeTransform } from 'han-prev-core';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, metadata: any) {
    if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    const object = plainToClass(metadata.metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map(err => ({
        property: err.property,
        constraints: err.constraints,
      }));

      throw new Error(`Validation failed: ${JSON.stringify(messages)}`);
    }

    return object;
  }

  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

## Manual Validation

```typescript
import { validate } from 'class-validator';
import { CreateUserDto } from './dto/create-user.dto';

async function validateUser(data: any) {
  const dto = Object.assign(new CreateUserDto(), data);
  const errors = await validate(dto);

  if (errors.length > 0) {
    console.log('Validation errors:', errors);
    return false;
  }

  return true;
}
```

## Sanitization

### Transforming Input

```typescript
import { Transform } from 'class-transformer';
import { IsString, IsEmail } from 'class-validator';

export class CreateUserDto {
  @Transform(({ value }) => value.trim())
  @IsString()
  name: string;

  @Transform(({ value }) => value.toLowerCase())
  @IsEmail()
  email: string;

  @Transform(({ value }) => parseInt(value, 10))
  age: number;
}
```

### Sanitizing HTML

```typescript
import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

export class CreatePostDto {
  @Transform(({ value }) => sanitizeHtml(value))
  @IsString()
  content: string;
}
```

## Validation Error Handling

### Custom Error Messages

```typescript
import { IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  password: string;
}
```

### Error Formatting

```typescript
import { validate, ValidationError } from 'class-validator';

function formatErrors(errors: ValidationError[]) {
  return errors.reduce((acc, err) => {
    acc[err.property] = Object.values(err.constraints || {});
    return acc;
  }, {} as Record<string, string[]>);
}

// Usage
const errors = await validate(dto);
const formatted = formatErrors(errors);
// { email: ['Email must be valid'], password: ['Password too short'] }
```

## Real-World Examples

### User Registration DTO

```typescript
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'Name can only contain letters and spaces',
  })
  name: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phone?: string;

  @IsEnum(['user', 'admin'], {
    message: 'Role must be either user or admin',
  })
  role: string;
}
```

### Product Creation DTO

```typescript
import {
  IsString,
  IsNumber,
  IsPositive,
  Min,
  Max,
  IsArray,
  ArrayMinSize,
  IsUrl,
  IsOptional,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(0)
  @Max(10000)
  stock: number;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  categories: string[];

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
```

## Best Practices

### 1. Use DTOs

```typescript
// ✅ Good - Type-safe with validation
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return this.userService.create(createUserDto);
}

// ❌ Bad - No validation or types
@Post()
create(@Body() body: any) {
  return this.userService.create(body);
}
```

### 2. Validate Early

```typescript
// ✅ Good - Validate at controller level
@Post()
create(@Body(ValidationPipe) dto: CreateUserDto) { }

// ❌ Bad - Validate in service
create(data: any) {
  if (!data.email) throw new Error();
}
```

### 3. Clear Error Messages

```typescript
// ✅ Good
@IsEmail({}, { message: 'Please provide a valid email' })
email: string;

// ❌ Bad
@IsEmail()
email: string; // Generic error message
```

### 4. Sanitize Input

```typescript
// ✅ Good
@Transform(({ value }) => value.trim())
@Transform(({ value }) => sanitizeHtml(value))
content: string;

// ❌ Bad - No sanitization
content: string;
```

## Testing Validation

```typescript
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  it('should validate a valid user', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with invalid email', async () => {
    const dto = Object.assign(new CreateUserDto(), {
      name: 'John Doe',
      email: 'invalid-email',
      password: 'Password123!',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });
});
```

## Quick Reference

```typescript
// Common validators
@IsString()
@IsNumber()
@IsBoolean()
@IsDate()
@IsArray()
@IsEmail()
@IsUrl()
@IsUUID()

// String constraints
@MinLength(5)
@MaxLength(100)
@Contains('text')
@IsAlpha()
@IsAlphanumeric()

// Number constraints
@Min(0)
@Max(100)
@IsPositive()
@IsNegative()
@IsDivisibleBy(5)

// Array constraints
@ArrayMinSize(1)
@ArrayMaxSize(10)
@ArrayNotEmpty()
@ArrayUnique()

// Other
@IsOptional()
@IsEnum(['value1', 'value2'])
@ValidateNested()
@ValidateIf(condition)
```

## Next Steps

- Learn about [Pipes](/fundamentals/pipes) for data transformation
- Explore [Exception Filters](/fundamentals/exception-filters) for error handling
- Check out [Security](/techniques/security) for securing your application

Validation ensures your application handles only valid, safe data! ✅
