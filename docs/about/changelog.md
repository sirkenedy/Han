# Changelog

All notable changes to the Han Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- WebSocket support
- GraphQL integration
- Microservices support
- Enhanced testing utilities
- Phase 2 OpenAPI Features:
  - Automatic Client SDK Generation (TypeScript, Python, Go)
  - API Changelog & Breaking Change Detection
  - Smart Mock Server with Context-Aware Data

## [1.2.0] - 2025-10-05

### Added - OpenAPI Package (han-prev-openapi@1.0.0)

#### 🚀 **Phase 1 Game-Changing Features** (First in any framework!)

- **Live Contract Testing** - Revolutionary real-time API validation
  - Automatically validates API responses against OpenAPI documentation during development
  - Detects missing fields, type mismatches, nullable violations, and unexpected fields
  - Real-time console warnings with actionable suggestions
  - Strict mode support for CI/CD integration
  - `@ApiContractTesting()` decorator for per-endpoint control
  - Zero configuration required - works out of the box
  - **Production-safe**: Disabled by default, must be explicitly enabled in development only

- **Example Harvester** - Automatic realistic example generation
  - Auto-captures real request/response pairs from development traffic
  - Intelligent categorization (success, error, edge cases, performance)
  - Automatic sensitive data sanitization (passwords, tokens, API keys)
  - Sampling support for high-traffic endpoints
  - Manual approval workflow to ensure quality
  - `@ApiHarvestExamples()` decorator with flexible configuration
  - Captures edge cases automatically (null values, empty arrays, error responses)
  - **Production-safe**: Disabled by default, never enable in production

- **Performance Budgets** - Response time tracking and enforcement
  - Set target response times per endpoint with `@ApiPerformance()`
  - Track P95 and P99 percentiles in addition to average response times
  - Real-time warnings when budgets are exceeded with optimization suggestions
  - CI/CD integration to prevent deploying slow code
  - Convenience decorators: `@ApiFastEndpoint()`, `@ApiStandardEndpoint()`, `@ApiSlowEndpoint()`
  - Performance trend reporting and aggregated statistics
  - Async tracking with zero impact on response times
  - **Production-safe**: Disabled by default, optional minimal sampling (1%) for production monitoring

#### 📚 **Core OpenAPI Features**

- **Automatic Documentation** - Generate OpenAPI 3.0 specs from decorators
- **Type-Safe Decorators** - Full TypeScript support with IntelliSense
  - `@ApiProperty()` for DTO properties
  - `@ApiOperation()` for endpoint documentation
  - `@ApiOkResponse()`, `@ApiCreatedResponse()`, etc. for responses
  - `@ApiParam()`, `@ApiQuery()`, `@ApiHeader()` for parameters
  - `@ApiBearerAuth()`, `@ApiBasicAuth()`, `@ApiOAuth2()` for security
  - `@ApiTags()` for endpoint organization
- **Schema Auto-Generation** - Automatically generate schemas from DTOs
- **Auto Type Inference** - Detects types from `@Body()` parameters (no explicit `@ApiBody()` needed)
- **Swagger UI Integration** - Beautiful, interactive API documentation
- **Multiple Auth Strategies** - Bearer, Basic, OAuth2, API Key, Cookie authentication
- **Response Shortcuts** - Convenient decorators for common HTTP responses
- **Zero Configuration** - Works out of the box with sensible defaults

#### 🔧 **Infrastructure & Utilities**

- **Telemetry Middleware** - Centralized middleware for all Phase 1 features
  - `createTelemetryMiddleware()` for easy setup
  - Configurable sampling rates and retention policies
  - In-memory storage with SQLite-ready architecture
  - Auto-cleanup of old telemetry data (7-day retention default)
  - Production warning system prevents accidental production enablement

- **Contract Validation Engine** - Schema validation with detailed error reporting
- **Performance Tracking** - Millisecond-precision timing with breakdown support
- **Example Management** - CLI tools for managing harvested examples (planned)

#### 📖 **Documentation**

- **Comprehensive Guides** (5,000+ lines total):
  - Live Contract Testing guide with real-world examples
  - Example Harvester guide with edge case handling
  - Performance Budgets guide with optimization strategies
  - Production safety warnings throughout
