# Security & Tags

Learn how to add authentication to your API documentation and organize endpoints with tags.

## Security

Document authentication requirements for your API endpoints.

### Bearer Authentication (JWT)

Most common authentication method for modern APIs:

```typescript
import { DocumentBuilder, SwaggerModule } from 'han-prev-openapi';

const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .addBearerAuth()  // Add JWT authentication
  .build();
```

Use in controllers:

```typescript
import { Controller, Get } from 'han-prev-core';
import { ApiBearerAuth, ApiTags } from 'han-prev-openapi';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()  // All endpoints require JWT
export class UserController {
  @Get()
  findAll() {
    return [];
  }

  @Get('public')
  @ApiBearerAuth(false)  // Override: this endpoint is public
  getPublicData() {
    return {};
  }
}
```

### API Key Authentication

For API key-based authentication:

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .addApiKey({
    type: 'apiKey',
    name: 'X-API-Key',
    in: 'header',
  }, 'api-key')
  .build();
```

```typescript
@Controller('data')
@ApiApiKey()
export class DataController {
  @Get()
  getData() {
    return {};
  }
}
```

### Multiple Authentication Methods

Support multiple auth strategies:

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .addBearerAuth()
  .addApiKey({ name: 'X-API-Key', in: 'header' }, 'api-key')
  .addBasicAuth()
  .build();
```

## Tags

Organize your API endpoints with tags for better documentation structure.

### Basic Tags

```typescript
@Controller('users')
@ApiTags('Users')
export class UserController {
  // All methods tagged as 'Users'
}

@Controller('products')
@ApiTags('Products')
export class ProductController {
  // All methods tagged as 'Products'
}
```

### Tag Order

Control the order tags appear in Swagger UI:

#### Method 1: Add Tags in Order

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .addTag('Authentication', 'Auth endpoints')      // Shows first
  .addTag('Users', 'User management')              // Shows second
  .addTag('Products', 'Product catalog')           // Shows third
  .addTag('Orders', 'Order processing')            // Shows fourth
  .addTag('Admin', 'Admin operations')             // Shows last
  .build();
```

#### Method 2: Add Multiple Tags at Once

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .addTagsInOrder([
    { name: 'Authentication', description: 'Auth endpoints' },
    { name: 'Users', description: 'User management' },
    { name: 'Products', description: 'Product catalog' },
    { name: 'Orders', description: 'Order processing' },
    { name: 'Admin', description: 'Admin operations' },
  ])
  .build();
```

#### Method 3: Set Tag Order Explicitly

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .addTag('Users')
  .addTag('Products')
  .addTag('Authentication')
  .setTagOrder(['Authentication', 'Users', 'Products'])  // Reorder!
  .build();
```

#### Method 4: Sort Alphabetically

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .addTag('Zebra')
  .addTag('Apple')
  .addTag('Banana')
  .sortTagsAlphabetically()  // Will order: Apple, Banana, Zebra
  .build();
```

### Tags with External Documentation

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .addTag('Users', 'User management endpoints', {
    url: 'https://docs.example.com/users',
    description: 'Learn more about user management'
  })
  .build();
```

### Multiple Tags per Controller

```typescript
@Controller('admin/users')
@ApiTags('Admin', 'Users')  // Appears in both sections
export class AdminUserController {
  @Get()
  findAll() {
    return [];
  }
}
```

### Complete Example

```typescript
import { HanFactory } from 'han-prev-core';
import { DocumentBuilder, SwaggerModule } from 'han-prev-openapi';

async function bootstrap() {
  const app = await HanFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('API for online store')
    .setVersion('1.0.0')

    // Add authentication
    .addBearerAuth()
    .addApiKey({
      type: 'apiKey',
      name: 'X-API-Key',
      in: 'header',
    }, 'api-key')

    // Add tags in specific order
    .addTagsInOrder([
      {
        name: 'Authentication',
        description: 'Login, register, password reset',
        externalDocs: {
          url: 'https://docs.example.com/auth',
          description: 'Auth documentation'
        }
      },
      { name: 'Users', description: 'User account management' },
      { name: 'Products', description: 'Product catalog' },
      { name: 'Cart', description: 'Shopping cart operations' },
      { name: 'Orders', description: 'Order processing' },
      { name: 'Payments', description: 'Payment handling' },
      { name: 'Admin', description: 'Admin-only endpoints' },
    ])

    .build();

  const document = SwaggerModule.createDocument(app, config, [
    AuthController,
    UserController,
    ProductController,
    CartController,
    OrderController,
    PaymentController,
    AdminController,
  ]);

  SwaggerModule.setup('/api-docs', app, document);

  await app.listen(3000);
}

bootstrap();
```

## Next Steps

- [Types and Parameters](/openapi/types-and-parameters)
- [Operations](/openapi/operations)
- [Decorators Reference](/openapi/decorators)
