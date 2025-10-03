import "reflect-metadata";
import {
  MetadataStorage,
  METADATA_KEYS,
  ModuleMetadata,
  getInjectionTokens,
} from "../decorators";
import { Logger } from "../utils";

interface Provider {
  provide: string;
  useClass?: any;
  useValue?: any;
  useFactory?: (...args: any[]) => any | Promise<any>;
  inject?: string[];
  scope?: "singleton" | "transient";
}

class Container {
  private instances = new Map<string, any>();
  private singletons = new Map<string, any>();
  private processedModules = new Set<any>();
  private metadataCache = new Map<any, any[]>(); // Cache for parameter types
  private dependencyCache = new Map<string, any[]>(); // Cache for resolved dependencies
  private asyncProviders = new Map<string, Promise<any>>(); // Cache for async factory providers
  private lifecycleHooks = new Map<
    any,
    { onModuleInit?: () => any; onModuleDestroy?: () => any }
  >();

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
    const isSingleton = provider.scope !== "transient"; // Default to singleton for backward compatibility

    if (provider.useValue) {
      this.register(provider.provide, () => provider.useValue, true);
    } else if (provider.useFactory) {
      // Support for factory providers (sync and async)
      this.register(
        provider.provide,
        () => {
          const dependencies =
            provider.inject?.map((dep) => this.resolve(dep)) || [];
          const result = provider.useFactory!(...dependencies);

          // Handle async factories - store promise and mark for later resolution
          if (result instanceof Promise) {
            if (!this.asyncProviders.has(provider.provide)) {
              this.asyncProviders.set(provider.provide, result);
            }
          }

          return result;
        },
        isSingleton,
      );
    } else if (provider.useClass) {
      this.register(
        provider.provide,
        () => {
          const dependencies =
            provider.inject?.map((dep) => this.resolve(dep)) || [];
          return new provider.useClass(...dependencies);
        },
        isSingleton,
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

    // Get custom injection tokens (from @Inject decorator)
    const injectionTokens = getInjectionTokens(target);

    // Check if dependencies are already cached
    const cacheKey = target.name;
    let dependencies = this.dependencyCache.get(cacheKey);

    if (!dependencies) {
      dependencies = this.resolveDependencies(
        safeParamTypes,
        target.name,
        injectionTokens,
      );
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

  private resolveDependencies(
    paramTypes: any[],
    targetName: string,
    injectionTokens: { [key: number]: string } = {},
  ): any[] {
    return paramTypes.map((paramType: any, index: number) => {
      // Check if there's a custom injection token for this parameter
      const customToken = injectionTokens[index];
      if (customToken) {
        try {
          return this.resolve(customToken);
        } catch (error) {
          Logger.error(
            `Could not resolve custom injection token '${customToken}' at parameter ${index} in ${targetName}`,
          );
          throw error;
        }
      }

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
    // Check if it's a dynamic module (has module property)
    const isDynamicModule = moduleClass && moduleClass.module;
    const actualModule = isDynamicModule ? moduleClass.module : moduleClass;

    // Avoid processing the same module multiple times
    if (this.processedModules.has(actualModule)) {
      return;
    }
    this.processedModules.add(actualModule);

    let moduleMetadata: ModuleMetadata | undefined;

    if (isDynamicModule) {
      // Dynamic module - use the metadata directly from the object
      moduleMetadata = moduleClass;
    } else {
      // Static module - get metadata from decorator
      moduleMetadata = MetadataStorage.get<ModuleMetadata>(
        actualModule.prototype,
        METADATA_KEYS.MODULE,
      );
    }

    if (!moduleMetadata) {
      throw new Error(
        `Module ${actualModule.name} is missing @Module decorator or DynamicModule metadata`,
      );
    }

    // Register imported modules first (supports both static and dynamic modules)
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

  /**
   * Call lifecycle hook onModuleInit on all registered providers and controllers
   */
  async callOnModuleInit(): Promise<void> {
    const initPromises: Promise<any>[] = [];

    // Call onModuleInit on all instances that have it
    for (const instance of this.singletons.values()) {
      if (instance && typeof instance.onModuleInit === "function") {
        const result = instance.onModuleInit();
        if (result instanceof Promise) {
          initPromises.push(result);
        }
      }
    }

    await Promise.all(initPromises);
  }

  /**
   * Call lifecycle hook onModuleDestroy on all registered providers and controllers
   */
  async callOnModuleDestroy(): Promise<void> {
    const destroyPromises: Promise<any>[] = [];

    // Call onModuleDestroy on all instances that have it
    for (const instance of this.singletons.values()) {
      if (instance && typeof instance.onModuleDestroy === "function") {
        const result = instance.onModuleDestroy();
        if (result instanceof Promise) {
          destroyPromises.push(result);
        }
      }
    }

    await Promise.all(destroyPromises);
  }

  /**
   * Resolve all async providers to ensure they are initialized
   */
  async resolveAsyncProviders(): Promise<void> {
    if (this.asyncProviders.size === 0) return;

    // Wait for all async providers to resolve
    const entries = Array.from(this.asyncProviders.entries());
    const results = await Promise.all(entries.map(([_, promise]) => promise));

    // Store resolved values in singletons cache
    entries.forEach(([token, _], index) => {
      this.singletons.set(token, results[index]);
    });
  }
}

const container = new Container();

// Register Logger as a global service
container.register("Logger", () => Logger, true);

export { container };
