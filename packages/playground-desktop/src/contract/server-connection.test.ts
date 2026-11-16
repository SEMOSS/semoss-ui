// @vitest-environment node
import { describe, expect, test } from "vitest";
import { isModulePath, parseServerConfig } from "./server-connection";

describe("parseServerConfig", () => {
	test("keeps the origin and defaults the module", () => {
		expect(
			parseServerConfig({
				url: " https://semoss.example.com/app/x?y=1 ",
			}),
		).toEqual({ url: "https://semoss.example.com", module: "/Monolith" });
	});

	test("trims a trailing slash from the module", () => {
		expect(
			parseServerConfig({ url: "https://a.example", module: "/Semoss/" }),
		).toEqual({ url: "https://a.example", module: "/Semoss" });
	});

	test("allows http only on this machine", () => {
		expect(parseServerConfig({ url: "http://localhost:9090" }).url).toBe(
			"http://localhost:9090",
		);
		expect(parseServerConfig({ url: "http://127.0.0.1:8080" }).url).toBe(
			"http://127.0.0.1:8080",
		);
		expect(() =>
			parseServerConfig({ url: "http://semoss.example" }),
		).toThrow(/https/);
	});

	test.each([
		[null, /object/],
		[{}, /address/],
		[{ url: "not a url" }, /not a URL/],
		[{ url: "ftp://a.example" }, /https/],
		[{ url: "https://a.example", module: "Monolith" }, /module/],
		[{ url: "https://a.example", module: "/a/../b" }, /module/],
		[{ url: "https://a.example", module: "/a b" }, /module/],
	])("rejects %j", (value, message) => {
		expect(() => parseServerConfig(value)).toThrow(message);
	});
});

describe("isModulePath", () => {
	test.each([
		["/Monolith", true],
		["/Monolith/api/config", true],
		["/Monolith?x=1", true],
		["/MonolithX/api", false],
		["/index.html", false],
		["/", false],
	])("%s -> %s", (path, expected) => {
		expect(isModulePath(path, "/Monolith")).toBe(expected);
	});
});
