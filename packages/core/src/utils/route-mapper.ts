import {
  MetadataStorage,
  METADATA_KEYS,
  RouteMetadata,
  ControllerMetadata,
} from "../decorators";

export interface MappedRoute {
  method: string;
  path: string;
  controller: string;
  handler: string;
  middleware?: string[];
  fullPath: string;
}

export class RouteMapper {
  private static routes: MappedRoute[] = [];

  static mapControllerRoutes(controllerClass: any): MappedRoute[] {
    const routes: MappedRoute[] = [];

    // Get controller metadata
    const controllerMetadata = MetadataStorage.get<ControllerMetadata>(
      controllerClass.prototype,
      METADATA_KEYS.CONTROLLER,
    );

    if (!controllerMetadata) {
      return routes;
    }

    // Get all routes for this controller
    const routeMetadata = MetadataStorage.getRoutes(controllerClass.prototype);

    routeMetadata.forEach((route: RouteMetadata) => {
      const basePath = controllerMetadata.path.endsWith("/")
        ? controllerMetadata.path.slice(0, -1)
        : controllerMetadata.path;

      const routePath = route.path.startsWith("/")
        ? route.path
        : `/${route.path}`;

      const fullPath = basePath + routePath;

      routes.push({
        method: route.method.toUpperCase(),
        path: route.path,
        controller: controllerClass.name,
        handler: route.methodName,
        middleware: route.middleware?.map((m) => m.name || "Anonymous") || [],
        fullPath: fullPath,
      });
    });

    return routes;
  }

  static collectAllRoutes(
    controllers: any[],
    globalPrefix?: string,
  ): MappedRoute[] {
    this.routes = [];

    controllers.forEach((controller) => {
      const controllerRoutes = this.mapControllerRoutes(controller);

      // Apply global prefix to routes if specified
      if (globalPrefix) {
        controllerRoutes.forEach((route) => {
          const prefix = globalPrefix.startsWith("/")
            ? globalPrefix
            : `/${globalPrefix}`;
          route.fullPath = prefix + route.fullPath;
        });
      }

      this.routes.push(...controllerRoutes);
    });

    return this.routes;
  }

  static getRouteStatistics() {
    const totalRoutes = this.routes.length;
    const methodCounts = this.routes.reduce(
      (acc, route) => {
        acc[route.method] = (acc[route.method] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const controllers = [...new Set(this.routes.map((r) => r.controller))];

    return {
      total: totalRoutes,
      methods: methodCounts,
      controllers: controllers.length,
      controllerNames: controllers,
    };
  }

  static displayRoutes(serverUrl?: string, environment?: string) {
    const stats = this.getRouteStatistics();

    // Header with branding
    console.log("\n" + "=".repeat(60));
    console.log(
      `${this.colors.cyan}🚀 Han Framework - Application Started${this.colors.reset}`,
    );
    console.log("=".repeat(60));

    // Display statistics with emoji indicators
    console.log(
      `\n${this.colors.yellow}📊 Route Analytics Dashboard:${this.colors.reset}`,
    );
    console.log(
      `   🎯 Total Routes: ${this.colors.green}${stats.total}${this.colors.reset}`,
    );
    console.log(
      `   🏛️  Controllers: ${this.colors.blue}${stats.controllers}${this.colors.reset}`,
    );
    console.log(
      `   📅 Generated: ${this.colors.gray}${new Date().toLocaleString()}${this.colors.reset}`,
    );

    // Method breakdown with visual indicators
    console.log(
      `\n   ${this.colors.magenta}🔢 HTTP Methods Breakdown:${this.colors.reset}`,
    );
    Object.entries(stats.methods).forEach(([method, count]) => {
      const color = this.getMethodColor(method);
      const emoji = this.getMethodEmoji(method);
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(
        `      ${emoji} ${color}${method.padEnd(6)}${this.colors.reset}: ${count} routes (${percentage}%)`,
      );
    });

    console.log(
      `\n${this.colors.cyan}📍 Route Mappings by Controller:${this.colors.reset}\n`,
    );

    // Group routes by controller
    const routesByController = this.routes.reduce(
      (acc, route) => {
        if (!acc[route.controller]) {
          acc[route.controller] = [];
        }
        acc[route.controller]!.push(route);
        return acc;
      },
      {} as Record<string, MappedRoute[]>,
    );

    Object.entries(routesByController).forEach(([controller, routes]) => {
      console.log(
        `${this.colors.cyan}┌─ [${controller}] (${routes.length} routes)${this.colors.reset}`,
      );

      routes.forEach((route, index) => {
        const methodColor = this.getMethodColor(route.method);
        const methodEmoji = this.getMethodEmoji(route.method);
        const isLast = index === routes.length - 1;
        const connector = isLast ? "└─" : "├─";

        const middlewareText =
          route.middleware && route.middleware.length > 0
            ? ` ${this.colors.yellow}[+${route.middleware.length} middleware]${this.colors.reset}`
            : "";

        const securityIcon =
          route.middleware && route.middleware.length > 0 ? " 🛡️ " : " ";

        console.log(
          `${this.colors.gray}${connector}${this.colors.reset} ${methodEmoji} ${methodColor}${route.method.padEnd(6)}${this.colors.reset}${securityIcon}${this.colors.white}${route.fullPath}${this.colors.reset}${middlewareText}`,
        );
      });

      console.log("");
    });

    // Display server info with enhanced styling - using dynamic parameters
    console.log("─".repeat(60));
    console.log(`${this.colors.green}🎉 Server Ready!${this.colors.reset}`);
    if (serverUrl) {
      console.log(
        `${this.colors.white}🌐 URL: ${this.colors.cyan}${serverUrl}${this.colors.reset}`,
      );
    }
    if (environment) {
      console.log(
        `${this.colors.white}🔧 Environment: ${this.colors.yellow}${environment}${this.colors.reset}`,
      );
    }
    console.log(
      `${this.colors.white}⚡ PID: ${this.colors.gray}${process.pid}${this.colors.reset}`,
    );
    console.log("─".repeat(60) + "\n");
  }

  private static colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
  };

  private static getMethodColor(method: string): string {
    switch (method.toLowerCase()) {
      case "get":
        return this.colors.green;
      case "post":
        return this.colors.yellow;
      case "put":
        return this.colors.blue;
      case "patch":
        return this.colors.magenta;
      case "delete":
        return this.colors.red;
      default:
        return this.colors.gray;
    }
  }

  private static getMethodEmoji(method: string): string {
    switch (method.toLowerCase()) {
      case "get":
        return "📖";
      case "post":
        return "📝";
      case "put":
        return "✏️";
      case "patch":
        return "🔧";
      case "delete":
        return "🗑️";
      default:
        return "❓";
    }
  }
}
