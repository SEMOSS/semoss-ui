import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ModelUsageLimit } from "@semoss/sdk";
import {
	ModelUsageLimitEditor,
	type ModelUsageLimitEditorHandle,
} from "./model-usage-limit-editor";

const mocks = vi.hoisted(() => {
	// the English strings the editor's assertions read
	const messages: Record<string, string> = {
		"usageLimit.modes.rules": "Rules",
		"usageLimit.addRule": "Add Rule",
		"usageLimit.noRules":
			"Add a rule to cap use. A call must pass every rule.",
		"usageLimit.rule.amount": "Amount of rule {{number}}",
		"usageLimit.rule.windowLength": "Window length of rule {{number}}",
		"usageLimit.rule.window": "How often rule {{number}} starts again",
		"usageLimit.rule.metric": "What rule {{number}} counts",
		"usageLimit.rule.counts": "Whose use rule {{number}} counts",
		"usageLimit.metrics.TOKENS": "Tokens",
		"usageLimit.metrics.COMPUTE_TIME": "Compute Time",
		"usageLimit.counts.teamShared": "Shared",
		"usageLimit.counts.teamEach": "For Each Member",
		"usageLimit.rule.remove": "Remove rule {{number}}",
		"usageLimit.rule.windowUnits.MINUTE_one": "Minute",
		"usageLimit.rule.windowUnits.MINUTE_other": "Minutes",
		"usageLimit.windows.MINUTE": "Per Minute",
		"usageLimit.windows.DAY": "Per Day",
	};
	return {
		translate: (key: string, options: Record<string, unknown> = {}) => {
			// a count picks the plural form, as it does in English
			const plural =
				typeof options.count === "number"
					? `${key}_${options.count === 1 ? "one" : "other"}`
					: null;
			const message =
				(plural ? messages[plural] : undefined) ?? messages[key] ?? key;
			return message.replace(
				/\{\{(\w+)\}\}/g,
				(_match: string, name: string) => String(options[name] ?? ""),
			);
		},
	};
});

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({ t: mocks.translate, i18n: { language: "en" } }),
}));

const AMOUNT_PROBLEM = "Enter an amount above 0";
const LENGTH_PROBLEM = "Enter a length from 1 to 59 minutes";
const NO_RULES = "Add a rule to cap use. A call must pass every rule.";

/**
 * Renders the editor for one person on a model, as a host does before any
 * save attempt
 */
const renderEditor = (defaultValue: ModelUsageLimit | null = null) => {
	const ref = createRef<ModelUsageLimitEditorHandle>();
	const view = render(
		<ModelUsageLimitEditor
			ref={ref}
			defaultValue={defaultValue}
			source="DIRECT"
		/>,
	);
	/** Shows the problems and asks for focus, as a host does on a stopped save */
	const showProblems = () => {
		view.rerender(
			<ModelUsageLimitEditor
				ref={ref}
				defaultValue={defaultValue}
				source="DIRECT"
				shouldShowProblems
			/>,
		);
		act(() => ref.current?.focusFirstProblem());
	};
	return { showProblems };
};

const getAmount = () =>
	screen.getByRole("textbox", { name: "Amount of rule 1" });

