# Postman Collection Generator

The **Postman Collection Generator** automatically converts your OpenAPI documentation into a ready-to-use Postman collection. Export your entire API with one click and import it directly into Postman for testing, collaboration, and automation.

## 🎯 What Problem Does It Solve?

### The Problem

When working with APIs, teams often need:

1. **Manual collection creation** - Spend hours manually creating Postman requests
2. **Documentation drift** - Postman collections become outdated as API changes
3. **Collaboration friction** - Hard to share API specs with team members
4. **No automation** - Can't generate collections in CI/CD pipelines

###

 The Solution

Postman Collection Generator gives you:

✅ **One-click export** from Swagger UI
✅ **Always up-to-date** collections (generated from current OpenAPI spec)
✅ **Automatic test scripts** for status codes and response times
✅ **Example responses** from your OpenAPI documentation
✅ **Authentication** configuration included
✅ **Environment variables** for easy customization

## 🚀 Quick Start

### Enable Postman Generator

```typescript
import { HanFactory } from 'han-prev-core';
import { DocumentBuilder, SwaggerModule } from 'han-prev-openapi';

const app = await HanFactory.create(AppModule);

const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .addServer('http://localhost:3000', 'Development')
  .addServer('https://api.example.com', 'Production')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config, [UserController]);

// Enable Postman generation
SwaggerModule.setup('/api-docs', app, document, {
  developerExperience: {
    postmanGenerator: {
      enabled: true,
      includeExamples: true,      // Include example responses
      includeTests: true,          // Generate test scripts
      includeAuth: true,           // Include authentication
      baseUrl: '{{baseUrl}}',      // Use environment variable
      environmentVariables: {
        baseUrl: 'http://localhost:3000',
        bearerToken: 'your-token-here',
      },
    },
  },
});

await app.listen(3000);
```

### Export from Swagger UI

1. Visit `http://localhost:3000/api-docs`
2. Click **"📮 Export to Postman"** in the toolbar
3. Save the downloaded `.json` file
4. Import into Postman: **File → Import → Choose file**

## 📚 Generated Collection Structure

### Collection Info

```json
{
  "info": {
    "name": "My API",
    "description": "API description from OpenAPI spec",
    "version": "1.0",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  }
}
```

### Organized by Tags

If you use `@ApiTags()` decorators:

```typescript
@Controller('users')
@ApiTags('Users')
export class UserController {
  // ...
}

@Controller('posts')
@ApiTags('Posts')
export class PostController {
  // ...
}
```

The generated collection groups requests by tag:

```
My API Collection
├── Users
│   ├── GET /users
│   ├── POST /users
│   ├── GET /users/:id
│   ├── PUT /users/:id
│   └── DELETE /users/:id
└── Posts
    ├── GET /posts
    ├── POST /posts
    └── GET /posts/:id
```

### Request Details

Each request includes:

```json
{
  "name": "Create a new user",
  "request": {
    "method": "POST",
    "url": {
      "raw": "{{baseUrl}}/users",
      "protocol": "http",
      "host": ["{{baseUrl}}"],
      "path": ["users"]
    },
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      },
      {
        "key": "Authorization",
        "value": "Bearer {{bearerToken}}"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"secret123\"\n}",
      "options": {
        "raw": {
          "language": "json"
        }
      }
    }
  }
}
```

### Automatic Test Scripts

If `includeTests: true`, each request gets test scripts:

```javascript
pm.test("Status code is 201", function () {
  pm.response.to.have.status(201);
});

pm.test("Response time is less than 500ms", function () {
  pm.expect(pm.response.responseTime).to.be.below(500);
});

pm.test("Response is JSON", function () {
  pm.response.to.be.json;
});
```

### Example Responses

If `includeExamples: true`, each request includes example responses:

```json
{
  "response": [
    {
      "name": "Success",
      "originalRequest": { /* ... */ },
      "status": "Created",
      "code": 201,
      "header": [
        {
          "key": "Content-Type",
          "value": "application/json"
        }
      ],
      "body": "{\n  \"id\": \"user_123\",\n  \"email\": \"user@example.com\"\n}"
    }
  ]
}
```

## 🔐 Authentication

### Bearer Token

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .addBearerAuth()
  .build();

SwaggerModule.setup('/api-docs', app, document, {
  developerExperience: {
    postmanGenerator: {
      enabled: true,
      includeAuth: true,
      environmentVariables: {
        bearerToken: 'your-token-here',
      },
    },
  },
});
```

Generated collection includes:

```json
{
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{bearerToken}}",
        "type": "string"
      }
    ]
  }
}
```

### API Key

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' })
  .build();
```

