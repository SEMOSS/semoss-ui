import { describe, expect, it } from "vitest";
import { buildInitials, metakeyToLabel, slugifyIdentifier } from "./index";

describe("string utilities", () => {
	it("formats labels and identifiers", () => {
		expect(metakeyToLabel("maxOutputTokens")).toBe("Max Output Tokens");
		expect(buildInitials("SEMOSS Analytics")).toBe("SA");
		expect(slugifyIdentifier("Hello, SEMOSS!")).toBe("hello-semoss");
	});
});
