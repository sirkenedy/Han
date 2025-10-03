# 📚 Han Framework Documentation

**Complete documentation for the Han Framework - A modern, developer-friendly Node.js framework**

Welcome to the Han Framework documentation! This directory contains comprehensive guides, API references, and examples to help you build amazing applications.

---

## 🎯 Quick Navigation

### 🚀 **Getting Started**

New to Han Framework? Start here!

- **[Getting Started Guide](./GETTING_STARTED.md)** - Build your first app in 5 minutes
- **[Main README](../README.md)** - Framework overview and quick start

### 📖 **Core Documentation**

#### **Framework Guides**

- **[Technical Architecture](../HAN_FRAMEWORK.md)** - Deep dive into framework internals
- **[API Reference](./API_REFERENCE.md)** - Complete API documentation
- **[Lifecycle Management](./LIFECYCLE_MANAGEMENT.md)** - Graceful shutdown and cleanup hooks

#### **Feature Guides**

- **[Global Interceptors](../examples/global-interceptors.example.ts)** - Request/response lifecycle hooks
- **[Custom Shutdown Hooks](../examples/shutdown-hooks.example.ts)** - Application cleanup examples
- **[Graceful Shutdown Demo](../examples/graceful-shutdown.example.ts)** - Shutdown behavior demonstration

---

## 📋 Documentation Structure

### 🏗️ **Architecture & Design**

| Document                                      | Description                                       | Audience                          |
| --------------------------------------------- | ------------------------------------------------- | --------------------------------- |
| [Technical Architecture](../HAN_FRAMEWORK.md) | Framework internals, design patterns, performance | Advanced developers, contributors |
| [API Reference](./API_REFERENCE.md)           | Complete API documentation with examples          | All developers                    |
| [Getting Started](./GETTING_STARTED.md)       | Step-by-step tutorial for beginners               | New users                         |

### 🔧 **Features & Concepts**

