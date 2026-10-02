import { afterEach, describe, expect, it, vi } from "vitest";
import { encodeBase64 } from "@semoss/utility/encoding";
import { decodeBase64Asset, encodeBase64Asset } from "./file-explorer.utils";

afterEach(() => vi.restoreAllMocks());

describe("legacy asset encoding", () => {
	it("preserves the published encoder as a compatibility export", () => {
		expect(encodeBase64Asset).toBe(encodeBase64);
	});
	it("keeps nullable decoding and whitespace normalization", () => {
		expect(decodeBase64Asset("")).toBeNull();
		expect(decodeBase64Asset(" Y\u00a0Q==\n")).toEqual(
			new Uint8Array([97]),
		);
		expect(decodeBase64Asset(" \n ")).toEqual(new Uint8Array());
	});
	it("reports malformed assets and returns null rather than throwing", () => {
		const log = vi.spyOn(console, "error").mockImplementation(() => {});
		expect(decodeBase64Asset("!")).toBeNull();
		expect(log).toHaveBeenCalledOnce();
		expect(log.mock.calls[0][0]).toBe("Failed to decode asset bytes");
	});
});
