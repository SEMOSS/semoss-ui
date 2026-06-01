# @semoss/terminal

Standalone React app for working against a SEMOSS monolith from the browser.
Mounts at `packages/terminal/dist/`, sharing the `/Monolith` backend with
the other web apps in this repo.

## What's inside

- **`<EmbedTerminal />`** — entry shell. Mounts `<Terminal />` once the
  insight is ready.
- **`<Terminal />`** — coordinator. Renders the file explorer / editor /
  REPL panes, the REPL ↔ Editor mode toggle, view docking, and the
  top-right Help + User menu.
- **Scope picker** — segmented control above the file explorer for
  **Insight / App / User**. Picking an app calls `MyProjects()` (paged
  + searched, 50 at a time) and then `LoadApp("<project_id>")` so the file
  explorer and any newly opened tabs use the project's reactor family.
  Each open tab captures the scope (and project name when applicable) so
  the editor can dim out-of-scope tabs with a "switch back to edit"
  banner — `LoadApp` changes the server-side Python paths, so cross-scope
  Run/Save would otherwise target the wrong environment.
- **File tree** — `<FileExplorer>` from `@semoss/shared` (the same one
  the client uses). Honors INSIGHT / APP / USER modes via the shared
  file reactors (`Browse*Assets`, `Get*Assets`, `Save*Assets`, etc.).
- **File editor** — `<FileEditor>` from `@semoss/shared` (Monaco-based,
  same as the client's engine workspace). Tabs remember the scope they
  were opened in.
- **REPL** — `<TerminalConsole />`, Ace-based input editor with a Pixel
  reactor typeahead populated from `help()`. Async pixel exec via
  `runPixelAsync` + `console` polling so stdout/stderr streams in.
- **Shared output renderer** — `<CellOutputBlock>` lives in
  `libs/shared/src/components/cell-output/` and is consumed by terminal
  (and available for the notebook code-cell). Logs panel + Result panel
  with Raw/Formatted toggle, Copy, Popout, line/byte stats, and a
  collapsible `<JsonViewer>` for object/array outputs. Expand-all /
  Collapse-all broadcasts to every JSON node on the row.
- **Help dialog** — Help button in the top header opens a tabbed dialog
  (**Model / Database / Vector / Function / Storage**) that lazily fires
  `GetEngineUsage(type=["<TYPE>"])` per tab and renders the returned
  markdown with copyable code blocks.

## Layout

```
src/
├── app.tsx                        # InsightProvider + ThemeProvider + LoginPage + Toaster
├── main.tsx                       # ReactDOM root
├── index.css                      # @semoss/ui + @semoss/shared globals + @source
├── index.ts                       # public exports
├── types.ts                       # SelectedFile / FileMode / ConsoleHistoryStep / AppRef / etc.
├── assets/logos.tsx               # persona icons (R-logo.svg + PYTHON.svg from @semoss/shared, lucide Terminal for shell, inline </> for Pixel)
├── utility/
│   ├── pixel.ts                   # runPixel wrapper around actions.run
│   └── resizable.ts               # mouse-drag pane resizer (callback ref)
└── components/
    ├── tooltip.tsx                # fast CSS-only tooltip with align="start|center|end"
    ├── embed-terminal/embed-terminal.tsx
    └── terminal/
        ├── terminal.tsx           # coordinator + pane layout + lazy <TerminalConsole>/<TerminalFile>
        ├── terminal-context.tsx   # shared bridge (fileMode, selectedApp, openFile, submitToConsole, …)
        ├── scope-picker.tsx       # Insight | App | User segmented control + MyProjects() picker
        ├── help-dialog.tsx        # GetEngineUsage(type=...) tabbed cheat sheet
        ├── user-menu.tsx          # avatar + Logout popover (@semoss/ui/next Popover)
        ├── save-modal.tsx
        ├── upload-modal.tsx
    └── terminal-console/
        ├── terminal-console.tsx   # Ace REPL editor + help() typeahead + async exec
        └── transcript-row.tsx     # adapter → <CellOutputBlock>
    └── terminal-file/
        └── terminal-file.tsx      # tabs + <FileEditor> (Monaco from @semoss/shared) + Run button
```

## Run locally

```sh
# from repo root
pnpm install
pnpm dev:terminal                  # → http://localhost:5175
pnpm -F @semoss/terminal build:dev
pnpm -F @semoss/terminal build     # production
```

`pnpm dev` and `pnpm build` at the repo root pick up the terminal
package automatically alongside `@semoss/client` and `@semoss/playground`.

`.env` controls the backend:

```env
ENDPOINT=http://localhost:8080
MODULE=/Monolith
```

`MODULE` is also pushed to the SDK via `Env.update(...)` in `app.tsx` so
the insight bootstraps against the right monolith path.

## Auth gate

The app is wrapped in `<LoginPage>` from `@semoss/shared`. Until
`useInsight().isAuthorized` is true the user sees the shared `<LoginForm>`
(native + OAuth providers configured server-side). After login the
page renders `<EmbedTerminal />` directly.