# Collaboration — Technical Guide

Working reference for implementing tasks in `@semoss/collaboration`
(`packages/collaboration`). Summarizes purpose, architecture, and conventions.
Authoritative detail lives in [README.md](../README.md), [PRODUCT.md](../PRODUCT.md),
[src/features/work-thread/README.md](../src/features/work-thread/README.md), and `docs/*.md`.

## 1. Purpose

A **personal SEMOSS assistant web app** (private package, Vite + React 19, port `5180`).
It unifies, for one signed-in user:

- **Chat** with SEMOSS agents (rooms, streaming runs, tool approvals, files).
- **Brief / landing overview**: composer, "Needs you" actions, calendar ("Your day"), "Handled", Brain reviews.
- **Work**: topics, action items (Open/Waiting/Handled/Snoozed), source threads, topic sessions, goals and notes.
- **Brain**: people, topics, thread context, review queue, memory, and Microsoft source readers/imports (Outlook, Teams, Calendar).
- **Routines**: scheduled agent runs whose results live in Routines (inbox daily brief, agenda, expense, custom routines, skills).
- **Settings**: About you (profile/VIPs), Appearance, Rules (context/ingestion), Data reset.
- **Onboarding**: topic setup/filing flow (`features/onboarding`).

There is no backend in this package; it talks to the existing SEMOSS backend via
pixel reactors. Frontend-only changes are the norm (README states "no backend changes needed").

## 2. Stack and workspace dependencies

React 19, react-router 8 (data router, lazy routes), Lexical (rich email/composer editors),
dnd-kit, DOMPurify, lucide-react, Tailwind via `@semoss/ui/next`.
Internal deps: `automation, connectors, i18n, panels, sdk, shared, ui, utility, workbench`.
Path alias `@/` → `src/`. Generic helpers belong in `@semoss/utility` (search before adding).

Bootstrap (`src/app.tsx`): `Env.update` (MODULE/ENDPOINT/APP/ACCESS_KEY/SECRET_KEY) →
`I18nextProvider` → `AccessStoreProvider` → `InsightProvider` → `ThemeProvider`
(storage key `smss-ui-theme-collaboration`, default light) → `Router` + `Toaster`.

## 3. Directory map

```
src/
  app.tsx, main.tsx, index.css
  app/            main.context.ts, refresh-keys.ts
  components/     common (agent-avatar, empty-view), layouts (root, authorized)
  lib/            pixel.ts (callPixel/pixel), workspace-paths, lexicon, person-name, typeface
  pages/          THIN route pages + route-config.tsx + router.tsx
  types/          agent, origin, session
  features/
    collaboration/  shell/sidebar/header/search, Work+Brain UI, shared session state
                    (state/, live/, api/, providers: thread-history, thread-insights, work-updates)
    dashboard/      landing brief, selectors, search contracts, chat history, topic sessions,
                    room↔source associations
    daily-chat/     landing/new-chat composer, drafts cache, new-chat controller/workbench
    rooms/          RoomSession (conversation owner), composer, agent-run API, uploads, source-import
    messages/       transcript rendering (markdown, tool parts, streaming)
    tools/          tool-call cards, approvals, tool workbench, email draft cards
    runs/           agent-run inspector/cards
    delegations/    delegation request/reply/approval cards
    agents/         agent directory, schemas, capability picker
    thread-assistant/ pure helpers: thread context, settings, model resolution, draft proposals
    work-thread/    README only + shared agent selector / thread-insight hook
    connectors/     Microsoft adapters (Outlook/Teams/Calendar), email draft forms, sources view
    room-connectors/ adapters hosting @semoss/connectors viewers inside the room workbench
    room-email/     per-room email editors, proposals, send approvals, source readers
    email/          Lexical email editor, sanitized HTML body rendering
    routines/       routine forms/APIs (inbox, agenda, expense, custom), open-routine-room
    settings/       settings panel + sections
    onboarding/     topic setup flow
```

Rule: **pages stay thin**; logic lives in features. Cross-feature imports use `@/features/...`.

## 4. Routing (`src/pages/route-config.tsx`)

