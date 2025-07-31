import { BaseCommand } from '../../../base.command';
import { Dongle } from '../../../connectors/dongle.connector';

export default class Listen extends BaseCommand {
  static description = 'Listen for telegrams';
  static examples = ['<%= config.bin %> <%= command.id %>'];

  public async run(): Promise<void> {
    const isConfigured = this.cache.get('dongle:configured');
    const port = this.cache.get('dongle:port');
    const baud = this.cache.get('dongle:baud');

    if (!isConfigured || !port || !baud) {
      this.error('The dongle is not configured', {
        code: 'dongle_not_configured',
        suggestions: ['Run `dongle:configure` to set up the dongle.'],
      });
    }

    const dongle = new Dongle({
      baud,
      port,
    });

    dongle.open();

    console.log('Connecting to EnOcean dongle...');
  }
}
