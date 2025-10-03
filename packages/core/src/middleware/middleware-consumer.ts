import {
  MiddlewareConsumer,
  MiddlewareConfigProxy,
  Type,
  RouteInfo,
  RequestMethod,
} from "han-prev-common";

interface MiddlewareConfig {
  middleware: any[];
  routes: (string | Type<any> | RouteInfo)[];
  excludedRoutes: (string | RouteInfo)[];
}

export class MiddlewareConsumerImpl implements MiddlewareConsumer {
  private configs: MiddlewareConfig[] = [];
  private currentConfig: MiddlewareConfig | null = null;

  apply(...middleware: any[]): MiddlewareConfigProxy {
    this.currentConfig = {
      middleware,
      routes: [],
      excludedRoutes: [],
    };
    this.configs.push(this.currentConfig);

    return {
      forRoutes: (...routes: (string | Type<any> | RouteInfo)[]) => {
        if (this.currentConfig) {
          this.currentConfig.routes = routes;
        }
        return this;
      },
      exclude: (...routes: (string | RouteInfo)[]) => {
        if (this.currentConfig) {
          this.currentConfig.excludedRoutes = routes;
        }
        return {
          forRoutes: (...routes: (string | Type<any> | RouteInfo)[]) => {
            if (this.currentConfig) {
              this.currentConfig.routes = routes;
            }
            return this;
          },
          exclude: (...routes: (string | RouteInfo)[]) => {
            if (this.currentConfig) {
              this.currentConfig.excludedRoutes.push(...routes);
            }
            return this as any;
          },
        };
      },
    };
  }

  getConfigs(): MiddlewareConfig[] {
    return this.configs;
  }

  /**
   * Check if middleware should be applied to a given route
   */
  shouldApplyMiddleware(
    config: MiddlewareConfig,
    controllerClass: Type<any>,
    routePath: string,
    method: string,
  ): boolean {
    // Check if route is explicitly excluded
    const isExcluded = config.excludedRoutes.some((route) => {
      if (typeof route === "string") {
        return this.matchPath(route, routePath);
      }
      return (
        this.matchPath(route.path, routePath) &&
        (!route.method || route.method === method)
      );
    });

    if (isExcluded) {
      return false;
    }

    // Check if route matches any forRoutes criteria
    return config.routes.some((route) => {
      // Controller class
      if (typeof route === "function") {
        return route === controllerClass;
      }

      // String path
      if (typeof route === "string") {
        return this.matchPath(route, routePath);
      }

      // RouteInfo object
      return (
        this.matchPath(route.path, routePath) &&
        (!route.method || route.method === method)
      );
    });
  }

  /**
   * Simple path matching (supports wildcards)
   */
  private matchPath(pattern: string, path: string): boolean {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, ".*")
      .replace(/\//g, "\\/")
      .replace(/:\w+/g, "[^/]+");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }
}
