import chalk from 'chalk';

import { BaseCommand } from '../command.js';

interface NpmRegistryResponse {
  version: string;
  name: string;
  description?: string;
}

export class UpdateCommand extends BaseCommand {
  protected async execute(): Promise<void> {
    const { version, name, homepage } = this.cli;

    console.log(`🔍 Checking for updates for ${chalk.bold(name)}…`);

    const response = await fetch(`https://registry.npmjs.org/${name}/latest`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const { version: latest }: NpmRegistryResponse =
      (await response.json()) || { version: '' };

    if (version === latest) {
      console.log(`📦 ${chalk.dim('Current:')} ${chalk.bold.blue(version)}`);
      console.log(`📦  ${chalk.dim('Latest:')} ${chalk.dim(latest)}`);
      console.log(
        `${chalk.green('✔')} ${chalk.bold('You are already using the latest version!')}`,
      );
    } else {
      console.log(`📦 ${chalk.dim('Current:')} ${chalk.blue(version)}`);
      console.log(`📦  ${chalk.dim('Latest:')} ${chalk.bold.green(latest)}`);
      console.log(
        `${chalk.cyan('🆕')} ${chalk.bold('A new version is available!')}`,
      );
      console.log('');
      console.log(chalk.dim('To update:'));
      console.log('');
      console.log('💾 Binary download:');
      console.log(`   ${chalk.blue(`${homepage}/releases`)}`);
      console.log('');
      console.log('📦 Via npm:');
      console.log(`   ${chalk.green(`npm install -g ${name}@latest`)}`);
      console.log('');
      console.log('🧶 Via yarn:');
      console.log(`   ${chalk.green(`yarn global add ${name}@latest`)}`);
    }
  }
}
