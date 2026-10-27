import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { saveExpenseRoutine } from "./expense-routine-api";
import { ExpenseRoutineForm } from "./expense-routine-form";
import {
	EXPENSE_RECIPIENT_LIMIT,
	type ExpenseRoutine,
	type ExpenseRoutineSettings,
	expenseRoutineSchema,
	expenseRoutineSettingsSchema,
} from "./expense-routine-schema";

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions: { run: vi.fn() } }),
	usePixel: () => ({
		status: "SUCCESS",
		data: null,
		error: null,
		refresh: vi.fn(),
		update: vi.fn(),
	}),
}));

const routine: ExpenseRoutine = {
	id: "expense-review",
	configured: true,
	enabled: true,
	timezone: "America/New_York",
	recipients: ["jbell@deloitte.com"],
	documentsId: "e8f3a1c2-5b6d-4a7e-9c0f-1d2e3b4a5f60",
	subjects: ["Meeting Approval", "Business Approval"],
	nextRunAt: null,
	schedulerAvailable: true,
	assistantAvailable: true,
	mailboxAvailable: true,
	availabilityMessage: null,
	lastRun: null,
};

function renderForm() {
	const onSave = vi.fn(async (settings: ExpenseRoutineSettings) => ({
		...routine,
		...settings,
	}));
	render(
		<MemoryRouter>
			<ExpenseRoutineForm routine={routine} onSave={onSave} />
		</MemoryRouter>,
	);
	return {
		user: userEvent.setup(),
		onSave,
		input: screen.getByRole("textbox", { name: "Also send to (optional)" }),
	};
}

/** Settle the debounce while preserving the real timers used by user-event. */
async function autosave(milliseconds = 800): Promise<void> {
	await act(
		async () => new Promise((resolve) => setTimeout(resolve, milliseconds)),
	);
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("expense review settings", () => {
	it("saves the copy recipients through one Pixel argument", async () => {
		const settings: ExpenseRoutineSettings = {
			enabled: true,
			timezone: "America/New_York",
			recipients: ["jbell@deloitte.com"],
		};
		const run = vi.fn(async () => ({
			pixelReturn: [{ output: routine, operationType: ["OPERATION"] }],
		}));
		expect(await saveExpenseRoutine({ run } as never, settings)).toEqual(
			routine,
		);
		expect(run).toHaveBeenCalledWith(
			`WorkSaveExpenseRoutine(settings=[${JSON.stringify(settings)}]);`,
		);
	});

	it.each([
		["a name", ["Jen Bell"]],
		[
			"more addresses than the server keeps",
			Array.from(
				{ length: EXPENSE_RECIPIENT_LIMIT + 1 },
				(_, n) => `a${n}@deloitte.com`,
			),
		],
	])("rejects %s", (_, recipients) => {
		expect(
			expenseRoutineSettingsSchema.safeParse({
				enabled: true,
				timezone: "UTC",
				recipients,
			}).success,
		).toBe(false);
	});

	it("reads no recipients from a server that predates them", () => {
		expect(
			expenseRoutineSchema.parse({ ...routine, recipients: undefined })
				.recipients,
		).toEqual([]);
	});
});

describe("ExpenseRoutineForm", () => {
	it("saves typed addresses as a list and keeps the text as typed", async () => {
		const { user, onSave, input } = renderForm();
		expect(input).toHaveValue("jbell@deloitte.com");
		await user.type(input, "; LHughes@deloitte.com, ");
		await autosave();
		expect(onSave).toHaveBeenLastCalledWith({
			enabled: true,
			timezone: "America/New_York",
			recipients: ["jbell@deloitte.com", "LHughes@deloitte.com"],
		});
		// the owner may be about to type the next address after the comma
		expect(input).toHaveValue("jbell@deloitte.com; LHughes@deloitte.com, ");
	});

	it("explains an entry that is not an email address and does not save it", async () => {
		const { user, onSave, input } = renderForm();
		await user.clear(input);
		await user.type(input, "Jen Bell");
		await autosave();
		expect(onSave).not.toHaveBeenCalled();
		expect(
			screen.getByText("Enter email addresses separated by commas."),
		).toBeVisible();
		expect(input).toHaveAttribute("aria-invalid", "true");
	});
});
