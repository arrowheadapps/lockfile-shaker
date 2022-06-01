/**
Copyright (c) 2022 Arrowhead Apps Ltd.
*/

export interface PatternGroup {
  /**
   * Packages that can safely run without those packages matching `packages`.
   */
  safeDependants: (string | RegExp)[];

  /**
   * Packages that will be made dev-only if they have no production
   * dependants other than those matching `safeDependants`.
   */
  packages: (string | RegExp)[];
}

export interface Configuration {
  /**
   * Packages that will be attempted to be made dev-only.
   */
  patterns?: PatternGroup[];

  /**
   * Array of packages that will be forced dev-only regardless if they are dependencies
   * of production packages.
   * 
   * This is unsafe! Use only if you are certain of what you are doing.
   */
  forcePatterns?: (string | RegExp)[];
}

export interface Lockfile {
  lockfileVersion: number;
  packages?: {
    [path: string]: Package;
  }
}

export interface Package {
  dev?: boolean;
  devOptional?: boolean;
  dependencies?: {
    [id: string]: string;
  };

  __tentative?: boolean;
}

/**
 * Refactor the `package-lock.json` (located in the current working directory) 
 * to make certain packages that are known to be dev-only as dev dependencies.
 * 
 * Requires lockfile version 2 or 3 (NPM version 7 onwards).
 */
export async function refactor(config: Configuration, lockfile: Lockfile) {
  for (const path in lockfile.packages) {
    makePackageDevOnly(config, lockfile as Required<Lockfile>, path);
  }
}

export default refactor;



/**
 * Recursively checks the dependants of this package to make it dev-only if possible.
 * If it is made dev-only, then it recursively tries to make it's dependencies dev-only also.
 */
function makePackageDevOnly(config: Readonly<Configuration>, lockfile: Required<Lockfile>, path: string, tree: string[] = []) {
  if (path === '') {
    return false;
  }

  // Prevent infinite recursion
  const pkg = lockfile.packages[path];
  if (pkg.dev) {
    return true;
  }
  if (pkg.__tentative) {
    return undefined;
  }
  pkg.__tentative = true;

  try {
    if (config.forcePatterns?.some(p => test(p, path))) {
      // No checks, we force it to dev-only
    } else {
      // Otherwise, make sure the package isn't a dependency of a non-dev package
      const matchingGroups = config.patterns?.filter(group => group.packages.some(p => test(p, path)));
      const dependants = findDependantPackages(lockfile, path);

      let blocked = false;
      for (const dependant of dependants) {
        if (dependant === '') {
          // Root package, cannot be dev
          return false;
        }
        if (lockfile.packages[dependant].dev) {
          // This dependant is ok, it is already dev-only
          continue;
        }

        if (matchingGroups?.some(group => group.safeDependants.some(p => test(p, dependant)))) {
          // This dependant is ok
          // Because we are a known dev-only package and this dependant is safe
          continue;
        }

        // Otherwise recursively check the dependant package
        const canBeDev = makePackageDevOnly(config, lockfile, dependant, tree.concat(path));
        if (canBeDev === true) {
          // We could make the entire chain dev-only
          continue;
        }

        if (canBeDev === undefined) {
          if (tree.includes(dependant)) {
            // This is a circular dependency
            // consider that it can be made dev-only
            continue;
          } else {
            // We won't be able to make it dev in this iteration
            // but continue checking the other dependants
            blocked = true;
            continue;
          }
        }

        // This dependant is not dev-only, and could not be made dev-only because of it's dependants
        // Abort here
        return false;
      }

      if (blocked) {
        // We need to come back in the next iteration
        delete pkg.__tentative;
        return undefined;
      }
    }

    pkg.dev = true;
    delete pkg.devOptional;


    // Ok, we can make this package dev-only
    // Now see if we can do the same for all of it's dependencies
    for (const id in lockfile.packages[path].dependencies) {
      const dependency = findPackageById(lockfile, id, path);
      if (dependency) {
        makePackageDevOnly(config, lockfile, dependency);
      }
    }

    return true;

  } finally {
    delete pkg.__tentative;
  }
}

function test(pattern: string | RegExp, str: string) {
  return (typeof pattern === 'string') ? pattern === str : pattern.test(str);
}

/**
 * Given the package path, returns the path of the nearest parent package
 * or `null` if this is not a child package.
 */
function parsePath(path: string) {
  if (!path) {
    return { id: '', parent: null };
  }

  const paths = path.split('/node_modules/');
  if (paths.length === 1) {
    return { id: path.slice('node_modules/'.length), parent: null };
  } else {
    // The last element is the ID of this package
    const id = paths[paths.length - 1];
    return { id, parent: path.slice(0, -`/node_modules/${id}`.length) };
  }
}


function resolveDependency(lockfile: Required<Lockfile>, path: string, id: string) {
  let resolved = path
    ? `${path}/node_modules/${id}`
    : `node_modules/${id}`;

  while (!lockfile.packages[resolved]) {
    // Wind the path pack to a parent node_modules
    let i = resolved.lastIndexOf('node_modules', resolved.lastIndexOf('node_modules') - 1);
    if (i === -1) {
      break;
    }
    resolved = i == 0
      ? `node_modules/${id}`
      : `${resolved.slice(0, i - 1)}/node_modules/${id}`;
  }

  return resolved;
}


function findDependantPackages(lockfile: Required<Lockfile>, path: string) {
  const { id, parent } = parsePath(path);
  const dependants = [];

  for (const dependant in lockfile.packages) {
    // Limit search scope to those within the parent package
    if (!parent || dependant.startsWith(parent)) {
      if (lockfile.packages[dependant].dependencies?.[id]) {
        // Ok, this package uses a dependency with the same ID
        // but it may not resolve to us because it may have it's
        // own version as a sub dependency anywhere in it's tree

        // Calculate what this package's dependency will resolve to
        const depPath = resolveDependency(lockfile, dependant, id);
        if (depPath === path) {
          dependants.push(dependant);
        }
      }
    }
  }

  return dependants;
}


function findPackageById(lockfile: Required<Lockfile>, id: string, parent: string) {
  let path;
  while (true) {
    // Return the package inside the parent if it exists
    path = parent ? `${parent}/node_modules/${id}` : `node_modules/${id}`;
    if (lockfile.packages[path]) {
      return path;
    }
    if (!parent) {
      console.warn(`Could not find package for dependency "${id}"`);
      return null;
    }

    const lastIndex = parent.lastIndexOf('/node_modules');
    if (lastIndex === -1) {
      parent = '';
    } else {
      parent = parent.slice(0, lastIndex);
    }
  }
}
