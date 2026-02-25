import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const BASELINE_SCENARIOS = ['low', 'medium', 'high'];
export const BASELINE_MODES = ['off', 'gpu', 'cpu2', 'cpu4', 'cpu6', 'cpu8', 'cpu10'];

function makeRowKey(scenario, mode) {
  return `${scenario}:${mode}`;
}

export function createBaselineTemplate() {
  return {
    storyId: 'US-003',
    harness: 'occlusion-performance-baseline',
    generatedAt: new Date().toISOString(),
    runMetadata: {
      dateTime: '',
      buildCommit: '',
      foundryVersion: '',
      browserOs: '',
      tester: '',
      notes: ''
    },
    rows: BASELINE_SCENARIOS.flatMap((scenario) =>
      BASELINE_MODES.map((mode) => ({
        scenario,
        mode,
        avgFrameOrFps: '',
        worstFrameOrStutters: '',
        visualQuality: '',
        pass: null
      }))
    )
  };
}

export function evaluateBaselineRun(data) {
  const metadata = data?.runMetadata ?? {};
  const metadataFields = ['dateTime', 'buildCommit', 'foundryVersion', 'browserOs', 'tester'];
  const missingMetadata = metadataFields.filter((field) => !String(metadata[field] ?? '').trim());

  const rowMap = new Map((data?.rows ?? []).map((row) => [makeRowKey(row.scenario, row.mode), row]));
  const results = [];

  for (const scenario of BASELINE_SCENARIOS) {
    for (const mode of BASELINE_MODES) {
      const row = rowMap.get(makeRowKey(scenario, mode)) ?? {};
      const avg = String(row.avgFrameOrFps ?? '').trim();
      const worst = String(row.worstFrameOrStutters ?? '').trim();
      const visual = String(row.visualQuality ?? '').trim();
      const pass = row.pass === true;

      const valid = avg.length > 0 && worst.length > 0 && visual.length > 0 && pass;
      results.push({ scenario, mode, avg, worst, visual, pass, valid });
    }
  }

  const validRows = results.filter((result) => result.valid).length;
  const allRowsValid = validRows === results.length;
  const allMetadataPresent = missingMetadata.length === 0;
  const allPass = allRowsValid && allMetadataPresent;

  return {
    results,
    validRows,
    totalRows: results.length,
    missingMetadata,
    allPass
  };
}

export function formatBaselineReport(evaluation) {
  const lines = ['Occlusion Baseline Harness (US-003)'];
  if (evaluation.missingMetadata.length > 0) {
    lines.push(`- metadata: MISSING ${evaluation.missingMetadata.join(', ')}`);
  } else {
    lines.push('- metadata: COMPLETE');
  }

  for (const result of evaluation.results) {
    lines.push(
      `- ${result.scenario}:${result.mode} | pass=${result.pass ? 'PASS' : 'FAIL'} | metrics=${result.valid ? 'COMPLETE' : 'INCOMPLETE'}`
    );
  }

  lines.push(`Summary: ${evaluation.validRows}/${evaluation.totalRows} rows complete`);
  lines.push(`Overall: ${evaluation.allPass ? 'PASS' : 'FAIL'}`);
  return lines.join('\n');
}

function parseArgs(argv) {
  const args = { init: false, force: false, file: 'occlusion-baseline-run.json' };
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
      const next = argv[i + 1];
      if (!next) throw new Error('Missing value for --file');
      args.file = next;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }
  return args;
}

function writeTemplate(filePath, force) {
  if (fs.existsSync(filePath) && !force) {
    throw new Error(`File already exists: ${filePath}. Use --force to overwrite.`);
  }
  const template = createBaselineTemplate();
  fs.writeFileSync(filePath, `${JSON.stringify(template, null, 2)}\n`, 'utf8');
}

function runCli() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const filePath = path.resolve(process.cwd(), args.file);

    if (args.init) {
      writeTemplate(filePath, args.force);
      console.log(`Initialized occlusion baseline template at ${filePath}`);
      process.exitCode = 0;
      return;
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`Baseline file not found: ${filePath}. Run with --init first.`);
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const evaluation = evaluateBaselineRun(data);
    console.log(formatBaselineReport(evaluation));
    process.exitCode = evaluation.allPass ? 0 : 1;
  } catch (error) {
    console.error(`[occlusion-baseline-harness] ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}

