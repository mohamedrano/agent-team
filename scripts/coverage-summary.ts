#!/usr/bin/env tsx

/**
 * 📊 COVERAGE SUMMARY REPORT
 * Detailed coverage analysis for review and monitoring
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CoverageMetrics {
  pct: number;
  covered: number;
  total: number;
}

interface CoverageSummary {
  total: {
    lines: CoverageMetrics;
    statements: CoverageMetrics;
    functions: CoverageMetrics;
    branches: CoverageMetrics;
  };
  [key: string]: any;
}

const summaryPath = join(process.cwd(), 'coverage/coverage-summary.json');

if (!existsSync(summaryPath)) {
  console.error('❌ Coverage summary file not found');
  console.error('📁 Expected at:', summaryPath);
  console.error('💡 Run: pnpm test:coverage');
  process.exit(1);
}

try {
  const summary: CoverageSummary = JSON.parse(readFileSync(summaryPath, 'utf-8'));
  const { total } = summary;

  console.log('# 📊 Test Coverage Summary\n');
  console.log('| Metric | Coverage | Covered/Total | Status |');
  console.log('|--------|----------|---------------|--------|');

  const metrics = [
    { name: 'Lines', data: total.lines, threshold: 85 },
    { name: 'Statements', data: total.statements, threshold: 85 },
    { name: 'Functions', data: total.functions, threshold: 90 },
    { name: 'Branches', data: total.branches, threshold: 85 },
  ];

  metrics.forEach(({ name, data, threshold }) => {
    const status = data.pct >= threshold ? '✅' : '❌';
    console.log(`| **${name}** | **${data.pct.toFixed(2)}%** | ${data.covered}/${data.total} | ${status} |`);
  });

  // Overall assessment
  const avgCoverage = (
    total.lines.pct +
    total.functions.pct +
    total.branches.pct +
    total.statements.pct
  ) / 4;

  console.log('\n## 📈 Overall Assessment\n');

  if (avgCoverage >= 95) {
    console.log('🌟 **Exceptional** - Outstanding test coverage!');
  } else if (avgCoverage >= 90) {
    console.log('✅ **Excellent** - Well above mandatory requirements');
  } else if (avgCoverage >= 85) {
    console.log('✅ **Good** - Meets mandatory requirements');
  } else if (avgCoverage >= 80) {
    console.log('⚠️ **Acceptable** - Close to minimum threshold');
  } else {
    console.log('❌ **Insufficient** - Below mandatory requirements');
  }

  console.log(`\n📊 Average Coverage: **${avgCoverage.toFixed(2)}%**`);

  // Detailed breakdown by package
  console.log('\n## 📦 Package Breakdown\n');

  const packageCoverage: { [key: string]: any } = {};

  Object.entries(summary).forEach(([filePath, metrics]) => {
    if (filePath === 'total') return;

    let packageName = 'other';
    if (filePath.includes('/ai/')) packageName = 'ai';
    else if (filePath.includes('/orchestration/')) packageName = 'orchestration';
    else if (filePath.includes('/communication/')) packageName = 'communication';
    else if (filePath.includes('/server/')) packageName = 'server';

    if (!packageCoverage[packageName]) {
      packageCoverage[packageName] = { files: 0, total: { lines: 0, functions: 0, branches: 0, statements: 0 } };
    }

    packageCoverage[packageName].files++;
    ['lines', 'functions', 'branches', 'statements'].forEach(metric => {
      packageCoverage[packageName].total[metric] += (metrics as any)[metric].pct;
    });
  });

  console.log('| Package | Files | Avg Lines | Avg Functions | Avg Branches | Avg Statements |');
  console.log('|---------|-------|-----------|----------------|---------------|----------------|');

  Object.entries(packageCoverage).forEach(([pkg, data]: [string, any]) => {
    const avgLines = (data.total.lines / data.files).toFixed(2);
    const avgFunctions = (data.total.functions / data.files).toFixed(2);
    const avgBranches = (data.total.branches / data.files).toFixed(2);
    const avgStatements = (data.total.statements / data.files).toFixed(2);

    console.log(`| ${pkg} | ${data.files} | ${avgLines}% | ${avgFunctions}% | ${avgBranches}% | ${avgStatements}% |`);
  });

  console.log('\n---\n');
  console.log('📅 Generated at:', new Date().toISOString());
  console.log('🎯 Mandatory thresholds: Lines ≥85%, Functions ≥90%, Branches ≥85%, Statements ≥85%');

} catch (error) {
  console.error('❌ Error generating coverage summary:', error);
  process.exit(1);
}
