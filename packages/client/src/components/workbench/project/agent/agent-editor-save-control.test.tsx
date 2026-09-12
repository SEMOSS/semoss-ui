import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { WorkbenchChromeProps } from "@semoss/workbench";
import type { AgentEditorSaveValue } from "./agent-editor-panel";
import { AgentEditorSaveControl } from "./agent-editor-save-control";

const renderControl = (value: AgentEditorSaveValue) =>
	render(
		<AgentEditorSaveControl
			{...({ value } as WorkbenchChromeProps<
				Record<string, unknown>,
				AgentEditorSaveValue
			>)}
		/>,
	);

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
