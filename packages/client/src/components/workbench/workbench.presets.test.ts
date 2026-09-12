import { describe, expect, it, vi } from "vitest";
import { WORKBENCH_COMPONENTS } from "@/stores/workbench";
import {
	createFileCommands,
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
	it("runs ReconnectServer on the workbench's insight", () => {
		const run = vi.fn(() => Promise.resolve());
		const command = createReconnectCommand({ actions: { run: run } });

		command.handler(undefined as never);

		expect(command.id).toBe("workbench.server.reconnect");
		expect(run).toHaveBeenCalledWith("ReconnectServer();");
	});
});

describe("withTab", () => {
	it("inserts at the index without mutating the base list", () => {
		const base = ["a", "b", "c"];

		expect(withTab(base, "x", 1)).toEqual(["a", "x", "b", "c"]);
		expect(base).toEqual(["a", "b", "c"]);
	});
});
