import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const HIGH_RISK_SCENARIOS = [
  { id: 'projection-switch', title: 'Projection switch' },
  { id: 'pan-zoom', title: 'Pan/zoom' },
  { id: 'scene-switch', title: 'Scene switch' },
  { id: 'token-control-switch', title: 'Token control switch' },
  { id: 'door-state-changes', title: 'Door state changes' }
];

const ALLOWED_STATUSES = new Set(['PASS', 'FAIL', 'PENDING']);

export function createHarnessTemplate() {
  return {
    storyId: 'US-002',
    harness: 'high-risk-interaction-matrix',
    generatedAt: new Date().toISOString(),
    scenarios: HIGH_RISK_SCENARIOS.map((scenario) => ({
      id: scenario.id,
      title: scenario.title,
      status: 'PENDING',
      evidence: ''
    }))
  };
}

export function evaluateHarness(data) {
  const scenarioMap = new Map((data?.scenarios ?? []).map((scenario) => [scenario.id, scenario]));
  const results = HIGH_RISK_SCENARIOS.map((scenario) => {
    const raw = scenarioMap.get(scenario.id) ?? {};
    const status = String(raw.status ?? 'PENDING').toUpperCase();
    const evidence = String(raw.evidence ?? '').trim();
    const normalizedStatus = ALLOWED_STATUSES.has(status) ? status : 'FAIL';
    const pass = normalizedStatus === 'PASS' && evidence.length > 0;

    return {
      id: scenario.id,
      title: scenario.title,
      status: normalizedStatus,
      evidence,
      pass
    };
  });

  const passCount = results.filter((result) => result.pass).length;
  return {
    results,
    passCount,
    total: results.length,
    allPass: passCount === results.length
  };
}

export function formatHarnessReport(evaluation) {
  const lines = ['High-Risk Integration Harness (US-002)'];
  for (const result of evaluation.results) {
    const evidenceText = result.evidence || 'NO_EVIDENCE';
    lines.push(`- ${result.id}: ${result.status} | evidence: ${evidenceText}`);
  }
  lines.push(`Summary: ${evaluation.passCount}/${evaluation.total} scenarios passing`);
  lines.push(`Overall: ${evaluation.allPass ? 'PASS' : 'FAIL'}`);
  return lines.join('\n');
}

function parseArgs(argv) {
  const args = { init: false, force: false, file: 'high-risk-harness.json' };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--init') {
      args.init = true;
      continue;
    }
    if (token === '--force') {
      args.force = true;
      continue;
    }
    if (token === '--file') {
      const file = argv[i + 1];
      if (!file) {
        throw new Error('Missing value for --file');
      }
      args.file = file;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function writeTemplateFile(filePath, force) {
  if (fs.existsSync(filePath) && !force) {
    throw new Error(`File already exists: ${filePath}. Use --force to overwrite.`);
  }
  const template = createHarnessTemplate();
  fs.writeFileSync(filePath, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
  return template;
}

function readJsonFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(text);
}

function runCli() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const filePath = path.resolve(process.cwd(), args.file);

    if (args.init) {
      writeTemplateFile(filePath, args.force);
      console.log(`Initialized high-risk harness template at ${filePath}`);
      process.exitCode = 0;
      return;
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`Harness file not found: ${filePath}. Run with --init first.`);
    }

    const data = readJsonFile(filePath);
    const evaluation = evaluateHarness(data);
    const report = formatHarnessReport(evaluation);
    console.log(report);
    process.exitCode = evaluation.allPass ? 0 : 1;
  } catch (error) {
    console.error(`[high-risk-harness] ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
