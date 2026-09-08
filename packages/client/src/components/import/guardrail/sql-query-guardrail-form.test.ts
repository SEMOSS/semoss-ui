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
	});
});
