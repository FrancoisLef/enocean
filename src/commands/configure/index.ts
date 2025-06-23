import { number, select } from '@inquirer/prompts';

import { BaseCommand } from '../../base.command';
import { listPorts } from '../../lib/serial/list-ports';

export default class Configure extends BaseCommand {
  static description = 'Configure EnOcean dongle';
  static examples = [`<%= config.bin %> <%= command.id %> --help`];

  async run(): Promise<void> {
    const ports = await listPorts();

    const port = await select<string>({
      choices: ports.map((port) => ({
        description: `Port: ${port}`,
        name: port === this.cache.get('port') ? `${port} · selected` : port,
        value: port,
      })),
      default: this.cache.get('port'),
      instructions: {
        navigation: `<↑ ↓> arrow keys to navigate and <enter> to confirm.`,
        pager: 'More options available (use arrow keys ↑ ↓)',
      },
      message: 'Select a serial port to use:',
      theme: {
        helpMode: 'always',
      },
    });

    await this.cache.set('port', port);

    const baud =
      (await number({
        default: this.cache.get('baud') || 57_600,
        message: 'Enter the baud rate:',
      })) ?? 57_600;

    await this.cache.set('baud', baud);

    this.log(`Selected port: ${port} with baud rate: ${baud}`);
  }
}
