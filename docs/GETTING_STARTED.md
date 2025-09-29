# 🚀 Getting Started with Han Framework

**Build your first Han Framework application in under 5 minutes**

This guide will walk you through creating your first Han Framework application from scratch to a fully functional REST API.

---

## 📋 Prerequisites

- **Node.js** 16.x or higher
- **npm** or **yarn** package manager
- **TypeScript** knowledge (basic)
- **Decorators** enabled in TypeScript

---

## 🎯 Quick Setup

### 1. Create a New Project

```bash
mkdir my-han-app
cd my-han-app
npm init -y
```

### 2. Install Han Framework

```bash
# Install Han Framework (when published)
npm install han-framework reflect-metadata

# Install development dependencies
npm install -D typescript @types/node ts-node nodemon rimraf
```

### 3. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2020",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Setup Package Scripts

Update `package.json`:

```json
{
  "scripts": {
    "build": "rimraf dist && tsc",
    "start": "node dist/src/main.js",
    "dev": "nodemon --exec ts-node src/main.ts",
    "start:prod": "npm run build && npm start"
  }
}
```

---

## 🏗️ Build Your First Application

### 1. Create the Main Entry Point

Create `src/main.ts`:

```typescript
import 'reflect-metadata';
import { HanFactory } from 'han-framework';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HanFactory.create(AppModule, {
    cors: true,
    globalPrefix: '/api'
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, () => {
    console.log(`🚀 Application running on port ${port}`);
  });
}

bootstrap().catch(console.error);
```

### 2. Create Your First Controller

Create `src/app.controller.ts`:

```typescript
import { Controller, Get, Post, Body, Param } from 'han-framework';

interface User {
  id: number;
  name: string;
  email: string;
}

@Controller()
export class AppController {
  private users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];

  @Get()
  getHello() {
    return {
      message: 'Welcome to Han Framework!',
      version: '1.0.0'
    };
  }

  @Get('users')
  getUsers() {
    return {
      data: this.users,
      count: this.users.length
    };
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    const user = this.users.find(u => u.id === parseInt(id));

    if (!user) {
      return { error: 'User not found' };
    }

    return { data: user };
  }

  @Post('users')
  createUser(@Body() userData: Omit<User, 'id'>) {
    const newUser = {
      id: Math.max(...this.users.map(u => u.id)) + 1,
      ...userData
    };

    this.users.push(newUser);

    return {
      message: 'User created successfully',
      data: newUser
    };
  }
}
```

### 3. Create a Service (Optional but Recommended)

Create `src/app.service.ts`:

```typescript
import { Injectable } from 'han-framework';

interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class AppService {
  private users: User[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];

  getHello(): string {
    return 'Hello from Han Framework!';
  }

  getAllUsers(): User[] {
    return this.users;
  }

  getUserById(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }

  createUser(userData: Omit<User, 'id'>): User {
    const newUser = {
      id: Math.max(...this.users.map(u => u.id)) + 1,
      ...userData
    };

    this.users.push(newUser);
    return newUser;
  }

  updateUser(id: number, userData: Partial<User>): User | undefined {
    const userIndex = this.users.findIndex(user => user.id === id);

    if (userIndex === -1) {
      return undefined;
    }

    this.users[userIndex] = { ...this.users[userIndex], ...userData };
    return this.users[userIndex];
  }

  deleteUser(id: number): boolean {
    const userIndex = this.users.findIndex(user => user.id === id);

    if (userIndex === -1) {
      return false;
    }

    this.users.splice(userIndex, 1);
    return true;
  }
}
```

### 4. Update Controller to Use Service

Update `src/app.controller.ts`:

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param } from 'han-framework';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return {
      message: this.appService.getHello(),
      version: '1.0.0'
    };
  }

  @Get('users')
  getUsers() {
    const users = this.appService.getAllUsers();
    return {
      data: users,
      count: users.length
    };
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    const user = this.appService.getUserById(parseInt(id));

    if (!user) {
      return { error: 'User not found' };
    }

    return { data: user };
  }

  @Post('users')
  createUser(@Body() userData: any) {
    try {
      const newUser = this.appService.createUser(userData);
      return {
        message: 'User created successfully',
        data: newUser
      };
    } catch (error) {
      return { error: 'Failed to create user' };
    }
  }

  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() userData: any) {
    const updatedUser = this.appService.updateUser(parseInt(id), userData);

    if (!updatedUser) {
      return { error: 'User not found' };
    }

    return {
      message: 'User updated successfully',
      data: updatedUser
    };
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    const success = this.appService.deleteUser(parseInt(id));

    if (!success) {
      return { error: 'User not found' };
    }

    return { message: 'User deleted successfully' };
  }
}
```

### 5. Create the Root Module

Create `src/app.module.ts`:

```typescript
import { Module } from 'han-framework';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
```

---

## 🏃‍♂️ Run Your Application

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run start:prod
```

You should see output like:

```
🛡️  Shutdown hooks automatically enabled for signals: SIGINT, SIGTERM

============================================================
🚀 Han Framework - Application Started
============================================================

📊 Route Analytics Dashboard:
   🎯 Total Routes: 6
   🏛️  Controllers: 1
   📅 Generated: 9/29/2025, 10:38:18 PM

   🔢 HTTP Methods Breakdown:
      📖 GET   : 3 routes (50.0%)
      📝 POST  : 1 routes (16.7%)
      🔄 PUT   : 1 routes (16.7%)
      🗑️ DELETE: 1 routes (16.7%)

📍 Route Mappings by Controller:

┌─ [AppController] (6 routes)
├─ 📖 GET    /api/
├─ 📖 GET    /api/users
├─ 📖 GET    /api/users/:id
├─ 📝 POST   /api/users
├─ 🔄 PUT    /api/users/:id
└─ 🗑️ DELETE /api/users/:id

────────────────────────────────────────────────────────────
🎉 Server Ready!
🌐 URL: http://localhost:3000
🔧 Environment: development
⚡ PID: 12345
────────────────────────────────────────────────────────────

🚀 Application running on port 3000
```

