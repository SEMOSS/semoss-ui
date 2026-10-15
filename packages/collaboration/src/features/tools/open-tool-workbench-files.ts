import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { ToolWorkbenchContextValue } from "./types/tool-workbench";

/** Reveal the room's explorer, including after its border was hidden or closed. */
export function openToolWorkbenchFiles(
	workbench: ToolWorkbenchContextValue,
	insightId = workbench.insightId,
): void {
	if (!insightId) throw new Error("Create a room before opening its files.");
	const id = workbench.store.getState().layout.actions.selectPanel(
		FILE_PANEL_TYPES.FILE_EXPLORER,
		{ mode: { type: "INSIGHT", insightId } },
		{
			name: "Files",
			target: { kind: "border", side: "left", index: 0 },
		},
	);
	workbench.store.getState().layout.actions.updatePanel(id, {
		minWidth: 300,
		canClose: false,
		canDrag: false,
	});
}
