// release-check.cjs - Validates release evidence before publish (US-007)
// Run: npm run release:check
// Must pass: lint, test, high-risk harness, occlusion baseline
const { execSync } = require('child_process');

function run(name, command) {
  console.log(`\n--- ${name} ---`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`${name}: PASS`);
    return true;
  } catch {
    console.error(`${name}: FAIL`);
    return false;
  }
}

function main() {
  console.log('Release evidence check (smoke suite, high-risk matrix, profiling baseline, CI pass)');
  const checks = [
    ['Lint', 'npm run lint'],
    ['Tests', 'npm test'],
    ['High-risk harness', 'npm run harness:high-risk'],
    ['Occlusion baseline', 'npm run harness:occlusion-baseline']
  ];

  let allPass = true;
  for (const [name, cmd] of checks) {
    if (!run(name, cmd)) allPass = false;
  }

  if (!allPass) {
    console.error('\nRelease check FAILED. Fix failures before running release:publish.');
    process.exit(1);
  }
  console.log('\nAll release checks PASSED.');
}

main();
