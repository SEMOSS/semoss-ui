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

1. An **agent** is a saved collection of toolboxes, knowledge, prompts, and skills. The backend
   still calls it a workspace (`GetWorkspace`, `workspaceId`), and so do the agent pages' code.

2. A **toolbox** is a collection of tools.

3. In user-facing copy, **Workspace** is the right-hand dock of a room (`RoomWorkbench`).

See the glossary in [AGENTS.md](./AGENTS.md#glossary) for the name of each part of the app.

# Unit Testing with Vitest

Add unit tests for @semoss/playground next to the corresponding file, named `*.test.ts` or
`*.test.tsx`.

## Running tests:

To run tests use the following (to run a specific file add the file name to the end):
```
pnpm test
```

This will run the following script:
```
vitest run
```
