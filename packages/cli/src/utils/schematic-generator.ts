import * as fs from "fs-extra";
import * as path from "path";

export interface GenerateOptions {
  dryRun: boolean;
  skipImport: boolean;
  spec: boolean;
}

export class SchematicGenerator {
  async generateFiles(
    schematic: string,
    name: string,
    options: GenerateOptions,
    dryRun = false,
  ): Promise<string[]> {
    const createdFiles: string[] = [];

    switch (schematic) {
      case "controller":
        createdFiles.push(
          ...(await this.generateController(name, options, dryRun)),
        );
        break;
      case "service":
        createdFiles.push(
          ...(await this.generateService(name, options, dryRun)),
        );
        break;
      case "module":
        createdFiles.push(
          ...(await this.generateModule(name, options, dryRun)),
        );
        break;
      case "middleware":
        createdFiles.push(
          ...(await this.generateMiddleware(name, options, dryRun)),
        );
        break;
      case "interceptor":
        createdFiles.push(
          ...(await this.generateInterceptor(name, options, dryRun)),
        );
        break;
      case "guard":
        createdFiles.push(...(await this.generateGuard(name, options, dryRun)));
        break;
      case "decorator":
        createdFiles.push(
          ...(await this.generateDecorator(name, options, dryRun)),
        );
        break;
      case "interface":
        createdFiles.push(
          ...(await this.generateInterface(name, options, dryRun)),
        );
        break;
      case "class":
        createdFiles.push(...(await this.generateClass(name, options, dryRun)));
        break;
      case "resource":
        createdFiles.push(
          ...(await this.generateResource(name, options, dryRun)),
        );
        break;
      default:
        throw new Error(`Unknown schematic: ${schematic}`);
    }

    return createdFiles;
  }

  private async generateController(
    name: string,
    options: GenerateOptions,
    dryRun = false,
  ): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(
      process.cwd(),
      "src",
      "controllers",
      `${fileName}.controller.ts`,
    );

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
      const specPath = path.join(
        process.cwd(),
        "src",
        "controllers",
        `${fileName}.controller.spec.ts`,
      );
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

  private async generateService(
    name: string,
    options: GenerateOptions,
    dryRun = false,
  ): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(
      process.cwd(),
      "src",
      "services",
      `${fileName}.service.ts`,
    );

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
      const specPath = path.join(
        process.cwd(),
        "src",
        "services",
        `${fileName}.service.spec.ts`,
      );
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

  private async generateModule(
    name: string,
    options: GenerateOptions,
    dryRun = false,
  ): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(
      process.cwd(),
      "src",
      "modules",
      `${fileName}.module.ts`,
    );

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

  private async generateMiddleware(
    name: string,
    options: GenerateOptions,
    dryRun = false,
  ): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(
      process.cwd(),
      "src",
      "middleware",
      `${fileName}.middleware.ts`,
    );

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

  private async generateInterceptor(
    name: string,
    options: GenerateOptions,
    dryRun = false,
  ): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(
      process.cwd(),
      "src",
      "interceptors",
      `${fileName}.interceptor.ts`,
    );

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

  private async generateGuard(
    name: string,
    options: GenerateOptions,
    dryRun = false,
  ): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(
      process.cwd(),
      "src",
      "guards",
      `${fileName}.guard.ts`,
    );

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

