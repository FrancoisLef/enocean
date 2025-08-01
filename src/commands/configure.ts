import { number, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { SerialPort } from 'serialport';

import { BaseCommand } from '../base.command';

export default class Configure extends BaseCommand {
  static description = 'Configure dongle';
  static examples = [`<%= config.bin %> <%= command.id %> --help`];

  async run(): Promise<void> {
    const ports = await SerialPort.list();
    const portPaths = ports.map((port) => port.path);

    const port = await select<string>({
      choices: portPaths.map((portPath) => ({
        name:
          portPath === this.cache.get('dongle:port')
            ? `${chalk.bold(portPath)} ${chalk.italic.dim('(default)')}`
            : portPath,
        short: portPath,
        value: portPath,
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

    await this.cache.set({
      'dongle:baud': baud,
      'dongle:configured': true,
      'dongle:port': port,
    });

    this.log(chalk.green('✔'), chalk.bold('Dongle is configured'));
  }
}