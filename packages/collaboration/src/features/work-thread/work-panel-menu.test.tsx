import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import {
	FILE_PANEL_EVENTS,
	FILE_PANEL_TYPES,
	type FileViewControls,
} from "@semoss/panels";
import type { NewFileOverlay } from "@semoss/shared";
import { TooltipProvider } from "@semoss/ui/next";
import {
	createWorkbenchStore,
	type WorkbenchPanelConfig,
	WorkbenchProvider,
} from "@semoss/workbench";
import { WORK_PANEL_TYPES } from "./work-panel.constants";
import { WorkPanelMenu } from "./work-panel-menu";

let store: ReturnType<typeof createWorkbenchStore>;
let isReady = true;
const openWorkbench = vi.fn();
vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => ({
		store,
		insightId: "thread-insight",
		isOpen: true,
		openWorkbench,
	}),
}));
vi.mock("./work-thread-context", () => ({
	useWorkThread: () => ({ snapshot: { isReady } }),
}));
vi.mock("@semoss/shared", () => ({
	getFileEditorPathScope: (_mode: unknown, insightId: string) =>
		`INSIGHT:${insightId}`,
	getParentPath: (path: string) =>
		path.slice(0, path.lastIndexOf("/")) || "/",
	NewFileOverlay: vi.fn(
		({ action, path, onClose }: ComponentProps<typeof NewFileOverlay>) => (
			<div role="dialog" aria-label="Create file">
				<span>{action}</span>
				<span data-testid="destination">{path}</span>
				<button type="button" onClick={() => onClose(false)}>
					Cancel creation
				</button>
				<button type="button" onClick={() => onClose(true, "/other/")}>
					Complete creation
				</button>
			</div>
		),
	),
}));
const mode = { type: "INSIGHT", insightId: "thread-insight" };
const save = vi.fn();
const download = vi.fn().mockResolvedValue(undefined);
const refresh = vi.fn();
const controls: FileViewControls = {
	canSave: true,
	canDownload: true,
	isBusy: false,
	isDirty: true,
	save,
	download,
	refresh,
};
const blueprint: WorkbenchPanelConfig = { name: "Panel", content: () => null };
function setup() {
	store = createWorkbenchStore({
		components: Object.fromEntries(
			[
				...Object.values(WORK_PANEL_TYPES),
				...Object.values(FILE_PANEL_TYPES),
				"result",
			].map((type) => [
				type,
				{
					...blueprint,
					matches: (a: unknown, b: unknown) =>
						JSON.stringify(a) === JSON.stringify(b),
				},
			]),
		),
	});
	store.getState().layout.actions.loadSnapshot({
		tree: {
			type: "tabset",
			id: "main",
			size: 1,
			panelIds: ["file-a", "tools", "result", "context", "explorer"],
			activeId: "context",
		},
		panels: {
			"file-a": {
				id: "file-a",
				type: FILE_PANEL_TYPES.FILE_CODE_EDITOR,
				name: "notes.md*",
				config: { mode, path: "/reports/notes.md", name: "notes.md" },
			},
			tools: { id: "tools", type: WORK_PANEL_TYPES.TOOLS, name: "Tools" },
			result: { id: "result", type: "result", name: "Research result" },
			context: {
				id: "context",
				type: WORK_PANEL_TYPES.CONTEXT,
				name: "Context",
			},
			explorer: {
				id: "explorer",
				type: FILE_PANEL_TYPES.FILE_EXPLORER,
				name: "Files",
				config: { mode },
			},
		},
	});
	store.getState().layout.actions.setPanelValue("file-a", { ...controls });
	store
		.getState()
		.layout.actions.activatePanel(
			{ kind: "tabset", id: "main" },
			"context",
		);
	return render(
		<TooltipProvider>
			<WorkbenchProvider store={store}>
				<WorkPanelMenu />
			</WorkbenchProvider>
		</TooltipProvider>,
	);
}
async function openMenu() {
	await userEvent.click(screen.getByRole("button", { name: "File" }));
}
function select(id: string) {
	act(() =>
		store
			.getState()
			.layout.actions.activatePanel({ kind: "tabset", id: "main" }, id),
	);
}
async function openViewMenu() {
	await userEvent.click(screen.getByRole("button", { name: "View" }));
}
beforeEach(() => {
	vi.clearAllMocks();
	isReady = true;
});

