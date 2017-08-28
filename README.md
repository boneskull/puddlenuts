# puddlenuts

> CLI to help create custom classifiers for visual recognition systems

## Requirements

- Node 8.x, npm v5.x
- Raspberry Pi w/ camera & `raspistill` installed
- [Watson Visual Recognition Service](https://www.ibm.com/watson/services/visual-recognition/) API key

## Usage

Show help:

```shell
$ puddlenuts --help
```

You should define a `PUDDLENUTS_API_KEY` env var corresponding to your Visual Recognition API key.

You can also place this in an `.env` file in your current working directory.

> Any option can be specified in the `.env` file using the mask `PUDDLENUTS_SCREAMING_SNAKE_CASE`; e.g.
`PUDDLENUTS_LOGLEVEL=error`

## Installation

It can be invoked via `npx`:

```shell
$ npx puddlenuts --help
```

Or installed "permanently":

```shell
$ npm install -g puddlenuts
```

## Sub-Commands

### `shoot`

Take a bunch of photos with the camera, put them into `.zip` files corresponding to classes, and upload them into a classifier for training.  See `puddlenuts shoot --help` for details.

### `train` 

Upload `.zip` file(s) to a new or existing classifier for training or retraining.  See `puddlenuts train --help` for details.

### `classify`

Take a photo with the camera or use an on-disk image to classify against a previously-trained classifier.  See `puddlenuts classify --help` for details.

## Development

- Yes, this needs tests.
- `@types/*` packages included in this project's `devDependencies` are for IDE type inference; this is not a TypeScript project.
- The command definitions live in `lib/commands/` and are loaded by [yargs](https://npm.im/yargs), with the exception of `lib/commands/common-opts.js`.  See the [advanced Yargs usage guide](https://github.com/yargs/yargs/blob/master/docs/advanced.md) for more info.
- ES6 modules provided by the magic of [@std/esm](https://npm.im/@std/esm).

### Style

- The [FP variant](https://github.com/lodash/lodash/wiki/FP-Guide) of [Lodash](https://lodash.com) is used exclusively.  This is enforced by ESLint.
- Avoid the `function` keyword; use [arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions).  Not enforced (yet)
- Plain objects containing functions *shouldn't* use the "method" shorthand, but probably do; e.g.:
  ```js
  const foo = {
    bar() {
      // stuff
    }
  };
  ```

  Avoid. Instead:

  ```js
  const foo = {
    bar: () => {
      // stuff
    }
  };
  ```

  Not enforced (yet)
- Use `async` / `await` in lieu of `Promise` chains.
- Add [JSdoc](https://npm.im/jsdoc) docstrings.  As of this writing, these are mostly missing
- Use ternary operators wherever possible, but do not nest them.
- Favor template strings over string concatenation
- Use [currying](https://lodash.com/docs/4.17.4#curry) where it makes sense
- Leverage [`util.promisify()`](https://nodejs.org/api/util.html#util_util_promisify_original) or [promwrap](https://npm.im/promwrap) instead of Node.js-style callbacks
- Code will be formatted automatically upon commit via [prettier](https://npm.im/prettier)

## Roadmap

- Make non-RPi-specific
- Support alternative APIs

## Notes & Meanderings

- "Puddlenuts" is a made-up word from Roald Dahl's [The BFG](https://wikipedia.org/wiki/The_BFG).  In the book, it seems to mean "inconsequential".  I'm using it here because I like the word.

## License

Copyright 2017 [Christopher Hiller](https://boneskull.com).  Licensed Apache-2.0 
