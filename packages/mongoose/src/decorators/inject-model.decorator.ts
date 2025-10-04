import 'reflect-metadata';
import { Inject } from 'han-prev-core';

export const MODEL_TOKEN_PREFIX = 'MODEL_';

/**
 * Get the injection token for a model
 */
export function getModelToken(model: string | Function): string {
  const modelName = typeof model === 'string' ? model : model.name;
  return `${MODEL_TOKEN_PREFIX}${modelName}`;
}

/**
 * Decorator to inject a Mongoose model
 * @param model - Model name or class
 */
export function InjectModel(model: string | Function) {
  return Inject(getModelToken(model));
}
