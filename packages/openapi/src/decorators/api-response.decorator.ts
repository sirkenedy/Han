import "reflect-metadata";
import { ApiResponseOptions } from "../interfaces/decorator-options.interface";
import { OPENAPI_METADATA_KEYS, HTTP_STATUS_CODES } from "../constants";

/**
 * Decorator to define response metadata
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiResponse({ status: 200, description: 'Success', type: UserDto })
 * @ApiResponse({ status: 404, description: 'User not found' })
 * findOne() {
 *   return user;
 * }
 * ```
 */
export function ApiResponse(options: ApiResponseOptions): MethodDecorator {
  return (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    const existingResponses =
      Reflect.getMetadata(
        OPENAPI_METADATA_KEYS.API_RESPONSES,
        descriptor.value,
      ) || [];

    existingResponses.push(options);

    Reflect.defineMetadata(
      OPENAPI_METADATA_KEYS.API_RESPONSES,
      existingResponses,
      descriptor.value,
    );

    return descriptor;
  };
}

/**
 * Shorthand decorators for common HTTP status codes
 */

export function ApiOkResponse(
  options: Omit<ApiResponseOptions, "status"> = { description: "Success" },
): MethodDecorator {
  return ApiResponse({ ...options, status: HTTP_STATUS_CODES.OK });
}

export function ApiCreatedResponse(
  options: Omit<ApiResponseOptions, "status"> = {
    description: "Resource created",
  },
): MethodDecorator {
  return ApiResponse({ ...options, status: HTTP_STATUS_CODES.CREATED });
}

export function ApiAcceptedResponse(
  options: Omit<ApiResponseOptions, "status"> = { description: "Accepted" },
): MethodDecorator {
  return ApiResponse({ ...options, status: HTTP_STATUS_CODES.ACCEPTED });
}

export function ApiNoContentResponse(
  options: Omit<ApiResponseOptions, "status"> = { description: "No content" },
): MethodDecorator {
  return ApiResponse({ ...options, status: HTTP_STATUS_CODES.NO_CONTENT });
}

export function ApiBadRequestResponse(
  options: Omit<ApiResponseOptions, "status"> = { description: "Bad request" },
): MethodDecorator {
  return ApiResponse({ ...options, status: HTTP_STATUS_CODES.BAD_REQUEST });
}

export function ApiUnauthorizedResponse(
  options: Omit<ApiResponseOptions, "status"> = { description: "Unauthorized" },
): MethodDecorator {
  return ApiResponse({ ...options, status: HTTP_STATUS_CODES.UNAUTHORIZED });
}

export function ApiForbiddenResponse(
  options: Omit<ApiResponseOptions, "status"> = { description: "Forbidden" },
): MethodDecorator {
  return ApiResponse({ ...options, status: HTTP_STATUS_CODES.FORBIDDEN });
}

export function ApiNotFoundResponse(
  options: Omit<ApiResponseOptions, "status"> = { description: "Not found" },
): MethodDecorator {
  return ApiResponse({ ...options, status: HTTP_STATUS_CODES.NOT_FOUND });
}

export function ApiConflictResponse(
  options: Omit<ApiResponseOptions, "status"> = { description: "Conflict" },
): MethodDecorator {
  return ApiResponse({ ...options, status: HTTP_STATUS_CODES.CONFLICT });
}

export function ApiUnprocessableEntityResponse(
  options: Omit<ApiResponseOptions, "status"> = {
    description: "Validation failed",
  },
): MethodDecorator {
  return ApiResponse({
    ...options,
    status: HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY,
  });
}

export function ApiTooManyRequestsResponse(
  options: Omit<ApiResponseOptions, "status"> = {
    description: "Too many requests",
  },
): MethodDecorator {
  return ApiResponse({
    ...options,
    status: HTTP_STATUS_CODES.TOO_MANY_REQUESTS,
  });
}

export function ApiInternalServerErrorResponse(
  options: Omit<ApiResponseOptions, "status"> = {
    description: "Internal server error",
  },
): MethodDecorator {
  return ApiResponse({
    ...options,
    status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
  });
}

export function ApiServiceUnavailableResponse(
  options: Omit<ApiResponseOptions, "status"> = {
    description: "Service unavailable",
  },
): MethodDecorator {
  return ApiResponse({
    ...options,
    status: HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
  });
}

/**
 * Combine multiple common responses
 */
export function ApiDefaultResponses(): MethodDecorator {
  return (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    ApiBadRequestResponse()(target, propertyKey, descriptor);
    ApiUnauthorizedResponse()(target, propertyKey, descriptor);
    ApiInternalServerErrorResponse()(target, propertyKey, descriptor);
    return descriptor;
  };
}
