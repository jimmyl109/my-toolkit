#!/usr/bin/env node
/**
 * Static checks for the repo-level new-project skill (.claude/skills/new-project).
 * It cannot test the conversation itself; it guards the parts that can silently rot:
 * frontmatter, templates, placeholders, JSON validity, and references to agents / catalog entries.
 *
 *   node tests/skills/check.js        exit 0 = all pass, 1 = any failure
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SKILL_DIR = path.join(ROOT, '.claude/skills/new-project');
const TEMPLATES = ['CLAUDE.md.tmpl', 'settings.json.tmpl', 'cloud-setup.md.tmpl', 'NOTES.md.tmpl'];

const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok: Boolean(ok), detail });
const read = p => fs.readFileSync(p, 'utf8');

const skill = read(path.join(SKILL_DIR, 'SKILL.md'));
const front = skill.match(/^---\n([\s\S]*?)\n---/);
check('SKILL.md has frontmatter', front);
const name = front && (front[1].match(/^name:\s*(.+)$/m) || [])[1];
const description = front && (front[1].match(/^description:\s*(.+)$/m) || [])[1];
check('frontmatter name matches directory (new-project)', name === 'new-project', `got ${name}`);
check('frontmatter description is substantial and has trigger phrases', description && description.length > 80 && /start a new project/i.test(description));

for (const t of TEMPLATES) {
  const file = path.join(SKILL_DIR, 'templates', t);
  const exists = fs.existsSync(file);
  check(`template exists: ${t}`, exists);
  if (!exists) continue;
  check(`SKILL.md mentions ${t}`, skill.includes(t));
  const body = read(file);
  for (const ph of new Set(body.match(/\{\{[A-Z_]+\}\}/g) || [])) {
    check(`placeholder ${ph} (${t}) is documented in SKILL.md`, skill.includes(ph));
  }
}

// settings template: valid JSON, right marketplace, core enabled
try {
  const settings = JSON.parse(read(path.join(SKILL_DIR, 'templates/settings.json.tmpl')));
  const src = settings.extraKnownMarketplaces?.['my-toolkit']?.source;
  check('settings template is valid JSON', true);
  check('settings template points at jimmyl109/my-toolkit (github)', src && src.source === 'github' && src.repo === 'jimmyl109/my-toolkit');
  check('settings template enables core@my-toolkit', settings.enabledPlugins?.['core@my-toolkit'] === true);
} catch (err) {
  check('settings template is valid JSON', false, err.message);
}

// catalog / marketplace stay in sync with what the skill reads at run time
const catalog = read(path.join(ROOT, 'CATALOG.md'));
const marketplace = JSON.parse(read(path.join(ROOT, '.claude-plugin/marketplace.json')));
check('SKILL.md tells Claude to read CATALOG.md', skill.includes('CATALOG.md'));
const enableIds = [...catalog.matchAll(/`([a-z0-9-]+)@my-toolkit`/g)].map(m => m[1]);
check('CATALOG.md lists at least one enable id', enableIds.length > 0);
for (const id of enableIds) {
  check(`catalog plugin "${id}" exists in marketplace.json`, marketplace.plugins.some(p => p.name === id));
  check(`catalog plugin "${id}" has a plugin directory`, fs.existsSync(path.join(ROOT, 'plugins', id, '.claude-plugin/plugin.json')));
}

// agents referenced as core:<name> must exist
for (const ref of new Set([...skill.matchAll(/core:([a-z-]+)/g)].map(m => m[1]))) {
  check(`referenced agent core:${ref} exists`, fs.existsSync(path.join(ROOT, 'plugins/core/agents', `${ref}.md`)));
}

// the skill must not hard-code stacks (it is stack-agnostic by design)
check('SKILL.md does not hard-code a kit list (reads CATALOG.md instead)', !/typescript-react@my-toolkit/.test(skill));

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${!r.ok && r.detail ? `  (${r.detail})` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