| Feature                   | Documentation                                                      | Examples                                                |
| ------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| **Lifecycle Management**  | [Guide](./LIFECYCLE_MANAGEMENT.md)                                 | [Shutdown Hooks](../examples/shutdown-hooks.example.ts) |
| **Global Interceptors**   | [API Reference](./API_REFERENCE.md#-interceptors)                  | [Demo](../examples/global-interceptors.example.ts)      |
| **Environment Detection** | [Architecture](../HAN_FRAMEWORK.md#1-environment-detection-system) | Built into framework                                    |
| **Route Analytics**       | [Architecture](../HAN_FRAMEWORK.md#3-route-analytics-and-mapping)  | Automatic display                                       |

---

## 🎓 Learning Path

### **For Beginners**

1. 📖 Read [Main README](../README.md) - Framework overview
2. 🚀 Follow [Getting Started Guide](./GETTING_STARTED.md) - Build first app
3. 🔧 Explore [API Reference](./API_REFERENCE.md) - Learn the APIs
4. 💡 Check [Examples](../examples/) - See real implementations

### **For Intermediate Developers**

1. 🏗️ Study [Technical Architecture](../HAN_FRAMEWORK.md) - Understand internals
2. 🛡️ Master [Lifecycle Management](./LIFECYCLE_MANAGEMENT.md) - Production readiness
3. 🌐 Implement [Global Interceptors](../examples/global-interceptors.example.ts) - Cross-cutting concerns
4. 🧪 Build advanced features using [API Reference](./API_REFERENCE.md)

### **For Advanced Users & Contributors**

1. 🔬 Deep dive into [Framework Architecture](../HAN_FRAMEWORK.md) - Internal design
2. ⚡ Study performance optimizations and benchmarks
3. 🔌 Create custom extensions and interceptors
4. 🤝 Contribute to framework development

---

## 📝 Quick Reference

### **Essential APIs**

```typescript
// Application Creation
const app = await HanFactory.create(AppModule, options);

// Lifecycle Management
app.onApplicationShutdown(() => cleanup());

// Global Interceptors
app.useGlobalInterceptors(LoggingInterceptor);

// Server Start
await app.listen(3000);
```

### **Core Decorators**

```typescript
// Module Definition
@Module({ controllers: [UserController], providers: [UserService] })

// Controller Definition
@Controller('users')

// Route Handlers
@Get(), @Post(), @Put(), @Delete(), @Patch()

// Parameter Extraction
@Param('id'), @Body(), @Query(), @Headers()

// Dependency Injection
@Injectable()
```

### **Configuration Options**

```typescript
const app = await HanFactory.create(AppModule, {
  cors: true | corsOptions,
  helmet: true | helmetOptions,
  globalPrefix: "/api",
  shutdownHooks: {
    enabled: true,
    gracefulTimeout: 10000,
    signals: ["SIGINT", "SIGTERM"],
  },
});
```

---

## 🎯 Framework Features

### **Zero Configuration**

- ✅ CORS enabled by default
- ✅ Security headers (Helmet) configured
- ✅ Request logging with trace IDs
- ✅ Graceful shutdown handling
- ✅ Environment auto-detection

### **Developer Experience**

- ✅ Beautiful route analytics dashboard
- ✅ Rich console output with emojis
- ✅ Automatic error handling
- ✅ TypeScript-first design
- ✅ NestJS compatibility

### **Production Ready**

- ✅ Performance monitoring built-in
- ✅ Memory management and cleanup
- ✅ Container/cloud platform detection
- ✅ Configurable timeouts and limits
- ✅ Comprehensive logging

---

## 🆚 Comparison with Other Frameworks

### **vs NestJS**

| Feature             | Han Framework | NestJS                         |
| ------------------- | ------------- | ------------------------------ |
| **Setup Time**      | 2 minutes     | 15+ minutes                    |
| **Configuration**   | Zero config   | Manual setup                   |
| **Shutdown Hooks**  | Automatic     | Manual `enableShutdownHooks()` |
| **Security**        | Built-in      | Manual configuration           |
| **Route Analytics** | Built-in      | Not included                   |
| **Interceptors**    | Simple hooks  | RxJS observables               |

### **vs Express**

| Feature                  | Han Framework     | Express               |
| ------------------------ | ----------------- | --------------------- |
| **Type Safety**          | Full TypeScript   | Manual typing         |
| **Dependency Injection** | Built-in          | Manual setup          |
| **Module System**        | Organized modules | Manual organization   |
| **Lifecycle Management** | Automatic         | Manual implementation |
| **Security**             | Built-in          | Manual middleware     |

---

## 🧪 Examples and Demos

### **Live Examples**

Explore working examples in the [`examples/`](../examples/) directory:

- **[Global Interceptors](../examples/global-interceptors.example.ts)** - Request/response hooks
- **[Graceful Shutdown](../examples/graceful-shutdown.example.ts)** - Automatic lifecycle management
- **[Custom Shutdown Hooks](../examples/shutdown-hooks.example.ts)** - Custom cleanup operations

### **Running Examples**

```bash
# Global interceptors demo
npm run build && node dist/examples/global-interceptors.example.js

# Graceful shutdown demo
npm run build && node dist/examples/graceful-shutdown.example.js

# Custom shutdown hooks demo
npm run build && node dist/examples/shutdown-hooks.example.js
```

---

## 🤝 Contributing to Documentation

### **Improve Existing Docs**

- Fix typos and grammatical errors
- Add missing examples or use cases
- Improve code snippets and explanations
- Update outdated information

### **Add New Documentation**

- Advanced use cases and patterns
- Integration guides (databases, external services)
- Deployment guides (Docker, Kubernetes, cloud platforms)
- Performance optimization guides

### **Documentation Standards**

- Use clear, concise language
- Include working code examples
- Provide both basic and advanced examples
- Test all code snippets before submission

---

## 📞 Support & Community

### **Getting Help**

- 📖 Check documentation first
- 💬 Join community discussions
- 🐛 Report issues on GitHub
- 💡 Request features

### **Stay Updated**

- ⭐ Star the repository
- 👀 Watch for updates
- 📢 Follow announcements
- 🔄 Update regularly

---

## 🗺️ Documentation Roadmap

### **Coming Soon**

- 🗄️ Database integration guides
- 🔐 Authentication & authorization patterns
- 🧪 Advanced testing strategies
- 🚀 Deployment automation guides
- 📊 Monitoring and observability setup

### **Future Plans**

- 🎥 Video tutorials and walkthroughs
- 📱 Interactive documentation
- 🌍 Multi-language support
- 📚 Best practices collection

---

**Ready to dive deeper?** Choose your path:

- 🚀 **New to frameworks?** → [Getting Started Guide](./GETTING_STARTED.md)
- 🔧 **Ready to build?** → [API Reference](./API_REFERENCE.md)
- 🏗️ **Want to understand internals?** → [Technical Architecture](../HAN_FRAMEWORK.md)
- 💡 **Looking for examples?** → [Examples Directory](../examples/)

_Happy building with Han Framework!_ 🎉
