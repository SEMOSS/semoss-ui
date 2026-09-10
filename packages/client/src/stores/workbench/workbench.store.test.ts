import { describe, expect, it } from "vitest";
import { createWorkbenchStore } from "./workbench.store";

describe("workbench configure", () => {
	it("records the active resource's permission", () => {
		const store = createWorkbenchStore("configure");

		store.getState().configure({
			resource: {
				type: "PROJECT",
				id: "project-1",
				permission: "READ_ONLY",
			},
		});

		expect(store.getState().access.entries["PROJECT:project-1"]).toEqual({
			status: "SUCCESS",
			permission: "READ_ONLY",
		});
	});

	it("exposes its cache key so sibling stores can scope themselves", () => {
		expect(createWorkbenchStore("my-key").getState().layout.cacheKey).toBe(
			"my-key",
		);
	});
});
