# Contributing to Han Framework

Thank you for your interest in contributing to Han Framework! This guide will help you get started.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

### Our Standards

- **Be respectful** - Treat everyone with respect and kindness
- **Be collaborative** - Work together and help each other
- **Be constructive** - Provide helpful feedback
- **Be patient** - Remember everyone is learning

## How Can I Contribute?

### Reporting Bugs

Before creating a bug report:

1. **Check existing issues** - Your bug might already be reported
2. **Update to latest version** - The bug might already be fixed
3. **Verify it's a bug** - Make sure it's not a configuration issue

When creating a bug report, include:

- **Clear title** - Describe the issue concisely
- **Steps to reproduce** - Detailed steps to reproduce the bug
- **Expected behavior** - What you expected to happen
- **Actual behavior** - What actually happened
- **Environment details** - OS, Node version, Han Framework version
- **Code samples** - Minimal reproduction code if possible

**Bug Report Template:**

```markdown
## Bug Description
A clear description of the bug.

## Steps to Reproduce
1. Create a new Han app
2. Add the following code...
3. Run the application
4. See error

## Expected Behavior
Application should start successfully.

## Actual Behavior
Application crashes with error: ...

## Environment
- OS: macOS 14.0
- Node: v20.10.0
- Han Framework: v1.0.16
- npm: v10.2.0

## Additional Context
Any other context about the problem.
```

### Suggesting Enhancements

We love feature requests! Before suggesting:

1. **Check roadmap** - Feature might already be planned
2. **Search discussions** - Similar ideas might exist
3. **Consider scope** - Keep it focused and relevant

When suggesting an enhancement:

- **Use a clear title** - Describe the feature
- **Explain the use case** - Why is this needed?
- **Provide examples** - Show how it would work
- **Consider alternatives** - Mention other approaches

**Feature Request Template:**

```markdown
## Feature Description
A clear description of the feature.

## Use Case
Describe the problem this feature would solve.

## Proposed Solution
How you think this should work.

## Example Usage
```typescript
// Example code showing how the feature would be used
```

## Alternatives Considered
Other approaches you've thought about.

## Additional Context
Any other context or screenshots.
```

### Pull Requests

#### Before You Start

1. **Open an issue** - Discuss major changes first
2. **Check existing PRs** - Someone might be working on it
3. **Review guidelines** - Follow our coding standards

#### Development Setup

```bash
# Fork the repository
git clone https://github.com/your-username/han-framework.git
cd han-framework

# Install dependencies
npm install

# Create a new branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Run tests
npm test

# Run linter
npm run lint

# Build the project
npm run build
```

#### Making Changes

1. **Follow coding standards** - Use existing code as a guide
2. **Write tests** - Cover your changes with tests
3. **Update documentation** - Document new features
4. **Keep commits clean** - Write clear commit messages

#### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting)
- `refactor` - Code refactoring
- `test` - Test changes
- `chore` - Build process or auxiliary tool changes

**Examples:**

```
feat(core): add support for async guards

Implemented async guard execution to support database lookups
and external API calls in guard canActivate methods.

Closes #123
```

```
fix(router): resolve route parameter binding issue

Fixed bug where route parameters were not correctly bound
when using nested controllers.

Fixes #456
```

```
docs(readme): update installation instructions

Added detailed steps for Windows users and clarified
Node.js version requirements.
```

#### Pull Request Process

1. **Update your branch**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run checks**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

3. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create pull request**
   - Use a clear title
   - Describe your changes
   - Reference related issues
   - Add screenshots if applicable

5. **Respond to feedback**
   - Address review comments
   - Update your PR as needed
   - Be patient and respectful

**Pull Request Template:**

```markdown
## Description
What does this PR do?

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Changes Made
- Added async guard support
- Updated documentation
- Added tests

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
- [ ] No new warnings
```

## Development Guidelines

### Code Style

- **Use TypeScript** - Write type-safe code
- **Follow conventions** - Match existing code style
- **Use ESLint** - Run linter before committing
- **Format code** - Use Prettier for formatting

```typescript
// ✅ Good
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: LoggerService
  ) {}

  async findById(id: string): Promise<User> {
    this.logger.debug(`Finding user by ID: ${id}`);
    return await this.userRepository.findById(id);
  }
}

// ❌ Bad
export class UserService {
  constructor(private userRepository, private logger) {}

  async findById(id) {
    return await this.userRepository.findById(id)
  }
}
```

### Testing

- **Write tests** - Test new features and bug fixes
- **Test coverage** - Aim for high coverage
- **Test types** - Unit, integration, and e2e tests

```typescript
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

describe('UserService', () => {
  let service: UserService;
  let repository: UserRepository;

  beforeEach(() => {
    repository = new UserRepository();
    service = new UserService(repository);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const user = { id: '1', name: 'John' };
      jest.spyOn(repository, 'findById').mockResolvedValue(user);

      const result = await service.findById('1');

      expect(result).toEqual(user);
      expect(repository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw error when user not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow('User not found');
    });
  });
});
```

### Documentation

- **Update docs** - Document new features
- **Code comments** - Explain complex logic
- **Examples** - Provide usage examples
- **API docs** - Document public APIs

```typescript
/**
 * Service for managing user accounts.
 *
 * @example
 * ```typescript
 * const userService = new UserService(userRepository);
 * const user = await userService.findById('123');
 * ```
 */
@Injectable()
export class UserService {
  /**
   * Finds a user by their unique identifier.
   *
   * @param id - The user's unique identifier
   * @returns Promise resolving to the user
   * @throws {NotFoundException} When user is not found
   */
  async findById(id: string): Promise<User> {
    const user = await this.repository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
}
```

## Project Structure

```
han-framework/
├── packages/
│   ├── core/           # Core framework
│   ├── common/         # Common utilities
│   ├── testing/        # Testing utilities
│   └── cli/            # CLI tool
├── docs/               # Documentation
├── examples/           # Example applications
└── scripts/            # Build and dev scripts
```

## Community

### Getting Help

- **Documentation** - Check the [docs](https://han-framework.dev)
- **Discussions** - Ask questions in [GitHub Discussions](https://github.com/sirkenedy/han/discussions)
- **Discord** - Join our [Discord server](https://discord.gg/hanframework)
- **Twitter** - Follow [@hanframework](https://twitter.com/hanframework)

### Contributing Areas

- **Core Framework** - Enhance framework features
- **CLI** - Improve developer tools
- **Testing** - Add testing utilities
- **Documentation** - Improve docs
- **Examples** - Create example apps
- **Bug Fixes** - Fix reported issues

## Recognition

Contributors are recognized in:

- **Changelog** - Listed in release notes
- **Contributors** - Added to contributors list
- **Special Thanks** - Mentioned in releases

## Questions?

Feel free to:

- Open an issue for questions
- Join our Discord for discussions
- Reach out on Twitter

Thank you for contributing to Han Framework! 🚀

---

**Happy Coding!** ✨
