import { Router } from 'express';
import { MetadataStorage, METADATA_KEYS, ControllerMetadata } from '@/decorators/metadata';

export class RouterFactory {
  static createRouter(controllerInstance: any): Router {
    const router = Router();
    const controllerMetadata = MetadataStorage.get<ControllerMetadata>(
      controllerInstance,
      METADATA_KEYS.CONTROLLER
    );

    if (!controllerMetadata) {
      throw new Error(`Controller metadata not found for ${controllerInstance.constructor.name}`);
    }

    const routes = MetadataStorage.getRoutes(controllerInstance);

    routes.forEach((route) => {
      const fullPath = this.combinePaths(controllerMetadata.path, route.path);
      const middleware = [
        ...(controllerMetadata.middleware || []),
        ...(route.middleware || []),
      ];

      const handler = controllerInstance[route.methodName].bind(controllerInstance);

      router[route.method](fullPath, ...middleware, handler);
    });

    return router;
  }

  private static combinePaths(basePath: string, routePath: string): string {
    const cleanBase = basePath.replace(/\/$/, '');
    const cleanRoute = routePath.startsWith('/') ? routePath : `/${routePath}`;
    return cleanBase + cleanRoute;
  }
}