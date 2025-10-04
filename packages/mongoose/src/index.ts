// Core module
export { MongooseModule } from './mongoose.module';

// Decorators
export { Schema } from './decorators/schema.decorator';
export { Prop } from './decorators/prop.decorator';
export { InjectModel, getModelToken } from './decorators/inject-model.decorator';
export { InjectConnection, getConnectionToken } from './decorators/inject-connection.decorator';

// Interfaces
export {
  MongooseModuleOptions,
  MongooseFeatureOptions,
  MongooseMultipleConnectionsOptions,
  ModelDefinition
} from './interfaces/mongoose-options.interface';
export { PropOptions } from './decorators/prop.decorator';
export { SchemaDecoratorOptions } from './decorators/schema.decorator';

// Transaction utilities
export {
  CrossDbTransaction,
  withCrossDbTransaction,
  withTransaction,
  CrossDbTransactionOptions,
  TransactionResult
} from './utils/transaction.util';

// Two-Phase Commit (for stronger ACID guarantees)
export {
  TwoPhaseCommitTransaction,
  withTwoPhaseCommit,
  TwoPhaseCommitOptions,
  TwoPhaseResult
} from './utils/transaction-2pc.util';

// Re-export mongoose types for convenience
export {
  Document,
  Model,
  Schema as MongooseSchema,
  Connection,
  ClientSession,
  SchemaTypes,
  Types,
  Query,
  Aggregate,
  ConnectOptions,
} from 'mongoose';
