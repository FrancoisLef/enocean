import { FileStorage } from './file.storage';

export type CacheData = {
  'dongle:baud'?: number;
  'dongle:configured'?: boolean;
  'dongle:port'?: string;
};

export type CacheKey = keyof CacheData;

export class CacheStorage {
  private cache: CacheData;
  private cacheFile: string;
  private storage: FileStorage;

  constructor({ cacheDir }: { cacheDir: string }) {
    this.cache = {};
    this.cacheFile = `${cacheDir}/cache.json`;
    this.storage = new FileStorage();
  }

  public get<T extends CacheKey>(key: T): CacheData[T] {
    return this.cache[key];
  }

  public async init(): Promise<CacheStorage> {
    // Ensure the cache file exists
    await this.storage.accessFile(this.cacheFile);

    // Read the cache file
    this.cache = await this.storage.readJSON<CacheData>(this.cacheFile);

    return this;
  }

  public async set<T extends CacheKey>(
    key: T,
    value: CacheData[T],
  ): Promise<CacheStorage> {
    // Update cache value
    this.cache[key] = value;

    // Write the updated cache back to the file
    await this.storage.writeJSON<CacheData>(this.cache, this.cacheFile);

    return this;
  }
}
