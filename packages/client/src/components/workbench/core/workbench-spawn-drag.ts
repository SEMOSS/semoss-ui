import type {
	WorkbenchPanelParams,
	WorkbenchPanelType,
} from "@/stores/workbench";

/**
 * The `dataTransfer` type a native drag uses to say "dropping me should open a
 * panel".
 *
 * Anything outside the dock can be a drag source by writing a
 * `WorkbenchSpawnDragSpec` under this key — the file explorer's rows do, so a
 * file dragged out of the tree lands as a panel at the drop target. The drag
 * layer resolves the drop with the same geometry a dragged tab uses.
 *
 * Only `dataTransfer.types` is readable during `dragover` (the browser's
 * protected mode), which is why the *intent* lives in the key and the payload
 * is read only on `drop`.
 */
const WORKBENCH_SPAWN_DRAG_TYPE = "application/x-semoss-workbench-panel";

/** What a spawn drag asks the shell to open. */
export interface WorkbenchSpawnDragSpec {
	type: WorkbenchPanelType;
	config?: WorkbenchPanelParams;
	/** Tab name for the new instance; the blueprint's name is the fallback. */
	name?: string;
}

/**
 * Mark a native drag as one that should open a panel when dropped.
 *
 * Additive: it writes one more `dataTransfer` type and leaves whatever the drag
 * source already wrote (its own payload, its drag image) alone, so the same
 * gesture can still mean something to its origin.
 *
 * @param dataTransfer - The in-flight drag's data transfer.
 * @param spec - The panel to open on drop.
 */
export const writeSpawnDragSpec = (
	dataTransfer: DataTransfer,
	spec: WorkbenchSpawnDragSpec,
) => {
	dataTransfer.setData(WORKBENCH_SPAWN_DRAG_TYPE, JSON.stringify(spec));
};

/**
 * Whether a drag is carrying a spawn spec. Safe to call during `dragover`,
 * where the payload itself is unreadable.
 *
 * @param dataTransfer - The in-flight drag's data transfer.
 * @return True when the drag asks for a panel.
 */
export const isSpawnDrag = (dataTransfer: DataTransfer | null) =>
	Boolean(dataTransfer?.types.includes(WORKBENCH_SPAWN_DRAG_TYPE));

/**
 * Read the spawn spec off a dropped drag.
 *
 * @param dataTransfer - The dropped drag's data transfer.
 * @return The spec, or null when the drag is not a spawn drag or is malformed.
 */
export const readSpawnDragSpec = (
	dataTransfer: DataTransfer,
): WorkbenchSpawnDragSpec | null => {
	const payload = dataTransfer.getData(WORKBENCH_SPAWN_DRAG_TYPE);
	if (!payload) {
		return null;
	}

	try {
		const parsed = JSON.parse(payload) as WorkbenchSpawnDragSpec;
		return parsed && typeof parsed.type === "string" ? parsed : null;
	} catch (_e) {
		return null;
	}
};

/**
 * A drag source that handles its own drops marks its region with this
 * attribute, and the shell leaves any spawn drag inside it alone.
 *
 * The file explorer sets it on its root (keyed by instance id), which is what
 * keeps a row dropped on a folder *inside* the tree a move rather than a new
 * panel. Every one of the shell's drag handlers has to honour it — an omission
 * in `drop` alone both spawned a stray panel and swallowed the move, which is
 * why the check lives here rather than being inlined three times.
 *
 * This is the one place the dock core names something explorer-specific; a
 * fully generic opt-in would mean `@semoss/shared` hardcoding a workbench
 * attribute, which is a worse trade.
 */
const OWN_DROPS_SELECTOR = "[data-file-explorer]";

/**
 * Whether a drag event landed inside a region that handles its own drops.
 *
 * @param target - The event's target.
 * @return True when the shell should ignore this drag.
 */
export const ownsItsDrops = (target: EventTarget | null) =>
	Boolean((target as Element | null)?.closest?.(OWN_DROPS_SELECTOR));
