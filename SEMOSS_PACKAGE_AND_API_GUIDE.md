# SEMOSS Package and API Guide

## What This Document Is

This is a practical map of the SEMOSS codebase. It explains what each library
or application is for, where developers import it from, and the main capabilities
available there.

This is a human-maintained guide, not generated API documentation. The symbols
listed below are representative entry points and should be checked against the
source barrel before adding a new public contract.

### Scope Labels

- **Public library API**: intended to be consumed through the package export.
- **Embeddable application API**: exported for reuse inside this workspace, but
  not currently presented as a generally published product API.
- **Application-internal**: useful within that application; other packages should
  not depend on its source files directly.
- **Host-internal**: tied to a CLI, browser extension, or VS Code host.

## Libraries

| Package | What it provides | Main import path | Representative APIs | Typical consumers | Scope |
| --- | --- | --- | --- | --- | --- |
| `@semoss/config` | Shared Vite, library-build, proxy, and Vitest configuration | `@semoss/config` | `createViteConfig`, `createViteLibConfig`, `localeManualChunks` | Workspace libraries and applications | Public library API, primarily build-time |
| `@semoss/sdk` | HTTP, Pixel execution, environments, rooms, agents, insights, and stores | `@semoss/sdk` | `get`, `post`, `runPixel`, `runPixelAsync`, `Env`, `CSRF`, `AgentStore`, `InsightStore`, `RoomStore`, `createRoom` | Client, playground, terminal, CLI, shared components | Public library API |
| `@semoss/sdk/react` | React bindings for SDK state and API calls | `@semoss/sdk/react` | `usePixel`, `InsightProvider`, `useCsrf`, `waitForEmbedAuth`, React contexts/hooks | React applications | Public library API |
| `@semoss/ui` | Legacy and base UI exports | `@semoss/ui` | Base components and styles | Existing consumers during migration | Public, legacy surface |
| `@semoss/ui/next` | Current SEMOSS design-system components and hooks | `@semoss/ui/next` | `Button`, `Dialog`, `Form`, `FormInput`, `Table`, `Select`, `Tabs`, `toast`, `Spinner`, `cn`, `useTheme` | All modern React UI | Public library API; preferred UI surface |
| `@semoss/i18n` | Translation setup, resources, namespaces, and lazy locale loading | `@semoss/i18n` | `I18nBuilder`, `I18nBuilderOptions`, `preloadNamespaces`, resource configs, `useTranslation` | Client, playground, terminal, audit log, shared UI | Public library API |
| `@semoss/shared` | Reusable product components, editors, file explorer, workbench pieces, and shared styles | `@semoss/shared` | `FileExplorer`, `useFileExplorer`, Monaco/editor wrappers, FlexLayout, MCP/prompt/skill/engine UI, upload and metadata components | Client, playground, terminal, audit log, automation workspace | Public library API |
| `@semoss/shared` styles | Shared CSS required by consumers of shared components | `@semoss/shared/globals.css`, `@semoss/shared/flexlayout.css` | Global and FlexLayout styles | Applications embedding shared components | Public package asset |
| `@semoss/utility` | Small cross-package helpers kept separate from shared product components | `@semoss/utility` | Date formatting, string/identifier transforms, clipboard access, image helpers, JSON parsing/copying | Any library or application that needs generic helpers | Public library API |
| `@semoss/renderer` | Notebook/block rendering, cells, visualization, and persistence migrations | `@semoss/renderer` | `RendererEngine`, `Blocks`, `DefaultBlocks`, `DefaultCells`, `useBlock`, `useBlocks`, `useBlocksPixel`, `useFrame`, `useFrameHeaders` | Client and notebook/visualization consumers | Public library API |
| `@semoss/renderer/version` | Renderer version information | `@semoss/renderer/version` | Version export | Build and compatibility tooling | Public package subpath |

### Library API Notes

- Prefer package barrels and documented subpaths over imports from `src/`.
- Use `@semoss/ui/next` for new UI rather than the legacy `@semoss/ui` surface.
- SDK low-level methods remain useful for advanced cases, but common async Pixel
  and room-stream flows currently require consumer-side orchestration.
- `@semoss/shared` is reusable, but its broad component collection means new
  additions should have more than one credible consumer before becoming shared.
- Renderer block/cell changes may require a persisted-state migration.

## Applications and Embeddable Surfaces

