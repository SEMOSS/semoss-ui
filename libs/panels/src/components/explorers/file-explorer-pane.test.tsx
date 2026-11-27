import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StoreApi } from "zustand";
import type {
	FileExplorerApi,
	FileExplorerProps,
	FileMode,
} from "@semoss/shared";
import {
	createWorkbenchStore,
	WorkbenchProvider,
	type WorkbenchState,
} from "@semoss/workbench";
import { FILE_PANEL_EVENTS } from "../../constants/file-panel.constants";
import { FileExplorerPane } from "./file-explorer-pane";

// the explorer itself is not under test: it says which root is active, and
// the test picks it
const active = vi.hoisted(() => ({ index: 0 }));
vi.mock("@semoss/shared", async () => {
	const actual =
		await vi.importActual<typeof import("@semoss/shared")>(
			"@semoss/shared",
		);
	const { useEffect } = await import("react");
	return {
		...actual,
		FileExplorer: ({
			explorers,
			onActiveRootChange,
		}: FileExplorerProps) => {
			const root = explorers[active.index];
			useEffect(() => {
				onActiveRootChange?.(root, root.explorer);
			});
			return null;
		},
		FileExplorerHeader: () => null,
		NewFileOverlay: () => null,
	};
});

const PANEL_ID = "explorer";

const setup = (mode: FileMode, roots: FileExplorerProps["explorers"] = []) => {
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
			<FileExplorerPane id={PANEL_ID} explorer={explorer} roots={roots} />
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
	beforeEach(() => {
		active.index = 0;
	});

	it("publishes the active root, so the chrome control acts on it", () => {
		const other = {
			mode: { type: "MOUNT", mountId: "m1" },
			commands: { refresh: vi.fn() },
		} as unknown as FileExplorerApi;
		active.index = 1;
		const { workbench } = setup({ type: "APP", app: "project-1" }, [
			{ id: "m1", name: "notes", explorer: other },
		]);

		expect(workbench.getState().layout.values[PANEL_ID]).toBe(other);
	});

	it("refreshes a host's root when its files change elsewhere", () => {
		const refreshRoot = vi.fn();
		const other = {
			mode: { type: "MOUNT", mountId: "m1" },
			commands: { refresh: refreshRoot },
		} as unknown as FileExplorerApi;
		const { refresh, emit } = setup({ type: "APP", app: "project-1" }, [
			{ id: "m1", name: "notes", explorer: other },
		]);

		emit("MOUNT:m1");

		expect(refreshRoot).toHaveBeenCalledTimes(1);
		expect(refresh).not.toHaveBeenCalled();
	});

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
