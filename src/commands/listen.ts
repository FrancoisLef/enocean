import chalk from 'chalk';

import { BaseCommand } from '../command.js';
import { EnOceanManager } from '../libraries/enocean/manager.js';

export class ListenCommand extends BaseCommand {
  protected async execute(): Promise<void> {
    const {
      'radio:baud': baud,
      'radio:configured': isConfigured,
      'radio:path': port,
    } = this.cache.getAll();

    if (!isConfigured || !port || !baud) {
      throw new Error(
        'The dongle is not configured. Run `enocean configure` to set up the dongle.',
      );
    }

    const manager = new EnOceanManager();

    manager.on('eepData', (data) => {
      if (data.profile === 'F6-02-01') {
        console.log(
          `${chalk.blue('Switch')} ${chalk.dim(data.senderId.toString(16))}: Rocker A=${data.rockerA}, Action=${data.rockerAction}`,
        );
      } else if (data.profile === 'D2-01-12') {
        console.log(
          `${chalk.green('Relay')} ${chalk.dim(data.senderId.toString(16))}: Channel=${data.channel}, State=${data.outputState}, Value=${data.outputValue}%`,
        );
      }
    });

    console.log(
      `${chalk.blue('🎧')} ${chalk.bold('Listening for EnOcean telegrams on')} ${chalk.yellow(port)} ${chalk.dim(`(${baud} baud)`)}`,
    );
    console.log(chalk.italic.dim('Press Ctrl+C to stop'));

    manager.connect(port, { baudRate: baud });
  }
}
