// 🚀 Han Testing Framework - Professional Testing with DI Support
// Clean API with suite-based testing and dependency injection

// Dynamic import for han-prev-core when available
let HanFactory: any;
try {
  HanFactory = require("han-prev-core").HanFactory;
} catch {
  // Fallback when han-prev-core is not available
  HanFactory = {
    create: async () => ({
      listen: () => Promise.resolve({ close: () => Promise.resolve() }),
      getUrl: () => "http://localhost:3000",
      get: () => ({}),
    }),
  };
}

// 🎯 Test Module Container for DI
export class TestModule {
  private app: any;
  private httpServer: any;

  static async create(
    moduleClass: any,
    options: any = {},
  ): Promise<TestModule> {
    const instance = new TestModule();
    instance.app = await HanFactory.create(moduleClass, {
      ...options,
      microservice: false,
      logger: false,
    });
    return instance;
  }

  async init(): Promise<{ port: number; close: () => Promise<void> }> {
    // Bind to 127.0.0.1 (localhost) on port 0 (auto-assign available port)
    // This ensures tests can connect via localhost
    this.httpServer = await this.app.listen(0, "127.0.0.1");

    // Get the actual port that was assigned
    const address = this.httpServer.address();
    const port = address && typeof address !== "string" ? address.port : 0;

    // Small delay to ensure server is fully ready to accept connections
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log(`📡 Test server listening on 127.0.0.1:${port}`);

    return {
      port,
      close: async () => {
        if (this.httpServer) {
          await this.httpServer.close();
        }
      },
    };
  }

  getPort(): number {
    if (!this.httpServer) {
      throw new Error("Server not started. Call init() first.");
    }
    const address = this.httpServer.address();
    return address && typeof address !== "string" ? address.port : 0;
  }

  get<T>(token: string | Function): T {
    if (!this.app) {
      throw new Error("Test module not initialized");
    }
    return this.app.get(token);
  }

  async close(): Promise<void> {
    if (this.httpServer) {
      this.httpServer = null;
    }
    this.app = null;
  }
}

// 🎪 Test Suite Manager
class TestRunner {
  private suites: Map<string, TestSuite> = new Map();
  private currentSuite: string | null = null;
  private beforeAllHooks: Array<() => void | Promise<void>> = [];
  private afterAllHooks: Array<() => void | Promise<void>> = [];
  private beforeEachHooks: Array<() => void | Promise<void>> = [];
  private afterEachHooks: Array<() => void | Promise<void>> = [];

  suite(name: string, fn: () => void): void {
    const suite = new TestSuite(name);
    this.suites.set(name, suite);
    this.currentSuite = name;
    fn();
    this.currentSuite = null;
  }

  test(description: string, fn: () => void | Promise<void>): void {
    if (!this.currentSuite) {
      throw new Error("test() must be called inside suite()");
    }
    const suite = this.suites.get(this.currentSuite);
    if (suite) {
      suite.addTest(description, fn);
    }
  }

  beforeAll(fn: () => void | Promise<void>): void {
    this.beforeAllHooks.push(fn);
  }

  afterAll(fn: () => void | Promise<void>): void {
    this.afterAllHooks.push(fn);
  }

  beforeEach(fn: () => void | Promise<void>): void {
    this.beforeEachHooks.push(fn);
  }

  afterEach(fn: () => void | Promise<void>): void {
    this.afterEachHooks.push(fn);
  }

  async run(): Promise<void> {
    let totalTests = 0;
    let passedTests = 0;
    const startTime = Date.now();

    console.log("\n🚀 Han Framework Testing");
    console.log("━".repeat(60));

    try {
      // Run global beforeAll hooks
      for (const hook of this.beforeAllHooks) {
        await hook();
      }

      // Run each suite
      for (const [_, suite] of this.suites) {
        console.log(`\n📦 ${suite.name}`);
        console.log(`   Running ${suite.getTestCount()} tests...`);
        const results = await suite.run(
          this.beforeEachHooks,
          this.afterEachHooks,
        );
        totalTests += results.total;
        passedTests += results.passed;
      }

      // Run global afterAll hooks
      for (const hook of this.afterAllHooks) {
        await hook();
      }
    } catch (error: any) {
      console.log(`\n💥 Test setup failed: ${error?.message || error}`);
      console.log(error?.stack || "");
      process.exit(1);
    }

    const duration = Date.now() - startTime;
    console.log("\n" + "━".repeat(60));
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);

