import { homedir } from 'node:os';
import { join } from 'node:path';

import { FileStorage } from './file.storage.js';

export interface CacheData {
  'dongle:baud'?: number;
  'dongle:configured'?: boolean;
  'dongle:port'?: string;
}

export type CacheKey = keyof CacheData;

export class CacheStorage {
  private data: CacheData;
  protected file: string;
  private storage: FileStorage;

  constructor(filePath?: string) {
    this.data = {};
    this.file = filePath ?? join(homedir(), '.cache', 'enocean', 'cache.json');
    this.storage = new FileStorage();
  }

  public get<T extends CacheKey>(key: T): CacheData[T] {
    return this.data[key];
  }

  public getAll(): CacheData {
    return { ...this.data };
  }

  public async init(): Promise<CacheStorage> {
    // Ensure the cache file exists
    await this.storage.accessFile(this.file);

    // Read the cache file
    this.data = await this.storage.readJSON<CacheData>(this.file);

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
      this.data[keyOrData] = value;
    } else {
      // Bulk update with object
      Object.assign(this.data, keyOrData);
    }

    // Write the updated data back to the file
    await this.storage.writeJSON<CacheData>(this.data, this.file);

    return this;
  }
}
