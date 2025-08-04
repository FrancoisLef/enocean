import { readFileSync } from 'fs';
import { get } from 'https';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface NpmRegistryResponse {
  version: string;
  name: string;
  description?: string;
}

export async function update(): Promise<void> {
  try {
    // Find package.json - it could be in different locations depending on build/dev context
    let packageJsonPath = join(__dirname, '../../package.json');
    try {
      readFileSync(packageJsonPath, 'utf8');
    } catch {
      // Try relative to current working directory (for built version)
      packageJsonPath = join(
        process.cwd(),
        'node_modules/enocean-cli/package.json',
      );
      try {
        readFileSync(packageJsonPath, 'utf8');
      } catch {
        // Try in the installed global location
        packageJsonPath = join(__dirname, '../package.json');
      }
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const currentVersion = packageJson.version;
    const packageName = packageJson.name;

    console.log(`🔍 Vérification des mises à jour pour ${packageName}...`);
    console.log(`📦 Version actuelle: ${currentVersion}`);

    // Fetch latest version from npm registry using https module
    const latestPackage = await new Promise<NpmRegistryResponse>(
      (resolve, reject) => {
        const url = `https://registry.npmjs.org/${packageName}/latest`;

        get(url, (res) => {
          let data = '';

          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            return;
          }

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json);
            } catch (error) {
              reject(error);
            }
          });
        }).on('error', (error) => {
          reject(error);
        });
      },
    );

    const latestVersion = latestPackage.version;

    console.log(`📦 Dernière version: ${latestVersion}`);

    if (currentVersion === latestVersion) {
      console.log('✅ Vous utilisez déjà la dernière version!');
    } else {
      console.log('🆕 Une nouvelle version est disponible!');
      console.log('');
      console.log('Pour mettre à jour, exécutez:');
      console.log(`   npm install -g ${packageName}@latest`);
      console.log('');
      console.log('Ou avec yarn:');
      console.log(`   yarn global add ${packageName}@latest`);
    }
  } catch (error) {
    console.error(
      '❌ Erreur lors de la vérification des mises à jour:',
      error instanceof Error ? error.message : error,
    );
  }
}
