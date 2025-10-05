# Request Chaining Playground

The **Request Chaining Playground** is a powerful feature that allows you to chain multiple API requests together, automatically extracting data from one response to use in subsequent requests. Perfect for testing complex workflows like user authentication → data fetching → resource creation.

## 🎯 What Problem Does It Solve?

### The Problem

When testing APIs, you often need to:

1. **Create a user** → Get the user ID
2. **Login with that user** → Get an auth token
3. **Create a post** using the auth token → Get the post ID
4. **Upload an image** to that post
5. **Fetch the post** to verify everything worked

Without request chaining, you must:
- Manually copy IDs/tokens from one response
- Paste them into the next request
- Repeat this for every test
- Lose all progress if you refresh the page

### The Solution

Request Chaining Playground lets you:

✅ **Save requests** automatically to localStorage
✅ **Extract variables** from responses (IDs, tokens, etc.)
✅ **Chain requests** with automatic variable injection
✅ **Persist data** across browser refreshes
✅ **Reuse workflows** without manual copying

## 🚀 Quick Start

### Enable Request Chaining

```typescript
import { HanFactory } from 'han-prev-core';
import { DocumentBuilder, SwaggerModule } from 'han-prev-openapi';

const app = await HanFactory.create(AppModule);

const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .build();

const document = SwaggerModule.createDocument(app, config, [UserController]);

// Enable Developer Experience features
SwaggerModule.setup('/api-docs', app, document, {
  developerExperience: {
    requestChaining: {
      enabled: true,
      autoSave: true,             // Auto-save every request
      maxSavedRequests: 100,      // Max requests to keep
      maxChains: 50,              // Max chains to keep
    },
  },
});

await app.listen(3000);
```

### Use in Swagger UI

1. Visit `http://localhost:3000/api-docs`
2. Execute any request
3. Click **"💾 Saved Requests"** in the toolbar to view saved requests
4. Requests persist even after browser refresh!

## 📚 How It Works

### Automatic Request Saving

Every request you execute in Swagger UI is automatically saved:

```typescript
{
  id: "1234567890-abc123",
  name: "POST /users",
  endpoint: "/users",
  method: "POST",
  timestamp: "2024-10-05T10:30:00Z",
  request: {
    body: { email: "user@example.com", password: "secret123" }
  },
  response: {
    status: 201,
    body: { id: "user_123", email: "user@example.com" },
    duration: 45
  }
}
```

### localStorage Persistence

All data is saved to localStorage:

```javascript
// Data persists across:
✅ Page refreshes
✅ Browser restarts
✅ Different tabs (same domain)

// Data is cleared when:
❌ You click "Clear All"
❌ You clear browser data
❌ localStorage is manually cleared
```

## 🔗 Creating Request Chains

### Step 1: Save Individual Requests

Execute these requests in Swagger UI:

```typescript
// 1. Create a user
POST /users
{
  "email": "john@example.com",
  "password": "secret123"
}

// Response: { "id": "user_123", "email": "john@example.com" }

// 2. Login
POST /auth/login
{
  "email": "john@example.com",
  "password": "secret123"
}

// Response: { "token": "eyJhbGc..." }

// 3. Create a post
POST /posts
Headers: { "Authorization": "Bearer eyJhbGc..." }
{
  "title": "My First Post",
  "content": "Hello World"
}

// Response: { "id": "post_456", "title": "My First Post" }
```

### Step 2: Build a Chain Programmatically

