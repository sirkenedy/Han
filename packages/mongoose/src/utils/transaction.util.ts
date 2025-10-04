import { Connection, ClientSession } from 'mongoose';

/**
 * Options for cross-database transactions
 */
export interface CrossDbTransactionOptions {
  /**
   * Maximum number of retry attempts on transaction failure
   * @default 3
   */
  maxRetries?: number;

  /**
   * Timeout in milliseconds for the entire transaction
   * @default 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Read concern level
   * @default 'snapshot'
   */
  readConcern?: 'local' | 'majority' | 'snapshot';

  /**
   * Write concern level
   * @default 'majority'
   */
  writeConcern?: 'majority' | number;
}

/**
 * Result of a cross-database transaction
 */
export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

/**
 * Session map for cross-database transactions
 */
interface SessionMap {
  [connectionName: string]: ClientSession;
}

/**
 * Cross-Database Transaction Manager
 * Handles distributed transactions across multiple MongoDB connections
 */
export class CrossDbTransaction {
  private sessions: SessionMap = {};
  private connections: Map<string, Connection> = new Map();
  private isActive = false;
  private options: Required<CrossDbTransactionOptions>;

  constructor(options: CrossDbTransactionOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      timeout: options.timeout ?? 30000,
      readConcern: options.readConcern ?? 'snapshot',
      writeConcern: options.writeConcern ?? 'majority',
    };
  }

  /**
   * Add a connection to the transaction
   */
  addConnection(name: string, connection: Connection): this {
    if (this.isActive) {
      throw new Error('Cannot add connections to an active transaction');
    }
    this.connections.set(name, connection);
    return this;
  }

  /**
   * Get a session for a specific connection
   */
  getSession(connectionName: string): ClientSession {
    const session = this.sessions[connectionName];
    if (!session) {
      throw new Error(`No session found for connection: ${connectionName}`);
    }
    return session;
  }

  /**
   * Start sessions for all connections
   */
  private async startSessions(): Promise<void> {
    const sessionPromises = Array.from(this.connections.entries()).map(
      async ([name, connection]) => {
        const session = await connection.startSession();
        this.sessions[name] = session;
      }
    );
    await Promise.all(sessionPromises);
  }

  /**
   * Start transactions on all sessions
   */
  private startTransactions(): void {
    Object.values(this.sessions).forEach((session) => {
      session.startTransaction({
        readConcern: { level: this.options.readConcern },
        writeConcern: { w: this.options.writeConcern },
      });
    });
  }

  /**
   * Commit all transactions
   */
  private async commitTransactions(): Promise<void> {
    const commitPromises = Object.values(this.sessions).map((session) =>
      session.commitTransaction()
    );
    await Promise.all(commitPromises);
  }

  /**
   * Abort all transactions
   */
  private async abortTransactions(): Promise<void> {
    const abortPromises = Object.values(this.sessions).map((session) =>
      session.abortTransaction().catch(() => {
        // Ignore errors during abort
      })
    );
    await Promise.all(abortPromises);
  }

  /**
   * End all sessions
   */
  private async endSessions(): Promise<void> {
    const endPromises = Object.values(this.sessions).map((session) =>
      session.endSession()
    );
    await Promise.all(endPromises);
    this.sessions = {};
  }

  /**
   * Execute a function within a cross-database transaction
   */
  async execute<T>(
    callback: (transaction: CrossDbTransaction) => Promise<T>
  ): Promise<TransactionResult<T>> {
    if (this.connections.size === 0) {
      throw new Error('No connections added to transaction');
    }

    let attempts = 0;
    let lastError: Error | undefined;

    while (attempts < this.options.maxRetries) {
      attempts++;
      this.isActive = true;
      let timeoutId: NodeJS.Timeout | undefined;

      try {
        // Start sessions
        await this.startSessions();

        // Start transactions
        this.startTransactions();

        // Execute with timeout (properly track timeout ID)
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error('Transaction timeout')),
            this.options.timeout
          );
        });

        const data = await Promise.race([
          callback(this),
          timeoutPromise,
        ]);

        // Clear timeout if operation completed successfully
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Commit all transactions
        await this.commitTransactions();

        return {
          success: true,
          data,
          attempts,
        };
      } catch (error: any) {
        lastError = error;

        // Clear timeout on error
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Abort all transactions
        await this.abortTransactions();

        // Check if error is retryable
        if (!this.isRetryableError(error) || attempts >= this.options.maxRetries) {
          break;
        }

        // Wait before retry (exponential backoff)
        await this.sleep(Math.min(100 * Math.pow(2, attempts - 1), 1000));
      } finally {
        // Ensure timeout is cleared
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Clean up sessions
        await this.endSessions();
        this.isActive = false;
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
    };
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'TransientTransactionError',
      'UnknownTransactionCommitResult',
      'WriteConflict',
    ];

    return (
      error.errorLabels?.some((label: string) =>
        retryableErrors.includes(label)
      ) || error.code === 112 // WriteConflict
    );
  }

  /**
   * Sleep utility for retry backoff
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Helper function to execute a cross-database transaction
 *
 * @example
 * ```typescript
 * const result = await withCrossDbTransaction(
 *   [
 *     { name: 'APP', connection: appConnection },
 *     { name: 'LOG', connection: logConnection }
 *   ],
 *   async (txn) => {
 *     const appSession = txn.getSession('APP');
 *     const logSession = txn.getSession('LOG');
 *
 *     await User.create([userData], { session: appSession });
 *     await AuditLog.create([logData], { session: logSession });
 *
 *     return { success: true };
 *   }
 * );
 * ```
 */
export async function withCrossDbTransaction<T>(
  connections: Array<{ name: string; connection: Connection }>,
  callback: (transaction: CrossDbTransaction) => Promise<T>,
  options?: CrossDbTransactionOptions
): Promise<TransactionResult<T>> {
  const transaction = new CrossDbTransaction(options);

  // Add all connections
  connections.forEach(({ name, connection }) => {
    transaction.addConnection(name, connection);
  });

  return transaction.execute(callback);
}

/**
 * Helper for single-connection transactions with retry logic
 *
 * @example
 * ```typescript
 * const result = await withTransaction(connection, async (session) => {
 *   await User.create([userData], { session });
 *   await Post.create([postData], { session });
 * });
 * ```
 */
export async function withTransaction<T>(
  connection: Connection,
  callback: (session: ClientSession) => Promise<T>,
  options?: CrossDbTransactionOptions
): Promise<TransactionResult<T>> {
  return withCrossDbTransaction(
    [{ name: 'default', connection }],
    async (txn) => callback(txn.getSession('default')),
    options
  );
}
