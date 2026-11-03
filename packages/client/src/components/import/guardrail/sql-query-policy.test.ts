import { describe, expect, it } from "vitest";
import {
	mergeBuiltInRules,
	policyRulesSchema,
	summarizeRules,
	toBuiltInRules,
	toBuiltInRulesByPolicy,
	toPolicyJson,
	toRemovedBuiltIns,
} from "./sql-query-policy";

describe("SQL query policy rules", () => {
	it("takes rules that each apply to something different", () => {
		expect(
			policyRulesSchema.safeParse([
				{ key: "PG_SLEEP*", requirement: "DENY" },
				{ key: "CURRENT_DATABASE", requirement: "OWNER" },
			]).success,
		).toBe(true);
	});

	it("refuses a rule that applies to nothing", () => {
		const result = policyRulesSchema.safeParse([
			{ key: "  ", requirement: "DENY" },
		]);

		expect(result.success).toBe(false);
		expect(result.error?.issues[0].path).toEqual([0, "key"]);
	});

	it("refuses two rules for the same name, whatever their case", () => {
		const result = policyRulesSchema.safeParse([
			{ key: "pg_sleep", requirement: "DENY" },
			{ key: "PG_SLEEP", requirement: "OWNER" },
		]);

		expect(result.success).toBe(false);
		expect(result.error?.issues[0].path).toEqual([1, "key"]);
	});

	it("writes no rules as an empty object", () => {
		expect(toPolicyJson([])).toBe("{}");
	});
});

describe("SQL query policy built-in rules", () => {
	const builtIns = toBuiltInRules({
		"PG_SLEEP*": "DENY",
		CURRENT_DATABASE: "DENY",
		"PG_CATALOG.*": "OWNER",
	});

	it("marks the guardrail's rules as built in, in its order", () => {
		expect(builtIns).toEqual([
			{ key: "PG_SLEEP*", requirement: "DENY", builtIn: true },
			{ key: "CURRENT_DATABASE", requirement: "DENY", builtIn: true },
			{ key: "PG_CATALOG.*", requirement: "OWNER", builtIn: true },
		]);
		// an access level the form does not know is left out
		expect(toBuiltInRules({ X: "SOMETIMES" })).toEqual([]);
	});

	it("reads each identifier policy's built-in rules, and none for a policy left out", () => {
		expect(
			toBuiltInRulesByPolicy({
				FUNCTION_POLICY: { "PG_SLEEP*": "DENY" },
				OPERATION_POLICY: { "*": "DENY" },
			}),
		).toEqual({
			FUNCTION_POLICY: [
				{ key: "PG_SLEEP*", requirement: "DENY", builtIn: true },
			],
			VARIABLE_POLICY: [],
			KEYWORD_POLICY: [],
			RELATION_POLICY: [],
			ROUTINE_POLICY: [],
		});
	});

	it("writes changed built-in rules, leaves kept ones to the guardrail, and exempts removed ones", () => {
		const json = toPolicyJson(
			[
				{ key: "PG_SLEEP*", requirement: "DENY", builtIn: true },
				// its access changed
				{
					key: "CURRENT_DATABASE",
					requirement: "OWNER",
					builtIn: true,
				},
				// the user's own
				{ key: "MY_FUNCTION", requirement: "EDIT" },
			],
			builtIns,
		);

		// PG_SLEEP* keeps its built-in access, which the guardrail applies itself
		expect(JSON.parse(json)).toEqual({
			CURRENT_DATABASE: "OWNER",
			MY_FUNCTION: "EDIT",
			// removed, so the guardrail does not apply it
			"PG_CATALOG.*": "FOLLOW_ENGINE_PERMISSIONS",
		});
	});

	it("lists the built-in rules a policy does not have, whatever their case", () => {
		expect(
			toRemovedBuiltIns(
				[
					{ key: "pg_sleep*", requirement: "DENY", builtIn: true },
					// the user's own rule covers this built-in name
					{ key: "Current_Database", requirement: "EDIT" },
				],
				builtIns,
			),
		).toEqual([builtIns[2]]);
	});

	it("does not exempt a built-in name the user gave a rule of their own", () => {
		const json = toPolicyJson(
			[{ key: "pg_catalog.*", requirement: "READ_ONLY" }],
			builtIns.slice(2),
		);

		expect(JSON.parse(json)).toEqual({ "pg_catalog.*": "READ_ONLY" });
	});
});

describe("mergeBuiltInRules", () => {
	const postgres = toBuiltInRules({
		"PG_SLEEP*": "DENY",
		CURRENT_DATABASE: "DENY",
	});
	const generic = toBuiltInRules({
		"PG_SLEEP*": "DENY",
		CURRENT_DATABASE: "DENY",
		XP_CMDSHELL: "DENY",
	});

	it("starts an empty list with the built-in rules, then the user's own", () => {
		expect(
			mergeBuiltInRules(
				[{ key: "MY_FUNCTION", requirement: "EDIT" }],
				[],
				postgres,
			),
		).toEqual([...postgres, { key: "MY_FUNCTION", requirement: "EDIT" }]);
	});

	it("keeps the access given to a built-in rule both dialects have", () => {
		const merged = mergeBuiltInRules(
			[
				{ key: "PG_SLEEP*", requirement: "OWNER", builtIn: true },
				{ key: "CURRENT_DATABASE", requirement: "DENY", builtIn: true },
			],
			postgres,
			generic,
		);

		expect(merged).toEqual([
			{ key: "PG_SLEEP*", requirement: "OWNER", builtIn: true },
			{ key: "CURRENT_DATABASE", requirement: "DENY", builtIn: true },
			{ key: "XP_CMDSHELL", requirement: "DENY", builtIn: true },
		]);
	});

	it("keeps a removed built-in rule out, and drops the ones the next dialect has not", () => {
		// CURRENT_DATABASE was removed under PostgreSQL
		const toGeneric = mergeBuiltInRules(
			[{ key: "PG_SLEEP*", requirement: "DENY", builtIn: true }],
			postgres,
			generic,
		);
		expect(toGeneric.map((rule) => rule.key)).toEqual([
			"PG_SLEEP*",
			"XP_CMDSHELL",
		]);

		const toPostgres = mergeBuiltInRules(generic, generic, postgres);
		expect(toPostgres.map((rule) => rule.key)).toEqual([
			"PG_SLEEP*",
			"CURRENT_DATABASE",
		]);
	});

	it("does not add a built-in rule the user already has a rule for", () => {
		expect(
			mergeBuiltInRules(
				[...postgres, { key: "xp_cmdshell", requirement: "OWNER" }],
				postgres,
				generic,
			),
		).toEqual([...postgres, { key: "xp_cmdshell", requirement: "OWNER" }]);
	});
});

describe("summarizeRules", () => {
	it("says a policy has no rules", () => {
		expect(summarizeRules(0, 0)).toBe("No rules");
	});

	it("counts one rule, and more than one", () => {
		expect(summarizeRules(1, 0)).toBe("1 rule");
		expect(summarizeRules(12, 0)).toBe("12 rules");
	});

	it("counts the built-in rules that were removed", () => {
		expect(summarizeRules(10, 2)).toBe("10 rules, 2 built-in removed");
		expect(summarizeRules(0, 3)).toBe("No rules, 3 built-in removed");
	});
});
