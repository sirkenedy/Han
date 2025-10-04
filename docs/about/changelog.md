# Changelog

All notable changes to the Han Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- WebSocket support
- GraphQL integration
- Advanced caching strategies
- Microservices support
- Enhanced testing utilities

## [1.0.16] - 2024-10-04

### Fixed
- **Router** - Fixed route path combination bug in router.factory.ts
- **Router** - Ensured all controller paths start with leading slash (/)
- **Modules** - Routes from imported modules now correctly register with Express
- **Controllers** - `@Controller('orders')` with `@Get()` now correctly creates `/orders` route

### Changed
- **Core** - Improved route registration logic
- **Modules** - Enhanced module import handling

## [1.0.15] - 2024-10-03

### Added
- **Testing** - Auto-run functionality for tests without requiring `runTests()` boilerplate
- **Testing** - Execution time display in italics after each test description
- **CLI** - Dynamic version reading from package.json
- **CLI** - Updated test templates to use han-prev-testing format

### Fixed
- **Testing** - Fixed double logging in test output - now shows only final result (pass/fail)

### Changed
- **CLI** - Updated all package dependencies to latest versions
- **CLI** - Fixed schematic-generator test templates for `generate resource` command

### Removed
- **CLI** - Removed unused resource.command.ts file (dead code cleanup)
- **Testing** - Removed `runTests()` import requirement from generated test files

## [1.0.14] - 2024-09-28

### Added
- **CLI** - Automatic module import functionality for generated resources
- **CLI** - New `updateAppModule()` method auto-adds modules to app.module.ts imports
- **CLI** - Supports `--skip-import` flag to disable auto-import when needed

### Changed
- **CLI** - Generated resources are now immediately accessible without manual imports
- **Core** - Improved module resolution and import handling

## [1.0.13] - 2024-09-20

### Added
- **Core** - Support for async module initialization
- **DI** - Circular dependency detection and warning system
- **Guards** - Enhanced ExecutionContext with additional metadata

### Fixed
- **Pipes** - Fixed validation pipe error handling
- **Interceptors** - Corrected response transformation order

### Changed
- **Core** - Optimized dependency injection container performance
- **Middleware** - Improved middleware execution chain

## [1.0.12] - 2024-09-15

### Added
- **Testing** - New comprehensive test matchers
  - `toBeInstanceOf` - Check instance type
  - `toBeGreaterThanOrEqual` - Numeric comparison
  - `toBeLessThanOrEqual` - Numeric comparison
  - `toBeCloseTo` - Float comparison with precision
  - `toContainEqual` - Deep equality check in arrays
  - `toMatchObject` - Partial object matching
  - `toHavePropertyValue` - Property value assertion
- **Testing** - Mock function helper with call tracking
- **CLI** - Move test runner from project scripts to package binary (`han-test` command)

### Changed
- **Testing** - Generated projects no longer need scripts folder for testing
- **Testing** - Improved test output formatting

## [1.0.11] - 2024-09-10

### Added
- **CLI** - `han generate guard` command
- **CLI** - `han generate interceptor` command
- **CLI** - `han generate pipe` command
- **Docs** - Comprehensive documentation for all core features

### Fixed
- **CLI** - Fixed schematic file path resolution
- **Core** - Resolved metadata reflection issues

## [1.0.10] - 2024-09-05

### Added
- **Core** - Exception filters support
- **Core** - Global exception handling
- **CLI** - `han generate filter` command

### Changed
- **Core** - Improved error messages
- **HTTP** - Enhanced request/response handling

## [1.0.9] - 2024-08-30

### Added
- **Core** - Interceptors support for request/response transformation
- **Core** - Global interceptors
- **CLI** - Project scaffolding improvements

### Fixed
- **Router** - Route parameter binding issues
- **DI** - Provider resolution in nested modules

## [1.0.8] - 2024-08-25

### Added
- **Core** - Pipes for data transformation and validation
- **Validation** - Built-in validation pipe
- **CLI** - Enhanced code generation templates

### Changed
- **Core** - Optimized request processing pipeline
- **Router** - Improved route matching performance

## [1.0.7] - 2024-08-20

### Added
- **Core** - Guards for route protection
- **Core** - Global guards support
- **CLI** - `han generate module` improvements

### Fixed
- **DI** - Singleton provider lifecycle issues
- **Modules** - Module re-export functionality

## [1.0.6] - 2024-08-15

### Added
- **Core** - Middleware support at module level
- **Core** - Global middleware configuration
- **CLI** - Better error messages

### Changed
- **Router** - Enhanced route registration
- **HTTP** - Improved request context handling

## [1.0.5] - 2024-08-10

### Added
- **CLI** - `han generate controller` command
- **CLI** - `han generate service` command
- **CLI** - `han generate resource` command
- **Docs** - Getting started guide

### Fixed
- **DI** - Provider initialization order
- **Router** - Nested route handling

## [1.0.0] - 2024-08-01

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
- **Twitter**: [@hanframework](https://twitter.com/hanframework)

[Unreleased]: https://github.com/sirkenedy/han/compare/v1.0.16...HEAD
[1.0.16]: https://github.com/sirkenedy/han/compare/v1.0.15...v1.0.16
[1.0.15]: https://github.com/sirkenedy/han/compare/v1.0.14...v1.0.15
[1.0.14]: https://github.com/sirkenedy/han/compare/v1.0.13...v1.0.14
[1.0.13]: https://github.com/sirkenedy/han/compare/v1.0.12...v1.0.13
[1.0.12]: https://github.com/sirkenedy/han/compare/v1.0.11...v1.0.12
[1.0.11]: https://github.com/sirkenedy/han/compare/v1.0.10...v1.0.11
[1.0.10]: https://github.com/sirkenedy/han/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/sirkenedy/han/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/sirkenedy/han/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/sirkenedy/han/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/sirkenedy/han/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/sirkenedy/han/compare/v1.0.0...v1.0.5
[1.0.0]: https://github.com/sirkenedy/han/releases/tag/v1.0.0
