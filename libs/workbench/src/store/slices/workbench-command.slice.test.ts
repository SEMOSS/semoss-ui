import { describe, expect, it, vi } from "vitest";
import { createWorkbenchStore } from "../workbench.store";

describe("workbench command visibility", () => {
	it("does not execute or remember a hidden command", () => {
		const store = createWorkbenchStore("hidden-command");
		const handler = vi.fn();
		store.getState().command.actions.registerCommand({
			id: "hidden",
			label: "Hidden",
			visible: false,
			handler,
		});

		store.getState().command.actions.executeCommand("hidden");

		expect(handler).not.toHaveBeenCalled();
		expect(store.getState().command.recentCommands).not.toContain("hidden");
	});
});
