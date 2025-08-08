import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import { SerialPort } from 'serialport';

import { BaseCommand } from '../command.js';

export class ConfigureCommand extends BaseCommand {
  protected async execute(): Promise<void> {
    const path = await this.selectPath();
    const baud = await this.selectBaud();

    await this.cache.set({
      'radio:baud': baud,
      'radio:configured': true,
      'radio:path': path,
    });

    console.log(`${chalk.green('✔')} ${chalk.bold('Radio configured')}`);
  }

  private async selectBaud(): Promise<number> {
    const bauds = [57_600, 115_200, 230_400, 460_800] as const;
    const defaultBaud = 57_600;

    const cache = this.cache.get('radio:baud');

    const choices = bauds.map((baud) => ({
      name:
        baud === (cache || defaultBaud)
          ? `${chalk.bold(baud)} ${chalk.italic.dim('(default)')}`
          : baud.toString(),
      default: defaultBaud,
      value: baud,
    }));

    const baud = await select<number>({
      choices,
      default: cache || defaultBaud,
      instructions: {
        navigation: '<↑ ↓> arrow keys to navigate and <enter> to confirm.',
        pager: 'More options available (use arrow keys ↑ ↓)',
      },
      theme: {
        helpMode: 'always',
      },
      message: 'Select the Baud rate:',
    });

    return baud;
  }

  private async selectPath(): Promise<string> {
    const list = await SerialPort.list();
    const paths = list.map<string>((port) => port.path);

    const cache = this.cache.get('radio:path');

    const choices = paths
      .map((path) => ({
        name:
          path === cache
            ? `${chalk.bold(path)} ${chalk.italic.dim('(default)')}`
            : path,
        short: path,
        value: path,
      }))
      .sort((a, b) => {
        if (a.value === cache) return -1;
        if (b.value === cache) return 1;
        return a.name.localeCompare(b.name);
      });

    const path = await select<string>({
      choices,
      default: cache,
      instructions: {
        navigation: '<↑ ↓> arrow keys to navigate and <enter> to confirm.',
        pager: 'More options available (use arrow keys ↑ ↓)',
      },
      theme: {
        helpMode: 'always',
      },
      message: 'Select your EnOcean radio:',
    });

    return path;
  }
}
