import { ILogger } from "../interfaces";

export class Logger implements ILogger {
  private static formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  static info(message: string): void {
    console.log(this.formatMessage("info", message));
  }

  static error(message: string, error?: Error): void {
    console.error(this.formatMessage("error", message));
    if (error) {
      console.error(error.stack);
    }
  }

  static warn(message: string): void {
    console.warn(this.formatMessage("warn", message));
  }

  static debug(message: string): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatMessage("debug", message));
    }
  }

  info(message: string): void {
    Logger.info(message);
  }

  error(message: string, error?: Error): void {
    Logger.error(message, error);
  }

  warn(message: string): void {
    Logger.warn(message);
  }

  debug(message: string): void {
    Logger.debug(message);
  }
}
