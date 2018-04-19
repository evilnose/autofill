# Autofill Browser Extension

A browser extension that automates the process of completing college application forms.

## Build Notes

### Introduction

The source code is written in `nodejs`, and the distributed extension is built using `npm` and [`webpack`](https://webpack.js.org). This is done instead of building the extension manually because of the following reasons:

1. Node handles dependencies much more clearly and safely than raw javascript
2. This allows for flexible templating and styling (e.g. `jade`, `sass`, etc.)
3. Build processes such as linting, testing, minification, bundling, and generating files (such as `manifest.json`) can be automated (many of these processes cannot even be done without a build tool).
4. External node modules can be used and managed.

### Prerequisites

To be able to build this extension, you would need `nodejs` and `npm`. At the time this is written, `node` of version `8.9.4` and `npm` of `5.6.0` are being used. Installing `node` also installs `npm` automatically.

### Setup

Run `npm i` in the project directory to install all the required dependencies.

### Scripts

Here are the scripts that you can run in the terminal as of now:

* `npm run build`: Builds the extension in dev environment (production environment is not configured yet).
* `npm run test` or `npm t`: Run the integration test (no test has been created yet). 
* `npm run lint`: lints all the files in the `src` directory.

You can view all the script commands in `package.json` at the project root directory.

### Build rules

*To be done*
