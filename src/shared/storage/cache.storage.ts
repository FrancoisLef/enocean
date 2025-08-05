import { FileStorage } from './file.storage.js';

export interface CacheData {
  'dongle:baud'?: number;
  'dongle:configured'?: boolean;
  'dongle:port'?: string;
}

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

  public getAll(): CacheData {
    return { ...this.cache };
  }

  public async init(): Promise<CacheStorage> {
    // Ensure the cache file exists
    await this.storage.accessFile(this.cacheFile);

    // Read the cache file
    this.cache = await this.storage.readJSON<CacheData>(this.cacheFile);

    return this;
  }

  public async set(data: Partial<CacheData>): Promise<CacheStorage>;
  public async set<T extends CacheKey>(
    key: T,
    value: CacheData[T],
  ): Promise<CacheStorage>;
  public async set<T extends CacheKey>(
    keyOrData: Partial<CacheData> | T,
    value?: CacheData[T],
  ): Promise<CacheStorage> {
    if (typeof keyOrData === 'string') {
      // Single key-value pair
      this.cache[keyOrData] = value!;
    } else {
      // Bulk update with object
      Object.assign(this.cache, keyOrData);
    }

    // Write the updated cache back to the file
    await this.storage.writeJSON<CacheData>(this.cache, this.cacheFile);

    return this;
  }
}