Generated collection includes:

```json
{
  "auth": {
    "type": "apikey",
    "apikey": [
      {
        "key": "key",
        "value": "X-API-Key",
        "type": "string"
      },
      {
        "key": "value",
        "value": "{{apiKey}}",
        "type": "string"
      }
    ]
  }
}
```

### Basic Authentication

```typescript
const config = new DocumentBuilder()
  .setTitle('My API')
  .addBasicAuth()
  .build();
```

Generated collection includes:

```json
{
  "auth": {
    "type": "basic",
    "basic": [
      {
        "key": "username",
        "value": "{{username}}",
        "type": "string"
      },
      {
        "key": "password",
        "value": "{{password}}",
        "type": "string"
      }
    ]
  }
}
```

## 🌍 Environment Variables

### Define Variables

```typescript
SwaggerModule.setup('/api-docs', app, document, {
  developerExperience: {
    postmanGenerator: {
      enabled: true,
      environmentVariables: {
        baseUrl: 'http://localhost:3000',
        bearerToken: 'dev-token-123',
        apiKey: 'test-api-key',
        userId: 'user_123',
      },
    },
  },
});
```

### Generated Variables

```json
{
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "bearerToken",
      "value": "dev-token-123",
      "type": "string"
    },
    {
      "key": "apiKey",
      "value": "test-api-key",
      "type": "string"
    },
    {
      "key": "userId",
      "value": "user_123",
      "type": "string"
    }
  ]
}
```

### Use in Requests

Variables are automatically used in:

- URLs: `{{baseUrl}}/users`
- Headers: `Authorization: Bearer {{bearerToken}}`
- Path parameters: `/users/{{userId}}`
- Query parameters: `?api_key={{apiKey}}`

## 🎨 Programmatic Generation

### Generate Collection

```typescript
import { PostmanGenerator } from 'han-prev-openapi';

const generator = new PostmanGenerator({
  includeExamples: true,
  includeTests: true,
  includeAuth: true,
  baseUrl: 'http://localhost:3000',
});

// Get your OpenAPI document
const openApiDoc = SwaggerModule.createDocument(app, config, controllers);

// Generate Postman collection
const collection = generator.generateCollection(openApiDoc);

// Export as JSON string
const jsonString = generator.exportAsJson(collection);

// Save to file
const fs = require('fs');
fs.writeFileSync('my-api.postman_collection.json', jsonString);
```

### Download in Browser

```typescript
// In your controller or service
@Get('/export/postman')
exportPostmanCollection() {
  const generator = new PostmanGenerator();
  const collection = generator.generateCollection(this.openApiDoc);

  // Set headers for file download
  return {
    filename: 'my-api.postman_collection.json',
    content: generator.exportAsJson(collection),
  };
}
```

## 📦 Configuration Options

```typescript
interface PostmanGeneratorConfig {
  enabled: boolean;                         // Enable/disable the feature
  includeExamples?: boolean;                // Include example responses (default: true)
  includeTests?: boolean;                   // Generate test scripts (default: true)
  includeAuth?: boolean;                    // Include authentication (default: true)
  baseUrl?: string;                         // Base URL for requests (default: '{{baseUrl}}')
  environmentVariables?: Record<string, string>;  // Environment variables
}
```

### Minimal Configuration

```typescript
SwaggerModule.setup('/api-docs', app, document, {
  developerExperience: {
    postmanGenerator: {
      enabled: true,
    },
  },
});
```

### Full Configuration

```typescript
SwaggerModule.setup('/api-docs', app, document, {
  developerExperience: {
    postmanGenerator: {
      enabled: true,
      includeExamples: true,
      includeTests: true,
      includeAuth: true,
      baseUrl: '{{baseUrl}}',
      environmentVariables: {
        baseUrl: 'http://localhost:3000',
        bearerToken: 'your-token',
        apiKey: 'your-api-key',
      },
    },
  },
});
```

## 🔄 CI/CD Integration

### Generate in Build Pipeline

```typescript
// scripts/generate-postman.ts
import { HanFactory } from 'han-prev-core';
import { DocumentBuilder, SwaggerModule, PostmanGenerator } from 'han-prev-openapi';
import { AppModule } from './src/app.module';
import * as fs from 'fs';

async function generatePostmanCollection() {
  const app = await HanFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('My API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config, controllers);

  const generator = new PostmanGenerator({
    includeExamples: true,
    includeTests: true,
    baseUrl: 'https://api.example.com',
  });

  const collection = generator.generateCollection(document);
  const json = generator.exportAsJson(collection);

  fs.writeFileSync('./dist/my-api.postman_collection.json', json);
  console.log('✅ Postman collection generated!');

  await app.close();
}

generatePostmanCollection();
```

