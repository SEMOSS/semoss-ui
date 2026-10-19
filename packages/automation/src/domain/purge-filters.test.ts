import { describe, expect, it } from "vitest";
import {
	inferPurgeDraftInput,
	parsePurgeFilters,
	purgeFilterDrafts,
	serializePurgeFilters,
} from "./purge-filters";

describe("Purge builder and JSON conversion", () => {
	it("infers manual types while preserving identifiers and variables", () => {
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
	});

	it("round trips supported scalar values without changing order or type", () => {
		const filters = [
			{ column: "STATUS", operator: "==", value: "inactive" },
			{ column: "AGE", operator: ">=", value: 18 },
			{ column: "ENABLED", operator: "==", value: false },
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
		'[{"column":"ID","operator":"==","value":[1]}]',
		'[{"column":"ID","operator":"==","value":null}]',
		'[{"column":"ID","operator":"==","value":1e999}]',
		'[{"column":"ID","operator":"==","value":1,"extra":true}]',
	])("rejects unsupported JSON: %s", (json) => {
		expect(parsePurgeFilters(json).error).toBeTruthy();
	});

	it("keeps an empty filter array and rejects incomplete numbers", () => {
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

	it("rejects more than 100 filters", () => {
		const filters = Array.from({ length: 101 }, (_, index) => ({
			column: `VALUE_${index}`,
			operator: "==",
			value: index,
		}));
		expect(parsePurgeFilters(JSON.stringify(filters)).error).toBeTruthy();
	});
});
