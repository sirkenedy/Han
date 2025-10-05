/**
 * Request Chain Storage
 * Handles localStorage persistence for request chains and saved requests
 */

import {
  SavedRequest,
  RequestChain,
  ChainPlaygroundConfig,
} from "../interfaces/developer-experience.interface";

const DEFAULT_CONFIG: Required<ChainPlaygroundConfig> = {
  enabled: true,
  maxSavedRequests: 100,
  maxChains: 50,
  autoSave: true,
  storageKey: "han_openapi_playground",
};

const STORAGE_KEYS = {
  REQUESTS: "saved_requests",
  CHAINS: "request_chains",
  CONFIG: "playground_config",
} as const;

/**
 * Chain Storage Manager
 */
export class ChainStorageManager {
  private config: Required<ChainPlaygroundConfig>;
  private storagePrefix: string;

  constructor(config: Partial<ChainPlaygroundConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storagePrefix = this.config.storageKey;
  }

  /**
   * Save a request to localStorage
   */
  saveRequest(request: SavedRequest): void {
    if (!this.config.enabled) return;

    const requests = this.getSavedRequests();

    // Add new request at the beginning
    requests.unshift(request);

    // Enforce max limit
    if (requests.length > this.config.maxSavedRequests) {
      requests.splice(this.config.maxSavedRequests);
    }

    this.setItem(STORAGE_KEYS.REQUESTS, requests);
  }

  /**
   * Get all saved requests
   */
  getSavedRequests(): SavedRequest[] {
    const data = this.getItem<SavedRequest[]>(STORAGE_KEYS.REQUESTS);
    return data || [];
  }

  /**
   * Get a specific saved request by ID
   */
  getSavedRequest(id: string): SavedRequest | null {
    const requests = this.getSavedRequests();
    return requests.find((r) => r.id === id) || null;
  }

  /**
   * Delete a saved request
   */
  deleteSavedRequest(id: string): void {
    const requests = this.getSavedRequests();
    const filtered = requests.filter((r) => r.id !== id);
    this.setItem(STORAGE_KEYS.REQUESTS, filtered);
  }

  /**
   * Clear all saved requests
   */
  clearSavedRequests(): void {
    this.removeItem(STORAGE_KEYS.REQUESTS);
  }

  /**
   * Save a request chain
   */
  saveChain(chain: RequestChain): void {
    if (!this.config.enabled) return;

    const chains = this.getChains();
    const existingIndex = chains.findIndex((c) => c.id === chain.id);

    if (existingIndex >= 0) {
      // Update existing chain
      chains[existingIndex] = { ...chain, updatedAt: new Date() };
    } else {
      // Add new chain
      chains.push(chain);
    }

    // Enforce max limit
    if (chains.length > this.config.maxChains) {
      // Remove oldest chains
      chains.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      chains.splice(this.config.maxChains);
    }

    this.setItem(STORAGE_KEYS.CHAINS, chains);
  }

  /**
   * Get all saved chains
   */
  getChains(): RequestChain[] {
    const data = this.getItem<RequestChain[]>(STORAGE_KEYS.CHAINS);
    return data || [];
  }

  /**
   * Get a specific chain by ID
   */
  getChain(id: string): RequestChain | null {
    const chains = this.getChains();
    return chains.find((c) => c.id === id) || null;
  }

  /**
   * Delete a chain
   */
  deleteChain(id: string): void {
    const chains = this.getChains();
    const filtered = chains.filter((c) => c.id !== id);
    this.setItem(STORAGE_KEYS.CHAINS, filtered);
  }

  /**
   * Clear all chains
   */
  clearChains(): void {
    this.removeItem(STORAGE_KEYS.CHAINS);
  }

  /**
   * Clear all playground data
   */
  clearAll(): void {
    this.clearSavedRequests();
    this.clearChains();
    this.removeItem(STORAGE_KEYS.CONFIG);
  }

  /**
   * Export all data as JSON
   */
  exportData(): string {
    const data = {
      requests: this.getSavedRequests(),
      chains: this.getChains(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data from JSON
   */
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      if (data.requests && Array.isArray(data.requests)) {
        this.setItem(STORAGE_KEYS.REQUESTS, data.requests);
      }

      if (data.chains && Array.isArray(data.chains)) {
        this.setItem(STORAGE_KEYS.CHAINS, data.chains);
      }
    } catch (error) {
      throw new Error(`Failed to import data: ${error}`);
    }
  }

  /**
   * Get storage statistics
   */
  getStats() {
    const requests = this.getSavedRequests();
    const chains = this.getChains();

    return {
      savedRequests: requests.length,
      maxSavedRequests: this.config.maxSavedRequests,
      savedChains: chains.length,
      maxChains: this.config.maxChains,
      storageUsed: this.calculateStorageSize(),
    };
  }

  /**
   * Calculate approximate storage size in bytes
   */
  private calculateStorageSize(): number {
    let totalSize = 0;

    for (const key of Object.values(STORAGE_KEYS)) {
      const fullKey = `${this.storagePrefix}_${key}`;
      const item = localStorage.getItem(fullKey);
      if (item) {
        totalSize += item.length * 2; // UTF-16 encoding
      }
    }

    return totalSize;
  }

  /**
   * Get item from localStorage with prefix
   */
  private getItem<T>(key: string): T | null {
    const fullKey = `${this.storagePrefix}_${key}`;
    const item = localStorage.getItem(fullKey);

    if (!item) return null;

    try {
      return JSON.parse(item, this.reviver) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set item in localStorage with prefix
   */
  private setItem(key: string, value: any): void {
    const fullKey = `${this.storagePrefix}_${key}`;
    localStorage.setItem(fullKey, JSON.stringify(value));
  }

  /**
   * Remove item from localStorage
   */
  private removeItem(key: string): void {
    const fullKey = `${this.storagePrefix}_${key}`;
    localStorage.removeItem(fullKey);
  }

  /**
   * JSON reviver to convert date strings back to Date objects
   */
  private reviver(key: string, value: any): any {
    const dateFields = ["timestamp", "createdAt", "updatedAt", "exportedAt"];
    if (dateFields.includes(key) && typeof value === "string") {
      return new Date(value);
    }
    return value;
  }
}

/**
 * Singleton instance
 */
let storageInstance: ChainStorageManager | null = null;

/**
 * Get the storage manager instance
 */
export function getChainStorage(
  config?: Partial<ChainPlaygroundConfig>,
): ChainStorageManager {
  if (!storageInstance) {
    storageInstance = new ChainStorageManager(config);
  }
  return storageInstance;
}

/**
 * Set a custom storage manager instance
 */
export function setChainStorage(manager: ChainStorageManager): void {
  storageInstance = manager;
}
