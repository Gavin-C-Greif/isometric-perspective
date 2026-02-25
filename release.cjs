// release.cjs - Packaging only (US-007: separated from git operations)
// Run: npm run build
// For git commit/tag/push: npm run release:publish (requires CONFIRM_RELEASE=1)
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const moduleJson = JSON.parse(fs.readFileSync('module.json', 'utf8'));
const version = moduleJson.version;

function updateVersionInFiles() {
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.version = version;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  }
}

function createZip() {
  return new Promise((resolve, reject) => {
    const zipName = 'isometric-perspective.zip';
    const output = fs.createWriteStream(zipName);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`Created ${zipName} (${archive.pointer()} bytes).`);
      resolve();
    });
    archive.on('error', reject);
    archive.pipe(output);
    archive.file('module.json', { name: 'module.json' });

    for (const folder of ['lang', 'scripts', 'templates', 'styles']) {
      if (fs.existsSync(folder)) archive.directory(folder, folder);
    }
    archive.finalize();
  });
}

async function main() {
  console.log(`Packaging version ${version}...`);
  updateVersionInFiles();

  const zipPath = path.join(__dirname, 'isometric-perspective.zip');
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  await createZip();
  console.log('Done. Package ready. Use npm run release:publish for git commit/tag/push (requires CONFIRM_RELEASE=1).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
