#!/usr/bin/env node
/**
 * PreToolUse Hook: Config Protection (id: config-protection)
 *
 * Blocks modifications to existing linter/formatter config files. Agents often
 * weaken these to make a check pass instead of fixing the code.
 *
 * Exit 2 = block (existing config file modified); 0 = allow (not a config
 * file, or first-time creation). To change a config on purpose, switch the
 * hook off temporarily: MY_TOOLKIT_DISABLED_HOOKS=config-protection.
 *
 * Adapted from ECC scripts/hooks/config-protection.js (Python/shell linter
 * entries removed; ECC wrapper/stdin plumbing replaced by lib/hook-io).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { runHook } = require('./lib/hook-io');

const PROTECTED_FILES = new Set([
  // ESLint (legacy + v9 flat config, JS/TS/MJS/CJS)
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yml',
  '.eslintrc.yaml',
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
  // Prettier (all config variants including ESM)
  '.prettierrc',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.json',
  '.prettierrc.yml',
  '.prettierrc.yaml',
  'prettier.config.js',
  'prettier.config.cjs',
  'prettier.config.mjs',
  // Biome's discovered filenames. Custom --config-path/extends targets need
  // reference context; an arbitrary biome.* basename is not sufficient.
  'biome.json',
  'biome.jsonc',
  '.biome.json',
  '.biome.jsonc',
  // Style / Markdown
  '.stylelintrc',
  '.stylelintrc.json',
  '.stylelintrc.yml',
  '.stylelintrc.yaml',
  '.stylelintrc.js',
  '.stylelintrc.cjs',
  '.stylelintrc.mjs',
  // Stylelint's current spelling; only the legacy `.stylelintrc*` forms were
  // listed, so a project using the documented `stylelint.config.js` had no
  // protection at all.
  'stylelint.config.js',
  'stylelint.config.cjs',
  'stylelint.config.mjs',
  'stylelint.config.ts',
  'stylelint.config.mts',
  'stylelint.config.cts',
  '.markdownlint.json',
  '.markdownlint.jsonc',
  '.markdownlint.yaml',
  '.markdownlint.yml',
  '.markdownlint.cjs',
  '.markdownlint.mjs',
  '.markdownlintrc',
  // markdownlint-cli2 reads its own config names, not `.markdownlint.*`.
  '.markdownlint-cli2.jsonc',
  '.markdownlint-cli2.yaml',
  '.markdownlint-cli2.cjs',
  '.markdownlint-cli2.mjs',
  // Ignore files are the cheapest way to make a check pass without touching
  // the code OR the config: adding one path to .eslintignore silences the
  // failing file outright. Blocking the config while leaving its ignore list
  // open left the hook's whole purpose one line away from being defeated.
  // First-time creation stays allowed by the same existence check below.
  '.eslintignore',
  '.prettierignore',
  '.stylelintignore',
  '.markdownlintignore'
]);

/**
 * Exact basenames only catch a tool's canonical entry point. Real repos split
 * flat config across files: a shared `eslint.config.base.mjs` holding the
 * ignore list and rule severities, imported by per-workspace
 * `eslint.config.mjs` files. That is the common monorepo shape, and matching
 * basenames alone protected the leaves while leaving the trunk -- the file that
 * actually carries the rules -- freely editable.
 *
 * These patterns cover `<tool>.config.<qualifier>.<ext>` and
 * `.<tool>rc.<qualifier>.<ext>` for the linters and formatters listed above.
 * They are case-insensitive for the same reason the Set lookup above is.
 *
 * Deliberately NOT matched: build and test tooling -- `vite.config.ts`,
 * `vitest.config.ts`, `jest.config.js`, `playwright.config.ts`,
 * `tsconfig.json`. This hook exists to stop a LINTER config being weakened in
 * place of fixing the code; editing a bundler or test-runner config is
 * ordinary work, and sweeping those in would make the hook obstructive.
 */
const PROTECTED_PATTERNS = [
  // eslint.config.base.mjs, prettier.config.shared.cjs, stylelint.config.local.js ...
  /^(eslint|prettier|stylelint|commitlint|oxlint)\.config(\.[A-Za-z0-9_-]+)*\.(js|mjs|cjs|ts|mts|cts)$/i,
  // .eslintrc.base.json, .prettierrc.shared.yml ...
  /^\.(eslintrc|prettierrc|stylelintrc|markdownlintrc)(\.[A-Za-z0-9_-]+)*\.(js|cjs|mjs|json|jsonc|yml|yaml|toml)$/i,
];

function isProtectedName(basename) {
  const lower = basename.toLowerCase();
  return PROTECTED_FILES.has(basename)
    || PROTECTED_FILES.has(lower)
    || PROTECTED_PATTERNS.some((re) => re.test(basename));
}

runHook('config-protection', ({ input, truncated, block }) => {
  if (truncated) {
    block('Hook input exceeded 1 MiB; refusing to bypass config-protection on a truncated payload. ' +
      'Retry with a smaller edit, or disable the hook temporarily (MY_TOOLKIT_DISABLED_HOOKS=config-protection).');
  }

  const filePath = input?.tool_input?.file_path || input?.tool_input?.file || '';
  if (!filePath) return;

  const basename = path.basename(filePath);
  if (!isProtectedName(basename)) return;

  // First-time creation is allowed: there is no existing config to weaken.
  // Only ENOENT counts as "absent"; any other stat error fails closed.
  try {
    fs.lstatSync(filePath);
  } catch (err) {
    if (err && err.code === 'ENOENT') return;
  }

  block(`BLOCKED: modifying ${basename} is not allowed. Fix the source code to satisfy the linter/formatter ` +
    'instead of weakening its config. If this config change is deliberate, ask the user to switch the hook off ' +
    'temporarily (MY_TOOLKIT_DISABLED_HOOKS=config-protection) rather than working around it.');
});
