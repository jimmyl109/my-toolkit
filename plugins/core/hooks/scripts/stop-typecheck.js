#!/usr/bin/env node
/**
 * Stop Hook: typecheck edited TS/JS files (id: stop-typecheck)
 *
 * Takes the files edited during this response (see post-edit-accumulator.js), groups them by
 * nearest tsconfig.json and runs one `tsc --noEmit` per group using the project's own TypeScript
 * (`npx --no-install`: never downloads a compiler). Only errors located in the edited files are
 * reported. On errors the hook exits 2 so Claude fixes them before finishing; if a previous Stop
 * hook already blocked this turn (stop_hook_active) it only shows a warning, so it blocks at most once.
 *
 * Disable with MY_TOOLKIT_DISABLED_HOOKS=stop-typecheck. Formatting is a separate hook (stop-format).
 *
 * Adapted from ECC scripts/hooks/stop-format-typecheck.js (typecheck half only; reports through
 * exit code 2 instead of stderr, which ECC's exit-0 hook discarded).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { runHook } = require('./lib/hook-io');
const { consume, isPluginClonePath, findUp } = require('./lib/edited-files');

const TIMEOUT_MS = 120000;
const toPosix = p => p.split(path.sep).join('/');

function typecheck(tsDir, files) {
  const result = spawnSync('npx', ['--no-install', 'tsc', '--noEmit', '--pretty', 'false'], {
    cwd: tsDir, encoding: 'utf8', timeout: TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024
  });
  if (result.error || result.status === 0) return [];
  const lines = ((result.stdout || '') + '\n' + (result.stderr || '')).split('\n');
  const wanted = files.map(f => toPosix(path.relative(tsDir, f)));
  return lines.filter(line => wanted.some(rel => line.startsWith(rel + '(') || line.startsWith(rel + ':')));
}

runHook('stop-typecheck', ({ input, block, message }) => {
  const cwd = input.cwd || process.cwd();
  const groups = new Map();
  for (const file of consume(input, 'typecheck')) {
    if (!fs.existsSync(file) || file.includes(`${path.sep}node_modules${path.sep}`) || isPluginClonePath(file, cwd)) continue;
    const tsDir = findUp(path.dirname(file), dir => fs.existsSync(path.join(dir, 'tsconfig.json')));
    if (!tsDir) continue;
    if (!groups.has(tsDir)) groups.set(tsDir, []);
    groups.get(tsDir).push(file);
  }

  const errors = [];
  for (const [tsDir, files] of groups) errors.push(...typecheck(tsDir, files));
  if (errors.length === 0) return;

  const report = `TypeScript errors in files edited this turn:\n${errors.slice(0, 30).join('\n')}` +
    (errors.length > 30 ? `\n(+${errors.length - 30} more)` : '');
  if (input.stop_hook_active) {
    message(report + '\nThese remain after one fix attempt.');
  } else {
    block(report + '\nFix these type errors before finishing.');
  }
});
