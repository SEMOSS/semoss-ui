import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { WorkbenchStoreContext } from "../contexts/workbench.context";
import { createWorkbenchStore } from "../stores";
import { useWorkbenchEvent } from "./use-workbench-event";

/** The hook mounted against a store, with that store's emit. */
const setup = (handler: (payload: unknown) => void) => {
	const store = createWorkbenchStore({ components: {} });
	const wrapper = ({ children }: { children: ReactNode }) => (
		<WorkbenchStoreContext.Provider value={store}>
			{children}
		</WorkbenchStoreContext.Provider>
	);

	return {
		emit: store.getState().events.actions.emit,
		...renderHook(
			({ on }: { on: (payload: unknown) => void }) =>
				useWorkbenchEvent("file:moved", on),
			{ wrapper, initialProps: { on: handler } },
		),
	};
};

describe("useWorkbenchEvent", () => {
	it("runs the handler when its event is emitted", () => {
		const handler = vi.fn();
		const { emit } = setup(handler);

		act(() => emit("file:moved", { path: "/a.py" }));

		expect(handler).toHaveBeenCalledWith({ path: "/a.py" });
	});

	it("runs the latest handler without re-subscribing", () => {
		// An inline arrow is the expected call shape, so a new closure every
		// render must not churn the subscription — nor deliver to a stale one.
		const first = vi.fn();
		const second = vi.fn();
		const { emit, rerender } = setup(first);

		rerender({ on: second });
		act(() => emit("file:moved", {}));

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledOnce();
	});

	it("stops listening when the panel unmounts", () => {
		const handler = vi.fn();
		const { emit, unmount } = setup(handler);

		unmount();
		act(() => emit("file:moved", {}));

		expect(handler).not.toHaveBeenCalled();
	});
});