- **Quick Start** - Copy-paste ready examples
- **Migration Guide** - Step-by-step from NestJS OpenAPI
- **API Reference** - Complete decorator documentation
- **Best Practices** - Do's and don'ts with explanations
- **Troubleshooting** - Common issues and solutions
- **VitePress Navigation** - Organized sidebar with Phase 1 features section

### Changed

- **Documentation Structure** - Added "🚀 Phase 1 Features" section to OpenAPI docs
- **Package README** - Updated with Phase 1 feature highlights and usage examples
- **VitePress Config** - Enhanced sidebar navigation for OpenAPI documentation

### Security

- **Telemetry Disabled by Default** - All tracking features require explicit opt-in
- **Production Warnings** - Automatic warnings if telemetry accidentally enabled in production
- **Data Sanitization** - Sensitive fields automatically redacted in harvested examples
- **Environment-Based Control** - Recommended pattern: `if (process.env.NODE_ENV === 'development')`

### Performance

- **Zero Impact When Disabled** - No overhead when telemetry features are off (default)
- **Async Processing** - All telemetry happens after response is sent to user
- **Minimal Memory Footprint** - ~50-100MB for 1000 requests with 7-day retention
- **Configurable Sampling** - Reduce overhead on high-traffic endpoints

## [1.1.0] - 2025-10-04

### Added - Core Framework
- **Environment Loading** - Automatic `.env` file loading without manual dotenv imports
  - Auto-loads environment files based on `NODE_ENV` (`.env.development`, `.env.production`, etc.)
  - Priority-based loading (`.env.{NODE_ENV}.local` > `.env.{NODE_ENV}` > `.env.local` > `.env`)
  - Zero-configuration setup like NestJS and Prisma
  - New `EnvLoader` utility exported from core
- **Dependency Injection** - Added `@Inject` decorator for custom dependency injection
- **Dependency Injection** - Added `@InjectModel` decorator for model injection pattern

### Added - Mongoose Package
- **MongoDB Integration** - Production-ready mongoose package (`han-prev-mongoose@1.1.0`)
  - Multi-database connection support with `forRootMultiple()`
  - Cross-database transactions with `withCrossDbTransaction()`
  - Two-Phase Commit transactions with `withTwoPhaseCommit()` for ACID guarantees
  - Decorator-based schemas with `@Schema()` and `@Prop()`
  - `@InjectModel()` and `@InjectConnection()` decorators
  - Graceful shutdown with `closeAllConnections()`
  - Connection health checks
  - Comprehensive documentation with 100+ examples

### Added - Documentation
- **VitePress Favicon** - Added favicon support for documentation site
- **Technique Pages** - Enhanced all technique documentation with:
  - Real-world use cases and examples
  - "Why use this?" sections explaining benefits
  - Before/after code comparisons
  - Performance metrics and best practices
  - Security warnings and cost implications
  - Visual indicators and comparison tables
- **Mongoose Docs** - 5,000+ lines of comprehensive documentation including:
  - Quick start guide
  - CRUD operations
  - Advanced queries and aggregations
  - Multi-database patterns
  - Transaction strategies
  - Production best practices
  - Migration guides from NestJS
- **Configuration Guide** - Updated with automatic .env loading instructions
- **GitHub Pages** - Setup deployment workflow for documentation

### Changed
- **Core** - Version bumped to 1.1.0 with dotenv dependency
- **Documentation** - All code examples now reflect zero-config .env loading
- **Mongoose Examples** - Fixed model injection in transaction examples

### Fixed
- **Mongoose Docs** - Corrected missing `@InjectModel()` in transaction examples
- **Documentation Build** - Resolved VitePress build issues

## [1.0.16] - 2025-10-03

### Added
- **Third-party Integration** - Factory provider pattern for external library integration
- **Lifecycle Hooks** - Enhanced lifecycle management with `OnModuleInit` and `OnModuleDestroy`
- **Code Formatting** - Automatic Prettier formatting across all packages

### Fixed
- **Router** - Fixed route path combination bug in router.factory.ts
- **Router** - Ensured all controller paths start with leading slash (/)
- **Modules** - Routes from imported modules now correctly register with Express
- **Controllers** - `@Controller('orders')` with `@Get()` now correctly creates `/orders` route
- **Module Registration** - Auto-import functionality for generated resources

### Changed
- **Core** - Improved route registration logic
- **Modules** - Enhanced module import handling

## [1.0.15] - 2025-10-01

