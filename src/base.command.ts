import { Command } from '@oclif/core';

import { Cache } from './connectors/cache.connector';

export abstract class BaseCommand extends Command {
  protected cache!: Cache;

  protected async catch(err: Error & { exitCode?: number }): Promise<void> {
    // The ExitPromptError can be thrown by inquirer when the user exits a prompt gracefully (e.g., by pressing Ctrl+C).
    if (err instanceof Error && err.name === 'ExitPromptError') {
      this.debug('User exited prompt gracefully (Ctrl+C)');
      return;
    }

    return super.catch(err);
  }

  public async init(): Promise<void> {
    this.cache = await new Cache({
      dataDir: this.config.dataDir,
    }).init();
    await super.init();
  }
}
