# release/

Output of `electron-builder` (`pnpm --filter @semoss/desktop package*`). Not
committed except this file — everything else here is gitignored
(`packages/desktop/release/*` in the root `.gitignore`, with this README
explicitly un-ignored).

`rm -rf release` (including the clean-rebuild step in the root README's
troubleshooting notes) deletes this file along with the rest of the
directory — re-add it afterward if you do that by hand.

## What lands where

```
release/
├── AI Core Playground-<version>-x64.dmg       # macOS Intel installer
├── AI Core Playground-<version>-arm64.dmg     # macOS Apple Silicon installer
├── AI Core Playground Setup <version>.exe     # Windows installer, x64 + arm64 combined
├── *.blockmap                                  # electron-updater delta-update metadata
├── mac/, mac-arm64/                            # unpacked macOS app bundles (intermediate)
├── win-unpacked/, win-arm64-unpacked/          # unpacked Windows builds (intermediate)
└── builder-debug.yml                           # electron-builder's own build log
```

Only the `.dmg` / `.exe` installers (and their `.blockmap` siblings) are
meant to be distributed. The unpacked folders and `builder-debug.yml` are
build intermediates — safe to delete, and always rebuilt from scratch on
the next `package*` run since `npmRebuild: false` doesn't cache them.

## When to rebuild

Rebuild whenever a change lands that would actually affect a packaged
build — a source change under `electron/` or `app-ui/`, a dependency bump,
or an `electron-builder.yml` change. Rebuilding after every tiny doc/comment
change isn't necessary.

```bash
pnpm --filter @semoss/desktop package:mac   # macOS x64 + arm64 .dmg
pnpm --filter @semoss/desktop package:win   # Windows x64 + arm64 combined .exe
pnpm --filter @semoss/desktop package       # all platforms (mac, win, linux)
```

Neither output is code-signed or notarized today — see the TODOs in
`../electron-builder.yml` before distributing outside local/internal use.
