import { Module } from 'han-prev-core';
import mongoose, { Connection, Model, Schema, createConnection } from 'mongoose';
import {
  MongooseModuleOptions,
  MongooseFeatureOptions,
  MongooseMultipleConnectionsOptions,
  ModelDefinition
} from './interfaces/mongoose-options.interface';
import { getModelToken } from './decorators/inject-model.decorator';
import { getConnectionToken } from './decorators/inject-connection.decorator';
import { getPropertiesMetadata } from './decorators/prop.decorator';
import { getSchemaOptions, isSchema } from './decorators/schema.decorator';

export class MongooseModule {
  private static connections: Map<string, Connection> = new Map();
  private static defaultConnection: Connection;

  /**
   * Setup connection event handlers
   */
  private static setupConnectionHandlers(connection: Connection, name: string): void {
    connection.on('connected', () => {
      console.log(`✅ MongoDB [${name}] connected`);
    });

    connection.on('error', (error) => {
      console.error(`❌ MongoDB [${name}] error:`, error);
    });

    connection.on('disconnected', () => {
      console.warn(`⚠️ MongoDB [${name}] disconnected`);
    });

    connection.on('reconnected', () => {
      console.log(`🔄 MongoDB [${name}] reconnected`);
    });

    connection.on('close', () => {
      console.log(`🔌 MongoDB [${name}] connection closed`);
    });
  }

  /**
   * Configure the root Mongoose module with a single connection
   */
  static forRoot(options: MongooseModuleOptions): any {
    const connectionName = options.connectionName || 'default';
    const connectionToken = getConnectionToken(connectionName === 'default' ? undefined : connectionName);

    return {
      module: MongooseModule,
      providers: [
        {
          provide: connectionToken,
          useFactory: async () => {
            try {
              // Use createConnection for consistency (not mongoose.connect)
              const connection = await createConnection(options.uri, {
                ...options.options,
                // Add default options for production
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
              }).asPromise();

              // Setup event handlers
              MongooseModule.setupConnectionHandlers(connection, connectionName);

              MongooseModule.connections.set(connectionName, connection);
              if (connectionName === 'default') {
                MongooseModule.defaultConnection = connection;
              }

              const maskedUri = options.uri.split('@').pop() || options.uri;
              console.log(`✅ Connected to MongoDB [${connectionName}]: ${maskedUri}`);
              return connection;
            } catch (error) {
              console.error(`❌ MongoDB connection error [${connectionName}]:`, error);
              throw error;
            }
          },
        },
      ],
      exports: [connectionToken],
    };
  }

  /**
   * Configure multiple database connections
   *
   * @example
   * ```typescript
   * MongooseModule.forRootMultiple({
   *   connections: [
   *     { name: 'APP', uri: process.env.APP_DATABASE_URL },
   *     { name: 'LOG', uri: process.env.LOG_DATABASE_URL }
   *   ]
   * })
   * ```
   */
  static forRootMultiple(options: MongooseMultipleConnectionsOptions): any {
    const providers = options.connections.map((connConfig) => ({
      provide: getConnectionToken(connConfig.name),
      useFactory: async () => {
        try {
          const connection = await createConnection(connConfig.uri, {
            ...connConfig.options,
            // Add default options for production
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
          }).asPromise();

          // Setup event handlers
          MongooseModule.setupConnectionHandlers(connection, connConfig.name);

          MongooseModule.connections.set(connConfig.name, connection);

          const maskedUri = connConfig.uri.split('@').pop() || connConfig.uri;
          console.log(`✅ Connected to MongoDB [${connConfig.name}]: ${maskedUri}`);
          return connection;
        } catch (error) {
          console.error(`❌ MongoDB connection error [${connConfig.name}]:`, error);
          throw error;
        }
      },
    }));

    return {
      module: MongooseModule,
      providers,
      exports: providers.map((p) => p.provide),
    };
  }

