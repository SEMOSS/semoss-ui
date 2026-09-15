import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createWorkbenchStore, WorkbenchProvider } from "@semoss/workbench";
import type { AgentEditorSaveValue } from "./agent-editor-panel";
import { AgentEditorSaveControl } from "./agent-editor-save-control";

/** The one panel id every case's dock holds. */
const PANEL_ID = "agent";

// the control reads its panel out of the dock now, so it needs one: a
// workbench holding a single agent editor instance, with `value` as what that
// instance published
const renderControl = (value: AgentEditorSaveValue) => {
	const workbench = createWorkbenchStore({ components: {} });
	workbench.getState().layout.actions.loadSnapshot({
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [PANEL_ID],
			activeId: PANEL_ID,
		},
		panels: { [PANEL_ID]: { id: PANEL_ID, type: "AGENT", name: "Agent" } },
	});
	workbench.getState().layout.actions.setPanelValue(PANEL_ID, value);

	return render(
		<WorkbenchProvider store={workbench}>
			<AgentEditorSaveControl id={PANEL_ID} />
		</WorkbenchProvider>,
	);
};

describe("AgentEditorSaveControl", () => {
	it("renders no Save control when the project is read-only", () => {
		renderControl({
			onSave: vi.fn(),
			isLoading: false,
			isFetching: false,
			readOnly: true,
		});

		expect(screen.queryByRole("button", { name: "Save agent" })).toBeNull();
	});

	it("runs Save when the project is editable", () => {
		const onSave = vi.fn();
		renderControl({
			onSave,
			isLoading: false,
			isFetching: false,
			readOnly: false,
		});

		fireEvent.click(screen.getByRole("button", { name: "Save agent" }));
		expect(onSave).toHaveBeenCalledOnce();
	});
});
