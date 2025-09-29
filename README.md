# 🚀 Han Framework

**A modern, developer-friendly Node.js framework inspired by NestJS**

Han Framework eliminates configuration complexity while providing powerful features out of the box. Built for developers who want to focus on building great applications, not wrestling with setup.

---

## ✨ Why Han Framework?

| Feature | Han Framework | NestJS |
|---------|---------------|---------|
| **Setup Time** | 2 minutes | 15+ minutes |
| **Configuration** | Zero config needed | Manual setup required |
| **Shutdown Hooks** | Automatic | Manual `enableShutdownHooks()` |
| **Security** | Built-in CORS + Helmet | Manual configuration |
| **Environment Detection** | Automatic | Manual setup |
| **Route Analytics** | Built-in visual dashboard | Not included |

---

## 🏃‍♂️ Quick Start

### Installation
```bash
npm install han-framework
# or
yarn add han-framework
```

### Create Your First App
```typescript
// app.module.ts
import { Module } from 'han-framework';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController]
})
export class AppModule {}

// app.controller.ts
import { Controller, Get } from 'han-framework';

@Controller()
export class AppController {
  @Get()
  hello() {
    return { message: 'Hello Han Framework!' };
  }
}

// index.ts
import 'reflect-metadata';
import { HanFactory } from 'han-framework';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HanFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
```

### Run Your App
```bash
npm start
```

**That's it!** 🎉 Your app is running with:
- ✅ CORS enabled
- ✅ Security headers (Helmet)
- ✅ Request logging
- ✅ Graceful shutdown
- ✅ Route analytics dashboard

---

## 🎯 Core Features

### Zero Configuration
No setup required - everything works out of the box with sensible defaults.

```typescript
// This gives you a production-ready app
const app = await HanFactory.create(AppModule);
await app.listen(3000);
```

### Smart Environment Detection
Automatically configures based on your deployment environment.

- **Development**: Binds to `localhost`, enhanced logging
- **Production**: Binds to `0.0.0.0`, optimized performance
- **Containers**: Auto-detects Docker/Kubernetes, configures accordingly

### Automatic Lifecycle Management
Graceful shutdown and cleanup happen automatically - no manual setup needed.

```typescript
// Automatically handles SIGINT/SIGTERM
// Provides graceful shutdown with timeout protection
// Cleans up resources properly
```

### Built-in Security
Security best practices are enabled by default.

- **CORS**: Configured automatically with smart defaults
- **Helmet**: Security headers enabled out of the box
- **Request Validation**: Built-in input sanitization

### Request/Response Interceptors
Simple, intuitive hooks for request lifecycle management.

```typescript
// Add global interceptors
app.useGlobalInterceptors(LoggingInterceptor);
app.useGlobalInterceptors(new PerformanceInterceptor(200));
```

### Visual Route Analytics
Beautiful route dashboard displayed on startup.

```
🚀 Han Framework - Application Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Route Analytics Dashboard:
   🎯 Total Routes: 4
   🏛️  Controllers: 2
   📅 Generated: 9/29/2025, 10:38:18 PM

   🔢 HTTP Methods Breakdown:
      📖 GET   : 3 routes (75.0%)
      📝 POST  : 1 routes (25.0%)

📍 Route Mappings by Controller:

┌─ [AppController] (2 routes)
├─ 📖 GET    /api/health
└─ 📖 GET    /api/info

┌─ [WebhookController] (2 routes)
├─ 📝 POST   🛡️ /api/webhook/github [+2 middleware]
└─ 📖 GET    /api/webhook/status
```

---

## 🛠️ Configuration (When You Need It)

### Basic Configuration
```typescript
const app = await HanFactory.create(AppModule, {
  globalPrefix: '/api/v1',    // Add API prefix
  cors: true,                 // Enable CORS (default: true)
  helmet: true,               // Enable security headers (default: true)
  bodyParser: true            // Enable body parsing (default: true)
});
```

### Advanced Configuration
```typescript
const app = await HanFactory.create(AppModule, {
  // CORS Configuration
  cors: {
    origin: ['https://yourdomain.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  },

  // Security Configuration
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"]
      }
    }
  },

  // Shutdown Configuration
  shutdownHooks: {
    enabled: true,              // Enable graceful shutdown (default: true)
    gracefulTimeout: 15000,     // 15 second timeout (default: 10000)
    signals: ['SIGINT', 'SIGTERM'] // Signals to handle
  }
});
```

---

## 🔧 Advanced Features

### Custom Shutdown Hooks
Register cleanup operations that run automatically during shutdown.

```typescript
// Database cleanup
app.onApplicationShutdown(async () => {
  await database.close();
  console.log('Database connections closed');
});

// Cache cleanup
app.onApplicationShutdown(() => {
  cache.clear();
  console.log('Cache cleared');
});
```

### Global Interceptors
Add request/response processing that applies to all routes.

