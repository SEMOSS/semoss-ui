// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { StoreState } from "../store";
import { useStoreSelector } from "./use-store-selector";

interface CounterSnapshot {
	readonly count: number;
	readonly label: string;
	readonly tags: readonly string[];
}

const createCounter = () =>
	new StoreState<CounterSnapshot>({ count: 0, label: "a", tags: ["x"] });

describe("useStoreSelector", () => {
	it("reads the selected part and renders when it changes", () => {
		const store = createCounter();
		const { result } = renderHook(() =>
			useStoreSelector(store, (state) => state.count),
		);

		expect(result.current).toBe(0);

		act(() => store.update({ count: 1 }));

		expect(result.current).toBe(1);
	});

	it("reads the whole state when given no selector", () => {
		const store = createCounter();
		const { result } = renderHook(() => useStoreSelector(store));

		expect(result.current).toBe(store.getSnapshot());

		act(() => store.update({ label: "b" }));

		expect(result.current).toBe(store.getSnapshot());
		expect(result.current.label).toBe("b");
	});

	it("does not render when another part changes", () => {
		const store = createCounter();
		const render = vi.fn();
		renderHook(() => {
			render();
			return useStoreSelector(store, (state) => state.count);
		});
		const renders = render.mock.calls.length;

		act(() => store.update({ label: "b" }));

		expect(render).toHaveBeenCalledTimes(renders);
	});

	it("keeps an object selection when its entries are the same", () => {
		const store = createCounter();
		const render = vi.fn();
		const { result } = renderHook(() => {
			render();
			return useStoreSelector(store, (state) => ({
				count: state.count,
				tags: state.tags,
			}));
		});
		const first = result.current;
		const renders = render.mock.calls.length;

		act(() => store.update({ label: "b" }));

		expect(result.current).toBe(first);
		expect(render).toHaveBeenCalledTimes(renders);

		act(() => store.update({ count: 2 }));

		expect(result.current).toEqual({ count: 2, tags: ["x"] });
		expect(result.current).not.toBe(first);
	});

	it("keeps an array a selector builds when its items are the same", () => {
		const store = createCounter();
		const { result } = renderHook(() =>
			useStoreSelector(store, (state) =>
				state.tags.filter((tag) => tag !== "hidden"),
			),
		);
		const first = result.current;

		act(() => store.update({ count: 1 }));
		expect(result.current).toBe(first);

		act(() => store.update({ tags: ["x", "y"] }));
		expect(result.current).toEqual(["x", "y"]);
	});

	it("replaces an error selection when the store holds another error", () => {
		const first = new Error("offline");
		const next = new Error("backend failure");
		const store = new StoreState<{ readonly error: Error }>({
			error: first,
		});
		const { result } = renderHook(() =>
			useStoreSelector(store, (state) => state.error),
		);

		expect(result.current).toBe(first);

		act(() => store.set({ error: next }));

		expect(result.current).toBe(next);
	});

	it("reads through a selector that changes between renders", () => {
		const store = createCounter();
		const { result, rerender } = renderHook(
			({ step }: { step: number }) =>
				useStoreSelector(store, (state) => state.count + step),
			{ initialProps: { step: 1 } },
		);

		expect(result.current).toBe(1);

		rerender({ step: 10 });

		expect(result.current).toBe(10);
	});

	it("reads another store when the store changes", () => {
		const first = createCounter();
		const second = createCounter();
		second.update({ count: 5 });
		const { result, rerender } = renderHook(
			({ store }: { store: StoreState<CounterSnapshot> }) =>
				useStoreSelector(store, (state) => state.count),
			{ initialProps: { store: first } },
		);

		rerender({ store: second });
		expect(result.current).toBe(5);

		act(() => first.update({ count: 9 }));
		expect(result.current).toBe(5);

		act(() => second.update({ count: 6 }));
		expect(result.current).toBe(6);
	});

	it("gives each component its own selection", () => {
		const store = createCounter();
		const count = renderHook(() =>
			useStoreSelector(store, (state) => state.count),
		);
		const label = renderHook(() =>
			useStoreSelector(store, (state) => state.label),
		);

		act(() => store.update({ count: 3 }));

		expect(count.result.current).toBe(3);
		expect(label.result.current).toBe("a");
	});

	it("stops listening when the component unmounts", () => {
		const store = createCounter();
		const subscribe = vi.fn(store.subscribe);
		const stop = vi.fn();
		subscribe.mockImplementation((listener) => {
			const unsubscribe = store.subscribe(listener);
			return () => {
				stop();
				unsubscribe();
			};
		});
		const { unmount } = renderHook(() =>
			useStoreSelector(
				{ subscribe: subscribe, getSnapshot: store.getSnapshot },
				(state) => state.count,
			),
		);

		unmount();

		expect(stop).toHaveBeenCalledTimes(1);
	});

	it("reads and cleans up under Strict Mode", () => {
		const store = createCounter();
		const { result, unmount } = renderHook(
			() => useStoreSelector(store, (state) => ({ count: state.count })),
			{ wrapper: StrictMode },
		);

		act(() => store.update({ count: 4 }));
		expect(result.current).toEqual({ count: 4 });

		unmount();
		expect(() => store.update({ count: 5 })).not.toThrow();
	});
});
