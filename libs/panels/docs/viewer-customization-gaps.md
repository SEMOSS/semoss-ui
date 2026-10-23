# Office viewer customization API gaps

These requests cover the public APIs still needed to replace retained viewer UI
with SEMOSS controls. They are based on the installed packages below. The current
integration keeps standard viewer controls where replacing them would lose editing
behavior. This is an upstream API backlog, not a proposal to patch dependencies.

Evidence paths use these installed-package roots, relative to the repository root:

- `xlsx/`: `libs/panels/node_modules/@christophervr/xlsx-react-viewer/dist/`
- `docx/`: `libs/panels/node_modules/docx-react-viewer/dist/`
- `pptx/`: `libs/panels/node_modules/pptx-react-viewer/dist/`
- `ui/`: `node_modules/.pnpm/ooxml-ui@1.21.0_three@0.186.1/node_modules/ooxml-ui/dist/`
- `core/`: `node_modules/.pnpm/ooxml-core@1.22.0/node_modules/ooxml-core/dist/`

Line references describe these installed builds; generated bundle locations will
change between releases.

## XLSX — @christophervr/xlsx-react-viewer 1.0.0, ooxml-ui 1.21.0

### Commands for advanced edits in the mounted workbook

- **Evidence:** `ui/xlsx/element-api.d.ts:17–28` exposes basic toolbar props and
  keeps `core` protected. `ui/xlsx.js:19466`, `spreadsheetToolbarProps`, binds a
  limited set of actions to `core.commands`. `ui/xlsx/surface-actions.d.ts:14–22`
  gives Format Cells and Find/Replace callbacks selection context, without a live
  edit session or apply/search operations.
- **Required capability:** typed state, enabled flags and bound actions for cell
  colors/fill/borders, wrapping/merging, row/column/sheet operations, sorting and
  filtering. Host dialogs need usable operations against the same mounted
  workbook, preserving validation, history and dirty tracking.
- **Retained fallback:** standard ribbon and dialogs for the selected advanced
  spreadsheet features.
- **Upstream acceptance test:** apply formatting and a structural edit from host
  controls, undo/redo both, and save/reload. A rejected validation or read-only
  action must leave the workbook unchanged and report failure to the host.

### Separate visual removal from command and file-lifecycle policy

- **Evidence:** `xlsx/index.d.ts:31–35` offers `showToolbar` and `hiddenActions`.
  `ui/xlsx.js:19160` passes hidden actions into the command registry;
  `core/xlsx/ui/index.mjs:44065`, `createCommandRegistry`, rejects hidden commands
  in `isEnabled` and execution. In contrast, `ui/xlsx.js:1667`, `templateInto`,
  and the fixed backstage options/share paths around `1730` and `18200` do not
  all pass through that registry. Full chrome is mounted around `18604`.
  Existing canvas slicers and timelines also call `session.setSlicerSelection`
  and `session.setTimelineSelection` directly in `ui/xlsx.js:13584–13680`;
  hiding their ribbon actions does not disable embedded widget interactions.
- **Required capability:** independent visibility and execution policy, plus
  granular title-bar/backstage controls. A host-owned file lifecycle must cover
  templates and direct backstage actions as well as normal file commands.
  Feature policy must also govern existing slicer/timeline canvas interactions,
  separately from whether their insertion controls are visible.
- **Retained fallback:** filtered standard chrome, with host file-command
  interception. Save remains enabled in the command registry so the host can
  handle its shortcut. Residual unfilterable chrome and existing slicer/timeline
  interactions remain standard.
- **Upstream acceptance test:** hide a Save button while its shortcut still
  reaches the host. Disable file replacement/sharing and verify every template,
  backstage entry and shortcut observes that policy. Open a workbook containing
  a slicer/timeline and verify that disabled interaction cannot mutate its
  selections, even while ordinary cell editing remains enabled.

### Replace cell, sheet and status context menus

- **Evidence:** `ui/xlsx.js:14100`, `openContextMenu`; `14215`,
  `openMenuAtActive`; and `14228`, `wireMenus`, construct internal menus. The
  keyboard path at `13983` opens the cell menu directly. Sheet-menu handling
  starts around `17035`; status-menu handling is around `18368`.
  `ui/xlsx/element-api.d.ts` provides no menu request or replacement contract.
- **Required capability:** menu requests containing the effective target,
  selection, available commands and screen/keyboard anchor; cancellation or a
  host renderer for each menu surface. Commands must remain bound to the viewer.
