#!/usr/bin/env node
/**
 * PreToolUse Hook: Dev Server Block (id: dev-server-block)
 *
 * Blocks FOREGROUND dev-server runs (npm/pnpm/yarn/bun run dev) that would hang
 * the session. Allowed: Bash run_in_background, a trailing `&` (incl. nohup ... &),
 * and tmux launcher forms. Scripts like `dev-docs` / `dev-build` are not dev servers.
 *
 * Exit 2 = block. Disable with MY_TOOLKIT_DISABLED_HOOKS=dev-server-block.
 *
 * Adapted from ECC scripts/hooks/pre-bash-dev-server-block.js: the tmux
 * requirement is replaced by a background-run allowance (cloud sessions may
 * not have tmux); ECC wrapper/stdin plumbing replaced by lib/hook-io.
 */

'use strict';

const path = require('path');
const { runHook } = require('./lib/hook-io');
const { splitShellSegments } = require('./lib/shell-split');
const {
  extractCommandSubstitutions,
  extractSubshellGroups
} = require('./lib/shell-substitution');

const DEV_COMMAND_WORDS = new Set([
  'npm',
  'pnpm',
  'yarn',
  'bun',
  'npx',
  'tmux'
]);
const SKIPPABLE_PREFIX_WORDS = new Set(['env', 'command', 'builtin', 'exec', 'noglob', 'sudo', 'nohup']);
const PREFIX_OPTION_VALUE_WORDS = {
  env: new Set(['-u', '-C', '-S', '--unset', '--chdir', '--split-string']),
  sudo: new Set([
    '-u',
    '-g',
    '-h',
    '-p',
    '-r',
    '-t',
    '-C',
    '--user',
    '--group',
    '--host',
    '--prompt',
    '--role',
    '--type',
    '--close-from'
  ])
};

function readToken(input, startIndex) {
  let index = startIndex;
  while (index < input.length && /\s/.test(input[index])) index += 1;
  if (index >= input.length) return null;

  let token = '';
  let quote = null;

  while (index < input.length) {
    const ch = input[index];

    if (quote) {
      if (ch === quote) {
        quote = null;
        index += 1;
        continue;
      }

      if (ch === '\\' && quote === '"' && index + 1 < input.length) {
        token += input[index + 1];
        index += 2;
        continue;
      }

      token += ch;
      index += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      index += 1;
      continue;
    }

    if (/\s/.test(ch)) break;

    if (ch === '\\' && index + 1 < input.length) {
      token += input[index + 1];
      index += 2;
      continue;
    }

    token += ch;
    index += 1;
  }

  return { token, end: index };
}

function shouldSkipOptionValue(wrapper, optionToken) {
  if (!wrapper || !optionToken || optionToken.includes('=')) return false;
  const optionSet = PREFIX_OPTION_VALUE_WORDS[wrapper];
  return Boolean(optionSet && optionSet.has(optionToken));
}

function isOptionToken(token) {
  return token.startsWith('-') && token.length > 1;
}

function normalizeCommandWord(token) {
  if (!token) return '';
  const base = path.basename(token).toLowerCase();
  return base.replace(/\.(cmd|exe|bat)$/i, '');
}

function getLeadingCommandWord(segment) {
  let index = 0;
  let activeWrapper = null;
  let skipNextValue = false;

  while (index < segment.length) {
    const parsed = readToken(segment, index);
    if (!parsed) return null;
    index = parsed.end;

    const token = parsed.token;
    if (!token) continue;

    if (skipNextValue) {
      skipNextValue = false;
      continue;
    }

    if (token === '--') {
      activeWrapper = null;
      continue;
    }

    if (token === '{' || token === '}') continue;

    if (/^[A-Za-z_][A-Za-z0-9_]*=.*/.test(token)) continue;

    const normalizedToken = normalizeCommandWord(token);

    if (SKIPPABLE_PREFIX_WORDS.has(normalizedToken)) {
      activeWrapper = normalizedToken;
      continue;
    }

    if (activeWrapper && isOptionToken(token)) {
      if (shouldSkipOptionValue(activeWrapper, token)) {
        skipNextValue = true;
      }
      continue;
    }

    return normalizedToken;
  }

  return null;
}

