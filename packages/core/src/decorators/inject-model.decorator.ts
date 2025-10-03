import { Inject } from "./inject.decorator";

/**
 * Parameter decorator for injecting Mongoose models.
 * This is a convenience wrapper around @Inject that automatically appends 'Model' to the token.
 *
 * @param modelName - The name of the Mongoose model (e.g., 'User', 'Application')
 *
 * @example
 * ```typescript
 * import { Injectable } from 'han-prev-core';
 * import { InjectModel } from 'han-prev-core';
 * import { Model } from 'mongoose';
 * import { UserDocument } from './schemas/user.schema';
 *
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectModel('User')
 *     private userModel: Model<UserDocument>,
 *   ) {}
 *
 *   async findAll() {
 *     return this.userModel.find().exec();
 *   }
 * }
 * ```
 */
export function InjectModel(modelName: string): ParameterDecorator {
  return Inject(`${modelName}Model`);
}
