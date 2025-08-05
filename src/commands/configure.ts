import { number, select } from '@inquirer/prompts';
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
            ? `${portPath} (default)`
            : portPath,
        short: portPath,
        value: portPath,
      })),
      default: cache.get('dongle:port'),
      instructions: {
        navigation: '<↑ ↓> arrow keys to navigate and <enter> to confirm.',
        pager: 'More options available (use arrow keys ↑ ↓)',
      },
      message: 'Select a serial port to use:',
      theme: {
        helpMode: 'always',
      },
    });

    const baud =
      (await number({
        default: cache.get('dongle:baud') || 57_600,
        message: 'Enter the baud rate:',
      })) ?? 57_600;

    await cache.set({
      'dongle:baud': baud,
      'dongle:configured': true,
      'dongle:port': port,
    });

    console.log(`✔ Dongle is configured`);
  } catch (error) {
    handleError(error as Error);
  }
}
