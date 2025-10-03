import { Router } from "express";
import {
  MetadataStorage,
  METADATA_KEYS,
  ControllerMetadata,
} from "../decorators/metadata";
import { container } from "../container/container";

export class RouterFactory {
  static createRouter(controllerInstance: any): Router {
    const router = Router();
    const controllerMetadata = MetadataStorage.get<ControllerMetadata>(
      controllerInstance,
      METADATA_KEYS.CONTROLLER,
    );

    if (!controllerMetadata) {
      throw new Error(
        `Controller metadata not found for ${controllerInstance.constructor.name}`,
      );
    }

    // Get controller-level middleware from @UseMiddleware decorator
    const controllerMiddleware =
      Reflect.getMetadata("controller:middleware", controllerInstance) || [];

    const routes = MetadataStorage.getRoutes(controllerInstance);

    routes.forEach((route) => {
      const fullPath = this.combinePaths(controllerMetadata.path, route.path);

      // Get module-level middleware that applies to this route
      const moduleMiddleware = this.getModuleMiddlewareForRoute(
        controllerInstance.constructor,
        fullPath,
        route.method.toUpperCase(),
      );

      const rawMiddleware = [
        ...(controllerMetadata.middleware || []),
        ...controllerMiddleware,
        ...moduleMiddleware,
        ...(route.middleware || []),
      ];

      // Resolve middleware (handle classes, instances, and functions)
      const middleware = this.resolveMiddleware(rawMiddleware);

      const originalHandler =
        controllerInstance[route.methodName].bind(controllerInstance);

      // Get parameter metadata for this route
      const paramMetadata = MetadataStorage.getParams(
        controllerInstance,
        route.methodName,
      );

      // Wrap handler to automatically serialize return values and extract parameters (like NestJS)
      const handler = async (req: any, res: any, next: any) => {
        try {
          // Build arguments array based on parameter decorators
          const args: any[] = [];

          if (paramMetadata && paramMetadata.length > 0) {
            // Sort by index to ensure correct order
            const sortedParams = [...paramMetadata].sort(
              (a, b) => a.index - b.index,
            );

            for (const param of sortedParams) {
              let value: any;

              switch (param.type) {
                case "body":
                  value = param.key ? req.body?.[param.key] : req.body;
                  break;
                case "param":
                  value = param.key ? req.params?.[param.key] : req.params;
                  break;
                case "query":
                  value = param.key ? req.query?.[param.key] : req.query;
                  break;
                case "headers":
                  value = param.key ? req.headers?.[param.key] : req.headers;
                  break;
                default:
                  value = undefined;
              }

              args[param.index] = value;
            }
          }

          const result = await originalHandler(...args);

          // If response was already sent (e.g., res.send() called manually), don't send again
          if (res.headersSent) {
            return;
          }

          // Automatically serialize and send the result
          if (result !== undefined) {
            res.json(result);
          } else {
            // If no return value and no response sent, send 204 No Content
            res.status(204).send();
          }
        } catch (error) {
          next(error);
        }
      };

      router[route.method](fullPath, ...middleware, handler);
    });

    return router;
  }

  /**
   * Get module-level middleware that should be applied to a specific route
   */
  private static getModuleMiddlewareForRoute(
    controllerClass: any,
    routePath: string,
    method: string,
  ): any[] {
    const allConfigs = container.getAllMiddlewareConfigs();
    const applicableMiddleware: any[] = [];

    allConfigs.forEach((consumer) => {
      if (!consumer || !consumer.getConfigs) {
        return;
      }

      const configs = consumer.getConfigs();
      configs.forEach((config: any) => {
        if (
          consumer.shouldApplyMiddleware(
            config,
            controllerClass,
            routePath,
            method,
          )
        ) {
          applicableMiddleware.push(...config.middleware);
        }
      });
    });

    return applicableMiddleware;
  }

  /**
   * Resolves middleware to Express-compatible functions.
   * Handles:
   * - Function middleware (pass through)
   * - Class instances with use() method
   * - Class constructors (auto-instantiate and call use())
   */
  private static resolveMiddleware(middlewareList: any[]): any[] {
    return middlewareList.map((mw) => {
      // Case 1: Already a function (Express middleware)
      if (typeof mw === "function" && mw.length >= 2) {
        // Check if it's a constructor (class) vs regular function
        const isClass = /^\s*class\s+/.test(mw.toString());

        if (isClass) {
          // Case 2: Class constructor - instantiate and call use()
          try {
            const instance = new mw();
            if (instance.use && typeof instance.use === "function") {
              return instance.use();
            }
            throw new Error(
              `Middleware class ${mw.name} must implement use() method`,
            );
          } catch (error) {
            throw new Error(
              `Failed to instantiate middleware class ${mw.name}: ${error.message}`,
            );
          }
        }

        // Regular function middleware
        return mw;
      }

      // Case 3: Instance with use() method
      if (mw && typeof mw.use === "function") {
        return mw.use();
      }

      throw new Error(
        `Invalid middleware: must be a function, class, or object with use() method`,
      );
    });
  }

  private static combinePaths(basePath: string, routePath: string): string {
    // Ensure basePath starts with /
    let cleanBase = basePath || "";
    if (cleanBase && !cleanBase.startsWith("/")) {
      cleanBase = "/" + cleanBase;
    }
    // Remove trailing slash from basePath
    cleanBase = cleanBase.replace(/\/$/, "");

    // Handle empty route path (e.g., @Get() with no path)
    if (!routePath || routePath === "") {
      return cleanBase || "/";
    }

    // Ensure route path starts with /
    const cleanRoute = routePath.startsWith("/") ? routePath : `/${routePath}`;
    return cleanBase + cleanRoute;
  }
}
