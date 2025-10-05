# Code Examples Generator

The **Code Examples Generator** automatically creates ready-to-use client code in 10+ programming languages directly from your OpenAPI specification. Copy-paste working code to integrate with your API in seconds.

## 🎯 What Problem Does It Solve?

### The Problem

Developers integrating with your API face:

1. **Learning curve** - How do I call this endpoint?
2. **Language barriers** - Examples only in one language
3. **Boilerplate code** - Writing HTTP clients from scratch
4. **Authentication confusion** - How do I send auth headers?
5. **Type safety** - No TypeScript interfaces or type hints

### The Solution

Code Examples Generator provides:

✅ **10+ languages** - TypeScript, JavaScript, Python, Go, Java, C#, PHP, Ruby, Swift, curl
✅ **Copy-paste ready** - Working code you can use immediately
✅ **Type definitions** - TypeScript interfaces included
✅ **Error handling** - try-catch blocks and proper error management
✅ **Authentication** - Bearer tokens, API keys, Basic auth
✅ **Comments** - Explanatory comments for clarity

## 🚀 Quick Start

### Enable Code Examples

```typescript
import { HanFactory } from 'han-prev-core';
import { DocumentBuilder, SwaggerModule } from 'han-prev-openapi';

const app = await HanFactory.create(AppModule);

const config = new DocumentBuilder()
  .setTitle('My API')
  .setVersion('1.0')
  .build();

const document = SwaggerModule.createDocument(app, config, [UserController]);

// Enable code examples
SwaggerModule.setup('/api-docs', app, document, {
  developerExperience: {
    codeExamples: {
      enabled: true,
      languages: ['typescript', 'javascript', 'python', 'curl'],
      includeComments: true,
      includeErrorHandling: true,
      includeTypeDefinitions: true,
      framework: {
        typescript: 'fetch',      // or 'axios', 'node-fetch'
        javascript: 'fetch',      // or 'axios'
        python: 'requests',       // or 'httpx', 'urllib'
      },
    },
  },
});

await app.listen(3000);
```

### View in Swagger UI

1. Visit `http://localhost:3000/api-docs`
2. Click on any endpoint
3. Click **"📋 Code Examples"**
4. Select your language from tabs
5. Click **"📋 Copy"** to copy the code

## 📚 Supported Languages

### TypeScript

```typescript
// POST /users
async function postUsers() {
  try {
    const response = await fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_TOKEN"
      },
      body: JSON.stringify({
        "email": "user@example.com",
        "password": "secret123"
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

### JavaScript

```javascript
// POST /users
async function postUsers() {
  try {
    const response = await fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_TOKEN"
      },
      body: JSON.stringify({
        "email": "user@example.com",
        "password": "secret123"
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

### Python

```python
import requests

# POST /users
def post_users():
    try:
        response = requests.post(
            'http://localhost:3000/users',
            headers={
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_TOKEN'
            },
            json={
                'email': 'user@example.com',
                'password': 'secret123'
            },
        )

        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')
        raise
```

### curl

```bash
curl -X POST 'http://localhost:3000/users' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
  "email": "user@example.com",
  "password": "secret123"
}'
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
)

func postUsers() error {
    payload := map[string]interface{}{
        "email": "user@example.com",
        "password": "secret123",
    }
    jsonData, err := json.Marshal(payload)
    if err != nil {
        return err
    }

    req, err := http.NewRequest("POST", "http://localhost:3000/users", bytes.NewBuffer(jsonData))
    if err != nil {
        return err
    }

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Authorization", "Bearer YOUR_TOKEN")

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    body, _ := ioutil.ReadAll(resp.Body)
    fmt.Println(string(body))
    return nil
}
```

### Java

```java
import java.net.http.*;
import java.net.URI;

public class ApiClient {
    public static void postUsers() throws Exception {
        HttpClient client = HttpClient.newHttpClient();

        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:3000/users"))
            .method("POST", HttpRequest.BodyPublishers.ofString("{\"email\":\"user@example.com\",\"password\":\"secret123\"}"))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer YOUR_TOKEN")

        HttpResponse<String> response = client.send(
            requestBuilder.build(),
            HttpResponse.BodyHandlers.ofString()
        );

        System.out.println(response.body());
    }
}
```

### C#

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

public class ApiClient
{
    public static async Task PostUsers()
    {
        using var client = new HttpClient();

        client.DefaultRequestHeaders.Add("Authorization", "Bearer YOUR_TOKEN");

        var content = new StringContent(
            "{\"email\":\"user@example.com\",\"password\":\"secret123\"}",
            Encoding.UTF8,
            "application/json"
        );

        var response = await client.PostAsync("http://localhost:3000/users", content);
        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadAsStringAsync();
        Console.WriteLine(result);
    }
}
```

### PHP

```php
<?php

function postUsers() {
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, 'http://localhost:3000/users');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');

    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer YOUR_TOKEN',
    ]);

    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'email' => 'user@example.com',
        'password' => 'secret123',
    ]));

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
}
```

### Ruby

```ruby
require 'net/http'
require 'json'