  /**
   * Configure root module asynchronously (for dynamic configuration)
   *
   * @example
   * ```typescript
   * MongooseModule.forRootAsync({
   *   inject: [ConfigService],
   *   useFactory: async (config: ConfigService) => ({
   *     uri: config.get('MONGODB_URI'),
   *     options: {
   *       maxPoolSize: config.get('DB_POOL_SIZE'),
   *     }
   *   })
   * })
   * ```
   */
  static forRootAsync(options: {
    inject?: any[];
    useFactory: (...args: any[]) => Promise<MongooseModuleOptions> | MongooseModuleOptions;
    connectionName?: string;
  }): any {
    const connectionName = options.connectionName || 'default';
    const connectionToken = getConnectionToken(connectionName === 'default' ? undefined : connectionName);

    return {
      module: MongooseModule,
      providers: [
        {
          provide: connectionToken,
          useFactory: async (...args: any[]) => {
            const config = await options.useFactory(...args);

            try {
              const connection = await createConnection(config.uri, {
                ...config.options,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
              }).asPromise();

              MongooseModule.setupConnectionHandlers(connection, connectionName);

              MongooseModule.connections.set(connectionName, connection);
              if (connectionName === 'default') {
                MongooseModule.defaultConnection = connection;
              }

              const maskedUri = config.uri.split('@').pop() || config.uri;
              console.log(`✅ Connected to MongoDB [${connectionName}]: ${maskedUri}`);
              return connection;
            } catch (error) {
              console.error(`❌ MongoDB connection error [${connectionName}]:`, error);
              throw error;
            }
          },
          inject: options.inject || [],
        },
      ],
      exports: [connectionToken],
    };
  }

  /**
   * Configure multiple connections asynchronously
   */
  static forRootMultipleAsync(options: {
    inject?: any[];
    useFactory: (...args: any[]) => Promise<MongooseMultipleConnectionsOptions> | MongooseMultipleConnectionsOptions;
  }): any {
    return {
      module: MongooseModule,
      providers: [
        {
          provide: 'MONGOOSE_MODULE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: 'MONGOOSE_CONNECTIONS',
          useFactory: async (moduleOptions: MongooseMultipleConnectionsOptions) => {
            const connections: Connection[] = [];

            for (const connConfig of moduleOptions.connections) {
              try {
                const connection = await createConnection(connConfig.uri, {
                  ...connConfig.options,
                  serverSelectionTimeoutMS: 5000,
                  socketTimeoutMS: 45000,
                }).asPromise();

                MongooseModule.setupConnectionHandlers(connection, connConfig.name);
                MongooseModule.connections.set(connConfig.name, connection);
                connections.push(connection);

                const maskedUri = connConfig.uri.split('@').pop() || connConfig.uri;
                console.log(`✅ Connected to MongoDB [${connConfig.name}]: ${maskedUri}`);
              } catch (error) {
                console.error(`❌ MongoDB connection error [${connConfig.name}]:`, error);
                throw error;
              }
            }

            return connections;
          },
          inject: ['MONGOOSE_MODULE_OPTIONS'],
        },
        ...options.inject?.map((token) => ({ provide: token, useValue: token })) || [],
      ],
      exports: ['MONGOOSE_CONNECTIONS'],
    };
  }

  /**
   * Register models for a feature module
   */
  static forFeature(features: Array<MongooseFeatureOptions | any>, connectionName?: string): any {
    const providers = features.map((feature) => {
      let modelName: string;
      let schema: Schema;
      let collection: string | undefined;
      let modelConnection: string | undefined;

      if ('name' in feature && 'schema' in feature) {
        // Traditional schema definition
        modelName = feature.name;
        schema = feature.schema;
        collection = feature.collection;
        modelConnection = feature.connection || connectionName;
      } else if (isSchema(feature)) {
        // Decorator-based schema
        modelName = feature.name;
        schema = this.createSchemaFromClass(feature);
        collection = feature.collection;
        modelConnection = feature.connection || connectionName;
      } else {
        throw new Error('Invalid feature configuration');
      }

      const connectionToken = getConnectionToken(modelConnection);

      return {
        provide: getModelToken(modelName),
        useFactory: (connection: Connection) => {
          return connection.model(modelName, schema, collection);
        },
        inject: [connectionToken],
      };
    });

    return {
      module: MongooseModule,
      providers,
      exports: providers.map((p) => p.provide),
    };
  }

