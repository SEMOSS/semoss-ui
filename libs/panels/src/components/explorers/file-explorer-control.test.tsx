import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FileExplorerApi, FileMode } from "@semoss/shared";
import { createWorkbenchStore, WorkbenchProvider } from "@semoss/workbench";
import { AccessStoreProvider } from "../../contexts/access.context";
import { createAccessStore } from "../../stores/access.store";
import { FileExplorerControl } from "./file-explorer-control";

/** The one panel id every case's dock holds. */
const PANEL_ID = "explorer";

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
	const store = createAccessStore();
	if (permission && explorer.mode.type === "APP") {
		store
			.getState()
			.syncPermission("PROJECT", explorer.mode.app, permission);
	}
	if (permission && explorer.mode.type === "STORAGE") {
		store
			.getState()
			.syncPermission("ENGINE", explorer.mode.storage, permission);
	}

	// the control reads its panel out of the dock now, so it needs one: a
	// workbench holding a single explorer instance, with `explorer` as the
	// value that instance published
	const workbench = createWorkbenchStore({ components: {} });
	workbench.getState().layout.actions.loadSnapshot({
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [PANEL_ID],
			activeId: PANEL_ID,
		},
		panels: {
			[PANEL_ID]: { id: PANEL_ID, type: "EXPLORER", name: "Files" },
		},
	});
	workbench.getState().layout.actions.setPanelValue(PANEL_ID, explorer);

	render(
		<WorkbenchProvider store={workbench}>
			<AccessStoreProvider store={store}>
				<FileExplorerControl id={PANEL_ID} />
			</AccessStoreProvider>
		</WorkbenchProvider>,
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

	it("refreshes the explorer when Refresh is clicked", () => {
		// The button is the only way to force a re-read; it renders in the
		// chrome's subtree and reaches the panel through its published api.
		const explorer = createExplorer(
			{ type: "APP", app: "project-1" },
			{ mutate: true, upload: true },
		);
		renderControl(explorer, "EDIT");

		fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

		expect(explorer.commands.refresh).toHaveBeenCalled();
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
