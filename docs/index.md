---
layout: home

hero:
  name: Han Framework
  text: A Modern Node.js Framework
  tagline: Developer-friendly, lightweight, and powerful. Build scalable applications with ease.
  image:
    src: /logo.svg
    alt: Han Framework
  actions:
    - theme: brand
      text: Get Started
      link: /introduction/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/your-org/han-framework

features:
  - icon: 🚀
    title: Zero Configuration
    details: Start building immediately with sensible defaults. No complex setup required - just install and code.

  - icon: 🛡️
    title: Security by Default
    details: Built-in security features including Helmet, CORS, and rate limiting out of the box.

  - icon: ⚡
    title: Lightning Fast
    details: Optimized performance with smart caching, lazy loading, and efficient dependency injection.

  - icon: 🔧
    title: Developer Friendly
    details: Clean API, excellent TypeScript support, and comprehensive documentation with real-world examples.

  - icon: 📦
    title: Full TypeScript Support
    details: First-class TypeScript support with decorators, type inference, and excellent IDE integration.

  - icon: 🎯
    title: NestJS Compatible
    details: Familiar syntax and patterns for developers coming from NestJS. Easy migration path.

  - icon: 🔄
    title: Auto-Restart on Changes
    details: Built-in hot reload with nodemon for seamless development experience.

  - icon: 📊
    title: Built-in Analytics
    details: Performance monitoring, logging, and diagnostics included - no third-party tools needed.

  - icon: 🧩
    title: Modular Architecture
    details: Organize your code with modules, providers, and dependency injection for maintainability.

  - icon: 💉
    title: Advanced DI
    details: Powerful dependency injection with @Inject, @InjectModel, and custom providers.

  - icon: 🎭
    title: Middleware System
    details: Flexible middleware at global, module, controller, and route levels with smart resolution.

  - icon: 🗃️
    title: Database Integration
    details: Seamless Mongoose integration with @InjectModel decorator for clean, type-safe database access.
---

## Quick Start

```bash
# Install CLI
npm install -g han-prev-cli

# Create new project
han new my-app

# Start development server
cd my-app
npm run dev
```

## Simple Example

```typescript
import { Controller, Get, Module } from 'han-prev-core';
import { HanFactory } from 'han-prev-core';

@Controller('hello')
export class HelloController {
  @Get()
  sayHello() {
    return { message: 'Hello, Han Framework!' };
  }
}

@Module({
  controllers: [HelloController],
})
export class AppModule {}

// Bootstrap
const app = await HanFactory.create(AppModule);
await app.listen(3000);
console.log('🚀 Server running on http://localhost:3000');
```

## Why Han Framework?

<div class="tip custom-block">
  <p class="custom-block-title">🎯 Developer Experience First</p>
  <p>Han Framework was built from the ground up with one goal: make developers happy. Clean syntax, excellent error messages, and comprehensive documentation mean you spend less time debugging and more time building.</p>
</div>

### Compared to Other Frameworks

| Feature | Han Framework | NestJS | Express |
|---------|--------------|--------|---------|
| TypeScript Support | ✅ First-class | ✅ First-class | ⚠️ Add-on |
| Decorators | ✅ Native | ✅ Native | ❌ Manual |
| DI Container | ✅ Built-in | ✅ Built-in | ❌ Manual |
| Module System | ✅ Built-in | ✅ Built-in | ❌ Manual |
| Middleware | ✅ Multi-level | ✅ Multi-level | ✅ Basic |
| Setup Complexity | 🟢 Zero config | 🟡 Some config | 🟢 Minimal |
| Bundle Size | 🟢 Small | 🟡 Medium | 🟢 Tiny |
| Learning Curve | 🟢 Easy | 🟡 Moderate | 🟢 Easy |
| Performance | ⚡ Very Fast | ⚡ Fast | ⚡ Very Fast |

## What's Next?

<div class="tip custom-block">
  <p class="custom-block-title">📚 Ready to Learn?</p>
  <p>Check out our <a href="/introduction/getting-started">Getting Started guide</a> to build your first Han Framework application, or dive into <a href="/fundamentals/controllers">Fundamentals</a> to learn the core concepts.</p>
</div>

## Community

Join our growing community:

- 💬 [Discord](https://discord.gg/hanframework) - Chat with other developers
- 🐦 [Twitter](https://twitter.com/hanframework) - Follow for updates
- 🐛 [GitHub Issues](https://github.com/your-org/han-framework/issues) - Report bugs
- 💡 [Discussions](https://github.com/your-org/han-framework/discussions) - Share ideas

## License

Han Framework is [MIT licensed](https://github.com/your-org/han-framework/blob/main/LICENSE).
