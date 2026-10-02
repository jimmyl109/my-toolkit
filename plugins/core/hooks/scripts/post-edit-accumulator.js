#!/usr/bin/env node
/**
 * PostToolUse helper: remember which JS/TS files were edited this response, for the
 * stop-typecheck and stop-format hooks. Records nothing when both are switched off.
 *
 * Adapted from ECC scripts/hooks/post-edit-accumulator.js (separate list per consumer).
 */

'use strict';

const { runHook } = require('./lib/hook-io');
const { isEnabled } = require('./lib/hook-flags');
const { record } = require('./lib/edited-files');

runHook('edit-tracker', ({ input }) => {
  const consumers = [];
  if (isEnabled('stop-typecheck')) consumers.push('typecheck');
  if (isEnabled('stop-format')) consumers.push('format');
  if (consumers.length > 0) record(input, consumers);
});
