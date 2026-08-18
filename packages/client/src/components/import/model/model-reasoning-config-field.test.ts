import { describe, expect, it } from "vitest";
import { hasConfigurableReasoning } from "./model-reasoning-config-field";

describe("hasConfigurableReasoning", () => {
	it("shows the editor when the catalog names supported efforts", () => {
		expect(
			hasConfigurableReasoning({
				supported_efforts: ["low", "high"],
				default_effort: null,
				mandatory: null,
			}),
		).toBe(true);
	});

	it("shows the editor when only a default effort is named", () => {
		expect(
			hasConfigurableReasoning({
				supported_efforts: null,
				default_effort: "high",
				mandatory: null,
			}),
		).toBe(true);
	});

	it("shows the editor when reasoning is mandatory", () => {
		expect(
			hasConfigurableReasoning({
				supported_efforts: null,
				default_effort: null,
				mandatory: true,
			}),
		).toBe(true);
	});

	it("keeps an all-nulls config hidden - most catalog entries", () => {
		expect(
			hasConfigurableReasoning({
				supported_efforts: null,
				default_effort: null,
				mandatory: null,
			}),
		).toBe(false);
	});

	it("ignores a blank default effort and an explicit mandatory false", () => {
		expect(
			hasConfigurableReasoning({
				supported_efforts: [],
				default_effort: "   ",
				mandatory: false,
			}),
		).toBe(false);
	});

	it("stays hidden when there is no config at all", () => {
		expect(hasConfigurableReasoning(null)).toBe(false);
	});

	it("does not care about ride-along provider keys", () => {
		expect(
			hasConfigurableReasoning({
				supported_efforts: null,
				default_effort: null,
				mandatory: null,
				supports_max_tokens: true,
				default_enabled: false,
			}),
		).toBe(false);
	});
});