```typescript
import { getChainStorage, ChainExecutor } from 'han-prev-openapi';

const storage = getChainStorage();

// Create a request chain
const chain: RequestChain = {
  id: 'user-workflow',
  name: 'User Registration & First Post',
  description: 'Creates user, logs in, and creates first post',
  createdAt: new Date(),
  updatedAt: new Date(),
  requests: [
    // Step 1: Create User
    {
      id: 'step-1',
      endpoint: '/users',
      method: 'POST',
      order: 1,
      config: {
        body: {
          email: 'john@example.com',
          password: 'secret123',
        },
      },
      variableExtraction: [
        {
          name: 'userId',
          source: 'response.body',
          path: 'id',
        },
      ],
    },

    // Step 2: Login
    {
      id: 'step-2',
      endpoint: '/auth/login',
      method: 'POST',
      order: 2,
      config: {
        body: {
          email: 'john@example.com',
          password: 'secret123',
        },
      },
      variableExtraction: [
        {
          name: 'authToken',
          source: 'response.body',
          path: 'token',
        },
      ],
    },

    // Step 3: Create Post (using extracted token)
    {
      id: 'step-3',
      endpoint: '/posts',
      method: 'POST',
      order: 3,
      config: {
        body: {
          title: 'My First Post',
          content: 'Hello World',
        },
      },
      dependencies: [
        {
          variableName: 'authToken',
          target: 'header',
          targetPath: 'headers.Authorization',
          transform: 'Bearer ${value}',
        },
      ],
      variableExtraction: [
        {
          name: 'postId',
          source: 'response.body',
          path: 'id',
        },
      ],
    },
  ],
};

// Save the chain
storage.saveChain(chain);

// Execute the chain
const executor = new ChainExecutor('http://localhost:3000');
const result = await executor.executeChain(chain);

console.log('Chain executed:', result.success);
console.log('Variables extracted:', result.variables);
// { userId: 'user_123', authToken: 'eyJhbGc...', postId: 'post_456' }
```

## 🎨 Variable Extraction

### Extract from Response Body

```typescript
{
  variableExtraction: [
    {
      name: 'userId',
      source: 'response.body',
      path: 'id',                    // Simple path
    },
    {
      name: 'email',
      source: 'response.body',
      path: 'user.email',            // Nested path
    },
    {
      name: 'firstTag',
      source: 'response.body',
      path: 'tags[0]',               // Array index
    },
  ]
}
```

### Extract from Response Headers

```typescript
{
  variableExtraction: [
    {
      name: 'authToken',
      source: 'response.headers',
      path: 'x-auth-token',
    },
  ]
}
```

### Extract Response Status

```typescript
{
  variableExtraction: [
    {
      name: 'statusCode',
      source: 'response.status',
      path: '',                      // Empty path for status
    },
  ]
}
```

### Transform Extracted Values

```typescript
{
  variableExtraction: [
    {
      name: 'userId',
      source: 'response.body',
      path: 'id',
      transform: 'toString',         // Convert to string
    },
    {
      name: 'count',
      source: 'response.body',
      path: 'total',
      transform: 'toNumber',         // Convert to number
    },
    {
      name: 'isActive',
      source: 'response.body',
      path: 'active',
      transform: 'toBoolean',        // Convert to boolean
    },
  ]
}
```

### Custom Transformations

```typescript
{
  variableExtraction: [
    {
      name: 'uppercaseEmail',
      source: 'response.body',
      path: 'email',
      customTransform: 'value.toUpperCase()',
    },
    {
      name: 'dayOfWeek',
      source: 'response.body',
      path: 'createdAt',
      customTransform: 'new Date(value).getDay()',
    },
  ]
}
```

## 🔌 Dependency Injection

### Inject into Headers

```typescript
{
  dependencies: [
    {
      variableName: 'authToken',
      target: 'header',
      targetPath: 'headers.Authorization',
      transform: 'Bearer ${value}',
    },
    {
      variableName: 'apiKey',
      target: 'header',
      targetPath: 'headers.X-API-Key',
      transform: '${value}',           // No transformation
    },
  ]
}
```

### Inject into Body

```typescript
{
  dependencies: [
    {
      variableName: 'userId',
      target: 'body',
      targetPath: 'body.authorId',
      transform: '${value}',
    },
    {
      variableName: 'categoryId',
      target: 'body',
      targetPath: 'body.category.id',
      transform: '${value}',
    },
  ]
}
```

### Inject into Query Parameters

```typescript
{
  dependencies: [
    {
      variableName: 'page',
      target: 'query',
      targetPath: 'query.page',
      transform: '${value}',
    },
  ]
}
```

### Inject into Path Parameters

```typescript
{
  dependencies: [
    {
      variableName: 'userId',
      target: 'pathParam',
      targetPath: 'pathParams.id',
      transform: '${value}',
    },
  ]
}
```

