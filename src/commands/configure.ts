import { number, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { SerialPort } from 'serialport';

import { getCache, handleError } from '../shared/cli-utils.js';

export async function configure(): Promise<void> {
  try {
    const cache = await getCache();
    const ports = await SerialPort.list();
    const portPaths = ports.map((port) => port.path);

    const port = await select<string>({
      choices: portPaths.map((portPath) => ({
        name:
          portPath === cache.get('dongle:port')
            ? `${chalk.bold(portPath)} ${chalk.italic.dim('(actuel)')}`
            : portPath,
        short: portPath,
        value: portPath,
      })),
      default: cache.get('dongle:port'),
      instructions: {
        navigation:
          '<↑ ↓> flèches directionnelles pour naviguer et <entrer> pour confirmer.',
        pager: 'More options available (use arrow keys ↑ ↓)',
      },
      message: 'Sélectionnez votre périphérique EnOcean:',
      theme: {
        helpMode: 'always',
      },
    });

    const baud =
      (await number({
        default: cache.get('dongle:baud') || 57_600,
        message: 'Entrez le débit en bauds :',
      })) ?? 57_600;

    await cache.set({
      'dongle:baud': baud,
      'dongle:configured': true,
      'dongle:port': port,
    });

    console.log(
      `${chalk.green('✔')} ${chalk.bold('Le périphérique est configuré')}`,
    );
  } catch (error) {
    handleError(error as Error);
  }
}
