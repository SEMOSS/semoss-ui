import { describe, expect, it, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import { createWorkbenchStore } from "@semoss/workbench";
import {
	WORKBENCH_COMPONENTS,
	WORKBENCH_PANEL_RECORDS,
} from "@/stores/workbench/workbench.constants";
import {
	createFileCommands,
	createNewTerminalCommand,
	createOpenPanelCommand,
	createReconnectCommand,
	withTab,
} from "./workbench.presets";

/**
 * Command ids are what the palette shows and what a user's muscle memory
 * points at. Eleven workbenches used to spell them out; now a factory does, so
 * these assert the exact strings that used to be written by hand.
 */
describe("createFileCommands", () => {
	it("registers the four File commands against the file explorer", () => {
		const commands = createFileCommands({ readOnly: false });

		expect(commands.map((command) => command.id)).toEqual([
			"workbench.file.create",
			"workbench.file.create-folder",
			"workbench.file.upload",
			"workbench.file.refresh",
		]);
		expect(commands.every((command) => command.category === "File")).toBe(
			true,
		);
	});

	it("hides the mutating three when read-only, and keeps refresh", () => {
		const commands = createFileCommands({ readOnly: true });
		const visible = Object.fromEntries(
			commands.map((command) => [command.id, command.visible]),
		);

		expect(visible["workbench.file.create"]).toBe(false);
		expect(visible["workbench.file.create-folder"]).toBe(false);
		expect(visible["workbench.file.upload"]).toBe(false);
		// refreshing is a read; a read-only workbench still offers it
		expect(visible["workbench.file.refresh"]).toBeUndefined();
	});

	it("omits create for an explorer that cannot create", () => {
		const commands = createFileCommands({
			explorerId: WORKBENCH_COMPONENTS.STORAGE_EXPLORER,
			readOnly: false,
			canCreate: false,
		});

		expect(commands.map((command) => command.id)).toEqual([
			"workbench.file.upload",
			"workbench.file.refresh",
		]);
	});

	it("drives the explorer it was given", () => {
		const refresh = vi.fn();
		const get = () => ({
			layout: {
				values: {
					[WORKBENCH_COMPONENTS.STORAGE_EXPLORER]: {
						commands: { refresh: refresh },
					},
				},
			},
		});

		const commands = createFileCommands({
			explorerId: WORKBENCH_COMPONENTS.STORAGE_EXPLORER,
			readOnly: false,
			canCreate: false,
		});
		commands
			.find((command) => command.id === "workbench.file.refresh")
			?.handler(get as never);

		expect(refresh).toHaveBeenCalled();
	});
});

describe("createOpenPanelCommand", () => {
	it("selects the panel it names, with its config", () => {
		const selectPanel = vi.fn();
		const get = () => ({
			layout: { actions: { selectPanel: selectPanel } },
		});
		const config = { mode: { type: "ENGINE", engine: "e1" } };

		const command = createOpenPanelCommand({
			id: "workbench.file-explorer.open",
			label: "Open File Explorer",
			type: WORKBENCH_COMPONENTS.FILE_EXPLORER,
			config: config,
		});
		command.handler(get as never);

		expect(command.category).toBe("View");
		expect(selectPanel).toHaveBeenCalledWith(
			WORKBENCH_COMPONENTS.FILE_EXPLORER,
			config,
		);
	});
});

describe("createReconnectCommand", () => {
	/** A `get` carrying just the loading actions the handler reaches for. */
	const withLoading = () => {
		const setLoading = vi.fn();
		return {
			setLoading,
			get: (() => ({ loading: { actions: { setLoading } } })) as never,
		};
	};

	it("runs ReconnectServer on the workbench's insight", async () => {
		const run = vi.fn(() => Promise.resolve());
		const command = createReconnectCommand({ actions: { run: run } });
		const { get } = withLoading();

		command.handler(get);
		await vi.waitFor(() => expect(run).toHaveBeenCalled());

		expect(command.id).toBe("workbench.server.reconnect");
		expect(run).toHaveBeenCalledWith("ReconnectServer();");
	});

	it("covers the shell while in flight and clears it on success", async () => {
		const success = vi.spyOn(toast, "success").mockImplementation(vi.fn());
		const command = createReconnectCommand({
			actions: { run: () => Promise.resolve() },
		});
		const { setLoading, get } = withLoading();

		command.handler(get);

		// synchronously, before the pixel resolves
		expect(setLoading).toHaveBeenCalledWith(true);

		await vi.waitFor(() =>
			expect(setLoading).toHaveBeenLastCalledWith(false),
		);
		expect(success).toHaveBeenCalledWith("Server reconnected");
		success.mockRestore();
	});

	it("clears the scrim when the reconnect fails", async () => {
		const error = vi.spyOn(toast, "error").mockImplementation(vi.fn());
		const logged = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const command = createReconnectCommand({
			actions: { run: () => Promise.reject(new Error("no route")) },
		});
		const { setLoading, get } = withLoading();

		command.handler(get);

		// a scrim that outlived a failed pixel would lock the whole shell
		await vi.waitFor(() =>
			expect(setLoading).toHaveBeenLastCalledWith(false),
		);
		expect(error).toHaveBeenCalled();
		error.mockRestore();
		logged.mockRestore();
	});
});

describe("createNewTerminalCommand", () => {
	const TERMINAL = WORKBENCH_COMPONENTS.PROJECT_TERMINAL;
	const FILES = WORKBENCH_COMPONENTS.FILE_EXPLORER;

	/** A dock with files on the left and the seeded terminal below. */
	const makeStore = () => {
		const store = createWorkbenchStore({
			components: {
				[TERMINAL]: { name: "Terminal", content: () => null },
				[FILES]: { name: "Files", content: () => null },
			},
		});
		store.getState().layout.actions.loadSnapshot({
			tree: {
				type: "tabset",
				id: "main",
				size: 1,
				panelIds: [],
				activeId: null,
			},
			panels: {
				[WORKBENCH_PANEL_RECORDS.PROJECT_TERMINAL.id]:
					WORKBENCH_PANEL_RECORDS.PROJECT_TERMINAL,
				[WORKBENCH_PANEL_RECORDS.FILE_EXPLORER.id]:
					WORKBENCH_PANEL_RECORDS.FILE_EXPLORER,
			},
			borders: {
				left: { panelIds: [FILES], activeId: FILES, size: 300 },
				bottom: { panelIds: [TERMINAL], activeId: null, size: 300 },
			},
		});
		return store;
	};

	it("is one View command with the same id in every workbench", () => {
		expect(createNewTerminalCommand(TERMINAL)).toMatchObject({
			id: "workbench.terminal.new",
			category: "View",
			label: "New Terminal",
		});
	});

	it("opens beside the first terminal when another panel is selected", () => {
		const store = makeStore();
		store.getState().layout.actions.setSelectedPanel(FILES);

		createNewTerminalCommand(TERMINAL).handler(store.getState);

		const { borders, panels } = store.getState().layout;
		expect(borders.left.panelIds).toEqual([FILES]);
		expect(borders.bottom.panelIds).toHaveLength(2);
		expect(panels[borders.bottom.panelIds[1]]).toMatchObject({
			type: TERMINAL,
			name: "Terminal 2",
		});
	});

	it("opens beside the selected terminal", () => {
		const store = makeStore();
		const moved = store.getState().layout.actions.spawnPanel(TERMINAL, {
			name: "Terminal 2",
			config: { terminalNumber: 2 },
			target: { kind: "join", tabsetId: "main" },
		});
		store.getState().layout.actions.setSelectedPanel(moved);

		createNewTerminalCommand(TERMINAL).handler(store.getState);

		const { borders, tabsets } = store.getState().layout;
		expect(borders.bottom.panelIds).toEqual([TERMINAL]);
		expect(
			tabsets.find((tabset) => tabset.id === "main")?.panelIds,
		).toHaveLength(2);
	});
});

describe("withTab", () => {
	it("inserts at the index without mutating the base list", () => {
		const base = ["a", "b", "c"];

		expect(withTab(base, "x", 1)).toEqual(["a", "x", "b", "c"]);
		expect(base).toEqual(["a", "b", "c"]);
	});
});
