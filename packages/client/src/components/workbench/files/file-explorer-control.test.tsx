import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FileExplorerApi, FileMode } from "@semoss/shared";
import { WorkbenchStoreContext } from "@/contexts/workbench.context";
import {
	createWorkbenchStore,
	type WorkbenchChromeProps,
} from "@/stores/workbench";
import { FileExplorerControl } from "./file-explorer-control";
import type { FileExplorerParams } from "./file-explorer-panel";

const createExplorer = (
	mode: FileMode,
	capabilities: { mutate: boolean; upload: boolean },
): FileExplorerApi =>
	({
		mode,
		capabilities,
		header: { path: "/" },
		commands: {
			openNewFile: vi.fn(),
			refresh: vi.fn(),
		},
	}) as unknown as FileExplorerApi;

const renderControl = (
	explorer: FileExplorerApi,
	permission?: "EDIT" | "READ_ONLY",
) => {
	const store = createWorkbenchStore(`file-control-${explorer.mode.type}`);
	if (permission && explorer.mode.type === "APP") {
		store
			.getState()
			.access.actions.syncPermission(
				"PROJECT",
				explorer.mode.app,
				permission,
			);
	}
	if (permission && explorer.mode.type === "STORAGE") {
		store
			.getState()
			.access.actions.syncPermission(
				"ENGINE",
				explorer.mode.storage,
				permission,
			);
	}

	render(
		<WorkbenchStoreContext.Provider value={store}>
			<FileExplorerControl
				{...({
					value: explorer,
				} as WorkbenchChromeProps<FileExplorerParams, FileExplorerApi>)}
			/>
		</WorkbenchStoreContext.Provider>,
	);
};

describe("FileExplorerControl", () => {
	it("hides New but keeps Refresh for a read-only project", () => {
		renderControl(
			createExplorer(
				{ type: "APP", app: "project-1" },
				{ mutate: true, upload: true },
			),
			"READ_ONLY",
		);

		expect(screen.queryByRole("button", { name: "New" })).toBeNull();
		expect(screen.getByRole("button", { name: "Refresh" })).toBeVisible();
	});

	it("shows New for an editable upload-only storage resource", () => {
		renderControl(
			createExplorer(
				{ type: "STORAGE", storage: "storage-1" },
				{ mutate: false, upload: true },
			),
			"EDIT",
		);

		expect(screen.getByRole("button", { name: "New" })).toBeVisible();
	});

	it("keeps Insight-scoped creation independent of project access", () => {
		renderControl(
			createExplorer(
				{ type: "INSIGHT", insightId: "insight-1" },
				{ mutate: true, upload: true },
			),
		);

		expect(screen.getByRole("button", { name: "New" })).toBeVisible();
	});
});