---

## 🧪 Test Your API

### Using curl

```bash
# Get welcome message
curl http://localhost:3000

# Check health status
curl http://localhost:3000/health

# Get application info
curl http://localhost:3000/info

# Get all users
curl http://localhost:3000/users

# Get specific user
curl http://localhost:3000/users/1

# Create new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob Wilson", "email": "bob@example.com"}'
```

### Expected Responses

**GET /**
```json
{
  "message": "Welcome to Han Framework! 🚀",
  "framework": "Han Framework",
  "version": "1.0.0",
  "features": [
    "🚀 Zero configuration",
    "🛡️ Security by default",
    "⚡ Lightning fast",
    "🔧 Developer friendly",
    "📦 Full TypeScript support",
    "🎯 NestJS compatible"
  ]
}
```

**GET /health**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-29T22:34:01.769Z",
  "service": "han-framework",
  "version": "1.0.0",
  "uptime": 120,
  "memory": {
    "used": "25 MB",
    "total": "35 MB"
  }
}
```

**GET /users**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2025-09-29T22:34:01.769Z"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "createdAt": "2025-09-29T22:34:01.769Z"
    }
  ],
  "count": 2
}
```

**POST /users**
```json
{
  "message": "User created successfully",
  "data": {
    "id": 3,
    "name": "Bob Wilson",
    "email": "bob@example.com",
    "createdAt": "2025-09-29T22:34:01.769Z"
  },
  "statusCode": 201
}
```

---

## 🔧 Add Advanced Features

### 1. Add Global Interceptors

Update `src/main.ts`:

```typescript
import 'reflect-metadata';
import { HanFactory, LoggingInterceptor, PerformanceInterceptor } from 'han-framework';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HanFactory.create(AppModule, {
    cors: true,
    globalPrefix: '/api'
  });

  // Add global interceptors
  app.useGlobalInterceptors(LoggingInterceptor);
  app.useGlobalInterceptors(new PerformanceInterceptor(100)); // 100ms threshold

  const port = process.env.PORT || 3000;
  await app.listen(port, () => {
    console.log(`🚀 Application running on port ${port}`);
  });
}

bootstrap().catch(console.error);
```

### 2. Add Shutdown Hooks

```typescript
async function bootstrap() {
  const app = await HanFactory.create(AppModule, {
    cors: true,
    globalPrefix: '/api'
  });

  // Register shutdown hooks
  app.onApplicationShutdown(async () => {
    console.log('🗄️  Closing database connections...');
    // await database.close();
    console.log('✅ Database connections closed');
  });

  app.onApplicationShutdown(() => {
    console.log('🧹 Clearing application cache...');
    // cache.clear();
    console.log('✅ Cache cleared');
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
}
```

### 3. Add Custom Interceptor

Create `src/interceptors/timing.interceptor.ts`:

```typescript
import { BaseInterceptor, InterceptorContext, InterceptorResponse } from 'han-framework';

export class TimingInterceptor extends BaseInterceptor {
  beforeHandle(context: InterceptorContext): void {
    console.log(`⏰ [${context.traceId}] Starting ${context.method} ${context.path}`);
  }

  afterHandle(context: InterceptorContext, response: InterceptorResponse): void {
    const { method, path, traceId } = context;
    const { duration, statusCode } = response;

    console.log(`⏱️  [${traceId}] ${method} ${path} completed in ${duration}ms (${statusCode})`);
  }

  onError(context: InterceptorContext, error: any): void {
    console.error(`💥 [${context.traceId}] Error in ${context.method} ${context.path}:`, error.message);
  }
}
```

Register it in `main.ts`:

```typescript
import { TimingInterceptor } from './interceptors/timing.interceptor';

app.useGlobalInterceptors(new TimingInterceptor());
```

---

## 📁 Final Project Structure

```
my-han-app/
├── src/
│   ├── interceptors/
│   │   └── timing.interceptor.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.module.ts
│   └── main.ts
├── dist/                    # Compiled TypeScript
├── node_modules/
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🎉 Congratulations!

You've successfully created your first Han Framework application! You now have:

- ✅ A fully functional REST API
- ✅ Dependency injection working
- ✅ Global interceptors for logging and performance
- ✅ Automatic graceful shutdown
- ✅ Beautiful route analytics dashboard
- ✅ Production-ready security headers

---

## 🚀 Next Steps

Now that you have a basic application running, you can explore more advanced features:

### Learn More
- **[API Reference](./API_REFERENCE.md)** - Complete API documentation
- **[Architecture Guide](../HAN_FRAMEWORK.md)** - Deep dive into framework internals
- **[Lifecycle Management](./LIFECYCLE_MANAGEMENT.md)** - Advanced shutdown and cleanup

### Add More Features
- **Database Integration** - Connect to PostgreSQL, MongoDB, etc.
- **Authentication & Authorization** - JWT, OAuth, role-based access
- **Validation** - Request/response validation with DTOs
- **Testing** - Unit and integration tests
- **Microservices** - Build distributed applications

### Deployment
- **Docker** - Containerize your application
- **Kubernetes** - Deploy to Kubernetes clusters
- **Cloud Platforms** - Deploy to AWS, GCP, Azure, Heroku

---

**Ready to build something amazing?** The Han Framework provides all the tools you need to create scalable, maintainable applications with minimal configuration. Happy coding! 🚀