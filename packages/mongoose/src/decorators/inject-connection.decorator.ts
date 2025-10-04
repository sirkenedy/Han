import { Inject } from 'han-prev-core';

/**
 * Get the connection token for a named connection
 */
export function getConnectionToken(connectionName?: string): string {
  return connectionName ? `${connectionName}_Connection` : 'MONGOOSE_CONNECTION';
}

/**
 * Decorator to inject a Mongoose connection
 * @param connectionName - Optional name of the connection to inject
 */
export function InjectConnection(connectionName?: string) {
  return Inject(getConnectionToken(connectionName));
}
