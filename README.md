# Autofill Browser Extension

A browser extension that automates the process of completing college application forms.

## Project Directory Structure

backend/		For future backend data processing. Currently idle.
extension/		Code for the Chrome extension.
static_input/	Some static files to be fed to the extension through the admin interface.

## Build Notes

### Introduction

The source code is written in `nodejs`, and the distributed extension is built using `npm` and [`webpack`](https://webpack.js.org). This is done instead of building the extension manually because of the following reasons:

1. Node handles dependencies much more clearly and safely than raw javascript
2. This allows for flexible templating and styling (e.g. `jade`, `sass`, etc.)
3. Build processes such as linting, testing, minification, bundling, and generating files (such as `manifest.json`) can be automated (many of these processes cannot even be done without a build tool).
4. External node modules can be used and managed.

### Prerequisites

To be able to build this extension, you would need `nodejs` and `npm`. At the time this is written, `node` of version `8.9.4` and `npm` of `5.8.0` are being used. Installing `node` also installs `npm` automatically.

### Setup

Run `npm i` in the project directory to install all the required dependencies.

### Scripts

Here are the scripts that you can run in the terminal as of now:

* `npm run build`: Builds the extension in development environment. **Starts watching by default.**
* `npm run build:prod`: Builds the extension in production environment (untested). **Starts watching by default.**
* `npm run test` or `npm t`: Runs unit tests. Few tests have been created due to lack of time.
* `npm run lint`: Lints all the files in the `src` directory.
* `npm run watch`: Starts watching the resolved files, excluding `node_modules` directory.

You can view all the script commands in `package.json` at the project root directory.

## Process Template Syntax

Process template syntax is created for developers and contributors to create concise and secure "processes", or instructions, for the extension to follow, in order to send user data to a particular app website. The detailed documentation on how the process template syntax works is [here](https://docs.google.com/document/d/1vFvvlerMwnTfeGj2yDEFs9KPKqqpIAQjp4wTwxG_6SM/edit?usp=sharing).
