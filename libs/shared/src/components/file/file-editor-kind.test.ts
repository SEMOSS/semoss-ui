import { describe, expect, it } from "vitest";
import { getFileEditorKind } from "./file-editor-kind";

describe("getFileEditorKind", () => {
	it("downloads Office files and binaries that no panel previews", () => {
		for (const path of [
			"/report.docx",
			"/Budget.XLSX",
			"/archive.zip",
			"/mail/original.msg",
			"/call.mp4",
			"/scan.tiff",
		])
			expect(getFileEditorKind(path)).toBe("download");
	});

	it("keeps previews and text files on their own panels", () => {
		expect(getFileEditorKind("/deck.pptx")).toBe("pptx");
		expect(getFileEditorKind("/scan.pdf")).toBe("pdf");
		expect(getFileEditorKind("/photo.png")).toBe("image");
		expect(getFileEditorKind("/notes.md")).toBe("markdown");
		for (const path of [
			"/notes.txt",
			"/data.csv",
			"/page.html",
			"/mail.eml",
		])
			expect(getFileEditorKind(path)).toBe("code");
	});
});
