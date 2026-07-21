# build/

Inputs to `electron-builder` (`buildResources: build`, see
`../electron-builder.yml`) and the app's runtime icon.

- **`icon-source.svg`** — the SEMOSS mark (three circles), re-traced from
  `libs/shared/src/assets/img/SEMOSS.tsx`, laid out on a square 56×56
  canvas with margin so it rasterizes cleanly as an app icon. This is the
  file to edit if the mark ever changes.
- **`icon.png`** — generated, checked in. 1024×1024, transparent background
  (verified: alpha is genuinely 0 at the corners, not a synthesized
  background — if an app icon ever looks like it has an unwanted white box
  around it, that's very likely a Dock/Finder/DMG rendering convention, not
  this file). `electron-builder` derives `.icns` (mac) and `.ico` (Windows)
  from it automatically — there's no need to hand-author those.

Regenerate `icon.png` after editing `icon-source.svg`:

```bash
pnpm --filter @semoss/desktop generate-icon
```

See `../scripts/README.md` for what that script actually does.
