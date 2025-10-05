# Types and Parameters

Learn how to document your DTOs (Data Transfer Objects) and define API schemas using decorators. Han OpenAPI automatically generates OpenAPI schemas from your TypeScript classes.

## Basic Property Documentation

Use `@ApiProperty()` to document class properties:

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
    maximum: 100,
    example: 25
  })
  age: number;

  @ApiProperty({
    description: 'User full name',
    minLength: 2,
    maxLength: 50
  })
  name: string;
}
```

This generates:

```json
{
  "type": "object",
  "properties": {
    "email": {
      "type": "string",
      "description": "User email address",
      "example": "john@example.com"
    },
    "age": {
      "type": "number",
      "description": "User age",
      "minimum": 18,
      "maximum": 100,
      "example": 25
    },
    "name": {
      "type": "string",
      "description": "User full name",
      "minLength": 2,
      "maxLength": 50
    }
  },
  "required": ["email", "age", "name"]
}
```

## Type Detection

Han OpenAPI automatically detects types from TypeScript:

```typescript
export class ProductDto {
  @ApiProperty() id: string;           // ← Auto-detected as string
  @ApiProperty() name: string;         // ← Auto-detected as string
  @ApiProperty() price: number;        // ← Auto-detected as number
  @ApiProperty() inStock: boolean;     // ← Auto-detected as boolean
  @ApiProperty() createdAt: Date;      // ← Auto-detected as string (date-time format)
}
```

You can override the auto-detection:

```typescript
export class UserDto {
  @ApiProperty({ type: 'string', format: 'uuid' })
  id: string;

  @ApiProperty({ type: 'integer' })  // Specify integer instead of number
  age: number;
}
```

## Optional Properties

### Using `@ApiPropertyOptional()`

```typescript
export class UpdateUserDto {
  @ApiProperty({ description: 'User ID (required)' })
  id: string;

  @ApiPropertyOptional({ description: 'New email address' })
  email?: string;

  @ApiPropertyOptional({ description: 'New age' })
  age?: number;

  @ApiPropertyOptional({ description: 'New name' })
  name?: string;
}
```

### Using `required: false`

```typescript
export class UpdateUserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Email', required: false })
  email?: string;

  @ApiProperty({ description: 'Age', required: false })
  age?: number;
}
```

## Property Validation

### String Validation

```typescript
export class CreatePostDto {
  @ApiProperty({
    description: 'Post title',
    minLength: 5,
    maxLength: 100,
    pattern: '^[a-zA-Z0-9 ]+$',  // Alphanumeric only
    example: 'My First Post'
  })
  title: string;

  @ApiProperty({
    description: 'Post content',
    minLength: 10,
    maxLength: 5000
  })
  content: string;

  @ApiProperty({
    description: 'URL slug',
    pattern: '^[a-z0-9-]+$',
    example: 'my-first-post'
  })
  slug: string;
}
```

### Number Validation

```typescript
export class CreateProductDto {
  @ApiProperty({
    description: 'Product price',
    type: 'number',
    minimum: 0,
    maximum: 999999.99,
    example: 29.99
  })
  price: number;

  @ApiProperty({
    description: 'Discount percentage',
    minimum: 0,
    maximum: 100,
    example: 15
  })
  discount: number;

  @ApiProperty({
    description: 'Stock quantity',
    type: 'integer',
    minimum: 0,
    example: 100
  })
  stock: number;
}
```

## Enums

### Using `@ApiPropertyEnum()`

```typescript
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

export class CreateUserDto {
  @ApiProperty() email: string;

  @ApiPropertyEnum(UserRole, {
    description: 'User role',
    example: UserRole.USER
  })
  role: UserRole;
}
```

### Using `enum` option

```typescript
export class UpdateUserDto {
  @ApiProperty({
    description: 'User status',
    enum: ['active', 'inactive', 'pending'],
    example: 'active'
  })
  status: string;
}
```

## Arrays

### Simple Arrays

```typescript
export class CreatePostDto {
  @ApiProperty() title: string;

  @ApiPropertyArray({
    description: 'Post tags',
    example: ['typescript', 'nodejs', 'api']
  })
  tags: string[];

