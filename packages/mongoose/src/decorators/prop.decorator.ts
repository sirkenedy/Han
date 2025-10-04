import 'reflect-metadata';
import { SchemaDefinitionProperty } from 'mongoose';

export const PROP_METADATA = Symbol('PROP_METADATA');

export interface PropOptions extends Omit<SchemaDefinitionProperty, 'type'> {
  type?: any;
  ref?: string | Function;
  default?: any;
  enum?: any[];
}

/**
 * Decorator to define a property in a Mongoose schema
 * @param options - Property options
 */
export function Prop(options: PropOptions = {}) {
  return function (target: any, propertyKey: string) {
    const properties = Reflect.getMetadata(PROP_METADATA, target.constructor) || {};

    // Get the design type if type is not explicitly provided
    const designType = Reflect.getMetadata('design:type', target, propertyKey);

    properties[propertyKey] = {
      ...options,
      type: options.type || designType,
    };

    Reflect.defineMetadata(PROP_METADATA, properties, target.constructor);
  };
}

/**
 * Get all properties metadata from a class
 */
export function getPropertiesMetadata(target: any): Record<string, PropOptions> {
  return Reflect.getMetadata(PROP_METADATA, target) || {};
}
