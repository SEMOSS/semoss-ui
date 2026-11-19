import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { PersonaSections } from "./api/persona";
import { PersonaPage } from "./persona-page";

// one actions object, as the provider gives; a new one per render would read again forever
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));

const BLANK: PersonaSections = {
	short: "",
	voice: "",
	decide: "",
	review: "",
	stands: "",
	people: "",
	limits: "",
	examples: "",
};
const persona = (sections: Partial<PersonaSections> = {}) => ({
	exists: Object.values(sections).some(Boolean),
	sections: { ...BLANK, ...sections },
	offTwins: [],
});

/** What the server answers each reactor with; an Error is a refusal. */
let answers: Record<string, unknown>;
const ran = (): string[] =>
	insight.actions.run.mock.calls.map(([statement]) => String(statement));

beforeEach(() => {
	answers = { WorkGetTwinPersona: persona({ voice: "Direct." }) };
	insight.actions.run.mockReset();
	insight.actions.run.mockImplementation(async (statement: string) => {
		const answer = answers[statement.slice(0, statement.indexOf("("))];
		if (answer instanceof Error) throw answer;
		return {
			pixelReturn: [{ output: answer, operationType: ["OPERATION"] }],
		};
	});
});
afterEach(cleanup);

const renderPage = () => {
	render(
		<MemoryRouter>
			<PersonaPage />
		</MemoryRouter>,
	);
	return userEvent.setup();
};

it("shows what the persona says in a box per section, and who else can come to know it", async () => {
	renderPage();
	expect(screen.getByText("Loading your persona…")).toBeInTheDocument();
	expect(await screen.findByLabelText("Voice")).toHaveValue("Direct.");
	for (const label of [
		"In short",
		"How you decide",
		"What you check when reviewing work",
		"Where you stand",
		"With different people",
		"Leave to you",
		"Sounds like you",
	]) {
		expect(screen.getByLabelText(label)).toHaveValue("");
	}
	expect(
		screen.getByText(/a twin can be talked into quoting what it was told/),
	).toBeVisible();
	expect(screen.getByRole("link", { name: "Digital Twins" })).toHaveAttribute(
		"href",
		"/twins",
	);
});

it("saves every section and then shows the text as the server kept it", async () => {
	const user = renderPage();
	const limits = await screen.findByLabelText("Leave to you");
	await user.type(limits, "# Budgets: ask Dana Smith.");
	answers.WorkSaveTwinPersona = persona({
		voice: "Direct.",
		limits: "Budgets: ask Dana Smith.",
	});
	await user.click(screen.getByRole("button", { name: "Save" }));
	// a line that could pass for a heading comes back without its mark
	await vi.waitFor(() =>
		expect(limits).toHaveValue("Budgets: ask Dana Smith."),
	);
	expect(ran().at(-1)).toBe(
		`WorkSaveTwinPersona(sections=[${JSON.stringify({
			...BLANK,
			voice: "Direct.",
			limits: "# Budgets: ask Dana Smith.",
		})}]);`,
	);
});

it("keeps what was written when the save is refused, and says why", async () => {
	answers.WorkSaveTwinPersona = new Error("Collaboration is not enabled.");
	const user = renderPage();
	const voice = await screen.findByLabelText("Voice");
	await user.type(voice, " Brief.");
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Collaboration is not enabled.",
	);
	expect(voice).toHaveValue("Direct. Brief.");
});

it("asks for a section before saving a persona that says nothing, and offers no delete for one that is not there", async () => {
	answers.WorkGetTwinPersona = persona();
	const user = renderPage();
	await screen.findByLabelText("Voice");
	expect(screen.queryByRole("button", { name: "Delete persona" })).toBeNull();
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Write at least one section first.",
	);
	expect(ran()).toEqual(["WorkGetTwinPersona();"]);
});

it("deletes the persona only after it is confirmed, and starts the boxes over", async () => {
	const user = renderPage();
	const trigger = await screen.findByRole("button", {
		name: "Delete persona",
	});
	await user.click(trigger);
	const dialog = within(
		screen.getByRole("dialog", { name: "Delete your persona?" }),
	);
	await user.click(dialog.getByRole("button", { name: "Cancel" }));
	expect(ran()).toEqual(["WorkGetTwinPersona();"]);

	answers.WorkDeleteTwinPersona = new Error("The database is down.");
	await user.click(screen.getByRole("button", { name: "Delete persona" }));
	await user.click(
		within(screen.getByRole("dialog")).getByRole("button", {
			name: "Delete",
		}),
	);
	// a delete that fails says why, in the dialog, and nothing is taken away
	expect(
		await within(screen.getByRole("dialog")).findByRole("alert"),
	).toHaveTextContent("The database is down.");
	expect(screen.getByLabelText("Voice")).toHaveValue("Direct.");

	answers.WorkDeleteTwinPersona = persona();
	await user.click(
		within(screen.getByRole("dialog")).getByRole("button", {
			name: "Delete",
		}),
	);
	await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	expect(screen.getByLabelText("Voice")).toHaveValue("");
	expect(screen.queryByRole("button", { name: "Delete persona" })).toBeNull();
	expect(ran().at(-1)).toBe("WorkDeleteTwinPersona();");
});

it("says when the persona cannot be read, and reads it again when asked", async () => {
	answers.WorkGetTwinPersona = new Error("The server is restarting.");
	const user = renderPage();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The server is restarting.",
	);
	expect(screen.queryByLabelText("Voice")).toBeNull();
	answers.WorkGetTwinPersona = persona({ voice: "Direct." });
	await user.click(screen.getByRole("button", { name: "Try again" }));
	expect(await screen.findByLabelText("Voice")).toHaveValue("Direct.");
});

it("leads to the interview from the page, named for where the interview is", async () => {
	answers.WorkGetTwinPersona = persona();
	const { unmount } = render(
		<MemoryRouter>
			<PersonaPage />
		</MemoryRouter>,
	);
	expect(
		await screen.findByRole("link", { name: "Start the interview" }),
	).toHaveAttribute("href", "/twins/persona/interview");
	// someone with no persona is told the interview can write it
	expect(
		screen.getByText(/The interview writes these for you/),
	).toBeVisible();
	unmount();

	answers.WorkGetTwinPersona = {
		...persona({ voice: "Direct." }),
		interview: { answered: 11, of: 11, wrapped: false, done: true },
	};
	renderPage();
	expect(
		await screen.findByRole("link", { name: "Open the interview" }),
	).toHaveAttribute("href", "/twins/persona/interview");
	expect(screen.queryByText(/The interview writes these for you/)).toBeNull();
});
