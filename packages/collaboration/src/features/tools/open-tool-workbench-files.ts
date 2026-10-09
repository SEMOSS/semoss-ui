import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { ToolWorkbenchContextValue } from "./types/tool-workbench";

/** Reveal the room's explorer, including after its border was hidden or closed. */
export function openToolWorkbenchFiles(
	workbench: Pick<ToolWorkbenchContextValue, "store" | "insightId">,
	insightId = workbench.insightId,
): void {
	if (!insightId) throw new Error("Create a room before opening its files.");
	workbench.store.getState().layout.actions.selectPanel(
		FILE_PANEL_TYPES.FILE_EXPLORER,
		{ mode: { type: "INSIGHT", insightId } },
		{
			name: "Files",
			canClose: false,
			target: { kind: "border", side: "left", index: 0 },
		},
	);
}
