import { select } from '@inquirer/prompts';

import { BaseCommand } from '../../base.command';
import { listPorts } from '../../lib/serial/list-ports';

export default class Configure extends BaseCommand {
  static description = 'Configure EnOcean dongle';
  static examples = [`<%= config.bin %> <%= command.id %> --help`];

  async run(): Promise<void> {
    const ports = await listPorts();

    const selectedPort = await select<string>({
      choices: ports,
      default: this.cache.get('port'),
      message: 'Select a serial port to use:',
    });

    await this.cache.set('port', selectedPort);

    this.log(`Selected port: ${selectedPort}`);
  }
}
