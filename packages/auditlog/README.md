# @semoss/auditlog-package

Standalone dashboard for viewing SEMOSS audit logs, built with Vite, MobX, and `react-router`. MobX is legacy here; see the
[state guidance](./AGENTS.md#build-system).

```bash
pnpm --filter @semoss/auditlog-package dev     # dev server
pnpm --filter @semoss/auditlog-package build   # production build
pnpm check                                     # Biome lint/format (repo root)
```

See [AGENTS.md](./AGENTS.md) for structure and conventions.
