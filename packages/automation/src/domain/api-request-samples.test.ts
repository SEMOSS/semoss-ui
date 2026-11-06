import { describe, expect, it } from "vitest";
import { buildSampleScope, referencedPaths } from "./api-request-samples";
import type { ApiRequestConfig } from "./automation.types";

const base: ApiRequestConfig = {
	method: "GET",
	url: "",
	connectionId: "",
	query: "",
	headers: "",
	bodyType: "none",
	body: "",
	timeoutSeconds: "30",
};

describe("referencedPaths", () => {
	it("finds each reference once across every field", () => {
		expect(
			referencedPaths({
				...base,
				url: "https://a.test/${item.id}",
				headers: '{"Authorization":"Bearer ${token}"}',
				query: '{"id":"${item.id}"}',
				body: "${payload}",
			}),
		).toEqual(["item.id", "token", "payload"]);
	});

	it("returns nothing when there are no references", () => {
		expect(referencedPaths({ ...base, url: "https://a.test" })).toEqual([]);
	});
});

describe("buildSampleScope", () => {
	it("nests dotted paths and types obvious values", () => {
		expect(
			buildSampleScope({ "item.id": "7", token: "abc", flag: "true" }),
		).toEqual({ item: { id: 7 }, token: "abc", flag: true });
	});

	it("keeps quoted numbers as text", () => {
		expect(buildSampleScope({ code: '"007"' })).toEqual({ code: '"007"' });
	});
});
