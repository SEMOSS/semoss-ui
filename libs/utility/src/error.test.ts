import { describe, expect, it } from "vitest";
import { toError } from "./error";

describe("toError", () => {
	it("preserves Error instances", () => {
		const error = new Error("failed");

		expect(toError(error)).toBe(error);
	});

	it("wraps other values", () => {
		expect(toError("failed")).toEqual(new Error("failed"));
		expect(toError(null)).toEqual(new Error("null"));
	});
});
