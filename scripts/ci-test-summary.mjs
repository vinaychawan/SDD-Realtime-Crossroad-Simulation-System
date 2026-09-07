#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const coverageSummaryPath = 'coverage/coverage-summary.json';
const coverageThreshold = Number.parseFloat(process.env.COVERAGE_THRESHOLD ?? '100');

function tail(value, maxLines = 120) {
  return value
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-maxLines)
    .join('\n');
}

function runStep(label, command, args) {
  const startedAt = Date.now();
  console.log(`\n[ci] ${label}...`);

  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: process.env,
    shell: false
  });

  const durationSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);

  if (result.status !== 0) {
    console.error(`[ci] ${label} failed after ${durationSeconds}s`);
    const output = [result.stdout ?? '', result.stderr ?? ''].filter(Boolean).join('\n');
    console.error(tail(output));
    process.exit(result.status ?? 1);
  }

  console.log(`[ci] ${label} passed in ${durationSeconds}s`);
  return result;
}

function readCoverageSummary() {
  if (!existsSync(coverageSummaryPath)) {
    console.error(`[ci] Missing coverage summary: ${coverageSummaryPath}`);
    process.exit(1);
  }

  const summary = JSON.parse(readFileSync(coverageSummaryPath, 'utf8'));
  const total = summary.total;

  if (!total) {
    console.error('[ci] Invalid coverage summary: missing total coverage object');
    process.exit(1);
  }

  return {
    statements: total.statements.pct,
    branches: total.branches.pct,
    functions: total.functions.pct,
    lines: total.lines.pct
  };
}

function assertCoverage(metrics) {
  const failedMetrics = Object.entries(metrics)
    .filter(([, percentage]) => percentage < coverageThreshold)
    .map(([name, percentage]) => `${name}=${percentage}%`);

  console.log('\n[ci] Coverage summary');
  for (const [name, percentage] of Object.entries(metrics)) {
    console.log(`[ci] ${name}: ${percentage}%`);
  }

  if (failedMetrics.length > 0) {
    console.error(`[ci] Coverage gate failed. Required >= ${coverageThreshold}%: ${failedMetrics.join(', ')}`);
    process.exit(1);
  }

  console.log(`[ci] Coverage gate passed. Required >= ${coverageThreshold}%`);
}

runStep('Build', 'npm', ['run', 'build']);
runStep('Tests with coverage', 'npm', ['run', 'test:coverage:summary']);
assertCoverage(readCoverageSummary());
console.log('\n[ci] Docker-compatible test summary completed successfully.');
