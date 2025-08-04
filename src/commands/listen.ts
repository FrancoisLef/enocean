import { EnOceanManager } from '../libraries/enocean/manager.js';
import { getCache, handleError } from '../shared/cli-utils.js';

export async function listen(): Promise<void> {
  try {
    const cache = await getCache();
    const {
      'dongle:baud': baud,
      'dongle:configured': isConfigured,
      'dongle:port': port,
    } = cache.getAll();

    if (!isConfigured || !port || !baud) {
      console.error('Error: The dongle is not configured');
      console.error(
        'Suggestion: Run `enocean configure` to set up the dongle.',
      );
      process.exit(1);
    }

    const manager = new EnOceanManager();

    manager.on('eepData', (data) => {
      if (data.profile === 'F6-02-01') {
        console.log(
          `Interrupteur ${data.senderId.toString(16)}: Rocker A=${data.rockerA}, Action=${data.rockerAction}`,
        );
      } else if (data.profile === 'D2-01-12') {
        console.log(
          `Relay Nodon ${data.senderId.toString(16)}: Canal=${data.channel}, État=${data.outputState}, Valeur=${data.outputValue}%`,
        );
      }
    });

    // manager.on('radioTelegram', (telegram) => {
    //   // Décodage manuel si nécessaire
    //   const decoded = EEPDecoder.decode(telegram);
    //   if (decoded) {
    //     console.log('Données décodées:', decoded);
    //   }
    // });

    manager.connect(port, { baudRate: baud });
  } catch (error) {
    handleError(error as Error);
  }
}
