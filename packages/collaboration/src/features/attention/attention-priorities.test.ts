import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	attentionPriorityStorageKey,
	readAttentionPriorities,
} from "./attention-priorities";
import { useAttentionPriorities } from "./use-attention-priorities";

afterEach(() => {
	localStorage.clear();
	vi.restoreAllMocks();
});

describe("review priority preferences", () => {
	it("isolates accounts and deployments and persists only namespaced IDs and priorities", () => {
		const key = attentionPriorityStorageKey("owner", "deployment");
		const { result } = renderHook(() => useAttentionPriorities(key));
		act(() => {
			result.current.setPriority("review:one", "P1");
			result.current.setPriority("memory:two", "P0");
		});
		expect(JSON.parse(localStorage.getItem(key) ?? "null")).toEqual({
			version: 1,
			priorities: { "review:one": "P1", "memory:two": "P0" },
		});
		expect(
			readAttentionPriorities(
				attentionPriorityStorageKey("other", "deployment"),
			).priorities,
		).toEqual({});
		expect(
			readAttentionPriorities(
				attentionPriorityStorageKey("owner", "other"),
			).priorities,
		).toEqual({});
	});

	it("keeps session changes and explains failure when browser storage rejects a write", () => {
		const { result } = renderHook(() => useAttentionPriorities("key"));
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("quota");
		});
		act(() => result.current.setPriority("action:one", "P0"));
		expect(result.current.priorities).toEqual({ "action:one": "P0" });
		expect(result.current.error).toMatch(/session/);
	});

	it("rejects malformed data and accepts same-account updates from another tab", () => {
		localStorage.setItem(
			"key",
			JSON.stringify({ version: 1, priorities: { "review:one": "P9" } }),
		);
		const { result } = renderHook(() => useAttentionPriorities("key"));
		expect(result.current.priorities).toEqual({});
		expect(result.current.error).toMatch(/could not be read/);
		localStorage.setItem(
			"key",
			JSON.stringify({ version: 1, priorities: { "review:one": "P3" } }),
		);
		act(() =>
			window.dispatchEvent(new StorageEvent("storage", { key: "key" })),
		);
		expect(result.current.priorities).toEqual({ "review:one": "P3" });
		expect(result.current.error).toBe("");
	});
});
