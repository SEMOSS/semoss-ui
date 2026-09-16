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

	it("ignores an adopted run with no room or run id", async () => {
		// The handoff record is validated before it gets here, but a malformed
		// one must not reach resumeRoom or the stream.
		const store = makeStore();
		const resumeRoom = vi.fn().mockResolvedValue(undefined);
		store.setState({ insightId: "insight-1", resumeRoom });

		await store.getState().adoptRun("", "run-1", "prompt");
		await store.getState().adoptRun("room-1", "", "prompt");

		expect(resumeRoom).not.toHaveBeenCalled();
	});

	it("ignores an adopted run before the assistant has an insight", async () => {
		const store = makeStore();
		const resumeRoom = vi.fn().mockResolvedValue(undefined);
		store.setState({ resumeRoom });

		await store.getState().adoptRun("room-1", "run-1", "prompt");

		expect(resumeRoom).not.toHaveBeenCalled();
	});
});
