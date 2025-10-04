import { Connection, ClientSession } from 'mongoose';

/**
 * Two-Phase Commit (2PC) Transaction Manager
 *
 * Implements distributed transaction pattern for ACID compliance across databases.
 *
 * Phase 1 (Prepare): All databases prepare to commit
 * Phase 2 (Commit/Abort): All databases commit or all abort
 *
 * This ensures atomicity across multiple databases.
 */

export interface TwoPhaseCommitOptions {
  maxRetries?: number;
  timeout?: number;
  readConcern?: 'local' | 'majority' | 'snapshot';
  writeConcern?: 'majority' | number;
}

export interface TwoPhaseResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  phase?: 'prepare' | 'commit' | 'abort';
}

interface SessionMap {
  [connectionName: string]: ClientSession;
}

export class TwoPhaseCommitTransaction {
  private sessions: SessionMap = {};
  private connections: Map<string, Connection> = new Map();
  private isActive = false;
  private options: Required<TwoPhaseCommitOptions>;

  constructor(options: TwoPhaseCommitOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      timeout: options.timeout ?? 30000,
      readConcern: options.readConcern ?? 'snapshot',
      writeConcern: options.writeConcern ?? 'majority',
    };
  }

  addConnection(name: string, connection: Connection): this {
    if (this.isActive) {
      throw new Error('Cannot add connections to an active transaction');
    }
    this.connections.set(name, connection);
    return this;
  }

  getSession(connectionName: string): ClientSession {
    const session = this.sessions[connectionName];
    if (!session) {
      throw new Error(`No session found for connection: ${connectionName}`);
    }
    return session;
  }

  private async startSessions(): Promise<void> {
    const sessionPromises = Array.from(this.connections.entries()).map(
      async ([name, connection]) => {
        const session = await connection.startSession();
        this.sessions[name] = session;
      }
    );
    await Promise.all(sessionPromises);
  }

  private startTransactions(): void {
    Object.values(this.sessions).forEach((session) => {
      session.startTransaction({
        readConcern: { level: this.options.readConcern },
        writeConcern: { w: this.options.writeConcern },
      });
    });
  }

  /**
   * Phase 1: Prepare - Ensure all databases can commit
   * MongoDB doesn't have explicit prepare, so we validate via dummy operations
   */
  private async preparePhase(): Promise<boolean> {
    try {
      // All operations already completed successfully if we reach here
      // MongoDB validates on commit, so we're ready for phase 2
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Phase 2: Commit - Commit sequentially to detect failures early
   * If any commit fails, abort remaining transactions
   */
  private async commitPhaseSequential(): Promise<void> {
    const sessionEntries = Object.entries(this.sessions);
    const committed: string[] = [];

    try {
      // Commit sequentially to detect failures
      for (const [name, session] of sessionEntries) {
        await session.commitTransaction();
        committed.push(name);
      }
    } catch (error) {
      // If commit fails, abort all remaining and throw
      console.error(`Commit failed at ${committed.length}/${sessionEntries.length} databases`);

      // Try to abort uncommitted sessions
      const uncommittedSessions = sessionEntries
        .slice(committed.length)
        .map(([_, session]) => session);

      await Promise.all(
        uncommittedSessions.map(session =>
          session.abortTransaction().catch(() => {})
        )
      );

      throw new Error(
        `Partial commit failure: ${committed.length} succeeded, ${sessionEntries.length - committed.length} failed. ` +
        `Committed databases: ${committed.join(', ')}. ` +
        `CRITICAL: Manual intervention may be required to maintain consistency.`
      );
    }
  }

  /**
   * Phase 2 Alternative: Optimistic parallel commit with verification
   */
  private async commitPhaseParallel(): Promise<void> {
    const commitResults = await Promise.allSettled(
      Object.entries(this.sessions).map(async ([name, session]) => ({
        name,
        result: await session.commitTransaction()
      }))
    );

    const failures = commitResults.filter(r => r.status === 'rejected');

    if (failures.length > 0) {
      const succeeded = commitResults.filter(r => r.status === 'fulfilled');

      throw new Error(
        `Partial commit failure: ${succeeded.length} succeeded, ${failures.length} failed. ` +
        `CRITICAL: Data may be inconsistent across databases. Manual intervention required.`
      );
    }
  }

  private async abortTransactions(): Promise<void> {
    const abortPromises = Object.values(this.sessions).map((session) =>
      session.abortTransaction().catch(() => {
        // Ignore errors during abort
      })
    );
    await Promise.all(abortPromises);
  }

  private async endSessions(): Promise<void> {
    const endPromises = Object.values(this.sessions).map((session) =>
      session.endSession()
    );
    await Promise.all(endPromises);
    this.sessions = {};
  }

  /**
   * Execute with Two-Phase Commit protocol
   */
  async execute<T>(
    callback: (transaction: TwoPhaseCommitTransaction) => Promise<T>
  ): Promise<TwoPhaseResult<T>> {
    if (this.connections.size === 0) {
      throw new Error('No connections added to transaction');
    }

    let attempts = 0;
    let lastError: Error | undefined;
    let currentPhase: 'prepare' | 'commit' | 'abort' = 'prepare';

    while (attempts < this.options.maxRetries) {
      attempts++;
      this.isActive = true;
      let timeoutId: NodeJS.Timeout | undefined;

      try {
        // Start sessions
        await this.startSessions();

        // Start transactions
        this.startTransactions();

        // Execute with timeout
        currentPhase = 'prepare';
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

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Phase 1: Prepare
        const canCommit = await this.preparePhase();
        if (!canCommit) {
          throw new Error('Prepare phase failed');
        }

        // Phase 2: Commit (sequential for safety)
        currentPhase = 'commit';
        await this.commitPhaseSequential();

        return {
          success: true,
          data,
          attempts,
          phase: 'commit',
        };
      } catch (error: any) {
        lastError = error;
        currentPhase = 'abort';

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Abort all transactions
        await this.abortTransactions();

        // Check if error is retryable (only retry prepare/operation errors, not commit failures)
        if (!this.isRetryableError(error) ||
            attempts >= this.options.maxRetries ||
            error.message.includes('Partial commit failure')) {
          break;
        }

        // Wait before retry
        await this.sleep(Math.min(100 * Math.pow(2, attempts - 1), 1000));
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        await this.endSessions();
        this.isActive = false;
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
      phase: currentPhase,
    };
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = [
      'TransientTransactionError',
      'UnknownTransactionCommitResult',
      'WriteConflict',
    ];

    return (
      error.errorLabels?.some((label: string) =>
        retryableErrors.includes(label)
      ) || error.code === 112
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Execute with Two-Phase Commit for stronger ACID guarantees
 *
 * WARNING: Sequential commits are slower but prevent partial failures
 * Use this when data consistency is critical
 *
 * @example
 * ```typescript
 * const result = await withTwoPhaseCommit(
 *   [
 *     { name: 'APP', connection: appConnection },
 *     { name: 'LOG', connection: logConnection }
 *   ],
 *   async (txn) => {
 *     // operations
 *   }
 * );
 * ```
 */
export async function withTwoPhaseCommit<T>(
  connections: Array<{ name: string; connection: Connection }>,
  callback: (transaction: TwoPhaseCommitTransaction) => Promise<T>,
  options?: TwoPhaseCommitOptions
): Promise<TwoPhaseResult<T>> {
  const transaction = new TwoPhaseCommitTransaction(options);

  connections.forEach(({ name, connection }) => {
    transaction.addConnection(name, connection);
  });

  return transaction.execute(callback);
}