it("groups fixed actions in order and explains unavailable file actions", async () => {
	setup();
	await openMenu();
	expect(
		screen.getAllByRole("menuitem").map((item) => item.textContent),
	).toEqual([
		"Browse files…",
		"New file…",
		"New folder…",
		"Upload files…",
		"Save file",
		"Download file",
		"Refresh file",
	]);
	expect(screen.getByRole("menuitem", { name: "Save file" })).toHaveAttribute(
		"aria-disabled",
		"true",
	);
	expect(
		screen.getByText("Select an open file to use these actions."),
	).toBeVisible();
});

it("browses the existing Files panel and reuses fixed panels", async () => {
	setup();
	await openMenu();
	await userEvent.click(
		screen.getByRole("menuitem", { name: "Browse files…" }),
	);
	expect(store.getState().layout.selection.panel).toBe("explorer");
	await openViewMenu();
	await userEvent.click(
		await screen.findByRole("menuitemradio", { name: "Context" }),
	);
	expect(store.getState().layout.selection.panel).toBe("context");
	expect(Object.keys(store.getState().layout.panels)).toHaveLength(5);
});

it("lists static panels before dynamic files and results and switches by instance", async () => {
	setup();
	await openViewMenu();
	const items = await screen.findAllByRole("menuitemradio");
	expect(items.map((item) => item.textContent)).toEqual([
		"Context",
		"Settings",
		"Tools",
		"Activity",
		"Files",
		"notes.md*",
		"Research result",
	]);
	expect(items[0]).toHaveAttribute("aria-checked", "true");
	await userEvent.click(items[5]);
	expect(store.getState().layout.selection.panel).toBe("file-a");
	act(() => store.getState().layout.actions.closePanel("file-a"));
	await openViewMenu();
	expect(
		screen.queryByRole("menuitemradio", { name: "notes.md*" }),
	).toBeNull();
});

it("offers both menus on mobile with fixed panels followed by dynamic files", async () => {
	setup();
	act(() => store.getState().layout.actions.setMobileLayout(true));
	expect(screen.getByRole("button", { name: "File" })).toBeVisible();
	await openViewMenu();
	expect(screen.getAllByRole("menu")).toHaveLength(1);
	const items = screen.getAllByRole("menuitemradio");
	expect(items.map((item) => item.textContent)).toEqual([
		"Context",
		"Settings",
		"Tools",
		"Activity",
		"Files",
		"notes.md*",
		"Research result",
	]);
	await userEvent.click(items[5]);
	expect(store.getState().layout.mobileActivePanelId).toBe("file-a");
	expect(screen.queryByRole("menu")).toBeNull();
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "View" })).toHaveFocus(),
	);
});

it("opens a fixed panel directly from View and reuses it on subsequent selections", async () => {
	setup();
	await openViewMenu();
	await userEvent.click(
		screen.getByRole("menuitemradio", { name: "Settings" }),
	);
	const firstId = store.getState().layout.selection.panel;
	await openViewMenu();
	expect(
		screen.getByRole("menuitemradio", { name: "Settings" }),
	).toHaveAttribute("aria-checked", "true");
	await userEvent.click(
		screen.getByRole("menuitemradio", { name: "Settings" }),
	);
	expect(store.getState().layout.selection.panel).toBe(firstId);
	expect(Object.keys(store.getState().layout.panels)).toHaveLength(6);
});

