import { describe, expect, it } from "vitest";
import { createWorkbenchStore } from "./workbench.store";

describe("workbench configure", () => {
	it("sets resource access and assistant configuration together", () => {
		const store = createWorkbenchStore("configure");

		store.getState().configure({
			resource: {
				type: "PROJECT",
				id: "project-1",
				permission: "READ_ONLY",
			},
			assistant: { systemPrompt: "Project assistant" },
		});

		expect(store.getState().access.entries["PROJECT:project-1"]).toEqual({
			status: "SUCCESS",
			permission: "READ_ONLY",
		});
		expect(store.getState().assistant.systemPrompt).toBe(
			"Project assistant",
		);
	});
});
