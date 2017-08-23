# puddlenuts

> CLI to help create custom classifiers for visual recognition systems

## Requirements

- Node 8.x, npm v5.x
- Raspberry Pi w/ camera & `raspistill` installed
- [Bluemix](https://www.ibm.com/cloud-computing/bluemix/) and/or [Watson Visual Recognition Service](https://www.ibm.com/watson/services/visual-recognition/) API key

## Usage

Show help:

```bash
$ npx puddlenuts --help
```

You should define a `PUDDLENUTS_API_KEY` env var corresponding to your Visual Recognition API key.

You can also place this in an `.env` file in your current working directory.

## Sub-Commands

### `shoot`

Take a bunch of photos with the camera, put them into `.zip` files corresponding to classes, and upload them into a classifier for training.  See `npx puddlenuts shoot --help` for details.

### `train` 

Upload `.zip` file(s) to a new or existing classifier for training or retraining.  See `npx puddlenuts train --help` for details.

### `classify`

Take a photo with the camera or use an on-disk image to classify against a previously-trained classifier.  See `npx puddlnuts classify --help` for details.

## Development

- Yes, this needs tests.
- `@types/*` packages included in this project's `devDependencies` are for IDE type inference; this is not a TypeScript project.

## License

Copyright 2017 [Christopher Hiller](https://boneskull.com).  Licensed Apache-2.0 
