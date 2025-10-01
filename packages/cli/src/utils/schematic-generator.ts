import * as fs from 'fs-extra';
import * as path from 'path';

export interface GenerateOptions {
  dryRun: boolean;
  skipImport: boolean;
  spec: boolean;
}

export class SchematicGenerator {
  async generateFiles(schematic: string, name: string, options: GenerateOptions, dryRun = false): Promise<string[]> {
    const createdFiles: string[] = [];

    switch (schematic) {
      case 'controller':
        createdFiles.push(...await this.generateController(name, options, dryRun));
        break;
      case 'service':
        createdFiles.push(...await this.generateService(name, options, dryRun));
        break;
      case 'module':
        createdFiles.push(...await this.generateModule(name, options, dryRun));
        break;
      case 'middleware':
        createdFiles.push(...await this.generateMiddleware(name, options, dryRun));
        break;
      case 'interceptor':
        createdFiles.push(...await this.generateInterceptor(name, options, dryRun));
        break;
      case 'guard':
        createdFiles.push(...await this.generateGuard(name, options, dryRun));
        break;
      case 'decorator':
        createdFiles.push(...await this.generateDecorator(name, options, dryRun));
        break;
      case 'interface':
        createdFiles.push(...await this.generateInterface(name, options, dryRun));
        break;
      case 'class':
        createdFiles.push(...await this.generateClass(name, options, dryRun));
        break;
      case 'resource':
        createdFiles.push(...await this.generateResource(name, options, dryRun));
        break;
      default:
        throw new Error(`Unknown schematic: ${schematic}`);
    }

    return createdFiles;
  }

  private async generateController(name: string, options: GenerateOptions, dryRun = false): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(process.cwd(), 'src', 'controllers', `${fileName}.controller.ts`);

    const content = `import { Controller, Get, Post, Put, Delete, Body, Param, Query } from 'han-prev-core';

@Controller('${this.toKebabCase(name)}')
export class ${className}Controller {
  @Get()
  findAll(@Query() query: any) {
    return { message: 'This action returns all ${name.toLowerCase()}' };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { message: \`This action returns a #\${id} ${name.toLowerCase()}\` };
  }

  @Post()
  create(@Body() create${className}Dto: any) {
    return { message: 'This action adds a new ${name.toLowerCase()}' };
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() update${className}Dto: any) {
    return { message: \`This action updates a #\${id} ${name.toLowerCase()}\` };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return { message: \`This action removes a #\${id} ${name.toLowerCase()}\` };
  }
}
`;

    const files = [filePath];

    if (options.spec) {
      const specPath = path.join(process.cwd(), 'src', 'controllers', `${fileName}.controller.spec.ts`);
      const specContent = `import { ${className}Controller } from './${fileName}.controller';

describe('${className}Controller', () => {
  let controller: ${className}Controller;

  beforeEach(async () => {
    controller = new ${className}Controller();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
`;
      files.push(specPath);

      if (!dryRun) {
        await fs.ensureDir(path.dirname(specPath));
        await fs.writeFile(specPath, specContent);
      }
    }

