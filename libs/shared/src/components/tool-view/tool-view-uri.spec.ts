import { describe, expect, it } from "vitest";
import { isToolViewUri, parseToolViewUri } from "./tool-view-uri";

describe("parseToolViewUri", () => {
	it("reads the library, the view, and the parameters", () => {
		expect(
			parseToolViewUri(
				"component://mail/compose?intent=reply&provider=google",
			),
		).toEqual({
			library: "mail",
			view: "compose",
			params: { intent: "reply", provider: "google" },
		});
		expect(parseToolViewUri("component://calendar/event-edit")).toEqual({
			library: "calendar",
			view: "event-edit",
			params: {},
		});
	});

	it("reads names in any case, and a trailing slash", () => {
		expect(parseToolViewUri(" component://Mail/List/ ")).toMatchObject({
			library: "mail",
			view: "list",
		});
	});

	it("refuses anything that is not a library and a view", () => {
		for (const uri of [
			undefined,
			"",
			"system://automation/",
			"/portals/index.html",
			"component://mail",
			"component://mail/",
			"component://mail/list/extra",
			"component://../list",
		]) {
			expect(parseToolViewUri(uri)).toBeNull();
		}
	});
});

describe("isToolViewUri", () => {
	it("tells a component view from a page", () => {
		expect(isToolViewUri("component://mail/list")).toBe(true);
		expect(isToolViewUri("COMPONENT://unknown")).toBe(true);
		expect(isToolViewUri("system://automation/")).toBe(false);
		expect(isToolViewUri(undefined)).toBe(false);
	});
});
