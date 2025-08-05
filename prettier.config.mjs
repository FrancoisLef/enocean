/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
export default {
  bracketSpacing: true,
  importOrder: ['^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: [
    'prettier-plugin-packagejson',
    '@trivago/prettier-plugin-sort-imports',
  ],
  singleQuote: true,
  trailingComma: 'all',
};
