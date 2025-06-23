import fs from 'node:fs/promises';
import path from 'node:path';

export class Storage {
  /**
   * Ensures that a file exists at the specified path.
   * If the file does not exist, it creates the file and initializes it with an empty object.
   * If the parent directory does not exist, it creates the directory recursively.
   */
  public async accessFile(...paths: string[]) {
    const file = path.join(...paths);

    try {
      // Check if the file already exists
      await fs.access(file);
    } catch {
      // Create missing intermediate directories
      await fs.mkdir(path.dirname(file), { recursive: true });

      // Finally, create missing file and initialize it with an empty JSON object
      await fs.writeFile(file, JSON.stringify({}), 'utf8');
    }
  }

  public async readJSON<T>(...paths: string[]): Promise<T> {
    const file = path.join(...paths);

    // Read file content and parse it as JSON
    const content = await fs.readFile(file, 'utf8');

    return JSON.parse(content) as T;
  }

  public async writeJSON<T>(data: T, ...paths: string[]): Promise<T> {
    const file = path.join(...paths);

    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');

    return data;
  }
}
