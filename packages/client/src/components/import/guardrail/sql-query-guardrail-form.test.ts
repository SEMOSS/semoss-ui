import { describe, expect, it } from "vitest";
import {
	SQL_QUERY_GUARDRAIL_DEFAULTS,
	toSqlQueryGuardrailDetails,
} from "./sql-query-guardrail-form";

const SQL_QUERY_SMSS_KEYS = [
	"CARTESIAN_JOIN_POLICY",
	"DELETE_WITHOUT_WHERE_POLICY",
	"FUNCTION_POLICY",
	"GUARDRAIL_TYPE",
	"JOIN_LIMIT_POLICY",
	"KEYWORD_POLICY",
	"MAX_JOINS",
	"MAX_QUERY_LENGTH",
	"MULTI_STATEMENT_POLICY",
	"OPERATION_POLICY",
	"PARSER_FAILURE_POLICY",
	"PROTECT_UNMATCHED_IDENTIFIERS",
	"RECURSIVE_CTE_POLICY",
	"RELATION_POLICY",
	"ROUTINE_POLICY",
	"SELECT_STAR_POLICY",
	"SQL_DIALECT",
	"SQUARE_BRACKET_QUOTATION",
	"UPDATE_WITHOUT_WHERE_POLICY",
	"VARIABLE_POLICY",
];

describe("SQL query guardrail SMSS configuration", () => {
	it("writes every supported option as an SMSS string", () => {
		const details = toSqlQueryGuardrailDetails({
			...SQL_QUERY_GUARDRAIL_DEFAULTS,
			MODEL_NAME: "Database policy",
		});

		expect(Object.keys(details).sort()).toEqual(SQL_QUERY_SMSS_KEYS);
		expect(
			Object.values(details).every((value) => typeof value === "string"),
		).toBe(true);
		expect(details).toMatchObject({
			GUARDRAIL_TYPE: "EMBEDDED_SQL_QUERY",
			SQL_DIALECT: "GENERIC",
			PARSER_FAILURE_POLICY: "DENY",
		});
		expect(details).not.toHaveProperty("MODEL_NAME");
		// a policy with no rules is an empty JSON object
		expect(details.OPERATION_POLICY).toBe("{}");
	});

	it("writes each policy's rules as the JSON object the guardrail reads", () => {
		const details = toSqlQueryGuardrailDetails({
			...SQL_QUERY_GUARDRAIL_DEFAULTS,
			MODEL_NAME: "Database policy",
			OPERATION_POLICY: [
				{ key: "SELECT", requirement: "FOLLOW_ENGINE_PERMISSIONS" },
				{ key: "*", requirement: "DENY" },
			],
			RELATION_POLICY: [{ key: " pg_catalog.* ", requirement: "OWNER" }],
		});

		expect(JSON.parse(details.OPERATION_POLICY)).toEqual({
			SELECT: "FOLLOW_ENGINE_PERMISSIONS",
			"*": "DENY",
		});
		// names go as entered, trimmed; the guardrail reads them without regard to case
		expect(JSON.parse(details.RELATION_POLICY)).toEqual({
			"pg_catalog.*": "OWNER",
		});
	});

	it("keeps the built-in rules on, writes the changed ones and exempts the removed ones", () => {
		const details = toSqlQueryGuardrailDetails(
			{
				...SQL_QUERY_GUARDRAIL_DEFAULTS,
				MODEL_NAME: "Database policy",
				FUNCTION_POLICY: [
					{ key: "PG_SLEEP*", requirement: "DENY", builtIn: true },
					{
						key: "CURRENT_USER",
						requirement: "OWNER",
						builtIn: true,
					},
				],
			},
			{
				FUNCTION_POLICY: [
					{ key: "PG_SLEEP*", requirement: "DENY", builtIn: true },
					{ key: "CURRENT_USER", requirement: "DENY", builtIn: true },
					{ key: "VERSION", requirement: "DENY", builtIn: true },
				],
			},
		);

		expect(details.PROTECT_UNMATCHED_IDENTIFIERS).toBe("true");
		// PG_SLEEP* is left to the guardrail's own built-in rule
		expect(JSON.parse(details.FUNCTION_POLICY)).toEqual({
			CURRENT_USER: "OWNER",
			VERSION: "FOLLOW_ENGINE_PERMISSIONS",
		});
	});
});
