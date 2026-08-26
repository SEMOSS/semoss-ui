import type { ReactNode } from "react";
import type {
	WorkbenchLayout,
	WorkbenchMoveTarget,
	WorkbenchPanelConfigAny,
	WorkbenchPanelId,
	WorkbenchPanelRecord,
	WorkbenchPanelType,
	WorkbenchRect,
	WorkbenchSide,
	WorkbenchSnapshot,
} from "@/stores/workbench";

/** What a border slot is told about the border it decorates. */
export interface WorkbenchBorderSlotCtx {
	side: WorkbenchSide;
	/**
	 * Which way the slot's content is stacked: down a left/right rail, across
	 * a top/bottom one. The shell already stacks a slot's children along this
	 * axis, so a slot only needs this to pick orientation-dependent chrome
	 * (icon rotation, a label that only fits one way).
	 */
	vertical: boolean;
	open: boolean;
	panelIds: WorkbenchPanelId[];
}

/** External rail content: a node, or a function of the border's state. */
export type WorkbenchBorderSlot =
	| ReactNode
	| ((ctx: WorkbenchBorderSlotCtx) => ReactNode);

/** Rail add-ons per side, before and/or after the panel icons. */
export type WorkbenchBorderSlots = Partial<
	Record<
		WorkbenchSide,
		{ before?: WorkbenchBorderSlot; after?: WorkbenchBorderSlot }
	>
>;

/** A resolved drop: its move target, highlight rect, and which region it hit. */
export interface WorkbenchDropInfo {
	target: WorkbenchMoveTarget;
	rect: WorkbenchRect;
	zone: "strip" | "center" | WorkbenchSide;
}

/** Live drag state, local to the drag layer. */
export interface WorkbenchDragState {
	pid: WorkbenchPanelId;
	x: number;
	y: number;
}

/** Props of the workbench shell. */
export interface WorkbenchProps {
	/**
	 * Panel blueprints keyed by type. Keep the map module-scope (or memoized)
	 * so re-registration is an identity no-op and panels never remount.
	 */
	components: Record<WorkbenchPanelType, WorkbenchPanelConfigAny>;

	/** The default arrangement. Read once per identity — the store owns it after. */
	layout: WorkbenchLayout;

	/**
	 * Rail add-ons per side (before/after the icon list). A rail carrying slot
	 * content renders even with no panels docked to it. The mobile layout has
	 * no rails, so `left.after` falls back to floating bottom-left there.
	 */
	borderSlots?: WorkbenchBorderSlots;

	/**
	 * Disables structural edits (drag, split, pin, rename, reset) while
	 * navigation still works. View-only workbenches still persist their own
	 * layout under their own id.
	 */
	readOnly?: boolean;

	/** Fired after any persisted arrangement change. */
	onLayoutChange?: (snapshot: WorkbenchSnapshot) => void;

	/** Fired when a panel becomes docked somewhere. */
	onPanelOpen?: (pid: WorkbenchPanelId) => void;

	/** Fired when a panel stops being docked, with its (still stored) record. */
	onPanelClose?: (
		pid: WorkbenchPanelId,
		record: WorkbenchPanelRecord,
	) => void;

	/** Fired when the selected panel changes. */
	onSelectionChange?: (pid: WorkbenchPanelId | undefined) => void;
}
