// Simple test to validate that vitest is working
import { describe, expect, it } from "vitest";

describe("vitest setup check", () => {
	it("should run a basic test", () => {
		//an easy passing test
		expect(1 + 1).toBe(2);
	});
});
