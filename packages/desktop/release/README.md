# release/

Build output from `electron-builder` (see `../electron-builder.yml`). Not
part of the source tree — this whole directory is gitignored *except this
file* (there's an explicit `!packages/desktop/release/README.md` exception
in the root `.gitignore`, since a bare directory-name ignore pattern would
otherwise hide anything placed inside it, including this file).

Regenerate everything at any time with:

```bash
pnpm --filter @semoss/desktop package:mac   # macOS
pnpm --filter @semoss/desktop package:win   # Windows
pnpm --filter @semoss/desktop package       # all platforms (mac, win, linux)
```

**Rebuild whenever `app-ui/` or `electron/` changes** — these artifacts are
a point-in-time snapshot, not something that stays in sync automatically.

## What lands here

- `AI Core Playground-<version>-x64.dmg` / `-arm64.dmg` — macOS installers,
  one per architecture (electron-builder's default x64 dmg naming has no
  arch suffix; both are named explicitly here via `electron-builder.yml`'s
  `artifactName` for clarity).
- `AI Core Playground Setup <version>.exe` — **one** combined Windows
  installer covering both x64 and arm64 (picks the right payload at install
  time), rather than two separate downloads.
- `mac/`, `mac-arm64/`, `win-unpacked/`, `win-arm64-unpacked/` — the
  unpacked `.app`/`.exe` bundles electron-builder stages before packaging;
  useful for a quick launch-and-check without going through the installer.
- `.icon-icns/`, `.icon-ico/` — electron-builder's intermediate icon
  conversions, derived automatically from `../build/icon.png`.
- `builder-debug.yml`, `builder-effective-config.yaml` — electron-builder's
  own diagnostic output.

## Distribution status

Unsigned, non-notarized. On macOS, Gatekeeper will require an explicit
bypass on first launch; on Windows, SmartScreen will warn. Fine for
local/internal use; see the `// TODO`s in `../electron-builder.yml` before
distributing more broadly.
