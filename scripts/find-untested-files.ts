#!/usr/bin/env tsx

/**
 * 🔍 UNTESTED FILES DETECTOR
 * Zero Tolerance Policy - NO EXCEPTIONS ALLOWED
 *
 * This script scans the entire codebase for TypeScript files without corresponding tests.
 * ANY untested file will cause immediate failure - this is MANDATORY.
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, relative, basename } from 'path';

interface UntestedFile {
  path: string;
  size: number;
  reason: string;
}

// Directories to scan for source files
const SOURCE_DIRS = [
  'packages/ai/src',
  'packages/communication/src',
  'packages/orchestration/src',
  'apps/server/src'
];

// ALLOWED EXCEPTIONS - ONLY these files can be untested (and even then, they must be simple)
const ALLOWED_EXCEPTIONS = [
  /\.d\.ts$/,           // Type definition files only
  /^index\.ts$/,        // Index files (must be simple export-only)
  /types\.ts$/,         // Pure type/interface files
  /constants\.ts$/,     // Pure constant files
  /__tests__\//,        // Test directories
  /__mocks__\//,        // Mock directories
];

function isSimpleIndexFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    // Simple index file: only export statements, comments, and empty lines
    return lines.every(line =>
      line.startsWith('export') ||
      line.startsWith('//') ||
      line.startsWith('/*') ||
      line.startsWith('*') ||
      line === '' ||
      line.startsWith('import') // Allow imports in index files
    );
  } catch {
    return false;
  }
}

function isSimpleTypeFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');

    // Simple type file: only interfaces, types, enums (no logic)
    const hasLogic = /function |class |const .*=.*=>|if \(|switch \(|for \(|while \(/.test(content);
    return !hasLogic;
  } catch {
    return false;
  }
}

function isSimpleConstantFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');

    // Simple constant file: only const declarations and exports
    const lines = content.split('\n').filter(line => line.trim());
    return lines.every(line =>
      line.startsWith('export const') ||
      line.startsWith('const') ||
      line.startsWith('//') ||
      line.startsWith('/*') ||
      line === '' ||
      line.startsWith('import')
    );
  } catch {
    return false;
  }
}

function shouldHaveTests(filePath: string): boolean {
  const fileName = basename(filePath);

  // Check if it's in allowed exceptions
  if (ALLOWED_EXCEPTIONS.some(pattern => pattern.test(filePath) || pattern.test(fileName))) {
    // Additional validation for "simple" files
    if (fileName === 'index.ts' && !isSimpleIndexFile(filePath)) {
      return true; // Complex index file needs tests
    }
    if (fileName.endsWith('types.ts') && !isSimpleTypeFile(filePath)) {
      return true; // Complex type file needs tests
    }
    if (fileName === 'constants.ts' && !isSimpleConstantFile(filePath)) {
      return true; // Complex constant file needs tests
    }
    return false; // Simple file, no tests needed
  }

  return true; // All other .ts/.tsx files MUST have tests
}

function hasTestFile(sourceFile: string): boolean {
  const dir = join(sourceFile, '..');
  const baseName = basename(sourceFile, '.ts').replace('.tsx', '');

  // Possible test file patterns
  const possibleTestPatterns = [
    join(dir, `${baseName}.test.ts`),
    join(dir, `${baseName}.test.tsx`),
    join(dir, `${baseName}.spec.ts`),
    join(dir, `${baseName}.spec.tsx`),
    join(dir, '__tests__', `${baseName}.test.ts`),
    join(dir, '__tests__', `${baseName}.test.tsx`),
    join(dir, '__tests__', `${baseName}.spec.ts`),
    join(dir, '__tests__', `${baseName}.spec.tsx`),
  ];

  return possibleTestPatterns.some(pattern => existsSync(pattern));
}

function scanDirectory(dir: string, rootDir: string): UntestedFile[] {
  const untestedFiles: UntestedFile[] = [];

  if (!existsSync(dir)) {
    console.warn(`⚠️  Directory not found: ${dir}`);
    return untestedFiles;
  }

  function scan(currentDir: string): void {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip certain directories
        if (!item.startsWith('.') && !['node_modules', 'dist', 'build', '__tests__', '__mocks__'].includes(item)) {
          scan(fullPath);
        }
      } else if ((item.endsWith('.ts') || item.endsWith('.tsx')) && !item.endsWith('.d.ts')) {
        if (shouldHaveTests(fullPath) && !hasTestFile(fullPath)) {
          const relativePath = relative(rootDir, fullPath);
          untestedFiles.push({
            path: relativePath,
            size: stat.size,
            reason: 'No corresponding test file found',
          });
        }
      }
    }
  }

  scan(dir);
  return untestedFiles;
}

function main(): void {
  console.log('\n🔎 Scanning for untested TypeScript files...\n');

  const allUntestedFiles: UntestedFile[] = [];

  SOURCE_DIRS.forEach(sourceDir => {
    console.log(`📂 Scanning: ${sourceDir}`);
    const rootDir = join(process.cwd(), sourceDir.split('/')[0]); // Get the package/app root
    const untestedInDir = scanDirectory(join(process.cwd(), sourceDir), rootDir);
    allUntestedFiles.push(...untestedInDir);
  });

  if (allUntestedFiles.length > 0) {
    console.error('\n❌ ENFORCEMENT FAILED: Found files without tests\n');
    console.error(`🚨 ${allUntestedFiles.length} file(s) require tests:\n`);

    allUntestedFiles
      .sort((a, b) => b.size - a.size) // Largest files first
      .forEach(({ path, size, reason }) => {
        console.error(`   ❌ ${path}`);
        console.error(`      Size: ${(size / 1024).toFixed(2)} KB`);
        console.error(`      Reason: ${reason}\n`);
      });

    console.error('='.repeat(80));
    console.error('\n📋 REQUIRED ACTIONS:');
    console.error('1. Create test files for ALL listed files above');
    console.error('2. Follow naming convention: <filename>.test.ts or <filename>.spec.ts');
    console.error('3. Or place in __tests__/ directory');
    console.error('4. Ensure each test file covers all functions/classes/exports');
    console.error('5. Cover happy paths, edge cases, and error conditions');
    console.error('\n⛔ THIS IS MANDATORY - no exceptions allowed.\n');

    process.exit(1);
  }

  console.log('\n✅ SUCCESS: All TypeScript files have corresponding tests');
  console.log('🎉 No untested files found\n');

  process.exit(0);
}

main();
