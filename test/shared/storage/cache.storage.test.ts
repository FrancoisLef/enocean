import { expect } from 'chai';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('node:fs/promises');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('node:path');

import {
  CacheData,
  CacheStorage,
} from '../../../src/shared/storage/cache.storage';

describe('CacheStorage', () => {
  let tmpDir: string;
  let cacheStorage: CacheStorage;

  beforeEach(async () => {
    // Create a unique temporary directory
    tmpDir = path.join(
      __dirname,
      'tmp',
      `cache-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await fs.mkdir(tmpDir, { recursive: true });

    cacheStorage = new CacheStorage({ cacheDir: tmpDir });
  });

  afterEach(async () => {
    // Clean up the temporary directory after each test
    try {
      await fs.rm(tmpDir, { force: true, recursive: true });
    } catch (error) {
      console.error('Failed to clean up temp directory:', error);
    }
  });

  describe('constructor', () => {
    it('creates a CacheStorage instance with empty cache', () => {
      expect(cacheStorage).to.be.instanceOf(CacheStorage);
      expect(cacheStorage.get('dongle:port')).to.equal(undefined);
      expect(cacheStorage.get('dongle:baud')).to.equal(undefined);
      expect(cacheStorage.get('dongle:configured')).to.equal(undefined);
    });
  });

  describe('init', () => {
    it('creates cache file if it does not exist', async () => {
      const cacheFilePath = path.join(tmpDir, 'cache.json');

      // Verify file doesn't exist before init
      let fileExists = false;
      try {
        await fs.access(cacheFilePath);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      expect(fileExists).to.equal(false);

      // Initialize cache
      const result = await cacheStorage.init();

      // Verify file exists after init
      try {
        await fs.access(cacheFilePath);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      expect(fileExists).to.equal(true);
      expect(result).to.equal(cacheStorage);
    });

    it('loads existing cache data from file', async () => {
      const cacheFilePath = path.join(tmpDir, 'cache.json');
      const testData: CacheData = {
        'dongle:baud': 57_600,
        'dongle:configured': true,
        'dongle:port': '/dev/ttyUSB0',
      };

      // Create cache file with test data
      await fs.mkdir(path.dirname(cacheFilePath), { recursive: true });
      await fs.writeFile(cacheFilePath, JSON.stringify(testData), 'utf8');

      // Initialize cache
      await cacheStorage.init();

      // Verify data was loaded
      expect(cacheStorage.get('dongle:port')).to.equal('/dev/ttyUSB0');
      expect(cacheStorage.get('dongle:baud')).to.equal(57_600);
      expect(cacheStorage.get('dongle:configured')).to.equal(true);
    });

    it('returns the CacheStorage instance for chaining', async () => {
      const result = await cacheStorage.init();
      expect(result).to.equal(cacheStorage);
    });
  });

  describe('get', () => {
    it('returns undefined for non-existent keys', async () => {
      await cacheStorage.init();
      expect(cacheStorage.get('dongle:port')).to.equal(undefined);
      expect(cacheStorage.get('dongle:baud')).to.equal(undefined);
      expect(cacheStorage.get('dongle:configured')).to.equal(undefined);
    });

    it('returns cached values after initialization', async () => {
      const cacheFilePath = path.join(tmpDir, 'cache.json');
      const testData: CacheData = {
        'dongle:baud': 115_200,
        'dongle:port': '/dev/ttyUSB1',
      };

      await fs.mkdir(path.dirname(cacheFilePath), { recursive: true });
      await fs.writeFile(cacheFilePath, JSON.stringify(testData), 'utf8');

      await cacheStorage.init();

      expect(cacheStorage.get('dongle:port')).to.equal('/dev/ttyUSB1');
      expect(cacheStorage.get('dongle:baud')).to.equal(115_200);
      expect(cacheStorage.get('dongle:configured')).to.equal(undefined);
    });
  });

  describe('set', () => {
    beforeEach(async () => {
      await cacheStorage.init();
    });

    it('sets and persists cache values', async () => {
      const result = await cacheStorage.set('dongle:port', '/dev/ttyUSB0');

      expect(result).to.equal(cacheStorage);
      expect(cacheStorage.get('dongle:port')).to.equal('/dev/ttyUSB0');

      // Verify the value was persisted to file
      const cacheFilePath = path.join(tmpDir, 'cache.json');
      const fileContent = await fs.readFile(cacheFilePath, 'utf8');
      const parsedData = JSON.parse(fileContent);
      expect(parsedData['dongle:port']).to.equal('/dev/ttyUSB0');
    });

    it('handles multiple cache keys', async () => {
      await cacheStorage.set('dongle:port', '/dev/ttyUSB0');
      await cacheStorage.set('dongle:baud', 57_600);
      await cacheStorage.set('dongle:configured', true);

      expect(cacheStorage.get('dongle:port')).to.equal('/dev/ttyUSB0');
      expect(cacheStorage.get('dongle:baud')).to.equal(57_600);
      expect(cacheStorage.get('dongle:configured')).to.equal(true);

      // Verify all values were persisted
      const cacheFilePath = path.join(tmpDir, 'cache.json');
      const fileContent = await fs.readFile(cacheFilePath, 'utf8');
      const parsedData = JSON.parse(fileContent);

      expect(parsedData['dongle:port']).to.equal('/dev/ttyUSB0');
      expect(parsedData['dongle:baud']).to.equal(57_600);
      expect(parsedData['dongle:configured']).to.equal(true);
    });

    it('overwrites existing cache values', async () => {
      await cacheStorage.set('dongle:port', '/dev/ttyUSB0');
      expect(cacheStorage.get('dongle:port')).to.equal('/dev/ttyUSB0');

      await cacheStorage.set('dongle:port', '/dev/ttyUSB1');
      expect(cacheStorage.get('dongle:port')).to.equal('/dev/ttyUSB1');

      // Verify the new value was persisted
      const cacheFilePath = path.join(tmpDir, 'cache.json');
      const fileContent = await fs.readFile(cacheFilePath, 'utf8');
      const parsedData = JSON.parse(fileContent);
      expect(parsedData['dongle:port']).to.equal('/dev/ttyUSB1');
    });

    it('returns the CacheStorage instance for chaining', async () => {
      const result = await cacheStorage.set('dongle:port', '/dev/ttyUSB0');
      expect(result).to.equal(cacheStorage);
    });

    it('sets multiple cache values with bulk update', async () => {
      const result = await cacheStorage.set({
        'dongle:baud': 57_600,
        'dongle:configured': true,
        'dongle:port': '/dev/ttyUSB0',
      });

      expect(result).to.equal(cacheStorage);
      expect(cacheStorage.get('dongle:port')).to.equal('/dev/ttyUSB0');
      expect(cacheStorage.get('dongle:baud')).to.equal(57_600);
      expect(cacheStorage.get('dongle:configured')).to.equal(true);

      // Verify all values were persisted to file
      const cacheFilePath = path.join(tmpDir, 'cache.json');
      const fileContent = await fs.readFile(cacheFilePath, 'utf8');
      const parsedData = JSON.parse(fileContent);

      expect(parsedData['dongle:port']).to.equal('/dev/ttyUSB0');
      expect(parsedData['dongle:baud']).to.equal(57_600);
      expect(parsedData['dongle:configured']).to.equal(true);
    });

    it('overwrites existing values with bulk update', async () => {
      // Set initial values
      await cacheStorage.set('dongle:port', '/dev/ttyUSB0');
      await cacheStorage.set('dongle:baud', 57_600);

      // Bulk update with some overwritten and some new values
      await cacheStorage.set({
        'dongle:baud': 115_200,
        'dongle:configured': true,
        'dongle:port': '/dev/ttyUSB1',
      });

      expect(cacheStorage.get('dongle:port')).to.equal('/dev/ttyUSB1');
      expect(cacheStorage.get('dongle:baud')).to.equal(115_200);
      expect(cacheStorage.get('dongle:configured')).to.equal(true);
    });

    it('handles partial bulk updates', async () => {
      // Set initial values
      await cacheStorage.set('dongle:port', '/dev/ttyUSB0');
      await cacheStorage.set('dongle:baud', 57_600);

      // Partial bulk update
      await cacheStorage.set({
        'dongle:configured': true,
      });

      // Original values should remain unchanged
      expect(cacheStorage.get('dongle:port')).to.equal('/dev/ttyUSB0');
      expect(cacheStorage.get('dongle:baud')).to.equal(57_600);
      // New value should be set
      expect(cacheStorage.get('dongle:configured')).to.equal(true);
    });
  });

  describe('getAll', () => {
    beforeEach(async () => {
      await cacheStorage.init();
    });

    it('returns empty object when cache is empty', () => {
      const result = cacheStorage.getAll();
      expect(result).to.deep.equal({});
    });

    it('returns all cache values', async () => {
      await cacheStorage.set({
        'dongle:baud': 57_600,
        'dongle:configured': true,
        'dongle:port': '/dev/ttyUSB0',
      });

      const result = cacheStorage.getAll();
      expect(result).to.deep.equal({
        'dongle:baud': 57_600,
        'dongle:configured': true,
        'dongle:port': '/dev/ttyUSB0',
      });
    });

    it('returns partial cache values when some are undefined', async () => {
      await cacheStorage.set('dongle:port', '/dev/ttyUSB0');
      await cacheStorage.set('dongle:baud', 115_200);

      const result = cacheStorage.getAll();
      expect(result).to.deep.equal({
        'dongle:baud': 115_200,
        'dongle:port': '/dev/ttyUSB0',
      });
    });

    it('returns a copy of cache data (not a reference)', async () => {
      await cacheStorage.set('dongle:port', '/dev/ttyUSB0');

      const result = cacheStorage.getAll();
      result['dongle:port'] = '/dev/ttyUSB1';

      // Original cache should remain unchanged
      expect(cacheStorage.get('dongle:port')).to.equal('/dev/ttyUSB0');
    });

    it('reflects changes after cache updates', async () => {
      await cacheStorage.set('dongle:port', '/dev/ttyUSB0');

      let result = cacheStorage.getAll();
      expect(result).to.deep.equal({
        'dongle:port': '/dev/ttyUSB0',
      });

      await cacheStorage.set('dongle:baud', 57_600);

      result = cacheStorage.getAll();
      expect(result).to.deep.equal({
        'dongle:baud': 57_600,
        'dongle:port': '/dev/ttyUSB0',
      });
    });
  });

  describe('integration', () => {
    it('persists data across different CacheStorage instances', async () => {
      // First instance: set some data
      await cacheStorage.init();
      await cacheStorage.set('dongle:port', '/dev/ttyUSB0');
      await cacheStorage.set('dongle:baud', 57_600);

      // Second instance: load the same cache directory
      const secondCache = new CacheStorage({ cacheDir: tmpDir });
      await secondCache.init();

      // Verify data persisted
      expect(secondCache.get('dongle:port')).to.equal('/dev/ttyUSB0');
      expect(secondCache.get('dongle:baud')).to.equal(57_600);
    });
  });
});
