import { number, select } from '@inquirer/prompts';
import chalk from 'chalk';

import { BaseCommand } from '../../../base.command';
import { Dongle } from '../../../connectors/dongle.connector';

export default class Configure extends BaseCommand {
  static description = 'Configure EnOcean dongle';
  static examples = [`<%= config.bin %> <%= command.id %> --help`];

  async run(): Promise<void> {
    const ports = await Dongle.listPorts();

    const port = await select<string>({
      choices: ports.map((port) => ({
        name:
          port === this.cache.get('dongle:port')
            ? `${chalk.bold(port)} ${chalk.italic.dim('(default)')}`
            : port,
        short: port,
        value: port,
      })),
      default: this.cache.get('dongle:port'),
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
        default: this.cache.get('dongle:baud') || 57_600,
        message: 'Enter the baud rate:',
      })) ?? 57_600;

    await this.cache.set('dongle:port', port);
    await this.cache.set('dongle:baud', baud);
    await this.cache.set('dongle:configured', true);

    this.log(chalk.green('✔'), chalk.bold('Dongle is configured'));
  }
}
