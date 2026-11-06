import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { isAtEditorLineBoundary } from "./editor-line-boundary";

const originalRects = Object.getOwnPropertyDescriptor(
	Range.prototype,
	"getClientRects",
);
let root: HTMLDivElement;
let caret: Range;
let caretTop = 0;
let lines: DOMRect[];

beforeEach(() => {
	root = document.createElement("div");
	root.style.lineHeight = "24px";
	root.innerHTML = "<p>one long wrapped prompt</p>";
	document.body.append(root);
	caret = document.createRange();
	const node = root.firstChild?.firstChild;
	if (!node) throw new Error("Missing text node");
	caret.setStart(node, 2);
	caret.collapse(true);
	document.getSelection()?.removeAllRanges();
	document.getSelection()?.addRange(caret);
	caretTop = 3;
	lines = [
		new DOMRect(0, 0, 200, 72),
		new DOMRect(0, 3, 200, 18),
		new DOMRect(0, 27, 200, 18),
		new DOMRect(0, 51, 100, 18),
	];
	Object.defineProperty(Range.prototype, "getClientRects", {
		configurable: true,
		value: vi.fn(function (this: Range) {
			return this.collapsed ? [new DOMRect(0, caretTop, 0, 18)] : lines;
		}),
	});
});
afterEach(() => {
	if (originalRects)
		Object.defineProperty(Range.prototype, "getClientRects", originalRects);
	else Reflect.deleteProperty(Range.prototype, "getClientRects");
	root.remove();
	document.getSelection()?.removeAllRanges();
});

test("recognizes first and last visual lines without confusing wrapped lines with a paragraph", () => {
	expect(isAtEditorLineBoundary(root, "up")).toBe(true);
	expect(isAtEditorLineBoundary(root, "down")).toBe(false);
	caretTop = 27;
	expect(isAtEditorLineBoundary(root, "up")).toBe(false);
	expect(isAtEditorLineBoundary(root, "down")).toBe(false);
	caretTop = 51;
	expect(isAtEditorLineBoundary(root, "up")).toBe(false);
	expect(isAtEditorLineBoundary(root, "down")).toBe(true);
});

test("handles a single empty line and leaves missing geometry or outside selections alone", () => {
	lines = [new DOMRect(0, 0, 200, 24)];
	expect(isAtEditorLineBoundary(root, "up")).toBe(true);
	expect(isAtEditorLineBoundary(root, "down")).toBe(true);
	lines = [];
	expect(isAtEditorLineBoundary(root, "up")).toBe(false);
	document.getSelection()?.removeAllRanges();
	expect(isAtEditorLineBoundary(root, "up")).toBe(false);
});

test("does not replace a text selection", () => {
	caret.setEnd(caret.startContainer, 4);
	expect(isAtEditorLineBoundary(root, "up")).toBe(false);
});

test("recognizes a caret before the placeholder break on an empty final line", () => {
	root.innerHTML = "<p>first line<br><br></p>";
	const paragraph = root.firstChild;
	if (!paragraph) throw new Error("Missing paragraph");
	caret.setStart(paragraph, 2);
	caret.collapse(true);
	const lastBreak = paragraph.lastChild;
	Object.defineProperty(Range.prototype, "getClientRects", {
		configurable: true,
		value: function (this: Range) {
			if (this.collapsed) return [];
			if (
				this.startContainer === paragraph &&
				this.startOffset === 2 &&
				lastBreak
			) {
				return [new DOMRect(0, 27, 0, 18)];
			}
			return [new DOMRect(0, 3, 100, 18), new DOMRect(0, 27, 0, 18)];
		},
	});
	expect(isAtEditorLineBoundary(root, "up")).toBe(false);
	expect(isAtEditorLineBoundary(root, "down")).toBe(true);
});
