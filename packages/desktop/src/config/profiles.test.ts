import { describe, expect, it } from "vitest";
import { moduleUrlFor, platformUrlFor, playgroundUrlFor } from "./profiles";

const profile = {
	id: "workshop",
	displayName: "Workshop",
	endpoint: "https://example.com",
	module: "/environment/Monolith/",
	platformPath: "/environment/SemossWeb/packages/client/dist",
	allowInsecureHttp: false,
};

describe("desktop instance profiles", () => {
	it("builds the Monolith module URL without a trailing slash", () => {
		expect(moduleUrlFor(profile)).toBe(
			"https://example.com/environment/Monolith",
		);
	});

	it("builds a browser fallback URL with a normalized hash route", () => {
		expect(platformUrlFor(profile, "model")).toBe(
			"https://example.com/environment/SemossWeb/packages/client/dist/#/model",
		);
	});

	it("builds the matching Playground package URL", () => {
		expect(playgroundUrlFor(profile)).toBe(
			"https://example.com/environment/SemossWeb/packages/playground/dist/",
		);
	});
});
