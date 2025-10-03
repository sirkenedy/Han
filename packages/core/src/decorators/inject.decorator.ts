import "reflect-metadata";

const INJECT_METADATA = "custom:inject";

/**
 * Parameter decorator that marks a constructor parameter for custom dependency injection.
 * Used to inject dependencies by string token instead of type.
 *
 * @param token - The injection token (string identifier for the dependency)
 *
 * @example
 * ```typescript
 * @Injectable()
 * class UserService {
 *   constructor(
 *     @Inject('DATABASE_CONNECTION') private db: Connection,
 *     @Inject('UserModel') private userModel: Model<User>
 *   ) {}
 * }
 * ```
 */
export function Inject(token: string): ParameterDecorator {
  return (
    target: Object,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) => {
    const existingInjections =
      Reflect.getMetadata(INJECT_METADATA, target) || {};
    existingInjections[parameterIndex] = token;
    Reflect.defineMetadata(INJECT_METADATA, existingInjections, target);
  };
}

/**
 * Retrieves custom injection tokens for a class constructor
 * @param target - The class constructor
 * @returns Object mapping parameter indices to injection tokens
 */
export function getInjectionTokens(target: any): { [key: number]: string } {
  return Reflect.getMetadata(INJECT_METADATA, target) || {};
}
