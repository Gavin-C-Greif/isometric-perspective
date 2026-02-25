// release.cjs - CommonJS build script (kept as .cjs for compatibility with "type":"module")
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const archiver = require('archiver');
const readline = require('readline');

const moduleJson = JSON.parse(fs.readFileSync('module.json', 'utf8'));
const version = moduleJson.version;

function execCommand(command) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch {
        console.error(`Failed to execute command: ${command}`);
        process.exit(1);
    }
}

function updateVersionInFiles() {
    if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        packageJson.version = version;
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    }
}

function createZip() {
    const zipName = 'isometric-perspective.zip';
    const output = fs.createWriteStream(zipName);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        console.log(`Created ${zipName} successfully (${archive.pointer()} bytes).`);
    });

    archive.on('error', (e) => { throw e; });
    archive.pipe(output);
    archive.file('module.json', { name: 'module.json' });

    for (const folder of ['lang', 'scripts', 'templates', 'styles']) {
        if (fs.existsSync(folder)) archive.directory(folder, folder);
    }
    archive.finalize();
}

function askReleaseInfo(callback) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Enter a name or description for the release: ', (info) => {
        rl.close();
        callback(info);
    });
}

console.log(`Starting release for version ${version}...`);
updateVersionInFiles();

const zipPath = path.join(__dirname, 'isometric-perspective.zip');
if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
    console.log(`Removed existing ${zipPath}.`);
}

createZip();

askReleaseInfo((info) => {
    const releaseMessage = `Release v${version} - ${info}`;
    execCommand('git add .');
    execCommand(`git commit -m "${releaseMessage}"`);
    execCommand(`git tag -a v${version} -m "${releaseMessage}"`);
    execCommand('git push');
    execCommand('git push --tags');
    console.log(`\n${releaseMessage}`);
    console.log('Check the workflow and publish release artifacts in the repository:');
    console.log('https://github.com/Gavin-C-Greif/isometric-perspective/actions');
});
