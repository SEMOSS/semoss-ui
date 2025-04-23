// Simple test to validate that vitest is working
import { describe, it, expect } from "vitest";

describe("vitest setup check", () => {
    it("should run a basic test ---> John - DO WE NEED THIS, WHAT IS THIS FOR", () => {
        //an easy passing test
        expect(1 + 1).toBe(2);
    });
});