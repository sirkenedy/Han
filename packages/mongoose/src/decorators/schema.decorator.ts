import 'reflect-metadata';
import { SchemaOptions } from 'mongoose';

export const SCHEMA_METADATA = Symbol('SCHEMA_METADATA');
export const SCHEMA_OPTIONS = Symbol('SCHEMA_OPTIONS');

export interface SchemaDecoratorOptions extends SchemaOptions {
  collection?: string;
}

/**
 * Decorator to mark a class as a Mongoose schema
 * @param options - Mongoose schema options
 */
export function Schema(options: SchemaDecoratorOptions = {}) {
  return function (target: any) {
    Reflect.defineMetadata(SCHEMA_METADATA, true, target);
    Reflect.defineMetadata(SCHEMA_OPTIONS, options, target);
    return target;
  };
}

/**
 * Check if a class is decorated with @Schema
 */
export function isSchema(target: any): boolean {
  return Reflect.getMetadata(SCHEMA_METADATA, target) === true;
}

/**
 * Get schema options from a decorated class
 */
export function getSchemaOptions(target: any): SchemaDecoratorOptions {
  return Reflect.getMetadata(SCHEMA_OPTIONS, target) || {};
}