### Added
- **Testing** - Auto-run functionality for tests without requiring `runTests()` boilerplate
- **Testing** - Execution time display in italics after each test description
- **Testing** - Test discovery automatically finds all test files
- **CLI** - Dynamic version reading from package.json
- **CLI** - `han generate resource` command for full resource scaffolding
  - Generates module, controller, service, and test files
  - In-memory data storage implementation
  - Functional test templates

### Fixed
- **Testing** - Fixed double logging in test output - now shows only final result (pass/fail)

### Changed
- **CLI** - Updated all package dependencies to latest versions
- **CLI** - Updated test templates to use han-prev-testing format
- **Testing** - Move test runner from project scripts to package binary (`han-test` command)

### Removed
- **CLI** - Removed unused resource.command.ts file (dead code cleanup)
- **Testing** - Removed `runTests()` import requirement from generated test files

## [1.0.14] - 2025-09-28

### Added
- **CLI** - Automatic module import functionality for generated resources
- **CLI** - New `updateAppModule()` method auto-adds modules to app.module.ts imports
- **CLI** - Supports `--skip-import` flag to disable auto-import when needed

### Changed
- **CLI** - Generated resources are now immediately accessible without manual imports
- **Core** - Improved module resolution and import handling

## [1.0.12] - 2025-09-15

### Added
- **Testing** - Comprehensive test matchers
  - `toBeInstanceOf` - Check instance type
  - `toBeGreaterThanOrEqual` - Numeric comparison
  - `toBeLessThanOrEqual` - Numeric comparison
  - `toBeCloseTo` - Float comparison with precision
  - `toContainEqual` - Deep equality check in arrays
  - `toMatchObject` - Partial object matching
  - `toHavePropertyValue` - Property value assertion
- **Testing** - Mock function helper with call tracking

### Changed
- **Testing** - Generated projects no longer need scripts folder for testing
- **Testing** - Improved test output formatting

## [1.0.11] - 2025-09-10

### Added
- **CLI** - `han generate guard` command
- **CLI** - `han generate interceptor` command
- **CLI** - `han generate pipe` command
- **Docs** - Comprehensive documentation for all core features

### Fixed
- **CLI** - Fixed schematic file path resolution
- **Core** - Resolved metadata reflection issues

## [1.0.10] - 2025-09-05

### Added
- **Core** - Exception filters support
- **Core** - Global exception handling
- **CLI** - `han generate filter` command

### Changed
- **Core** - Improved error messages
- **HTTP** - Enhanced request/response handling

## [1.0.0] - 2025-08-01

### Added
- **Core** - Initial release of Han Framework
- **DI** - Dependency injection container
- **Router** - Express-based routing system
- **Decorators** - Core decorators (`@Module`, `@Controller`, `@Injectable`, etc.)
- **HTTP** - Request handlers (`@Get`, `@Post`, `@Put`, `@Delete`, etc.)
- **CLI** - `han new` command for project creation
- **Docs** - Basic documentation

---

## Release Types

### Major (x.0.0)
- Breaking changes
- Major new features
- Architecture changes

### Minor (0.x.0)
- New features (backward compatible)
- New CLI commands
- Significant enhancements

### Patch (0.0.x)
- Bug fixes
- Documentation updates
- Minor improvements

## Contributing

See our [Contributing Guide](./contributing.md) to learn how to propose changes and understand our release process.

## Support

- **Documentation**: [https://han-framework.dev](https://han-framework.dev)
- **Issues**: [GitHub Issues](https://github.com/sirkenedy/han/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sirkenedy/han/discussions)

[Unreleased]: https://github.com/sirkenedy/han/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/sirkenedy/han/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/sirkenedy/han/compare/v1.0.16...v1.1.0
[1.0.16]: https://github.com/sirkenedy/han/compare/v1.0.15...v1.0.16
[1.0.15]: https://github.com/sirkenedy/han/compare/v1.0.14...v1.0.15
[1.0.14]: https://github.com/sirkenedy/han/compare/v1.0.12...v1.0.14
[1.0.12]: https://github.com/sirkenedy/han/compare/v1.0.11...v1.0.12
[1.0.11]: https://github.com/sirkenedy/han/compare/v1.0.10...v1.0.11
[1.0.10]: https://github.com/sirkenedy/han/compare/v1.0.0...v1.0.10
[1.0.0]: https://github.com/sirkenedy/han/releases/tag/v1.0.0