    if (!dryRun) {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content);
    }

    return files;
  }

  private async generateService(name: string, options: GenerateOptions, dryRun = false): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(process.cwd(), 'src', 'services', `${fileName}.service.ts`);

    const content = `import { Injectable } from 'han-prev-core';

@Injectable()
export class ${className}Service {
  findAll() {
    return \`This action returns all ${name.toLowerCase()}\`;
  }

  findOne(id: number) {
    return \`This action returns a #\${id} ${name.toLowerCase()}\`;
  }

  create(create${className}Dto: any) {
    return 'This action adds a new ${name.toLowerCase()}';
  }

  update(id: number, update${className}Dto: any) {
    return \`This action updates a #\${id} ${name.toLowerCase()}\`;
  }

  remove(id: number) {
    return \`This action removes a #\${id} ${name.toLowerCase()}\`;
  }
}
`;

    const files = [filePath];

    if (options.spec) {
      const specPath = path.join(process.cwd(), 'src', 'services', `${fileName}.service.spec.ts`);
      const specContent = `import { ${className}Service } from './${fileName}.service';

describe('${className}Service', () => {
  let service: ${className}Service;

  beforeEach(async () => {
    service = new ${className}Service();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
`;
      files.push(specPath);

      if (!dryRun) {
        await fs.ensureDir(path.dirname(specPath));
        await fs.writeFile(specPath, specContent);
      }
    }

    if (!dryRun) {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content);
    }

    return files;
  }

  private async generateModule(name: string, options: GenerateOptions, dryRun = false): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(process.cwd(), 'src', 'modules', `${fileName}.module.ts`);

    const content = `import { Module } from 'han-prev-core';

@Module({
  controllers: [],
  providers: [],
})
export class ${className}Module {}
`;

    if (!dryRun) {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content);
    }

    return [filePath];
  }

  private async generateMiddleware(name: string, options: GenerateOptions, dryRun = false): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(process.cwd(), 'src', 'middleware', `${fileName}.middleware.ts`);

    const content = `import { Injectable } from 'han-prev-core';
import { HanMiddleware, MiddlewareFunction } from 'han-prev-common';

@Injectable()
export class ${className}Middleware implements HanMiddleware {
  use(): MiddlewareFunction {
    return (req: any, res: any, next: any) => {
      console.log('${className} middleware executing...');
      next();
    };
  }
}
`;

    if (!dryRun) {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content);
    }

    return [filePath];
  }

  private async generateInterceptor(name: string, options: GenerateOptions, dryRun = false): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(process.cwd(), 'src', 'interceptors', `${fileName}.interceptor.ts`);

    const content = `import { Injectable } from 'han-prev-core';
import { HanInterceptor, ExecutionContext } from 'han-prev-common';

@Injectable()
export class ${className}Interceptor implements HanInterceptor {
  intercept(context: ExecutionContext, next: any): any {
    console.log('Before...');

    const now = Date.now();
    return next.handle().pipe(
      tap(() => console.log(\`After... \${Date.now() - now}ms\`)),
    );
  }
}
`;

    if (!dryRun) {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content);
    }

    return [filePath];
  }

  private async generateGuard(name: string, options: GenerateOptions, dryRun = false): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(process.cwd(), 'src', 'guards', `${fileName}.guard.ts`);

    const content = `import { Injectable } from 'han-prev-core';
import { CanActivate, ExecutionContext } from 'han-prev-common';

@Injectable()
export class ${className}Guard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    // Add your guard logic here
    return true;
  }
}
`;

    if (!dryRun) {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content);
    }

    return [filePath];
  }

  private async generateDecorator(name: string, options: GenerateOptions, dryRun = false): Promise<string[]> {
    const functionName = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(process.cwd(), 'src', 'decorators', `${fileName}.decorator.ts`);

    const content = `import { createDecorator } from 'han-prev-core';

export const ${functionName} = createDecorator('${functionName.toLowerCase()}');

// Usage example:
// @${functionName}()
// export class ExampleClass {}
`;

    if (!dryRun) {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content);
    }

    return [filePath];
  }

  private async generateInterface(name: string, options: GenerateOptions, dryRun = false): Promise<string[]> {
    const interfaceName = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(process.cwd(), 'src', 'interfaces', `${fileName}.interface.ts`);

    const content = `export interface ${interfaceName} {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
`;

    if (!dryRun) {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content);
    }

    return [filePath];
  }

  private async generateClass(name: string, options: GenerateOptions, dryRun = false): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(process.cwd(), 'src', 'classes', `${fileName}.class.ts`);

    const content = `export class ${className} {
  constructor() {
    // Constructor logic here
  }

  // Add your methods here
}
`;

    if (!dryRun) {
      await fs.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content);
    }

    return [filePath];
  }

  private async generateResource(name: string, options: GenerateOptions, dryRun = false): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const variableName = name.toLowerCase();
    const files: string[] = [];

    // Generate module
    const modulePath = path.join(process.cwd(), 'src', `${fileName}`, `${fileName}.module.ts`);
    const moduleContent = `import { Module } from 'han-prev-core';
import { ${className}Controller } from './${fileName}.controller';
import { ${className}Service } from './${fileName}.service';

@Module({
  controllers: [${className}Controller],
  providers: [${className}Service],
  exports: [${className}Service]
})
export class ${className}Module {}
`;

    // Generate controller
    const controllerPath = path.join(process.cwd(), 'src', `${fileName}`, `${fileName}.controller.ts`);
    const controllerContent = `import { Controller, Get, Post, Put, Delete, Body, Param } from 'han-prev-core';
import { ${className}Service } from './${fileName}.service';

export interface Create${className}Dto {
  name: string;
  description: string;
}

export interface Update${className}Dto {
  name?: string;
  description?: string;
}

@Controller('${fileName}')
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

    // Generate service
    const servicePath = path.join(process.cwd(), 'src', `${fileName}`, `${fileName}.service.ts`);
    const serviceContent = `import { Injectable } from 'han-prev-core';

