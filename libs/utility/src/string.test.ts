import { describe, expect, it } from "vitest";
import {
	asString,
	buildInitials,
	metakeyToLabel,
	slugifyIdentifier,
} from "./string";

describe("string utilities", () => {
	it("formats labels and identifiers", () => {
		expect(metakeyToLabel("maxOutputTokens")).toBe("Max Output Tokens");
		expect(buildInitials("SEMOSS Analytics")).toBe("SA");
		expect(slugifyIdentifier("Hello, SEMOSS!")).toBe("hello-semoss");
	});

	it("supports capped and first/last initials", () => {
		expect(buildInitials("Jane Mary Smith", 2, true)).toBe("JS");
		expect(buildInitials("One Two Three Four", 3)).toBe("OTT");
		expect(buildInitials("Jane-Mary Smith", 2, false, true)).toBe("JM");
		expect(buildInitials("Jane-Mary Smith", 2, false, false)).toBe("JS");
	});

	it("returns only string values", () => {
		expect(asString("SEMOSS")).toBe("SEMOSS");
		expect(asString(42)).toBe("");
		expect(asString(null)).toBe("");
	});
});
