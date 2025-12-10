# Getting Started

1. Run `pnpm install` in root directory.

2. Launch the dev-server, by running `pnpm run dev:client`.

3. For local development on our new ui (./packages/client) and the component library (./libs)  run `pnpm run dev:client`

Note: If you have a custom setup, create a `.env.local` to configure your environment. 

```.env.local
    # development
    # path to server
    ENDPOINT=http://localhost:9090

    # name of deployed instance
    MODULE=/Monolith
```

**Do not change the .env**

# Unit Testing with Vitest

Add unit tests for @semoss/client next to the corresponding file. Files should be in a .test file format.

## Running tests:

To run tests use the following (to run a specific file add the file name to the end):
```
pnpm test
```

This will run the following script:
```
vitest run
```
