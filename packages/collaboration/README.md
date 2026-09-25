# Collaboration

Standalone SEMOSS workspace for agent collaboration, rooms, delegations, approvals,
and streamed chat runs.

## Development

```bash
pnpm dev:collaboration
```

The app runs on port `5180`. Configure `ENDPOINT`, `MODULE`, `APP`, `ACCESS_KEY`,
and `SECRET_KEY` through the workspace environment when connecting to a SEMOSS
backend. Development credentials are not embedded in production builds.

Route pages live in `src/pages` and are loaded on demand. Feature-owned API,
component, hook, type, and utility code lives under `src/features`; generic helpers
belong in `@semoss/utility`.

## Validation

Run package checks from the repository root:

```bash
pnpm --filter @semoss/collaboration type-check
pnpm --filter @semoss/collaboration test
pnpm --filter @semoss/collaboration build
```
