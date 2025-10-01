import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { spawn } from 'child_process';
import { ProjectGenerator } from '../utils/project-generator';

export interface NewCommandOptions {
  packageManager: 'npm' | 'yarn' | 'pnpm';
  skipGit: boolean;
  skipInstall: boolean;
  fast: boolean;
}

export class NewCommand {
  async execute(projectName: string, options: NewCommandOptions) {
    const startTime = Date.now();

    try {
      // Validate project name
      if (!this.isValidProjectName(projectName)) {
        console.log(chalk.red('❌ Invalid project name. Use kebab-case (e.g., my-han-app)'));
        process.exit(1);
      }

      const projectPath = path.join(process.cwd(), projectName);

      // Check if directory already exists
      if (await fs.pathExists(projectPath)) {
        console.log(chalk.red(`❌ Directory ${projectName} already exists`));
        process.exit(1);
      }

      // Create project structure (with built-in progress logs)
      const generator = new ProjectGenerator();
      await generator.generateProject(projectPath, projectName, options.fast);

      // Install dependencies
      if (!options.skipInstall) {
        console.log(chalk.blue(`📦 Installing dependencies with ${options.packageManager}...`));
        if (options.fast) {
          console.log(chalk.gray('   (fast mode - minimal deps)'));
        }
        await this.installDependencies(projectPath, options.packageManager);
        console.log(chalk.green('✅ Dependencies installed'));
      } else {
        console.log(chalk.yellow('⏭️  Skipping dependency installation...'));
      }

      // Initialize git repository
      if (!options.skipGit) {
        console.log(chalk.blue('🔧 Initializing git repository...'));
        await this.initializeGit(projectPath);
        console.log(chalk.green('✅ Git repository initialized'));
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(chalk.gray('━'.repeat(50)));
      console.log(chalk.green(`🎉 Successfully created ${projectName} in ${duration}s!`));

      // Show next steps
      this.showNextSteps(projectName, options.packageManager, options.fast);

      // Explicitly exit to free the terminal
      process.exit(0);

    } catch (error: any) {
      console.log(chalk.red(`❌ Failed to create project: ${error.message}`));
      process.exit(1);
    }
  }

  private isValidProjectName(name: string): boolean {
    return /^[a-z][a-z0-9-]*$/.test(name);
  }

  private async installDependencies(projectPath: string, packageManager: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const commands = {
        npm: ['install', '--silent', '--no-audit', '--no-fund'],
        yarn: ['install', '--silent'],
        pnpm: ['install', '--silent']
      };

      const args = (commands as any)[packageManager];
      const child = spawn(packageManager, args, {
        cwd: projectPath,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Package installation failed with code ${code}:\n${errorOutput}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to start package manager: ${error.message}`));
      });

      // Set timeout to prevent hanging
      setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Package installation timed out after 5 minutes'));
      }, 300000); // 5 minutes timeout
    });
  }

  private async initializeGit(projectPath: string): Promise<void> {
    return new Promise((resolve) => {
      const commands = [
        ['git', ['init']],
        ['git', ['add', '.']],
        ['git', ['commit', '-m', 'Initial commit']]
      ];

      const executeGitCommand = (index: number) => {
        if (index >= commands.length) {
          resolve();
          return;
        }

        const [cmd, args] = commands[index] as [string, string[]];
        const child = spawn(cmd, args, {
          cwd: projectPath,
          stdio: 'ignore'
        });

        child.on('close', () => {
          executeGitCommand(index + 1);
        });

        child.on('error', () => {
          // Git initialization is optional, continue even if it fails
          console.warn(chalk.yellow('Warning: Could not initialize git repository'));
          resolve();
        });
      };

      executeGitCommand(0);
    });
  }

  private showNextSteps(projectName: string, packageManager: string, fastMode = false) {
    if (fastMode) {
      console.log(chalk.yellow('\n⚡ Fast mode was used - minimal dependencies installed'));
      console.log(chalk.gray('   You can add more dev tools later as needed'));
    }

    console.log(chalk.white('\nNext steps:'));
    console.log(chalk.gray(`  cd ${projectName}`));

    if (fastMode) {
      console.log(chalk.gray('  npm install  # Install remaining dependencies'));
      console.log(chalk.gray('  npm run dev  # Start development server'));
    } else {
      const startCommand = packageManager === 'npm' ? 'npm run dev' :
                          packageManager === 'yarn' ? 'yarn dev' : 'pnpm dev';
      console.log(chalk.gray(`  ${startCommand}`));
    }

    console.log(chalk.cyan('\nHappy coding! 🚀\n'));
  }
}