def post_users
  uri = URI('http://localhost:3000/users')
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true if uri.scheme == 'https'

  request = Net::HTTP::Post.new(uri)
  request['Content-Type'] = 'application/json'
  request['Authorization'] = 'Bearer YOUR_TOKEN'
  request.body = {
    'email' => 'user@example.com',
    'password' => 'secret123'
  }.to_json

  response = http.request(request)
  JSON.parse(response.body)
end
```

### Swift

```swift
import Foundation

func postUsers() async throws {
    guard let url = URL(string: "http://localhost:3000/users") else {
        throw URLError(.badURL)
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer YOUR_TOKEN", forHTTPHeaderField: "Authorization")

    let body = [
        "email": "user@example.com",
        "password": "secret123"
    ]
    request.httpBody = try JSONSerialization.data(withJSONObject: body)

    let (data, response) = try await URLSession.shared.data(for: request)
    let result = try JSONSerialization.jsonObject(with: data)
    print(result)
}
```

## 🎨 TypeScript with Type Definitions

When `includeTypeDefinitions: true`:

```typescript
interface RequestBody {
  email: string;
  password: string;
}

// POST /users
async function postUsers() {
  try {
    const response = await fetch('http://localhost:3000/users', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_TOKEN"
      },
      body: JSON.stringify({
        "email": "user@example.com",
        "password": "secret123"
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

## ⚙️ Framework Options

### TypeScript - Axios

```typescript
framework: {
  typescript: 'axios',
}
```

Generated code:

```typescript
import axios from 'axios';

async function postUsers() {
  try {
    const response = await axios({
      method: 'post',
      url: 'http://localhost:3000/users',
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_TOKEN"
      },
      data: {
        "email": "user@example.com",
        "password": "secret123"
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data);
    }
    throw error;
  }
}
```

### Python - httpx

```typescript
framework: {
  python: 'httpx',
}
```

Generated code:

```python
import httpx

async def post_users():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'http://localhost:3000/users',
            headers={
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_TOKEN'
            },
            json={
                'email': 'user@example.com',
                'password': 'secret123'
            }
        )
        response.raise_for_status()
        return response.json()
```

## 🔐 Authentication Examples

### Bearer Token

```typescript
@ApiBearerAuth()
@Get()
findAll() {}
```

Generated code includes:

```typescript
headers: {
  "Authorization": "Bearer YOUR_TOKEN"
}
```

### API Key

```typescript
@ApiApiKey()
@Get()
findAll() {}
```

Generated code includes:

```typescript
headers: {
  "X-API-Key": "YOUR_API_KEY"
}
```

### Basic Auth

```typescript
@ApiBasicAuth()
@Get()
findAll() {}
```

Generated code includes:

```python
import base64

auth_string = base64.b64encode(b'username:password').decode()
headers = {
    'Authorization': f'Basic {auth_string}'
}
```

## 🎯 Programmatic Generation

### Generate for Specific Endpoint

```typescript
import { CodeExamplesGenerator } from 'han-prev-openapi';

const generator = new CodeExamplesGenerator({
  languages: ['typescript', 'python', 'curl'],
  includeComments: true,
  includeErrorHandling: true,
});

const config = {
  endpoint: '/users',
  method: 'POST',
  parameters: {
    body: {
      email: 'user@example.com',
      password: 'secret123',
    },
  },
  auth: {
    type: 'bearer',
    value: 'YOUR_TOKEN',
  },
  baseUrl: 'http://localhost:3000',
};

const examples = generator.generateExamples(config);

examples.forEach((example) => {
  console.log(`\n--- ${example.language.toUpperCase()} ---`);
  console.log(example.code);
  if (example.dependencies && example.dependencies.length > 0) {
    console.log(`\nDependencies: ${example.dependencies.join(', ')}`);
  }
});
```

### Generate Single Language

```typescript
const example = generator.generateExample('typescript', config);

console.log(example.code);
```

## 📦 Configuration Options

```typescript
interface CodeGeneratorConfig {
  enabled: boolean;                           // Enable/disable the feature
  languages?: SupportedLanguage[];            // Languages to generate
  includeComments?: boolean;                  // Include explanatory comments (default: true)
  includeErrorHandling?: boolean;             // Include try-catch blocks (default: true)
  includeTypeDefinitions?: boolean;           // Include TypeScript interfaces (default: true)
  framework?: {
    typescript?: 'fetch' | 'axios' | 'node-fetch';
    javascript?: 'fetch' | 'axios';
    python?: 'requests' | 'httpx' | 'urllib';
  };
}

type SupportedLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'curl'
  | 'go'
  | 'java'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'swift';
```

### Minimal Configuration

```typescript
SwaggerModule.setup('/api-docs', app, document, {
  developerExperience: {
    codeExamples: {
      enabled: true,
    },
  },
});
```

### Full Configuration

```typescript
SwaggerModule.setup('/api-docs', app, document, {
  developerExperience: {
    codeExamples: {
      enabled: true,
      languages: [
        'typescript',
        'javascript',
        'python',
        'go',
        'java',
        'csharp',
        'php',
        'ruby',
        'swift',
        'curl',
      ],
      includeComments: true,
      includeErrorHandling: true,
      includeTypeDefinitions: true,
      framework: {
        typescript: 'axios',
        javascript: 'axios',
        python: 'httpx',
      },
    },
  },
});
```

## 🎯 Real-World Example

### Complete API Documentation

```typescript
// main.ts
import { HanFactory } from 'han-prev-core';
import { DocumentBuilder, SwaggerModule } from 'han-prev-openapi';
import { AppModule } from './app.module';
import { UserController } from './user/user.controller';

async function bootstrap() {
  const app = await HanFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('User Management API')
    .setDescription('Complete user CRUD operations')
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Development')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, [UserController]);

  SwaggerModule.setup('/api-docs', app, document, {
    customSiteTitle: 'User API Docs',
    developerExperience: {
      codeExamples: {
        enabled: true,
        languages: ['typescript', 'javascript', 'python', 'curl'],
        includeComments: true,
        includeErrorHandling: true,
        includeTypeDefinitions: true,
        framework: {
          typescript: 'fetch',
          javascript: 'fetch',
          python: 'requests',
        },
      },
    },
  });

  await app.listen(3000);
  console.log('🚀 Server running on http://localhost:3000');
  console.log('📚 API docs at http://localhost:3000/api-docs');
  console.log('📋 Click any endpoint to see code examples');
}

bootstrap();
```

### Generated Examples

For this controller:

```typescript
@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UserController {
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ type: UserDto })
  async create(@Body() createUserDto: CreateUserDto) {
    return { id: 'user_123', ...createUserDto };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiOkResponse({ type: UserDto })
  async findOne(@Param('id') id: string) {
    return { id, email: 'user@example.com' };
  }
}
```

You get code examples in all configured languages with:

✅ **Proper HTTP methods** (POST, GET, etc.)
✅ **Authentication headers** (Bearer token)
✅ **Request bodies** with correct JSON
✅ **Error handling** (try-catch)
✅ **Type safety** (TypeScript interfaces)
✅ **Comments** explaining each step

## 📊 Dependencies

Each example includes required dependencies:

### TypeScript (fetch)
```
No dependencies (built-in)
```

### TypeScript (axios)
```
Dependencies: axios
npm install axios
```

### TypeScript (node-fetch)
```
Dependencies: node-fetch, @types/node-fetch
npm install node-fetch @types/node-fetch
```

### Python (requests)
```
Dependencies: requests
pip install requests
```

### Python (httpx)
```
Dependencies: httpx
pip install httpx
```

## 🎉 Summary

Code Examples Generator provides:

✅ **10+ programming languages** supported
✅ **Copy-paste ready** code
✅ **Type definitions** for TypeScript
✅ **Error handling** included
✅ **Authentication** automatically added
✅ **Framework flexibility** (fetch, axios, requests, etc.)
✅ **Comments** for clarity

Perfect for API documentation, developer onboarding, and reducing integration time!

## Next Steps

- [Request Chaining](/openapi/request-chaining) - Chain multiple requests together
- [Postman Generator](/openapi/postman-generator) - Export as Postman collection
- [Operations](/openapi/operations) - Document your API endpoints
