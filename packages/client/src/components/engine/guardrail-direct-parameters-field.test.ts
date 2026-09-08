import { describe, expect, test } from "vitest";
import { guardrailParameterTypeForForm } from "./guardrail-engine-parameters";

describe("guardrail direct parameter types", () => {
	test.each([
		["String", "string"],
		["Double", "number"],
		["Integer", "number"],
		["Boolean", "boolean"],
		["List<String>", "string-array"],
		["List<Double>", "number-array"],
		["Boolean[]", "boolean-array"],
		["List<Object>", "json"],
		["List<Map<String, Object>>", "json"],
		["Map<String, Object>", "json"],
	])("maps %s to %s", (engineType, formType) => {
		expect(guardrailParameterTypeForForm(engineType)).toBe(formType);
	});
});
