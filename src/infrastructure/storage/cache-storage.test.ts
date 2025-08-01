/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai';
import fs from 'node:fs/promises';
import path from 'node:path';

import { CacheData, CacheStorage } from './cache-storage';

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
      expect(cacheStorage.get('dongle:port')).to.be.undefined;
      expect(cacheStorage.get('dongle:baud')).to.be.undefined;
      expect(cacheStorage.get('dongle:configured')).to.be.undefined;
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

      expect(fileExists).to.be.false;

      // Initialize cache
      const result = await cacheStorage.init();

      // Verify file exists after init
      try {
        await fs.access(cacheFilePath);
        fileExists = true;
      } catch {
        fileExists = false;
      }

      expect(fileExists).to.be.true;
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
      expect(cacheStorage.get('dongle:port')).to.be.undefined;
      expect(cacheStorage.get('dongle:baud')).to.be.undefined;
      expect(cacheStorage.get('dongle:configured')).to.be.undefined;
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
      expect(cacheStorage.get('dongle:configured')).to.be.undefined;
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
