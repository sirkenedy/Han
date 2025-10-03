# Han Framework - Lifecycle Management

The Han Framework provides comprehensive application lifecycle management with automatic shutdown hooks, graceful termination, and custom cleanup operations.

## 🛡️ Automatic Shutdown Hooks

The framework automatically handles application shutdown without requiring manual configuration.

### Default Behavior

```typescript
const app = await HanFactory.create(AppModule); // ✅ Shutdown hooks enabled by default
```

**Automatic features:**

- ✅ **SIGINT/SIGTERM signal handling** - Responds to Ctrl+C and process termination
- ✅ **Graceful shutdown sequence** - Completes ongoing requests before shutdown
- ✅ **HTTP server closure** - Properly closes the server and releases ports
- ✅ **Error handling** - Handles edge cases during shutdown process
- ✅ **Timeout protection** - Prevents hanging with configurable timeout (default: 10 seconds)

### Configuration Options

```typescript
const app = await HanFactory.create(AppModule, {
  shutdownHooks: {
    enabled: true, // Enable/disable automatic shutdown hooks
    signals: ["SIGINT", "SIGTERM"], // Signals to handle
    gracefulTimeout: 15000, // Timeout in milliseconds (15 seconds)
  },
});
```

### Disabling Shutdown Hooks

```typescript
const app = await HanFactory.create(AppModule, {
  shutdownHooks: {
    enabled: false, // Disable automatic shutdown hooks
  },
});
```

## 🔧 Custom Shutdown Operations

Register custom cleanup operations that execute automatically during shutdown.

### Basic Usage

```typescript
const app = await HanFactory.create(AppModule);

// Register database cleanup
app.onApplicationShutdown(async () => {
  console.log("🗄️  Closing database connections...");
  await database.close();
  console.log("✅ Database connections closed");
});

// Register cache cleanup
app.onApplicationShutdown(() => {
  console.log("🧹 Clearing application cache...");
  cache.clear();
  console.log("✅ Cache cleared");
});
```

### Advanced Examples

#### Database Connection Management

```typescript
app.onApplicationShutdown(async () => {
  try {
    await Promise.all([
      primaryDb.close(),
      redisClient.quit(),
      mongoClient.close(),
    ]);
    console.log("✅ All database connections closed");
  } catch (error) {
    console.error("❌ Error closing database connections:", error);
  }
});
```

#### File System Cleanup

```typescript
app.onApplicationShutdown(async () => {
  const tempDir = "/tmp/app-temp";
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log("✅ Temporary files cleaned up");
  } catch (error) {
    console.error("❌ Error cleaning temp files:", error);
  }
});
```

#### External Service Disconnection

```typescript
app.onApplicationShutdown(async () => {
  await Promise.allSettled([
    messageQueue.disconnect(),
    webhookService.unregisterAll(),
    metricsClient.flush(),
  ]);
  console.log("✅ External services disconnected");
});
```

## 📋 Shutdown Sequence

When a shutdown signal is received, the framework executes the following sequence:

1. **Signal Detection** - Framework detects SIGINT/SIGTERM
2. **Shutdown Initiation** - Logs shutdown start message
3. **Custom Hooks Execution** - Runs all registered `onApplicationShutdown` callbacks
4. **Framework Cleanup** - Internal framework cleanup operations
5. **HTTP Server Closure** - Gracefully closes the HTTP server
6. **Process Exit** - Clean process termination with exit code 0

### Example Output

```bash
🛑 Received SIGTERM. Initiating graceful shutdown...
📞 Executing shutdown hooks...
🧹 Running framework cleanup...
🗄️  Closing database connections...
🧹 Clearing application cache...
✅ Cache cleared
✅ Database connections closed
🔌 Closing HTTP server...
✅ HTTP server closed successfully
🎉 Graceful shutdown completed. Process exiting...
```

## ⚡ Force Shutdown

If a second signal is received during shutdown, the framework will force-exit:

```bash
⚠️  Force shutdown on SIGTERM. Process will exit forcefully.
```

If the graceful timeout is exceeded:

```bash
⏰ Graceful shutdown timeout (15000ms). Forcing exit...
```

## 🎯 Best Practices

### 1. Order Independence

Shutdown hooks execute concurrently, so don't rely on execution order:

```typescript
// ✅ Good - Independent operations
app.onApplicationShutdown(() => cache.clear());
app.onApplicationShutdown(() => logFile.close());

// ❌ Avoid - Dependent operations
app.onApplicationShutdown(() => database.close());
app.onApplicationShutdown(() => database.cleanup()); // May fail if DB already closed
```

### 2. Error Handling

Always handle errors in shutdown hooks:

```typescript
app.onApplicationShutdown(async () => {
  try {
    await database.close();
  } catch (error) {
    console.error("Database close error:", error);
    // Don't throw - let other hooks continue
  }
});
```

### 3. Timeout Awareness

Keep operations within the graceful timeout:

```typescript
app.onApplicationShutdown(async () => {
  // ✅ Good - Quick operation
  await cache.clear();

  // ❌ Avoid - Long-running operation
  // await massiveDataExport(); // This might exceed timeout
});
```

### 4. Resource Cleanup Priority

Clean up resources in order of importance:

```typescript
// High priority - data integrity
app.onApplicationShutdown(async () => {
  await database.flush();
  await transactionLog.close();
});

// Medium priority - external services
app.onApplicationShutdown(async () => {
  await apiClient.disconnect();
});

// Low priority - temporary resources
app.onApplicationShutdown(() => {
  tempFiles.cleanup();
});
```

## 🔄 Development vs Production

The framework behaves consistently across environments, but you might want different configurations:

### Development

```typescript
const app = await HanFactory.create(AppModule, {
  shutdownHooks: {
    gracefulTimeout: 5000, // Shorter timeout for faster restarts
  },
});
```

### Production

```typescript
const app = await HanFactory.create(AppModule, {
  shutdownHooks: {
    gracefulTimeout: 30000, // Longer timeout for complex cleanup
  },
});
```

## 🆚 Comparison with Other Frameworks

### NestJS

```typescript
// NestJS requires manual enablement
app.enableShutdownHooks();
```

### Han Framework

```typescript
// Han Framework - automatic by default
const app = await HanFactory.create(AppModule); // ✅ Already enabled
```

### Framework Advantages

- ✅ **Zero configuration** - Works out of the box
- ✅ **Configurable** - Customize when needed
- ✅ **Error resilient** - Handles edge cases gracefully
- ✅ **Production ready** - Proper timeout and force-exit handling
- ✅ **Developer friendly** - Clear logging and status messages

## 📖 API Reference

### `onApplicationShutdown(callback)`

Registers a cleanup function to execute during application shutdown.

**Parameters:**

- `callback: () => Promise<void> | void` - Sync or async cleanup function

**Returns:** `void`

**Example:**

```typescript
app.onApplicationShutdown(async () => {
  await cleanup();
});
```

### Shutdown Configuration

Configure shutdown behavior through `HanApplicationOptions.shutdownHooks`:

```typescript
interface ShutdownHooksOptions {
  enabled?: boolean; // Default: true
  signals?: Array<"SIGINT" | "SIGTERM">; // Default: ['SIGINT', 'SIGTERM']
  gracefulTimeout?: number; // Default: 10000 (10 seconds)
}
```
