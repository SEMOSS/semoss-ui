// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import {
	type ContextType,
	createElement,
	type PropsWithChildren,
	type ReactElement,
	StrictMode,
} from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildPixel } from "../../../lib/build-pixel";
import { runPixel } from "../../../lib/pixel";
import { InsightContext } from "../contexts/Insight.context";
import { usePixel } from "./usePixel";

vi.mock("../../../lib/pixel", () => ({ runPixel: vi.fn() }));
vi.mock("../contexts/Insight.context", async () => {
	const { createContext } = await import("react");
	return {
		InsightContext: createContext<{ insightId: string } | undefined>(
			undefined,
		),
	};
});

type PixelResponse = Awaited<ReturnType<typeof runPixel<[unknown]>>>;

/** Supply the wire envelope consumed by the hook without running transport. */
function pixelResponse(
	output: unknown,
	operationType = ["CONST_STRING"],
): PixelResponse {
	return {
		errors: [],
		insightId: "response-insight",
		pixelReturn: [
			{
				isMeta: false,
				operationType,
				output,
				pixelExpression: "FrameType();",
				pixelId: "0",
				timeToRun: 1,
			},
		],
	};
}

/** Isolate the insight field read by the hook from SDK store initialization. */
function InsightWrapper({ children }: PropsWithChildren): ReactElement {
	return createElement(
		InsightContext.Provider,
		{
			value: { insightId: "context-insight" } as ContextType<
				typeof InsightContext
			>,
		},
		children,
	);
}

beforeEach(() => {
	vi.mocked(runPixel).mockReset();
	vi.mocked(runPixel).mockResolvedValue(pixelResponse("R"));
});

afterEach(cleanup);

