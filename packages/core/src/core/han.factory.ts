import "reflect-metadata";
import * as express from "express";
import { Express } from "express";
import { container } from "../container/container";
import { AppFactory } from "./app.factory";
import { RouteMapper, EnvironmentDetector } from "../utils";
import { errorHandler } from "../middleware/error.middleware";
import {
  HanInterceptor,
  InterceptorConstructor,
  InterceptorContext,
  InterceptorResponse,
} from "../interfaces/interceptor.interface";

// Import types separately and use require for CommonJS modules
import type { CorsOptions } from "cors";
import type { HelmetOptions } from "helmet";

const cors: (options?: CorsOptions) => any = require("cors");
const helmet: (options?: HelmetOptions) => any = require("helmet");

export interface HanApplicationOptions {
  cors?: boolean | CorsOptions;
  helmet?: boolean | HelmetOptions;
  bodyParser?: boolean;
  globalPrefix?: string;
  microservice?: boolean;
  logger?: boolean | any;
  shutdownHooks?: {
    enabled?: boolean;
    signals?: Array<keyof HanApplicationShutdownSignal>;
    gracefulTimeout?: number; // milliseconds
  };
}

export interface HanApplicationShutdownSignal {
  SIGINT: string;
  SIGTERM: string;
  SIGKILL: string;
}

export interface HanApplication {
  app: Express;
  listen(port: number | string, callback?: () => void): Promise<any>;
  listen(
    port: number | string,
    hostname: string,
    callback?: () => void,
  ): Promise<any>;
  enableCors(): HanApplication;
  useGlobalPrefix(prefix: string): HanApplication;
  getUrl(): Promise<string>;
  close(): Promise<void>;
  getRoutes(): any[];
  get<T>(token: string | (new (...args: any[]) => T)): T;
  getHttpServer(): any;
  getHttpAdapter(): any;
  startAllMicroservices(): Promise<HanApplication>;
  useGlobalFilters(...filters: any[]): HanApplication;
  useGlobalPipes(...pipes: any[]): HanApplication;
  useGlobalInterceptors(...interceptors: any[]): HanApplication;
  useGlobalGuards(...guards: any[]): HanApplication;
  use(...args: any[]): HanApplication;

  // Lifecycle management methods (like NestJS)
  init(): Promise<void>;
  onApplicationShutdown(callback: () => Promise<void> | void): void;
}

export class HanFactory {
  private moduleClass: any;
  private options: HanApplicationOptions;
  private app: Express;
  private controllers: any[] = [];
  private server: any = null;
  private isShuttingDown: boolean = false;
  private shutdownCallbacks: Set<() => Promise<void> | void> = new Set();

  constructor(moduleClass: any, options: HanApplicationOptions = {}) {
    this.moduleClass = moduleClass;
    const defaultShutdownHooks = {
      enabled: true,
      signals: ["SIGINT", "SIGTERM"] as Array<
        keyof HanApplicationShutdownSignal
      >,
      gracefulTimeout: 10000, // 10 seconds
    };

    this.options = {
      cors: true,
      helmet: true,
      bodyParser: true,
      globalPrefix: "",
      microservice: false,
      logger: true,
      ...options,
      shutdownHooks: {
        ...defaultShutdownHooks,
        ...options.shutdownHooks,
      },
    };
    this.app = express();
  }

  static async create(
    moduleClass: any,
    options: HanApplicationOptions = {},
  ): Promise<HanApplication> {
    const factory = new HanFactory(moduleClass, options);
    return await factory.bootstrap();
  }

  static async createMicroservice(
    moduleClass: any,
    options: HanApplicationOptions = {},
  ): Promise<HanApplication> {
    const factory = new HanFactory(moduleClass, {
      ...options,
      microservice: true,
      cors: false,
      helmet: false,
    });
    return await factory.bootstrap();
  }

  async bootstrap(): Promise<HanApplication> {
    // Performance optimization: run middleware and module setup in parallel
    await Promise.all([
      this.setupCriticalMiddleware(), // Essential middleware first
      this.bootstrapModule(),
    ]);

    // CRITICAL: Setup optional middleware (CORS, Helmet) BEFORE routes
    // Express middleware order matters - middleware must come before routes
    this.setupOptionalMiddleware();

    // Setup routes after dependencies are resolved and middleware is configured
    this.setupRoutes();
    this.setupGlobalPrefix(); // Move global prefix setup after routes

    // Error handling must be last to catch all errors
    this.setupErrorHandling();

    // Automatically setup shutdown hooks if enabled
    const app = this.createApplicationInstance();
    if (this.options.shutdownHooks?.enabled) {
      this.setupShutdownHooks(app);
    }

    return app;
  }

