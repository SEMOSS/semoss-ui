// The package's public surface, and the only barrel a consumer may reach.
//
// Every export names the file that defines it: no `export *`, and no hop
// through an internal folder barrel. That is the point. A symbol cannot become
// public by accident — wildcards over `./types` and the spawn-drag protocol
// used to leak 28 of them past the rule stated at the bottom of this comment —
// and this file alone answers "what does a host get, and where does it live?".
//
// The shell's internals — stage, tabsets, tabs, strips, borders, the drag
// layer, panel hosts and layers, resizers, the mobile shell and its drawer,
// the context menu, and the error boundary — are rendering details a host
// neither mounts nor types against. One of them, the `WorkbenchTabset`
// *component*, would also collide by name with the `WorkbenchTabset` layout
// node.
//
// Add to this list when a consumer genuinely needs a symbol, not before.

/* Chrome a host places in a border slot */
export { WorkbenchChromeButton } from "./components/chrome/workbench-chrome-button";
export { WorkbenchResetButton } from "./components/chrome/workbench-reset-button";
export { WorkbenchCommandMenuButton } from "./components/command/workbench-command-menu-button";
/* Panel-sized state views a panel draws in place of its own body */
export { WorkbenchPanelError } from "./components/panel/workbench-panel-error";
export { WorkbenchPanelLoading } from "./components/panel/workbench-panel-loading";
/* The shell */
export { Workbench } from "./components/shell/workbench";
/* The one size scale the chrome draws itself at */
export { WORKBENCH_STYLES } from "./constants/workbench.constants";
/* One store per mount */
export {
	WorkbenchProvider,
	WorkbenchStoreContext,
} from "./contexts/workbench.context";
/* Reading and driving that store */
export { useWorkbench } from "./hooks/use-workbench";
export { useWorkbenchCommands } from "./hooks/use-workbench-commands";
export { useWorkbenchControl } from "./hooks/use-workbench-control";
/* Telling another panel that something happened */
export { useWorkbenchEvent } from "./hooks/use-workbench-event";
/* Everything a panel renderer knows about itself — it is handed only an id */
export { useWorkbenchPanel } from "./hooks/use-workbench-panel";
export { useWorkbenchStoreApi } from "./hooks/use-workbench-store-api";
export {
	createWorkbenchStore,
	type WorkbenchState,
} from "./stores/workbench.store";
/*
 * The type contract for writing a panel and mounting a dock. Deliberately
 * narrower than `types.ts`, which stays the package's internal contract: a
 * type is exported here because a consumer imports it, and nothing is
 * published in advance. A host needing a shape that is missing should first
 * try deriving it — `ComponentProps<typeof Workbench>["borderSlots"]`, or
 * indexed access such as `NonNullable<WorkbenchPanelConfig["menuItems"]>` —
 * and add a name here only when that is unusable.
 */
export type {
	WorkbenchCommand,
	WorkbenchComponent,
	WorkbenchLayout,
	WorkbenchPanel,
	WorkbenchPanelConfig,
	WorkbenchPanelConfigAny,
	WorkbenchPanelIconProps,
	WorkbenchPanelId,
	WorkbenchPanelParams,
	WorkbenchPanelProps,
	WorkbenchPanelRecord,
	WorkbenchPanelType,
	WorkbenchSnapshot,
} from "./types";
/* Opening a panel by dropping something onto the dock */
export {
	isSpawnDrag,
	writeSpawnDragSpec,
} from "./utility/workbench-spawn-drag";
