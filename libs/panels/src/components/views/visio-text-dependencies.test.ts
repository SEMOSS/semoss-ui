import { editVsdx, parseVsdx, type VisioEdit } from "visio-react-viewer";
import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

interface FixtureZip {
	files: Record<string, { dir: boolean }>;
	file(path: string): {
		async(type: "string" | "base64"): Promise<string>;
	} | null;
	file(path: string, content: string): void;
	generateAsync(options: { type: "uint8array" }): Promise<Uint8Array>;
}

// Reuse the core's ZIP dependency for package-level assertions and mutations.
// Production code continues to consume only the viewer's public API.
const viewerRequire = createRequire(
	createRequire(import.meta.url).resolve("visio-react-viewer"),
);
const coreRequire = createRequire(viewerRequire.resolve("ooxml-core/visio"));
const zip: { loadAsync(bytes: Uint8Array): Promise<FixtureZip> } =
	coreRequire("jszip");
const ns = "http://schemas.microsoft.com/office/visio/2012/main";
const pagePath = "visio/pages/page1.xml";
const masterPath = "visio/masters/master1.xml";
const fixture = (): Uint8Array =>
	new Uint8Array(
		readFileSync(
			resolve(
				"src/components/views/__fixtures__/visio-text-dependencies.vsdx",
			),
		),
	);

/** Read one required synthetic package part without silently accepting absence. */
const readPart = async (archive: FixtureZip, path: string): Promise<string> => {
	const part = archive.file(path);
	if (!part) throw new Error(`Missing fixture part ${path}`);
	return part.async("string");
};

/** Find a cell directly owned by the specified synthetic shape. */
const cell = (document: Document, shapeId: string, name: string): Element => {
	const shape = Array.from(document.getElementsByTagNameNS(ns, "Shape")).find(
		(entry) => entry.getAttribute("ID") === shapeId,
	);
	const found =
		shape &&
		Array.from(shape.children).find(
			(entry) =>
				entry.localName === "Cell" && entry.getAttribute("N") === name,
		);
	if (!found) throw new Error(`Missing ${shapeId}.${name}`);
	return found;
};

/** Vary one real package boundary while retaining the complete connector fixture. */
const mutate = async (
	change: (page: Document, master: Document) => void,
): Promise<Uint8Array> => {
	const archive = await zip.loadAsync(fixture());
	const parser = new DOMParser();
	const page = parser.parseFromString(
		await readPart(archive, pagePath),
		"application/xml",
	);
	const master = parser.parseFromString(
		await readPart(archive, masterPath),
		"application/xml",
	);
	change(page, master);
	const serializer = new XMLSerializer();
	archive.file(pagePath, serializer.serializeToString(page));
	archive.file(masterPath, serializer.serializeToString(master));
	return archive.generateAsync({ type: "uint8array" });
};

/** A range edit follows the same core command used by the patched inline editor. */
const command = async (bytes: Uint8Array): Promise<VisioEdit> => ({
	type: "replace-text-ranges",
	pageId: (await parseVsdx(bytes)).pages[0].id,
	shapeId: "1001",
	expectedText: "Original text",
	ranges: [{ start: 0, end: 13, text: "Updated label" }],
});

it("saves independent labels without changing connector formulas, caches or master parts", async () => {
	const original = fixture();
	const document = await parseVsdx(original);
	const result = await editVsdx(original, [
		await command(original),
		{
			type: "replace-text-ranges",
			pageId: document.pages[0].id,
			shapeId: "1002",
			expectedText: "Control Flow",
			ranges: [{ start: 0, end: 12, text: "Updated control" }],
		},
	]);
	const reloaded = await parseVsdx(result.bytes);
	expect(
		reloaded.pages[0].shapes.find((shape) => shape.id === "1001")?.text
			.plainText,
	).toBe("Updated label");
	expect(
		reloaded.pages[0].shapes.find((shape) => shape.id === "1002")?.text
			.plainText,
	).toBe("Updated control");
	const before = await zip.loadAsync(original);
	const after = await zip.loadAsync(result.bytes);
	for (const [path, entry] of Object.entries(before.files)) {
		if (entry.dir || path === pagePath) continue;
		expect(await after.file(path)?.async("base64"), path).toBe(
			await before.file(path)?.async("base64"),
		);
	}
	const parser = new DOMParser();
	const beforePage = parser.parseFromString(
		await readPart(before, pagePath),
		"application/xml",
	);
	const afterPage = parser.parseFromString(
		await readPart(after, pagePath),
		"application/xml",
	);
	const serializer = new XMLSerializer();
	for (const id of ["2001", "2002"]) {
		const find = (page: Document) =>
			Array.from(page.getElementsByTagNameNS(ns, "Shape")).find(
				(shape) => shape.getAttribute("ID") === id,
			);
		const previous = find(beforePage);
		const current = find(afterPage);
		if (!previous || !current) throw new Error("Missing fixture connector");
		expect(serializer.serializeToString(current)).toBe(
			serializer.serializeToString(previous),
		);
	}
});

