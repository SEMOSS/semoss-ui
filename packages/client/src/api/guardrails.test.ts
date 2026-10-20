import { describe, expect, it } from "vitest";
import {
	parseSqlQueryPolicyDefaults,
	sqlQueryPolicyDefaultsQuery,
} from "./guardrails";

describe("SQL query policy defaults", () => {
	it("reads a dialect's built-in rules with its name quoted", () => {
		expect(sqlQueryPolicyDefaultsQuery("POSTGRESQL")).toBe(
			'GetSqlQueryPolicyDefaults(dialect=["POSTGRESQL"]);',
		);
		expect(sqlQueryPolicyDefaultsQuery('A"B')).toBe(
			'GetSqlQueryPolicyDefaults(dialect=["A\\"B"]);',
		);
	});

	it("keeps each policy's rules whose access is text", () => {
		expect(
			parseSqlQueryPolicyDefaults({
				FUNCTION_POLICY: {
					"PG_SLEEP*": "DENY",
					BROKEN: 3,
				},
				RELATION_POLICY: { "PG_CATALOG.*": "OWNER" },
				// not an object of rules, so left out
				VARIABLE_POLICY: "DENY",
			}),
		).toEqual({
			FUNCTION_POLICY: { "PG_SLEEP*": "DENY" },
			RELATION_POLICY: { "PG_CATALOG.*": "OWNER" },
		});
	});

	it("refuses output that is not an object of policies", () => {
		for (const output of [null, "DENY", ["FUNCTION_POLICY"]]) {
			expect(() => parseSqlQueryPolicyDefaults(output)).toThrow(
				"The built-in SQL query policy rules were not returned",
			);
		}
	});
});
