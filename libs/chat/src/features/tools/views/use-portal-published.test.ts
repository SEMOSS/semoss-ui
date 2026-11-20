import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { isPortalPublished } from "@semoss/sdk";
import { usePortalPublished } from "./use-portal-published";

vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	isPortalPublished: vi.fn(),
}));

const mockIsPortalPublished = vi.mocked(isPortalPublished);

/** An answer that arrives when the test says so. */
const deferred = () => {
	let resolve: (value: boolean) => void = () => undefined;
	const promise = new Promise<boolean>((done) => {
		resolve = done;
	});
	return { promise: promise, resolve: resolve };
};

beforeEach(() => {
	mockIsPortalPublished.mockReset();
});

test("asks nothing without an app", () => {
	const { result } = renderHook(() => usePortalPublished(null));
	expect(result.current).toBeUndefined();
	expect(mockIsPortalPublished).not.toHaveBeenCalled();
});

test("answers for the current app and drops the last app's late answer", async () => {
	const first = deferred();
	const second = deferred();
	mockIsPortalPublished
		.mockReturnValueOnce(first.promise)
		.mockReturnValueOnce(second.promise);
	const { result, rerender } = renderHook(
		({ appId }: { appId: string }) => usePortalPublished(appId),
		{ initialProps: { appId: "app-1" } },
	);
	expect(result.current).toBeUndefined();

	rerender({ appId: "app-2" });
	await act(async () => {
		first.resolve(true);
		await first.promise;
	});
	expect(result.current).toBeUndefined();

	await act(async () => {
		second.resolve(false);
		await second.promise;
	});
	expect(result.current).toBe(false);
	expect(mockIsPortalPublished.mock.calls).toEqual([["app-1"], ["app-2"]]);
});
