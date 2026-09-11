import { describe, expect, it } from "vitest";
import { GUARDRAIL_CONNECTION } from "./guardrail-import.constants";

describe("guardrail catalog ordering", () => {
	it("keeps guardrails alphabetized by name", () => {
		const names = GUARDRAIL_CONNECTION.GUARDRAIL.map(
			(guardrail) => guardrail.name,
		);
		const alphabetizedNames = [...names].sort((left, right) =>
			left.localeCompare(right, undefined, { sensitivity: "base" }),
		);

		expect(names).toEqual(alphabetizedNames);
	});
});
