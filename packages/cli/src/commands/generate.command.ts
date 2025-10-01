import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { SchematicGenerator } from '../utils/schematic-generator';

export interface GenerateCommandOptions {
  dryRun: boolean;
  skipImport: boolean;
  spec: boolean;
}

export class GenerateCommand {
  private supportedSchematics = [
    'controller', 'c',
    'service', 's',
    'module', 'm',
    'middleware', 'mi',
    'interceptor', 'i',
    'guard', 'g',
    'decorator', 'd',
    'interface', 'if',
    'class', 'cl'
  ];

  async execute(schematic: string, name: string, options: GenerateCommandOptions) {
    const spinner = ora(`Generating ${schematic}...`).start();

    try {
      // Validate schematic type
      if (!this.supportedSchematics.includes(schematic)) {
        spinner.fail(chalk.red(`Unknown schematic: ${schematic}`));
        this.showAvailableSchematics();
        return;
      }

      // Validate name
      if (!this.isValidName(name)) {
        spinner.fail(chalk.red('Invalid name. Use PascalCase (e.g., UserController)'));
        return;
      }

      // Check if we're in a Han project
      if (!await this.isHanProject()) {
        spinner.fail(chalk.red('Not in a Han Framework project directory'));
        return;
      }

      const generator = new SchematicGenerator();
      const normalizedSchematic = this.normalizeSchematic(schematic);

      if (options.dryRun) {
        spinner.text = 'Analyzing files (dry run)...';
        const filesToCreate = await generator.generateFiles(normalizedSchematic, name, options, true);
        spinner.succeed(chalk.blue('Dry run completed'));

        console.log(chalk.white('\nFiles that would be created:'));
        filesToCreate.forEach(file => {
          console.log(chalk.green(`  CREATE ${file}`));
        });
        return;
      }

      const createdFiles = await generator.generateFiles(normalizedSchematic, name, options);

      spinner.succeed(chalk.green(`Successfully generated ${normalizedSchematic}`));

      console.log(chalk.white('\nCreated files:'));
      createdFiles.forEach(file => {
        console.log(chalk.green(`  CREATE ${file}`));
      });

    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to generate ${schematic}: ${error.message}`));
      process.exit(1);
    }
  }

  private normalizeSchematic(schematic: string): string {
    const schematicMap = {
      'c': 'controller',
      's': 'service',
      'm': 'module',
      'mi': 'middleware',
      'i': 'interceptor',
      'g': 'guard',
      'd': 'decorator',
      'if': 'interface',
      'cl': 'class'
    };

    return (schematicMap as any)[schematic] || schematic;
  }

  private isValidName(name: string): boolean {
    // Check if name is in PascalCase or kebab-case
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
             packageJson.devDependencies?.['han-prev-core'] ||
             packageJson.dependencies?.['@han-prev/core'] ||
             packageJson.devDependencies?.['@han-prev/core'] ||
             packageJson.dependencies?.['han-framework'] ||
             packageJson.devDependencies?.['han-framework'];
    } catch {
      return false;
    }
  }

  private showAvailableSchematics() {
    console.log(chalk.white('\nAvailable schematics:'));
    console.log(chalk.gray('  controller (c)    - Generate a controller'));
    console.log(chalk.gray('  service (s)       - Generate a service'));
    console.log(chalk.gray('  module (m)        - Generate a module'));
    console.log(chalk.gray('  middleware (mi)   - Generate middleware'));
    console.log(chalk.gray('  interceptor (i)   - Generate an interceptor'));
    console.log(chalk.gray('  guard (g)         - Generate a guard'));
    console.log(chalk.gray('  decorator (d)     - Generate a decorator'));
    console.log(chalk.gray('  interface (if)    - Generate an interface'));
    console.log(chalk.gray('  class (cl)        - Generate a class'));
    console.log(chalk.white('\nExample: han g controller user'));
  }
}