import { MetadataStorage } from "./metadata";

export interface ParamMetadata {
  type: "body" | "param" | "query" | "headers";
  key?: string | undefined;
  index: number;
}

export function Body(key?: string): ParameterDecorator {
  return function (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) {
    const metadata: ParamMetadata = {
      type: "body",
      key,
      index: parameterIndex,
    };
    MetadataStorage.addParam(target, propertyKey as string, metadata);
  };
}

export function Param(key?: string): ParameterDecorator {
  return function (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) {
    const metadata: ParamMetadata = {
      type: "param",
      key,
      index: parameterIndex,
    };
    MetadataStorage.addParam(target, propertyKey as string, metadata);
  };
}

export function Query(key?: string): ParameterDecorator {
  return function (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) {
    const metadata: ParamMetadata = {
      type: "query",
      key,
      index: parameterIndex,
    };
    MetadataStorage.addParam(target, propertyKey as string, metadata);
  };
}

export function Headers(key?: string): ParameterDecorator {
  return function (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) {
    const metadata: ParamMetadata = {
      type: "headers",
      key,
      index: parameterIndex,
    };
    MetadataStorage.addParam(target, propertyKey as string, metadata);
  };
}
