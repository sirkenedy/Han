export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ILogger {
  info(message: string): void;
  error(message: string, error?: Error): void;
  warn(message: string): void;
  debug(message: string): void;
}