import { runCommand } from '@oclif/test';
import { expect } from 'chai';

describe('configure', () => {
  it('runs configure', async () => {
    const { stdout } = await runCommand('configure');
    expect(stdout).to.contain('Configure command executed');
  });
});
