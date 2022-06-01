/**
Copyright (c) 2022 Arrowhead Apps Ltd.
*/

/**
 * @type {import('.').Configuration}
 */
const config = {
  patterns: [
    {
      safeDependants: [
        /^$/, // Root package only
      ],
      packages: [
        /node_modules\/lockfile-shaker$/,
      ],
    }
  ],
  forcePatterns: [
    /\/@types/,
  ],
};

module.exports = config;
