import { describe, expect, it } from "vitest";
import { getImageMimeType } from "./file-editor.utility";

describe("legacy panel image MIME adapter", () => {
	it.each([
		["folder/PHOTO.JPEG", "image/jpeg"],
		[".jpg", "image/jpeg"],
		["jpg", "image/jpeg"],
		["image.svg", "image/svg+xml"],
		["image.jpg?version=2", "image/png"],
		["unknown", "image/png"],
	])("preserves the path policy for %s", (path, expected) => {
		expect(getImageMimeType(path)).toBe(expected);
	});
});
