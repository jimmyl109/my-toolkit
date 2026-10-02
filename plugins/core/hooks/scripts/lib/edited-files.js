'use strict';

/**
 * Tracks the JS/TS files edited during a response so the Stop hooks can check them in one pass.
 * Each consumer (typecheck, format) has its own list so one cannot drain the other's.
 */

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const JS_TS = /\.(ts|tsx|js|jsx|mts|cts|mjs|cjs)$/;

function listFile(input, consumer) {
  const raw = input.session_id || crypto.createHash('sha1').update(String(input.cwd || process.cwd())).digest('hex').slice(0, 12);
  const id = String(raw).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  return path.join(os.tmpdir(), `my-toolkit-edited-${id}-${consumer}.txt`);
}

function editedPaths(input) {
  const ti = input.tool_input || {};
  const paths = [ti.file_path];
  if (Array.isArray(ti.edits)) for (const edit of ti.edits) paths.push(edit && edit.file_path);
  const cwd = input.cwd || process.cwd();
  return paths.filter(p => typeof p === 'string' && JS_TS.test(p)).map(p => path.resolve(cwd, p));
}

function record(input, consumers) {
  const paths = editedPaths(input);
  if (paths.length === 0) return;
  for (const consumer of consumers) fs.appendFileSync(listFile(input, consumer), paths.join('\n') + '\n', 'utf8');
}

/** Read and clear the list for one consumer. Returns a de-duplicated array of absolute paths. */
function consume(input, consumer) {
  const file = listFile(input, consumer);
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch { return []; }
  try { fs.unlinkSync(file); } catch { /* best effort */ }
  return [...new Set(raw.split('\n').map(l => l.trim()).filter(Boolean))];
}

/** Installed plugin / marketplace checkouts are third-party code we only read. */
function isPluginClonePath(filePath, cwd = process.cwd()) {
  const resolved = path.resolve(filePath);
  const roots = [path.join(cwd, '.claude', 'plugins'), path.join(os.homedir(), '.claude', 'plugins')];
  return roots.some(root => {
    const rel = path.relative(root, resolved);
    return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
  });
}

function findUp(startDir, predicate, maxDepth = 20) {
  let dir = startDir;
  const root = path.parse(dir).root;
  for (let depth = 0; depth < maxDepth; depth++) {
    if (predicate(dir)) return dir;
    if (dir === root) break;
    dir = path.dirname(dir);
  }
  return null;
}

module.exports = { record, consume, isPluginClonePath, findUp, JS_TS };
