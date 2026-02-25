// release-publish.cjs - Git commit/tag/push (US-007: explicit guardrails)
// Requires: CONFIRM_RELEASE=1
// Run release:check first; only then: CONFIRM_RELEASE=1 npm run release:publish
const { spawnSync } = require('child_process');
const readline = require('readline');

const moduleJson = JSON.parse(require('fs').readFileSync('module.json', 'utf8'));
const version = moduleJson.version;

function execCommand(command, args = []) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: false });
  if (result.status !== 0) {
    const rendered = [command, ...args].join(' ');
    console.error(`Command failed: ${rendered}`);
    process.exit(result.status || 1);
  }
}

function askReleaseInfo() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Release description (e.g. "Production hardening"): ', (info) => {
      rl.close();
      resolve(info || 'Release');
    });
  });
}

async function main() {
  if (process.env.CONFIRM_RELEASE !== '1') {
    console.error('release:publish requires explicit confirmation.');
    console.error('Run: CONFIRM_RELEASE=1 npm run release:publish');
    console.error('Ensure release:check passes first: npm run release:check');
    process.exit(1);
  }

  console.log('Running release:check before publish...');
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  execCommand(npmCommand, ['run', 'release:check']);

  const info = await askReleaseInfo();
  const releaseMessage = `Release v${version} - ${info}`;

  execCommand('git', ['add', '.']);
  execCommand('git', ['commit', '-m', releaseMessage]);
  execCommand('git', ['tag', '-a', `v${version}`, '-m', releaseMessage]);
  execCommand('git', ['push']);
  execCommand('git', ['push', '--tags']);

  console.log(`\n${releaseMessage}`);
  console.log('Publish GitHub release artifacts: https://github.com/arlosmolten/isometric-perspective/actions');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
