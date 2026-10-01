# AGENTS.md - @semoss/desktop

This package is the SEMOSS Tauri desktop application.

## Working rules

- Follow the repository root `AGENTS.md`, `DESIGN.md`, and applicable skills.
- Keep SEMOSS business logic in existing TypeScript/Java owners.
- Keep Rust limited to native window, network, file, update, logging, and OS integration.
- Never import private source from `packages/client/src` or `packages/playground/src`.
- Reuse supported workspace package APIs and extract shared features deliberately.
- Restrict native capabilities and remote navigation to compiled instance profiles.
- Never persist credentials, session cookies, CSRF tokens, or Pixel payloads in web storage.

## Validation

```bash
pnpm --filter @semoss/desktop type-check
pnpm --filter @semoss/desktop test
pnpm --filter @semoss/desktop build
pnpm --filter @semoss/desktop tauri build
```

The Tauri command requires a Rust toolchain and platform build prerequisites.
