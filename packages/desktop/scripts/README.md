# scripts/

Build-time scripts run via `pnpm` (see `../package.json`'s `scripts`), not
part of the app itself.

- **`generate-icon.mjs`** — rasterizes `../build/icon-source.svg` into
  `../build/icon.png` at 1024×1024 using `sharp`. Run via
  `pnpm --filter @semoss/desktop generate-icon`. Only needs re-running when
  `icon-source.svg` changes — the output PNG is checked in, not generated
  on every build.