  private async setupCriticalMiddleware(): Promise<void> {
    // Essential middleware for request processing
    if (this.options.bodyParser) {
      this.app.use(express.json());
      this.app.use(express.urlencoded({ extended: true }));
    }
  }

  private setupOptionalMiddleware(): void {
    // Security and feature middleware
    if (this.options.helmet) {
      if (typeof this.options.helmet === "boolean") {
        this.app.use(helmet());
      } else {
        this.app.use(helmet(this.options.helmet as HelmetOptions));
      }
    }

    if (this.options.cors) {
      if (typeof this.options.cors === "boolean") {
        this.app.use(cors());
      } else {
        this.app.use(cors(this.options.cors as CorsOptions));
      }
    }
  }

  private async bootstrapModule(): Promise<void> {
    container.registerModule(this.moduleClass);
    this.controllers = this.extractControllersFromModule(this.moduleClass);
  }

  private setupRoutes(): void {
    AppFactory.registerControllers(this.app, this.controllers);
    RouteMapper.collectAllRoutes(this.controllers, this.options.globalPrefix);
  }

  private setupGlobalPrefix(): void {
    if (this.options.globalPrefix) {
      const prefixedApp = express();
      prefixedApp.use(this.options.globalPrefix, this.app);
      this.app = prefixedApp;
    }
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private setupShutdownHooks(_app: HanApplication): void {
    if (!this.options.shutdownHooks?.enabled) return;

    const signals = this.options.shutdownHooks.signals || ["SIGINT", "SIGTERM"];
    const gracefulTimeout = this.options.shutdownHooks.gracefulTimeout || 10000;

    // Setup process signal handlers automatically
    signals.forEach((signal) => {
      process.on(signal, async () => {
        if (this.isShuttingDown) {
          console.log(
            `\n⚠️  Force shutdown on ${signal}. Process will exit forcefully.`,
          );
          process.exit(1);
        }

        console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
        this.isShuttingDown = true;

        // Set timeout for graceful shutdown
        const shutdownTimer = setTimeout(() => {
          console.log(
            `\n⏰ Graceful shutdown timeout (${gracefulTimeout}ms). Forcing exit...`,
          );
          process.exit(1);
        }, gracefulTimeout);

        try {
          // Execute shutdown callbacks
          console.log("📞 Executing shutdown hooks...");
          const shutdownPromises = Array.from(this.shutdownCallbacks).map(
            (callback) => Promise.resolve(callback()),
          );

          await Promise.allSettled(shutdownPromises);

          // Close HTTP server
          if (this.server) {
            console.log("🔌 Closing HTTP server...");
            await new Promise<void>((resolve) => {
              this.server.close((err: any) => {
                if (err) {
                  if (err.code === "ERR_SERVER_NOT_RUNNING") {
                    console.log("✅ HTTP server already closed");
                  } else {
                    console.error("❌ Error closing server:", err);
                  }
                } else {
                  console.log("✅ HTTP server closed successfully");
                }
                resolve();
              });
            });
          }

          clearTimeout(shutdownTimer);
          console.log("🎉 Graceful shutdown completed. Process exiting...");
          process.exit(0);
        } catch (error: any) {
          clearTimeout(shutdownTimer);
          if (error.code === "ERR_SERVER_NOT_RUNNING") {
            console.log("🎉 Graceful shutdown completed. Process exiting...");
            process.exit(0);
          } else {
            console.error("❌ Error during shutdown:", error);
            process.exit(1);
          }
        }
      });
    });

    console.log(
      `🛡️  Shutdown hooks automatically enabled for signals: ${signals.join(", ")}`,
    );

    // Add default cleanup callback
    this.shutdownCallbacks.add(async () => {
      console.log("🧹 Running framework cleanup...");
      // Any default framework cleanup logic can go here
    });
  }

  private extractControllersFromModule(moduleClass: any): any[] {
    const controllers: any[] = [];
    const visited = new Set();

    const extractControllers = (module: any) => {
      if (visited.has(module)) return;
      visited.add(module);

      const moduleMetadata = container.getModuleMetadata(module);

      if (moduleMetadata?.controllers) {
        controllers.push(...moduleMetadata.controllers);
      }

      if (moduleMetadata?.imports) {
        moduleMetadata.imports.forEach((importedModule: any) => {
          extractControllers(importedModule);
        });
      }
    };

    extractControllers(moduleClass);
    return controllers;
  }

  private createApplicationInstance(): HanApplication {
    const factoryInstance = this;

    return {
      app: factoryInstance.app,

      async listen(
        port: number | string,
        hostnameOrCallback?: string | (() => void),
        callback?: () => void,
      ): Promise<any> {
        const actualPort = typeof port === "string" ? parseInt(port, 10) : port;

        // Auto-detect environment for host binding
        const envInfo = EnvironmentDetector.detect();
        let hostname: string;
        let actualCallback: (() => void) | undefined;

        // Handle overloaded signatures like NestJS
        if (typeof hostnameOrCallback === "string") {
          hostname = hostnameOrCallback;
          actualCallback = callback;
        } else {
          hostname = envInfo.defaultHost; // Auto-detect: 0.0.0.0 for containers/production, localhost for dev
          actualCallback = hostnameOrCallback;
        }

        return new Promise((resolve) => {
          const server = factoryInstance.app.listen(
            actualPort,
            hostname,
            () => {
              factoryInstance.server = server; // Set server reference immediately after listen

              if (!factoryInstance.options.microservice) {
                // Get dynamic server URL and environment info
                const boundAddress = server.address();
                let serverUrl = `http://localhost:${actualPort}`;

                if (boundAddress && typeof boundAddress !== "string") {
                  let address = boundAddress.address;
                  const port = boundAddress.port;

                  // Handle IPv6 and IPv4 like NestJS
                  if (boundAddress.family === "IPv6") {
                    address = `[${address}]`;
                  }

                  // If bound to 0.0.0.0 or ::, use localhost for display
                  if (address === "0.0.0.0" || address === "::") {
                    address = "localhost";
                  }

                  serverUrl = `http://${address}:${port}`;
                }

                // Get environment info from detector
                const envInfo = EnvironmentDetector.detect();
                const environment = envInfo.isProduction
                  ? "production"
                  : "development";

                RouteMapper.displayRoutes(serverUrl, environment);
              }

              if (actualCallback) {
                actualCallback();
              }

              resolve(server);
            },
          );
        });
      },

      enableCors(): HanApplication {
        factoryInstance.app.use(cors());
        return this;
      },

      useGlobalPrefix(_: string): HanApplication {
        console.warn(
          "useGlobalPrefix should be configured during factory creation for best results",
        );
        return this;
      },

      async getUrl(): Promise<string> {
        if (!factoryInstance.server) {
          throw new Error("Server is not listening. Call listen() first.");
        }

        const boundAddress = factoryInstance.server.address();
        if (!boundAddress) {
          throw new Error("Server address is not available.");
        }

        // Return actual bound address like NestJS
        const family = boundAddress.family;
        let address = boundAddress.address;
        const port = boundAddress.port;

        // Handle IPv6 and IPv4 like NestJS
        if (family === "IPv6") {
          address = `[${address}]`;
        }

        // If bound to 0.0.0.0 or ::, return localhost for client connections
        // The server binds to all interfaces, but clients should connect via localhost
        if (address === "0.0.0.0" || address === "::") {
          address = "localhost";
        }

        const protocol = "http"; // TODO: detect HTTPS if needed
        return `${protocol}://${address}:${port}`;
      },

      getRoutes(): any[] {
        return RouteMapper.collectAllRoutes(
          factoryInstance.controllers,
          factoryInstance.options.globalPrefix,
        );
      },

      async close(): Promise<void> {
        if (factoryInstance.server) {
          return new Promise((resolve, reject) => {
            factoryInstance.server.close((err: any) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      },

      get<T>(token: string | (new (...args: any[]) => T)): T {
        const tokenName = typeof token === "string" ? token : token.name;
        return container.resolve<T>(tokenName);
      },

      // NestJS-compatible methods
      getHttpServer(): any {
        return factoryInstance.server;
      },

      getHttpAdapter(): any {
        return factoryInstance.app; // Express app serves as the HTTP adapter
      },

      async startAllMicroservices(): Promise<HanApplication> {
        // For now, return this as we don't have microservices implementation yet
        // This would be expanded when microservices are fully implemented
        return this;
      },

      useGlobalFilters(...filters: any[]): HanApplication {
        // Add global error filters
        filters.forEach((filter) => {
          if (typeof filter === "function") {
            factoryInstance.app.use(filter);
          } else if (filter && typeof filter.catch === "function") {
            // Error handling middleware
            factoryInstance.app.use(
              (err: any, req: any, res: any, next: any) => {
                filter.catch(err, { req, res, next });
              },
            );
          }
        });
        return this;
      },

      useGlobalPipes(...pipes: any[]): HanApplication {
        // Add global pipes (validation/transformation middleware)
        pipes.forEach((pipe) => {
          if (typeof pipe === "function") {
            factoryInstance.app.use(pipe);
          } else if (pipe && typeof pipe.transform === "function") {
            factoryInstance.app.use((req: any, res: any, next: any) => {
              try {
                pipe.transform(req.body, { req, res });
                next();
              } catch (error) {
                next(error);
              }
            });
          }
        });
        return this;
      },

      useGlobalInterceptors(
        ...interceptors: (HanInterceptor | InterceptorConstructor)[]
      ): HanApplication {
        // Add global interceptors with intuitive lifecycle hooks
        interceptors.forEach((InterceptorOrClass) => {
          let interceptorInstance: HanInterceptor;

          // Handle class constructors vs instances
          if (typeof InterceptorOrClass === "function") {
            interceptorInstance = new InterceptorOrClass();
          } else if (
            InterceptorOrClass &&
            (InterceptorOrClass.beforeHandle ||
              InterceptorOrClass.afterHandle ||
              InterceptorOrClass.onError)
          ) {
            interceptorInstance = InterceptorOrClass;
          } else {
            console.warn(
              "Invalid interceptor provided. Must implement at least one HanInterceptor method.",
            );
            return;
          }

          // Register the interceptor as Express middleware with lifecycle hooks
          factoryInstance.app.use(async (req: any, res: any, next: any) => {
            const startTime = Date.now();
            const traceId =
              req.headers["x-trace-id"] ||
              `trace_${startTime}_${Math.random().toString(36).substring(2, 11)}`;

            const context: InterceptorContext = {
              req,
              res,
              method: req.method,
              path: req.path,
              startTime,
              traceId,
            };

            try {
              // Call beforeHandle if it exists
              if (interceptorInstance.beforeHandle) {
                await interceptorInstance.beforeHandle(context);
              }

              // Intercept the response to call afterHandle
              const originalSend = res.send;
              const originalJson = res.json;
              let responseData: any = null;
              let responseCalled = false;

              // Override res.send
              res.send = function (data: any) {
                if (!responseCalled) {
                  responseCalled = true;
                  responseData = data;
                  handleResponse();
                }
                return originalSend.call(this, data);
              };

              // Override res.json
              res.json = function (data: any) {
                if (!responseCalled) {
                  responseCalled = true;
                  responseData = data;
                  handleResponse();
                }
                return originalJson.call(this, data);
              };

              const handleResponse = async () => {
                try {
                  if (interceptorInstance.afterHandle) {
                    const response: InterceptorResponse = {
                      statusCode: res.statusCode,
                      data: responseData,
                      duration: Date.now() - startTime,
                    };
                    await interceptorInstance.afterHandle(context, response);
                  }
                } catch (error) {
                  console.error("Error in interceptor afterHandle:", error);
                }
              };

              next();
            } catch (error) {
              // Call onError if it exists
              if (interceptorInstance.onError) {
                try {
                  await interceptorInstance.onError(context, error);
                } catch (interceptorError) {
                  console.error(
                    "Error in interceptor onError handler:",
                    interceptorError,
                  );
                }
              }
              next(error);
            }
          });
        });
        return this;
      },

      useGlobalGuards(...guards: any[]): HanApplication {
        // Add global guards (authentication/authorization)
        guards.forEach((guard) => {
          if (typeof guard === "function") {
            factoryInstance.app.use(guard);
          } else if (guard && typeof guard.canActivate === "function") {
            factoryInstance.app.use((req: any, res: any, next: any) => {
              const canActivate = guard.canActivate({ req, res });
              if (canActivate === true || (canActivate && canActivate.then)) {
                if (canActivate === true) {
                  next();
                } else {
                  canActivate
                    .then((result: boolean) => {
                      if (result) {
                        next();
                      } else {
                        res.status(403).json({ message: "Forbidden" });
                      }
                    })
                    .catch(next);
                }
              } else {
                res.status(403).json({ message: "Forbidden" });
              }
            });
          }
        });
        return this;
      },

      use(...args: any[]): HanApplication {
        // Direct Express middleware support - wrapper around app.use()
        factoryInstance.app.use(...args);
        return this;
      },

      // Lifecycle management methods

      async init(): Promise<void> {
        // Initialize the application (similar to NestJS)
        console.log("🔧 Initializing Han Framework application...");

        // Application is automatically initialized with shutdown hooks in bootstrap()
        // This method is kept for NestJS compatibility and future extensions

        console.log("✅ Han Framework application initialized successfully");
      },

      onApplicationShutdown(callback: () => Promise<void> | void): void {
        // Register a shutdown callback to be executed before application shutdown
        factoryInstance.shutdownCallbacks.add(callback);
      },
    };
  }
}

export async function createHanApp(
  moduleClass: any,
  options?: HanApplicationOptions,
): Promise<HanApplication> {
  return await HanFactory.create(moduleClass, options);
}

export async function createHanMicroservice(
  moduleClass: any,
  options?: HanApplicationOptions,
): Promise<HanApplication> {
  return await HanFactory.createMicroservice(moduleClass, options);
}
