import { Command } from '@oclif/core';

import { CacheStorage } from './infrastructure/storage/cache-storage';

export abstract class BaseCommand extends Command {
  protected cache!: CacheStorage;

  protected async catch(err: Error & { exitCode?: number }): Promise<void> {
    // The ExitPromptError can be thrown by inquirer when the user exits a prompt gracefully (e.g., by pressing Ctrl+C).
    if (err instanceof Error && err.name === 'ExitPromptError') {
      this.debug('User exited prompt gracefully (Ctrl+C)');
      return;
    }

    return super.catch(err);
  }

  public async init(): Promise<void> {
    // Initialize the cache
    if (!this.cache) {
      this.cache = await new CacheStorage({
        cacheDir: this.config.cacheDir,
      }).init();
    }

    await super.init();
  }
}
