import type { WorkbenchCommand } from "../workbench.types";
import { WORKBENCH_SIDES } from "../workbench.types";
import type { WorkbenchLayoutSliceState } from "./workbench-layout.slice";

/**
 * Build the layout-derived palette entries — go-to, close, border
 * toggles, and maximize/reset from the current layout. Call when the palette
 * opens; the result is merged with the registered command list.
 *
 * @name buildWorkbenchLayoutCommands
 * @param layout - The current workbench layout state.
 * @return Palette entries in the shared WorkbenchCommand shape.
 */
export function buildWorkbenchLayoutCommands(
	layout: WorkbenchLayoutSliceState,
): WorkbenchCommand[] {
	const { actions } = layout;
	const list: WorkbenchCommand[] = [];

	// go to any open panel, wherever it lives
	for (const stack of layout.stacks) {
		for (const pid of stack.panelIds) {
			const record = layout.panels[pid];
			if (!record) {
				continue;
			}
			list.push({
				id: `workbench.layout.go.${pid}`,
				category: "Go to",
				label: record.name,
				description: stack.label,
				handler: () =>
					actions.activatePanel(
						{ kind: stack.kind, id: stack.id },
						pid,
					),
			});
		}
	}

	// close open panels that allow it
	for (const pid of layout.openPanelIds) {
		if (!actions.canClose(pid)) {
			continue;
		}
		list.push({
			id: `workbench.layout.close.${pid}`,
			category: "View",
			label: `Close ${layout.panels[pid]?.name ?? pid}`,
			handler: () => actions.closePanel(pid),
		});
	}

	// border toggles
	if (!layout.isMobileLayout) {
		for (const side of WORKBENCH_SIDES) {
			const border = layout.borders[side];
			if (!border.panelIds.length) {
				continue;
			}
			const names = border.panelIds
				.map((pid) => layout.panels[pid]?.name)
				.filter(Boolean)
				.join(", ");
			const sideName = side.charAt(0).toUpperCase() + side.slice(1);
			list.push({
				id: `workbench.layout.border.${side}`,
				category: "View",
				label: `${border.activeId ? "Collapse" : "Open"} ${sideName} Border`,
				description: names,
				handler: (getState) => {
					const current = getState();
					const live = current.layout.borders[side];
					const first = live.panelIds[0];
					if (live.activeId) {
						current.layout.actions.collapseBorder(side);
					} else if (first) {
						current.layout.actions.toggleBorderPanel(side, first);
					}
				},
			});
		}
	}

	// maximize / restore
	list.push({
		id: "workbench.layout.maximize",
		category: "View",
		label: layout.maximizedTabsetId
			? "Restore Dock"
			: "Maximize Selected Dock",
		handler: (getState) => getState().layout.actions.toggleMaximize(),
	});

	if (!layout.readOnly) {
		list.push({
			id: "workbench.layout.reset",
			category: "View",
			label: "Reset Layout",
			handler: (getState) => getState().layout.actions.resetLayout(),
		});
	}

	return list;
}
