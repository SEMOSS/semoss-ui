import type {
	WorkbenchPanelId,
	WorkbenchPanelType,
	WorkbenchState,
} from "@semoss/workbench";

type WorkbenchLayoutState = WorkbenchState["layout"];
type WorkbenchSide = keyof WorkbenchLayoutState["borders"];
type WorkbenchSpawnTarget = NonNullable<
	Parameters<WorkbenchLayoutState["actions"]["spawnPanel"]>[1]
>["target"];

/** Every border a terminal can sit in. */
const SIDES: WorkbenchSide[] = ["bottom", "left", "right", "top"];

/**
 * Where a new terminal opens: the tabset or border `nearId` sits in, or the
 * bottom border when there is no such panel.
 *
 * @param layout - The workbench's layout state.
 * @param nearId - The panel to open beside.
 * @return The spawn target.
 */
const getTerminalTarget = (
	layout: WorkbenchLayoutState,
	nearId: WorkbenchPanelId | undefined,
): WorkbenchSpawnTarget => {
	if (nearId) {
		const tabset = layout.tabsets.find((candidate) =>
			candidate.panelIds.includes(nearId),
		);
		if (tabset) {
			return { kind: "join", tabsetId: tabset.id };
		}

		const side = SIDES.find((candidate) =>
			layout.borders[candidate].panelIds.includes(nearId),
		);
		if (side) {
			return { kind: "border", side: side };
		}
	}

	return { kind: "border", side: "bottom" };
};

/**
 * Opens another terminal of `type` beside `nearId`, numbered one past the
 * highest terminal of that type that is open. The number is read from the
 * open records, so it carries on from a restored layout.
 *
 * @param layout - The workbench's layout state, read when the user asks.
 * @param type - The terminal panel type to open.
 * @param nearId - The terminal to open it beside.
 * @return The new terminal's panel id.
 */
export const spawnTerminal = (
	layout: WorkbenchLayoutState,
	type: WorkbenchPanelType,
	nearId?: WorkbenchPanelId,
): WorkbenchPanelId => {
	const terminalNumbers = layout.actions
		.findPanels((panel) => panel.type === type)
		.map((panel) => Number(panel.config?.terminalNumber ?? 1))
		.filter((number) => Number.isFinite(number));
	const terminalNumber = Math.max(1, ...terminalNumbers) + 1;

	return layout.actions.spawnPanel(type, {
		name: `Terminal ${terminalNumber}`,
		config: { terminalNumber: terminalNumber },
		canClose: true,
		target: getTerminalTarget(layout, nearId),
	});
};
