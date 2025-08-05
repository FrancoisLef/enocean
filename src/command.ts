import chalk from 'chalk';

import { CacheStorage } from './shared/storage/cache.storage.js';

export abstract class Command {
  protected cache: CacheStorage;

  constructor() {
    this.cache = new CacheStorage();
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
