# Soothe Vault Extension

## Envs

Please create a .env file from the .env.example file and change the values to your needs.

## Build

- To build the extension for Chromium based browsers run `yarn build` and for Firefox run `yarn build:firefox`.

This build is the result of:

- Building the UI and the service worker using webpack with LavaMoat to add protections to the extension. These
  protections include:
    - [LavaMoat](https://github.com/LavaMoat/LavaMoat/tree/main/packages/webpack)
    - [Lockdown](https://github.com/endojs/endo/tree/master/packages/ses)
    - [Snow](https://github.com/lavamoat/snow)
    - [Scuttling Mode](https://github.com/LavaMoat/LavaMoat/blob/main/docs/scuttling.md)
    - [Allow Scripts](https://github.com/LavaMoat/LavaMoat/tree/main/packages/allow-scripts)
- Building the content scripts with webpack without LavaMoat to prevent brake some websites because those scrips
  are injected in every website.

After the build command finished, a new folder called dist will be created containing the files for distribution. If the
dist folder already exists, then it will be replaced with the new one.

## Dev

- To run the extension in development mode for Chromium based browsers run: `yarn dev`
- To run the extension in development mode for Firefox browser run: `yarn dev:firefox`

After the dev command finished, a new folder called dist will be created containing the files for distribution. If the
dist folder already exists, then it will be replaced with the new one.

We use webpack without LavaMoat, applying watch to bundle every time you make changes and save the files, so the
dist folder will be keep updated.

## Steps to install the browser extension

### Chrome

1. Run the extension in development mode `yarn dev` or in production mode `yarn build`.
2. Go to the following url: chrome://extensions/
3. Enable Developer mode (in upper right corner).
4. Click `Load unpacked` button.
5. Select the dist folder result of the first step.

### Firefox

1. Run the extension in development mode `yarn dev:firefox` or in production mode `yarn build:firefox`.
2. Go to the following url: about:debugging#/runtime/this-firefox.
3. Click `Load Temporary Add-on…` button.
4. Open the dist folder result of the first step and select manifest.json file.

After the 4 step the extension is installed. But to inject the content scripts you need to open the extension in every
tab you want it to be injected. To inject the content scripts automatically in every tab you must:

1. Go to the following url: about:addons
2. Click the more button at the right of Soothe Vault and click `Manage` in the menu that will open.
3. Click Permissions and enable `Access your data for all websites` switch.

### Notes

- When you make changes to the background or content scripts you must reload the extension to see the changes. This is
  not required for UI changes.
