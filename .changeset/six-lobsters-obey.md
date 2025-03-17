---
"@soothe/extension": patch
---

* Updated `package.json` to include the following scripts:
    - `build:chromium`: to build the extension for chromium based browsers
    - `build:firefox`: to build the extension for firefox browser

* Updated README.md to specify the build commands for the extension and the result location
* Updated README.md of the extension to clarify how to inject the content scripts automatically in Firefox.
* Updated build of extension to place the result of the build for chromium based browsers at `dist/chromium` and for
  firefox at `dist/firefox`
* Updated version of `@lavamoat/webpack` which includes the scuttling options, as result of it we no longer need the
  update-lavamoat script.
