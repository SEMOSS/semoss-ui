import type { WorkbenchState } from "../workbench.store";
import type { WorkbenchCommand } from "../workbench.types";
import { WORKBENCH_SIDES } from "../workbench.types";
import { workbenchPanelProps } from "../workbench-panel-props";

/**
 * Build the layout-derived palette entries — go-to, reopen, close, border
 * toggles, maximize/reset, and panel-contributed commands —
 * from the live store. Call when the palette opens; the result is merged
 * with the registered command list (registered ids win on collision).
 *
 * @name buildWorkbenchLayoutCommands
 * @param get - The scoped workbench store's getState.
 * @return Palette entries in the shared WorkbenchCommand shape.
 */
export function buildWorkbenchLayoutCommands(
	get: () => WorkbenchState,
): WorkbenchCommand[] {
	const state = get();
	const { actions } = state.layout;
	const list: WorkbenchCommand[] = [];

	// go to any open panel, wherever it lives
	for (const stack of state.layout.stacks) {
		for (const pid of stack.panelIds) {
			const record = state.layout.panels[pid];
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

	// reopen closed panels
	for (const pid of state.layout.closed) {
		const record = state.layout.panels[pid];
		if (!record) {
			continue;
		}
		list.push({
			id: `workbench.layout.reopen.${pid}`,
			category: "View",
			label: `Reopen ${record.name}`,
			handler: () => actions.reopenPanel(pid),
		});
	}

	// close open panels that allow it
	for (const pid of state.layout.openPanelIds) {
		if (!actions.canClose(pid)) {
			continue;
		}
		list.push({
			id: `workbench.layout.close.${pid}`,
			category: "View",
			label: `Close ${state.layout.panels[pid]?.name ?? pid}`,
			handler: () => actions.closePanel(pid),
		});
	}

	// border toggles
	if (!state.layout.isMobileLayout) {
		for (const side of WORKBENCH_SIDES) {
			const border = state.layout.borders[side];
			if (!border.panelIds.length) {
				continue;
			}
			const names = border.panelIds
				.map((pid) => state.layout.panels[pid]?.name)
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
		label: state.layout.maximizedTabsetId
			? "Restore Dock"
			: "Maximize Selected Dock",
		handler: (getState) => getState().layout.actions.toggleMaximize(),
	});

	if (!state.layout.readOnly) {
		list.push({
			id: "workbench.layout.reset",
			category: "View",
			label: "Reset Layout",
			handler: (getState) => getState().layout.actions.resetLayout(),
		});
	}

	// commands contributed by the panels themselves
	for (const pid of state.layout.openPanelIds) {
		const record = state.layout.panels[pid];
		if (!record) {
			continue;
		}
		const make = state.layout.components[record.type]?.commands;
		if (typeof make !== "function") {
			continue;
		}
		try {
			const panel = workbenchPanelProps(state.layout, pid);
			for (const command of make(panel, get) ?? []) {
				list.push({
					id: `workbench.panel.${pid}.${command.id}`,
					category: command.category,
					label: command.label,
					description: command.hint ?? record.name,
					handler: () => command.run(),
				});
			}
		} catch {
			// a broken panel shouldn't take the palette down
		}
	}

	return list;
}