it.each([
	["context", "New file…", "add_file", "/"],
	["file-a", "New folder…", "add_directory", "/reports"],
	["explorer", "Upload files…", "upload", "/working/"],
])(
	"captures the destination for %s / %s and refreshes only after success",
	async (id, label, action, path) => {
		setup();
		act(() =>
			store.getState().layout.actions.setPanelValue("explorer", {
				header: { path: "/working/" },
				tree: { status: "SUCCESS", isUploading: false },
				commands: { refresh },
				mode,
			}),
		);
		select(id);
		const emitted = vi.spyOn(store.getState().events.actions, "emit");
		await openMenu();
		await userEvent.click(screen.getByRole("menuitem", { name: label }));
		expect(screen.getByTestId("destination")).toHaveTextContent(path);
		expect(screen.getByText(action)).toBeVisible();
		select("context");
		expect(screen.getByTestId("destination")).toHaveTextContent(path);
		await userEvent.click(
			screen.getByRole("button", { name: "Cancel creation" }),
		);
		expect(emitted).not.toHaveBeenCalled();
		await waitFor(() =>
			expect(screen.getByRole("button", { name: "File" })).toHaveFocus(),
		);
		await openMenu();
		await userEvent.click(screen.getByRole("menuitem", { name: label }));
		await userEvent.click(
			screen.getByRole("button", { name: "Complete creation" }),
		);
		expect(emitted).toHaveBeenCalledWith(FILE_PANEL_EVENTS.FILES_CHANGED, {
			scope: expect.stringContaining("thread-insight"),
		});
	},
);

it("saves and downloads the active file, and confirms before discarding edits", async () => {
	setup();
	select("file-a");
	await openMenu();
	await userEvent.click(screen.getByRole("menuitem", { name: "Save file" }));
	expect(save).toHaveBeenCalledOnce();
	await openMenu();
	await userEvent.click(
		screen.getByRole("menuitem", { name: "Download saved version" }),
	);
	expect(download).toHaveBeenCalledOnce();
	await openMenu();
	await userEvent.click(
		screen.getByRole("menuitem", { name: "Refresh file" }),
	);
	const dialog = await screen.findByRole("dialog", {
		name: "Discard edits and refresh?",
	});
	expect(refresh).not.toHaveBeenCalled();
	await userEvent.click(
		within(dialog).getByRole("button", { name: "Cancel" }),
	);
	expect(refresh).not.toHaveBeenCalled();
	await openMenu();
	await userEvent.click(
		screen.getByRole("menuitem", { name: "Refresh file" }),
	);
	await userEvent.click(
		screen.getByRole("button", { name: "Discard and refresh" }),
	);
	expect(refresh).toHaveBeenCalledOnce();
});

it("keeps downloads available for read-only files and disables busy actions", async () => {
	setup();
	select("file-a");
	act(() =>
		store.getState().layout.actions.setPanelValue("file-a", {
			...controls,
			canSave: false,
		}),
	);
	await openMenu();
	expect(screen.getByRole("menuitem", { name: "Save file" })).toHaveAttribute(
		"aria-disabled",
		"true",
	);
	expect(
		screen.getByRole("menuitem", { name: "Download saved version" }),
	).not.toHaveAttribute("aria-disabled");
	act(() =>
		store.getState().layout.actions.setPanelValue("file-a", {
			...controls,
			isBusy: true,
		}),
	);
	for (const name of ["Save file", "Download saved version", "Refresh file"])
		expect(screen.getByRole("menuitem", { name })).toHaveAttribute(
			"aria-disabled",
			"true",
		);
});

it("disables file creation until the thread is ready and opens the existing command palette", async () => {
	isReady = false;
	setup();
	await openMenu();
	expect(screen.getByRole("menuitem", { name: "New file…" })).toHaveAttribute(
		"aria-disabled",
		"true",
	);
	await userEvent.keyboard("{Escape}");
	await openViewMenu();
	await userEvent.click(screen.getByRole("menuitem", { name: "Commands…" }));
	expect(store.getState().command.isCommandOpen).toBe(true);
});