Tree: `RootLayout` → `AuthorizedLayout` → `CollaborationLayout` (shell) → lazy pages.

| Route | Purpose |
| --- | --- |
| `/` | Landing overview + compact composer |
| `/routines` | Routines workspace |
| `/work`, `/work/all`, `/work/waiting`, `/work/done` | Topics / global work lists |
| `/topics/:topicId` | Topic workspace (Actions, Threads, Sessions, goals, notes) |
| `/work/topic/:id`, `/brain/topics/:id` | Redirect to `/topics/:id` |
| `/thread/:id` | Source-import bridge; `room:`-prefixed id = saved room |
| `/brain`, `/brain/sources`, `/brain/people[/:id]`, `/brain/threads[/:id]` | Brain |
| `/settings/{about-you,appearance,rules,data}` | Settings (legacy `/settings`, `/brain/profile`, `/settings/dashboard` → About you) |
| `/room` → Work; `/agents/*` → Brain | Legacy redirects |

New routes: add to `route-config.tsx` with `lazy` import of a thin page; keep legacy links valid.

## 5. Core architecture concepts

### 5.1 RoomSession — the single conversation owner
`features/rooms/room-session.ts`. Every conversation (new chat, saved room, imported source,
topic assistant, routine room) uses one `RoomSession` on the existing Playground harness:
collaboration rooms, `RunAgent`, streamed events, approvals, cancel, reconnect.
- Each room owns an **isolated insight** (files, uploads) and composer draft.
- New chat: agent/settings stay local until **first send**, which creates the room once
  (uncertain submissions must reconcile before re-send; failures keep draft/attachments/upload receipts).
- Room options (`PlaygroundRoomOptions`, zod-validated in `api/room-schemas.ts`) store settings and the
  `source` descriptor only (identity, saved file ref, message envelope metadata) — never bodies.
- Agent turns: `api/agent-turn-controller.ts` + `agent-turn-registry.ts` (idle controllers evicted).
- Do **not** introduce a parallel thread/assistant session.

### 5.2 Landing/new chat (`features/daily-chat`)
Landing composer is source-free with a closed workbench; first send pushes the canonical saved-room route
and consumes the landing draft. Unsent drafts are cached in-memory per history entry (Back/Forward restore).
Late preparation must never redirect over the current page. Topic "Ask assistant" has its own draft and
must confirm the room↔topic link before first send.

### 5.3 Source import (`features/rooms/source-import`)
Opening a Brain/Outlook/Teams/Calendar source: read permitted history (Brain: all 100-message pages, dedupe by id,
oldest first; Teams latest 30; Outlook selected email; calendar one event) → create room → upload one Markdown
snapshot into the room insight → queue it for first user request. Never starts an assistant request. Exclusions and
ingestion rules applied first; display HTML never goes to the assistant; attachment names only. Concurrent opens of
the same source share a pending import; later opens create fresh rooms. Failed imports retain room + receipt.

### 5.4 Work/Brain session (`features/collaboration`)
Shared session (`state/collaboration-session.context.tsx`, `live/live-session.tsx`) backed by existing `Brain*` and `Work*`
reactors (e.g. `BrainSaveTopic`, `BrainListPeople`, `BrainImportMail`, `BrainGetThreadMessages`, `BrainSaveMemory`,
`BrainStartTopicReview`, `WorkItemsList`, `WorkUpdateItem`, `WorkSummarizeThread`, `WorkSearch`, routine reactors
`Work{Get,Save}{Inbox,Agenda,Expense}Routine`, `WorkOpenRoutineRoom`). Connected edits sync to backend; sample records stay local.
Providers: thread history, thread insights, work updates (refresh summaries/actions without remounting readers).

