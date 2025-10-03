# Han CLI

A powerful command-line interface for the Han Framework, inspired by NestJS CLI.

## Installation

```bash
npm install -g @han/cli
```

## Commands

### Create New Project

```bash
han new my-project
```

### Generate Code

```bash
# Generate a controller
han generate controller user
han g c user

# Generate a service
han generate service user
han g s user

# Generate a module
han generate module user
han g m user

# Generate middleware
han generate middleware auth
han g mi auth

# Generate other components
han g interceptor logging
han g guard auth
han g decorator roles
han g interface user
han g class user
```

### Build Project

```bash
han build
han build --watch
han build --webpack
```

### Start Project

```bash
han start
han start --watch
han start --debug
han start --port 4000
```

### Project Info

```bash
han info
```

## Options

Most commands support additional options:

- `--dry-run`: Preview changes without creating files
- `--spec`: Generate test files alongside source files
- `--skip-import`: Skip automatic imports

## Examples

```bash
# Create a new project
han new my-han-app

# Generate a complete CRUD controller
han g controller user --spec

# Build and watch for changes
han build --watch

# Start in development mode
han start --watch --debug
```