```typescript
// Built-in interceptors
app.useGlobalInterceptors(LoggingInterceptor);
app.useGlobalInterceptors(new PerformanceInterceptor(200));

// Custom interceptor
class AuthInterceptor {
  beforeHandle(context) {
    // Pre-request logic
  }

  afterHandle(context, response) {
    // Post-request logic
  }

  onError(context, error) {
    // Error handling
  }
}

app.useGlobalInterceptors(new AuthInterceptor());
```

### Dependency Injection
Full dependency injection support with automatic resolution.

```typescript
@Injectable()
export class UserService {
  findAll() {
    return [{ id: 1, name: 'John' }];
  }
}

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  getUsers() {
    return this.userService.findAll();
  }
}
```

### Module System
Organize your application with a modular architecture.

```typescript
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService]
})
export class UserModule {}
```

---

## 🚀 Deployment

### Development
```typescript
const app = await HanFactory.create(AppModule);
await app.listen(3000);
// Automatically configures for development environment
```

### Production
```typescript
const app = await HanFactory.create(AppModule, {
  shutdownHooks: {
    gracefulTimeout: 30000  // Longer timeout for production
  }
});

const port = process.env.PORT || 3000;
await app.listen(port);
// Automatically configures for production environment
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
# Han Framework automatically detects container environment
```

---

## 📖 Examples

### REST API
```typescript
@Controller('users')
export class UserController {
  @Get()
  findAll() {
    return [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id, name: 'John' };
  }

  @Post()
  create(@Body() user: CreateUserDto) {
    return { id: 3, ...user };
  }
}
```

### WebSocket Support
```typescript
@Controller()
export class EventsController {
  @WebSocketGateway()
  handleConnection(client: any) {
    console.log('Client connected:', client.id);
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any) {
    return { event: 'message', data: payload };
  }
}
```

### Microservices
```typescript
// Create a microservice instead of HTTP server
const microservice = await HanFactory.createMicroservice(AppModule, {
  transport: Transport.TCP,
  options: { port: 3001 }
});

await microservice.listen();
```

---

## 🆚 Comparison with NestJS

### Migration from NestJS
Han Framework is designed to be compatible with NestJS applications. Most NestJS code works without changes:

```typescript
// Your existing NestJS controllers work as-is
@Controller('users')
export class UserController {
  @Get()
  findAll() {
    return this.userService.findAll();
  }
}

// Your existing modules work as-is
@Module({
  imports: [UserModule],
  controllers: [AppController]
})
export class AppModule {}
```

### Key Differences

| Aspect | Han Framework | NestJS |
|--------|---------------|---------|
| **Setup** | Zero config | Manual config |
| **Shutdown** | Automatic | Manual |
| **Security** | Built-in | Manual setup |
| **Interceptors** | Simple hooks | RxJS observables |
| **Environment** | Auto-detection | Manual configuration |
| **Performance** | Built-in monitoring | External packages |

---

## 📚 Documentation

### Core Guides
- **[Getting Started](./docs/GETTING_STARTED.md)** - Step-by-step setup guide
- **[Architecture](./docs/ARCHITECTURE.md)** - Framework design and concepts
- **[Configuration](./docs/CONFIGURATION.md)** - All configuration options
- **[Deployment](./docs/DEPLOYMENT.md)** - Production deployment guide

### Advanced Topics
- **[Lifecycle Management](./docs/LIFECYCLE_MANAGEMENT.md)** - Graceful shutdown and cleanup
- **[Interceptors](./docs/INTERCEPTORS.md)** - Request/response lifecycle hooks
- **[Dependency Injection](./docs/DEPENDENCY_INJECTION.md)** - DI container usage
- **[Microservices](./docs/MICROSERVICES.md)** - Building microservice applications

### Examples
- **[REST API](./examples/rest-api.example.ts)** - Complete REST API example
- **[WebSocket](./examples/websocket.example.ts)** - Real-time communication
- **[Microservice](./examples/microservice.example.ts)** - Microservice architecture
- **[Database Integration](./examples/database.example.ts)** - Database setup and usage

---

## 🏗️ Project Structure

```
src/
├── controllers/           # Route handlers
│   ├── app.controller.ts
│   └── user.controller.ts
├── services/             # Business logic
│   ├── app.service.ts
│   └── user.service.ts
├── modules/              # Feature modules
│   ├── user.module.ts
│   └── auth.module.ts
├── interceptors/         # Request/response hooks
│   ├── logging.interceptor.ts
│   └── auth.interceptor.ts
├── app.module.ts        # Root module
└── index.ts            # Application entry point
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/your-org/han-framework
cd han-framework
npm install
npm run dev
```

### Running Tests
```bash
npm test              # Unit tests
npm run test:e2e     # End-to-end tests
npm run test:coverage # Coverage report
```

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🙏 Acknowledgments

Inspired by the excellent work of the NestJS team. Han Framework builds upon their concepts while focusing on developer experience and automation.

---

**Ready to build something amazing?** 🚀

Get started with Han Framework today and experience the joy of zero-configuration development with enterprise-grade features built-in.

```bash
npm install han-framework
```

*Built with ❤️ for developers who want to focus on building, not configuring.*