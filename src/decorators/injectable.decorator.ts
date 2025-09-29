import 'reflect-metadata';
import { MetadataStorage, METADATA_KEYS } from './metadata';

export function Injectable() {
  return function <T extends new (...args: any[]) => any>(target: T) {
    // Mark the class as injectable - dependency resolution handled by container
    MetadataStorage.set(target, METADATA_KEYS.INJECTABLE, true);
    return target;
  };
}