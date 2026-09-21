import { describe, expect, it } from "vitest";
import {
	countInlineImages,
	getImageMimeType,
	hasInlineImage,
	splitInlineImages,
} from "./index";

describe("file utilities", () => {
	it("maps image extensions to MIME types", () => {
		expect(getImageMimeType(".JPG")).toBe("image/jpeg");
		expect(getImageMimeType("unknown")).toBe("image/png");
	});

	it("detects and splits inline images", () => {
		const output = 'before <img src="data:image/png;base64,abc"> after';

		expect(hasInlineImage(output)).toBe(true);
		expect(countInlineImages(output)).toBe(1);
		expect(splitInlineImages(output)).toEqual([
			{ kind: "text", value: "before " },
			{ kind: "image", mime: "image/png", data: "abc" },
			{ kind: "text", value: " after" },
		]);
	});
});
