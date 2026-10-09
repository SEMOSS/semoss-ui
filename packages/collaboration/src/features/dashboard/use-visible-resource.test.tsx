import { act, renderHook, waitFor } from "@testing-library/react";
import { useVisibleResource } from "./use-visible-resource";

afterEach(() => vi.restoreAllMocks());

it("ignores stale reads and keeps the latest successful snapshot through isolated failures", async () => {
	let finish: ((value: string) => void) | undefined;
	const old = vi.fn(
		() =>
			new Promise<string>((resolve) => {
				finish = resolve;
			}),
	);
	const current = vi.fn().mockResolvedValue("current");
	const { result, rerender } = renderHook(
		({ load }) => useVisibleResource(load, true),
		{ initialProps: { load: old } },
	);
	rerender({ load: current });
	await waitFor(() => expect(result.current.data).toBe("current"));
	await act(async () => finish?.("stale"));
	expect(result.current.data).toBe("current");
	current.mockRejectedValueOnce(new Error("Temporarily unavailable"));
	act(() => result.current.refresh());
	await waitFor(() => expect(result.current.error).toContain("Temporarily"));
	expect(result.current.data).toBe("current");
	act(() => result.current.refresh());
	await waitFor(() => expect(result.current.error).toBe(""));
});

it("loads on use, caches revisits, and does not refresh on focus or timers", async () => {
	const load = vi.fn().mockResolvedValue([]);
	const { result, rerender } = renderHook(
		({ enabled }) => useVisibleResource(load, enabled),
		{ initialProps: { enabled: false } },
	);
	expect(load).not.toHaveBeenCalled();
	rerender({ enabled: true });
	await waitFor(() => expect(result.current.checkedAt).not.toBeNull());
	rerender({ enabled: false });
	rerender({ enabled: true });
	vi.useFakeTimers();
	act(() => {
		vi.advanceTimersByTime(120000);
		window.dispatchEvent(new Event("focus"));
		document.dispatchEvent(new Event("visibilitychange"));
	});
	expect(load).toHaveBeenCalledTimes(1);
	vi.useRealTimers();
	act(() => result.current.refresh());
	await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
});
