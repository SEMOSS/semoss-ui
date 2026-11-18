import { expect, it, vi } from "vitest";
import { AppFrameRegistryStore } from "./app-frame-registry.store";

it("keeps DOM resources private and ignores cleanup from an older iframe", () => {
	const store = new AppFrameRegistryStore();
	const previous = document.createElement("iframe");
	const current = document.createElement("iframe");
	const listener = vi.fn();
	const unsubscribe = store.subscribe(listener);
	const oldSnapshot = store.getSnapshot();
	const releasePrevious = store.register("app", previous);
	const releaseCurrent = store.register("app", current);
	releasePrevious();
	expect(store.getFrame("app")).toBe(current);
	expect(oldSnapshot.revisions).toEqual({});
	expect(JSON.stringify(store.getSnapshot())).not.toContain("iframe");
	expect(listener).toHaveBeenCalledTimes(2);
	releaseCurrent();
	expect(store.getFrame("app")).toBeNull();
	unsubscribe();
	store.register("another", previous);
	expect(listener).toHaveBeenCalledTimes(3);
});
