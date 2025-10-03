import { Router } from "express";
import {
  MetadataStorage,
  METADATA_KEYS,
  ControllerMetadata,
} from "../decorators/metadata";

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

    const routes = MetadataStorage.getRoutes(controllerInstance);

    routes.forEach((route) => {
      const fullPath = this.combinePaths(controllerMetadata.path, route.path);
      const middleware = [
        ...(controllerMetadata.middleware || []),
        ...(route.middleware || []),
      ];

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

  private static combinePaths(basePath: string, routePath: string): string {
    const cleanBase = basePath.replace(/\/$/, "");
    const cleanRoute = routePath.startsWith("/") ? routePath : `/${routePath}`;
    return cleanBase + cleanRoute;
  }
}