  @ApiPropertyArray({
    description: 'Category IDs',
    items: { type: 'integer' },
    example: [1, 2, 3]
  })
  categoryIds: number[];
}
```

### Arrays of Objects

```typescript
class AddressDto {
  @ApiProperty() street: string;
  @ApiProperty() city: string;
  @ApiProperty() country: string;
}

export class CreateUserDto {
  @ApiProperty() name: string;

  @ApiPropertyArray({
    description: 'User addresses',
    items: { $ref: '#/components/schemas/AddressDto' }
  })
  addresses: AddressDto[];
}
```

### Using `type: 'array'`

```typescript
export class ProductDto {
  @ApiProperty({ type: 'array', items: { type: 'string' } })
  images: string[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        value: { type: 'string' }
      }
    }
  })
  attributes: Array<{ name: string; value: string }>;
}
```

## Nested Objects

### Simple Nested Objects

```typescript
class AddressDto {
  @ApiProperty() street: string;
  @ApiProperty() city: string;
  @ApiProperty() zipCode: string;
}

export class UserDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ type: () => AddressDto })
  address: AddressDto;
}
```

### Complex Nested Structures

```typescript
class SocialLinksDto {
  @ApiPropertyOptional() twitter?: string;
  @ApiPropertyOptional() github?: string;
  @ApiPropertyOptional() linkedin?: string;
}

class ProfileDto {
  @ApiProperty() bio: string;
  @ApiProperty() avatar: string;
  @ApiProperty({ type: () => SocialLinksDto })
  socialLinks: SocialLinksDto;
}

export class UserDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty({ type: () => ProfileDto })
  profile: ProfileDto;
}
```

## Advanced Types

### Union Types

```typescript
export class PaymentDto {
  @ApiProperty({
    description: 'Payment amount',
    oneOf: [
      { type: 'number' },
      { type: 'string', pattern: '^\\d+\\.\\d{2}$' }
    ],
    example: 99.99
  })
  amount: number | string;
}
```

### Nullable Properties

```typescript
export class UserDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;

  @ApiProperty({
    description: 'Last login timestamp',
    type: 'string',
    format: 'date-time',
    nullable: true,
    example: null
  })
  lastLogin: Date | null;
}
```

### Read-Only and Write-Only

```typescript
export class UserDto {
  @ApiProperty({
    description: 'User ID',
    readOnly: true,  // Only in responses
    example: '123'
  })
  id: string;

  @ApiProperty({
    description: 'Password',
    writeOnly: true,  // Only in requests
    minLength: 8
  })
  password: string;

  @ApiProperty({ readOnly: true })
  createdAt: Date;

  @ApiProperty({ readOnly: true })
  updatedAt: Date;
}
```

## Default Values

```typescript
export class CreateProductDto {
  @ApiProperty() name: string;

  @ApiProperty({
    description: 'Product visibility',
    default: true,
    example: true
  })
  isPublic: boolean = true;

  @ApiProperty({
    description: 'Stock quantity',
    default: 0,
    minimum: 0
  })
  stock: number = 0;
}
```

## Examples

### Single Example

```typescript
export class CreateOrderDto {
  @ApiProperty({
    description: 'Product IDs',
    example: ['prod-1', 'prod-2', 'prod-3']
  })
  productIds: string[];

  @ApiProperty({
    description: 'Shipping address',
    example: {
      street: '123 Main St',
      city: 'New York',
      country: 'USA'
    }
  })
  shippingAddress: object;
}
```

### Multiple Examples

```typescript
export class CreateUserDto {
  @ApiProperty({
    description: 'User email',
    examples: {
      standard: { value: 'user@example.com' },
      admin: { value: 'admin@company.com' },
      test: { value: 'test@test.com' }
    }
  })
  email: string;
}
```

## Deprecated Properties

```typescript
export class UserDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;

  @ApiProperty({
    description: 'Username (deprecated, use email instead)',
    deprecated: true
  })
  username: string;
}
```

## Complete Example

```typescript
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiPropertyArray,
  ApiPropertyEnum
} from 'han-prev-openapi';

enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

class OrderItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'prod-123'
  })
  productId: string;

  @ApiProperty({
    description: 'Quantity',
    minimum: 1,
    maximum: 100,
    example: 2
  })
  quantity: number;

  @ApiProperty({
    description: 'Unit price',
    minimum: 0,
    example: 29.99
  })
  price: number;
}

class ShippingAddressDto {
  @ApiProperty({ example: '123 Main St' })
  street: string;

  @ApiProperty({ example: 'New York' })
  city: string;

  @ApiProperty({ example: 'NY' })
  state: string;

  @ApiProperty({ example: '10001', pattern: '^\\d{5}$' })
  zipCode: string;

  @ApiProperty({ example: 'USA' })
  country: string;
}

export class CreateOrderDto {
  @ApiPropertyArray({
    description: 'Order items',
    items: { $ref: '#/components/schemas/OrderItemDto' },
    minItems: 1
  })
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Shipping address',
    type: () => ShippingAddressDto
  })
  shippingAddress: ShippingAddressDto;

  @ApiPropertyEnum(OrderStatus, {
    description: 'Order status',
    default: OrderStatus.PENDING
  })
  status: OrderStatus = OrderStatus.PENDING;

  @ApiPropertyOptional({
    description: 'Order notes',
    maxLength: 500
  })
  notes?: string;

  @ApiPropertyArray({
    description: 'Discount codes',
    items: { type: 'string' },
    required: false,
    example: ['SUMMER20', 'FIRSTORDER']
  })
  discountCodes?: string[];

  @ApiProperty({
    description: 'Express shipping',
    default: false
  })
  expressShipping: boolean = false;
}

export class OrderResponseDto {
  @ApiProperty({
    description: 'Order ID',
    readOnly: true,
    example: 'order-12345'
  })
  id: string;

  @ApiProperty({
    description: 'Order items',
    type: () => [OrderItemDto]
  })
  items: OrderItemDto[];

  @ApiProperty({ type: () => ShippingAddressDto })
  shippingAddress: ShippingAddressDto;

  @ApiPropertyEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({
    description: 'Total amount',
    readOnly: true,
    example: 99.99
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Order creation timestamp',
    readOnly: true,
    type: 'string',
    format: 'date-time'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    readOnly: true,
    type: 'string',
    format: 'date-time'
  })
  updatedAt: Date;
}
```

## Type Formats

Common format values:

| Type | Format | Example |
|------|--------|---------|
| string | `date-time` | `2024-01-01T00:00:00Z` |
| string | `date` | `2024-01-01` |
| string | `time` | `12:00:00` |
| string | `email` | `user@example.com` |
| string | `uuid` | `123e4567-e89b-12d3-a456-426614174000` |
| string | `uri` | `https://example.com` |
| string | `hostname` | `example.com` |
| string | `ipv4` | `192.168.1.1` |
| string | `ipv6` | `2001:0db8::1` |
| number | `float` | `3.14` |
| number | `double` | `3.141592653589793` |
| integer | `int32` | `2147483647` |
| integer | `int64` | `9223372036854775807` |

## Best Practices

### 1. Always Add Descriptions

```typescript
// ✅ Good
@ApiProperty({ description: 'User email address' })
email: string;

// ❌ Missing context
@ApiProperty()
email: string;
```

### 2. Provide Examples

```typescript
// ✅ Good
@ApiProperty({
  description: 'User age',
  example: 25,
  minimum: 18
})
age: number;
```

### 3. Use Appropriate Types

```typescript
// ✅ Good
@ApiProperty({ type: 'integer' })
quantity: number;

// ✅ Good
@ApiProperty({ type: 'string', format: 'email' })
email: string;
```

### 4. Document Constraints

```typescript
// ✅ Good
@ApiProperty({
  description: 'Username',
  minLength: 3,
  maxLength: 20,
  pattern: '^[a-zA-Z0-9_]+$'
})
username: string;
```

## Next Steps

- [Operations](/openapi/operations) - Document API endpoints
- [Security](/openapi/security) - Add authentication
- [Decorators](/openapi/decorators) - Full decorator reference

Complete your API documentation by documenting all DTOs with clear descriptions, examples, and validation rules!
