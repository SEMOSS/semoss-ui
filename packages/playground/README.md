# Getting Started

1. Run `pnpm install` in root directory.

2. Launch the dev-server, by running `pnpm run dev:playground`.

Note: If you have a custom setup, create a `.env.local` to configure your environment. 

```.env.local
    # development
    # path to server
    ENDPOINT=http://localhost:9090

    # name of deployed instance
    MODULE=/Monolith
```

**Do not change the .env**

# Notes on Naming

1. "WORKSPACE" = Collection of "Toolbox, Knowledge, Prompt"

2. "Toolbox" = Collection of "Tools"

# Unit Testing with Vitest

Add unit tests for @semoss/playground next to the corresponding file. Files should be in a .test file format.

## Running tests:

To run tests use the following (to run a specific file add the file name to the end):
```
pnpm test
```

This will run the following script:
```
vitest run
```
