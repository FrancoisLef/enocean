import { homedir } from 'node:os';
import { join } from 'node:path';

import { CacheStorage } from './storage/index.js';

// Get cache directory similar to OCLIF
function getCacheDir(): string {
  const home = homedir();
  return join(home, '.cache', 'enocean');
}

let cacheInstance: CacheStorage | null = null;

export async function getCache(): Promise<CacheStorage> {
  if (!cacheInstance) {
    cacheInstance = await new CacheStorage({
      cacheDir: getCacheDir(),
    }).init();
  }

  return cacheInstance;
}

export function handleError(error: Error): void {
  if (error.name === 'ExitPromptError') {
    console.log('\nUser exited prompt gracefully (Ctrl+C)');
    process.exit(0);
  }

  console.error('Error:', error.message);
  process.exit(1);
}
