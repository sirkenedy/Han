import { MetadataStorage, METADATA_KEYS } from './metadata';

export interface ModuleMetadata {
  imports?: any[];
  controllers?: any[];
  providers?: any[];
  exports?: any[];
}

export function Module(metadata: ModuleMetadata): ClassDecorator {
  return function (target: any) {
    MetadataStorage.set(target.prototype, METADATA_KEYS.MODULE, metadata);
    return target;
  };
}