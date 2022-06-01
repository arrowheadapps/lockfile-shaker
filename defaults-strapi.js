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
        /\/strapi/, // Only operate on dependants of Strapi packages
      ],
      packages: [
        // These each match multiple packages
        /babel/,
        /buffetjs/,
        /fortawesome/,
        /fingerprintjs/,
        /react/,
        /webpack/,
        /redux/,
        /node_modules\/markdown-it/,
        /node_modules\/strapi-generate/,

        // These each match only one package
        /node_modules\/autoprefixer$/,
        /node_modules\/bootstrap$/,
        /node_modules\/classnames$/,
        /node_modules\/cross-env$/,
        /node_modules\/codemirror$/,
        /node_modules\/cropperjs$/,
        /node_modules\/font-awesome$/,
        /node_modules\/formik$/,
        /node_modules\/history$/,
        /node_modules\/js-cookie$/,
        /node_modules\/html-loader$/,
        /node_modules\/css-loader$/,
        /node_modules\/file-loader$/,
        /node_modules\/style-loader$/,
        /node_modules\/url-loader$/,
        /node_modules\/immer$/,
        /node_modules\/immutable$/,
        /node_modules\/invariant$/,
        /node_modules\/moment$/,
        /node_modules\/mini-css-extract-plugin$/,
        /node_modules\/material-design-lite$/,
        /node_modules\/prop-types$/,
        /node_modules\/reselect$/,
        /node_modules\/strapi-helper-plugin$/,
        /node_modules\/styled-components$/,
        /node_modules\/sanitize\.css$/,
        /node_modules\/sanitize-html$/,
        /node_modules\/draft-js$/,
        /node_modules\/highlight\.js$/,
        /node_modules\/firebase$/,
        /node_modules\/firebaseui$/,

        // Currently used only by the Strapi CLI commands which we bypass
        /node_modules\/inquirer$/,
        /node_modules\/ora$/,
      ],
    }
  ],
};

module.exports = config;
