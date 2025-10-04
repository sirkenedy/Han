# CLI Overview

The Han Framework CLI (`han-prev-cli`) is a powerful command-line tool that helps you initialize, develop, and build your Han Framework applications.

## Installation

### Global Installation (Recommended)

```bash
npm install -g han-prev-cli
```

Verify installation:

```bash
han --version
```

### Local Installation

```bash
npm install --save-dev han-prev-cli
```

Use with npx:

```bash
npx han new my-app
```

## Quick Start

```bash
# Create a new project
han new my-app

# Navigate to project
cd my-app

# Install dependencies
npm install

# Start development server
npm run dev
```

Your application is now running at `http://localhost:3000`!

## Available Commands

### `han new <name>`

Creates a new Han Framework project with complete boilerplate.

```bash
han new my-app
```

**Options:**
- `--skip-install` - Skip npm install
- `--skip-git` - Skip git initialization

**What it creates:**
```
my-app/
├── src/
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.module.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

### `han generate <schematic> <name>`

Generate application components (controllers, services, modules, etc.).

```bash
# Generate a controller
han generate controller users

# Generate a service
han generate service users

# Generate a module
han generate module users

# Generate a complete resource (controller + service + module)
han generate resource products
```

**Aliases:**
- `han g` - Short for `generate`
- `han g c users` - Generate controller
- `han g s users` - Generate service
- `han g mo users` - Generate module
- `han g res products` - Generate resource

### `han info`

Display project and system information.

```bash
han info
```

**Output:**
```
Han Framework CLI Information
=============================

System Information:
  OS: darwin (23.5.0)
  Node: v20.11.0
  npm: 10.2.4

Han Framework Packages:
  han-prev-cli: 1.0.37
  han-prev-core: 1.0.21
  han-prev-common: 1.0.4
  han-prev-testing: 1.0.19
```

## Available Schematics

### Controller

Generate a new controller:

```bash
han generate controller users
```

Creates `src/users/users.controller.ts`:
```typescript
import { Controller, Get } from 'han-prev-core';

@Controller('users')
export class UsersController {
  @Get()
  findAll() {
    return 'This action returns all users';
  }
}
```

### Service

Generate a new service:

```bash
han generate service users
```

Creates `src/users/users.service.ts`:
```typescript
import { Injectable } from 'han-prev-core';

@Injectable()
export class UsersService {
  findAll() {
    return 'This action returns all users';
  }
}
```

### Module

Generate a new module:

```bash
han generate module users
```

Creates `src/users/users.module.ts`:
```typescript
import { Module } from 'han-prev-core';

@Module({
  controllers: [],
  providers: [],
})
export class UsersModule {}
```

### Resource (Complete Feature)

Generate a complete CRUD resource:

```bash
han generate resource products
```

Creates:
- `products.controller.ts` - Controller with CRUD routes
- `products.service.ts` - Service with CRUD logic
- `products.module.ts` - Module configuration

**With auto-import to app.module.ts!**

### Middleware

Generate middleware:

```bash
han generate middleware logger
```

Creates `src/middleware/logger.middleware.ts`:
```typescript
import { Injectable } from 'han-prev-core';
import { HanMiddleware, MiddlewareFunction } from 'han-prev-common';

@Injectable()
export class LoggerMiddleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req: any, res: any, next: any) => {
      console.log('LoggerMiddleware executing...');
      next();
    };
  }
}
```

### Guard

Generate an authorization guard:

```bash
han generate guard auth
```

### Interceptor

Generate an interceptor:

```bash
han generate interceptor logging
```

## Project Structure

The CLI generates a well-organized project:

```
my-app/
├── src/
│   ├── users/              # Feature module
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── dto/
│   │       └── create-user.dto.ts
│   ├── products/           # Another feature module
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── products.module.ts
│   ├── middleware/         # Shared middleware
│   │   └── logger.middleware.ts
│   ├── guards/             # Shared guards
│   │   └── auth.guard.ts
│   ├── app.controller.ts   # Root controller
│   ├── app.service.ts      # Root service
│   ├── app.module.ts       # Root module
│   └── index.ts            # Entry point
├── test/                   # E2E tests
│   └── app.e2e-spec.ts
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## Configuration

### Dry Run

See what would be generated without actually creating files:

```bash
han generate controller users --dry-run
```

### Custom Output Path

Generate in a specific directory:

```bash
han generate controller users --path src/features
```

## Best Practices

### 1. Use Feature Modules

Organize related components into modules:

```bash
# Create a users feature
han generate resource users

# Result:
# src/users/
#   ├── users.controller.ts
#   ├── users.service.ts
#   └── users.module.ts
```

### 2. Follow Naming Conventions

The CLI automatically handles naming:

```bash
# These all work:
han generate controller Users
han generate controller users
han generate controller UsersController

# All create: UsersController
```

### 3. Generate Complete Resources

Use `resource` for full CRUD features:

```bash
han generate resource products

# Faster than:
han generate controller products
han generate service products
han generate module products
```

### 4. Let CLI Handle Imports

The CLI automatically:
- Adds imports to app.module.ts
- Creates proper file structure
- Sets up TypeScript exports

## Troubleshooting

### Command Not Found

```bash
han: command not found
```

**Solution:**
- Install globally: `npm install -g han-prev-cli`
- Or use npx: `npx han new my-app`

### Permission Errors

```bash
EACCES: permission denied
```

**Solution:**
- Use `sudo` (not recommended)
- Fix npm permissions: [npm docs](https://docs.npmjs.com/resolving-eacces-permissions-errors)
- Use nvm for Node version management

### Generate Overwrites Files

**Solution:**
- The CLI prompts before overwriting
- Use `--dry-run` to preview changes
- Back up your work regularly

## Next Steps

- [CLI Usage Examples](/cli/usage)
- [Generator Reference](/cli/generators)
- [Getting Started](/introduction/getting-started)

## Tips & Tricks

### Aliases

Save typing with command aliases:

```bash
# Instead of:
han generate controller users

# Use:
han g c users
```

### Batch Generation

Create multiple components:

```bash
han g c users
han g s users
han g mo users

# Or just:
han g res users
```

### Version Check

Always use the latest version:

```bash
npm update -g han-prev-cli
```

## Need Help?

```bash
# Get help for any command
han --help
han new --help
han generate --help
```

- 📖 [Full CLI Reference](/cli/generators)
- 💬 [Discord Community](https://discord.gg/hanframework)
- 🐛 [Report CLI Issues](https://github.com/sirkenedy/han/issues)