### Package.json Script

```json
{
  "scripts": {
    "generate:postman": "ts-node scripts/generate-postman.ts",
    "build": "npm run generate:postman && tsc"
  }
}
```

### GitHub Actions

```yaml
name: Generate API Docs

on:
  push:
    branches: [main]

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run generate:postman
      - uses: actions/upload-artifact@v2
        with:
          name: postman-collection
          path: dist/my-api.postman_collection.json
```

## 🎯 Real-World Example

### Complete Setup

```typescript
// main.ts
import { HanFactory } from 'han-prev-core';
import { DocumentBuilder, SwaggerModule } from 'han-prev-openapi';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HanFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('E-Commerce API')
    .setDescription('Complete e-commerce platform API')
    .setVersion('2.0')
    .addServer('http://localhost:3000', 'Development')
    .addServer('https://api.example.com', 'Production')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' })
    .addTag('Users', 'User management endpoints')
    .addTag('Products', 'Product catalog endpoints')
    .addTag('Orders', 'Order processing endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config, [
    UserController,
    ProductController,
    OrderController,
  ]);

  SwaggerModule.setup('/api-docs', app, document, {
    customSiteTitle: 'E-Commerce API Docs',
    developerExperience: {
      postmanGenerator: {
        enabled: true,
        includeExamples: true,
        includeTests: true,
        includeAuth: true,
        baseUrl: '{{baseUrl}}',
        environmentVariables: {
          baseUrl: 'http://localhost:3000',
          bearerToken: 'test-token-123',
          apiKey: 'test-api-key-456',
        },
      },
    },
  });

  await app.listen(3000);
  console.log('🚀 Server running on http://localhost:3000');
  console.log('📚 API docs at http://localhost:3000/api-docs');
  console.log('📮 Click "Export to Postman" to download collection');
}

bootstrap();
```

### Generated Collection Features

The exported collection will have:

✅ **3 folders** (Users, Products, Orders)
✅ **All endpoints** from your controllers
✅ **Example requests** with proper JSON bodies
✅ **Example responses** (200, 201, 400, 404, etc.)
✅ **Authentication** (Bearer + API Key)
✅ **Test scripts** for all requests
✅ **Environment variables** ready to customize

## 🛠️ Advanced Features

### Custom Request Names

```typescript
@Post()
@ApiOperation({
  summary: 'Create a new user account',  // Used as Postman request name
  description: 'Detailed description appears in request docs'
})
createUser() {}
```

### Multiple Servers

```typescript
const config = new DocumentBuilder()
  .addServer('http://localhost:3000', 'Development')
  .addServer('https://staging.example.com', 'Staging')
  .addServer('https://api.example.com', 'Production')
  .build();
```

Postman collection will use the first server by default, but you can easily switch using environment variables.

### Query Parameters

```typescript
@Get()
@ApiQuery({ name: 'page', type: 'number', required: false })
@ApiQuery({ name: 'limit', type: 'number', required: false })
findAll(@Query('page') page: number, @Query('limit') limit: number) {}
```

Generated request includes:

```
GET {{baseUrl}}/users?page=1&limit=10
```

### Path Parameters

```typescript
@Get(':id')
@ApiParam({ name: 'id', type: 'string' })
findOne(@Param('id') id: string) {}
```

Generated request includes:

```
GET {{baseUrl}}/users/{{userId}}
```

## 📊 Comparison with Manual Creation

### Manual Postman Collection

❌ **30 minutes** to create 10 endpoints
❌ **Outdated** within days
❌ **No examples** or test scripts
❌ **Hard to share** with team
❌ **Manual updates** required

### Auto-Generated Collection

✅ **1 second** to export entire API
✅ **Always up-to-date** with code
✅ **Automatic examples** and tests
✅ **Easy sharing** via file export
✅ **Zero maintenance**

## 🎉 Summary

Postman Collection Generator gives you:

✅ **One-click export** from Swagger UI
✅ **Complete Postman collections** with all endpoints
✅ **Automatic test scripts** for validation
✅ **Example responses** from OpenAPI spec
✅ **Authentication setup** included
✅ **Environment variables** for flexibility
✅ **CI/CD integration** for automation

Perfect for API testing, team collaboration, and documentation!

## Next Steps

- [Request Chaining](/openapi/request-chaining) - Chain multiple requests together
- [Code Examples](/openapi/code-examples) - Generate client code in 10+ languages
- [Operations](/openapi/operations) - Document your API endpoints
