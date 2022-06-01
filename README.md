# lockfile-shaker
Optimise your package-lock.json for production deployments.


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

Install a configuration plugin, and `lockfile-shaker` will merge in the configuration automatically.

For example:

```
npm i -D lockfile-shaker-strapi
```


See [`lockfile-shaker` plugins](https://www.npmjs.com/search?q=keywords:lockfile-shaker-plugin),
