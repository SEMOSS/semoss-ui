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

it("suspends hidden and disabled resources and refreshes on return", async () => {
	const visibility = vi
		.spyOn(document, "visibilityState", "get")
		.mockReturnValue("hidden");
	const load = vi.fn().mockResolvedValue([]);
	const { result, rerender } = renderHook(
		({ enabled }) => useVisibleResource(load, enabled),
		{ initialProps: { enabled: true } },
	);
	expect(load).not.toHaveBeenCalled();
	visibility.mockReturnValue("visible");
	act(() => document.dispatchEvent(new Event("visibilitychange")));
	await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
	rerender({ enabled: false });
	act(() => window.dispatchEvent(new Event("focus")));
	expect(load).toHaveBeenCalledTimes(1);
	expect(result.current.isLoading).toBe(false);
});
