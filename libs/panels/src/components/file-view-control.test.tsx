import { fireEvent, render, screen } from "@testing-library/react";
import { ExternalLinkIcon } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { createWorkbenchStore, WorkbenchProvider } from "@semoss/workbench";
import {
	type FileExplorerHost,
	FileExplorerHostProvider,
} from "../contexts/file-explorer-host.context";
import type { FileViewControls } from "../types/file-view.types";
import { FileViewControl } from "./file-view-control";

/** The one file panel every case's dock holds. */
const PANEL_ID = "file";
const CONFIG = {
	mode: { type: "MOUNT", mountId: "m1" },
	name: "notes.md",
	path: "/notes.md",
} as const;

/**
 * Render the control over a file panel that published `controls`, under a
 * host when one is given.
 */
const renderControl = (
	host: FileExplorerHost | null,
	controls: Partial<FileViewControls> = {},
) => {
	const workbench = createWorkbenchStore({ components: {} });
	const { actions } = workbench.getState().layout;
	actions.loadSnapshot({
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: [PANEL_ID],
			activeId: PANEL_ID,
		},
		panels: {
			[PANEL_ID]: {
				id: PANEL_ID,
				type: "FILE",
				name: "notes.md",
				config: CONFIG,
			},
		},
	});
	actions.setPanelValue(PANEL_ID, {
		canSave: false,
		isBusy: false,
		refresh: vi.fn(),
		...controls,
	});

	const control = (
		<WorkbenchProvider store={workbench}>
			<FileViewControl id={PANEL_ID} />
		</WorkbenchProvider>
	);
	render(
		host ? (
			<FileExplorerHostProvider host={host}>
				{control}
			</FileExplorerHostProvider>
		) : (
			control
		),
	);
};

const OPEN = "Open with Default App";

describe("FileViewControl", () => {
	it("draws a host's button for the open file and runs it", () => {
		const action = vi.fn(async () => undefined);
		const fileActions = vi.fn(() => [
			{ name: OPEN, icon: ExternalLinkIcon, action: action },
		]);
		renderControl({ fileActions });

		fireEvent.click(screen.getByRole("button", { name: OPEN }));

		expect(fileActions).toHaveBeenCalledWith(CONFIG);
		expect(action).toHaveBeenCalledTimes(1);
	});

	it("draws no extra button without a host", () => {
		renderControl(null);

		expect(screen.queryByRole("button", { name: OPEN })).toBeNull();
		expect(
			screen.getByRole("button", { name: "Refresh file" }),
		).toBeTruthy();
	});

	it("disables a host's button while the view is busy", () => {
		renderControl(
			{
				fileActions: () => [
					{ name: OPEN, icon: ExternalLinkIcon, action: vi.fn() },
				],
			},
			{ isBusy: true },
		);

		expect(
			screen.getByRole("button", { name: OPEN }).hasAttribute("disabled"),
		).toBe(true);
	});
});
