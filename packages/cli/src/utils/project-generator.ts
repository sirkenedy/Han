import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export class ProjectGenerator {
  async generateProject(projectPath: string, projectName: string, fastMode = false) {
    const startTime = Date.now();

    console.log(chalk.cyan('\n🚀 Creating Han Framework project...'));
    console.log(chalk.gray('━'.repeat(50)));

    // Create project directory
    console.log(chalk.blue('📁 Creating project directory...'));
    await fs.ensureDir(projectPath);
    console.log(chalk.green('✅ Project directory created'));

    // Generate package.json
    console.log(chalk.blue('📦 Generating package.json...'));
    await this.generatePackageJson(projectPath, projectName, fastMode);
    console.log(chalk.green('✅ package.json created'));

    // Generate TypeScript configuration
    console.log(chalk.blue('⚙️  Setting up TypeScript configuration...'));
    await this.generateTsConfig(projectPath);
    await this.generateTsBuildConfig(projectPath);
    console.log(chalk.green('✅ TypeScript config created'));

    // Generate development configuration
    if (!fastMode) {
      console.log(chalk.blue('🛠️  Configuring development tools...'));
      await this.generateDevConfig(projectPath);
      await this.generateLintConfig(projectPath);
      await this.generatePrettierConfig(projectPath);
      await this.generateJestConfig(projectPath);
      console.log(chalk.green('✅ Development tools configured'));
    }

    // Generate .gitignore
    console.log(chalk.blue('📋 Creating .gitignore...'));
    await this.generateGitIgnore(projectPath);
    console.log(chalk.green('✅ .gitignore created'));

    // Generate README.md
    console.log(chalk.blue('📖 Writing README documentation...'));
    await this.generateReadme(projectPath, projectName);
    console.log(chalk.green('✅ README.md created'));

    // Generate source structure
    console.log(chalk.blue('🏗️  Building source code structure...'));
    await this.generateSourceStructure(projectPath);
    console.log(chalk.green('✅ Source structure created'));

    // Generate environment files
    console.log(chalk.blue('🌍 Setting up environment configuration...'));
    await this.generateEnvFiles(projectPath);
    console.log(chalk.green('✅ Environment files created'));

    // Generate test structure
    if (!fastMode) {
      console.log(chalk.blue('🧪 Setting up Han Test framework...'));
      await this.generateTestStructure(projectPath);
      await this.generateTestRunner(projectPath);
      console.log(chalk.green('✅ Han Test framework configured'));
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(chalk.gray('━'.repeat(50)));
    console.log(chalk.green(`🎉 Project created successfully in ${duration}s!`));
    console.log(chalk.yellow('\nNext steps:'));
    console.log(chalk.white(`  cd ${projectName}`));
    console.log(chalk.white('  npm install'));
    console.log(chalk.white('  npm run dev'));
    console.log(chalk.cyan('\nHappy coding! 🚀\n'));
  }

  private async generatePackageJson(projectPath: string, projectName: string, fastMode = false) {
    const packageJson = {
      name: projectName,
      version: '0.0.1',
      description: `A Han Framework application`,
      main: 'dist/index.js',
      scripts: {
        'build': 'rimraf dist && tsc -p tsconfig.build.json',
        'start': 'node dist/index.js',
        'dev': 'nodemon',
        'start:prod': 'npm run build && npm start',
        'lint': 'eslint \\"{src,apps,libs,test}/**/*.ts\\" --fix',
        'format': 'prettier --write \\"src/**/*.ts\\" \\"test/**/*.ts\\"',
        'test': 'ts-node scripts/test-runner.ts',
        'test:watch': 'nodemon --exec \\"npm run test\\"',
        'test:e2e': 'ts-node scripts/test-runner.ts --e2e'
      },
      dependencies: {
        'han-prev-core': '^1.0.12',
        'han-prev-common': '^1.0.0',
        'reflect-metadata': '^0.1.13'
      },
      devDependencies: fastMode ? {
        '@types/node': '^20.10.0',
        'typescript': '^5.3.0',
        'han-prev-testing': '^1.0.0',
        'glob': '^10.3.0'
      } : {
        '@types/node': '^20.10.0',
        '@typescript-eslint/eslint-plugin': '^6.0.0',
        '@typescript-eslint/parser': '^6.0.0',
        'eslint': '^8.42.0',
        'eslint-config-prettier': '^9.0.0',
        'eslint-plugin-prettier': '^5.0.0',
        'glob': '^10.3.0',
        'han-prev-testing': '^1.0.0',
        'nodemon': '^3.0.0',
        'prettier': '^3.0.0',
        'rimraf': '^5.0.0',
        'ts-node': '^10.9.0',
        'tsconfig-paths': '^4.2.0',
        'typescript': '^5.3.0'
      },
      keywords: ['han-framework', 'nodejs', 'typescript'],
      author: '',
      license: 'UNLICENSED'
    };

    await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
  }

  private async generateTsConfig(projectPath: string) {
    const tsConfig = {
      compilerOptions: {
        module: 'commonjs',
        declaration: true,
        removeComments: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        allowSyntheticDefaultImports: true,
        target: 'ES2020',
        sourceMap: true,
        outDir: './dist',
        baseUrl: './',
        incremental: true,
        skipLibCheck: true,
        strictNullChecks: false,
        noImplicitAny: false,
        strictBindCallApply: false,
        forceConsistentCasingInFileNames: false,
        noFallthroughCasesInSwitch: false,
        paths: {
          '@/*': ['src/*']
        }
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };

    await fs.writeJson(path.join(projectPath, 'tsconfig.json'), tsConfig, { spaces: 2 });
  }

  private async generateGitIgnore(projectPath: string) {
    const gitIgnore = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Compiled binary addons
build/Release

# Dependency directories
node_modules/
jspm_packages/

# TypeScript compiled output
dist/
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs
*.log
`;

    await fs.writeFile(path.join(projectPath, '.gitignore'), gitIgnore);
  }

  private async generateReadme(projectPath: string, projectName: string) {
    const readme = `# ${projectName}

A Han Framework application.

## Description

This project was generated with [Han CLI](https://github.com/your-org/han-cli).

## Installation

\`\`\`bash
npm install
\`\`\`

## Running the app

\`\`\`bash
# development
npm run dev

# production mode
npm run start:prod
\`\`\`

## Test

\`\`\`bash
# unit tests
npm run test

# test coverage
npm run test:cov
\`\`\`

## API Endpoints

- \`GET /\` - Welcome message
- \`GET /health\` - Health check
- \`GET /users\` - Get all users
- \`GET /users/:id\` - Get user by ID
- \`POST /users\` - Create new user

## Stay in touch

- Framework - [Han Framework](https://github.com/your-org/han-framework)
- CLI - [Han CLI](https://github.com/your-org/han-cli)

## License

This project is [MIT licensed](LICENSE).
`;

    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  }

  private async generateSourceStructure(projectPath: string) {
    const srcPath = path.join(projectPath, 'src');

    // Create only src directory - no empty subdirectories
    await fs.ensureDir(srcPath);

    // Generate index.ts
    const indexTs = `import { HanFactory } from 'han-prev-core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HanFactory.create(AppModule);

  const port = process.env.PORT || 3000;
  await app.listen(port, () => {
    console.log(\`🚀 Application is running on port \${port}\`);
  });
}

bootstrap().catch(console.error);
`;

    await fs.writeFile(path.join(srcPath, 'index.ts'), indexTs);

    // Generate app.module.ts
    const appModuleTs = `import { Module } from 'han-prev-core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;

    await fs.writeFile(path.join(srcPath, 'app.module.ts'), appModuleTs);

    // Generate app.controller.ts
    const appControllerTs = `import { Controller, Get, Post, Body, Param } from 'han-prev-core';
import { AppService } from './app.service';

interface CreateUserDto {
  name: string;
  email: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('users')
  getUsers() {
    return this.appService.getUsers();
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.appService.getUserById(parseInt(id));
  }

  @Post('users')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.appService.createUser(createUserDto);
  }
}
`;

    await fs.writeFile(path.join(srcPath, 'app.controller.ts'), appControllerTs);

    // Generate app.service.ts
    const appServiceTs = `import { Injectable } from 'han-prev-core';

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

@Injectable()
export class AppService {
  private users: User[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      createdAt: new Date().toISOString(),
    },
  ];

  getHello() {
    return {
      message: 'Welcome to Han Framework! 🚀',
      framework: 'Han Framework',
      version: '1.0.0',
    };
  }

  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  getUsers() {
    return {
      data: this.users,
      count: this.users.length,
    };
  }

  getUserById(id: number) {
    const user = this.users.find(u => u.id === id);
    return user ? { data: user } : { error: 'User not found' };
  }

  createUser(userData: { name: string; email: string }) {
    const newUser: User = {
      id: Math.max(...this.users.map(u => u.id)) + 1,
      ...userData,
      createdAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    return {
      message: 'User created successfully',
      data: newUser,
    };
  }
}
`;

    await fs.writeFile(path.join(srcPath, 'app.service.ts'), appServiceTs);
  }

  private async generateEnvFiles(projectPath: string) {
    const envExample = `# Environment variables
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=

# Authentication
JWT_SECRET=your-secret-key

# Other configurations
API_PREFIX=api
`;

    await fs.writeFile(path.join(projectPath, '.env.example'), envExample);
  }

  private async generateTsBuildConfig(projectPath: string) {
    const tsBuildConfig = {
      extends: './tsconfig.json',
      compilerOptions: {
        removeComments: true,
        declaration: false,
        sourceMap: false
      },
      exclude: ['node_modules', 'test', 'dist', '**/*.test.ts']
    };

    await fs.writeJson(path.join(projectPath, 'tsconfig.build.json'), tsBuildConfig, { spaces: 2 });
  }

  private async generateDevConfig(projectPath: string) {
    const nodemonConfig = {
      watch: ['src'],
      ext: 'ts',
      ignore: ['src/**/*.test.ts'],
      exec: 'ts-node src/index.ts'
    };

    await fs.writeJson(path.join(projectPath, 'nodemon.json'), nodemonConfig, { spaces: 2 });
  }

  private async generateLintConfig(projectPath: string) {
    const eslintConfig = `module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    '@typescript-eslint/recommended',
    'prettier',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
`;

    await fs.writeFile(path.join(projectPath, '.eslintrc.js'), eslintConfig);
  }

  private async generatePrettierConfig(projectPath: string) {
    const prettierConfig = {
      singleQuote: true,
      trailingComma: 'all',
      tabWidth: 2,
      semi: true,
      printWidth: 100
    };

    await fs.writeJson(path.join(projectPath, '.prettierrc'), prettierConfig, { spaces: 2 });
  }

  private async generateJestConfig(projectPath: string) {
    // Han Framework uses its own testing framework - no Jest needed!
    // This creates a placeholder for compatibility
    const testConfig = {
      "name": "han-framework-tests",
      "description": "Han Framework uses its own revolutionary testing framework",
      "testCommand": "npm run test",
      "e2eCommand": "npm run test:e2e",
      "framework": "han-test"
    };

    await fs.writeJson(path.join(projectPath, 'test.config.json'), testConfig, { spaces: 2 });
  }

  private async generateTestStructure(projectPath: string) {
    const testPath = path.join(projectPath, 'test');
    await fs.ensureDir(testPath);

    // Generate unit test using Han Testing Framework with proper DI
    const appControllerSpec = `// 🧪 Han Framework Unit Testing with DI
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  suite, test, expect, beforeAll, afterAll, beforeEach,
  TestModule, runTests
} from 'han-prev-testing';

let testModule: TestModule;
let controller: AppController;
let service: AppService;

beforeAll(async () => {
  testModule = await TestModule.create(AppModule);
});

afterAll(async () => {
  await testModule.close();
});

suite('AppController', () => {
  beforeEach(() => {
    service = testModule.get(AppService);
    controller = testModule.get(AppController);
  });

  suite('getHello', () => {
    test('should return welcome message', () => {
      const result = controller.getHello();
      expect(result.message).toContain('Welcome to Han Framework');
      expect(result.framework).toBe('Han Framework');
      expect(result.version).toBeDefined();
    });
  });

  suite('getHealth', () => {
    test('should return health status', () => {
      const result = controller.getHealth();
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeGreaterThan(0);
    });
  });

  suite('getUsers', () => {
    test('should return user list', () => {
      const result = controller.getUsers();
      expect(result.data).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('name');
      expect(result.data[0]).toHaveProperty('email');
    });
  });

  suite('getUser', () => {
    test('should return specific user', () => {
      const result = controller.getUser('1');
      expect(result.data.id).toBe(1);
      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('john@example.com');
    });

    test('should handle missing user', () => {
      const result = controller.getUser('999');
      expect(result.error).toBe('User not found');
      expect(result.data).toBeUndefined();
    });
  });

  suite('createUser', () => {
    test('should create new user', () => {
      const newUser = { name: 'Alice Johnson', email: 'alice@example.com' };
      const result = controller.createUser(newUser);

      expect(result.message).toContain('created successfully');
      expect(result.data.name).toBe(newUser.name);
      expect(result.data.email).toBe(newUser.email);
      expect(result.data.id).toBeGreaterThan(2);
      expect(result.data.createdAt).toBeDefined();
    });
  });
});

// 🚀 Run unit tests if this file is executed directly
if (require.main === module) {
  runTests();
}
`;

    await fs.writeFile(path.join(projectPath, 'src/app.controller.spec.ts'), appControllerSpec);

    // Generate E2E test using Han Testing Framework with DI and proper typing
    const e2eTest = `// 🚀 Han Framework E2E Testing with DI
import { AppModule } from './../src/app.module';
import {
  suite, test, expect, beforeAll, afterAll,
  TestModule, HttpClient, runTests
} from 'han-prev-testing';

// Type definitions for API responses
interface HelloResponse {
  message: string;
  framework: string;
  version: string;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface UsersResponse {
  data: User[];
  count: number;
}

interface UserResponse {
  data: User;
}

interface CreateUserResponse {
  message: string;
  data: User & { createdAt: string };
}

let testModule: TestModule;
let httpClient: HttpClient;

beforeAll(async () => {
  testModule = await TestModule.create(AppModule);
  const server = await testModule.init();
  httpClient = new HttpClient(server.port);
});

afterAll(async () => {
  await testModule.close();
});

suite('AppController (e2e)', () => {
  test('/ (GET)', async () => {
    const response = await httpClient.get<HelloResponse>('/');
    expect(response.status).toBe(200);
    expect(response.data.message).toContain('Welcome to Han Framework');
    expect(response.data.framework).toBe('Han Framework');
  });

  test('/health (GET)', async () => {
    const response = await httpClient.get<HealthResponse>('/health');
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('healthy');
    expect(response.data.timestamp).toBeDefined();
  });

  test('/users (GET)', async () => {
    const response = await httpClient.get<UsersResponse>('/users');
    expect(response.status).toBe(200);
    expect(response.data.data).toHaveLength(2);
    expect(response.data.count).toBe(2);
  });

  test('/users/1 (GET)', async () => {
    const response = await httpClient.get<UserResponse>('/users/1');
    expect(response.status).toBe(200);
    expect(response.data.data.id).toBe(1);
    expect(response.data.data.name).toBe('John Doe');
  });

  test('/users (POST)', async () => {
    const newUser = { name: 'E2E User', email: 'e2e@test.com' };
    const response = await httpClient.post<CreateUserResponse>('/users', newUser);
    expect(response.status).toBe(200);
    expect(response.data.message).toContain('created successfully');
    expect(response.data.data.name).toBe(newUser.name);
  });

  suite('Advanced E2E Features', () => {
    test('should handle parallel requests', async () => {
      const responses = await Promise.all([
        httpClient.get<HelloResponse>('/'),
        httpClient.get<HealthResponse>('/health'),
        httpClient.get<UsersResponse>('/users')
      ]);

      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);
      expect(responses[2].status).toBe(200);
    });
  });
});

// 🚀 Run E2E tests if this file is executed directly
if (require.main === module) {
  runTests();
}
`;

    await fs.writeFile(path.join(testPath, 'app.e2e-spec.ts'), e2eTest);

    // No external testing dependencies required - Han Framework manages everything internally
    console.log('✨ Generated pure Han Framework test structure - zero external dependencies');
  }

  private async generateTestRunner(projectPath: string) {
    const scriptsPath = path.join(projectPath, 'scripts');
    await fs.ensureDir(scriptsPath);

    const testRunner = `#!/usr/bin/env ts-node
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const isE2E = process.argv.includes('--e2e');
const pattern = isE2E ? 'test/**/*.e2e-spec.ts' : 'src/**/*.spec.ts';

console.log(\`\\n🧪 Running \${isE2E ? 'E2E' : 'unit'} tests...\\n\`);

const startTime = Date.now();
let passedCount = 0;
let failedCount = 0;
const failedTests: string[] = [];

// Find all test files
const testFiles = glob.sync(pattern, {
  cwd: process.cwd(),
  absolute: true
});

if (testFiles.length === 0) {
  console.log('⚠️  No test files found matching pattern:', pattern);
  process.exit(0);
}

console.log(\`Found \${testFiles.length} test file(s)\\n\`);

// Run each test file
for (const testFile of testFiles) {
  const relativePath = path.relative(process.cwd(), testFile);

  try {
    // Capture output to suppress individual test summaries
    execSync(\`npx ts-node "\${testFile}"\`, {
      stdio: 'pipe',
      encoding: 'utf-8'
    });

    console.log(\`✅ \${relativePath}\`);
    passedCount++;
  } catch (error: any) {
    console.log(\`❌ \${relativePath}\`);
    if (error.stdout) {
      console.log(error.stdout.toString());
    }
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
    failedCount++;
    failedTests.push(relativePath);
  }
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);

// Print summary
console.log('\\n' + '═'.repeat(50));
console.log(\`\\n📊 Test Summary\\n\`);
console.log(\`  Total:  \${testFiles.length}\`);
console.log(\`  ✅ Passed: \${passedCount}\`);
console.log(\`  ❌ Failed: \${failedCount}\`);
console.log(\`  ⏱️  Duration: \${duration}s\\n\`);

if (failedCount > 0) {
  console.log('Failed tests:');
  failedTests.forEach(test => console.log(\`  - \${test}\`));
  console.log('');
  process.exit(1);
} else {
  console.log('🎉 All tests passed!\\n');
  process.exit(0);
}
`;

    await fs.writeFile(path.join(scriptsPath, 'test-runner.ts'), testRunner);
  }
}