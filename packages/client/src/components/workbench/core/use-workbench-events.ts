import { useEffect, useRef } from "react";
import { useWorkbenchStoreApi } from "@/hooks";
import type { WorkbenchProps } from "./workbench.types";

type WorkbenchEventProps = Pick<
	WorkbenchProps,
	"onPanelOpen" | "onPanelClose" | "onSelectionChange"
>;

/**
 * Bridges store transitions to the host's event props through one vanilla
 * subscription — no React re-renders are involved. Open/close is about
 * being docked somewhere, not about existing in the panels record: a closed
 * panel stays there so it can be reopened.
 */
export const useWorkbenchEvents = (props: WorkbenchEventProps): void => {
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
						if (!nextOpen.has(pid)) {
							const record =
								state.layout.panels[pid] ??
								prev.layout.panels[pid];
							if (record) {
								h.onPanelClose(pid, record);
							}
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

			prev = state;
		});
	}, [storeApi]);
};
