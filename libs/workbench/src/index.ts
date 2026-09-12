// The package's public surface. Deliberately curated rather than
// `export * from "./components"`: the shell's internals -- tabsets, tabs,
// stage, borders, drag layer, panel hosts and layers, resizers, the mobile
// shell, the reset button and panel-error views the shell places itself --
// are rendering details a host neither mounts nor types against. One of them,
// the `WorkbenchTabset` *component*, would also collide by name with the
// `WorkbenchTabset` layout node.
//
// Add to this list when a consumer genuinely needs a symbol, not before.

/* The shell, and the chrome a host places in a border slot */
export {
	WORKBENCH_STYLES,
	Workbench,
	WorkbenchAccessError,
	WorkbenchAccessLoading,
	WorkbenchChromeButton,
	WorkbenchCommandMenuButton,
} from "./components";
/* One store per mount */
export { WorkbenchProvider, WorkbenchStoreContext } from "./contexts";
/* Reading and driving that store */
export {
	useWorkbench,
	useWorkbenchCommands,
	useWorkbenchControl,
	useWorkbenchStoreApi,
} from "./hooks";
export {
	createWorkbenchStore,
	/* Validate a snapshot read back from wherever the host keeps it */
	parseWorkbenchSnapshot,
	type WorkbenchState,
	type WorkbenchStoreOptions,
} from "./stores";
/* The type contract for writing panels */
export * from "./types";
/* Opening a panel by dropping something onto the dock */
export * from "./utility/workbench-spawn-drag";
