import { describe, expect, it } from "vitest";
import {
	clearEngineGuardrailLockPixel,
	engineGuardrailLocksQuery,
	parseEngineGuardrailLocks,
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

describe("engine guardrail locks", () => {
	it("reads and clears a user's lock by id and login type", () => {
		expect(engineGuardrailLocksQuery("model-1")).toBe(
			'GetEngineGuardrailLocks(engine=["model-1"]);',
		);
		expect(
			clearEngineGuardrailLockPixel("model-1", "alice", "NATIVE"),
		).toBe(
			'ClearEngineGuardrailLock(engine=["model-1"], userId=["alice"], userType=["NATIVE"]);',
		);
	});

	it("keeps each lock that names its user and when it ends", () => {
		expect(
			parseEngineGuardrailLocks([
				{
					userId: "alice",
					userType: "NATIVE",
					name: "Alice",
					email: null,
					limitId: "lock",
					lockedAt: "2026-10-29T11:00:00Z",
					lockedUntil: "2026-10-29T13:00:00Z",
				},
				// no login type, so not a lock this page can unlock
				{ userId: "bob", lockedUntil: "2026-10-29T13:00:00Z" },
			]),
		).toEqual([
			{
				userId: "alice",
				userType: "NATIVE",
				name: "Alice",
				email: null,
				limitId: "lock",
				lockedAt: "2026-10-29T11:00:00Z",
				lockedUntil: "2026-10-29T13:00:00Z",
			},
		]);
		expect(() => parseEngineGuardrailLocks(null)).toThrow(
			"The locked users were not returned",
		);
	});
});
