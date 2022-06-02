#!/usr/bin/env node

/**
Copyright (c) 2022 Arrowhead Apps Ltd.
*/

import optimise, { loadLockfile, outputLockfile } from './index';

run().catch(console.error);

/**
 * Loads the configurations and runs the refactoring in the given working directory path.
 */
export async function run(cwd = process.cwd()) {
  if (process.env.npm_command === 'ci') {
    // Don't run on the npm ci command
    return;
  }

  // Read in the configuration
  const config = require('../defaults.js');

  // Read in the lockfile
  const lockfile = await loadLockfile(cwd);

  // Initial totals
  const totalCount = Object.values(lockfile.packages || {}).length
  const originalDevCount = Object.values(lockfile.packages || {}).filter(p => p.dev).length;

  // Perform refactor
  await optimise(config, lockfile);
  await outputLockfile(lockfile);

  // Resulting totals
  const newDevCount = Object.values(lockfile.packages || {}).filter(p => p.dev).length;
  console.log(`\nChanged ${newDevCount - originalDevCount} packages to dev-only. Production package count reduced from ${totalCount - originalDevCount} to ${totalCount - newDevCount}.`);
}
