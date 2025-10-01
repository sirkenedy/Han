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