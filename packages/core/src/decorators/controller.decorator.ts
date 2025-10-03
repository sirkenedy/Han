import { MetadataStorage, METADATA_KEYS, ControllerMetadata } from "./metadata";

export function Controller(
  path: string = "",
  middleware: any[] = [],
): ClassDecorator {
  return function (target: any) {
    const metadata: ControllerMetadata = { path, middleware };
    MetadataStorage.set(target.prototype, METADATA_KEYS.CONTROLLER, metadata);
    MetadataStorage.set(target.prototype, METADATA_KEYS.INJECTABLE, true);
  };
}
