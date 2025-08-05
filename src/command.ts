import chalk from 'chalk';

import packageJson from '../package.json';
import { CacheStorage } from './shared/storage/cache.storage.js';

export interface CliInfo {
  name: string;
  version: string;
  description: string;
  homepage: string;
}

export abstract class BaseCommand {
  protected cache: CacheStorage;
  protected cli: CliInfo;

  constructor() {
    this.cache = new CacheStorage();
    this.cli = packageJson;
  }

  protected async init(): Promise<void> {
    await this.cache.init();
  }

  private handleError(error: Error): void {
    if (error.name === 'ExitPromptError') {
      console.log(chalk.dim('\n👋 Operation cancelled by user'));
      process.exit(0);
    }

    console.error(
      `${chalk.red('✖')} ${chalk.red.bold('Error:')} ${error.message}`,
    );
    process.exit(1);
  }

  async run(): Promise<void> {
    try {
      await this.init();
      await this.execute();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  protected abstract execute(): Promise<void>;
}
