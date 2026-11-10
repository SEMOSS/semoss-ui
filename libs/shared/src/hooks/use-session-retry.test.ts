import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useSessionRetry } from "./use-session-retry";

const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("@semoss/sdk/react", () => ({
	useSession: <T>(
		selector: (state: { refresh: typeof mocks.refresh }) => T,
	) => selector({ refresh: mocks.refresh }),
}));

it("reads the session again and reports the retry while it runs", async () => {
	let finish = () => {};
	mocks.refresh.mockReturnValue(
		new Promise<void>((resolve) => {
			finish = resolve;
		}),
	);
	const { result } = renderHook(() => useSessionRetry());
	expect(result.current.isRetrying).toBe(false);

	let retry: Promise<void> = Promise.resolve();
	act(() => {
		retry = result.current.retry();
	});
	expect(mocks.refresh).toHaveBeenCalledOnce();
	expect(result.current.isRetrying).toBe(true);

	await act(async () => {
		finish();
		await retry;
	});
	expect(result.current.isRetrying).toBe(false);
});
