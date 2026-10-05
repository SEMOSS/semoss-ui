import { describe, expect, it, vi } from "vitest";
import { createWorkbenchStore } from "../workbench.store";

const events = () =>
	createWorkbenchStore({ components: {} }).getState().events.actions;

describe("workbench events", () => {
	it("delivers a payload to every subscriber of that event, and no others", () => {
		const { emit, subscribe } = events();
		const first = vi.fn();
		const second = vi.fn();
		const other = vi.fn();
		subscribe("file:moved", first);
		subscribe("file:moved", second);
		subscribe("file:deleted", other);

		emit("file:moved", { path: "/a.py" });

		expect(first).toHaveBeenCalledWith({ path: "/a.py" });
		expect(second).toHaveBeenCalledWith({ path: "/a.py" });
		expect(other).not.toHaveBeenCalled();
	});

	it("stops delivering once the subscription is cleaned up", () => {
		const { emit, subscribe } = events();
		const handler = vi.fn();
		const stop = subscribe("file:moved", handler);

		stop();
		emit("file:moved", {});

		expect(handler).not.toHaveBeenCalled();
	});

	it("retains nothing — a late subscriber never sees an earlier emit", () => {
		// The whole contract: events are temporal. A panel that was not
		// mounted for one reads fresh when it mounts instead.
		const { emit, subscribe } = events();
		const late = vi.fn();

		emit("app:published", {});
		subscribe("app:published", late);

		expect(late).not.toHaveBeenCalled();
	});

	it("keeps going when a subscriber throws", () => {
		// One broken panel must not cost every other panel its event, and must
		// not fail the producer that emitted it.
		const { emit, subscribe } = events();
		const logged = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);
		const after = vi.fn();
		subscribe("file:moved", () => {
			throw new Error("boom");
		});
		subscribe("file:moved", after);

		expect(() => emit("file:moved", {})).not.toThrow();
		expect(after).toHaveBeenCalledOnce();
		expect(logged).toHaveBeenCalled();
		logged.mockRestore();
	});

	it("is not disturbed by a handler that subscribes or unsubscribes mid-emit", () => {
		// Handlers run over a copy of the set, so a panel that closes (or
		// opens) in response to an event cannot corrupt the iteration.
		const { emit, subscribe } = events();
		const added = vi.fn();
		const second = vi.fn();
		let stopSecond: () => void = () => {};

		subscribe("file:moved", () => {
			subscribe("file:moved", added);
			stopSecond();
		});
		stopSecond = subscribe("file:moved", second);

		expect(() => emit("file:moved", {})).not.toThrow();
		// the one removed during this emit still ran; the one added did not
		expect(second).toHaveBeenCalledOnce();
		expect(added).not.toHaveBeenCalled();

		emit("file:moved", {});
		expect(second).toHaveBeenCalledOnce();
		expect(added).toHaveBeenCalledOnce();
	});

	it("gives each workbench its own bus", () => {
		// The dock is per-mount, and so is this: a subscription must not be
		// reachable from another workbench on the same page.
		const mine = events();
		const theirs = events();
		const handler = vi.fn();
		mine.subscribe("file:moved", handler);

		theirs.emit("file:moved", {});

		expect(handler).not.toHaveBeenCalled();
	});
});
