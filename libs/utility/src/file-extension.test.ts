import { describe, expect, it } from "vitest";
import { getFileExtension } from "./file-extension";

describe("getFileExtension", () => {
	it("normalizes extensions from file names and paths", () => {
		expect(getFileExtension("/tmp/Report.PDF?download=true")).toBe("pdf");
		expect(getFileExtension("image.png#preview")).toBe("png");
	});

	it("returns an empty string when no extension exists", () => {
		expect(getFileExtension(".env")).toBe("");
		expect(getFileExtension("README")).toBe("");
		expect(getFileExtension("archive.")).toBe("");
	});
});
