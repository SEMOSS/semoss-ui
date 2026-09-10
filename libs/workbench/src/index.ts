// Public surface of the dock. Deliberately explicit rather than `export *`:
// the shell's internals (tabsets, tabs, stage, borders, drag layer, panel
// hosts) are rendering details, and one of them — the WorkbenchTabset
// component — collides by name with the WorkbenchTabset layout node.

/* Panel-level building blocks */
export { useWorkbenchPanel } from "./core/use-workbench-panel";
/* The shell */
export { Workbench } from "./core/workbench";
export { WORKBENCH_STYLES } from "./core/workbench.chrome";
export type {
	WorkbenchBorderSlot,
	WorkbenchBorderSlotCtx,
	WorkbenchDragState,
	WorkbenchDropInfo,
	WorkbenchProps,
} from "./core/workbench.types";
export {
	WorkbenchAccessError,
	type WorkbenchAccessErrorProps,
} from "./core/workbench-access-error";
export {
	WorkbenchAccessLoading,
	type WorkbenchAccessLoadingProps,
} from "./core/workbench-access-loading";
/* Chrome a host can place in a border slot */
export { WorkbenchCommandMenuButton } from "./core/workbench-command-menu-button";
export { WorkbenchPanelError } from "./core/workbench-panel-error";
export { WorkbenchResetButton } from "./core/workbench-reset-button";
/* Opening a panel by dropping something onto the dock */
export * from "./core/workbench-spawn-drag";
/* Store, context, hooks */
export * from "./hooks/use-workbench";
export * from "./hooks/use-workbench-commands";
export * from "./hooks/use-workbench-control";
export * from "./hooks/use-workbench-store-api";
export * from "./store";
export { WorkbenchProvider, WorkbenchStoreContext } from "./workbench.context";
