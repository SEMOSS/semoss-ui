import { beforeEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard, getClipboardErrorMessage } from "./clipboard";

describe("getClipboardErrorMessage", () => {
	it("returns the error's message when present", () => {
		expect(getClipboardErrorMessage(new Error("denied"))).toBe("denied");
	});

	it("falls back to a generic message for a non-Error", () => {
		expect(getClipboardErrorMessage("oops")).toBe("Unable to copy content");
	});
});

describe("copyToClipboard", () => {
	beforeEach(() => {
		Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
	});

	it("calls onSuccess when writeText resolves", async () => {
		vi.mocked(navigator.clipboard.writeText).mockResolvedValue(undefined);
		const onSuccess = vi.fn();
		const onError = vi.fn();

		await copyToClipboard("hello", onSuccess, onError);

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello");
		expect(onSuccess).toHaveBeenCalled();
		expect(onError).not.toHaveBeenCalled();
	});

	it("calls onError with the failure message when writeText rejects", async () => {
		vi.mocked(navigator.clipboard.writeText).mockRejectedValue(
			new Error("denied"),
		);
		const onSuccess = vi.fn();
		const onError = vi.fn();

		await copyToClipboard("hello", onSuccess, onError);

		expect(onSuccess).not.toHaveBeenCalled();
		expect(onError).toHaveBeenCalledWith("denied");
	});
});
