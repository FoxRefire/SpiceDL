# esbuild-plugin-postcss2

This plugin is an optimized, type-friendly version of [esbuild-plugin-postcss](https://github.com/deanc/esbuild-plugin-postcss). It supports CSS preprocessors and CSS modules.

## Install

```sh
yarn add -D esbuild-plugin-postcss2
```

or

```sh
npm i -D esbuild-plugin-postcss2
```

## Usage

Add the plugin to your esbuild plugins:

```js
const esbuild = require("esbuild");
const postCssPlugin = require("esbuild-plugin-postcss2");

esbuild.build({
  ...
  plugins: [
    postCssPlugin.default()
  ]
  ...
});
```

### PostCSS plugins

Add your desired PostCSS plugin to the plugins array:

```js
const autoprefixer = require("autoprefixer");

esbuild.build({
  ...
  plugins: [
    postCssPlugin.default({
      plugins: [autoprefixer]
    })
  ]
  ...
});
```

### CSS modules

PostCSS modules are enabled by default. You can pass in a config or disable it with the `modules` field:

```js
postCssPlugin.default({
  // pass in `postcss-modules` custom options
  // set to false to disable
  modules: {
    getJSON(cssFileName, json, outputFileName) {
      const path = require("path");
      const cssName = path.basename(cssFileName, ".css");
      const jsonFileName = path.resolve("./build/" + cssName + ".json");

      fs.writeFileSync(jsonFileName, JSON.stringify(json));
    }
  }
});
```

### Preprocessors

To use preprocessors (`sass`, `scss`, `stylus`, `less`), just add the desired preprocessor as a `devDependency`:

```sh
yarn add -D sass
```
