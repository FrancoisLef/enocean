import { expect } from 'chai';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('node:fs/promises');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('node:path');

import { FileStorage } from '../../../src/shared/storage/file.storage';

describe('Storage', () => {
  let tmpDir: string;
  let storage: FileStorage;

  beforeEach(async () => {
    storage = new FileStorage();
    // Create a unique temporary directory next to the test file
    tmpDir = path.join(
      __dirname,
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
      } catch {}

      expect(fileExistsAfter).to.equal(true);

      // Verify content is an empty object
      const content = await fs.readFile(filePath, 'utf8');
      expect(JSON.parse(content)).to.deep.equal({});
    });

    it('does not modify existing files', async () => {
      const filename = 'test-existing.json';
      const filePath = path.join(tmpDir, filename);
      const testData = { test: 'data' };

      // Create the file with test content
      await fs.writeFile(filePath, JSON.stringify(testData), 'utf8');

      // Run the function
      await storage.accessFile(tmpDir, filename);

      // Verify content is unchanged
      const content = await fs.readFile(filePath, 'utf8');
      expect(JSON.parse(content)).to.deep.equal(testData);
    });

    it('creates directories recursively if needed', async () => {
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
      } catch {}

      expect(fileExists).to.equal(true);
    });
  });

  describe('readJSON', () => {
    it('reads and parses JSON from existing file', async () => {
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
      expect(result).to.deep.equal(testData);
    });

    it('reads empty JSON object', async () => {
      const filename = 'empty.json';
      const filePath = path.join(tmpDir, filename);

      // Create file with empty object
      await fs.writeFile(filePath, JSON.stringify({}), 'utf8');

      const result = await storage.readJSON(tmpDir, filename);
      expect(result).to.deep.equal({});
    });

    it('reads JSON with various data types', async () => {
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
      expect(result).to.deep.equal(testData);
    });

    it('throws error when file does not exist', async () => {
      const filename = 'nonexistent.json';

      try {
        await storage.readJSON(tmpDir, filename);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it('throws error when file contains invalid JSON', async () => {
      const filename = 'invalid.json';
      const filePath = path.join(tmpDir, filename);

      // Create file with invalid JSON
      await fs.writeFile(filePath, '{ invalid json }', 'utf8');

      try {
        await storage.readJSON(tmpDir, filename);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });

  describe('writeJSON', () => {
    it('writes and formats JSON to file', async () => {
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
      expect(result).to.deep.equal(testData);

      // Verify file was created and contains correct data
      const fileExists = await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).to.equal(true);

      const fileContent = await fs.readFile(filePath, 'utf8');
      const parsedContent = JSON.parse(fileContent);
      expect(parsedContent).to.deep.equal(testData);

      // Verify file is formatted (has indentation)
      expect(fileContent).to.include('\n');
      expect(fileContent).to.include('  ');
    });

    it('writes empty object', async () => {
      const filename = 'empty-write.json';
      const filePath = path.join(tmpDir, filename);
      const testData = {};

      await storage.writeJSON(testData, tmpDir, filename);

      const fileContent = await fs.readFile(filePath, 'utf8');
      expect(JSON.parse(fileContent)).to.deep.equal({});
    });

    it('overwrites existing file', async () => {
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
      expect(JSON.parse(fileContent)).to.deep.equal(newData);
    });

    it('writes to existing directories', async () => {
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
      expect(JSON.parse(fileContent)).to.deep.equal(testData);
    });

    it('throws error when parent directories do not exist', async () => {
      const nestedPath = path.join(tmpDir, 'nonexistent', 'directory');
      const filename = 'should-fail.json';
      const testData = { should: 'fail' };

      try {
        await storage.writeJSON(testData, nestedPath, filename);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });

    it('handles complex nested objects', async () => {
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
      expect(JSON.parse(fileContent)).to.deep.equal(testData);
    });
  });

  describe('integration', () => {
    it('writes and then reads the same data', async () => {
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
      expect(readData).to.deep.equal(testData);
    });

    it('works with accessFile to ensure file exists before reading', async () => {
      const filename = 'access-then-read.json';

      // Ensure file exists (should create empty object)
      await storage.accessFile(tmpDir, filename);

      // Read the file
      const data = await storage.readJSON(tmpDir, filename);
      expect(data).to.deep.equal({});

      // Write some data
      const testData = { added: 'data' };
      await storage.writeJSON(testData, tmpDir, filename);

      // Read it back
      const updatedData = await storage.readJSON(tmpDir, filename);
      expect(updatedData).to.deep.equal(testData);
    });
  });
});
