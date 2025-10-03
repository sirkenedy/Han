import * as fs from "fs-extra";
import * as path from "path";
import chalk from "chalk";
import boxen from "boxen";

export class InfoCommand {
  async execute() {
    try {
      const projectInfo = await this.getProjectInfo();
      const systemInfo = this.getSystemInfo();

      console.log(
        boxen(chalk.blue.bold("📋 Han Framework Project Information"), {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "blue",
        }),
      );

      this.displayProjectInfo(projectInfo);
      this.displaySystemInfo(systemInfo);
      this.displayFrameworkInfo();
    } catch (error: any) {
      console.error(
        chalk.red("Failed to gather project information:"),
        error.message,
      );
    }
  }

  private async getProjectInfo() {
    const packageJsonPath = path.join(process.cwd(), "package.json");

    if (!(await fs.pathExists(packageJsonPath))) {
      throw new Error(
        "Not in a Node.js project directory (package.json not found)",
      );
    }

    const packageJson = await fs.readJson(packageJsonPath);
    const isHanProject =
      packageJson.dependencies?.["han-prev-core"] ||
      packageJson.devDependencies?.["han-prev-core"] ||
      packageJson.dependencies?.["@han-prev/core"] ||
      packageJson.devDependencies?.["@han-prev/core"] ||
      packageJson.dependencies?.["han-framework"] ||
      packageJson.devDependencies?.["han-framework"];

    return {
      name: packageJson.name || "Unknown",
      version: packageJson.version || "0.0.0",
      description: packageJson.description || "No description",
      hanFramework: isHanProject
        ? packageJson.dependencies?.["han-prev-core"] ||
          packageJson.devDependencies?.["han-prev-core"] ||
          packageJson.dependencies?.["@han-prev/core"] ||
          packageJson.devDependencies?.["@han-prev/core"] ||
          packageJson.dependencies?.["han-framework"] ||
          packageJson.devDependencies?.["han-framework"]
        : null,
      scripts: packageJson.scripts || {},
      dependencies: Object.keys(packageJson.dependencies || {}),
      devDependencies: Object.keys(packageJson.devDependencies || {}),
    };
  }

  private getSystemInfo() {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
    };
  }

  private displayProjectInfo(info: any) {
    console.log(chalk.blue.bold("\n📦 Project Information:"));
    console.log(chalk.gray("─".repeat(40)));
    console.log(chalk.white(`Name: ${chalk.cyan(info.name)}`));
    console.log(chalk.white(`Version: ${chalk.cyan(info.version)}`));
    console.log(chalk.white(`Description: ${chalk.cyan(info.description)}`));

    if (info.hanFramework) {
      console.log(
        chalk.white(`Han Framework: ${chalk.green(info.hanFramework)}`),
      );
    } else {
      console.log(chalk.yellow("⚠️  This is not a Han Framework project"));
    }

    console.log(
      chalk.white(`Dependencies: ${chalk.cyan(info.dependencies.length)}`),
    );
    console.log(
      chalk.white(
        `Dev Dependencies: ${chalk.cyan(info.devDependencies.length)}`,
      ),
    );

    if (Object.keys(info.scripts).length > 0) {
      console.log(chalk.blue.bold("\n📝 Available Scripts:"));
      Object.entries(info.scripts).forEach(([script, command]) => {
        console.log(
          chalk.white(`  ${chalk.cyan(script)}: ${chalk.gray(command)}`),
        );
      });
    }
  }

  private displaySystemInfo(info: any) {
    console.log(chalk.blue.bold("\n💻 System Information:"));
    console.log(chalk.gray("─".repeat(40)));
    console.log(chalk.white(`Node.js: ${chalk.green(info.nodeVersion)}`));
    console.log(chalk.white(`Platform: ${chalk.cyan(info.platform)}`));
    console.log(chalk.white(`Architecture: ${chalk.cyan(info.arch)}`));
    console.log(chalk.white(`Working Directory: ${chalk.gray(info.cwd)}`));
  }

  private displayFrameworkInfo() {
    console.log(chalk.blue.bold("\n🚀 Han Framework CLI:"));
    console.log(chalk.gray("─".repeat(40)));
    console.log(chalk.white(`CLI Version: ${chalk.green("1.0.0")}`));
    console.log(
      chalk.white(
        `Repository: ${chalk.cyan("https://github.com/your-org/han-framework")}`,
      ),
    );
    console.log(
      chalk.white(`Documentation: ${chalk.cyan("https://han-framework.dev")}`),
    );

    console.log(chalk.blue.bold("\n🛠️  Available Commands:"));
    const commands = [
      { cmd: "han new <name>", desc: "Create a new project" },
      { cmd: "han generate <type> <name>", desc: "Generate code files" },
      { cmd: "han build", desc: "Build the application" },
      { cmd: "han start", desc: "Start the application" },
      { cmd: "han info", desc: "Show project information" },
    ];

    commands.forEach(({ cmd, desc }) => {
      console.log(
        chalk.white(`  ${chalk.cyan(cmd.padEnd(25))} ${chalk.gray(desc)}`),
      );
    });
  }
}
