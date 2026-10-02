import { describe, expect, it } from "vitest";
import { decodeBase64, encodeBase64, encodeBase64Text } from "./encoding";

describe("Base64", () => {
	it("round-trips every byte over multiple chunks", () => {
		const bytes = Uint8Array.from({ length: 100000 }, (_, i) => i % 256);
		expect(decodeBase64(encodeBase64(bytes))).toEqual(bytes);
	});
	it("encodes UTF-8 rather than truncating non-ASCII characters", () => {
		const text = "é漢字🙂";
		expect(
			new TextDecoder().decode(decodeBase64(encodeBase64Text(text))),
		).toBe(text);
	});
	it("keeps empty input valid and rejects malformed Base64", () => {
		expect(encodeBase64Text("")).toBe("");
		expect(decodeBase64("")).toEqual(new Uint8Array());
		expect(() => decodeBase64("!")).toThrow();
	});
});
