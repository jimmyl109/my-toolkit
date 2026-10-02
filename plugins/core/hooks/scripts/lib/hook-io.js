'use strict';

const { isEnabled } = require('./hook-flags');

const MAX_STDIN = 1024 * 1024;

/**
 * Run a hook: skip silently when the hook is switched off, read the (bounded)
 * JSON payload from stdin, then call handler(ctx). Unexpected errors fail open.
 *
 * ctx = { raw, input, truncated, block(msg), context(text), message(text) }
 *   block(msg)    exit 2; msg goes to stderr and is fed back to Claude
 *   context(text) PreToolUse: add text to Claude's context (exit 0)
 *   message(text) Stop: show text to the user as a warning (exit 0)
 */
function runHook(id, handler) {
  if (!isEnabled(id)) process.exit(0);

  let raw = '';
  let truncated = false;
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    const room = MAX_STDIN - raw.length;
    if (room <= 0) { truncated = true; return; }
    raw += chunk.substring(0, room);
    if (chunk.length > room) truncated = true;
  });
  process.stdin.on('end', () => {
    let input = {};
    try { input = raw.trim() ? JSON.parse(raw) : {}; } catch { input = {}; }

    const ctx = {
      raw,
      input,
      truncated,
      block(msg) {
        process.stderr.write(`[my-toolkit:${id}] ${msg}\n`);
        process.exit(2);
      },
      context(text) {
        process.stdout.write(JSON.stringify({
          hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: `[my-toolkit:${id}] ${text}` }
        }));
      },
      message(text) {
        process.stdout.write(JSON.stringify({ systemMessage: `[my-toolkit:${id}] ${text}` }));
      }
    };

    try {
      handler(ctx);
    } catch (err) {
      process.stderr.write(`[my-toolkit:${id}] internal error (allowing): ${err.message}\n`);
    }
    process.exit(0);
  });
}

module.exports = { runHook, MAX_STDIN };