| Package | What it provides | Main entry point | Representative APIs or surfaces | Typical use | Scope |
| --- | --- | --- | --- | --- | --- |
| `@semoss/client` | Main SEMOSS web application | `packages/client/src/main.tsx`, `App.tsx` | Domain APIs for auth, projects, engines, databases, rooms, teams, themes, access, GitHub, and guardrails; `useRootStore`; feature contexts | Primary browser application | Application-internal |
| `@semoss/playground` | Chat and room-oriented application | `packages/playground/src/main.tsx`, `App.tsx` | Chat/room stores, input and response message models, playground routes and views | Browser chat/playground experience | Application-internal |
| `@semoss/terminal` | Embedded terminal and terminal panels | `packages/terminal/src/index.ts` | Terminal components, console/panel surfaces, provider and terminal hooks | Embedded by client or used as a standalone app | Embeddable application API |
| `@semoss/automation` | Visual workflow editor and automation run UI | `packages/automation/src/index.ts` | `AutomationCanvas`, `InspectorTab`, `RunsTab`, `AgentRunDialog`, automation document/node/run types | Embedded by client or used through the standalone/MCP surface | Embeddable application API |
| `@semoss/auditlog-package` | Audit log dashboard | `packages/auditlog/src/main.tsx`, `App.tsx` | Audit log routes and dashboard UI | Standalone or embedded audit log view | Application-internal |
| `@semoss/browser-automation` | Browser automation application and harness UI | `packages/browser-automation/src/main.tsx`, `App.tsx` | Browser automation views, MCP/browser integration, insight-backed application shell | Browser automation workflows | Application-internal |
| `@semoss/cli` | Node command-line tooling | `@semoss/cli`, `bin/run.js` | oclif command runner; commands such as `init` and `deploy` | Terminal/Node users | Host-facing public API |
| Chrome extension | Browser automation extension | `packages/chrome-extension` build and manifest | Background, content, devtools, options, panel, and browser automation surfaces | Chrome runtime | Host-internal |
| VS Code extension | SEMOSS VS Code integration | `packages/vscode-extension/src` and compiled extension entry | Commands for authorize, instance selection, app creation, chat, zip, and deploy; sidebar webview | VS Code runtime | Host-internal |

## Application API Details

### Client Domain APIs

The client keeps backend-facing functions grouped by domain under
`packages/client/src/api/`. The main groups include:

- `auth.ts`: configuration, login, OTP, LDAP, password-reset setup, and file
  download/auth-related flows.
- `projects.ts`: project retrieval and project operations.
- `engines.ts` and `databases.ts`: engine/database discovery and operations.
- `rooms.ts`: room-related application calls.
- `teams.ts` and `user-access.ts`: membership and authorization operations.
- `theme.ts`, `github.ts`, and `guardrails.ts`: application-specific integrations.

These are valuable APIs inside the client, but they are not currently a stable
cross-package API. Other applications should generally use `@semoss/sdk` or a
future shared domain API rather than importing client source files.

### Automation Workspace Domain APIs

The automation package has a stronger embeddable contract:

- Canvas UI: `AutomationCanvas` and its imperative handle for refresh, inspector
  actions, scheduling preparation, and historical-run viewing.
- Supporting UI: `InspectorTab`, `RunsTab`, and `AgentRunDialog`.
- Domain model: automation nodes, edges, workflow documents, ports, node
  configuration, run summaries, and node results.
- Conversion/adapters: canvas-to-workflow conversion, workflow-to-canvas
  conversion, n8n import/export, and automation file import/export.
- Registry: node definitions, ports, display metadata, and configuration shapes.

The package is reusable within the workspace, but its backend workflow contract
should be treated as versioned before external publication.

## Quick Examples

These examples show the common starting point for each reusable package. They
are intentionally small; they are not intended to replace the package's types,
feature documentation, or error-handling requirements.

### `@semoss/sdk/react`: Read Pixel Data

```tsx
import { usePixel } from "@semoss/sdk/react";

function EngineList() {
  const { status, data, error, refresh } = usePixel(
    "GetEngines();",
    {
      onError: (_data, pixelError) => {
        console.error(pixelError);
      },
    },
  );

  if (status === "LOADING") {
    return <span>Loading...</span>;
  }

  if (error) {
    return <button onClick={refresh}>Retry</button>;
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

For more involved work, provide a type parameter and use the returned status,
data, error, and refresh values to define the complete loading/error/success
state.

### `@semoss/ui/next`: Compose UI Primitives

```tsx
import { Button, Dialog, DialogContent, DialogTrigger } from "@semoss/ui/next";

function DeleteButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <p>This action cannot be undone.</p>
        <Button variant="destructive">Confirm delete</Button>
      </DialogContent>
    </Dialog>
  );
}
```

Use the same package for forms, fields, typography, tables, feedback, and
overlays. New application UI should use semantic tokens and these primitives
instead of creating one-off controls.

### `@semoss/i18n`: Translate a Component

```tsx
import { useTranslation } from "@semoss/i18n";

function SaveStatus() {
  const { t } = useTranslation("common");

  return <span>{t("fileExplorer.toasts.saveSuccess")}</span>;
}
```

Application startup must initialize the appropriate resource set with
`I18nBuilder` before the first render. The exact resource set depends on the
application (`clientResources`, `playgroundResources`, and so on).

### `@semoss/shared`: Use the File Explorer API

```tsx
import { FileExplorer, useFileExplorer } from "@semoss/shared";

function ProjectFiles() {
  const explorer = useFileExplorer({
    mode: { type: "PROJECT" },
    initialPath: "/files",
    readOnly: false,
  });

  return <FileExplorer api={explorer} />;
}
```

The real feature normally supplies callbacks and an adapter for operations such
as selecting, moving, deleting, and writing files. Keep those capabilities in
the adapter rather than duplicating file-operation logic in the visual tree.

### `@semoss/utility`: Use Generic Helpers

Import generic behavior from the package index so consumers do not depend on the
larger shared component package:

```ts
import {
  formatDateToRelative,
  getImageMimeType,
  hasInlineImage,
  normalizeTimestamp,
} from "@semoss/utility";

const label = formatDateToRelative("2026-09-15T12:00:00Z");
const timestamp = normalizeTimestamp("2026-09-15 12:00:00");
const mime = getImageMimeType("png");
const containsImage = hasInlineImage('<img src="data:image/png;base64,abc">');
```

`@semoss/utility` deliberately has no dependency on `@semoss/shared` or UI
notification systems. Clipboard helpers return a rejected promise on failure;
the consuming application decides whether to show a toast, alert, or inline
error. New generic helpers belong here only when they have multiple consumers
and a stable contract.

### `@semoss/renderer`: Use Renderer Hooks

```tsx
import { useBlocksPixel } from "@semoss/renderer";

function BlockData() {
  const { status, data } = useBlocksPixel("GetFrame(frame=[\"sales\"]);");

  if (status === "LOADING") {
    return <span>Loading...</span>;
  }

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

Adding a new block or cell also requires following the renderer registry and,
when the persisted shape changes, adding a state migration.

### `@semoss/config`: Configure Vite

```ts
import { createViteConfig } from "@semoss/config";

export default createViteConfig({
  rootDir: import.meta.dirname,
  port: 5173,
  enableReact: true,
  enableTailwind: true,
});
```

Libraries use `createViteLibConfig` instead so their entry points, externals,
CSS, and declaration output are configured consistently.

### `@semoss/automation`: Embed the Canvas

```tsx
import { useRef } from "react";
import {
  AutomationCanvas,
  type AutomationCanvasHandle,
} from "@semoss/automation";

function WorkflowEditor({ appId }: { appId: string }) {
  const canvasRef = useRef<AutomationCanvasHandle>(null);

  return (
    <AutomationCanvas
      ref={canvasRef}
      appId={appId}
      onHistoryChanged={() => console.log("history changed")}
    />
  );
}
```

The handle supports imperative operations such as `refresh` and
`applyInspectorAction`. Use callback props for trace, inspector, and history
updates rather than reaching into the canvas's internal state.

### `@semoss/cli`: Run a Command

The CLI is consumed from a shell rather than imported into a React application:

```bash
pnpm exec @semoss/cli init
pnpm exec @semoss/cli deploy
```

Use `--help` on a command to see its current flags. The CLI command set and
flags are host-facing and should be checked against the installed version.

### Applications: Prefer Their Public Integration Surface

The client, playground, audit log, browser automation, and extension packages
are applications rather than general-purpose libraries. Start them with their
package scripts or embed only the components explicitly exported by an
embeddable package such as terminal or automation workspace. Do not import
application internals such as `packages/client/src/api/*` from another package
unless that boundary is deliberately promoted and documented.

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

## Recommended Follow-Up

1. Keep this guide at the package and capability level; do not turn it into a
   dump of every internal function.
2. Add exact signatures and input/output types only for APIs that are intended to
   cross a package boundary.
3. Add a deprecation column when an old and new API coexist.
4. Consider generating a lightweight export list from TypeScript declarations,
   while keeping intended consumers and stability labels human-maintained.
5. Update this guide when a package adds an entry point, changes a major contract,
   or promotes an application-internal surface to a reusable library API.