### 5.5 Microsoft connectors (`features/connectors`, `room-connectors`, `room-email`, `email`)
Uses `Microsoft*` reactors and `oauth("microsoft")`. Bounded reads: Outlook ≤20 headers (1/7/30/90 days),
Teams ≤20 chats / 30 messages, Calendar ≤30 events next 7 days (UTC). Lists omit bodies; reading caps at
12,000 chars. Drafts: Lexical → sanitized HTML; reply/forward create native drafts; reply recipients editable and verified
before save; **save never sends**; send saves envelope first then sends that draft; uncertain outcomes require an
Outlook check; delete moves to Deleted Items; Teams sending unsupported. HTML display: DOMPurify + sandboxed
script-free iframe with CSP, remote images need consent, 128 Ki cap.
Workbench rail (Files → Emails → Calendar) hosts `@semoss/connectors` viewers via `room-connectors` adapters;
the workbench itself stays independent of connectors/auth.

### 5.6 Tools and approvals
`features/tools` renders tool calls, approval panels, tool-UI frames, memory/email-draft cards; `delegations` handles
people delegation. `CompleteGoal` auto-closes goals; `Remember` creates/updates memory (`replaces`, topic links).
Email tools (`ComposeEmail`, `SendEmail`) produce room-owned editable drafts; restored proposals never auto-open panels.

### 5.7 Routines
`features/routines` + PRODUCT.md: opt-in scheduled briefs (run time, days, lookback 1h–30d, default 1d) executed through
SEMOSS scheduler/agent-run infra; apply Brain exclusions; completed briefs appear in Routines. Types: inbox, agenda,
expense, custom, my-skills.

### 5.8 Search (⌘/Ctrl K)
Server chat-name/message search + loaded Work/Brain records + calendar week + Outlook sender/subject + pinned apps;
dedupe, ignore stale responses, isolate category failures, surface limits (5,000 actions/threads/people; 1,000 topics).
Code in `features/collaboration/components/collaboration-search.tsx`, `features/dashboard/use-workspace-search.ts`.

## 6. UI/design conventions

- Reuse `@semoss/ui` components, semantic tokens, Geist typography; no new theme/palette (see repo `DESIGN.md`).
- Layout: 56px header blending into canvas, 256px sidebar ↔ 64px rail (per-account persisted), mobile drawer < 1024px,
  44px min touch targets, workbench compact < 768px, calendar agenda < 640px.
- Conversation editors/drafts stay mounted across pane changes; header room controls render into a stable shell target.
- Rendering the brief/chat must not start agent work.
- Repo rules apply: **read `skills/react-standard.skill.md` before any React work**, plus accessibility/mobile skills as relevant.
  Don't edit `pnpm-lock.yaml`, `pom.xml`, `*.local`.

## 7. Dev, test, validate

```bash
pnpm dev:collaboration                       # port 5180
pnpm --filter @semoss/collaboration type-check
pnpm --filter @semoss/collaboration test      # vitest (jsdom, vitest.setup.ts)
pnpm --filter @semoss/collaboration build
pnpm dlx knip --workspace @semoss/collaboration
pnpm biome check <changed files>
```
Env: `ENDPOINT`, `MODULE` (usually `/Monolith`), `APP`, `ACCESS_KEY`, `SECRET_KEY`; optional HTTPS dev via
`SEMOSS_DEV_ORIGIN`, `SEMOSS_DEV_PFX`, `SEMOSS_DEV_PASSPHRASE` (binds 127.0.0.1 only; `dev-server.ts`).
Known baseline per README: a handful of pre-existing test failures and ~13 fixture type errors — compare against baseline,
don't "fix" unrelated ones. Tests sit next to sources (`*.test.ts(x)`).

## 8. Implementation checklist

1. Locate the owning feature (section 3); keep pages thin.
2. Conversation behavior → extend `RoomSession`/rooms, never add a second session.
3. Backend: reuse existing reactors via `lib/pixel.ts`; validate responses with zod schemas.
4. Guard against stale async results, double submits, navigation-after-unmount; preserve drafts on failure.
5. Respect bounds/exclusions/sanitization rules for Microsoft and source content.
6. Add/adjust colocated tests; run type-check, tests, Biome on touched files.
7. Update README/docs when behavior described there changes.

## 9. Notes

- `useRemoteBrowserSession.ts` (attached snapshot) is **not** part of this package; no references were found under
  `packages/` or `libs/`.
