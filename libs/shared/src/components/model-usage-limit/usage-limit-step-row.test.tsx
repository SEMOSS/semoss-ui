import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { UsageLimitPathStep, UsageLimitRuleUsage } from "@semoss/sdk";
import { UsageLimitStepRow } from "./usage-limit-step-row";

/** A rule with some of it used */
const rule = (
	overrides: Partial<UsageLimitRuleUsage> = {},
): UsageLimitRuleUsage => ({
	metric: "TOKENS",
	amount: 1000,
	window: "DAY",
	counts: "EACH_PERSON",
	used: 100,
	resetsAt: null,
	...overrides,
});

/** A step of the path, billed here unless told otherwise */
const step = (overrides: Partial<UsageLimitPathStep>): UsageLimitPathStep => ({
	layer: "BILLED",
	limitType: "DIRECT",
	id: null,
	type: null,
	state: "BILLED",
	reason: null,
	accessSince: null,
	unlimited: false,
	rules: [],
	teamTotal: null,
	...overrides,
});

/** Renders the step in the list the path view puts it in */
const renderStep = (value: UsageLimitPathStep) =>
	render(
		<ol>
			<UsageLimitStepRow step={value} />
		</ol>,
	);

describe("UsageLimitStepRow", () => {
	afterEach(() => {
		cleanup();
	});

	it("says every rule applies and puts and between the rules", () => {
		renderStep(
			step({
				rules: [rule(), rule({ window: "MONTH", amount: 20000 })],
			}),
		);

		expect(screen.getByText("Every rule applies.")).toBeTruthy();
		expect(screen.getAllByText("and")).toHaveLength(1);
	});

	it("says nothing more for a single rule", () => {
		renderStep(step({ rules: [rule()] }));

		expect(screen.queryByText("Every rule applies.")).toBeNull();
		expect(screen.queryByText("and")).toBeNull();
	});

	it("says only admins see the rules the backend hides", () => {
		renderStep(step({ limitType: "ALL_MODELS", rulesHidden: true }));

		expect(
			screen.getByText("Only admins can see this limit's rules"),
		).toBeTruthy();
		expect(screen.queryByText("No Limit Defined")).toBeNull();
	});
});
