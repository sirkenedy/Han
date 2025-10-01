import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';

export interface ResourceCommandOptions {
  dryRun: boolean;
  skipTests: boolean;
  crud: boolean;
}

export class ResourceCommand {
  async execute(name: string, options: ResourceCommandOptions) {
    const spinner = ora(`Generating ${name} resource...`).start();

    try {
      // Validate name
      if (!this.isValidName(name)) {
        spinner.fail(chalk.red('Invalid name. Use PascalCase or kebab-case (e.g., User or user)'));
        return;
      }

      // Check if we're in a Han project
      if (!await this.isHanProject()) {
        spinner.fail(chalk.red('Not in a Han Framework project directory'));
        return;
      }

      const className = this.toPascalCase(name);
      const fileName = this.toKebabCase(name);
      const variableName = this.toCamelCase(name);

      const files: string[] = [];

      if (options.dryRun) {
        spinner.text = 'Analyzing files (dry run)...';
        console.log(chalk.blue('\nDry run - Files that would be created:'));
        console.log(chalk.green(`  CREATE src/${fileName}/${fileName}.module.ts`));
        console.log(chalk.green(`  CREATE src/${fileName}/${fileName}.controller.ts`));
        console.log(chalk.green(`  CREATE src/${fileName}/${fileName}.service.ts`));
        if (!options.skipTests) {
          console.log(chalk.green(`  CREATE src/${fileName}/${fileName}.controller.spec.ts`));
          console.log(chalk.green(`  CREATE src/${fileName}/${fileName}.service.spec.ts`));
        }
        spinner.succeed(chalk.blue('Dry run completed'));
        return;
      }

      // Create resource directory
      const resourceDir = path.join(process.cwd(), 'src', fileName);
      await fs.ensureDir(resourceDir);

      // Generate module file
      const modulePath = path.join(resourceDir, `${fileName}.module.ts`);
      await fs.writeFile(modulePath, this.generateModuleTemplate(className, fileName));
      files.push(`src/${fileName}/${fileName}.module.ts`);

      // Generate controller file
      const controllerPath = path.join(resourceDir, `${fileName}.controller.ts`);
      await fs.writeFile(controllerPath, this.generateControllerTemplate(className, fileName, variableName, options.crud));
      files.push(`src/${fileName}/${fileName}.controller.ts`);

      // Generate service file
      const servicePath = path.join(resourceDir, `${fileName}.service.ts`);
      await fs.writeFile(servicePath, this.generateServiceTemplate(className, fileName, options.crud));
      files.push(`src/${fileName}/${fileName}.service.ts`);

      // Generate test files
      if (!options.skipTests) {
        const controllerSpecPath = path.join(resourceDir, `${fileName}.controller.spec.ts`);
        await fs.writeFile(controllerSpecPath, this.generateControllerSpecTemplate(className, fileName, variableName, options.crud));
        files.push(`src/${fileName}/${fileName}.controller.spec.ts`);

        const serviceSpecPath = path.join(resourceDir, `${fileName}.service.spec.ts`);
        await fs.writeFile(serviceSpecPath, this.generateServiceSpecTemplate(className, fileName, options.crud));
        files.push(`src/${fileName}/${fileName}.service.spec.ts`);
      }

      spinner.succeed(chalk.green(`Successfully generated ${className} resource`));

      console.log(chalk.white('\nCreated files:'));
      files.forEach(file => {
        console.log(chalk.green(`  CREATE ${file}`));
      });

      console.log(chalk.yellow('\n⚠️  Don\'t forget to import the module in your app.module.ts:'));
      console.log(chalk.gray(`  import { ${className}Module } from './${fileName}/${fileName}.module';`));
      console.log(chalk.gray(`  \n  @Module({\n    imports: [${className}Module],\n    ...\n  })`));

    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to generate ${name} resource: ${error.message}`));
      process.exit(1);
    }
  }

  private generateModuleTemplate(className: string, fileName: string): string {
    return `import { Module } from 'han-prev-core';
import { ${className}Controller } from './${fileName}.controller';
import { ${className}Service } from './${fileName}.service';

@Module({
  controllers: [${className}Controller],
  providers: [${className}Service],
  exports: [${className}Service]
})
export class ${className}Module {}
`;
  }

  private generateControllerTemplate(className: string, fileName: string, variableName: string, crud: boolean): string {
    if (crud) {
      return `import { Controller, Get, Post, Put, Delete, Body, Param } from 'han-prev-core';
import { ${className}Service } from './${fileName}.service';

export interface Create${className}Dto {
  name: string;
  description?: string;
}

export interface Update${className}Dto {
  name?: string;
  description?: string;
}

@Controller('${variableName}')
export class ${className}Controller {
  constructor(private readonly ${variableName}Service: ${className}Service) {}

  @Post()
  create(@Body() create${className}Dto: Create${className}Dto) {
    return this.${variableName}Service.create(create${className}Dto);
  }

  @Get()
  findAll() {
    return this.${variableName}Service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.${variableName}Service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() update${className}Dto: Update${className}Dto) {
    return this.${variableName}Service.update(id, update${className}Dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.${variableName}Service.remove(id);
  }
}
`;
    } else {
      return `import { Controller, Get } from 'han-prev-core';
import { ${className}Service } from './${fileName}.service';

@Controller('${variableName}')
export class ${className}Controller {
  constructor(private readonly ${variableName}Service: ${className}Service) {}

  @Get()
  findAll() {
    return this.${variableName}Service.findAll();
  }
}
`;
    }
  }

  private generateServiceTemplate(className: string, fileName: string, crud: boolean): string {
    if (crud) {
      return `import { Injectable } from 'han-prev-core';

export interface ${className} {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ${className}Service {
  private ${fileName}s: ${className}[] = [];
  private idCounter = 1;

  create(data: { name: string; description?: string }): ${className} {
    const new${className}: ${className} = {
      id: (this.idCounter++).toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.${fileName}s.push(new${className});
    return new${className};
  }

  findAll(): ${className}[] {
    return this.${fileName}s;
  }

  findOne(id: string): ${className} | null {
    return this.${fileName}s.find(item => item.id === id) || null;
  }

  update(id: string, data: { name?: string; description?: string }): ${className} | null {
    const ${fileName} = this.findOne(id);
    if (!${fileName}) {
      return null;
    }

    Object.assign(${fileName}, {
      ...data,
      updatedAt: new Date()
    });

    return ${fileName};
  }

  remove(id: string): boolean {
    const index = this.${fileName}s.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }

    this.${fileName}s.splice(index, 1);
    return true;
  }
}
`;
    } else {
      return `import { Injectable } from 'han-prev-core';

export interface ${className} {
  id: string;
  name: string;
  createdAt: Date;
}

@Injectable()
export class ${className}Service {
  private ${fileName}s: ${className}[] = [
    {
      id: '1',
      name: 'Sample ${className}',
      createdAt: new Date()
    }
  ];

  findAll(): ${className}[] {
    return this.${fileName}s;
  }
}
`;
    }
  }

  private generateControllerSpecTemplate(className: string, fileName: string, variableName: string, crud: boolean): string {
    if (crud) {
      return `import { ${className}Controller } from './${fileName}.controller';
import { ${className}Service } from './${fileName}.service';

// Simple test helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(\`Assertion failed: \${message}\`);
  }
}

function assertEquals(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(\`\${message}: expected \${expected}, got \${actual}\`);
  }
}

console.log('🧪 Running ${className}Controller tests...\\n');

// Test setup
const service = new ${className}Service();
const controller = new ${className}Controller(service);

// Test: create
try {
  const dto = { name: 'Test ${className}', description: 'Test description' };
  const result = controller.create(dto);

  assert(result !== undefined && result !== null, 'create should return a result');
  assert(result.id !== undefined, 'created item should have an id');
  assertEquals(result.name, dto.name, 'name should match');
  assertEquals(result.description, dto.description, 'description should match');

  console.log('✅ create() - should create a new ${fileName}');
} catch (error: any) {
  console.error('❌ create() - failed:', error.message);
  process.exit(1);
}

// Test: findAll
try {
  const result = controller.findAll();

  assert(Array.isArray(result), 'findAll should return an array');
  assert(result.length > 0, 'findAll should return items');

  console.log('✅ findAll() - should return an array of ${fileName}s');
} catch (error: any) {
  console.error('❌ findAll() - failed:', error.message);
  process.exit(1);
}

// Test: findOne
try {
  const created = service.create({ name: 'FindOne Test' });
  const result = controller.findOne(created.id);

  assert(result !== null, 'findOne should return a result');
  assertEquals(result?.id, created.id, 'id should match');

  console.log('✅ findOne() - should return a single ${fileName}');
} catch (error: any) {
  console.error('❌ findOne() - failed:', error.message);
  process.exit(1);
}

// Test: update
try {
  const created = service.create({ name: 'Original Name' });
  const result = controller.update(created.id, { name: 'Updated Name' });

  assert(result !== null, 'update should return a result');
  assertEquals(result?.name, 'Updated Name', 'name should be updated');

  console.log('✅ update() - should update a ${fileName}');
} catch (error: any) {
  console.error('❌ update() - failed:', error.message);
  process.exit(1);
}

// Test: remove
try {
  const created = service.create({ name: 'To Delete' });
  const result = controller.remove(created.id);

  assertEquals(result, true, 'remove should return true');
  assertEquals(service.findOne(created.id), null, 'item should be deleted');

  console.log('✅ remove() - should remove a ${fileName}');
} catch (error: any) {
  console.error('❌ remove() - failed:', error.message);
  process.exit(1);
}

console.log('\\n🎉 All ${className}Controller tests passed!');
`;
    } else {
      return `import { ${className}Controller } from './${fileName}.controller';
import { ${className}Service } from './${fileName}.service';

describe('${className}Controller', () => {
  let controller: ${className}Controller;
  let service: ${className}Service;

  beforeEach(() => {
    service = new ${className}Service();
    controller = new ${className}Controller(service);
  });

  describe('findAll', () => {
    it('should return an array of ${fileName}s', () => {
      const result = controller.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return items with correct structure', () => {
      const result = controller.findAll();
      const first = result[0];

      expect(first).toBeDefined();
      expect(first.id).toBeDefined();
      expect(first.name).toBeDefined();
      expect(first.createdAt).toBeDefined();
    });
  });
});

console.log('✅ All ${className}Controller tests passed!');
`;
    }
  }

  private generateServiceSpecTemplate(className: string, fileName: string, crud: boolean): string {
    if (crud) {
      return `import { ${className}Service } from './${fileName}.service';

describe('${className}Service', () => {
  let service: ${className}Service;

  beforeEach(() => {
    service = new ${className}Service();
  });

  describe('create', () => {
    it('should create a new ${fileName}', () => {
      const data = { name: 'Test ${className}', description: 'Test description' };
      const result = service.create(data);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(data.name);
      expect(result.description).toBe(data.description);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('should return empty array initially', () => {
      const result = service.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should return all ${fileName}s', () => {
      service.create({ name: 'Test 1' });
      service.create({ name: 'Test 2' });

      const result = service.findAll();
      expect(result.length).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return a ${fileName} by id', () => {
      const created = service.create({ name: 'Test ${className}' });
      const result = service.findOne(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
    });

    it('should return null for non-existent id', () => {
      const result = service.findOne('999');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a ${fileName}', () => {
      const created = service.create({ name: 'Original' });
      const updated = service.update(created.id, { name: 'Updated' });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated');
      expect(updated?.updatedAt).not.toBe(created.updatedAt);
    });

    it('should return null for non-existent id', () => {
      const result = service.update('999', { name: 'Updated' });
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove a ${fileName}', () => {
      const created = service.create({ name: 'Test ${className}' });
      const removed = service.remove(created.id);

      expect(removed).toBe(true);
      expect(service.findOne(created.id)).toBeNull();
    });

    it('should return false for non-existent id', () => {
      const result = service.remove('999');
      expect(result).toBe(false);
    });
  });
});

console.log('✅ All ${className}Service tests passed!');
`;
    } else {
      return `import { ${className}Service } from './${fileName}.service';

describe('${className}Service', () => {
  let service: ${className}Service;

  beforeEach(() => {
    service = new ${className}Service();
  });

  describe('findAll', () => {
    it('should return an array of ${fileName}s', () => {
      const result = service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return items with correct structure', () => {
      const result = service.findAll();
      const first = result[0];

      expect(first).toBeDefined();
      expect(first.id).toBeDefined();
      expect(first.name).toBeDefined();
      expect(first.createdAt).toBeInstanceOf(Date);
    });
  });
});

console.log('✅ All ${className}Service tests passed!');
`;
    }
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private isValidName(name: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(name) || /^[a-z][a-z0-9-]*$/.test(name);
  }

  private async isHanProject(): Promise<boolean> {
    const packageJsonPath = path.join(process.cwd(), 'package.json');

    if (!await fs.pathExists(packageJsonPath)) {
      return false;
    }

    try {
      const packageJson = await fs.readJson(packageJsonPath);
      return packageJson.dependencies?.['han-prev-core'] ||
             packageJson.devDependencies?.['han-prev-core'];
    } catch {
      return false;
    }
  }
}
