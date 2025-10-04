import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

/**
 * Auto-loads environment variables from .env files
 *
 * Automatically loads environment variables in the following order:
 * 1. .env.{NODE_ENV}.local (highest priority)
 * 2. .env.{NODE_ENV}
 * 3. .env.local
 * 4. .env (lowest priority)
 *
 * This matches the behavior of popular frameworks like NestJS and Next.js
 * Variables defined earlier will not be overwritten by those defined later
 */
export class EnvLoader {
  private static loaded = false;
  private static loadedFiles: string[] = [];

  /**
   * Auto-load environment variables
   * Only loads once to prevent duplicate loading
   */
  static autoLoad(): void {
    if (this.loaded) {
      return;
    }

    const nodeEnv = process.env.NODE_ENV || "development";
    const cwd = process.cwd();

    // Priority order (highest to lowest)
    const envFiles = [
      `.env.${nodeEnv}.local`,
      `.env.${nodeEnv}`,
      ".env.local",
      ".env",
    ];

    // Load env files in reverse order so higher priority files override
    // But dotenv doesn't override existing env vars, so we load in reverse
    for (const file of envFiles.reverse()) {
      const filePath = resolve(cwd, file);

      if (existsSync(filePath)) {
        config({ path: filePath });
        this.loadedFiles.push(file);
      }
    }

    this.loaded = true;

    // Only log in development
    if (nodeEnv === "development" && this.loadedFiles.length > 0) {
      console.log(
        `🔧 Auto-loaded environment files: ${this.loadedFiles.join(", ")}`,
      );
    }
  }

  /**
   * Check if env files were loaded
   */
  static isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get list of loaded env files
   */
  static getLoadedFiles(): string[] {
    return [...this.loadedFiles];
  }

  /**
   * Reset the loader (useful for testing)
   */
  static reset(): void {
    this.loaded = false;
    this.loadedFiles = [];
  }
}
