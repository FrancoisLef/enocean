import { Command } from 'commander';

import packageJson from '../package.json';
import { ConfigureCommand } from './commands/configure.js';
import { listen } from './commands/listen.js';
import { UpdateCommand } from './commands/update.js';

const program = new Command();

program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

program
  .command('configure')
  .description('Configure dongle')
  .action(() => new ConfigureCommand().run());

program.command('listen').description('Listen for telegrams').action(listen);

program
  .command('update')
  .description('Check for CLI updates')
  .action(() => new UpdateCommand().run());

program.parse();
