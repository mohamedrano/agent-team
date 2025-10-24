#!/usr/bin/env tsx

/**
 * 🚨 MANDATORY COVERAGE ENFORCEMENT SCRIPT
 * Zero Tolerance Policy - NO EXCEPTIONS ALLOWED
 *
 * This script enforces strict test coverage requirements across the entire codebase.
 * Any file falling below mandatory thresholds will cause immediate failure.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CoverageMetrics {
  pct: number;
  covered: number;
  total: number;
}

interface CoverageSummary {
  total: CoverageMetrics & {
    lines: CoverageMetrics;
    statements: CoverageMetrics;
    functions: CoverageMetrics;
    branches: CoverageMetrics;
  };
  [filePath: string]: CoverageMetrics | any;
}

// MANDATORY THRESHOLDS - ABSOLUTE MINIMUMS (NO EXCEPTIONS)
const ABSOLUTE_MINIMUMS = {
  global: { lines: 85, functions: 90, branches: 85, statements: 85 },
  // Critical packages - ZERO TOLERANCE
  ai: { lines: 95, functions: 100, branches: 95, statements: 95 },
  orchestration: { lines: 95, functions: 100, branches: 95, statements: 95 },
  communication: { lines: 90, functions: 95, branches: 90, statements: 90 },
  server: { lines: 85, functions: 90, branches: 85, statements: 85 },
  // Utility and core modules
  utils: { lines: 95, functions: 95, branches: 95, statements: 95 },
  core: { lines: 95, functions: 100, branches: 95, statements: 95 },
  services: { lines: 90, functions: 95, branches: 90, statements: 90 },
};

function getPackageCategory(filePath: string): keyof typeof ABSOLUTE_MINIMUMS {
  if (filePath.includes('/ai/')) return 'ai';
  if (filePath.includes('/orchestration/')) return 'orchestration';
  if (filePath.includes('/communication/')) return 'communication';
  if (filePath.includes('/server/')) return 'server';
  if (filePath.includes('/utils/')) return 'utils';
  if (filePath.includes('/core/')) return 'core';
  if (filePath.includes('/services/')) return 'services';
  return 'global';
}

const summaryPath = join(process.cwd(), 'coverage/coverage-summary.json');

if (!existsSync(summaryPath)) {
  console.error('❌ FATAL: Coverage summary file not found');
  console.error('📁 Expected at:', summaryPath);
  console.error('💡 Run: pnpm test:coverage');
  process.exit(1);
}

try {
  const summary: CoverageSummary = JSON.parse(
    readFileSync(summaryPath, 'utf-8')
  );

  const failures: string[] = [];
  const warnings: string[] = [];

  // Enforce MANDATORY coverage thresholds
  console.log('\n🔍 Enforcing MANDATORY coverage thresholds...\n');

  const total = summary.total;
  console.log('📊 Global Coverage:');
  console.log(`   Lines:      ${total.lines.pct.toFixed(2)}% (required: ≥${ABSOLUTE_MINIMUMS.global.lines}%)`);
  console.log(`   Functions:  ${total.functions.pct.toFixed(2)}% (required: ≥${ABSOLUTE_MINIMUMS.global.functions}%)`);
  console.log(`   Branches:   ${total.branches.pct.toFixed(2)}% (required: ≥${ABSOLUTE_MINIMUMS.global.branches}%)`);
  console.log(`   Statements: ${total.statements.pct.toFixed(2)}% (required: ≥${ABSOLUTE_MINIMUMS.global.statements}%)`);

  // Check global thresholds
  (['lines', 'functions', 'branches', 'statements'] as const).forEach(metric => {
    const actual = total[metric].pct;
    const required = ABSOLUTE_MINIMUMS.global[metric];

    if (actual < required) {
      failures.push(
        `❌ Global ${metric}: ${actual.toFixed(2)}% < ${required}% (DEFICIT: ${(required - actual).toFixed(2)}%)`
      );
    }
  });

  // Check per-file thresholds
  Object.entries(summary).forEach(([filePath, metrics]) => {
    if (filePath === 'total') return;

    const category = getPackageCategory(filePath);
    const thresholds = ABSOLUTE_MINIMUMS[category];

    // Check each metric for this file
    (['lines', 'functions', 'branches', 'statements'] as const).forEach(metric => {
      const actual = (metrics as CoverageMetrics)[metric].pct;
      const required = thresholds[metric];

      if (actual < required) {
        failures.push(
          `❌ ${filePath}\n   ${metric}: ${actual.toFixed(2)}% < ${required}% (category: ${category})`
        );
      } else if (actual < required + 5) {
        warnings.push(
          `⚠️  ${filePath}\n   ${metric}: ${actual.toFixed(2)}% (close to threshold: ${required}%)`
        );
      }
    });
  });

  // Display results
  console.log('\n' + '='.repeat(80));

  if (failures.length > 0) {
    console.error('\n🚨 COVERAGE ENFORCEMENT FAILED\n');
    console.error('The following files/metrics DO NOT meet mandatory thresholds:\n');
    failures.forEach(failure => console.error(failure));

    console.error('\n' + '='.repeat(80));
    console.error('\n📋 REQUIRED ACTIONS:');
    console.error('1. Add comprehensive tests for the failing files');
    console.error('2. Cover all branches, edge cases, and error paths');
    console.error('3. Re-run: pnpm test:coverage');
    console.error('4. Verify: pnpm run enforce:coverage');
    console.error('\n⛔ MERGE/COMMIT BLOCKED until coverage requirements are met.\n');

    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  WARNING: Some files are close to thresholds:\n');
    warnings.forEach(warning => console.warn(warning));
    console.warn('\n💡 Consider adding more tests to these files.\n');
  }

  console.log('\n✅ ALL MANDATORY COVERAGE THRESHOLDS MET');
  console.log('🎉 Proceeding with merge/commit\n');

  process.exit(0);

} catch (error) {
  console.error('❌ ERROR: Failed to parse coverage summary:', error);
  console.error('💡 Ensure coverage report was generated correctly');
  process.exit(1);
}