it("applies the same fix through the CommonJS core entry point", async () => {
	const core: Pick<
		typeof import("visio-react-viewer"),
		"editVsdx" | "parseVsdx"
	> = viewerRequire("ooxml-core/visio");
	const input = fixture();
	const saved = await core.editVsdx(input, [await command(input)]);
	expect(
		(await core.parseVsdx(saved.bytes)).pages[0].shapes[0].text.plainText,
	).toBe("Updated label");
});

it.each([
	[
		"dynamic lookup",
		(page: Document) =>
			cell(page, "2001", "Width").setAttribute("F", 'INDIRECT("Width")'),
	],
	[
		"nested trigger expression",
		(page: Document) =>
			cell(page, "2001", "BegTrigger").setAttribute(
				"F",
				'_XFTRIGGER(INDIRECT("EventXFMod"))',
			),
	],
	[
		"trigger in an ordinary value cell",
		(page: Document) =>
			cell(page, "2001", "Width").setAttribute(
				"F",
				"_XFTRIGGER(EventXFMod)",
			),
	],
	[
		"trigger with an error cache",
		(page: Document) =>
			cell(page, "2001", "BegTrigger").setAttribute("E", "1"),
	],
	[
		"incomplete connector",
		(page: Document) => cell(page, "2001", "EndY").remove(),
	],
])("still refuses %s", async (_name, change) => {
	const input = await mutate(change);
	await expect(editVsdx(input, [await command(input)])).rejects.toMatchObject(
		{ code: "EDIT_UNKNOWN_DEPENDENCY" },
	);
});

it.each([
	[
		"cross-shape event trigger",
		(page: Document) =>
			cell(page, "2001", "BegTrigger").setAttribute(
				"F",
				"_XFTRIGGER(Sheet.1001!EventXFMod)",
			),
	],
	[
		"formula reading the edited label",
		(page: Document) =>
			cell(page, "2001", "PinX").setAttribute(
				"F",
				"LEN(Sheet.1001!TheText)",
			),
	],
])("still refuses %s", async (_name, change) => {
	const input = await mutate(change);
	await expect(editVsdx(input, [await command(input)])).rejects.toMatchObject(
		{ code: "EDIT_UNSUPPORTED_FORMAT_DEPENDENCY" },
	);
});

it.each([
	["cross-shape measurement", "MAX(TEXTWIDTH(TheText),Sheet.1001!Char.Size)"],
	["dynamic text evaluation", 'EVALTEXT("TheText")'],
	["redirected text lookup", 'SHAPETEXT(INDIRECT("TheText"))'],
])("still refuses a master with %s", async (_name, formula) => {
	const input = await mutate((_page, master) =>
		cell(master, "1", "TxtWidth").setAttribute("F", formula),
	);
	await expect(editVsdx(input, [await command(input)])).rejects.toMatchObject(
		{ code: "EDIT_UNSUPPORTED_FORMAT_DEPENDENCY" },
	);
});

it("retains text protection on the edited local label", async () => {
	const input = await mutate((page) => {
		const shape = cell(page, "1001", "Width").parentElement;
		if (!shape) throw new Error("Missing local label");
		const lock = page.createElementNS(ns, "Cell");
		lock.setAttribute("N", "LockTextEdit");
		lock.setAttribute("V", "1");
		shape.insertBefore(lock, shape.firstChild);
	});
	await expect(editVsdx(input, [await command(input)])).rejects.toThrow(
		/lock|protect/i,
	);
});
