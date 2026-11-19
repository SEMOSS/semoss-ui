// @vitest-environment node
import { describe, expect, test } from "vitest";
import {
	formatServerAddress,
	isModulePath,
	isPlainPath,
	isPlatformPath,
	parseServerAddress,
	parseServerConfig,
	platformPathFor,
} from "./server-connection";

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

describe("parseServerAddress", () => {
	test("splits one address into its origin and module", () => {
		expect(
			parseServerAddress(
				"https://workshop.cfg.deloitte.com/cfg-ai-dev/Monolith/",
			),
		).toEqual({
			url: "https://workshop.cfg.deloitte.com",
			module: "/cfg-ai-dev/Monolith",
		});
	});

	test("defaults the module, and drops a query or fragment", () => {
		expect(parseServerAddress("https://semoss.example.com")).toEqual({
			url: "https://semoss.example.com",
			module: "/Monolith",
		});
		expect(
			parseServerAddress("https://semoss.example.com/Monolith?x=1#top"),
		).toEqual({ url: "https://semoss.example.com", module: "/Monolith" });
	});

	test("refuses what the config refuses", () => {
		expect(() => parseServerAddress("")).toThrow("address");
		expect(() => parseServerAddress("http://semoss.example.com")).toThrow(
			"https",
		);
	});

	test("formats back to the same address", () => {
		const server = parseServerAddress(
			"https://workshop.cfg.deloitte.com/cfg-ai-dev/Monolith",
		);
		expect(formatServerAddress(server)).toBe(
			"https://workshop.cfg.deloitte.com/cfg-ai-dev/Monolith",
		);
	});
});

describe("platformPathFor", () => {
	test("finds the platform beside the module", () => {
		expect(platformPathFor("/Monolith")).toBe(
			"/SemossWeb/packages/client/dist",
		);
		expect(platformPathFor("/cfg-ai-dev/Monolith")).toBe(
			"/cfg-ai-dev/SemossWeb/packages/client/dist",
		);
	});

	test("matches only the platform's own paths", () => {
		expect(
			isPlatformPath(
				"/SemossWeb/packages/client/dist/index.html",
				"/Monolith",
			),
		).toBe(true);
		expect(isPlatformPath("/SemossWeb/packages/other", "/Monolith")).toBe(
			false,
		);
		expect(isPlatformPath("/Monolith/api", "/Monolith")).toBe(false);
	});
});

describe("isPlainPath", () => {
	test.each([
		["/Monolith/api/config?x=../y;z", true],
		["/Monolith/public_home/app/portals/my%20file.html", true],
		["/Monolith/v1.2/file.js", true],
		["/Monolith/../manager", false],
		["/Monolith/./api", false],
		["/Monolith/..;/manager", false],
		["/Monolith/%2e%2e/manager", false],
		["/Monolith/%2E%2E/manager", false],
		["/Monolith/a%2fb", false],
		["/Monolith/a%5cb", false],
		["/Monolith\\..\\manager", false],
	])("%s -> %s", (path, expected) => {
		expect(isPlainPath(path)).toBe(expected);
	});
});