- **Retained fallback:** standard context menus; external pointer-event
  suppression is not a replacement for the keyboard and target-selection paths.
- **Upstream acceptance test:** right-click and Shift+F10 on cells, sheet tabs and
  status controls open only the host menu, with the same target and permission
  behavior as the standard menu.

## DOCX — docx-react-viewer 1.0.0, ooxml-ui 1.21.0

### Advanced formatting, tables and page-layout actions

- **Evidence:** `docx/index.d.ts:167–216`, `useViewerBuildingBlocks`, exposes basic
  formatting only. `ui/docx/component.d.ts:23–26` keeps `core` protected and
  `view` private. Implemented helpers include `readFontFormat`/`applyFontFormat`
  at `ui/docx.js:12595–12620`, paragraph formatting at `15117–15171`, table
  commands at `9564–9571`, table properties at `15572–15605`, and
  `PageController.applyPageSetupValues` at `18417`. Setting `documentModel`
  instead reaches `replaceDocument` at `26279`, resetting the loaded session,
  dirty state and editor history.
- **Required capability:** public snapshots and typed actions for color,
  highlight, paragraph spacing/indentation, styles, table operations/properties,
  and section page setup. Operations must target the mounted editor and retain
  its read-only/protection checks, selection, undo/redo and save behavior.
- **Retained fallback:** standard formatting, table and layout controls.
- **Upstream acceptance test:** custom controls change a selection, table and
  current section, then undo/redo and save/reload without replacing the loaded
  document. Protected or unsupported operations remain disabled or rejected.

### Keep active story selection while host controls take focus

- **Evidence:** `ui/docx.js:17681`, the story editor's `focusout` handler, closes
  the editor unless focus stays in `keepOpenWithin`. The allowlist at `19549`
  contains vendor controls and dialogs. `ui/docx/element-api.d.ts:19–33` has no
  way to register host toolbar or portal roots.
- **Required capability:** a public registration/cleanup contract for host
  control roots, or an equivalent selection-preserving command context covering
  body, header, footer and note editors.
- **Retained fallback:** native controls for active-story formatting.
- **Upstream acceptance test:** move focus from a header/footer/note selection
  into a host font control and portalled dialog; applying a change affects that
  story, preserves its history, and never silently retargets the body. Removing
  the host control unregisters its focus exception.

### Granular chrome and host-owned dialog/menu policy

- **Evidence:** `ui/docx/element-api.d.ts:17–29,58–66` exposes surface mode,
  selected host workflows and ribbon visibility, without a general chrome/menu
  policy. `ui/docx.js:25426–25459` omits the whole application shell in surface
  mode. Standard context menus are built by `createContextMenu` at `25040` and
  `attachEditorInteractions` at `25223`. Surface rendering still wires picture
  properties at `12190` and equation double-click at `12196` to vendor dialogs.
- **Required capability:** independent title/status/backstage visibility and
  host menu/dialog requests with selection-aware operations. The same policy
  must apply to ribbon, keyboard and canvas double-click entry points.
- **Retained fallback:** filtered standard ribbon, menus and advanced dialogs,
  themed by the host where supported; unfilterable regions remain standard.
- **Upstream acceptance test:** disable or replace a dialog/menu once and verify
  every entry point obeys it. Hide title/backstage UI while preserving page
  navigation, canvas editing and approved formatting controls.

## PPTX — pptx-react-viewer 4.45.0, ooxml-ui 1.21.0

### Save checkpoint and per-edit revision

- **Evidence:** `pptx/index.d.ts:492–504` and `ui/pptx/types.d.ts:28` expose
  `getContent`, without a saved-checkpoint or per-edit revision API.
  `pptx/chunk-66APV3YZ.mjs:11208` serializes and invokes `onContentChange`;
  `11384–11387` invokes `onDirtyChange` when the dirty boolean changes.
  Serialization does not mark the current history position clean, and neither
  callback is a notification of every subsequent edit while already dirty.
- **Required capability:** a serialized-content checkpoint/revision and an
  acknowledgement that marks only that successfully persisted state saved,
  without reloading or clearing undo history. Hosts also need change
  notifications sufficient to distinguish edits made during an asynchronous save.
- **Retained fallback:** retain the existing editor and conservatively keep it
  dirty after successful saves, preserving history and the ability to save again.
- **Upstream acceptance test:** saving unchanged content clears dirty state
  without losing undo. An edit during serialization/upload remains dirty after
  the earlier checkpoint is acknowledged; a stale-document acknowledgement is
  ignored. Undo/redo across the saved checkpoint reports the correct dirty state.

