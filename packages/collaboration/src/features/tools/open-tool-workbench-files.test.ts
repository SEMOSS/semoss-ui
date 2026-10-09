import { FILE_PANEL_COMPONENTS, FILE_PANEL_TYPES } from "@semoss/panels";
import { createWorkbenchStore } from "@semoss/workbench";
import { openToolWorkbenchFiles } from "./open-tool-workbench-files";
import {
	CALENDAR_PANEL_TYPE,
	createToolWorkbenchLayout,
	EMAILS_PANEL_TYPE,
} from "./tool-workbench.constants";

it("inserts deferred Files before Emails and Calendar and selects the same explorer again", () => {
	const snapshot = createToolWorkbenchLayout("draft-insight");
	delete snapshot.panels[FILE_PANEL_TYPES.FILE_EXPLORER];
	snapshot.borders = {
		left: {
			panelIds: [EMAILS_PANEL_TYPE, CALENDAR_PANEL_TYPE],
			activeId: null,
			size: 300,
		},
	};
	const store = createWorkbenchStore({ components: FILE_PANEL_COMPONENTS });
	store.getState().layout.actions.loadSnapshot(snapshot);
	const workbench = { store, insightId: "draft-insight" };
	openToolWorkbenchFiles(workbench);
	const explorerId = store.getState().layout.borders.left.activeId;
	expect(explorerId).toBeTruthy();
	expect(store.getState().layout.borders.left.panelIds).toEqual([
		explorerId,
		EMAILS_PANEL_TYPE,
		CALENDAR_PANEL_TYPE,
	]);
	expect(store.getState().layout.actions.canClose(explorerId)).toBe(false);
	store.getState().layout.actions.navigatePanel(EMAILS_PANEL_TYPE);
	openToolWorkbenchFiles(workbench);
	expect(store.getState().layout.borders.left.activeId).toBe(explorerId);
	expect(store.getState().layout.borders.left.panelIds).toHaveLength(3);
});