    if (passedTests === totalTests) {
      console.log("🏆 All tests passed!\n");
      process.exit(0);
    } else {
      console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}\n`);
      process.exit(1);
    }

    // Reset state
    this.suites.clear();
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
  }
}

// 🎯 Test Suite
class TestSuite {
  private tests: Array<{
    description: string;
    fn: () => void | Promise<void>;
  }> = [];

  constructor(public readonly name: string) {}

  addTest(description: string, fn: () => void | Promise<void>): void {
    this.tests.push({ description, fn });
  }

  getTestCount(): number {
    return this.tests.length;
  }

  async run(
    beforeEachHooks: Array<() => void | Promise<void>>,
    afterEachHooks: Array<() => void | Promise<void>>,
  ): Promise<{ total: number; passed: number }> {
    let passed = 0;

    for (const test of this.tests) {
      const startTime = Date.now();
      try {
        // Run beforeEach hooks
        for (const hook of beforeEachHooks) {
          await hook();
        }

        await test.fn();
        const duration = Date.now() - startTime;
        console.log(`  ✅ ${test.description} \x1b[3m${duration}ms\x1b[0m`);
        passed++;

        // Run afterEach hooks
        for (const hook of afterEachHooks) {
          await hook();
        }
      } catch (error: any) {
        const duration = Date.now() - startTime;
        console.log(`  ❌ ${test.description} \x1b[3m${duration}ms\x1b[0m`);
        console.log(`     ${error?.message || error}`);

        // Still run afterEach even if test failed
        try {
          for (const hook of afterEachHooks) {
            await hook();
          }
        } catch (hookError: any) {
          console.log(`     Hook Error: ${hookError?.message || hookError}`);
        }
      }
    }

    return { total: this.tests.length, passed };
  }
}

// 🎯 Assertion Library
export class Expect {
  constructor(private actual: any) {}

  toBe(expected: any): this {
    if (this.actual !== expected) {
      throw new Error(
        `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(this.actual)}`,
      );
    }
    return this;
  }

  toEqual(expected: any): this {
    if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
      throw new Error(
        `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(this.actual)}`,
      );
    }
    return this;
  }

  toContain(expected: any): this {
    if (typeof this.actual === "string" && !this.actual.includes(expected)) {
      throw new Error(`Expected "${this.actual}" to contain "${expected}"`);
    }
    if (Array.isArray(this.actual) && !this.actual.includes(expected)) {
      throw new Error(`Expected array to contain ${JSON.stringify(expected)}`);
    }
    return this;
  }

  toHaveLength(expected: number): this {
    if (!this.actual?.length || this.actual.length !== expected) {
      throw new Error(
        `Expected length ${expected}, got ${this.actual?.length || 0}`,
      );
    }
    return this;
  }

  toHaveProperty(property: string): this {
    if (!(property in this.actual)) {
      throw new Error(`Expected object to have property "${property}"`);
    }
    return this;
  }

  toBeDefined(): this {
    if (this.actual === undefined) {
      throw new Error("Expected value to be defined");
    }
    return this;
  }

  toBeUndefined(): this {
    if (this.actual !== undefined) {
      throw new Error("Expected value to be undefined");
    }
    return this;
  }

  toBeNull(): this {
    if (this.actual !== null) {
      throw new Error("Expected value to be null");
    }
    return this;
  }

  toBeTruthy(): this {
    if (!this.actual) {
      throw new Error(`Expected ${this.actual} to be truthy`);
    }
    return this;
  }

  toBeFalsy(): this {
    if (this.actual) {
      throw new Error(`Expected ${this.actual} to be falsy`);
    }
    return this;
  }

  toBeGreaterThan(expected: number): this {
    if (this.actual <= expected) {
      throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
    }
    return this;
  }

  toBeLessThan(expected: number): this {
    if (this.actual >= expected) {
      throw new Error(`Expected ${this.actual} to be less than ${expected}`);
    }
    return this;
  }

  toMatch(pattern: RegExp): this {
    if (!pattern.test(this.actual)) {
      throw new Error(`Expected "${this.actual}" to match ${pattern}`);
    }
    return this;
  }

  toBeInstanceOf(expected: any): this {
    if (!(this.actual instanceof expected)) {
      throw new Error(
        `Expected value to be instance of ${expected.name || expected}, got ${this.actual?.constructor?.name || typeof this.actual}`,
      );
    }
    return this;
  }

  toBeGreaterThanOrEqual(expected: number): this {
    if (this.actual < expected) {
      throw new Error(
        `Expected ${this.actual} to be greater than or equal to ${expected}`,
      );
    }
    return this;
  }

  toBeLessThanOrEqual(expected: number): this {
    if (this.actual > expected) {
      throw new Error(
        `Expected ${this.actual} to be less than or equal to ${expected}`,
      );
    }
    return this;
  }

  toBeCloseTo(expected: number, precision: number = 2): this {
    const diff = Math.abs(this.actual - expected);
    const threshold = Math.pow(10, -precision) / 2;
    if (diff >= threshold) {
      throw new Error(
        `Expected ${this.actual} to be close to ${expected} (precision: ${precision})`,
      );
    }
    return this;
  }

  toHaveBeenCalled(): this {
    if (typeof this.actual !== "function" || !("calls" in this.actual)) {
      throw new Error("Expected a mock function");
    }
    if ((this.actual as any).calls.length === 0) {
      throw new Error("Expected function to have been called");
    }
    return this;
  }

  toHaveBeenCalledTimes(expected: number): this {
    if (typeof this.actual !== "function" || !("calls" in this.actual)) {
      throw new Error("Expected a mock function");
    }
    const calls = (this.actual as any).calls.length;
    if (calls !== expected) {
      throw new Error(
        `Expected function to be called ${expected} times, but was called ${calls} times`,
      );
    }
    return this;
  }

  toHaveBeenCalledWith(...args: any[]): this {
    if (typeof this.actual !== "function" || !("calls" in this.actual)) {
      throw new Error("Expected a mock function");
    }
    const calls = (this.actual as any).calls;
    const found = calls.some(
      (call: any[]) => JSON.stringify(call) === JSON.stringify(args),
    );
    if (!found) {
      throw new Error(
        `Expected function to be called with ${JSON.stringify(args)}`,
      );
    }
    return this;
  }

  toContainEqual(expected: any): this {
    if (!Array.isArray(this.actual)) {
      throw new Error("Expected an array");
    }
    const found = this.actual.some(
      (item) => JSON.stringify(item) === JSON.stringify(expected),
    );
    if (!found) {
      throw new Error(
        `Expected array to contain equal ${JSON.stringify(expected)}`,
      );
    }
    return this;
  }

  toMatchObject(expected: any): this {
    if (typeof this.actual !== "object" || this.actual === null) {
      throw new Error("Expected an object");
    }
    for (const key in expected) {
      if (JSON.stringify(this.actual[key]) !== JSON.stringify(expected[key])) {
        throw new Error(`Expected object to match. Property "${key}" differs`);
      }
    }
    return this;
  }

  toHavePropertyValue(property: string, value: any): this {
    if (!(property in this.actual)) {
      throw new Error(`Expected object to have property "${property}"`);
    }
    if (this.actual[property] !== value) {
      throw new Error(
        `Expected property "${property}" to be ${value}, got ${this.actual[property]}`,
      );
    }
    return this;
  }

  toThrow(): this {
    if (typeof this.actual !== "function") {
      throw new Error("Expected a function");
    }
    try {
      this.actual();
      throw new Error("Expected function to throw");
    } catch (error) {
      // Function threw as expected
    }
    return this;
  }

  async toResolve(): Promise<this> {
    if (!(this.actual instanceof Promise)) {
      throw new Error("Expected a Promise");
    }
    await this.actual;
    return this;
  }

  async toReject(): Promise<this> {
    if (!(this.actual instanceof Promise)) {
      throw new Error("Expected a Promise");
    }
    try {
      await this.actual;
      throw new Error("Expected promise to reject");
    } catch (error) {
      // Promise rejected as expected
    }
    return this;
  }
}

// 🌐 HTTP Response Interface
export interface HttpResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

// 🌐 HTTP Client for E2E Testing
export class HttpClient {
  private baseUrl: string;

  constructor(port: number) {
    // Always use localhost for testing
    this.baseUrl = `http://localhost:${port}`;
  }

  async get<T = any>(
    path: string,
    options: any = {},
  ): Promise<HttpResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    console.log(`  🌐 GET ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...options.headers },
      signal: AbortSignal.timeout(5000),
    });

    return {
      status: response.status,
      data: (response.headers.get("content-type")?.includes("application/json")
        ? await response.json()
        : await response.text()) as T,
      headers: Object.fromEntries(response.headers.entries()),
    };
  }

  async post<T = any>(
    path: string,
    body: any = {},
    options: any = {},
  ): Promise<HttpResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...options.headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    return {
      status: response.status,
      data: (response.headers.get("content-type")?.includes("application/json")
        ? await response.json()
        : await response.text()) as T,
      headers: Object.fromEntries(response.headers.entries()),
    };
  }

  async put<T = any>(
    path: string,
    body: any = {},
    options: any = {},
  ): Promise<HttpResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...options.headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    return {
      status: response.status,
      data: (response.headers.get("content-type")?.includes("application/json")
        ? await response.json()
        : await response.text()) as T,
      headers: Object.fromEntries(response.headers.entries()),
    };
  }

  async delete<T = any>(
    path: string,
    options: any = {},
  ): Promise<HttpResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...options.headers },
      signal: AbortSignal.timeout(5000),
    });

    return {
      status: response.status,
      data: (response.headers.get("content-type")?.includes("application/json")
        ? await response.json()
        : await response.text()) as T,
      headers: Object.fromEntries(response.headers.entries()),
    };
  }
}

// Global instance
const runner = new TestRunner();
let autoRunScheduled = false;

// 🎨 Exported API
export const suite = (name: string, fn: () => void) => {
  runner.suite(name, fn);

  // Auto-schedule test run when executed directly (check if parent module is the entry point)
  if (
    !autoRunScheduled &&
    typeof require !== "undefined" &&
    require.main &&
    require.main.filename !== __filename
  ) {
    autoRunScheduled = true;
    // Run tests on next tick to allow all suites to register
    process.nextTick(() => runner.run());
  }
};
export const test = (description: string, fn: () => void | Promise<void>) =>
  runner.test(description, fn);
export const beforeAll = (fn: () => void | Promise<void>) =>
  runner.beforeAll(fn);
export const afterAll = (fn: () => void | Promise<void>) => runner.afterAll(fn);
export const beforeEach = (fn: () => void | Promise<void>) =>
  runner.beforeEach(fn);
export const afterEach = (fn: () => void | Promise<void>) =>
  runner.afterEach(fn);
export const runTests = () => runner.run();
export const expect = (actual: any) => new Expect(actual);

// 🎭 Mock Function Helper
export interface MockFunction<T = any> extends Function {
  (...args: any[]): T;
  calls: any[][];
  mockReturnValue: (value: T) => MockFunction<T>;
  mockImplementation: (fn: (...args: any[]) => T) => MockFunction<T>;
  mockReset: () => void;
}

export const mock = <T = any>(
  implementation?: (...args: any[]) => T,
): MockFunction<T> => {
  const calls: any[][] = [];
  let returnValue: T | undefined;
  let mockImpl = implementation;

  const fn = function (...args: any[]): T {
    calls.push(args);
    if (mockImpl) {
      return mockImpl(...args);
    }
    return returnValue as T;
  } as MockFunction<T>;

  fn.calls = calls;
  fn.mockReturnValue = (value: T) => {
    returnValue = value;
    return fn;
  };
  fn.mockImplementation = (impl: (...args: any[]) => T) => {
    mockImpl = impl;
    return fn;
  };
  fn.mockReset = () => {
    calls.length = 0;
    returnValue = undefined;
    mockImpl = implementation;
  };

  return fn;
};
