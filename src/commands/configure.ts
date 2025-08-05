import { number, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { SerialPort } from 'serialport';

import { BaseCommand } from '../command.js';

export class ConfigureCommand extends BaseCommand {
  protected async execute(): Promise<void> {
    const ports = await SerialPort.list();
    const paths = ports.map((port) => port.path);

    const port = await select<string>({
      choices: paths.map((path) => ({
        name:
          path === this.cache.get('dongle:port')
            ? `${chalk.bold(path)} ${chalk.italic.dim('(current)')}`
            : path,
        short: path,
        value: path,
      })),
      default: this.cache.get('dongle:port'),
      instructions: {
        navigation: '<↑ ↓> arrow keys to navigate and <enter> to confirm.',
        pager: 'More options available (use arrow keys ↑ ↓)',
      },
      message: 'Select your EnOcean device:',
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

    console.log(
      `${chalk.green('✔')} ${chalk.bold('Device configured successfully')}`,
    );
  }
}