### Complete standalone insertion/dialog and layout workflows

- **Evidence:** `pptx/index.d.ts:979–1040` describes hook inputs/results but
  supplies no complete image/media input or general dialog request contract.
  `pptx/chunk-66APV3YZ.mjs:12545–12554` opens internal SmartArt/equation state or
  clicks private image/media input refs. Those inputs mount in
  `pptx/chunk-VUE3EPTJ.mjs:30265–30290`, inside `ViewerToolbarSection`, which is
  conditional on `showToolbar` at `35711`. The hook explicitly omits
  `onApplyLayout` and `onResetSlide` around `chunk-66APV3YZ.mjs:12700`.
- **Required capability:** host-owned picker/dialog requests with working
  insertion/apply callbacks and a supported layout/reset command surface,
  independent of mounting the vendor toolbar and its hidden inputs/dialogs.
- **Retained fallback:** standard toolbar and its selected insertion/layout
  workflows remain mounted.
- **Upstream acceptance test:** with only the hook and canvas mounted, a host
  can insert an image/media asset, apply a dialog-backed edit and apply/reset a
  layout; cancellation, permission checks, undo and serialization still work.

### Selected-element inspector sections

- **Evidence:** `ui/pptx/render/customization/inspector-customization.d.ts:1–3`
  explicitly limits `InspectorCardId` to no-selection cards.
  `ui/pptx/render/customization/customization-types.d.ts:178–181` uses that type for
  `inspector.hiddenCards`; it has no selected-element animation-card identifier.
- **Required capability:** stable visibility identifiers for selected-element
  inspector sections, including animation, without replacing the whole inspector
  or removing its formatting controls.
- **Retained fallback:** selected-element inspector remains standard, including
  the animation controls that cannot be independently hidden.
- **Upstream acceptance test:** hide animation controls with an element selected
  while text, fill, border and geometry controls remain functional; selection
  changes and reopening the inspector do not restore the hidden section.

### Primary-row and overflow policy coverage

- **Evidence:** `pptx/chunk-VUE3EPTJ.mjs:4292`, `ToolbarPrimaryRow`, mounts
  `CustomShowsControls`, `ModeSwitcher` and `OverflowMenu` without selective
  primary-row action IDs. `CustomShowsControls` at `2606` gates on general
  `canEdit`. `PresentDropdown` at `4030–4180` exposes Presenter View, rehearsal,
  setup, broadcast and subtitles outside the corresponding ribbon policy.
  `OverflowMenu` at `4225–4290` filters only selected mapped export cards and the
  print dialog; presentation-file exports and several settings/history/help
  entry points do not use the same removal policy.
- **Required capability:** stable IDs for the + Show, Presentation options and
  More actions controls, and consistent feature/capability checks on their menu
  entries. Disabling a workflow must cover secondary entry points while leaving
  basic slideshow and editing controls available.
- **Retained fallback:** these standard primary-row controls and residual menu
  entries remain visible where current supported policy cannot remove them.
- **Upstream acceptance test:** disable custom shows, presenter/setup workflows,
  exports and selected metadata/help actions; verify they are absent or rejected
  through the ribbon, primary row and overflow menu, while basic Present works.

### Comments policy in the inspector and edit operations

- **Evidence:** `pptx/chunk-VUE3EPTJ.mjs:25260`, `InspectorPaneHeader`, renders
  every `INSPECTOR_TABS` entry. The comments body at `26831` receives general
  `canEdit`, without a comments-feature/capability check. Correspondingly,
  `pptx/chunk-66APV3YZ.mjs:10164` passes general `canEdit` into `useComments`, and
  `handleAddSlideComment` at `3804` checks that flag before mutating slides.
  Browser verification confirmed that the Comments tab remains visible with
  comments disabled and `capabilities.comment = false`.
- **Required capability:** enforce the comments policy in inspector navigation,
  comment rendering and all comment mutation callbacks, independently of general
  document-edit permission.
- **Retained fallback:** the standard inspector remains for formatting; its
  residual Comments tab and editing controls cannot currently be independently
  removed or disabled through that policy.
- **Upstream acceptance test:** allow document editing but disallow comments;
  verify the inspector cannot create, edit, reply to or delete comments through
  any entry point, including callbacks retained before the policy changed.

### Playback toolbar and presenter/annotation policy

