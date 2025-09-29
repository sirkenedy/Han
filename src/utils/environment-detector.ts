import * as os from 'os';
import * as fs from 'fs';

export interface EnvironmentInfo {
  isContainer: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  defaultHost: string;
  defaultPort: number;
  publicUrl: string | undefined;
}

export class EnvironmentDetector {
  static detect(): EnvironmentInfo {
    const isContainer = this.detectContainer();
    const isProduction = this.detectProduction();
    const isDevelopment = !isProduction;

    return {
      isContainer,
      isProduction,
      isDevelopment,
      defaultHost: this.getDefaultHost(isContainer, isProduction),
      defaultPort: this.getDefaultPort(),
      publicUrl: this.detectPublicUrl(),
    };
  }

  private static detectContainer(): boolean {
    // Check for Docker
    try {
      if (fs.existsSync('/.dockerenv')) {
        return true;
      }
    } catch {
      // Ignore
    }

    // Check for Kubernetes
    if (process.env.KUBERNETES_SERVICE_HOST) {
      return true;
    }

    return false;
  }

  private static detectProduction(): boolean {
    // Standard NODE_ENV check
    if (process.env.NODE_ENV === 'production') {
      return true;
    }

    // Cloud platform indicators
    const productionEnvs = [
      'AWS_EXECUTION_ENV',
      'HEROKU_APP_NAME',
      'VERCEL_ENV',
      'RAILWAY_ENVIRONMENT',
    ];

    return productionEnvs.some(env => process.env[env]);
  }

  private static getDefaultHost(isContainer: boolean, isProduction: boolean): string {
    // Container or production environments bind to all interfaces
    if (isContainer || isProduction) {
      return '0.0.0.0';
    }

    // Development defaults to localhost
    return 'localhost';
  }

  private static getDefaultPort(): number {
    // Standard PORT environment variable
    if (process.env.PORT) {
      const port = parseInt(process.env.PORT, 10);
      if (!isNaN(port) && port > 0 && port < 65536) {
        return port;
      }
    }

    return 3000;
  }

  private static detectPublicUrl(): string | undefined {
    // Heroku
    if (process.env.HEROKU_APP_NAME) {
      return `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
    }

    // Vercel
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }

    return undefined;
  }

  static getNetworkInterfaces(): string[] {
    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];

    Object.values(interfaces).forEach(interfaceList => {
      interfaceList?.forEach(iface => {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push(iface.address);
        }
      });
    });

    return addresses;
  }

  static getDisplayUrl(host: string, port: number, https = false): string {
    const protocol = https ? 'https' : 'http';

    // If host is 0.0.0.0, show the first available network interface or localhost
    if (host === '0.0.0.0') {
      const networkAddresses = this.getNetworkInterfaces();
      const displayHost = networkAddresses.length > 0 ? networkAddresses[0] : 'localhost';
      return `${protocol}://${displayHost}:${port}`;
    }

    return `${protocol}://${host}:${port}`;
  }
}