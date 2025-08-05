import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import vitest from '@vitest/eslint-plugin';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  {
    files: ['**/*.test.ts'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.all.rules,
      'vitest/no-hooks': 'off',
    },
  },
  prettier,
  {
    ignores: ['dist/', 'binaries/', 'coverage/', 'tmp/', 'node_modules/'],
  },
);
