import fs from 'node:fs/promises';
import path from 'node:path';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';

import { FileStorage } from './file.storage.js';

describe('file storage', () => {
  let tmpDir: string;
  let storage: FileStorage;

  beforeEach(async () => {
    storage = new FileStorage();
    // Create a unique temporary directory next to the test file
    tmpDir = path.join(
      process.cwd(),
      'tmp',
      `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up the temporary directory after each test
    try {
      await fs.rm(tmpDir, { force: true, recursive: true });
    } catch (error) {
      console.error('Failed to clean up temp directory:', error);
    }
  });

  describe('accessFile', () => {
    it('creates a new file when it does not exist', async () => {
      expect.hasAssertions();

      const filename = 'test-new.json';
      const filePath = path.join(tmpDir, filename);

      // Verify file doesn't exist before the test
      let fileExistsBefore = true;
      try {
        await fs.access(filePath);
      } catch {
        fileExistsBefore = false;
      }

      expect(fileExistsBefore).to.equal(false);

      // Run the function
      await storage.accessFile(tmpDir, filename);

      // Verify file exists after
      let fileExistsAfter = false;
      try {
        await fs.access(filePath);
        fileExistsAfter = true;
      } catch {
        //
      }

      expect(fileExistsAfter).to.equal(true);

      // Verify content is an empty object
      const content = await fs.readFile(filePath, 'utf8');

      expect(JSON.parse(content)).toStrictEqual({});
    });

    it('does not modify existing files', async () => {
      expect.hasAssertions();

      const filename = 'test-existing.json';
      const filePath = path.join(tmpDir, filename);
      const testData = { test: 'data' };

      // Create the file with test content
      await fs.writeFile(filePath, JSON.stringify(testData), 'utf8');

      // Run the function
      await storage.accessFile(tmpDir, filename);

      // Verify content is unchanged
      const content = await fs.readFile(filePath, 'utf8');

      expect(JSON.parse(content)).toStrictEqual(testData);
    });

    it('creates directories recursively if needed', async () => {
      expect.hasAssertions();

      const nestedPath = path.join(tmpDir, 'deeply', 'nested', 'directory');
      const filename = 'deep-file.json';

      // Run the function with a nested path
      await storage.accessFile(nestedPath, filename);

      // Verify file exists
      const filePath = path.join(nestedPath, filename);
      let fileExists = false;
      try {
        await fs.access(filePath);
        fileExists = true;
      } catch {
        // void
      }

      expect(fileExists).toBe(true);
    });
  });

  describe('readJSON', () => {
    it('reads and parses JSON from existing file', async () => {
      expect.hasAssertions();

      const filename = 'test-read.json';
      const filePath = path.join(tmpDir, filename);
      const testData = {
        active: true,
        name: 'test',
        nested: { key: 'value' },
        value: 42,
      };

      // Create file with test data
      await fs.writeFile(filePath, JSON.stringify(testData), 'utf8');

      // Read and verify
      const result = await storage.readJSON(tmpDir, filename);

      expect(result).toStrictEqual(testData);
    });

    it('reads empty JSON object', async () => {
      expect.hasAssertions();

      const filename = 'empty.json';
      const filePath = path.join(tmpDir, filename);

      // Create file with empty object
      await fs.writeFile(filePath, JSON.stringify({}), 'utf8');

      const result = await storage.readJSON(tmpDir, filename);

      expect(result).toStrictEqual({});
    });

    it('reads JSON with various data types', async () => {
      expect.hasAssertions();

      const filename = 'types.json';
      const filePath = path.join(tmpDir, filename);
      const testData = {
        array: [1, 2, 3],
        boolean: false,
        float: 45.67,
        null: null,
        number: 123,
        object: { nested: true },
        string: 'text',
      };

      await fs.writeFile(filePath, JSON.stringify(testData), 'utf8');

      const result = await storage.readJSON(tmpDir, filename);

      expect(result).toStrictEqual(testData);
    });

    it('throws error when file does not exist', async () => {
      expect.hasAssertions();

      const filename = 'nonexistent.json';

      await expect(storage.readJSON(tmpDir, filename)).rejects.toBeInstanceOf(
        Error,
      );
    });

    it('throws error when file contains invalid JSON', async () => {
      expect.hasAssertions();

      const filename = 'invalid.json';
      const filePath = path.join(tmpDir, filename);

      // Create file with invalid JSON
      await fs.writeFile(filePath, '{ invalid json }', 'utf8');

      await expect(storage.readJSON(tmpDir, filename)).rejects.toBeInstanceOf(
        Error,
      );
    });
  });

  describe('writeJSON', () => {
    it('writes and formats JSON to file', async () => {
      expect.hasAssertions();

      const filename = 'test-write.json';
      const filePath = path.join(tmpDir, filename);
      const testData = {
        active: true,
        name: 'test',
        value: 42,
      };

      // Write data
      const result = await storage.writeJSON(testData, tmpDir, filename);

      // Verify return value
      expect(result).toStrictEqual(testData);

      // Verify file was created and contains correct data
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      expect(fileExists).to.equal(true);

      const fileContent = await fs.readFile(filePath, 'utf8');
      const parsedContent = JSON.parse(fileContent);

      expect(parsedContent).toStrictEqual(testData);

      // Verify file is formatted (has indentation)
      expect(fileContent).to.include('\n');
      expect(fileContent).to.include('  ');
    });

    it('writes empty object', async () => {
      expect.hasAssertions();

      const filename = 'empty-write.json';
      const filePath = path.join(tmpDir, filename);
      const testData = {};

      await storage.writeJSON(testData, tmpDir, filename);

      const fileContent = await fs.readFile(filePath, 'utf8');

      expect(JSON.parse(fileContent)).toStrictEqual({});
    });

    it('overwrites existing file', async () => {
      expect.hasAssertions();

      const filename = 'overwrite.json';
      const filePath = path.join(tmpDir, filename);
      const originalData = { original: 'data' };
      const newData = { new: 'data', updated: true };

      // Create initial file
      await fs.writeFile(filePath, JSON.stringify(originalData), 'utf8');

      // Overwrite with new data
      await storage.writeJSON(newData, tmpDir, filename);

      // Verify file was overwritten
      const fileContent = await fs.readFile(filePath, 'utf8');

      expect(JSON.parse(fileContent)).toStrictEqual(newData);
    });

    it('writes to existing directories', async () => {
      expect.hasAssertions();

      const nestedPath = path.join(tmpDir, 'nested', 'directory');
      const filename = 'deep-write.json';
      const testData = { deep: 'file' };

      // Create directories first
      await fs.mkdir(nestedPath, { recursive: true });

      // Write to nested path
      await storage.writeJSON(testData, nestedPath, filename);

      // Verify file was created
      const filePath = path.join(nestedPath, filename);
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);

      expect(fileExists).to.equal(true);

      const fileContent = await fs.readFile(filePath, 'utf8');

      expect(JSON.parse(fileContent)).toStrictEqual(testData);
    });

    it('throws error when parent directories do not exist', async () => {
      expect.hasAssertions();

      const nestedPath = path.join(tmpDir, 'nonexistent', 'directory');
      const filename = 'should-fail.json';
      const testData = { should: 'fail' };

      await expect(
        storage.writeJSON(testData, nestedPath, filename),
      ).rejects.toBeInstanceOf(Error);
    });

    it('handles complex nested objects', async () => {
      expect.hasAssertions();

      const filename = 'complex.json';
      const testData = {
        level1: {
          level2: {
            level3: {
              array: [1, 2, { nested: true }],
              mixed: [null, false, 'string', 42],
            },
          },
        },
        metadata: {
          created: '2023-01-01',
          tags: ['test', 'storage', 'json'],
        },
      };

      await storage.writeJSON(testData, tmpDir, filename);

      const filePath = path.join(tmpDir, filename);
      const fileContent = await fs.readFile(filePath, 'utf8');

      expect(JSON.parse(fileContent)).toStrictEqual(testData);
    });
  });

  describe('integration', () => {
    it('writes and then reads the same data', async () => {
      expect.hasAssertions();

      const filename = 'integration.json';
      const testData = {
        integration: 'test',
        nested: {
          deep: {
            value: 'success',
          },
        },
        numbers: [1, 2, 3, 4, 5],
      };

      // Write data
      await storage.writeJSON(testData, tmpDir, filename);

      // Read it back
      const readData = await storage.readJSON(tmpDir, filename);

      // Verify they match
      expect(readData).toStrictEqual(testData);
    });

    it('works with accessFile to ensure file exists before reading', async () => {
      expect.hasAssertions();

      const filename = 'access-then-read.json';

      // Ensure file exists (should create empty object)
      await storage.accessFile(tmpDir, filename);

      // Read the file
      const data = await storage.readJSON(tmpDir, filename);

      expect(data).toStrictEqual({});

      // Write some data
      const testData = { added: 'data' };
      await storage.writeJSON(testData, tmpDir, filename);

      // Read it back
      const updatedData = await storage.readJSON(tmpDir, filename);

      expect(updatedData).toStrictEqual(testData);
    });
  });
});
