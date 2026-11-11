import { describe, expect, it } from "vitest";
import { parseCurlCommand, tokenizeCommand } from "./curl-import";

describe("tokenizeCommand", () => {
	it("keeps quoted words together and joins line continuations", () => {
		expect(
			tokenizeCommand(
				`curl -H 'Accept: application/json' \\\n  "https://a.test/x y"`,
			),
		).toEqual([
			"curl",
			"-H",
			"Accept: application/json",
			"https://a.test/x y",
		]);
	});

	it("rejects an unclosed quote", () => {
		expect(() => tokenizeCommand(`curl 'oops`)).toThrow(/unclosed/);
	});
});

describe("parseCurlCommand", () => {
	it("reads a plain GET", () => {
		const result = parseCurlCommand("curl https://api.test/items?limit=2");
		expect(result.method).toBe("GET");
		expect(result.url).toBe("https://api.test/items?limit=2");
		expect(result.bodyType).toBe("none");
	});

	it("reads a JSON POST and defaults the method from the body", () => {
		const result = parseCurlCommand(
			`curl https://api.test/items -H 'Content-Type: application/json' -d '{"a":1}'`,
		);
		expect(result.method).toBe("POST");
		expect(result.bodyType).toBe("json");
		expect(result.body).toBe('{"a":1}');
	});

	it("honours an explicit method", () => {
		const result = parseCurlCommand(
			`curl -X PATCH https://api.test/items/1 -d '{"a":2}'`,
		);
		expect(result.method).toBe("PATCH");
		expect(result.bodyType).toBe("json");
	});

	it("turns a form body into fields", () => {
		const result = parseCurlCommand(
			`curl https://api.test/login -d 'name=Ada+L&role=admin'`,
		);
		expect(result.bodyType).toBe("form");
		expect(JSON.parse(result.body)).toEqual({
			name: "Ada L",
			role: "admin",
		});
	});

	it("replaces credential headers with a reference and warns", () => {
		const result = parseCurlCommand(
			`curl https://api.test/me -H 'Authorization: Bearer abc123'`,
		);
		expect(result.headers.Authorization).toBe("Bearer ${authorization}");
		expect(JSON.stringify(result)).not.toContain("abc123");
		expect(result.warnings).toHaveLength(1);
	});

	it("never keeps basic-auth credentials", () => {
		const result = parseCurlCommand(
			`curl -u admin:hunter2 https://api.test/me`,
		);
		expect(JSON.stringify(result)).not.toContain("hunter2");
		expect(result.headers.Authorization).toBe("Basic ${basic_auth}");
	});

	it("moves -G data into the query string", () => {
		const result = parseCurlCommand(
			`curl -G https://api.test/search -d q=cats`,
		);
		expect(result.method).toBe("GET");
		expect(result.url).toBe("https://api.test/search?q=cats");
		expect(result.bodyType).toBe("none");
	});

	it("drops a body on GET with a warning", () => {
		const result = parseCurlCommand(
			`curl -X GET https://api.test/x -d '{"a":1}'`,
		);
		expect(result.bodyType).toBe("none");
		expect(result.warnings.join(" ")).toMatch(/cannot send a body/);
	});

	it("requires curl and a URL", () => {
		expect(() => parseCurlCommand("wget https://a.test")).toThrow(/curl/);
		expect(() => parseCurlCommand("curl -X POST")).toThrow(/no URL/);
	});
});
