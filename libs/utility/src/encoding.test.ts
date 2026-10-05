import { describe, expect, it } from "vitest";
import {
	decodeBase64ToBytes,
	encodeBytesToBase64,
	encodeTextToBase64,
} from "./encoding";

describe("Base64", () => {
	it("round-trips every byte over multiple chunks", () => {
		const bytes = Uint8Array.from({ length: 100000 }, (_, i) => i % 256);
		expect(decodeBase64ToBytes(encodeBytesToBase64(bytes))).toEqual(bytes);
	});
	it("encodes UTF-8 rather than truncating non-ASCII characters", () => {
		const text = "é漢字🙂";
		expect(
			new TextDecoder().decode(
				decodeBase64ToBytes(encodeTextToBase64(text)),
			),
		).toBe(text);
	});
	it("keeps empty input valid and rejects malformed Base64", () => {
		expect(encodeTextToBase64("")).toBe("");
		expect(decodeBase64ToBytes("")).toEqual(new Uint8Array());
		expect(() => decodeBase64ToBytes("!")).toThrow();
	});
});
