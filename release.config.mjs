export default {
  branches: [
    'main',
    {
      name: 'beta',
      prerelease: true,
    },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    '@semantic-release/npm',
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'CHANGELOG.md'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [
          {
            path: 'binaries/enocean-cli-alpine-arm64',
            label: 'Alpine ARM64',
          },
          {
            path: 'binaries/enocean-cli-linux-x64',
            label: 'Linux x64',
          },
          {
            path: 'binaries/enocean-cli-macos-arm64',
            label: 'MacOS (M chips)',
          },
          {
            path: 'binaries/enocean-cli-win-x64.exe',
            label: 'Windows x64',
          },
        ],
      },
    ],
  ],
};
