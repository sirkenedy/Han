import "reflect-metadata";
import {
  ApiParamOptions,
  ApiQueryOptions,
  ApiBodyOptions,
  ApiHeaderOptions,
} from "../interfaces/decorator-options.interface";
import { OPENAPI_METADATA_KEYS } from "../constants";

/**
 * Decorator for path parameters
 *
 * @example
 * ```typescript
 * @Get(':id')
 * @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
 * findOne(@Param('id') id: string) {
 *   return user;
 * }
 * ```
 */
export function ApiParam(options: ApiParamOptions): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const existingParams =
      Reflect.getMetadata(OPENAPI_METADATA_KEYS.API_PARAM, descriptor.value) ||
      [];

    existingParams.push({ ...options, in: "path" });

    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_PARAM,
      existingParams,
      descriptor.value,
    );

    return descriptor;
  };
}

/**
 * Decorator for query parameters
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiQuery({ name: 'page', description: 'Page number', type: 'number', required: false })
 * @ApiQuery({ name: 'limit', description: 'Items per page', type: 'number', required: false })
 * findAll(@Query('page') page: number, @Query('limit') limit: number) {
 *   return users;
 * }
 * ```
 */
export function ApiQuery(options: ApiQueryOptions): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const existingQueries =
      Reflect.getMetadata(OPENAPI_METADATA_KEYS.API_QUERY, descriptor.value) ||
      [];

    existingQueries.push({ ...options, in: "query" });

    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_QUERY,
      existingQueries,
      descriptor.value,
    );

    return descriptor;
  };
}

/**
 * Decorator for request body
 *
 * @example
 * ```typescript
 * @Post()
 * @ApiBody({ description: 'Create user', type: CreateUserDto })
 * create(@Body() createUserDto: CreateUserDto) {
 *   return user;
 * }
 * ```
 */
export function ApiBody(options: ApiBodyOptions): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_BODY,
      options,
      descriptor.value,
    );

    return descriptor;
  };
}

/**
 * Decorator for header parameters
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiHeader({ name: 'X-API-Key', description: 'API Key', required: true })
 * findAll(@Headers('X-API-Key') apiKey: string) {
 *   return users;
 * }
 * ```
 */
export function ApiHeader(options: ApiHeaderOptions): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const existingHeaders =
      Reflect.getMetadata(OPENAPI_METADATA_KEYS.API_HEADER, descriptor.value) ||
      [];

    existingHeaders.push({ ...options, in: "header" });

    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_HEADER,
      existingHeaders,
      descriptor.value,
    );

    return descriptor;
  };
}

/**
 * Decorator to specify content types the endpoint produces
 */
export function ApiProduces(...contentTypes: string[]): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_PRODUCES,
      contentTypes,
      descriptor.value,
    );

    return descriptor;
  };
}

/**
 * Decorator to specify content types the endpoint consumes
 */
export function ApiConsumes(...contentTypes: string[]): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_CONSUMES,
      contentTypes,
      descriptor.value,
    );

    return descriptor;
  };
}
