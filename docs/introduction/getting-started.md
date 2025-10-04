# Getting Started

Get up and running with Han Framework in minutes! This guide will walk you through installation, project setup, and creating your first API endpoint.

## Prerequisites

Make sure you have these installed:

- **Node.js** (>= 16.0.0) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **TypeScript** knowledge - Basic understanding recommended

## Installation

### Option 1: Using the CLI (Recommended)

The fastest way to get started:

```bash
# Install the CLI globally
npm install -g han-prev-cli

# Create a new project
han new my-app

# Navigate to your project
cd my-app

# Install dependencies
npm install

# Start development server
npm run dev
```

Your server is now running at `http://localhost:3000`! 🎉

### Option 2: Manual Setup

If you prefer more control:

```bash
# Create project directory
mkdir my-app
cd my-app

# Initialize npm project
npm init -y

# Install dependencies
npm install han-prev-core han-prev-common
npm install -D typescript @types/node ts-node nodemon

# Create tsconfig.json
npx tsc --init
```

## Project Structure

After creating a project with the CLI, you'll see this structure:

```
my-app/
├── src/
│   ├── app.controller.ts      # Main controller
│   ├── app.service.ts          # Business logic
│   ├── app.module.ts           # Root module
│   └── index.ts                # Application entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Your First Application

Let's create a simple "Hello World" API:

### Step 1: Create a Controller

Create `src/app.controller.ts`:

```typescript
import { Controller, Get } from 'han-prev-core';

@Controller()
export class AppController {
  @Get()
  hello() {
    return {
      message: 'Hello, Han Framework!',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
    };
  }
}
```

### Step 2: Create a Module

Create `src/app.module.ts`:

```typescript
import { Module } from 'han-prev-core';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
```

### Step 3: Bootstrap the Application

Create `src/index.ts`:

```typescript
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HanFactory.create(AppModule, {
    cors: true,
    bodyParser: true,
  });

  await app.listen(3000);
  console.log('🚀 Server is running on http://localhost:3000');
}

bootstrap();
```

### Step 4: Add Scripts to package.json

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### Step 5: Run Your Application

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser or use curl:

```bash
curl http://localhost:3000
# {"message":"Hello, Han Framework!","timestamp":"2024-..."}

curl http://localhost:3000/health
# {"status":"healthy","uptime":123.456}
```

## Adding Business Logic

Let's add a service to handle business logic:

### Create a Service

Create `src/app.service.ts`:

```typescript
import { Injectable } from 'han-prev-core';

@Injectable()
export class AppService {
  private users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];

  getUsers() {
    return this.users;
  }

  getUserById(id: number) {
    return this.users.find(user => user.id === id);
  }

  createUser(data: { name: string; email: string }) {
    const newUser = {
      id: this.users.length + 1,
      ...data,
    };
    this.users.push(newUser);
    return newUser;
  }
}
```

### Update the Controller

Update `src/app.controller.ts`:

```typescript
import { Controller, Get, Post, Param, Body } from 'han-prev-core';
import { AppService } from './app.service';

@Controller('users')
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  getAllUsers() {
    return this.appService.getUsers();
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return this.appService.getUserById(parseInt(id));
  }

  @Post()
  createUser(@Body() data: { name: string; email: string }) {
    return this.appService.createUser(data);
  }
}
```

### Register the Service

Update `src/app.module.ts`:

```typescript
import { Module } from 'han-prev-core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService], // ✅ Add service here
})
export class AppModule {}
```

### Test the New Endpoints

```bash
# Get all users
curl http://localhost:3000/users

# Get specific user
curl http://localhost:3000/users/1

# Create new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob Wilson","email":"bob@example.com"}'
```

## Development Tips

### Hot Reload

The CLI setup includes nodemon for automatic restart on file changes. Just save your file and the server will restart!

### TypeScript Configuration

Your `tsconfig.json` should have these important settings:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### Environment Variables

Create a `.env` file:

```bash
PORT=3000
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/myapp
```

Install dotenv:

```bash
npm install dotenv
```

Load it in your `index.ts`:

```typescript
import 'dotenv/config';
import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HanFactory.create(AppModule);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
}

bootstrap();
```

## What's Next?

Congratulations! You've built your first Han Framework application. 🎉

Ready to learn more? Check out:

- **[First Steps](/introduction/first-steps)** - Build a more complete application
- **[Controllers](/fundamentals/controllers)** - Deep dive into routing and request handling
- **[Providers](/fundamentals/providers)** - Learn about dependency injection
- **[Modules](/fundamentals/modules)** - Organize your application structure
- **[Middleware](/techniques/middleware)** - Add authentication, logging, and more

## Common Issues

### Port Already in Use

```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:** Change the port or kill the process using port 3000:

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

### TypeScript Errors with Decorators

```
Experimental support for decorators is a feature that is subject to change
```

**Solution:** Make sure `experimentalDecorators` and `emitDecoratorMetadata` are `true` in your `tsconfig.json`.

### Module Not Found

```
Cannot find module 'han-prev-core'
```

**Solution:** Make sure you've installed all dependencies:

```bash
npm install
```

## Need Help?

- 📖 [Documentation](/)
- 💬 [Discord Community](https://discord.gg/hanframework)
- 🐛 [Report Issues](https://github.com/sirkenedy/han/issues)
- 💡 [Discussions](https://github.com/sirkenedy/han/discussions)
