import { useEffect, useRef } from "react";
import { useWorkbenchStoreApi } from "../hooks/use-workbench-store-api";
import type { WorkbenchState } from "../stores/workbench.store";
import type {
	WorkbenchPanelId,
	WorkbenchPanelRecord,
	WorkbenchSnapshot,
} from "../types";

interface WorkbenchLifeCycleProps {
	onPanelOpen?: (pid: WorkbenchPanelId) => void;
	onPanelClose?: (
		pid: WorkbenchPanelId,
		record: WorkbenchPanelRecord,
	) => void;
	onSelectionChange?: (pid: WorkbenchPanelId | undefined) => void;
	onChange?: (snapshot: WorkbenchSnapshot) => void;
}

/**
 * Whether anything a snapshot holds moved.
 *
 * Compared by reference, not by value: `commit` spreads the previous slice
 * before its patch, so a field it did not touch keeps its identity — and every
 * transient write (`measureSlots`, `setPanelValue`, `setDragging`,
 * `setEditingPanel`, `markComponentReady`) is a plain `set` that touches one
 * field none of these are. Recents come from the command slice, which writes
 * them the same way, so they are picked up here rather than waiting for the
 * next arrangement change.
 */
const snapshotChanged = (a: WorkbenchState, b: WorkbenchState): boolean =>
	a.layout.tree !== b.layout.tree ||
	a.layout.borders !== b.layout.borders ||
	a.layout.panels !== b.layout.panels ||
	a.layout.selection.panel !== b.layout.selection.panel ||
	a.layout.maximizedTabsetId !== b.layout.maximizedTabsetId ||
	a.command.recentCommands !== b.command.recentCommands;

/**
 * Bridges store transitions to the host's event props through one vanilla
 * subscription — no React re-renders are involved. Open/close is about being
 * docked somewhere, not about existing in the panels record.
 *
 * These are host props, not workbench events. A panel opening is not something
 * another panel has ever needed to hear about, and an event nothing subscribes
 * to is surface with no consumer. Should one ever need it, emit from this diff
 * rather than from the layout actions: a panel becomes open through spawn,
 * move, `loadSnapshot` and a border toggle alike, so only the diff catches
 * every path — and emitting inside an action would run handlers mid-`set`.
 */
export const useWorkbenchLifeCycle = (props: WorkbenchLifeCycleProps): void => {
	const storeApi = useWorkbenchStoreApi();
	const handlers = useRef(props);
	handlers.current = props;

	useEffect(() => {
		let prev = storeApi.getState();
		let prevOpen = new Set(prev.layout.openPanelIds);

		return storeApi.subscribe((state) => {
			const h = handlers.current;

			if (state.layout.openPanelIds !== prev.layout.openPanelIds) {
				const nextOpen = new Set(state.layout.openPanelIds);
				if (h.onPanelOpen) {
					for (const pid of nextOpen) {
						if (!prevOpen.has(pid)) {
							h.onPanelOpen(pid);
						}
					}
				}
				if (h.onPanelClose) {
					for (const pid of prevOpen) {
						if (nextOpen.has(pid)) {
							continue;
						}
						const record =
							state.layout.panels[pid] ?? prev.layout.panels[pid];
						if (record) {
							h.onPanelClose(pid, record);
						}
					}
				}
				prevOpen = nextOpen;
			}

			if (
				h.onSelectionChange &&
				state.layout.selection.panel !== prev.layout.selection.panel
			) {
				h.onSelectionChange(state.layout.selection.panel);
			}

			// `prev` is seeded inside this effect, and the shell applies its
			// snapshot in a layout effect -- earlier than this passive one --
			// so hydration is already the baseline and never fires.
			if (h.onChange && snapshotChanged(state, prev)) {
				h.onChange(state.layout.actions.getSnapshot());
			}

			prev = state;
		});
	}, [storeApi]);
};
