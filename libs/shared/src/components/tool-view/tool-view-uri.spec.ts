import { describe, expect, it } from "vitest";
import { isToolViewUri, parseToolViewUri } from "./tool-view-uri";

describe("parseToolViewUri", () => {
	it("reads a flat name and decoded configuration independently of call arguments", () => {
		expect(
			parseToolViewUri(
				"component://mail-compose?intent=reply&provider=google",
			),
		).toEqual({
			componentName: "mail-compose",
			params: { intent: "reply", provider: "google" },
		});
		expect(
			parseToolViewUri(
				"component://email-compose?param1=a%26b%3Dc&empty=&text=Hello+%E2%9C%93&param1=last%20value",
			),
		).toEqual({
			componentName: "email-compose",
			params: { param1: "last value", empty: "", text: "Hello ✓" },
		});
	});
	it("accepts optional parameters and normalizes names, but preserves parameter case", () => {
		expect(
			parseToolViewUri(" COMPONENT://Mail-List?provider=Google "),
		).toEqual({
			componentName: "mail-list",
			params: { provider: "Google" },
		});
		expect(parseToolViewUri("component://calendar-event-edit")).toEqual({
			componentName: "calendar-event-edit",
			params: {},
		});
		expect(parseToolViewUri("component://memory?")).toEqual({
			componentName: "memory",
			params: {},
		});
	});
	it.each([
		undefined,
		null,
		42,
		{},
		[],
		true,
		"",
		"component:/mail-compose",
		"component:mail-compose",
		"system://automation/",
		"/portals/index.html",
		"https://example.test/view",
		"component://",
		"component://mail/compose",
		"component://mail-compose/",
		"component://mail-compose/extra",
		"component://../list",
		"component://mail-compose#fragment",
		"component://mail-compose?intent=send#fragment",
		"component://user@host",
		"component://view:123",
		"component://mail%2Dcompose",
	])("refuses invalid or legacy URI %s", (uri) => {
		expect(parseToolViewUri(uri)).toBeNull();
	});
});
describe("isToolViewUri", () => {
	it.each([
		"component://mail-list",
		" COMPONENT://unknown ",
		"component://mail/list",
		"component://",
		"component:/mail-compose",
		"component:mail-compose",
	])(
		"keeps even unsupported component resources out of frames: %s",
		(uri) => {
			expect(isToolViewUri(uri)).toBe(true);
		},
	);
	it("distinguishes pages", () => {
		expect(isToolViewUri("system://automation/")).toBe(false);
		expect(isToolViewUri(undefined)).toBe(false);
	});
});
