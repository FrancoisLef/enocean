import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CacheData, CacheStorage } from './cache.storage.js';

describe('cache storage', () => {
  let dir: string;
  let file: string;
  let cache: CacheStorage;

  beforeEach(async () => {
    dir = path.join(
      process.cwd(),
      'tmp',
      `cache-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await fs.mkdir(dir, { recursive: true });

    file = path.join(dir, 'cache.json');
    cache = new CacheStorage(file);
  });

  afterEach(async () => {
    try {
      await fs.rm(dir, { force: true, recursive: true });
    } catch (error) {
      console.error('Failed to clean up temp directory:', error);
    }
  });

  describe('constructor', () => {
    it('creates a CacheStorage instance with empty cache', () => {
      expect.hasAssertions();
      expect(cache).toBeInstanceOf(CacheStorage);
      expect(cache.get('radio:path')).toBeUndefined();
      expect(cache.get('radio:baud')).toBeUndefined();
      expect(cache.get('radio:configured')).toBeUndefined();
    });
  });

  describe('init', () => {
    it('creates cache file if it does not exist', async () => {
      expect.hasAssertions();

      // Verify file doesn't exist before init
      let fileExists = false;
      try {
        await fs.access(file);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      expect(fileExists).toBe(false);

      // Initialize cache
      const result = await cache.init();

      // Verify file exists after init
      try {
        await fs.access(file);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      expect(fileExists).toBe(true);
      expect(result).toStrictEqual(cache);
    });

    it('loads existing cache data from file', async () => {
      expect.hasAssertions();

      const testData: CacheData = {
        'radio:baud': 57_600,
        'radio:configured': true,
        'radio:path': '/dev/ttyUSB0',
      };

      // Create cache file with test data
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(testData), 'utf8');

      // Initialize cache
      await cache.init();

      // Verify data was loaded
      expect(cache.get('radio:path')).toBe('/dev/ttyUSB0');
      expect(cache.get('radio:baud')).toBe(57_600);
      expect(cache.get('radio:configured')).toBe(true);
    });

    it('returns the CacheStorage instance for chaining', async () => {
      expect.hasAssertions();

      const result = await cache.init();

      expect(result).toStrictEqual(cache);
    });
  });

  describe('get', () => {
    it('returns undefined for non-existent keys', async () => {
      expect.hasAssertions();

      await cache.init();

      expect(cache.get('radio:path')).toBeUndefined();
      expect(cache.get('radio:baud')).toBeUndefined();
      expect(cache.get('radio:configured')).toBeUndefined();
    });

    it('returns cached values after initialization', async () => {
      expect.hasAssertions();

      const testData: CacheData = {
        'radio:baud': 115_200,
        'radio:path': '/dev/ttyUSB1',
      };

      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(testData), 'utf8');

      await cache.init();

      expect(cache.get('radio:path')).toBe('/dev/ttyUSB1');
      expect(cache.get('radio:baud')).toBe(115_200);
      expect(cache.get('radio:configured')).toBeUndefined();
    });
  });

  describe('set', () => {
    beforeEach(async () => {
      await cache.init();
    });

    it('sets and persists cache values', async () => {
      expect.hasAssertions();

      const result = await cache.set('radio:path', '/dev/ttyUSB0');

      expect(result).toStrictEqual(cache);
      expect(cache.get('radio:path')).toBe('/dev/ttyUSB0');

      // Verify the value was persisted to file
      const fileContent = await fs.readFile(file, 'utf8');
      const parsedData = JSON.parse(fileContent);

      expect(parsedData['radio:path']).toBe('/dev/ttyUSB0');
    });

    it('handles multiple cache keys', async () => {
      expect.hasAssertions();

      await cache.set('radio:path', '/dev/ttyUSB0');
      await cache.set('radio:baud', 57_600);

      expect(cache.get('radio:path')).toBe('/dev/ttyUSB0');
      expect(cache.get('radio:baud')).toBe(57_600);

      // Verify all values were persisted
      const fileContent = await fs.readFile(file, 'utf8');
      const parsedData = JSON.parse(fileContent);

      expect(parsedData['radio:path']).toBe('/dev/ttyUSB0');
      expect(parsedData['radio:baud']).toBe(57_600);
    });

    it('overwrites existing cache values', async () => {
      expect.hasAssertions();

      await cache.set('radio:path', '/dev/ttyUSB0');

      expect(cache.get('radio:path')).toBe('/dev/ttyUSB0');

      await cache.set('radio:path', '/dev/ttyUSB1');

      expect(cache.get('radio:path')).toBe('/dev/ttyUSB1');

      // Verify the new value was persisted
      const fileContent = await fs.readFile(file, 'utf8');
      const parsedData = JSON.parse(fileContent);

      expect(parsedData['radio:path']).toBe('/dev/ttyUSB1');
    });

    it('returns the CacheStorage instance for chaining', async () => {
      expect.hasAssertions();

      const result = await cache.set('radio:path', '/dev/ttyUSB0');

      expect(result).toStrictEqual(cache);
    });

    it('sets multiple cache values with bulk update', async () => {
      expect.hasAssertions();

      const result = await cache.set({
        'radio:baud': 57_600,
        'radio:configured': true,
        'radio:path': '/dev/ttyUSB0',
      });

      expect(result).toStrictEqual(cache);
      expect(cache.get('radio:path')).toBe('/dev/ttyUSB0');
      expect(cache.get('radio:baud')).toBe(57_600);

      // Verify all values were persisted to file
      const fileContent = await fs.readFile(file, 'utf8');
      const parsedData = JSON.parse(fileContent);

      expect(parsedData['radio:path']).toBe('/dev/ttyUSB0');
      expect(parsedData['radio:baud']).toBe(57_600);
    });

    it('overwrites existing values with bulk update', async () => {
      expect.hasAssertions();

      // Set initial values
      await cache.set('radio:path', '/dev/ttyUSB0');
      await cache.set('radio:baud', 57_600);

      // Bulk update with some overwritten and some new values
      await cache.set({
        'radio:baud': 115_200,
        'radio:configured': true,
        'radio:path': '/dev/ttyUSB1',
      });

      expect(cache.get('radio:path')).toBe('/dev/ttyUSB1');
      expect(cache.get('radio:baud')).toBe(115_200);
      expect(cache.get('radio:configured')).toBe(true);
    });

    it('handles partial bulk updates', async () => {
      expect.hasAssertions();

      // Set initial values
      await cache.set('radio:path', '/dev/ttyUSB0');
      await cache.set('radio:baud', 57_600);

      // Partial bulk update
      await cache.set({
        'radio:configured': true,
      });

      // Original values should remain unchanged
      expect(cache.get('radio:path')).toBe('/dev/ttyUSB0');
      expect(cache.get('radio:baud')).toBe(57_600);
      // New value should be set
      expect(cache.get('radio:configured')).toBe(true);
    });
  });

  describe('getAll', () => {
    beforeEach(async () => {
      await cache.init();
    });

    it('returns empty object when cache is empty', () => {
      expect.hasAssertions();

      const result = cache.getAll();

      expect(result).toStrictEqual({});
    });

    it('returns all cache values', async () => {
      expect.hasAssertions();

      await cache.set({
        'radio:baud': 57_600,
        'radio:configured': true,
        'radio:path': '/dev/ttyUSB0',
      });

      const result = cache.getAll();

      expect(result).toStrictEqual({
        'radio:baud': 57_600,
        'radio:configured': true,
        'radio:path': '/dev/ttyUSB0',
      });
    });

    it('returns partial cache values when some are undefined', async () => {
      expect.hasAssertions();

      await cache.set('radio:path', '/dev/ttyUSB0');
      await cache.set('radio:baud', 115_200);

      const result = cache.getAll();

      expect(result).toStrictEqual({
        'radio:baud': 115_200,
        'radio:path': '/dev/ttyUSB0',
      });
    });

    it('returns a copy of cache data (not a reference)', async () => {
      expect.hasAssertions();

      await cache.set('radio:path', '/dev/ttyUSB0');

      const result = cache.getAll();
      result['radio:path'] = '/dev/ttyUSB1';

      // Original cache should remain unchanged
      expect(cache.get('radio:path')).to.equal('/dev/ttyUSB0');
    });

    it('reflects changes after cache updates', async () => {
      expect.hasAssertions();

      await cache.set('radio:path', '/dev/ttyUSB0');

      let result = cache.getAll();

      expect(result).toStrictEqual({
        'radio:path': '/dev/ttyUSB0',
      });

      await cache.set('radio:baud', 57_600);

      result = cache.getAll();

      expect(result).toStrictEqual({
        'radio:baud': 57_600,
        'radio:path': '/dev/ttyUSB0',
      });
    });
  });

  describe('integration', () => {
    it('persists data across different CacheStorage instances', async () => {
      expect.hasAssertions();

      // First instance: set some data
      await cache.init();
      await cache.set('radio:path', '/dev/ttyUSB0');
      await cache.set('radio:baud', 57_600);

      // Second instance: load the same cache file
      const secondCache = new CacheStorage(file);
      await secondCache.init();

      // Verify data persisted
      expect(secondCache.get('radio:path')).to.equal('/dev/ttyUSB0');
      expect(secondCache.get('radio:baud')).to.equal(57_600);
    });
  });
});
