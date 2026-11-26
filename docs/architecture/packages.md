# SEMOSS Packages

What each package is for and where to import it from. Each package's `package.json` is the
source of truth for its dependencies and `exports`, and its `index.ts` for its API. The rules
(dependency direction, forbidden edges, feature layers) are in
[general.md: Architecture](../standards/general.md#architecture).

## Libraries

| Package | Purpose | Import from | Scope |
|---|---|---|---|
| `@semoss/utility` | Generic helpers; `StoreState` | `@semoss/utility/<category>` | Public |
| `@semoss/sdk` | HTTP, pixel, session, insights, rooms, agents | `@semoss/sdk`, `@semoss/sdk/react` | Public |
| `@semoss/ui` | Design-system components and tokens | `@semoss/ui/next`, `@semoss/ui/globals.css` | Public; bare `@semoss/ui` is legacy |
| `@semoss/i18n` | Translations, namespaces, lazy locales | `@semoss/i18n` | Public |
| `@semoss/shared` | Shared product components | `@semoss/shared`, `@semoss/shared/globals.css` | Public |
| `@semoss/connectors` | Microsoft 365 and Google Workspace viewers | `@semoss/connectors`, `@semoss/connectors/globals.css` | Public |
| `@semoss/renderer` | Notebook and block rendering, visualization | `@semoss/renderer`, `@semoss/renderer/version` | Public |
| `@semoss/workbench` | Multi-panel dock shell; domain-agnostic | `@semoss/workbench`, `@semoss/workbench/globals.css` | Public |
| `@semoss/panels` | File panels for the dock | `@semoss/panels`, `/globals.css`, `/vite` | Public |
| `@semoss/config` | Shared Vite/Vitest config, `tsconfig.base.json` (private) | `@semoss/config` | Build-time |

## Applications

| Package | Purpose | Entry | Scope |
|---|---|---|---|
| `@semoss/client` | Main web application | `src/main.tsx` | Application-internal |
| `@semoss/playground` | Chat | `src/main.tsx` | Application-internal |
| `@semoss/collaboration` | Work, rooms, connectors, routines | `src/main.tsx` | Application-internal |
| `@semoss/terminal` | Embedded terminal | `src/index.ts` | Embeddable |
| `@semoss/automation` | Automation workspace | `src/index.ts` | Embeddable |
| `@semoss/auditlog-package` | Audit log dashboard | `src/main.tsx` | Application-internal |
| `@semoss/browser-automation` | Browser automation harness | `src/main.tsx` | Application-internal |

Scope labels are defined under [API Stability and Import Rules](#api-stability-and-import-rules).

## Host Wiring

- A host that mounts a dock or file panel imports `@semoss/workbench/globals.css` and
  `@semoss/panels/globals.css`, and takes `aiSdkStubAlias` + `scopePptxViewerCssPlugin` from
  `@semoss/panels/vite` ([details](../../libs/panels/AGENTS.md#what-a-host-has-to-wire-up)).
- A host that mounts a connector viewer imports `@semoss/connectors/globals.css` and loads the
  `connectors` i18n namespace ([details](../../libs/connectors/AGENTS.md#what-a-host-has-to-wire-up)).

## State Migration

Shared application state is moving to framework-free stores built on `StoreState` from
`@semoss/utility/store`, read in React through `useStoreSelector`. MobX, Zustand, and hand-rolled
listener sets are legacy. The rules are in [react.md: State](../standards/react.md#state); the procedure is the
[add-store skill](../../skills/add-store.skill.md).

- New shared state uses a `StoreState` store. Existing stores keep their contracts and migrate one
  store per scoped change; never rewrite a legacy store as a side effect of other work.
- A package's Boundaries section in its `AGENTS.md` decides whether it can own a store:
  [ui](../../libs/ui/AGENTS.md#boundaries) and [i18n](../../libs/i18n/AGENTS.md#boundaries) cannot;
  [workbench](../../libs/workbench/AGENTS.md#boundaries) can.

| Package | Today | Direction |
|---|---|---|
| `@semoss/sdk` | Session, config, logins, permissions, and session insight on `StoreState` | Reference implementation; `InsightStore`, `AgentStore`, `RoomStore`, and `Env` are out of scope |
| `@semoss/collaboration`, `@semoss/connectors`, `@semoss/shared` | Hand-rolled `getSnapshot`/`subscribe` stores and module listener sets | Adopt `StoreState` when touched |
| `@semoss/client` | MobX (designer, workspace) and Zustand (assistant, page, workbench domains) | New state on `StoreState`; migrate per store |
| `@semoss/playground` | MobX (root, chat, room, message, tool) plus the dock's Zustand store | New state on `StoreState` or SDK hooks; migrate per store |
| `@semoss/renderer` | MobX block and notebook state | Last to move; needs a structural-sharing design first |
| `@semoss/auditlog-package` | One MobX root store | Migrate as one change |
| `@semoss/workbench`, `@semoss/panels`, `@semoss/terminal` | The dock's Zustand store and its peer | The dock's store migrates as one scoped change; hosts and the peer follow it |
| `@semoss/automation`, `@semoss/browser-automation` | React state and module listener sets | `StoreState` for any new shared state |

Package-specific migration detail lives in each package's `AGENTS.md` (for example the
[client](../../packages/client/AGENTS.md)).

## Library API Notes

- Prefer package barrels and documented subpaths over imports from `src/`.
- Use `@semoss/ui/next` for new UI rather than the legacy `@semoss/ui` surface.
- SDK low-level methods remain useful for advanced cases, but common async Pixel
  and room-stream flows currently require consumer-side orchestration.
- `@semoss/shared` is reusable, but its broad component collection means new
  additions should have more than one credible consumer before becoming shared.
- Renderer block/cell changes may require a persisted-state migration.

## API Stability and Import Rules

| Label | Meaning | Recommended import behavior |
| --- | --- | --- |
| Public library API | Designed for use by multiple packages | Import from the package export or documented subpath |
| Embeddable application API | Explicitly exported for workspace reuse | Import from the package root; avoid internal component paths |
| Application-internal | Owned by one application | Keep imports within that application |
| Host-internal | Depends on Chrome, VS Code, or CLI runtime details | Do not reuse from browser applications without an adapter |
| Deprecated/legacy | Kept for compatibility while a replacement exists | Do not add new usage; migrate when touching the code |

When adding an API, decide which label applies before exporting it. A symbol
should not become public merely because it is re-exported accidentally from a
barrel.

The client, playground, collaboration, audit log, and browser automation packages
are applications rather than general-purpose libraries. Start them with their
package scripts or embed only the components explicitly exported by an
embeddable package such as terminal or automation workspace. Do not import
application internals such as `packages/client/src/api/*` from another package
unless that boundary is deliberately promoted and documented.
