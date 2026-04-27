# @semoss/playground-e2e

Playwright workflows that exercise the `@semoss/playground` web app end-to-end.

The suite assumes the playground and its backend are already running. It does
not spin up a server, and it does not ship credentials — on first run it
prompts for a login, saves the session locally, and reuses it from then on.

## Layout

```
tests/
├── playwright.config.ts    # test runner config (baseURL, storageState, reporters)
├── global-setup.ts         # creates .auth/user.json on first run
├── scripts/login.ts        # standalone `pnpm login` CLI
├── helpers/
│   ├── auth.ts             # credential prompt + login helper
│   └── random.ts           # disposable test-data naming
├── fixtures/               # page objects injected as test fixtures
│   ├── index.ts              ← import { test, expect } from here
│   ├── login-page.ts
│   ├── sidebar.ts
│   ├── chat-room.ts
│   ├── agent-manager.ts
│   ├── agent-editor.ts
│   ├── pickers.ts            (Toolbox + Knowledge pickers)
│   └── room-settings.ts
└── workflows/              # one spec file per user-facing flow
    ├── 01-smoke.spec.ts
    ├── 02-room-send-message.spec.ts
    ├── 03-agent-crud.spec.ts
    ├── 04-room-settings.spec.ts
    └── 05-agent-detail-tabs.spec.ts
```

## One-time setup

```bash
pnpm --filter @semoss/playground-e2e install-browsers   # downloads Chromium
```

## Running

Make sure the playground is reachable. The default base URL matches the Tomcat
build output you see in the browser:

```
http://localhost:9090/SemossWeb/packages/playground/dist/
```

Override it with `PLAYGROUND_BASE_URL` (e.g. the Vite dev server on `:5174`).

```bash
# From the tests/ dir (or via pnpm --filter from repo root)
pnpm test                   # all workflows, headless
pnpm test:headed            # watch a real browser
pnpm test:ui                # Playwright UI mode (great for debugging)
pnpm test:smoke             # only @smoke-tagged specs
pnpm test:rooms             # only @rooms-tagged specs
pnpm test:agents            # only @agents-tagged specs
pnpm report                 # open the last HTML report
```

### First-run authentication

If `tests/.auth/user.json` does not exist, `global-setup.ts` runs a **scripted**
login — it either reads `PLAYGROUND_USER` / `PLAYGROUND_PASS` env vars or
prompts at the terminal, logs in headlessly, and saves the browser storage
state. This path is CI-friendly and matches the native username+password form.
Subsequent runs reuse the saved state until the session expires.

For local development — especially if your tenant is behind SSO/MFA — it's
usually easier to refresh the session by hand using the standalone login
script (see below).

Non-interactive environments (CI) should export:

```bash
export PLAYGROUND_USER=...
export PLAYGROUND_PASS=...
```

To force a fresh login without running any tests:

> Always use `pnpm run login` — `pnpm login` without `run` hits pnpm's built-in
> npm-registry login and will send you to npmjs.com. Same for `pnpm logout`.

```bash
pnpm run login                           # default: opens a real browser, log in by hand (SSO/MFA)
pnpm run login -- --scripted             # prompts for user/pass (or uses env vars), headless
pnpm run login -- --scripted --headed    # scripted but headful, so you can watch Playwright type the creds
pnpm run logout                          # deletes the saved session
```

Flags go after `--` so pnpm doesn't swallow them.

Env var overrides:

- `PLAYGROUND_BASE_URL` — point at a different playground (e.g. Vite dev server on `:5174`). Applies to every mode.
- `PLAYGROUND_USER` / `PLAYGROUND_PASS` — only read by `--scripted` mode and `global-setup.ts`. Ignored in the default (manual) mode.
- `PLAYGROUND_LOGIN_TIMEOUT_MS` — override the default 5-minute timeout in manual mode.

## Conventions