describe("usePixel with built statements", () => {
	it("passes the built string unchanged and keeps equal rebuilt strings stable", async () => {
		const onSuccess = vi.fn();
		const { result, rerender } = renderHook(() =>
			usePixel(buildPixel("FrameType"), { onSuccess }),
		);
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(runPixel).toHaveBeenCalledExactlyOnceWith(
			"FrameType();",
			undefined,
		);
		expect(result.current.data).toBe("R");
		expect(onSuccess).toHaveBeenCalledExactlyOnceWith("R");
		rerender();
		expect(runPixel).toHaveBeenCalledOnce();
	});

	it("skips empty statements and resets to initial data when disabled", async () => {
		const onSuccess = vi.fn();
		const onFinal = vi.fn();
		const { result, rerender } = renderHook(
			({ isEnabled }) =>
				usePixel(isEnabled ? buildPixel("FrameType") : "", {
					data: "GRID",
					onSuccess,
					onFinal,
				}),
			{ initialProps: { isEnabled: false } },
		);
		expect(result.current).toMatchObject({
			status: "INITIAL",
			data: "GRID",
		});
		act(() => result.current.refresh());
		expect(runPixel).not.toHaveBeenCalled();
		expect(onFinal).not.toHaveBeenCalled();

		rerender({ isEnabled: true });
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		rerender({ isEnabled: false });
		expect(result.current).toMatchObject({
			status: "INITIAL",
			data: "GRID",
		});
		expect(runPixel).toHaveBeenCalledOnce();
		expect(onSuccess).toHaveBeenCalledOnce();
		expect(onFinal).toHaveBeenCalledOnce();
	});

	it("preserves loading, refresh, local updates and stable actions", async () => {
		const pending = Promise.withResolvers<PixelResponse>();
		vi.mocked(runPixel)
			.mockReturnValueOnce(pending.promise)
			.mockResolvedValue(pixelResponse("PY"));
		const onSuccess = vi.fn();
		const onFinal = vi.fn();
		const { result } = renderHook(() =>
			usePixel(buildPixel("FrameType"), { onSuccess, onFinal }),
		);
		expect(result.current.status).toBe("LOADING");
		expect(result.current.data).toBeUndefined();
		await act(async () => pending.resolve(pixelResponse("R")));
		expect(result.current).toMatchObject({ status: "SUCCESS", data: "R" });
		expect(onFinal).toHaveBeenCalledOnce();
		const { refresh, update } = result.current;

		act(() => update("NATIVE"));
		expect(result.current.data).toBe("NATIVE");
		expect(runPixel).toHaveBeenCalledOnce();
		await act(async () => refresh());
		expect(result.current.data).toBe("PY");
		expect(runPixel).toHaveBeenCalledTimes(2);
		expect(onSuccess.mock.calls).toEqual([["R"], ["PY"]]);
		expect(onFinal).toHaveBeenCalledTimes(2);
		expect(result.current.refresh).toBe(refresh);
		expect(result.current.update).toBe(update);
	});

	it("uses the context insight and gives the explicit argument precedence", async () => {
		const { result, rerender } = renderHook(
			({ insightId }: { insightId: string | undefined }) =>
				usePixel(buildPixel("FrameType"), undefined, insightId),
			{
				initialProps: { insightId: undefined },
				wrapper: InsightWrapper,
			},
		);
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(runPixel).toHaveBeenLastCalledWith(
			"FrameType();",
			"context-insight",
		);
		rerender({ insightId: "explicit-insight" });
		await waitFor(() => expect(result.current.status).toBe("SUCCESS"));
		expect(runPixel).toHaveBeenLastCalledWith(
			"FrameType();",
			"explicit-insight",
		);
	});

	it.each(["failed", { message: "failed" }])(
		"retains Pixel error handling for %j output",
		async (output) => {
			vi.mocked(runPixel).mockResolvedValue(
				pixelResponse(output, ["ERROR"]),
			);
			const onError = vi.fn();
			const onSuccess = vi.fn();
			const onFinal = vi.fn();
			const { result } = renderHook(() =>
				usePixel(buildPixel("FrameType"), {
					data: "GRID",
					onError,
					onSuccess,
					onFinal,
				}),
			);
			await waitFor(() => expect(result.current.status).toBe("ERROR"));
			expect(result.current.data).toBe("GRID");
			expect(result.current.error?.message).toBe(
				typeof output === "string" ? output : JSON.stringify(output),
			);
			expect(onError).toHaveBeenCalledExactlyOnceWith(
				"GRID",
				result.current.error,
			);
			expect(onSuccess).not.toHaveBeenCalled();
			expect(onFinal).toHaveBeenCalledOnce();
		},
	);

	it("preserves transport rejections and recovers on refresh", async () => {
		const error = new Error("network unavailable");
		vi.mocked(runPixel).mockRejectedValueOnce(error);
		const onError = vi.fn();
		const { result } = renderHook(() =>
			usePixel(buildPixel("FrameType"), { data: "GRID", onError }),
		);
		await waitFor(() => expect(result.current.error).toBe(error));
		expect(onError).toHaveBeenCalledExactlyOnceWith("GRID", error);
		await act(async () => result.current.refresh());
		expect(result.current).toMatchObject({ status: "SUCCESS", data: "R" });
		expect(result.current.error).toBeUndefined();
	});

	it("ignores stale responses after the built parameters change", async () => {
		const older = Promise.withResolvers<PixelResponse>();
		const newer = Promise.withResolvers<PixelResponse>();
		vi.mocked(runPixel)
			.mockReturnValueOnce(older.promise)
			.mockReturnValueOnce(newer.promise);
		const onSuccess = vi.fn();
		const onFinal = vi.fn();
		const { result, rerender } = renderHook(
			({ column }) =>
				usePixel(buildPixel("FrameHeaderExists", { column }), {
					onSuccess,
					onFinal,
				}),
			{ initialProps: { column: "old" } },
		);
		rerender({ column: "new" });
		expect(runPixel).toHaveBeenCalledTimes(2);
		expect(vi.mocked(runPixel).mock.calls[0][0]).not.toBe(
			vi.mocked(runPixel).mock.calls[1][0],
		);
		await act(async () => newer.resolve(pixelResponse(true)));
		await act(async () => older.resolve(pixelResponse(false)));
		expect(result.current.data).toBe(true);
		expect(onSuccess).toHaveBeenCalledExactlyOnceWith(true);
		expect(onFinal).toHaveBeenCalledOnce();
	});

	it("ignores rejected superseded requests", async () => {
		const older = Promise.withResolvers<PixelResponse>();
		const newer = Promise.withResolvers<PixelResponse>();
		vi.mocked(runPixel)
			.mockReturnValueOnce(older.promise)
			.mockReturnValueOnce(newer.promise);
		const onError = vi.fn();
		const onFinal = vi.fn();
		const { result } = renderHook(() =>
			usePixel(buildPixel("FrameType"), { onError, onFinal }),
		);
		act(() => result.current.refresh());
		await act(async () => older.reject(new Error("stale failure")));
		expect(result.current.status).toBe("LOADING");
		expect(onError).not.toHaveBeenCalled();
		expect(onFinal).not.toHaveBeenCalled();
		await act(async () => newer.resolve(pixelResponse("R")));
		expect(result.current.data).toBe("R");
		expect(onFinal).toHaveBeenCalledOnce();
	});

	it.each(["disabled", "unmounted"] as const)(
		"ignores a pending result after being %s",
		async (transition) => {
			const pending = Promise.withResolvers<PixelResponse>();
			vi.mocked(runPixel).mockReturnValueOnce(pending.promise);
			const onSuccess = vi.fn();
			const onFinal = vi.fn();
			const { result, rerender, unmount } = renderHook(
				({ isEnabled }) =>
					usePixel(isEnabled ? buildPixel("FrameType") : "", {
						onSuccess,
						onFinal,
					}),
				{ initialProps: { isEnabled: true } },
			);
			if (transition === "disabled") rerender({ isEnabled: false });
			else unmount();
			await act(async () => pending.resolve(pixelResponse("late")));
			expect(onSuccess).not.toHaveBeenCalled();
			expect(onFinal).not.toHaveBeenCalled();
			if (transition === "disabled")
				expect(result.current.status).toBe("INITIAL");
		},
	);

	it("keeps hook instances independent", async () => {
		const { result } = renderHook(() => ({
			first: usePixel(buildPixel("FrameType")),
			second: usePixel(buildPixel("FrameType")),
		}));
		await waitFor(() =>
			expect(result.current.second.status).toBe("SUCCESS"),
		);
		act(() => result.current.first.update("NATIVE"));
		expect(result.current.first.data).toBe("NATIVE");
		expect(result.current.second.data).toBe("R");
		expect(runPixel).toHaveBeenCalledTimes(2);
	});

	it("ignores the discarded Strict Mode setup", async () => {
		const discarded = Promise.withResolvers<PixelResponse>();
		const active = Promise.withResolvers<PixelResponse>();
		vi.mocked(runPixel)
			.mockReturnValueOnce(discarded.promise)
			.mockReturnValueOnce(active.promise);
		const onSuccess = vi.fn();
		const onFinal = vi.fn();
		const { result } = renderHook(
			() => usePixel(buildPixel("FrameType"), { onSuccess, onFinal }),
			{ wrapper: StrictMode },
		);
		expect(runPixel).toHaveBeenCalledTimes(2);
		await act(async () => discarded.resolve(pixelResponse("discarded")));
		expect(result.current.status).toBe("LOADING");
		expect(onSuccess).not.toHaveBeenCalled();
		expect(onFinal).not.toHaveBeenCalled();
		await act(async () => active.resolve(pixelResponse("R")));
		expect(result.current.data).toBe("R");
		expect(onSuccess).toHaveBeenCalledExactlyOnceWith("R");
		expect(onFinal).toHaveBeenCalledOnce();
	});
});