- **Evidence:** `pptx/chunk-VUE3EPTJ.mjs:27051–27104` derives playback Presenter
  View visibility from callback presence, and the full shell supplies that
  callback at `31720–31739`. The locked popup-toolbar option only skips automatic
  mouse-movement reveal at `pptx/chunk-66APV3YZ.mjs:3307`; the keyboard toggle at
  `9835` and hover handler at `pptx/chunk-VUE3EPTJ.mjs:31404` still change toolbar
  visibility. There are no selective playback-toolbar IDs for presenter and
  annotation controls.
- **Required capability:** independent playback control/feature policy for
  Presenter View and annotation tools, enforced for visible controls, keyboard
  commands and hover/reveal paths. A popup-toolbar setting must have clearly
  defined coverage rather than serving as a substitute for this policy.
- **Retained fallback:** basic slideshow stays enabled with the standard
  playback toolbar and its residual presenter/annotation controls. Disabling
  automatic popup reveal does not claim to remove those controls entirely.
- **Upstream acceptance test:** retain slide navigation while disabling
  Presenter View and annotations; pointer, hover and keyboard paths must not
  reveal or execute those workflows. Verify the configured toolbar-visibility
  policy after entering and leaving presentation mode.

### Full host menu replacement across editing surfaces

- **Evidence:** `ui/pptx/render/customization/customization-types.d.ts:104–123`
  exposes additions, filtering and disabling for selected context menus, but no
  full host menu-request renderer. Full-shell element/canvas handlers at
  `pptx/chunk-66APV3YZ.mjs:6062–6081` prevent propagation and update internal
  selection/menu state. Slide/section menus are internal around
  `pptx/chunk-VUE3EPTJ.mjs:9622–9657`.
- **Required capability:** typed host menu requests and bound commands for
  element/canvas, thumbnail, section and sorter surfaces, preserving effective
  right-click selection, multi-selection and keyboard invocation.
- **Retained fallback:** native menus remain, with available command filtering.
  This request excludes presentation-menu suppression: the existing locked
  `advanced.slideShowShowMenuOnRightClick = false` option already supplies it.
- **Upstream acceptance test:** replace each editing-surface menu with host UI;
  pointer and keyboard invocation expose the correct targets and execute only
  enabled commands without a second native menu.

## Visio — visio-react-viewer 1.0.0, ooxml-ui 1.21.0

### One public tool state for standalone blocks and the full viewer

- **Evidence:** `ui/visio.js:608`, `ViewerController.setTool`, and `7857`,
  `diagramToolbarProps.onToolChange`, operate on controller tool state. The full
  shell instead owns `ViewerCommands.#tool` at `23522`, changes it through
  `setTool` at `23673`, and uses it for gestures around `23875`.
  `ui/visio/viewer-element.d.ts` exposes the controller but no corresponding
  full-shell tool setter. Block clipboard actions around `visio.js:7791–7890`
  also depend on services registered by `mountDiagramCanvas` at `8905`.
- **Required capability:** a supported full-viewer command/state bridge, or a
  shared tool/service source used by both compositions. A host toolbar must
  control the tools and clipboard of the canvas that is actually mounted.
- **Retained fallback:** keep the full standard ribbon so drawing/text/connector
  tools and native menus continue to work together.
- **Upstream acceptance test:** drive pointer, text and connector tools from host
  controls while the full viewer is mounted; verify gestures, toolbar state,
  clipboard, permissions and undo agree. Run the same contract against the
  standalone canvas.

### Granular chrome and replacement canvas/page/stencil menus

- **Evidence:** `ui/visio/viewer-element.d.ts:50–57` offers `showToolbar`, without
  granular built-in ribbon/title/menu controls. `ui/visio.js:25142–25150` toggles
  ribbon, title bar and zoom controls together. `wireContextMenus` around `13051`
  privately resolves/selects context targets. `ShapesPane` around `8815` mounts
  `wireStencilPane` and its Quick Shapes/My Shapes menus around `8450`.
- **Required capability:** independent chrome/action policy and host menu
  requests for canvas shapes, pages and stencil entries, with target, anchor,
  enabled commands and cancellation/replacement. Standalone blocks need access
  to these workflows without reconstructing private hit testing and menus.
- **Retained fallback:** full standard viewer, ribbon and menus, including
  stencil interactions, with the supported host theme integration.
- **Upstream acceptance test:** hide unused chrome independently and replace
  shape/page/stencil menus. Right-click and keyboard invocation retain correct
  selection, approved commands and focus return without duplicate menus.
