import { describe, expect, it } from "vitest";
import { createWorkbenchStore } from "./workbench.store";

describe("createWorkbenchStore", () => {
	it("composes only the generic dock namespaces", () => {
		// Permissions moved to the session store and the assistant owns its
		// own, so anything domain-shaped reappearing here is a regression.
		expect(
			Object.keys(createWorkbenchStore("shape").getState()).sort(),
		).toEqual(["command", "control", "layout", "loading"]);
	});

	it("exposes its cache key so sibling stores can scope themselves", () => {
		expect(createWorkbenchStore("my-key").getState().layout.cacheKey).toBe(
			"my-key",
		);
	});
});
