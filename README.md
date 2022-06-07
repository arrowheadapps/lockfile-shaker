# lockfile-shaker

[![NPM Version](https://img.shields.io/npm/v/lockfile-shaker/latest)](https://www.npmjs.org/package/lockfile-shaker)
[![Monthly download on NPM](https://img.shields.io/npm/dm/lockfile-shaker)](https://www.npmjs.org/package/lockfile-shaker)
[![Snyk Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/npm/lockfile-shaker)](https://snyk.io/test/npm/lockfile-shaker)
[![GitHub last commit](https://img.shields.io/github/last-commit/arrowheadapps/lockfile-shaker)](https://github.com/arrowheadapps/lockfile-shaker)

Optimise your `package-lock.json` for production deployments. This safely edits your `package-lock.json` to make certain packages dev-only, based on rules you define.

In this you can slim down the size and install time of your production deployments when using  `npm ci --only production`.

## Why?

Some API frameworks (for example headless CMS) include dependencies for both the backend server, and the front-end. When you wish to deploy the server only, you are forced to include all dependencies, including hundreds of MB of packages for the front-end (React, Webpack, etc) that are not required for the server to run.

Using `lockfile-shaker`, you can safely edit your `package-lock.json` file to make those packages that are not required dev-only, so that they will not be installed for production deployments. In this way, you can reduce your server deployment size by hundreds of MB.


## Installation

Install `lockfile-shaker` (as a dev-dependency):

```
npm i -D lockfile-shaker
```

Add `lockfile-shaker` to your postinstall script:

```JSON
{
  "scripts" : {
    "postinstall": "lockfile-shaker"
  }
}
```

## Usage

### Automatic usage with a plugin

Install a configuration plugin, and `lockfile-shaker` will merge in the configuration automatically. It will look for a `defaults.js` file in any package beginning with `lockfile-shaker-*`, and merge all the configurations together.

For example:

```
npm i -D lockfile-shaker-strapi
```

See [`lockfile-shaker` plugins](https://www.npmjs.com/search?q=keywords:lockfile-shaker-plugin).

### Manual configuration

If you have a `lockfile-shaker.config.js` file in your package root directory, then `lockfile-shaker` will not automatically use any plugin configurations. Instead it will use the configuration you provide.

You can merge any number of plugin configurations with your own using `mergeConfigurations()`.

In the example below, we never want `@types/...` packages to be installed in production. And we know that any package matching `strapi` can run safely without packages that match `react` or `webpack`. Any dependencies matching `react` or `webpack` will be made dev-only, unless they are also a dependency of a another production dependency that doesn't match `strapi`. 

```JavaScript
// lockfile-shaker.config.js
const { mergeConfigurations, defaults } = require('lockfile-shaker');
const strapiConfig = require('lockfile-shaker-strapi');

const myConfig = {
  /**
   * A list of pattern groups that defines which packages can be made dev-only,
   * and which dependants are known to be safe to run without them.
   */
  patterns: [
    {
      /**
       * Packages that can safely run without those packages matching `packages`.
       * @type {(string | RegExp)[]}
       */
      safeDependants: [
        /strapi/
      ],

      /**
       * Packages that will be made dev-only if they have no production
       * dependants other than those matching `safeDependants`.
       * @type {(string | RegExp)[]}
       */
      packages: [
        /webpack/,
        /react/
      ],
    },
  ],
  
  /**
   * Array of packages that will be forced dev-only regardless if they are dependencies
   * of production packages.
   * 
   * This is unsafe! Use only if you are certain of what you are doing.
   * 
   * @type {(string | RegExp)[]}
   */
  forcePatterns: [
    /node_modules\/@types/ // Never include @types packages in the the distribution
  ],
};

module.exports = mergeConfigurations(myConfig, defaults, strapiConfig);
```


### In your own script

You can also use `lockfile-shaker` in your own JavaScript. For example:

```JavaScript
const { optimise, loadLockfile, outputLockfile, mergeConfigurations, defaults } = require('lockfile-shaker');
const strapiConfig = require('lockfile-shaker-strapi/defaults.js');

const config = {
  patterns: [
    // ...
  ],
  forcePatterns: [
    // ...
  ]
};

// Load, optimise, and output your lockfile
const lockfile = await loadLockfile();
await optimise(lockfile, mergeConfigurations(config, defaults, strapiConfig));
await outputLockfile(lockfile);
```

## Publish a configuration plugin

You can publish your own plugin which provides a `lockfile-shaker` configuration. Your package should start with `lockfile-shaker-*` and it must contain a `defaults.js` file in the root directory which exports a valid configuration.

For example:

```JavaScript
/// defaults.js

module.exports = {
  patterns: [
    // ...
  ],
  forcePatterns: [
    // ...
  ]
};
```
