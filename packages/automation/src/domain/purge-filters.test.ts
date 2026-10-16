import { describe, expect, it } from "vitest";
import {
	getPurgeValueSamples,
	inferPurgeDraftInput,
	parsePurgeFilters,
	purgeFilterDrafts,
	serializePurgeFilters,
} from "./purge-filters";

describe("Purge builder and JSON conversion", () => {
	it("infers manual types from metadata while preserving identifiers and variables", () => {
		expect(inferPurgeDraftInput("12", "INT")).toEqual({
			valueType: "number",
			value: "12",
		});
		expect(inferPurgeDraftInput("001", "STRING", "number")).toEqual({
			valueType: "string",
			value: "001",
		});
		expect(inferPurgeDraftInput("001")).toEqual({
			valueType: "string",
			value: "001",
		});
		expect(inferPurgeDraftInput("TRUE", "BOOLEAN")).toEqual({
			valueType: "boolean",
			value: "true",
		});
		expect(inferPurgeDraftInput(`\${selected_id}`, "INT")).toEqual({
			valueType: "string",
			value: `\${selected_id}`,
		});
		expect(inferPurgeDraftInput("2", "UNKNOWN", "number")).toEqual({
			valueType: "number",
			value: "2",
		});
	});

	it("retains a homogeneous list's entry type when no column schema is available", () => {
		const numeric = purgeFilterDrafts(
			'[{"column":"ID","operator":"==","value":[1,2,null]}]',
		)[0];
		expect(numeric).toMatchObject({ valueType: "number", value: "" });
		const mixed = purgeFilterDrafts(
			'[{"column":"ID","operator":"==","value":[1,"001"]}]',
		)[0];
		expect(mixed).toMatchObject({ valueType: "string", value: "" });
	});
	it("derives bounded typed value suggestions from the selected sample column", () => {
		const samples = getPurgeValueSamples(
			"VALUE",
			["VALUE"],
			[[1], ["1"], [1], [false], [null], [""], [{}]],
		);
		expect(
			samples.map(({ valueType, value }) => [valueType, value]),
		).toEqual([
			["number", "1"],
			["string", "1"],
			["boolean", "false"],
			["null", ""],
			["string", ""],
		]);
		expect(getPurgeValueSamples("MISSING", ["VALUE"], [[1]])).toEqual([]);
		expect(
			getPurgeValueSamples(
				"VALUE",
				["VALUE"],
				Array.from({ length: 100 }, (_, index) => [index]),
			),
		).toHaveLength(25);
	});
	it("preserves text, numbers, booleans, null, order, and scope references", () => {
		const filters = [
			{ column: "STATUS", operator: "==", value: "inactive" },
			{ column: "AGE", operator: ">=", value: 18 },
			{ column: "ENABLED", operator: "==", value: false },
			{ column: "EMAIL", operator: "==", value: null },
			{ column: "ID", operator: "!=", value: `\${selected_id}` },
		];
		const json = JSON.stringify(filters);
		expect(
			JSON.parse(serializePurgeFilters(purgeFilterDrafts(json)).json),
		).toEqual(filters);
	});
	it.each([
		"{",
		"{}",
		'[{"column":"ID","operator":"execute","value":1}]',
		'[{"column":"ID","operator":"=="}]',
		'[{"column":"ID","operator":">","value":[1]}]',
		'[{"column":"ID","operator":"==","value":[]}]',
		'[{"column":"ID","operator":"==","value":[[1]]}]',
		'[{"column":"ID","operator":"==","value":1e999}]',
		'[{"column":"ID","operator":">","value":null}]',
		'[{"column":"ID","operator":"==","value":1,"extra":true}]',
	])("rejects JSON the builder cannot safely represent: %s", (json) => {
		expect(parsePurgeFilters(json).error).toBeTruthy();
	});
	it("keeps empty arrays representable and rejects incomplete numeric input", () => {
		expect(parsePurgeFilters("[]").filters).toEqual([]);
		const drafts = purgeFilterDrafts(
			'[{"column":"AGE","operator":">","value":1}]',
		);
		for (const value of ["", "-", "NaN", "Infinity"]) {
			expect(
				serializePurgeFilters(
					drafts.map((draft) => ({ ...draft, value })),
				).error,
			).toBeTruthy();
		}
	});

	it.each(["==", "!="])(
		"round trips typed multi-value comparisons for %s",
		(operator) => {
			const filters = [
				{
					column: "ID",
					operator,
					value: [1, "1", false, null, `\${selected_id}`],
				},
			];
			expect(
				JSON.parse(
					serializePurgeFilters(
						purgeFilterDrafts(JSON.stringify(filters)),
					).json,
				),
			).toEqual(filters);
		},
	);

	it("rejects oversized and empty value lists without affecting scalar filters", () => {
		expect(
			parsePurgeFilters(
				JSON.stringify([
					{ column: "ID", operator: "==", value: Array(101).fill(1) },
				]),
			).error,
		).toBeTruthy();
		const draft = purgeFilterDrafts(
			'[{"column":"ID","operator":"==","value":1}]',
		)[0];
		expect(draft).toBeDefined();
		if (!draft) return;
		expect(
			serializePurgeFilters([{ ...draft, values: [] }]).error,
		).toBeTruthy();
		expect(JSON.parse(serializePurgeFilters([draft]).json)[0].value).toBe(
			1,
		);
	});
});
