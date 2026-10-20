import { describe, expect, it } from "vitest";
import { FILE_PANEL_TYPES } from "../constants/file-panel.constants";
import { getFilePanelType, getImageMimeType } from "./file-editor.utility";

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

	describe("getFilePanelType", () => {
		it.each([
			["/docs/report.docx", FILE_PANEL_TYPES.FILE_DOCX_VIEWER],
			["/docs/workbook.XLSX", FILE_PANEL_TYPES.FILE_XLSX_VIEWER],
			["/docs/deck.pptx", FILE_PANEL_TYPES.FILE_PPTX_VIEWER],
			["/docs/diagram.VSDX", FILE_PANEL_TYPES.FILE_VISIO_VIEWER],
		])("routes %s to %s", (path, panelType) => {
			expect(getFilePanelType(path)).toBe(panelType);
		});

		it.each(["/docs/report.doc", "/docs/workbook.xls", "/docs/deck.ppt"])(
			"keeps legacy Office file %s download-only",
			(path) => {
				expect(getFilePanelType(path)).toBe(
					FILE_PANEL_TYPES.FILE_DOWNLOAD,
				);
			},
		);
	});
});
