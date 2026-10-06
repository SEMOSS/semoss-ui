import { act, render, screen, waitFor } from "@testing-library/react";
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
import { createToolWorkbenchLayout } from "@/features/tools/tool-workbench.constants";
import { WORK_PANEL_TYPES } from "./work-panel.constants";
import { WorkPanelMenu } from "./work-panel-menu";

let store: ReturnType<typeof createWorkbenchStore>;
let isReady = true;
let insightId = "thread-insight";
let conversationKind: "chat" | "source-thread" = "source-thread";
const openWorkbench = vi.fn();
vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => ({
		store,
		insightId,
		isOpen: true,
		openWorkbench,
	}),
}));
vi.mock("./work-thread-context", () => ({
	useWorkThread: () => ({ snapshot: { isReady }, conversationKind }),
}));
vi.mock("@semoss/shared", () => ({
	getFileEditorPathScope: (_mode: unknown, insightId: string) =>
		`INSIGHT:${insightId}`,
	NewFileOverlay: vi.fn(
		({
			action,
			path,
			mode,
			onClose,
		}: ComponentProps<typeof NewFileOverlay>) => (
			<div role="dialog" aria-label="Create file">
				<span>{action}</span>
				<span data-testid="destination">{path}</span>
				<span data-testid="mode">{JSON.stringify(mode)}</span>
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
	if (conversationKind === "chat")
		store
			.getState()
			.layout.actions.loadSnapshot(createToolWorkbenchLayout(insightId));
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
beforeEach(() => {
	vi.clearAllMocks();
	isReady = true;
	insightId = "thread-insight";
	conversationKind = "source-thread";
});

const MENU_LABELS = [
	"Browse files…",
	"New file…",
	"New folder…",
	"Upload files…",
	"Emails",
	"Context",
	"Tools",
	"Activity",
	"Settings",
	"Commands…",
];

it.each([
	["Settings", WORK_PANEL_TYPES.SETTINGS],
	["Context", WORK_PANEL_TYPES.CONTEXT],
	["Tools", WORK_PANEL_TYPES.TOOLS],
	["Activity", WORK_PANEL_TYPES.ACTIVITY],
	["Browse files…", FILE_PANEL_TYPES.FILE_EXPLORER],
])(
	"opens %s in chat without offering or creating an Emails pane",
	async (label, type) => {
		conversationKind = "chat";
		setup();
		await openMenu();
		expect(screen.queryByRole("menuitem", { name: "Emails" })).toBeNull();
		await userEvent.click(screen.getByRole("menuitem", { name: label }));
		const layout = store.getState().layout;
		expect(
			Object.values(layout.panels).some(
				(panel) => panel.type === WORK_PANEL_TYPES.EMAILS,
			),
		).toBe(false);
		expect(
			layout.selection.panel &&
				layout.panels[layout.selection.panel]?.type,
		).toBe(type);
		expect(openWorkbench).toHaveBeenCalledOnce();
	},
);

it("keeps one fixed menu across selected panels, dirty files, emails, drafts, and results", async () => {
	setup();
	await openMenu();
	const expectStaticMenu = () => {
		expect(
			screen.getAllByRole("menuitem").map((item) => item.textContent),
		).toEqual(MENU_LABELS);
		expect(screen.queryByRole("menuitemradio")).toBeNull();
		expect(screen.queryByRole("button", { name: "File" })).toBeNull();
		expect(screen.queryByRole("button", { name: "View" })).toBeNull();
	};
	expectStaticMenu();
	for (const id of ["file-a", "explorer", "tools", "result"]) {
		select(id);
		expectStaticMenu();
	}
	act(() =>
		store.getState().layout.actions.setPanelValue("file-a", {
			...controls,
			isBusy: true,
		}),
	);
	select("file-a");
	expectStaticMenu();
	for (const type of [WORK_PANEL_TYPES.EMAIL, WORK_PANEL_TYPES.DRAFT]) {
		act(() =>
			store.getState().layout.actions.selectPanel(
				type,
				{},
				{
					name: "Message-specific title",
				},
			),
		);
		expectStaticMenu();
	}
	for (const label of MENU_LABELS) {
		expect(
			screen.getByRole("menuitem", { name: label }),
		).not.toHaveAttribute("aria-disabled");
	}
	expect(save).not.toHaveBeenCalled();
	expect(download).not.toHaveBeenCalled();
	expect(refresh).not.toHaveBeenCalled();
});

it("browses the existing Files panel and reuses fixed panels", async () => {
	setup();
	await openMenu();
	await userEvent.click(
		screen.getByRole("menuitem", { name: "Browse files…" }),
	);
	expect(store.getState().layout.selection.panel).toBe("explorer");
	await openMenu();
	await userEvent.click(screen.getByRole("menuitem", { name: "Context" }));
	expect(store.getState().layout.selection.panel).toBe("context");
	expect(Object.keys(store.getState().layout.panels)).toHaveLength(6);
});

it("keeps the same menu on mobile and restores trigger focus after navigation", async () => {
	setup();
	act(() => store.getState().layout.actions.setMobileLayout(true));
	await openMenu();
	expect(screen.getAllByRole("menu")).toHaveLength(1);
	expect(
		screen.getAllByRole("menuitem").map((item) => item.textContent),
	).toEqual(MENU_LABELS);
	await userEvent.click(screen.getByRole("menuitem", { name: "Tools" }));
	expect(store.getState().layout.mobileActivePanelId).toBe("tools");
	expect(screen.queryByRole("menu")).toBeNull();
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "File" })).toHaveFocus(),
	);
});

it("opens a fixed panel and reuses it on subsequent selections", async () => {
	setup();
	await openMenu();
	await userEvent.click(screen.getByRole("menuitem", { name: "Settings" }));
	const firstId = store.getState().layout.selection.panel;
	await openMenu();
	await userEvent.click(screen.getByRole("menuitem", { name: "Settings" }));
	expect(store.getState().layout.selection.panel).toBe(firstId);
	expect(Object.keys(store.getState().layout.panels)).toHaveLength(7);
});

it.each([
	["context", "New file…", "add_file"],
	["file-a", "New folder…", "add_directory"],
	["explorer", "Upload files…", "upload"],
])(
	"creates at the thread root for %s / %s and notifies only after success",
	async (id, label, action) => {
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
		expect(screen.getByTestId("destination").textContent).toBe("/");
		expect(screen.getByTestId("mode").textContent).toBe(
			JSON.stringify(mode),
		);
		expect(screen.getByText(action)).toBeVisible();
		expect(screen.queryByRole("menu")).toBeNull();
		select("context");
		expect(screen.getByTestId("destination").textContent).toBe("/");
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
		expect(emitted).toHaveBeenCalledExactlyOnceWith(
			FILE_PANEL_EVENTS.FILES_CHANGED,
			{
				scope: expect.stringContaining("thread-insight"),
			},
		);
		await waitFor(() =>
			expect(screen.getByRole("button", { name: "File" })).toHaveFocus(),
		);
	},
);

it.each(["connecting", "missing insight"])(
	"disables only file actions when %s without changing menu contents",
	async (state) => {
		isReady = state !== "connecting";
		insightId = state === "missing insight" ? "" : "thread-insight";
		setup();
		await openMenu();
		expect(
			screen.getAllByRole("menuitem").map((item) => item.textContent),
		).toEqual(MENU_LABELS);
		for (const name of MENU_LABELS.slice(0, 4)) {
			expect(screen.getByRole("menuitem", { name })).toHaveAttribute(
				"aria-disabled",
				"true",
			);
		}
		for (const name of MENU_LABELS.slice(4)) {
			expect(screen.getByRole("menuitem", { name })).not.toHaveAttribute(
				"aria-disabled",
			);
		}
		await userEvent.click(
			screen.getByRole("menuitem", { name: "New file…" }),
		);
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(openWorkbench).not.toHaveBeenCalled();
		await userEvent.click(
			screen.getByRole("menuitem", { name: "Commands…" }),
		);
		expect(store.getState().command.isCommandOpen).toBe(true);
		expect(screen.queryByRole("menu")).toBeNull();
	},
);

it("supports keyboard opening, arrow navigation, activation, and Escape focus return", async () => {
	setup();
	const trigger = screen.getByRole("button", { name: "File" });
	trigger.focus();
	await userEvent.keyboard("{Enter}");
	expect(
		screen.getByRole("menuitem", { name: "Browse files…" }),
	).toHaveFocus();
	await userEvent.keyboard(
		"{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{Enter}",
	);
	expect(store.getState().layout.selection.panel).toBe("context");
	await waitFor(() => expect(trigger).toHaveFocus());
	await userEvent.keyboard("{ArrowDown}{Escape}");
	expect(screen.queryByRole("menu")).toBeNull();
	await waitFor(() => expect(trigger).toHaveFocus());
});

it("returns focus after closing Commands opened from File", async () => {
	setup();
	await openMenu();
	await userEvent.click(screen.getByRole("menuitem", { name: "Commands…" }));
	expect(store.getState().command.isCommandOpen).toBe(true);
	act(() => store.getState().command.actions.setCommandOpen(false));
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "File" })).toHaveFocus(),
	);
	expect(openWorkbench).not.toHaveBeenCalled();
});
