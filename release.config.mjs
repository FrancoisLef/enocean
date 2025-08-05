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
      '@semantic-release/exec',
      {
        verifyReleaseCmd: 'echo ${nextRelease.version} > .VERSION',
      },
    ],
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
            label: 'EnOcean CLI (${nextRelease.gitTag}) linux arm64 (Alpine)',
            name: 'enocean-${nextRelease.gitTag}-alpine-arm64',
          },
          {
            path: 'binaries/enocean-cli-linux-x64',
            label: 'EnOcean CLI (${nextRelease.gitTag}) linux x64',
            name: 'enocean-${nextRelease.gitTag}-linux-x64',
          },
          {
            path: 'binaries/enocean-cli-macos-arm64',
            label: 'EnOcean CLI (${nextRelease.gitTag}) macOS arm64',
            name: 'enocean-${nextRelease.gitTag}-macos-arm64',
          },
          {
            path: 'binaries/enocean-cli-win-x64.exe',
            label: 'EnOcean CLI (${nextRelease.gitTag}) windows x64',
            name: 'enocean-${nextRelease.gitTag}-win-x64.exe',
          },
        ],
      },
    ],
  ],
};
