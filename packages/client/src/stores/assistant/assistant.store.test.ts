import { describe, expect, it, vi } from "vitest";
import { createWorkbenchStore } from "@semoss/workbench";
import { createAssistantStore } from "./assistant.store";

const makeStore = () =>
	createAssistantStore({
		workbenchId: "test-workbench",
		workbench: createWorkbenchStore({ components: {} }),
	});

describe("assistant store", () => {
	it("applies configuration to its own root state", () => {
		const store = makeStore();

		store.getState().configure({ systemPrompt: "Project assistant" });

		expect(store.getState().systemPrompt).toBe("Project assistant");
	});

	it("keeps notifications alive across dispose()", () => {
		// dispose() runs on every insight change, so it must drop only the
		// run watchers -- taking the notification subscription with it would
		// silence the assistant after the first insight switch.
		const store = makeStore();
		const listener = vi.fn();
		store.subscribe(listener);

		store.getState().dispose();
		store.getState().setDraft("still listening");

		expect(listener).toHaveBeenCalled();
	});

	it("stops notifying after destroy()", () => {
		const store = makeStore();
		store.getState().destroy();

		// A second destroy() must not throw -- the provider unmount and a
		// StrictMode double-invoke both land here.
		expect(() => store.getState().destroy()).not.toThrow();
	});
});