const TMUX_LAUNCHER = /^\s*tmux\s+(new|new-session|new-window|split-window)\b/;
// Trailing (?![\w-]) rather than \b: \b treats a hyphen as a word boundary, so
// `dev\b` matches the `dev` prefix of distinct scripts like `dev-setup` /
// `dev-docs` / `dev-build` and wrongly blocks them. The lookahead still matches
// the dev server (`dev`, `dev;`, `dev:ssr`, ...) but not a `dev-<suffix>` script.
const DEV_PATTERN = /\b(npm\s+run\s+dev|pnpm(?:\s+run)?\s+dev|yarn(?:\s+run)?\s+dev|bun(?:\s+run)?\s+dev)(?![\w-])/;

/**
 * Collect every command-line segment we should evaluate. Returns the top-level
 * segments first, then segments harvested from `$(...)` / backtick command
 * substitutions and plain `(...)` subshell groups, recursively.
 *
 * Without this expansion the leading-command and dev-pattern check below only
 * sees the outermost command, so wrappers like `$(npm run dev)` and
 * `(npm run dev)` (which still spawn a dev server) sneak past.
 */
function collectCheckSegments(cmd) {
  const segments = [...splitShellSegments(cmd)];
  const queue = [cmd];
  const seen = new Set();

  while (queue.length) {
    const current = queue.shift();
    if (seen.has(current)) continue;
    seen.add(current);

    for (const body of extractCommandSubstitutions(current)) {
      for (const seg of splitShellSegments(body)) segments.push(seg);
      queue.push(body);
    }
    for (const body of extractSubshellGroups(current)) {
      for (const seg of splitShellSegments(body)) segments.push(seg);
      queue.push(body);
    }
  }

  return segments;
}

function isBlockedDevSegment(segment) {
  const commandWord = getLeadingCommandWord(segment);
  if (!commandWord || !DEV_COMMAND_WORDS.has(commandWord)) return false;
  return DEV_PATTERN.test(segment) && !TMUX_LAUNCHER.test(segment);
}

/**
 * True when `segment` is followed by a single `&` in `cmd` (i.e. it is sent to
 * the background). splitShellSegments drops the operator, so look it up here.
 */
function isFollowedByBackgroundOperator(cmd, segment) {
  const start = cmd.indexOf(segment);
  if (start === -1) return false;
  const rest = cmd.slice(start + segment.length).replace(/^\s+/, '');
  return rest.startsWith('&') && !rest.startsWith('&&');
}

/**
 * Heredoc bodies (`cat > f <<'EOF' ... EOF`) are data written to a file or stdin, not commands: a
 * script that merely WRITES "npm run dev" into a doc must not be blocked. Remove the bodies (keep the
 * command line that introduces them) before looking for dev-server commands.
 */
function stripHeredocBodies(cmd) {
  const lines = cmd.split('\n');
  const out = [];
  let end = null;
  for (const line of lines) {
    if (end !== null) {
      if (line.replace(/^\t+/, '').trim() === end) end = null;
      continue;
    }
    out.push(line);
    const m = line.match(/<<-?\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\1/);
    if (m) end = m[2];
  }
  return out.join('\n');
}

runHook('dev-server-block', ({ input, block }) => {
  if (process.platform === 'win32') return;
  if (input.tool_input?.run_in_background === true) return;

  const cmd = stripHeredocBodies(String(input.tool_input?.command || ''));
  const foreground = collectCheckSegments(cmd)
    .filter(isBlockedDevSegment)
    .some(segment => !isFollowedByBackgroundOperator(cmd, segment));

  if (foreground) {
    block('BLOCKED: a foreground dev server would hang this session. Run it in the background instead: ' +
      'set run_in_background: true on the Bash call, or append `&` (e.g. `nohup npm run dev > dev.log 2>&1 &`), ' +
      'then read the log file to check it started.');
  }
});
