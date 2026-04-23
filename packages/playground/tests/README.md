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

If `tests/.auth/user.json` does not exist, `global-setup.ts` prompts for a
username and password, logs in headlessly, and saves the browser storage
state. Subsequent runs reuse that state until the session expires — at which
point the next run will prompt again.

Non-interactive environments (CI) can skip the prompt by exporting:

```bash
export PLAYGROUND_USER=...
export PLAYGROUND_PASS=...
```

To force a fresh login without running any tests:

```bash
pnpm login            # prompts, saves session
pnpm login --headed   # same, but opens a real browser so you can watch
pnpm logout           # deletes the saved session
```

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
