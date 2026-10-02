'use strict';

/**
 * Per-hook switches (read from the environment, so a project can set them in
 * the "env" block of .claude/settings.json or .claude/settings.local.json).
 *
 *   MY_TOOLKIT_HOOKS=off                        turn every hook in this plugin off
 *   MY_TOOLKIT_DISABLED_HOOKS=id,id             turn individual hooks off
 *   MY_TOOLKIT_ENABLE_HOOKS=id,id               turn on hooks that ship disabled
 *
 * Hook ids: config-protection, block-no-verify, dev-server-block, commit-quality,
 * check-console-log, stop-typecheck, stop-format (off by default).
 */

const DEFAULT_OFF = new Set(['stop-format']);

const norm = value => String(value || '').trim().toLowerCase();
const parseList = value => new Set(String(value || '').split(',').map(norm).filter(Boolean));

function isEnabled(id, env = process.env) {
  const hookId = norm(id);
  if (['off', 'false', '0', 'no'].includes(norm(env.MY_TOOLKIT_HOOKS))) return false;
  if (parseList(env.MY_TOOLKIT_DISABLED_HOOKS).has(hookId)) return false;
  if (DEFAULT_OFF.has(hookId) && !parseList(env.MY_TOOLKIT_ENABLE_HOOKS).has(hookId)) return false;
  return true;
}

module.exports = { isEnabled };