describe("ModelUsageLimitEditor problems", () => {
	beforeEach(() => {
		Element.prototype.scrollIntoView = vi.fn();
		vi.stubGlobal(
			"ResizeObserver",
			class {
				observe() {}
				unobserve() {}
				disconnect() {}
			},
		);
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	it("does not mark a rule just added until the host shows the problems, then follows the edits", () => {
		const { showProblems } = renderEditor();
		fireEvent.click(screen.getByRole("radio", { name: "Rules" }));

		const amount = getAmount();
		expect(amount.getAttribute("aria-invalid")).toBe("false");
		expect(amount.hasAttribute("aria-describedby")).toBe(false);
		expect(screen.queryByText(AMOUNT_PROBLEM)).toBeNull();

		showProblems();

		const problem = screen.getByText(AMOUNT_PROBLEM);
		expect(amount.getAttribute("aria-invalid")).toBe("true");
		expect(amount.getAttribute("aria-describedby")).toBe(problem.id);
		expect(document.activeElement).toBe(amount);

		fireEvent.change(amount, { target: { value: "5000" } });

		expect(amount.getAttribute("aria-invalid")).toBe("false");
		expect(screen.queryByText(AMOUNT_PROBLEM)).toBeNull();
	});

	it("marks a window length out of range only once the host shows the problems", () => {
		const { showProblems } = renderEditor({
			unlimited: false,
			rules: [
				{
					metric: "TOKENS",
					amount: 1000,
					window: "MINUTE",
					windowLength: 60,
					counts: "EACH_PERSON",
				},
			],
		});

		const length = screen.getByRole("textbox", {
			name: "Window length of rule 1",
		});
		expect(length.getAttribute("aria-invalid")).toBe("false");
		expect(screen.queryByText(LENGTH_PROBLEM)).toBeNull();

		showProblems();

		expect(length.getAttribute("aria-invalid")).toBe("true");
		expect(length.getAttribute("aria-describedby")).toBe(
			screen.getByText(LENGTH_PROBLEM).id,
		);
		expect(getAmount().getAttribute("aria-invalid")).toBe("false");
		expect(document.activeElement).toBe(length);
	});

	it("shows a warning from the start, since it does not stop a save", () => {
		renderEditor({
			unlimited: false,
			rules: [
				{
					metric: "TOKENS",
					amount: 5000,
					window: "MINUTE",
					counts: "EACH_PERSON",
				},
				{
					metric: "TOKENS",
					amount: 1000,
					window: "DAY",
					counts: "EACH_PERSON",
				},
			],
		});

		expect(screen.getByText(/can never be reached/)).toBeTruthy();
		for (const input of screen.getAllByRole("textbox")) {
			expect(input.getAttribute("aria-invalid")).toBe("false");
		}
	});

	it("with no rules, says to add one and moves focus to Add Rule once the host shows the problems", () => {
		const { showProblems } = renderEditor();
		fireEvent.click(screen.getByRole("radio", { name: "Rules" }));
		fireEvent.click(screen.getByRole("button", { name: "Remove rule 1" }));

		const hint = screen.getByText(NO_RULES);
		const addRule = screen.getByRole("button", { name: "Add Rule" });
		expect(hint.classList.contains("text-destructive")).toBe(false);
		expect(addRule.hasAttribute("aria-describedby")).toBe(false);

		showProblems();

		expect(hint.classList.contains("text-destructive")).toBe(true);
		expect(addRule.getAttribute("aria-describedby")).toBe(hint.id);
		expect(document.activeElement).toBe(addRule);
	});

	it("names the chosen window in its select, as units after a length", async () => {
		renderEditor();
		fireEvent.click(screen.getByRole("radio", { name: "Rules" }));

		const windowSelect = screen.getByRole("combobox", {
			name: "How often rule 1 starts again",
		});
		expect(windowSelect.textContent).toBe("Per Day");

		fireEvent.click(windowSelect);
		fireEvent.click(
			await screen.findByRole("option", { name: "Per Minute" }),
		);

		expect(windowSelect.textContent).toBe("Minute");
	});

	it("names the chosen measure and counts in their selects", async () => {
		render(
			<ModelUsageLimitEditor
				defaultValue={{
					unlimited: false,
					rules: [
						{
							metric: "TOKENS",
							amount: 1000,
							window: "DAY",
							counts: "SHARED",
						},
					],
				}}
				source="TEAM"
			/>,
		);

		const metricSelect = screen.getByRole("combobox", {
			name: "What rule 1 counts",
		});
		const countsSelect = screen.getByRole("combobox", {
			name: "Whose use rule 1 counts",
		});
		expect(metricSelect.textContent).toBe("Tokens");
		expect(countsSelect.textContent).toBe("Shared");

		fireEvent.click(metricSelect);
		fireEvent.click(
			await screen.findByRole("option", { name: "Compute Time" }),
		);

		expect(metricSelect.textContent).toBe("Compute Time");
	});

	it("disables every control while the host saves", () => {
		const { container } = render(
			<ModelUsageLimitEditor
				defaultValue={null}
				source="DIRECT"
				disabled
			/>,
		);

		expect(container.querySelector("fieldset")?.disabled).toBe(true);
		expect(
			screen
				.getByRole("radio", { name: "Rules" })
				.hasAttribute("disabled"),
		).toBe(true);
	});
});
