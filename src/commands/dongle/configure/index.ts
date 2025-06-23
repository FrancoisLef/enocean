import { number, select } from '@inquirer/prompts';
import chalk from 'chalk';

import { BaseCommand } from '../../../base.command';
import { listPorts } from '../../../lib/serial/list-ports';

export default class Configure extends BaseCommand {
  static description = 'Configure EnOcean dongle';
  static examples = [`<%= config.bin %> <%= command.id %> --help`];

  async run(): Promise<void> {
    const ports = await listPorts();

    const port = await select<string>({
      choices: ports.map((port) => ({
        name:
          port === this.cache.get('port')
            ? `${chalk.bold(port)} ${chalk.italic.dim('(default)')}`
            : port,
        short: port,
        value: port,
      })),
      default: this.cache.get('port'),
      instructions: {
        navigation: chalk.italic(
          `<↑ ↓> arrow keys to navigate and <enter> to confirm.`,
        ),
        pager: 'More options available (use arrow keys ↑ ↓)',
      },
      message: 'Select a serial port to use:',
      theme: {
        helpMode: 'always',
      },
    });

    const baud =
      (await number({
        default: this.cache.get('baud') || 57_600,
        message: 'Enter the baud rate:',
      })) ?? 57_600;

    await this.cache.set('port', port);
    await this.cache.set('baud', baud);

    this.log(chalk.green('✔'), chalk.bold('Dongle is configured'));
  }
}
