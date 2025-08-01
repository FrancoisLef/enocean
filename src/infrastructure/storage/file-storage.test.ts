import { expect } from 'chai';
import fs from 'node:fs/promises';
import path from 'node:path';

import { FileStorage } from './file-storage';

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
});