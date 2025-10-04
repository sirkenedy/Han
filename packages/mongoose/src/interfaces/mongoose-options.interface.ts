import { ConnectOptions } from 'mongoose';

export interface MongooseModuleOptions {
  uri: string;
  connectionName?: string;
  options?: ConnectOptions;
}

export interface MongooseMultipleConnectionsOptions {
  connections: Array<{
    name: string;
    uri: string;
    options?: ConnectOptions;
  }>;
}

export interface MongooseFeatureOptions {
  name: string;
  schema: any;
  collection?: string;
  connection?: string;
  discriminators?: Array<{ name: string; schema: any }>;
}

export interface ModelDefinition {
  name: string;
  schema: any;
  collection?: string;
  connection?: string;
}
