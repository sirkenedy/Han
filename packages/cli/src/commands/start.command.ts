import { spawn } from "child_process";
import chalk from "chalk";
import ora from "ora";

export interface StartCommandOptions {
  watch: boolean;
  debug: boolean;
  port?: string;
}

export class StartCommand {
  async execute(options: StartCommandOptions) {
    const spinner = ora("Starting application...").start();

    try {
      const startCommand = this.getStartCommand(options);

      spinner.info(
        chalk.blue(
          `Starting in ${options.watch ? "watch" : "production"} mode...`,
        ),
      );
      spinner.stop();

      console.log(chalk.gray(`Running: ${startCommand.join(" ")}`));

      const child = spawn(startCommand[0], startCommand.slice(1), {
        stdio: "inherit",
        env: {
          ...process.env,
          ...(options.port && { PORT: options.port }),
          ...(options.debug && { NODE_ENV: "development", DEBUG: "*" }),
        },
      });

      child.on("error", (error) => {
        console.error(chalk.red("Failed to start application:"), error.message);
        process.exit(1);
      });

      child.on("exit", (code) => {
        if (code !== 0) {
          console.error(chalk.red(`Application exited with code ${code}`));
          process.exit(code);
        }
      });
    } catch (error: any) {
      spinner.fail(chalk.red("Failed to start application"));
      console.error(error.message);
      process.exit(1);
    }
  }

  private getStartCommand(options: StartCommandOptions): string[] {
    if (options.watch) {
      return ["npm", "run", "dev"];
    }

    return ["npm", "start"];
  }
}