- **Disposable data.** Every workflow that creates an agent, room, or other
  persistent resource uses `randomAgentName()` / `randomRoomMessage()` from
  `helpers/random.ts`. Names are prefixed with `e2e-` so leftover artifacts
  are easy to spot if cleanup ever misses.
- **Self-cleanup.** Each workflow deletes what it creates in the same test
  (or an `afterEach`). Don't leak state between runs.
- **Tags drive subsets.** Add `@smoke`, `@rooms`, `@agents`, `@auth`, etc. to
  test titles. The `pnpm test:<tag>` scripts grep by tag.
- **Selectors.** Prefer, in order: `getByTestId` (for the agent form),
  `getByRole` + accessible name, `getByPlaceholder`, `getByText`. Raw CSS is
  a last resort. Page objects own selectors so churn is centralized.
- **Waits.** Use `waitForURL` after navigation, `waitFor()` or `toBeVisible`
  for elements, and `page.waitForFunction` when you need a DOM predicate.
  Avoid `page.waitForTimeout` — it's flaky and slow.

## Recording a workflow

Playwright's `codegen` opens a browser with an inspector pane that writes test
code as you click. Use it to bootstrap a new spec, then clean it up before
committing.

```bash
pnpm run record       # writes workflows/recorded-<timestamp>.spec.ts as you click
pnpm run record:new   # opens codegen with no output file — copy snippets ad-hoc
```

Both commands load `.auth/user.json` so you start logged in. Run
`pnpm run login` first if you don't have a saved session. Override the target
URL with `PLAYGROUND_BASE_URL` (e.g. point at the Vite dev server on `:5174`).

### Cleanup checklist

Codegen produces a runnable but verbose spec. Treat it as a first draft.
Before committing:

- [ ] **Rename the file.** `recorded-1714247000.spec.ts` → `NN-short-name.spec.ts`
      matching the existing numbering.
- [ ] **Tighten selectors.** Replace `nth=0` and brittle `getByText(...)` with
      role / test-id selectors. Move shared selectors onto the relevant page
      object in `fixtures/` so churn is centralized.
- [ ] **Swap hardcoded data for random helpers.** Literal `"my agent"` →
      `randomAgentName()` so reruns don't collide.
- [ ] **Add `expect()` assertions.** Codegen records actions, not assertions —
      at minimum assert the end state (visible toast, URL change, list entry).
- [ ] **Wrap in `test.describe(...)` and tag the title.** Add `@smoke` /
      `@rooms` / `@agents` so the tag-filtered scripts pick it up.
- [ ] **Add cleanup.** If the recording created persistent state (agent, room),
      delete it in the same test or an `afterEach`. See *Conventions* above.
- [ ] **Switch the import.** `from "@playwright/test"` → `from "../fixtures"` so
      the spec uses the shared fixtures.
- [ ] **Run it.** `pnpm test workflows/your-spec.spec.ts` headless and headed
      at least once before pushing.

## Adding a new workflow

1. If you need new interactions, add them to a page object in `fixtures/`.
   Keep page objects narrow — a page object exposes *what a user can do*, not
   how the DOM is structured. If you add a new surface, add a new file and
   register it in `fixtures/index.ts`.
2. Create `workflows/NN-short-name.spec.ts` and import `{ test, expect }`
   from `../fixtures`.
3. Use `test.describe(...)` with tag metadata and give each `test()` a clear
   title ending in the tag(s) it belongs to (e.g. `@agents @smoke`).
4. Any resources the workflow creates must be cleaned up before the test
   ends, even on failure — use `test.step()` and `try/finally` if needed.

## Using the subagent

A Claude Code subagent (`.claude/agents/playground-tester.md`) knows this
harness inside out. It can:

- Run workflows (`pnpm test`, specific tags, specific files)
- Diff the current branch against `dev` and re-run affected workflows
- Add / update / remove workflows based on detected UI changes
- Debug failing tests by reading traces and screenshots under
  `tests/test-results/`

Invoke it by asking Claude Code e.g. *"run the playground e2e suite"* or
*"check which playground workflows this branch breaks"*.
