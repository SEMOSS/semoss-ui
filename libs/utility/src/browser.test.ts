// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	downloadBlob,
	safeHttpsUrl,
	scrollAncestorsToTop,
	setFavicon,
} from "./browser";

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	document.head.innerHTML = "";
	document.body.innerHTML = "";
});

describe("browser resources", () => {
	it("accepts absolute HTTPS item links without restricting provider hosts", () => {
		expect(safeHttpsUrl(" https://example.org/item?id=1#detail ")).toBe(
			"https://example.org/item?id=1#detail",
		);
		for (const value of [
			undefined,
			"",
			"/item/1",
			"javascript:alert(1)",
			"http://example.org/item",
			"not a url",
		])
			expect(safeHttpsUrl(value)).toBeUndefined();
	});
	it("downloads the original Blob with the requested filename and cleans up", () => {
		const blob = new Blob(["hello"]);
		const createObjectURL = vi.fn(() => "blob:test");
		const revokeObjectURL = vi.fn();
		vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
		const click = vi
			.spyOn(HTMLAnchorElement.prototype, "click")
			.mockImplementation(function (this: HTMLAnchorElement) {
				expect(this.isConnected).toBe(true);
				expect(this.download).toBe("hello.txt");
				expect(this.getAttribute("href")).toBe("blob:test");
			});
		downloadBlob(blob, "hello.txt");
		expect(createObjectURL).toHaveBeenCalledWith(blob);
		expect(click).toHaveBeenCalledOnce();
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
		expect(document.querySelector("a")).toBeNull();
	});
	it("cleans up after a failed click and preserves the error", () => {
		const error = new Error("download failed");
		const revokeObjectURL = vi.fn();
		vi.stubGlobal("URL", {
			createObjectURL: () => "blob:test",
			revokeObjectURL,
		});
		vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
			() => {
				throw error;
			},
		);
		expect(() => downloadBlob(new Blob(), "file.txt")).toThrow(error);
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
		expect(document.querySelector("a")).toBeNull();
	});
	it("replaces favicon variants while preserving other head links", () => {
		document.head.innerHTML =
			'<link rel="icon"><link rel="shortcut icon"><link rel="apple-touch-icon"><link rel="stylesheet" href="theme.css">';
		vi.spyOn(Date, "now").mockReturnValue(42);
		setFavicon("/icon.png?theme=dark");
		expect(document.querySelectorAll('link[rel="icon"]')).toHaveLength(1);
		expect(
			document.querySelector('link[rel="icon"]')?.getAttribute("href"),
		).toBe("/icon.png?theme=dark&v=42");
		expect(document.querySelector('link[rel="stylesheet"]')).not.toBeNull();
		expect(
			document.querySelector('link[rel="apple-touch-icon"]'),
		).toBeNull();
		setFavicon("data:image/svg+xml,<svg/>");
		const icon = document.querySelector('link[rel="icon"]');
		expect(icon?.getAttribute("href")).toBe("data:image/svg+xml,<svg/>");
		expect(icon?.getAttribute("type")).toBe("image/svg+xml");
	});
});

describe("scrollAncestorsToTop", () => {
	it("scrolls each scrolled ancestor to the top, and puts them back", () => {
		document.body.innerHTML =
			'<div id="outer"><div id="inner"><div id="untouched"><p id="view"></p></div></div></div>';
		const outer = document.getElementById("outer") as HTMLElement;
		const inner = document.getElementById("inner") as HTMLElement;
		const untouched = document.getElementById("untouched") as HTMLElement;
		outer.scrollTop = 120;
		inner.scrollTop = 40;

		const restore = scrollAncestorsToTop(document.getElementById("view"));

		expect(outer.scrollTop).toBe(0);
		expect(inner.scrollTop).toBe(0);
		expect(untouched.scrollTop).toBe(0);
		restore();
		expect(outer.scrollTop).toBe(120);
		expect(inner.scrollTop).toBe(40);
		expect(untouched.scrollTop).toBe(0);
	});

	it("puts back an ancestor scrolled only after the call", () => {
		document.body.innerHTML = '<div id="outer"><p id="view"></p></div>';
		const outer = document.getElementById("outer") as HTMLElement;

		const restore = scrollAncestorsToTop(document.getElementById("view"));
		outer.scrollTop = 250;
		restore();

		expect(outer.scrollTop).toBe(0);
	});

	it("does nothing for no element", () => {
		expect(() => scrollAncestorsToTop(null)()).not.toThrow();
	});
});
