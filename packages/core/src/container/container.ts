import "reflect-metadata";
import { MetadataStorage, METADATA_KEYS, ModuleMetadata } from "../decorators";
import { Logger } from "../utils";

interface Provider {
  provide: string;
  useClass?: any;
  useValue?: any;
  inject?: string[];
}

class Container {
  private instances = new Map<string, any>();
  private singletons = new Map<string, any>();
  private processedModules = new Set<any>();
  private metadataCache = new Map<any, any[]>(); // Cache for parameter types
  private dependencyCache = new Map<string, any[]>(); // Cache for resolved dependencies

  register<T>(
    token: string,
    factory: () => T,
    singleton: boolean = false,
  ): void {
    this.instances.set(token, { factory, singleton });
  }

  resolve<T>(token: string): T {
    const registration = this.instances.get(token);
    if (!registration) {
      throw new Error(`No registration found for token: ${token}`);
    }

    if (registration.singleton) {
      if (!this.singletons.has(token)) {
        this.singletons.set(token, registration.factory());
      }
      return this.singletons.get(token);
    }

    return registration.factory();
  }

  registerProvider(provider: Provider): void {
    if (provider.useValue) {
      this.register(provider.provide, () => provider.useValue, true);
    } else if (provider.useClass) {
      this.register(
        provider.provide,
        () => {
          const dependencies =
            provider.inject?.map((dep) => this.resolve(dep)) || [];
          return new provider.useClass(...dependencies);
        },
        true,
      );
    }
  }

  registerController<T>(ControllerClass: new (...args: any[]) => T): void {
    Logger.debug(`Auto-registering controller: ${ControllerClass.name}`);
    this.register(
      ControllerClass.name,
      () => {
        return this.createInstance(ControllerClass);
      },
      true,
    );
  }

  private createInstance<T>(target: new (...args: any[]) => T): T {
    // Cache metadata lookups for better performance
    let paramTypes = this.metadataCache.get(target);
    if (!paramTypes) {
      const metadata = Reflect.getMetadata("design:paramtypes", target);
      paramTypes = metadata || [];
      this.metadataCache.set(target, paramTypes as any[]);
    }

    // Ensure paramTypes is always an array
    const safeParamTypes = paramTypes || [];

    if (safeParamTypes.length === 0) {
      return new target();
    }

    // Check if dependencies are already cached
    const cacheKey = target.name;
    let dependencies = this.dependencyCache.get(cacheKey);

    if (!dependencies) {
      dependencies = this.resolveDependencies(safeParamTypes, target.name);
      this.dependencyCache.set(cacheKey, dependencies);
    }

    // Filter out undefined dependencies and create instance
    const validDependencies = dependencies.filter(
      (dep: any) => dep !== undefined,
    );

    if (validDependencies.length !== safeParamTypes.length) {
      Logger.debug(
        `${target.name} created with ${validDependencies.length}/${safeParamTypes.length} dependencies resolved`,
      );
    }

    return new target(...validDependencies);
  }

  private resolveDependencies(paramTypes: any[], targetName: string): any[] {
    return paramTypes.map((paramType: any, index: number) => {
      if (!paramType || !paramType.name) {
        return undefined;
      }

      try {
        return this.resolve(paramType.name);
      } catch (error) {
        Logger.debug(
          `Dependency resolution failed for ${paramType.name} at parameter ${index} in ${targetName}. Trying alternative resolution...`,
        );

        // Try to find a provider with the same type
        for (const [token] of this.instances.entries()) {
          if (
            token.includes(paramType.name) ||
            paramType.name.includes(token)
          ) {
            try {
              return this.resolve(token);
            } catch {
              continue;
            }
          }
        }

        Logger.warn(
          `Could not resolve dependency ${paramType.name} for ${targetName}`,
        );
        return undefined;
      }
    });
  }

  registerModule(moduleClass: any): void {
    // Avoid processing the same module multiple times
    if (this.processedModules.has(moduleClass)) {
      return;
    }
    this.processedModules.add(moduleClass);

    // Get module metadata from decorator
    const moduleMetadata = MetadataStorage.get<ModuleMetadata>(
      moduleClass.prototype,
      METADATA_KEYS.MODULE,
    );

    if (!moduleMetadata) {
      throw new Error(
        `Module ${moduleClass.name} is missing @Module decorator`,
      );
    }

    // Register imported modules first
    if (moduleMetadata.imports) {
      moduleMetadata.imports.forEach((importedModule: any) => {
        this.registerModule(importedModule);
      });
    }

    // Register module providers
    if (moduleMetadata.providers) {
      moduleMetadata.providers.forEach((provider: Provider | any) => {
        if (typeof provider === "function") {
          // Simple class provider - use reflection for dynamic dependency injection
          this.register(
            provider.name,
            () => {
              return this.createInstance(provider);
            },
            true,
          );
        } else {
          // Complex provider object
          this.registerProvider(provider);
        }
      });
    }

    // Register module controllers with automatic dependency resolution
    if (moduleMetadata.controllers) {
      moduleMetadata.controllers.forEach((controller: any) => {
        this.registerController(controller);
      });
    }
  }

  getModuleMetadata(moduleClass: any): ModuleMetadata | undefined {
    return MetadataStorage.get<ModuleMetadata>(
      moduleClass.prototype,
      METADATA_KEYS.MODULE,
    );
  }
}

const container = new Container();

// Register Logger as a global service
container.register("Logger", () => Logger, true);

export { container };
