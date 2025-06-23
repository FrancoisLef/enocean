import { Storage } from './storage.connector';

export type CacheData = {
  'dongle:baud'?: number;
  'dongle:configured'?: boolean;
  'dongle:port'?: string;
};

export type CacheKey = keyof CacheData;

export class Cache {
  private cache: CacheData;
  private cacheFile: string;
  private storage: Storage;

  constructor({ cacheDir }: { cacheDir: string }) {
    this.cache = {};
    this.cacheFile = `${cacheDir}/cache.json`;
    this.storage = new Storage();
  }

  public get<T extends CacheKey>(key: T): CacheData[T] {
    return this.cache[key];
  }

  public async init(): Promise<Cache> {
    // Ensure the cache file exists
    await this.storage.accessFile(this.cacheFile);

    // Read the cache file
    this.cache = await this.storage.readJSON<CacheData>(this.cacheFile);

    return this;
  }

  public async set<T extends CacheKey>(
    key: T,
    value: CacheData[T],
  ): Promise<Cache> {
    // Update cache value
    this.cache[key] = value;

    // Write the updated cache back to the file
    await this.storage.writeJSON<CacheData>(this.cache, this.cacheFile);

    return this;
  }
}
