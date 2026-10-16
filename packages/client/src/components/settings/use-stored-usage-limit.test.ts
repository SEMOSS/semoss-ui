import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ModelUsageLimit } from "@semoss/sdk";
import { useStoredUsageLimit } from "./use-stored-usage-limit";

/** A limit of one shared token rule */
const tokensADay = (amount: number): ModelUsageLimit => ({
	unlimited: false,
	rules: [{ metric: "TOKENS", amount, window: "DAY", counts: "SHARED" }],
});

type Read = () => Promise<ModelUsageLimit | null>;
type Write = (
	usageLimit: ModelUsageLimit | null,
) => Promise<ModelUsageLimit | null>;

describe("useStoredUsageLimit", () => {
	it("shows the limit the backend saved, not the one sent", async () => {
		const read = vi.fn<Read>().mockResolvedValue(null);
		// the backend answers with the limit as it keeps it
		const write = vi.fn<Write>().mockResolvedValue(tokensADay(2000));
		const { result } = renderHook(() => useStoredUsageLimit(read, write));
		await waitFor(() => expect(result.current.isLoading).toBe(false));

		let saved: ModelUsageLimit | null = null;
		await act(async () => {
			saved = await result.current.save(tokensADay(1000));
		});

		expect(write).toHaveBeenCalledExactlyOnceWith(tokensADay(1000));
		expect(saved).toEqual(tokensADay(2000));
		expect(result.current.value).toEqual(tokensADay(2000));
	});

	it("keeps the limit it has when a save fails", async () => {
		const read = vi.fn<Read>().mockResolvedValue(tokensADay(500));
		const write = vi
			.fn<Write>()
			.mockRejectedValue(new Error("Only admins can do this"));
		const { result } = renderHook(() => useStoredUsageLimit(read, write));
		await waitFor(() => expect(result.current.isLoading).toBe(false));

		await act(async () => {
			await expect(result.current.save(null)).rejects.toThrow(
				"Only admins can do this",
			);
		});

		expect(result.current.value).toEqual(tokensADay(500));
	});
});