  private async generateDecorator(
    name: string,
    options: GenerateOptions,
    dryRun = false,
  ): Promise<string[]> {
    const functionName = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(
      process.cwd(),
      "src",
      "decorators",
      `${fileName}.decorator.ts`,
    );

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

  private async generateInterface(
    name: string,
    options: GenerateOptions,
    dryRun = false,
  ): Promise<string[]> {
    const interfaceName = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(
      process.cwd(),
      "src",
      "interfaces",
      `${fileName}.interface.ts`,
    );

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

  private async generateClass(
    name: string,
    options: GenerateOptions,
    dryRun = false,
  ): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const filePath = path.join(
      process.cwd(),
      "src",
      "classes",
      `${fileName}.class.ts`,
    );

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

  private async generateResource(
    name: string,
    options: GenerateOptions,
    dryRun = false,
  ): Promise<string[]> {
    const className = this.toPascalCase(name);
    const fileName = this.toKebabCase(name);
    const variableName = name.toLowerCase();
    const files: string[] = [];

    // Generate module
    const modulePath = path.join(
      process.cwd(),
      "src",
      `${fileName}`,
      `${fileName}.module.ts`,
    );
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
    const controllerPath = path.join(
      process.cwd(),
      "src",
      `${fileName}`,
      `${fileName}.controller.ts`,
    );
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
    const servicePath = path.join(
      process.cwd(),
      "src",
      `${fileName}`,
      `${fileName}.service.ts`,
    );
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
      const controllerSpecPath = path.join(
        process.cwd(),
        "src",
        `${fileName}`,
        `${fileName}.controller.spec.ts`,
      );
      const controllerSpecContent = `// 🧪 Han Framework Unit Testing with DI
import { ${className}Controller } from './${fileName}.controller';
import { ${className}Service } from './${fileName}.service';
import {
  suite, test, expect, beforeEach
} from 'han-prev-testing';

let controller: ${className}Controller;
let service: ${className}Service;

suite('${className}Controller', () => {
  beforeEach(() => {
    service = new ${className}Service();
    controller = new ${className}Controller(service);
  });

  suite('create', () => {
    test('should create a new ${fileName}', () => {
      const dto = { name: 'Test ${className}', description: 'Test description' };
      const result = controller.create(dto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(dto.name);
      expect(result.description).toBe(dto.description);
    });
  });

  suite('findAll', () => {
    test('should return an array of ${fileName}s', () => {
      controller.create({ name: 'Test 1', description: 'Test' });
      const result = controller.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  suite('findOne', () => {
    test('should return a single ${fileName}', () => {
      const created = controller.create({ name: 'FindOne Test', description: 'Test' });
      const result = controller.findOne(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
    });

    test('should return undefined for non-existent id', () => {
      const result = controller.findOne('999');
      expect(result).toBeUndefined();
    });
  });

  suite('update', () => {
    test('should update a ${fileName}', () => {
      const created = controller.create({ name: 'Original Name', description: 'Test' });
      const result = controller.update(created.id, { name: 'Updated Name' });

      expect(result).toBeDefined();
      expect(result?.name).toBe('Updated Name');
    });

    test('should return undefined for non-existent id', () => {
      const result = controller.update('999', { name: 'Updated' });
      expect(result).toBeUndefined();
    });
  });

  suite('remove', () => {
    test('should remove a ${fileName}', () => {
      const created = controller.create({ name: 'To Delete', description: 'Test' });
      const result = controller.remove(created.id);

      expect(result).toBe(true);
      expect(service.findOne(created.id)).toBeUndefined();
    });

    test('should return false for non-existent id', () => {
      const result = controller.remove('999');
      expect(result).toBe(false);
    });
  });
});
`;

      const serviceSpecPath = path.join(
        process.cwd(),
        "src",
        `${fileName}`,
        `${fileName}.service.spec.ts`,
      );
      const serviceSpecContent = `// 🧪 Han Framework Unit Testing with DI
import { ${className}Service } from './${fileName}.service';
import {
  suite, test, expect, beforeEach
} from 'han-prev-testing';

let service: ${className}Service;

suite('${className}Service', () => {
  beforeEach(() => {
    service = new ${className}Service();
  });

  suite('create', () => {
    test('should create a new ${fileName}', () => {
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

  suite('findAll', () => {
    test('should return empty array initially', () => {
      const result = service.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('should return all ${fileName}s', () => {
      service.create({ name: 'Test 1', description: 'Test' });
      service.create({ name: 'Test 2', description: 'Test' });

      const result = service.findAll();
      expect(result.length).toBe(2);
    });
  });

  suite('findOne', () => {
    test('should return a ${fileName} by id', () => {
      const created = service.create({ name: 'Test ${className}', description: 'Test' });
      const result = service.findOne(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
    });

    test('should return undefined for non-existent id', () => {
      const result = service.findOne('999');
      expect(result).toBeUndefined();
    });
  });

  suite('update', () => {
    test('should update a ${fileName}', () => {
      const created = service.create({ name: 'Original', description: 'Test' });
      const updated = service.update(created.id, { name: 'Updated' });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated');
    });

    test('should return undefined for non-existent id', () => {
      const result = service.update('999', { name: 'Updated' });
      expect(result).toBeUndefined();
    });
  });

  suite('remove', () => {
    test('should remove a ${fileName}', () => {
      const created = service.create({ name: 'Test ${className}', description: 'Test' });
      const removed = service.remove(created.id);

      expect(removed).toBe(true);
      expect(service.findOne(created.id)).toBeUndefined();
    });

    test('should return false for non-existent id', () => {
      const result = service.remove('999');
      expect(result).toBe(false);
    });
  });
});
`;

      files.push(controllerSpecPath, serviceSpecPath);

      if (!dryRun) {
        await fs.writeFile(controllerSpecPath, controllerSpecContent);
        await fs.writeFile(serviceSpecPath, serviceSpecContent);
      }
    }

    // Update app.module.ts to import the new module (unless skip-import is set)
    if (!options.skipImport && !dryRun) {
      await this.updateAppModule(className, fileName);
    }

    return files;
  }

  private async updateAppModule(className: string, fileName: string): Promise<void> {
    const appModulePath = path.join(process.cwd(), 'src', 'app.module.ts');

    if (!fs.existsSync(appModulePath)) {
      console.log('⚠️  app.module.ts not found. Skipping auto-import.');
      return;
    }

    let appModuleContent = await fs.readFile(appModulePath, 'utf-8');

    // Add import statement
    const importStatement = `import { ${className}Module } from './${fileName}/${fileName}.module';`;

    // Check if import already exists
    if (appModuleContent.includes(importStatement)) {
      return;
    }

    // Find the last import statement
    const importLines = appModuleContent.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }

    // Insert new import after the last import
    if (lastImportIndex !== -1) {
      importLines.splice(lastImportIndex + 1, 0, importStatement);
      appModuleContent = importLines.join('\n');
    }

    // Add module to imports array
    const moduleImportRegex = /(@Module\s*\(\s*\{[^}]*imports:\s*\[)([^\]]*)/s;
    const match = appModuleContent.match(moduleImportRegex);

    if (match) {
      const currentImports = match[2].trim();
      const newImports = currentImports
        ? `${currentImports}, ${className}Module`
        : className + 'Module';

      appModuleContent = appModuleContent.replace(
        moduleImportRegex,
        `$1${newImports}`
      );
    } else {
      // If imports array doesn't exist, add it
      appModuleContent = appModuleContent.replace(
        /@Module\s*\(\s*\{/,
        `@Module({\n  imports: [${className}Module],`
      );
    }

    await fs.writeFile(appModulePath, appModuleContent);
    console.log(`✅ Updated app.module.ts with ${className}Module`);
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => word.toUpperCase())
      .replace(/\s+/g, "")
      .replace(/-/g, "");
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, "$1-$2")
      .toLowerCase()
      .replace(/\s+/g, "-");
  }
}