  /**
   * Register models with automatic connection routing
   * This method mimics the schema/index.ts pattern where models are routed to connections based on dbPrefix
   *
   * @example
   * ```typescript
   * MongooseModule.forFeatureWithRouting([
   *   { name: 'User', schema: UserSchema, connection: 'APP' },
   *   { name: 'AuditLog', schema: AuditLogSchema, connection: 'LOG' }
   * ])
   * ```
   */
  static forFeatureWithRouting(models: Array<ModelDefinition>): any {
    const providers = models.flatMap((model) => {
      const connectionToken = getConnectionToken(model.connection);
      const modelToken = getModelToken(model.name);

      return {
        provide: modelToken,
        useFactory: (connection: Connection) => {
          const schema = model.schema;
          return connection.model(model.name, schema, model.collection);
        },
        inject: [connectionToken],
      };
    });

    // Also create connection name tokens for easy reference
    const connectionNames = [...new Set(models.map(m => m.connection).filter(Boolean))];
    const connectionTokens = connectionNames.map(name => getConnectionToken(name!));

    return {
      module: MongooseModule,
      providers,
      exports: [...providers.map((p) => p.provide), ...connectionTokens],
    };
  }

  /**
   * Get a connection by name (useful for utilities and transactions)
   */
  static getConnection(name?: string): Connection {
    if (!name || name === 'default') {
      if (!MongooseModule.defaultConnection) {
        throw new Error('Default connection not found. Did you call forRoot()?');
      }
      return MongooseModule.defaultConnection;
    }

    const connection = MongooseModule.connections.get(name);
    if (!connection) {
      throw new Error(`Connection "${name}" not found. Did you configure it with forRoot() or forRootMultiple()?`);
    }
    return connection;
  }

  /**
   * Get all configured connections
   */
  static getAllConnections(): Map<string, Connection> {
    return MongooseModule.connections;
  }

  /**
   * Gracefully close all database connections
   * Should be called on application shutdown
   */
  static async closeAllConnections(): Promise<void> {
    const closePromises: Promise<void>[] = [];

    for (const [name, connection] of MongooseModule.connections.entries()) {
      console.log(`🔌 Closing MongoDB connection [${name}]...`);
      closePromises.push(
        connection.close().catch((error) => {
          console.error(`❌ Error closing connection [${name}]:`, error);
        })
      );
    }

    await Promise.all(closePromises);
    MongooseModule.connections.clear();
    console.log('✅ All MongoDB connections closed');
  }

  /**
   * Get health status of all connections
   */
  static getHealthStatus(): Record<string, {
    name: string;
    status: string;
    readyState: number;
    host: string;
  }> {
    const status: Record<string, any> = {};

    for (const [name, connection] of MongooseModule.connections.entries()) {
      status[name] = {
        name: connection.name,
        status: this.getReadyStateText(connection.readyState),
        readyState: connection.readyState,
        host: connection.host,
      };
    }

    return status;
  }

  /**
   * Convert readyState number to text
   */
  private static getReadyStateText(readyState: number): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized',
    };
    return states[readyState as keyof typeof states] || 'unknown';
  }

  /**
   * Create a Mongoose schema from a decorated class
   */
  private static createSchemaFromClass(target: any): Schema {
    const properties = getPropertiesMetadata(target);
    const options = getSchemaOptions(target);

    const schemaDefinition: any = {};

    for (const [key, prop] of Object.entries(properties)) {
      schemaDefinition[key] = prop;
    }

    return new Schema(schemaDefinition, options);
  }

  /**
   * Lifecycle hook - called when module is destroyed
   */
  static async onModuleDestroy(): Promise<void> {
    await this.closeAllConnections();
  }
}