export interface ${className}Entity {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ${className}Service {
  private ${variableName}s: ${className}Entity[] = [];
  private idCounter = 1;

  create(create${className}Dto: any): ${className}Entity {
    const ${variableName}: ${className}Entity = {
      id: (this.idCounter++).toString(),
      ...create${className}Dto,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.${variableName}s.push(${variableName});
    return ${variableName};
  }

  findAll(): ${className}Entity[] {
    return this.${variableName}s;
  }

  findOne(id: string): ${className}Entity | undefined {
    return this.${variableName}s.find(item => item.id === id);
  }

  update(id: string, update${className}Dto: any): ${className}Entity | undefined {
    const index = this.${variableName}s.findIndex(item => item.id === id);
    if (index !== -1) {
      this.${variableName}s[index] = {
        ...this.${variableName}s[index],
        ...update${className}Dto,
        updatedAt: new Date()
      };
      return this.${variableName}s[index];
    }
    return undefined;
  }

  remove(id: string): boolean {
    const index = this.${variableName}s.findIndex(item => item.id === id);
    if (index !== -1) {
      this.${variableName}s.splice(index, 1);
      return true;
    }
    return false;
  }
}
`;

    files.push(modulePath, controllerPath, servicePath);

    if (!dryRun) {
      await fs.ensureDir(path.dirname(modulePath));
      await fs.writeFile(modulePath, moduleContent);
      await fs.writeFile(controllerPath, controllerContent);
      await fs.writeFile(servicePath, serviceContent);
    }

    // Generate test files if spec option is true
    if (options.spec) {
      const controllerSpecPath = path.join(process.cwd(), 'src', `${fileName}`, `${fileName}.controller.spec.ts`);
      const controllerSpecContent = `import { ${className}Controller } from './${fileName}.controller';
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

const service = new ${className}Service();
const controller = new ${className}Controller(service);

// Test: create
try {
  const dto = { name: 'Test ${className}', description: 'Test description' };
  const result = controller.create(dto);

  assert(result !== undefined && result !== null, 'create should return a result');
  assert(result.id !== undefined, 'created item should have an id');
  assertEquals(result.name, dto.name, 'name should match');

  console.log('✅ create() - should create a new ${fileName}');
} catch (error: any) {
  console.error('❌ create() - failed:', error.message);
  process.exit(1);
}

// Test: findAll
try {
  const result = controller.findAll();

  assert(Array.isArray(result), 'findAll should return an array');
  assert(result.length === 1, 'should have one item');

  console.log('✅ findAll() - should return all ${fileName}s');
} catch (error: any) {
  console.error('❌ findAll() - failed:', error.message);
  process.exit(1);
}

// Test: findOne
try {
  const result = controller.findOne('1');

  assert(result !== undefined, 'findOne should return an item');
  assertEquals(result?.id, '1', 'id should match');

  console.log('✅ findOne() - should return a ${fileName} by id');
} catch (error: any) {
  console.error('❌ findOne() - failed:', error.message);
  process.exit(1);
}

// Test: update
try {
  const dto = { name: 'Updated ${className}' };
  const result = controller.update('1', dto);

  assert(result !== undefined, 'update should return a result');
  assertEquals(result?.name, dto.name, 'name should be updated');

  console.log('✅ update() - should update a ${fileName}');
} catch (error: any) {
  console.error('❌ update() - failed:', error.message);
  process.exit(1);
}

// Test: remove
try {
  const result = controller.remove('1');

  assert(result === true, 'remove should return true');
  assertEquals(controller.findAll().length, 0, 'should have no items after removal');

  console.log('✅ remove() - should remove a ${fileName}');
} catch (error: any) {
  console.error('❌ remove() - failed:', error.message);
  process.exit(1);
}

console.log('\\n🎉 All ${className}Controller tests passed!');
`;

      const serviceSpecPath = path.join(process.cwd(), 'src', `${fileName}`, `${fileName}.service.spec.ts`);
      const serviceSpecContent = `import { ${className}Service } from './${fileName}.service';

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

console.log('🧪 Running ${className}Service tests...\\n');

const service = new ${className}Service();

// Test: create
try {
  const dto = { name: 'Test ${className}', description: 'Test description' };
  const result = service.create(dto);

  assert(result !== undefined && result !== null, 'create should return a result');
  assert(result.id !== undefined, 'created item should have an id');
  assertEquals(result.name, dto.name, 'name should match');

  console.log('✅ create() - should create a new ${fileName}');
} catch (error: any) {
  console.error('❌ create() - failed:', error.message);
  process.exit(1);
}

// Test: findAll
try {
  const result = service.findAll();

  assert(Array.isArray(result), 'findAll should return an array');
  assert(result.length === 1, 'should have one item');

  console.log('✅ findAll() - should return all ${fileName}s');
} catch (error: any) {
  console.error('❌ findAll() - failed:', error.message);
  process.exit(1);
}

// Test: findOne
try {
  const result = service.findOne('1');

  assert(result !== undefined, 'findOne should return an item');
  assertEquals(result?.id, '1', 'id should match');

  console.log('✅ findOne() - should return a ${fileName} by id');
} catch (error: any) {
  console.error('❌ findOne() - failed:', error.message);
  process.exit(1);
}

// Test: update
try {
  const dto = { name: 'Updated ${className}' };
  const result = service.update('1', dto);

  assert(result !== undefined, 'update should return a result');
  assertEquals(result?.name, dto.name, 'name should be updated');

  console.log('✅ update() - should update a ${fileName}');
} catch (error: any) {
  console.error('❌ update() - failed:', error.message);
  process.exit(1);
}

// Test: remove
try {
  const result = service.remove('1');

  assert(result === true, 'remove should return true');
  assertEquals(service.findAll().length, 0, 'should have no items after removal');

  console.log('✅ remove() - should remove a ${fileName}');
} catch (error: any) {
  console.error('❌ remove() - failed:', error.message);
  process.exit(1);
}

console.log('\\n🎉 All ${className}Service tests passed!');
`;

      files.push(controllerSpecPath, serviceSpecPath);

      if (!dryRun) {
        await fs.writeFile(controllerSpecPath, controllerSpecContent);
        await fs.writeFile(serviceSpecPath, serviceSpecContent);
      }
    }

    return files;
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => word.toUpperCase())
      .replace(/\s+/g, '')
      .replace(/-/g, '');
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase()
      .replace(/\s+/g, '-');
  }
}