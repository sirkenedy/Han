import { execSync } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';

export interface BuildCommandOptions {
  watch: boolean;
  webpack: boolean;
}

export class BuildCommand {
  async execute(options: BuildCommandOptions) {
    const spinner = ora('Building application...').start();

    try {
      const buildCommand = this.getBuildCommand(options);

      if (options.watch) {
        spinner.info(chalk.blue('Building in watch mode...'));
        spinner.stop();

        console.log(chalk.gray(`Running: ${buildCommand}`));
        execSync(buildCommand, { stdio: 'inherit' });
      } else {
        execSync(buildCommand, { stdio: 'pipe' });
        spinner.succeed(chalk.green('Build completed successfully'));
      }

    } catch (error: any) {
      spinner.fail(chalk.red('Build failed'));
      console.error(error.message);
      process.exit(1);
    }
  }

  private getBuildCommand(options: BuildCommandOptions): string {
    if (options.webpack) {
      return options.watch ? 'webpack --watch' : 'webpack';
    }

    return options.watch ? 'tsc --watch' : 'tsc';
  }
}