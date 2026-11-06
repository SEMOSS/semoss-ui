import { describe, expect, it } from "vitest";
import { copy } from "./index";

describe("copy compatibility export", () => {
	it("deep-copies dates and applies intercepts", () => {
		const original = {
			createdAt: new Date("2026-01-01T00:00:00Z"),
			value: 1,
		};

		const copied = copy(original, (value) => (value === 1 ? 2 : value));

		expect(copied).toEqual({
			createdAt: original.createdAt,
			value: 2,
		});
		expect(copied.createdAt).not.toBe(original.createdAt);
		expect(original.value).toBe(1);
	});
});
