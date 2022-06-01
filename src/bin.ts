#!/usr/bin/env node

/**
Copyright (c) 2022 Arrowhead Apps Ltd.
*/

import { readFile, writeFile } from 'fs/promises';
import { Lockfile, refactor } from './index';
import { resolve } from 'path';
import { exec } from './exec';

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
  const lockfilePath = resolve(cwd, 'package-lock.json');
  const lockfile: Lockfile = JSON.parse(await readFile(lockfilePath, 'utf-8'));
  if (!lockfile.packages) {
    throw new Error('Your package-lock.json must be version 2 or greater. Please reinstall with NPM v7 or later to upgrade your package-lock.json file.');
  }

  // Initial totals
  const totalCount = Object.values(lockfile.packages).length
  const originalDevCount = Object.values(lockfile.packages).filter(p => p.dev).length;

  // Perform refactor
  await refactor(config, lockfile);
  await writeFile(lockfilePath, JSON.stringify(lockfile, undefined, await getLockFileFormat(cwd) ? 2 : undefined));

  // Resulting totals
  const newDevCount = Object.values(lockfile.packages).filter(p => p.dev).length;
  console.log(`\nChanged ${newDevCount - originalDevCount} packages to dev-only. Production package count reduced from ${totalCount - originalDevCount} to ${totalCount - newDevCount}.`);
}

/**
 * Determines whether the NPM configuration specifies that the lockfile should be pretty-formatted.
 */
async function getLockFileFormat(cwd: string) {
  const stdout = await exec('npm config get format-package-lock', { cwd, encoding: 'utf-8', shell: true });
  return stdout !== 'false';
}