## 💾 Storage Management

### Get Saved Requests

```typescript
import { getChainStorage } from 'han-prev-openapi';

const storage = getChainStorage();

// Get all saved requests
const requests = storage.getSavedRequests();

// Get specific request
const request = storage.getSavedRequest('1234567890-abc123');

// Delete a request
storage.deleteSavedRequest('1234567890-abc123');

// Clear all requests
storage.clearSavedRequests();
```

### Manage Chains

```typescript
// Get all chains
const chains = storage.getChains();

// Get specific chain
const chain = storage.getChain('user-workflow');

// Delete a chain
storage.deleteChain('user-workflow');

// Clear all chains
storage.clearChains();
```

### Export/Import Data

```typescript
// Export all data as JSON
const exportedData = storage.exportData();
// Save to file or send to backend

// Import data
const jsonData = '{ "requests": [...], "chains": [...] }';
storage.importData(jsonData);
```

### Storage Statistics

```typescript
const stats = storage.getStats();

console.log(stats);
// {
//   savedRequests: 45,
//   maxSavedRequests: 100,
//   savedChains: 3,
//   maxChains: 50,
//   storageUsed: 524288  // bytes
// }
```

## 🎯 Real-World Examples

### Example 1: E-Commerce Workflow

```typescript
const ecommerceChain: RequestChain = {
  id: 'ecommerce-flow',
  name: 'Complete Purchase Flow',
  requests: [
    // 1. Login
    {
      id: 'login',
      endpoint: '/auth/login',
      method: 'POST',
      order: 1,
      config: {
        body: { email: 'buyer@example.com', password: 'pass123' },
      },
      variableExtraction: [
        { name: 'token', source: 'response.body', path: 'token' },
      ],
    },

    // 2. Get Product
    {
      id: 'get-product',
      endpoint: '/products/laptop-123',
      method: 'GET',
      order: 2,
      config: {},
      dependencies: [
        {
          variableName: 'token',
          target: 'header',
          targetPath: 'headers.Authorization',
          transform: 'Bearer ${value}',
        },
      ],
      variableExtraction: [
        { name: 'productId', source: 'response.body', path: 'id' },
        { name: 'price', source: 'response.body', path: 'price' },
      ],
    },

    // 3. Add to Cart
    {
      id: 'add-to-cart',
      endpoint: '/cart/items',
      method: 'POST',
      order: 3,
      config: {
        body: { quantity: 1 },
      },
      dependencies: [
        {
          variableName: 'token',
          target: 'header',
          targetPath: 'headers.Authorization',
          transform: 'Bearer ${value}',
        },
        {
          variableName: 'productId',
          target: 'body',
          targetPath: 'body.productId',
        },
      ],
      variableExtraction: [
        { name: 'cartId', source: 'response.body', path: 'cartId' },
      ],
    },

    // 4. Checkout
    {
      id: 'checkout',
      endpoint: '/orders',
      method: 'POST',
      order: 4,
      config: {
        body: {
          paymentMethod: 'credit_card',
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
          },
        },
      },
      dependencies: [
        {
          variableName: 'token',
          target: 'header',
          targetPath: 'headers.Authorization',
          transform: 'Bearer ${value}',
        },
        {
          variableName: 'cartId',
          target: 'body',
          targetPath: 'body.cartId',
        },
      ],
      variableExtraction: [
        { name: 'orderId', source: 'response.body', path: 'id' },
      ],
    },

    // 5. Verify Order
    {
      id: 'verify-order',
      endpoint: '/orders/:id',
      method: 'GET',
      order: 5,
      config: {},
      dependencies: [
        {
          variableName: 'token',
          target: 'header',
          targetPath: 'headers.Authorization',
          transform: 'Bearer ${value}',
        },
        {
          variableName: 'orderId',
          target: 'pathParam',
          targetPath: 'pathParams.id',
        },
      ],
    },
  ],
};
```

### Example 2: Blog Post Workflow

