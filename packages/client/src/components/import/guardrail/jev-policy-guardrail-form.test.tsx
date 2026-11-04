import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { JevPolicyGuardrailForm } from "./jev-policy-guardrail-form";

const mocks = vi.hoisted(() => ({
	usePixel: vi.fn(),
	createGuardrailEngine: vi.fn(),
	refresh: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({
	usePixel: mocks.usePixel,
	// the judge picker lists the models it is given, so it reads no pages
	useIteratorPixel: () => ({
		data: [],
		isLoading: false,
		hasMore: false,
		next: vi.fn(),
	}),
}));
vi.mock("@/api/guardrails", () => ({
	createGuardrailEngine: mocks.createGuardrailEngine,
}));
vi.mock("@/hooks/use-session", () => ({
	useSession: (selector: (state: { insightID: string }) => unknown) =>
		selector({ insightID: "insight-1" }),
}));

const MODELS = [
	{
		engine_id: "jev-model",
		engine_name: "Jev Latest",
		engine_type: "MODEL",
		engine_subtype: "TYPESAFE",
	},
	{
		engine_id: "chat-model",
		engine_name: "Chat Model",
		engine_type: "MODEL",
		engine_subtype: "OPEN_AI",
	},
];

const scrollIntoView = HTMLElement.prototype.scrollIntoView;
const hasPointerCapture = HTMLElement.prototype.hasPointerCapture;

beforeAll(() => {
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	HTMLElement.prototype.scrollIntoView = vi.fn();
	HTMLElement.prototype.hasPointerCapture = () => false;
});
beforeEach(() => {
	vi.clearAllMocks();
	mocks.usePixel.mockReturnValue({
		status: "SUCCESS",
		data: MODELS,
		refresh: mocks.refresh,
	});
	mocks.createGuardrailEngine.mockResolvedValue("new-guardrail");
});
afterEach(cleanup);
afterAll(() => {
	vi.unstubAllGlobals();
	HTMLElement.prototype.scrollIntoView = scrollIntoView;
	HTMLElement.prototype.hasPointerCapture = hasPointerCapture;
});

/**
 * Opens the select with a label.
 *
 * @param label - The select's label.
 */
const openSelect = (label: string) => {
	const trigger = screen.getByRole("combobox", { name: label });
	trigger.focus();
	fireEvent.keyDown(trigger, { key: "ArrowDown" });
};

/**
 * Picks an option of the select with a label.
 *
 * @param label - The select's label.
 * @param option - The option's text.
 */
const selectOption = async (label: string, option: string) => {
	openSelect(label);
	fireEvent.keyDown(await screen.findByRole("option", { name: option }), {
		key: "Enter",
	});
};

/**
 * Opens the engine picker with a label and picks an engine by its name.
 *
 * @param label - The picker's label.
 * @param engine - The engine's name.
 */
const pickEngine = async (label: string, engine: RegExp) => {
	fireEvent.click(screen.getByRole("combobox", { name: label }));
	fireEvent.click(await screen.findByRole("option", { name: engine }));
};

/**
 * Types into the text field with an accessible name.
 *
 * @param name - The field's label.
 * @param value - The text to enter.
 */
const typeInto = (name: string, value: string) =>
	fireEvent.change(screen.getByRole("textbox", { name }), {
		target: { value },
	});

/**
 * Fills in the catalog name, the judge and the question every policy needs.
 *
 * @param question - The policy question.
 */
const fillPolicy = async (question: string) => {
	typeInto("Catalog Name", "Scope check");
	await pickEngine("Jev Model", /Jev Latest/);
	typeInto("Policy Question", question);
};

describe("Jev policy guardrail form", () => {
	it("offers only the Jev models as the judge, each with its id", async () => {
		render(<JevPolicyGuardrailForm onSubmit={vi.fn()} />);

		fireEvent.click(screen.getByRole("combobox", { name: "Jev Model" }));

		const option = await screen.findByRole("option", {
			name: /Jev Latest/,
		});
		expect(within(option).getByText("id: jev-model")).toBeInTheDocument();
		expect(
			screen.queryByRole("option", { name: /Chat Model/ }),
		).not.toBeInTheDocument();
	});

	it("creates a yes or no policy and opens it", async () => {
		const onSubmit = vi.fn();
		render(<JevPolicyGuardrailForm onSubmit={onSubmit} />);

		await fillPolicy("Is this request within the approved scope?");
		await selectOption("Block When the Answer Is", "No");
		fireEvent.click(
			screen.getByRole("button", { name: "Create Guardrail" }),
		);

		await waitFor(() =>
			expect(onSubmit).toHaveBeenCalledWith("new-guardrail"),
		);
		expect(mocks.createGuardrailEngine).toHaveBeenCalledWith(
			"insight-1",
			"Scope check",
			{
				GUARDRAIL_TYPE: "EMBEDDED_JEV_POLICY",
				MODEL_ENGINE_ID: "jev-model",
				QUESTION_TYPE: "NOUL",
				QUESTION_INSTRUCTIONS:
					"Is this request within the approved scope?",
				VIOLATION_DIRECTION: "NO",
				CONFIDENCE_THRESHOLD: "0.5",
				LOW_CONFIDENCE_VERDICT: "PASS",
				JUDGE_ERROR_VERDICT: "BLOCK",
			},
		);
	});

	it("turns a yes or no question's violation chance into the guardrail's threshold", async () => {
		render(<JevPolicyGuardrailForm onSubmit={vi.fn()} />);

		await fillPolicy("Is this request within the approved scope?");
		fireEvent.change(
			screen.getByRole("spinbutton", {
				name: "Block at a Violation Chance of (%)",
			}),
			{ target: { value: "20" } },
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Create Guardrail" }),
		);

		await waitFor(() =>
			expect(mocks.createGuardrailEngine).toHaveBeenCalled(),
		);
		expect(mocks.createGuardrailEngine.mock.calls[0][2]).toMatchObject({
			CONFIDENCE_THRESHOLD: "0.8",
			LOW_CONFIDENCE_VERDICT: "BLOCK",
		});
	});

	it("asks a choice question for its confidence and strictness instead", async () => {
		render(<JevPolicyGuardrailForm onSubmit={vi.fn()} />);
		expect(
			screen.queryByRole("combobox", { name: "Strictness" }),
		).not.toBeInTheDocument();

		await selectOption("Question Type", "Choice");

		expect(
			screen.getByRole("spinbutton", { name: "Confidence Needed (%)" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("combobox", { name: "Strictness" }),
		).toHaveTextContent("Strict: Allow a Call Only When the Judge Is Sure");
		expect(
			screen.queryByRole("spinbutton", {
				name: "Block at a Violation Chance of (%)",
			}),
		).not.toBeInTheDocument();
	});

	it("creates a choice policy from its choices", async () => {
		render(<JevPolicyGuardrailForm onSubmit={vi.fn()} />);

		await selectOption("Question Type", "Choice");
		await fillPolicy("Does this answer share only approved figures?");
		typeInto("Choice 1 name", "APPROVED");
		typeInto("Choice 1 meaning", "shares approved figures");
		typeInto("Choice 2 name", "OFF_PLAN");
		typeInto("Choice 2 meaning", "mentions figures not on the list");
		fireEvent.click(
			screen.getByRole("button", { name: "Create Guardrail" }),
		);

		await waitFor(() =>
			expect(mocks.createGuardrailEngine).toHaveBeenCalled(),
		);
		const details = mocks.createGuardrailEngine.mock.calls[0][2];
		expect(details.QUESTION_TYPE).toBe("CHOICE");
		expect(details).not.toHaveProperty("VIOLATION_DIRECTION");
		expect(JSON.parse(details.QUESTION_CRITERIA)).toEqual({
			APPROVED: "shares approved figures",
			OFF_PLAN: "mentions figures not on the list",
		});
		expect(JSON.parse(details.VIOLATION_CHOICES)).toEqual(["OFF_PLAN"]);
	});

	it("asks for a choice that blocks the call before creating", async () => {
		render(<JevPolicyGuardrailForm onSubmit={vi.fn()} />);

		await selectOption("Question Type", "Choice");
		await fillPolicy("Does this answer share only approved figures?");
		typeInto("Choice 1 name", "APPROVED");
		typeInto("Choice 1 meaning", "shares approved figures");
		typeInto("Choice 2 name", "OFF_PLAN");
		typeInto("Choice 2 meaning", "mentions figures not on the list");
		fireEvent.click(
			screen.getByRole("checkbox", { name: "Choice 2 blocks the call" }),
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Create Guardrail" }),
		);

		expect(
			await screen.findByText(
				"Mark at least one choice as blocking the call",
			),
		).toBeInTheDocument();
		expect(mocks.createGuardrailEngine).not.toHaveBeenCalled();
	});

	it("moves focus to the choice that takes a removed one's place, then to Add choice", async () => {
		render(<JevPolicyGuardrailForm onSubmit={vi.fn()} />);
		await selectOption("Question Type", "Choice");

		fireEvent.click(
			screen.getByRole("button", { name: "Remove choice 1" }),
		);
		expect(
			screen.getByRole("textbox", { name: "Choice 1 name" }),
		).toHaveFocus();

		fireEvent.click(
			screen.getByRole("button", { name: "Remove choice 1" }),
		);
		expect(
			screen.getByRole("button", { name: "Add Choice" }),
		).toHaveFocus();
	});

	it("says when the user has no Jev model to judge with", () => {
		mocks.usePixel.mockReturnValue({
			status: "SUCCESS",
			data: [MODELS[1]],
			refresh: mocks.refresh,
		});
		render(<JevPolicyGuardrailForm onSubmit={vi.fn()} />);

		expect(
			screen.getByText(/No Jev models are available to you/),
		).toBeInTheDocument();
	});

	it("offers to read the models again when they could not be read", () => {
		mocks.usePixel.mockReturnValue({
			status: "ERROR",
			data: [],
			error: new Error("failed"),
			refresh: mocks.refresh,
		});
		render(<JevPolicyGuardrailForm onSubmit={vi.fn()} />);

		fireEvent.click(screen.getByRole("button", { name: "Try Again" }));

		expect(mocks.refresh).toHaveBeenCalled();
	});

	it("keeps the form open with the reason when the create fails", async () => {
		mocks.createGuardrailEngine.mockRejectedValue(
			new Error("This catalog name is already used"),
		);
		const onSubmit = vi.fn();
		render(<JevPolicyGuardrailForm onSubmit={onSubmit} />);

		await fillPolicy("Is this request within the approved scope?");
		fireEvent.click(
			screen.getByRole("button", { name: "Create Guardrail" }),
		);

		expect(
			await screen.findByText("This catalog name is already used"),
		).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
		expect(
			screen.getByRole("textbox", { name: "Catalog Name" }),
		).toHaveValue("Scope check");
	});
});
