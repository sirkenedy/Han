#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { NewCommand } from './commands/new.command';
import { GenerateCommand } from './commands/generate.command';
import { ResourceCommand } from './commands/resource.command';
import { BuildCommand } from './commands/build.command';
import { StartCommand } from './commands/start.command';
import { InfoCommand } from './commands/info.command';

const program = new Command();

// Display Han CLI banner
console.log(
  chalk.blue(
    figlet.textSync('Han CLI', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })
  )
);

console.log(chalk.gray('A powerful CLI for Han Framework development\n'));

program
  .name('han')
  .description('Han Framework CLI - Build modern Node.js applications')
  .version('1.0.4');

// Register commands
program
  .command('new <name>')
  .alias('n')
  .description('Create a new Han Framework application')
  .option('-p, --package-manager <manager>', 'Package manager to use (npm, yarn, pnpm)', 'npm')
  .option('--skip-git', 'Skip git repository initialization')
  .option('--skip-install', 'Skip package installation')
  .option('--fast', 'Use fast mode with minimal dependencies for rapid prototyping')
  .action((name, options) => {
    new NewCommand().execute(name, options);
  });

program
  .command('generate <schematic> <name>')
  .alias('g')
  .description('Generate code from schematics')
  .option('-d, --dry-run', 'Report actions without writing files')
  .option('--skip-import', 'Skip importing into the closest module')
  .option('--spec', 'Generate spec files', true)
  .option('--no-spec', 'Do not generate spec files')
  .action((schematic, name, options) => {
    new GenerateCommand().execute(schematic, name, options);
  });

program
  .command('resource <name>')
  .alias('res')
  .description('Generate a complete resource (module, controller, service, and tests)')
  .option('-d, --dry-run', 'Report actions without writing files')
  .option('--no-spec', 'Skip generating test files')
  .option('--crud', 'Generate CRUD operations', false)
  .action((name, options) => {
    new ResourceCommand().execute(name, {
      dryRun: options.dryRun || false,
      skipTests: !options.spec,
      crud: options.crud || false
    });
  });

program
  .command('build')
  .alias('b')
  .description('Build the application')
  .option('-w, --watch', 'Watch for file changes')
  .option('--webpack', 'Use webpack for bundling')
  .action((options) => {
    new BuildCommand().execute(options);
  });

program
  .command('start')
  .alias('s')
  .description('Start the application')
  .option('-w, --watch', 'Watch for file changes')
  .option('-d, --debug', 'Enable debug mode')
  .option('-p, --port <port>', 'Port to run the application on')
  .action((options) => {
    new StartCommand().execute(options);
  });

program
  .command('info')
  .alias('i')
  .description('Display project information')
  .action(() => {
    new InfoCommand().execute();
  });

// Add help command
program
  .command('help [command]')
  .description('Display help for a command')
  .action((command) => {
    if (command) {
      program.help({ error: false });
    } else {
      program.outputHelp();
    }
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}