```typescript
const blogChain: RequestChain = {
  id: 'blog-flow',
  name: 'Create Blog Post with Comments',
  requests: [
    // 1. Create Author
    {
      id: 'create-author',
      endpoint: '/authors',
      method: 'POST',
      order: 1,
      config: {
        body: { name: 'John Doe', bio: 'Tech writer' },
      },
      variableExtraction: [
        { name: 'authorId', source: 'response.body', path: 'id' },
      ],
    },

    // 2. Create Post
    {
      id: 'create-post',
      endpoint: '/posts',
      method: 'POST',
      order: 2,
      config: {
        body: {
          title: 'Introduction to Han Framework',
          content: 'Han is amazing...',
        },
      },
      dependencies: [
        {
          variableName: 'authorId',
          target: 'body',
          targetPath: 'body.authorId',
        },
      ],
      variableExtraction: [
        { name: 'postId', source: 'response.body', path: 'id' },
      ],
    },

    // 3. Add First Comment
    {
      id: 'comment-1',
      endpoint: '/posts/:postId/comments',
      method: 'POST',
      order: 3,
      config: {
        body: { text: 'Great article!' },
      },
      dependencies: [
        {
          variableName: 'postId',
          target: 'pathParam',
          targetPath: 'pathParams.postId',
        },
      ],
    },

    // 4. Add Second Comment
    {
      id: 'comment-2',
      endpoint: '/posts/:postId/comments',
      method: 'POST',
      order: 4,
      config: {
        body: { text: 'Thanks for sharing!' },
      },
      dependencies: [
        {
          variableName: 'postId',
          target: 'pathParam',
          targetPath: 'pathParams.postId',
        },
      ],
    },

    // 5. Get Post with Comments
    {
      id: 'get-post',
      endpoint: '/posts/:postId',
      method: 'GET',
      order: 5,
      config: {
        query: { include: 'comments' },
      },
      dependencies: [
        {
          variableName: 'postId',
          target: 'pathParam',
          targetPath: 'pathParams.postId',
        },
      ],
    },
  ],
};
```

## ⚙️ Configuration Options

```typescript
interface ChainPlaygroundConfig {
  enabled: boolean;              // Enable/disable the feature
  maxSavedRequests?: number;     // Max requests to save (default: 100)
  maxChains?: number;            // Max chains to save (default: 50)
  autoSave?: boolean;            // Auto-save every request (default: true)
  storageKey?: string;           // Custom localStorage key (default: 'han_openapi_playground')
}
```

### Custom Configuration

```typescript
SwaggerModule.setup('/api-docs', app, document, {
  developerExperience: {
    requestChaining: {
      enabled: true,
      maxSavedRequests: 200,      // Store more requests
      maxChains: 100,             // Store more chains
      autoSave: true,
      storageKey: 'my_api_playground',  // Custom key
    },
  },
});
```

## 🔒 Security Considerations

### Sensitive Data

The request chaining feature stores data in **browser localStorage**, which means:

⚠️ **Do NOT use with production credentials**
⚠️ **Stored data is visible in browser DevTools**
⚠️ **Data is NOT encrypted**
⚠️ **Data persists until manually cleared**

### Best Practices

```typescript
// ✅ Good: Use test credentials
const testUser = {
  email: 'test@example.com',
  password: 'test123',
};

// ❌ Bad: Use real credentials
const realUser = {
  email: 'ceo@mycompany.com',
  password: 'myRealPassword',
};
```

### Development Only

Only enable request chaining in development:

```typescript
SwaggerModule.setup('/api-docs', app, document, {
  developerExperience: {
    requestChaining: {
      enabled: process.env.NODE_ENV === 'development',
    },
  },
});
```

## 🎉 Summary

Request Chaining Playground gives you:

✅ **Automatic request saving** with localStorage persistence
✅ **Variable extraction** from responses
✅ **Dependency injection** for chained requests
✅ **Complex workflow testing** without manual copying
✅ **Data persistence** across browser refreshes
✅ **Export/import** for sharing workflows

Perfect for testing authentication flows, multi-step processes, and complex API interactions!

## Next Steps

- [Postman Collection Generator](/openapi/postman-generator) - Export your API as Postman collection
- [Code Examples](/openapi/code-examples) - Generate client code in 10+ languages
- [Security](/openapi/security) - Learn about authentication in OpenAPI
