import { Storage } from './storage.connector';

export type CacheData = {
  port?: string;
};

export type CacheKey = keyof CacheData;

export class Cache {
  private data: CacheData;
  private file: string;

  constructor({ dataDir }: { dataDir: string }) {
    this.data = {};
    this.file = `${dataDir}/cache.json`;
  }

  public get<T extends CacheKey>(key: T): CacheData[T] {
    return this.data[key];
  }

  public async init(): Promise<Cache> {
    await Storage.accessFile(this.file);
    this.data = await Storage.readFile<CacheData>(this.file);
    return this;
  }

  public async set<T extends CacheKey>(
    key: T,
    value: CacheData[T],
  ): Promise<Cache> {
    this.data[key] = value;
    await Storage.writeFile<CacheData>(this.data, this.file);
    return this;
  }
}
