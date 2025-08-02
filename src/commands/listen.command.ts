import { EnOceanManager } from '../libraries/enocean/manager';
import { BaseCommand } from './base.command';

export class Listen extends BaseCommand {
  static description = 'Listen for telegrams';
  static examples = ['<%= config.bin %> <%= command.id %>'];

  public async run(): Promise<void> {
    const {
      'dongle:baud': baud,
      'dongle:configured': isConfigured,
      'dongle:port': port,
    } = this.cache.getAll();

    if (!isConfigured || !port || !baud) {
      this.error('The dongle is not configured', {
        code: 'dongle_not_configured',
        suggestions: ['Run `configure` to set up the dongle.'],
      });
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
  }
}
