import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StoreApi } from "zustand";
import type { FileExplorerApi, FileMode } from "@semoss/shared";
import {
	createWorkbenchStore,
	WorkbenchProvider,
	type WorkbenchState,
} from "@semoss/workbench";
import { FILE_PANEL_EVENTS } from "../../constants/file-panel.constants";
import { FileExplorerPane } from "./file-explorer-pane";

vi.mock("@semoss/shared", async () => {
	const actual =
		await vi.importActual<typeof import("@semoss/shared")>(
			"@semoss/shared",
		);
	return {
		...actual,
		FileExplorer: () => null,
		FileExplorerHeader: () => null,
		NewFileOverlay: () => null,
	};
});

const PANEL_ID = "explorer";

const setup = (mode: FileMode) => {
	const refresh = vi.fn();
	const explorer = {
		mode,
		capabilities: { mutate: true, upload: true },
		header: { path: "/" },
		commands: { refresh, openNewFile: vi.fn() },
	} as unknown as FileExplorerApi;

	const workbench: StoreApi<WorkbenchState> = createWorkbenchStore({
		components: {},
	});

	render(
		<WorkbenchProvider store={workbench}>
			<FileExplorerPane id={PANEL_ID} explorer={explorer} />
		</WorkbenchProvider>,
	);

	return {
		refresh,
		workbench,
		emit: (scope: string) =>
			act(() =>
				workbench
					.getState()
					.events.actions.emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
						scope,
					}),
			),
	};
};

describe("FileExplorerPane", () => {
	it("publishes its api so the chrome control can drive it", () => {
		// The control renders outside this subtree, so the scratch value is the
		// only way it reaches the explorer at all.
		const { workbench } = setup({ type: "APP", app: "project-1" });

		const published = workbench.getState().layout.values[PANEL_ID] as
			| FileExplorerApi
			| undefined;

		expect(published?.commands.refresh).toBeTypeOf("function");
	});

	it("re-reads when something else writes files in its scope", () => {
		const { refresh, emit } = setup({ type: "APP", app: "project-1" });

		emit("APP:project-1");

		expect(refresh).toHaveBeenCalledOnce();
	});

	it("ignores a write in another scope", () => {
		const { refresh, emit } = setup({ type: "APP", app: "project-1" });

		emit("APP:project-2");

		expect(refresh).not.toHaveBeenCalled();
	});
});
