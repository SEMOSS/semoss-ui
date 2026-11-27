// biome-ignore-all lint/suspicious/noTemplateCurlyInString: variable references are literal `${name}` strings
import { describe, expect, it } from "vitest";
import type {
	AutomationNodeResult,
	AutomationRunDetail,
} from "../../../domain/automation.types";
import {
	activeVariableConditions,
	collectVariableNames,
	runMatchesVariableConditions,
} from "./run-variable-search";

function step(
	scope: Record<string, unknown>,
	overrides: Partial<AutomationNodeResult> = {},
): AutomationNodeResult {
	return {
		NODE_ID: "node-1",
		NODE_LABEL: "Node 1",
		STATUS: "SUCCESS",
		DURATION_MS: 5,
		OUTPUT_PREVIEW: null,
		ERROR_MESSAGE: null,
		scopeSnapshot: JSON.stringify(scope),
		...overrides,
	};
}

function runWith(nodeResults: AutomationNodeResult[]): AutomationRunDetail {
	return {
		RUN_ID: "run-1",
		PROJECT_ID: "project-1",
		STARTED_AT: "2026-11-05T00:00:00Z",
		COMPLETED_AT: "2026-11-05T00:00:10Z",
		STATUS: "SUCCESS",
		TRIGGER_TYPE: "MANUAL",
		nodeResults,
	};
}

const condition = (name: string, value: string) => ({
	id: `${name}-${value}`,
	name,
	value,
});

describe("runMatchesVariableConditions", () => {
	it("matches a value that contains the text, ignoring case", () => {
		const detail = runWith([step({ customer: "Acme Corp" })]);
		expect(
			runMatchesVariableConditions(detail, [
				condition("${customer}", "acme"),
			]),
		).toBe(true);
		expect(
			runMatchesVariableConditions(detail, [
				condition("${customer}", "globex"),
			]),
		).toBe(false);
	});

	it("only looks at the chosen variable", () => {
		const detail = runWith([step({ customer: "Acme", region: "East" })]);
		expect(
			runMatchesVariableConditions(detail, [
				condition("${region}", "acme"),
			]),
		).toBe(false);
	});

	it("needs every condition met, in any step of the run", () => {
		const detail = runWith([
			step({ customer: "Acme" }),
			step({ customer: "Acme", status: "shipped" }),
		]);
		const both = [
			condition("${customer}", "acme"),
			condition("${status}", "ship"),
		];
		expect(runMatchesVariableConditions(detail, both)).toBe(true);
		expect(
			runMatchesVariableConditions(detail, [
				...both,
				condition("${region}", "east"),
			]),
		).toBe(false);
	});

	it("treats a blank value as 'the variable exists'", () => {
		const detail = runWith([step({ customer: "Acme" })]);
		expect(
			runMatchesVariableConditions(detail, [
				condition("${customer}", ""),
			]),
		).toBe(true);
		expect(
			runMatchesVariableConditions(detail, [condition("${other}", "")]),
		).toBe(false);
	});

	it("searches steps inside loop iterations and loop item fields", () => {
		const loopScope = {
			item_loop: {
				index: 2,
				number: 3,
				isFirst: false,
				item: "order-77",
			},
		};
		const detail = runWith([
			step(
				{},
				{
					iterations: [{ index: 2, nodeResults: [step(loopScope)] }],
				},
			),
		]);
		expect(
			runMatchesVariableConditions(detail, [
				condition("${item_loop.item}", "77"),
			]),
		).toBe(true);
	});

	it("searches every variable when none is picked", () => {
		const detail = runWith([step({ customer: "Acme", region: "East" })]);
		expect(
			runMatchesVariableConditions(detail, [condition("", "east")]),
		).toBe(true);
		expect(
			runMatchesVariableConditions(detail, [condition("", "west")]),
		).toBe(false);
	});

	it("matches everything when there are no conditions", () => {
		expect(runMatchesVariableConditions(runWith([]), [])).toBe(true);
	});
});

describe("collectVariableNames", () => {
	it("lists each variable once, sorted, across runs and loop steps", () => {
		const first = runWith([step({ zeta: "1", alpha: "2" })]);
		const second = runWith([
			step(
				{ alpha: "3" },
				{
					iterations: [
						{ index: 0, nodeResults: [step({ beta: "4" })] },
					],
				},
			),
		]);
		expect(collectVariableNames([first, second])).toEqual([
			"${alpha}",
			"${beta}",
			"${zeta}",
		]);
	});
});

describe("activeVariableConditions", () => {
	it("drops only rows with no variable and no value", () => {
		const picked = condition("${a}", "x");
		const anyVariable = condition("", "typed");
		expect(
			activeVariableConditions([
				condition("", ""),
				condition("", "  "),
				anyVariable,
				picked,
			]),
		).toEqual([anyVariable, picked]);
	});
});
