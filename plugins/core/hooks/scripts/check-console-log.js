#!/usr/bin/env node
/**
 * Stop Hook: console.log check (id: check-console-log)
 *
 * After each response, warns (user-visible message) about console.log statements in modified or
 * new JS/TS files. Tests, specs, config files, scripts/ and mocks are excluded.
 * Disable with MY_TOOLKIT_DISABLED_HOOKS=check-console-log.
 *
 * Adapted from ECC scripts/hooks/check-console-log.js: also covers untracked new files, skips
 * commented lines, reports line numbers, and warns via systemMessage (ECC wrote to stderr, which
 * an exit-0 Stop hook discards).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { runHook } = require('./lib/hook-io');

const EXCLUDED = [/\.test\.[jt]sx?$/, /\.spec\.[jt]sx?$/, /\.config\.[jt]s$/, /(^|\/)scripts\//, /__tests__\//, /__mocks__\//];

function git(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.split('\n').filter(Boolean) : [];
}

runHook('check-console-log', ({ input, message }) => {
  if (input.stop_hook_active) return;
  const cwd = input.cwd || process.cwd();
  if (git(cwd, ['rev-parse', '--git-dir']).length === 0) return;

  const files = [...new Set([
    ...git(cwd, ['diff', '--name-only', 'HEAD']),
    ...git(cwd, ['ls-files', '--others', '--exclude-standard'])
  ])]
    .filter(f => /\.(tsx?|jsx?|mjs|cjs)$/.test(f))
    .filter(f => !EXCLUDED.some(re => re.test(f)));

  const hits = [];
  for (const file of files) {
    let content;
    try { content = fs.readFileSync(path.join(cwd, file), 'utf8'); } catch { continue; }
    content.split('\n').forEach((line, i) => {
      const t = line.trim();
      if (line.includes('console.log') && !t.startsWith('//') && !t.startsWith('*')) hits.push(`${file}:${i + 1}`);
    });
  }

  if (hits.length > 0) {
    message(`console.log found in modified files (remove debug logging before committing): ${hits.slice(0, 10).join(', ')}${hits.length > 10 ? ` (+${hits.length - 10} more)` : ''}`);
  }
});
