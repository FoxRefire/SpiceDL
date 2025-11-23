# esbuild-plugin-external-global

External modules as global variables with `esbuild`.

## Install

```sh
yarn add -D esbuild-plugin-external-global
```

or

```sh
npm i -D esbuild-plugin-external-global
```

## Usage

Add to your esbuild plugins list:

```js
const esbuild = require("esbuild");
const { externalGlobalPlugin } = require("esbuild-plugin-external-global");

esbuild.build({
  ...
  plugins: [
    externalGlobalPlugin({
      'react': 'window.React',
      'react-dom': 'window.ReactDOM',
      'jQuery': '$'
    })
  ]
  ...
});
```
