import { CacheStorage } from './storage/index.js';

let cacheInstance: CacheStorage | null = null;

export async function getCache(): Promise<CacheStorage> {
  if (!cacheInstance) {
    cacheInstance = await new CacheStorage().init();
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
