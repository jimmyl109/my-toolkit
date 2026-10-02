#!/usr/bin/env node
/**
 * Hook test harness for plugins/core/hooks/scripts.
 *
 * Builds a throwaway TS/React git project in a temp folder, feeds each hook realistic Claude Code hook
 * payloads on stdin, and checks exit codes and output. No dependencies beyond Node and git; the
 * typecheck/format cases additionally need `npm install typescript prettier` to work (skipped if the
 * install fails, e.g. offline).
 *
 *   node tests/hooks/run.js            run everything, print a markdown pass/fail table
 *   node tests/hooks/run.js --keep     keep the temp project afterwards (path is printed)
 *   node tests/hooks/run.js --offline  skip `npm install` (typecheck/format cases are skipped)
 *
 * Exit code: 0 all pass (skips allowed), 1 any failure.
 *
 * Fake secrets are assembled at runtime so no real-looking credential literal lives in the repo.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SCRIPTS = path.resolve(__dirname, '../../plugins/core/hooks/scripts');
const KEEP = process.argv.includes('--keep');
const OFFLINE = process.argv.includes('--offline');

const FAKE_ANTHROPIC = 'sk-ant-' + 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4';
const FAKE_AWS = 'AKIA' + 'ABCDEFGHIJKLMNOP';
const FAKE_PEM = '-----BEGIN RSA ' + 'PRIVATE KEY-----\nabc\n-----END RSA ' + 'PRIVATE KEY-----\n';

// ---------------------------------------------------------------- sample project
const PROJ = fs.mkdtempSync(path.join(os.tmpdir(), 'my-toolkit-hooktest-'));
const SESSIONS = [];

function write(rel, content) {
  const file = path.join(PROJ, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
function sh(cmd) {
  const r = spawnSync('sh', ['-c', cmd], { cwd: PROJ, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${cmd}\n${r.stderr}`);
}
function reset() { sh('git reset -q --hard HEAD && git clean -fdq -e node_modules'); }
function stage(rel, content) { write(rel, content); sh(`git add -f ${rel}`); }

write('package.json', JSON.stringify({ name: 'sample', private: true, version: '1.0.0' }, null, 2) + '\n');
write('tsconfig.json', JSON.stringify({
  compilerOptions: { strict: true, jsx: 'react-jsx', module: 'esnext', moduleResolution: 'bundler', target: 'es2022', noEmit: true, skipLibCheck: true, allowJs: true, checkJs: true },
  include: ['src']
}, null, 2) + '\n');
write('src/App.tsx', 'export function App({ name }: { name: string }) {\n  return <h1>Hello {name}</h1>;\n}\n');
write('eslint.config.js', "export default [{ rules: { 'no-unused-vars': 'error' } }];\n");
write('.gitignore', 'node_modules\n');
sh('git init -q -b main && git config user.email t@example.com && git config user.name tester && git add -A && git commit -q -m "chore: initial sample"');

let haveTools = false;
if (!OFFLINE) {
  const r = spawnSync('npm', ['install', '--silent', '--no-audit', '--no-fund', 'typescript@5', 'prettier@3'], { cwd: PROJ, encoding: 'utf8', timeout: 240000 });
  haveTools = r.status === 0 && fs.existsSync(path.join(PROJ, 'node_modules/.bin/tsc')) && fs.existsSync(path.join(PROJ, 'node_modules/.bin/prettier'));
}

// ---------------------------------------------------------------- harness
const results = [];

function run(script, payload, env = {}) {
  const e = { ...process.env };
  for (const k of Object.keys(e)) if (k.startsWith('MY_TOOLKIT_')) delete e[k];
  Object.assign(e, env);
  const p = spawnSync('node', [path.join(SCRIPTS, script)], { input: JSON.stringify(payload), encoding: 'utf8', cwd: PROJ, env: e });
  return { code: p.status, out: p.stdout || '', err: p.stderr || '' };
}

function check(hook, name, expectCode, got, must = [], mustNot = []) {
  const text = got.out + got.err;
  const musts = [].concat(must), mustNots = [].concat(mustNot);
  const ok = got.code === expectCode && musts.every(m => text.includes(m)) && !mustNots.some(m => text.includes(m));
  results.push({ hook, name, ok, expect: `exit ${expectCode}${musts.length ? ' + ' + musts.join(', ') : ''}`, got: `exit ${got.code}`, detail: ok ? '' : text.trim().slice(0, 200) });
}
function skip(hook, name, why) { results.push({ hook, name, skipped: why }); }

const bash = (command, extra = {}) => ({ tool_name: 'Bash', tool_input: { command, ...extra }, cwd: PROJ, session_id: 't1' });
const edit = (file, tool = 'Edit', sid = 't1') => ({ tool_name: tool, tool_input: { file_path: file }, cwd: PROJ, session_id: sid });
const stop = (active = false, sid = 't1') => ({ hook_event_name: 'Stop', stop_hook_active: active, cwd: PROJ, session_id: sid });
const off = id => ({ MY_TOOLKIT_DISABLED_HOOKS: id });
const clearEdited = sid => {
  for (const f of fs.readdirSync(os.tmpdir())) if (f.startsWith(`my-toolkit-edited-${sid}-`)) fs.unlinkSync(path.join(os.tmpdir(), f));
  SESSIONS.push(sid);
};

try {
  // ------------------------------------------------------------ config-protection
  let H = 'config-protection', S = 'config-protection.js';
  check(H, 'edit existing eslint.config.js', 2, run(S, edit(PROJ + '/eslint.config.js')), 'BLOCKED');
  check(H, 'edit existing eslint.config.js (MultiEdit)', 2, run(S, edit(PROJ + '/eslint.config.js', 'MultiEdit')), 'BLOCKED');
  check(H, 'write brand-new .prettierrc (first-time creation)', 0, run(S, edit(PROJ + '/.prettierrc', 'Write')));
  check(H, 'edit a normal source file', 0, run(S, edit(PROJ + '/src/App.tsx')));
  check(H, 'edit tsconfig.json (not a linter config)', 0, run(S, edit(PROJ + '/tsconfig.json')));
  check(H, 'switched off via MY_TOOLKIT_DISABLED_HOOKS', 0, run(S, edit(PROJ + '/eslint.config.js'), off(H)));
  check(H, 'switched off via MY_TOOLKIT_HOOKS=off', 0, run(S, edit(PROJ + '/eslint.config.js'), { MY_TOOLKIT_HOOKS: 'off' }));

  // ------------------------------------------------------------ block-no-verify
  H = 'block-no-verify'; S = 'block-no-verify.js';
  for (const [name, cmd] of [
    ['git commit --no-verify', 'git commit --no-verify -m "x"'],
    ['git commit -n', 'git commit -n -m "x"'],
    ['git -c core.hooksPath=', 'git -c core.hooksPath=/dev/null commit -m "x"'],
    ['git push --no-verify', 'git push --no-verify origin main'],
    ['--no-verify inside && chain', 'git add . && git commit --no-verify -m "x"']
  ]) check(H, name, 2, run(S, bash(cmd)), 'BLOCKED');
  check(H, 'normal git commit', 0, run(S, bash('git commit -m "fix: ok"')));
  check(H, '--no-verify only inside a commit message', 0, run(S, bash('git commit -m "docs: explain --no-verify"')));
  check(H, 'non-git command', 0, run(S, bash('ls -la')));
  check(H, 'switched off', 0, run(S, bash('git commit --no-verify -m "x"'), off(H)));

  // ------------------------------------------------------------ dev-server-block
  H = 'dev-server-block'; S = 'pre-bash-dev-server-block.js';
  for (const [name, cmd] of [
    ['foreground npm run dev', 'npm run dev'], ['foreground pnpm dev', 'pnpm dev'], ['foreground yarn dev', 'yarn dev'],
    ['foreground in && chain', 'cd app && npm run dev'], ['foreground in $(...)', 'echo $(npm run dev)'],
    ['foreground with env prefix', 'PORT=3000 npm run dev']
  ]) check(H, name, 2, run(S, bash(cmd)), 'BLOCKED');
  check(H, 'run_in_background=true', 0, run(S, bash('npm run dev', { run_in_background: true })));
  check(H, 'trailing &', 0, run(S, bash('npm run dev &')));
  check(H, 'nohup ... &', 0, run(S, bash('nohup npm run dev > dev.log 2>&1 &')));
  check(H, 'tmux launcher form', 0, run(S, bash('tmux new-session -d -s dev "npm run dev"')));
  check(H, 'dev-docs script is not a dev server', 0, run(S, bash('npm run dev-docs')));
  check(H, 'npm run build', 0, run(S, bash('npm run build')));
  check(H, 'heredoc that merely WRITES "npm run dev" into a doc -> allowed', 0, run(S, bash("cat > CLAUDE.md <<'EOF'\n| Dev server | `npm run dev` |\nEOF")));
  check(H, 'python heredoc writing "npm run dev" into a template -> allowed', 0, run(S, bash("python3 - <<'EOF'\nopen('x','w').write('DEV_CMD: npm run dev')\nEOF")));
  check(H, 'foreground dev server on a NEW LINE is blocked', 2, run(S, bash('echo hi\nnpm run dev')), 'BLOCKED');
  check(H, 'real foreground dev server after a heredoc -> BLOCK', 2, run(S, bash("cat > f <<'EOF'\nnpm run dev\nEOF\nnpm run dev")), 'BLOCKED');
  check(H, 'background dev server on a new line (&) -> allowed', 0, run(S, bash('echo hi\nnpm run dev &')));
  check(H, 'quoted multi-line string mentioning it -> allowed', 0, run(S, bash("echo 'line1\nnpm run dev\nline3'")));
  check(H, 'switched off', 0, run(S, bash('npm run dev'), off(H)));

  // ------------------------------------------------------------ commit-quality
  H = 'commit-quality'; S = 'pre-bash-commit-quality.js';
  const commit = msg => bash(`git commit -m "${msg}"`);
  reset(); stage('src/secret.ts', `export const k = "${FAKE_ANTHROPIC}";\n`);
  check(H, 'fake Anthropic key staged -> BLOCK', 2, run(S, commit('feat: add')), ['BLOCKED', 'Anthropic']);
  check(H, 'fake key but switched off', 0, run(S, commit('feat: add'), off(H)));
  reset(); stage('src/aws.ts', `export const a = "${FAKE_AWS}";\n`);
  check(H, 'fake AWS key staged -> BLOCK', 2, run(S, commit('feat: add')), 'AWS');
  reset(); stage('deploy/key.pem', FAKE_PEM);
  check(H, 'private key block staged -> BLOCK', 2, run(S, commit('feat: add')), 'private key');
  reset(); stage('.env', 'DATABASE_URL=postgres://x\n');
  check(H, '.env staged -> BLOCK', 2, run(S, commit('feat: add')), '.env');
  reset(); stage('.env.example', 'DATABASE_URL=\n');
  check(H, '.env.example staged -> allowed', 0, run(S, commit('feat: add')), [], 'BLOCKED');
  reset(); stage('src/ok.ts', 'export const k = process.env.API_KEY;\nconst apiKey = "YOUR_API_KEY";\n');
  check(H, 'placeholder values (process.env, YOUR_API_KEY) -> allowed', 0, run(S, commit('feat: add config')), [], ['BLOCKED', 'secret']);
  reset(); stage('src/dbg.ts', 'console.log("x");\ndebugger;\n// TODO: fix this later\nexport const a = 1;\n');
  check(H, 'console.log + debugger + TODO -> warnings via additionalContext', 0, run(S, commit('feat: add dbg')), ['additionalContext', 'console.log', 'debugger', 'TODO']);
  reset(); stage('src/clean.ts', 'export const a = 1;\n');
  check(H, 'clean commit, good message -> silent', 0, run(S, commit('feat: add clean file')), [], ['additionalContext', 'BLOCKED']);
  check(H, 'poor message -> warning', 0, run(S, commit('Updated stuff.')), ['additionalContext', 'type(scope)']);
  check(H, 'HEREDOC message with good subject -> no message warning', 0,
    run(S, bash("git commit -m \"$(cat <<'EOF'\nfeat: add clean file\n\nbody text\nEOF\n)\"")), [], 'additionalContext');
  check(H, 'non-commit git command ignored', 0, run(S, bash('git status')), [], ['additionalContext', 'BLOCKED']);
  reset(); fs.appendFileSync(path.join(PROJ, 'src/App.tsx'), `export const k = "${FAKE_ANTHROPIC}";\n`);
  check(H, '`git commit -am` scans unstaged tracked edits -> BLOCK', 2, run(S, bash('git commit -am "feat: x"')), 'BLOCKED');
  reset(); write('src/chain.ts', `export const k = "${FAKE_ANTHROPIC}";\n`);
  check(H, 'chained `git add file && git commit` (nothing staged yet) -> BLOCK', 2, run(S, bash('git add src/chain.ts && git commit -m "feat: x"')), 'src/chain.ts');
  check(H, 'chained `git add -A && git commit` -> BLOCK', 2, run(S, bash('git add -A && git commit -m "feat: x"')), 'src/chain.ts');
  check(H, 'chained `git add . ; git commit` -> BLOCK', 2, run(S, bash('git add . ; git commit -m "feat: x"')), 'src/chain.ts');
  check(H, 'chained add of a DIFFERENT clean path ignores unrelated secret file', 0, run(S, bash('git add src/App.tsx && git commit -m "feat: x"')), [], 'BLOCKED');
  reset();
  check(H, 'file created+committed in one command; secret literal in command text -> BLOCK', 2,
    run(S, bash(`printf 'export const k = "${FAKE_ANTHROPIC}";' > src/new.ts && git add src/new.ts && git commit -m 'feat: x'`)), 'command text');
  reset();

  // ------------------------------------------------------------ check-console-log
  H = 'check-console-log'; S = 'check-console-log.js';
  write('src/Dbg.tsx', "export const D = () => { console.log('x'); return null; };\n");
  check(H, 'untracked file with console.log -> user-visible warning', 0, run(S, stop()), ['systemMessage', 'src/Dbg.tsx:1']);
  check(H, 'stop_hook_active -> silent', 0, run(S, stop(true)), [], 'systemMessage');
  check(H, 'switched off', 0, run(S, stop(false), off(H)), [], 'systemMessage');
  fs.unlinkSync(path.join(PROJ, 'src/Dbg.tsx'));
  check(H, 'clean tree -> silent', 0, run(S, stop()), [], 'systemMessage');

  // ------------------------------------------------------------ stop-typecheck
  H = 'stop-typecheck'; S = 'stop-typecheck.js';
  if (!haveTools) {
    for (const name of ['deliberate type error -> BLOCK', 'stop_hook_active -> warn only', 'fixed file passes', 'JS file error (checkJs) -> BLOCK', 'switched off', 'no edits -> silent']) skip(H, name, 'typescript not installed (offline?)');
  } else {
    const record = (file, env = {}) => run('post-edit-accumulator.js', edit(file, 'Write', 'tc'), env);
    clearEdited('tc'); clearEdited('tc-none');
    write('src/Bad.ts', 'export const n: number = "not a number";\n');
    record(PROJ + '/src/Bad.ts');
    check(H, 'deliberate type error -> BLOCK stop with error text', 2, run(S, stop(false, 'tc')), ['src/Bad.ts(1', 'TS2322']);
    record(PROJ + '/src/Bad.ts');
    check(H, 'same error with stop_hook_active -> warns, does not block again', 0, run(S, stop(true, 'tc')), 'systemMessage');
    write('src/Bad.ts', 'export const n: number = 1;\n');
    record(PROJ + '/src/Bad.ts');
    check(H, 'fixed file -> passes', 0, run(S, stop(false, 'tc')), [], ['BLOCK', 'TS2322']);
    write('src/legacy.js', "/** @type {number} */\nexport const n = 'x';\n");
    record(PROJ + '/src/legacy.js');
    check(H, 'JS file error (checkJs) -> BLOCK', 2, run(S, stop(false, 'tc')), 'src/legacy.js(');
    fs.unlinkSync(path.join(PROJ, 'src/legacy.js'));
    write('src/Bad.ts', 'export const n: number = "x";\n');
    record(PROJ + '/src/Bad.ts', off(H));
    check(H, 'switched off -> accumulator records nothing and hook is silent', 0, run(S, stop(false, 'tc'), off(H)), [], 'TS2322');
    check(H, 'no edits this turn -> silent', 0, run(S, stop(false, 'tc-none')), [], 'TS2322');
    fs.unlinkSync(path.join(PROJ, 'src/Bad.ts'));
  }

  // ------------------------------------------------------------ stop-format
  H = 'stop-format'; S = 'stop-format.js';
  if (!haveTools) {
    skip(H, 'OFF by default: file left unformatted', 'prettier not installed (offline?)');
    skip(H, 'enabled via MY_TOOLKIT_ENABLE_HOOKS: file formatted', 'prettier not installed (offline?)');
  } else {
    write('.prettierrc', '{"semi": true, "singleQuote": true}\n');
    const ugly = 'export const x  =   "a" ;\n';
    clearEdited('fm');
    write('src/Ugly.ts', ugly);
    run('post-edit-accumulator.js', edit(PROJ + '/src/Ugly.ts', 'Write', 'fm'));
    run(S, stop(false, 'fm'));
    const unchanged = fs.readFileSync(path.join(PROJ, 'src/Ugly.ts'), 'utf8') === ugly;
    results.push({ hook: H, name: 'OFF by default: file left unformatted', ok: unchanged, expect: 'unchanged', got: unchanged ? 'unchanged' : 'changed', detail: '' });
    const env = { MY_TOOLKIT_ENABLE_HOOKS: 'stop-format' };
    run('post-edit-accumulator.js', edit(PROJ + '/src/Ugly.ts', 'Write', 'fm'), env);
    const r = run(S, stop(false, 'fm'), env);
    const after = fs.readFileSync(path.join(PROJ, 'src/Ugly.ts'), 'utf8').trim();
    const formatted = r.code === 0 && after === "export const x = 'a';";
    results.push({ hook: H, name: 'enabled via MY_TOOLKIT_ENABLE_HOOKS: file formatted', ok: formatted, expect: "singleQuote form", got: JSON.stringify(after), detail: '' });
  }
} finally {
  for (const sid of SESSIONS) for (const f of fs.readdirSync(os.tmpdir())) if (f.startsWith(`my-toolkit-edited-${sid}-`)) fs.unlinkSync(path.join(os.tmpdir(), f));
}

// ---------------------------------------------------------------- report
console.log('| Hook | Case | Expected | Got | Result |\n|---|---|---|---|---|');
let pass = 0, fail = 0, skipped = 0;
for (const r of results) {
  if (r.skipped) { skipped++; console.log(`| ${r.hook} | ${r.name} | - | ${r.skipped} | SKIP |`); continue; }
  r.ok ? pass++ : fail++;
  console.log(`| ${r.hook} | ${r.name} | ${r.expect} | ${r.got} | ${r.ok ? 'PASS' : 'FAIL'} |`);
  if (!r.ok && r.detail) console.log(`<!-- ${r.detail.replace(/\n/g, ' ')} -->`);
}
console.log(`\n${pass} passed, ${fail} failed, ${skipped} skipped`);

if (KEEP) console.log(`Project kept at ${PROJ}`);
else fs.rmSync(PROJ, { recursive: true, force: true });
process.exit(fail > 0 ? 1 : 0);
