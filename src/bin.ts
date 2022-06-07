#!/usr/bin/env node

/**
Copyright (c) 2022 Arrowhead Apps Ltd.
*/

import optimise, { Configuration, loadLockfile, mergeConfigurations, outputLockfile, defaults } from './index';
import { resolve } from 'path';

run().catch(console.error);

/**
 * Loads the configurations and runs the refactoring in the given working directory path.
 */
export async function run(cwd = process.cwd()) {
  if (process.env.npm_command === 'ci') {
    // Don't run on the npm ci command
    return;
  }
  console.log('\n');

  
  // Read in the lockfile
  const lockfile = await loadLockfile(cwd);


  // Try to find the configuration script
  let config: Configuration | undefined;
  try {
    config = require(resolve(cwd, 'lockfile-shaker.config.js'));
  } catch {
    // Config doesn't exist
  }


  if (!config) {
    // Load the default config
    config = defaults;

    // Merge in the plugin configs
    for (const path in (lockfile.packages || {})) {
      if (path.startsWith('node_modules/lockfile-shaker-')) {
        console.log(`Merging configuration from ${path.slice(13)}`);
        config = mergeConfigurations(config, require(resolve(cwd, path, 'defaults.js')));
      }
    }
  }


  // Initial totals
  const totalCount = Object.values(lockfile.packages || {}).length
  const originalDevCount = Object.values(lockfile.packages || {}).filter(p => p.dev).length;

  // Perform refactor
  await optimise(config, lockfile);
  await outputLockfile(lockfile);

  // Resulting totals
  const newDevCount = Object.values(lockfile.packages || {}).filter(p => p.dev).length;
  console.log(`Changed ${newDevCount - originalDevCount} packages to dev-only. Production package count reduced from ${totalCount - originalDevCount} to ${totalCount - newDevCount}.`);
}
