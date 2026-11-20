import { expect, test } from "vitest";
import { filterPastedFiles } from "./filter-pasted-files";

const image = new File(["png"], "copy.png", { type: "image/png" });
const document = new File(["pdf"], "report.pdf", { type: "application/pdf" });

/**
 * A paste's clipboard with these files and entries.
 *
 * @param files - The files on the clipboard.
 * @param entries - Its text entries, by type.
 */
const clipboard = (files: File[], entries: Record<string, string> = {}) => ({
	files: files as unknown as FileList,
	getData: (type: string) => entries[type] ?? "",
});

test("a paste with no text attaches every file", () => {
	expect(filterPastedFiles(clipboard([image, document]))).toEqual([
		image,
		document,
	]);
});

test("text, as Word or Outlook copies it, drops the image of it and keeps other files", () => {
	expect(
		filterPastedFiles(
			clipboard([image, document], { "text/plain": "Quarterly numbers" }),
		),
	).toEqual([document]);
	expect(
		filterPastedFiles(
			clipboard([image], { "text/html": "<p>Quarterly numbers</p>" }),
		),
	).toEqual([]);
});

test("a Teams image, a bare img in its html, stays attached", () => {
	expect(
		filterPastedFiles(
			clipboard([image], {
				"text/plain": "  ",
				"text/html": '<img src="https://teams.example/copy.png">',
			}),
		),
	).toEqual([image]);
});
