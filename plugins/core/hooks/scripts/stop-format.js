#!/usr/bin/env node
/**
 * Stop Hook: format edited TS/JS files (id: stop-format, OFF by default)
 *
 * Runs the project's own Prettier or Biome (from node_modules/.bin, never downloaded) over the files
 * edited during this response. Separate from stop-typecheck so it can be switched on or off on its
 * own. Enable with MY_TOOLKIT_ENABLE_HOOKS=stop-format; it rewrites files, so it ships disabled.
 *
 * Adapted from ECC scripts/hooks/stop-format-typecheck.js + lib/resolve-formatter.js (format half
 * only; package-manager runner fallbacks and Windows shims removed).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { runHook } = require('./lib/hook-io');
const { consume, isPluginClonePath, findUp } = require('./lib/edited-files');

const BIOME_CONFIGS = ['biome.json', 'biome.jsonc'];
const PRETTIER_CONFIGS = [
  '.prettierrc', '.prettierrc.json', '.prettierrc.js', '.prettierrc.cjs', '.prettierrc.mjs',
  '.prettierrc.yml', '.prettierrc.yaml', '.prettierrc.toml',
  'prettier.config.js', 'prettier.config.cjs', 'prettier.config.mjs'
];

function hasPrettierKey(root) {
  try { return Boolean(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).prettier); } catch { return false; }
}

function detectFormatter(root) {
  const has = names => names.some(n => fs.existsSync(path.join(root, n)));
  if (has(BIOME_CONFIGS)) return 'biome';
  if (has(PRETTIER_CONFIGS) || hasPrettierKey(root)) return 'prettier';
  return null;
}

runHook('stop-format', ({ input }) => {
  const cwd = input.cwd || process.cwd();
  const byRoot = new Map();
  for (const file of consume(input, 'format')) {
    if (!fs.existsSync(file) || file.includes(`${path.sep}node_modules${path.sep}`) || isPluginClonePath(file, cwd)) continue;
    const root = findUp(path.dirname(file), dir => fs.existsSync(path.join(dir, 'package.json')));
    if (!root) continue;
    if (!byRoot.has(root)) byRoot.set(root, []);
    byRoot.get(root).push(file);
  }

  for (const [root, files] of byRoot) {
    const formatter = detectFormatter(root);
    if (!formatter) continue;
    const bin = path.join(root, 'node_modules', '.bin', formatter);
    if (!fs.existsSync(bin)) continue;
    const args = formatter === 'biome' ? ['check', '--write', ...files] : ['--write', ...files];
    spawnSync(bin, args, { cwd: root, stdio: 'ignore', timeout: 60000 });
  }
});
