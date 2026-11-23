import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { CollaborationState } from "@/features/collaboration/state/collaboration.types";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
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
			pixelReturn: [
				{ output: await answer, operationType: ["OPERATION"] },
			],
		};
	});
});
afterEach(cleanup);

/** The page as Digital Twins opens it, which is how it was before it had a door of its own. */
const renderPage = () => {
	render(
		<MemoryRouter>
			<PersonaPage isFromTwins />
		</MemoryRouter>,
	);
	return userEvent.setup();
};

/** The page as the sidebar opens it, under a session when one is given. */
const renderOwnPage = (state?: CollaborationState) => {
	const page = (
		<MemoryRouter>
			<PersonaPage />
		</MemoryRouter>
	);
	render(
		state ? (
			<CollaborationSessionProvider initialState={state}>
				{page}
			</CollaborationSessionProvider>
		) : (
			page
		),
	);
	return userEvent.setup();
};

/** Someone signed in to Microsoft, who has confirmed how they write email. */
const signedIn = (): CollaborationState => {
	const state = createInitialCollaborationState();
	state.liveProfile = {
		...state.profile,
		style: {
			summary: "Short and friendly.",
			source: "you",
			confirmed: true,
			examples: [],
			variants: {},
			pending: null,
		},
	};
	return state;
};
const assistantSwitch = () =>
	screen.findByRole("switch", {
		name: "Use My Persona With My Digital Twin",
	});

const openTab = async (
	user: ReturnType<typeof userEvent.setup>,
	name: "Persona" | "Usage",
): Promise<void> => {
	const tab = await screen.findByRole("tab", { name });
	await vi.waitFor(() => expect(tab).toBeEnabled());
	await user.click(tab);
};

it("opens on the saved summary and one readable section, with access to every section and the privacy note", async () => {
	answers.WorkGetTwinPersona = persona({
		short: "I help colleagues find a clear next step.",
		voice: "Direct.",
	});
	renderPage();
	expect(screen.getByText("Loading your persona…")).toBeInTheDocument();
	expect(
		await screen.findByText("I help colleagues find a clear next step."),
	).toBeVisible();
	expect(screen.getByRole("tab", { name: "Persona" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	expect(
		screen.getByRole("heading", { name: "Persona sections" }),
	).toBeVisible();
	expect(screen.getByRole("button", { name: "Voice" })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	expect(screen.getByText("Direct.")).toBeVisible();
	expect(screen.queryByRole("textbox")).toBeNull();
	for (const label of [
		"In short",
		"How you decide",
		"What you check when reviewing work",
		"Where you stand",
		"With different people",
		"Leave to you",
		"Sounds like you",
	]) {
		expect(screen.getByRole("button", { name: label })).toBeEnabled();
	}
	expect(
		screen.getByText(
			"Only you can open this page. A twin you share may quote what you write here.",
		),
	).toBeVisible();
	expect(screen.getByRole("link", { name: "Digital Twins" })).toHaveAttribute(
		"href",
		"/twins",
	);
});

it("saves only the edited section and reads the latest values returned by the server", async () => {
	const user = renderPage();
	await user.click(
		await screen.findByRole("button", { name: "Leave to you" }),
	);
	await user.click(screen.getByRole("button", { name: "Write section" }));
	await user.type(
		screen.getByRole("textbox", { name: "Leave to you" }),
		"# Budgets: ask Dana Smith.",
	);
	answers.WorkSaveTwinPersona = persona({
		voice: "Revised in another window.",
		limits: "Budgets: ask Dana Smith.",
	});
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(await screen.findByText("Budgets: ask Dana Smith.")).toBeVisible();
	expect(screen.queryByRole("textbox")).toBeNull();
	expect(ran().at(-1)).toBe(
		`WorkSaveTwinPersona(sections=[${JSON.stringify({
			limits: "# Budgets: ask Dana Smith.",
		})}]);`,
	);
	await user.click(screen.getByRole("button", { name: "Voice" }));
	expect(screen.getByText("Revised in another window.")).toBeVisible();
});

it("keeps what was written when the save is refused, and says why", async () => {
	answers.WorkSaveTwinPersona = new Error("Collaboration is not enabled.");
	const user = renderPage();
	await user.click(await screen.findByRole("button", { name: "Edit" }));
	const voice = screen.getByRole("textbox", { name: "Voice" });
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
	await openTab(user, "Usage");
	expect(screen.queryByRole("button", { name: "Delete persona" })).toBeNull();
	await openTab(user, "Persona");
	await user.click(
		await screen.findByRole("button", { name: "Write section" }),
	);
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Write at least one section first.",
	);
	expect(ran()).toEqual(["WorkGetTwinPersona();"]);
});

it("deletes the persona only after confirmation and resets the section reader", async () => {
	const user = renderPage();
	await openTab(user, "Usage");
	const trigger = await screen.findByRole("button", {
		name: "Delete persona",
	});
	await user.click(trigger);
	const dialog = within(
		screen.getByRole("dialog", { name: "Delete your persona?" }),
	);
	await user.click(dialog.getByRole("button", { name: "Cancel" }));
	await vi.waitFor(() => expect(trigger).toHaveFocus());
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
	await user.click(
		within(screen.getByRole("dialog")).getByRole("button", {
			name: "Cancel",
		}),
	);
	await openTab(user, "Persona");
	expect(screen.getByText("Direct.")).toBeVisible();

	answers.WorkDeleteTwinPersona = persona();
	await openTab(user, "Usage");
	await user.click(screen.getByRole("button", { name: "Delete persona" }));
	await user.click(
		within(screen.getByRole("dialog")).getByRole("button", {
			name: "Delete",
		}),
	);
	await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
	const personaTab = screen.getByRole("tab", { name: "Persona" });
	expect(personaTab).toHaveAttribute("aria-selected", "true");
	await vi.waitFor(() => expect(personaTab).toHaveFocus());
	expect(screen.queryByRole("button", { name: "Delete persona" })).toBeNull();
	expect(screen.getByRole("button", { name: "Write section" })).toBeVisible();
	expect(screen.queryByText("Direct.")).toBeNull();
	expect(ran().at(-1)).toBe("WorkDeleteTwinPersona();");
});

it("says when the persona cannot be read, and reads it again when asked", async () => {
	answers.WorkGetTwinPersona = new Error("The server is restarting.");
	const user = renderPage();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The server is restarting.",
	);
	expect(screen.queryByRole("button", { name: "Voice" })).toBeNull();
	answers.WorkGetTwinPersona = persona({ voice: "Direct." });
	await user.click(screen.getByRole("button", { name: "Try again" }));
	expect(await screen.findByText("Direct.")).toBeVisible();
});

it("leads to the interview from the page, named for where the interview is", async () => {
	answers.WorkGetTwinPersona = persona();
	const { unmount } = render(
		<MemoryRouter>
			<PersonaPage isFromTwins />
		</MemoryRouter>,
	);
	expect(
		await screen.findByRole("link", { name: "Start the interview" }),
	).toHaveAttribute("href", "/twins/persona/interview");
	// Someone with no persona can also begin manually.
	expect(screen.getByRole("button", { name: "Write section" })).toBeEnabled();
	unmount();

	answers.WorkGetTwinPersona = {
		...persona({ voice: "Direct." }),
		interview: { answered: 11, of: 11, wrapped: false, done: true },
	};
	renderPage();
	expect(
		await screen.findByRole("link", { name: "Open the interview" }),
	).toHaveAttribute("href", "/twins/persona/interview");
	expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
});

it("opens from the sidebar as the same page with no way back to Digital Twins, and its interview behind the same door", async () => {
	answers.WorkGetTwinPersona = {
		...persona({ voice: "Direct." }),
		interview: { answered: 6, of: 6, wrapped: true, done: true },
	};
	renderOwnPage();
	expect(await screen.findByText("Direct.")).toBeVisible();
	expect(screen.queryByRole("link", { name: "Digital Twins" })).toBeNull();
	expect(
		screen.getByRole("link", { name: "Keep grilling me" }),
	).toHaveAttribute("href", "/persona/interview?go=more");
	expect(screen.getByRole("tab", { name: "Usage" })).toBeEnabled();
	expect(screen.queryByRole("tab", { name: "In email" })).toBeNull();
	expect(ran()).toEqual(["WorkGetTwinPersona();"]);
});

it("has the person's own Digital Twin use the persona until it is switched off, and saves the switch as it is moved", async () => {
	const user = renderOwnPage();
	await openTab(user, "Usage");
	const toggle = await assistantSwitch();
	// a server from before the switch says nothing of it, and uses the persona
	expect(toggle).toBeChecked();
	expect(toggle).toHaveAccessibleDescription(
		"Your Digital Twin weighs things the way you described and writes email and Teams drafts in your voice. It answers you in a plain voice. Drafts your routines write follow this switch too.",
	);
	answers.WorkSetAssistantPersona = { enabled: false };
	// by keyboard, as a switch is moved
	act(() => toggle.focus());
	await user.keyboard(" ");
	await vi.waitFor(() =>
		expect(ran().at(-1)).toBe("WorkSetAssistantPersona(enabled=[false]);"),
	);
	expect(toggle).not.toBeChecked();
	expect(toggle).toHaveFocus();

	// A later persona save preserves the independently saved switch.
	await openTab(user, "Persona");
	await user.click(screen.getByRole("button", { name: "Edit" }));
	await user.type(
		screen.getByRole("textbox", { name: "Voice" }),
		" Be warm.",
	);
	answers.WorkSaveTwinPersona = {
		...persona({ voice: "Direct. Be warm." }),
		assistant: false,
	};
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(await screen.findByText("Direct. Be warm.")).toBeVisible();
	await openTab(user, "Usage");
	const savedToggle = await assistantSwitch();
	expect(savedToggle).not.toBeChecked();

	// what shows is what the server kept, whatever was asked for
	await user.click(savedToggle);
	await vi.waitFor(() =>
		expect(ran().at(-1)).toBe("WorkSetAssistantPersona(enabled=[true]);"),
	);
	await vi.waitFor(() => expect(savedToggle).not.toBeChecked());
	expect(screen.queryByRole("alert")).toBeNull();
});

it("puts the switch back and says why beside it when it cannot be saved", async () => {
	answers.WorkSetAssistantPersona = new Error(
		"Collaboration is not enabled.",
	);
	const user = renderOwnPage();
	await openTab(user, "Usage");
	const toggle = await assistantSwitch();
	await user.click(toggle);
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Collaboration is not enabled.",
	);
	expect(toggle).toBeChecked();
	// said of the switch itself, so it is heard again when the switch is come back to
	expect(toggle).toHaveAccessibleDescription(
		expect.stringContaining("Collaboration is not enabled."),
	);

	answers.WorkSetAssistantPersona = { enabled: false };
	await user.click(toggle);
	await vi.waitFor(() => expect(ran()).toHaveLength(3));
	expect(toggle).not.toBeChecked();
	expect(screen.queryByRole("alert")).toBeNull();
});

it("keeps usage changes and deletion unavailable while a section save is pending", async () => {
	let finish = (): void => undefined;
	const delay = new Promise<void>((resolve) => {
		finish = resolve;
	});
	answers.WorkSaveTwinPersona = delay.then(() =>
		persona({ voice: "Direct. Be warm." }),
	);
	const user = renderPage();
	await user.click(await screen.findByRole("button", { name: "Edit" }));
	await user.type(
		screen.getByRole("textbox", { name: "Voice" }),
		" Be warm.",
	);
	await user.click(screen.getByRole("button", { name: "Save" }));
	await openTab(user, "Usage");
	const remove = screen.getByRole("button", { name: "Delete persona" });
	expect(remove).toBeDisabled();
	await user.click(await assistantSwitch());
	expect(ran()).toHaveLength(2);
	expect(ran()[1]).toMatch(/^WorkSaveTwinPersona/);
	await act(async () => finish());
	await vi.waitFor(() => expect(remove).toBeEnabled());
	await openTab(user, "Persona");
	expect(screen.getByText("Direct. Be warm.")).toBeVisible();
});

it("offers the switch for the person's own twin only once a section is saved, using the value the server returned", async () => {
	// with nothing written yet, the tab says what a first section is for
	const emptyUsage =
		"Write your first section to use your persona with your Digital Twin and the twins you share.";
	answers.WorkGetTwinPersona = persona();
	const user = renderOwnPage();
	await openTab(user, "Usage");
	expect(screen.queryByRole("switch")).toBeNull();
	expect(screen.getByText(emptyUsage)).toBeVisible();
	await openTab(user, "Persona");
	await user.click(await screen.findByRole("button", { name: "Voice" }));
	await user.click(screen.getByRole("button", { name: "Write section" }));
	await user.type(screen.getByRole("textbox", { name: "Voice" }), "Direct.");
	answers.WorkSaveTwinPersona = {
		...persona({ voice: "Direct." }),
		assistant: false,
	};
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(await screen.findByText("Direct.")).toBeVisible();
	await openTab(user, "Usage");
	expect(await assistantSwitch()).not.toBeChecked();
});

it("explains which features stop using the persona before deletion", async () => {
	const user = renderOwnPage();
	await openTab(user, "Usage");
	await user.click(
		await screen.findByRole("button", { name: "Delete persona" }),
	);
	expect(
		screen.getByRole("dialog", { name: "Delete your persona?" }),
	).toHaveAccessibleDescription(
		"Every section of your persona is deleted. Your Digital Twin stops using it, and the twins you share stop answering in your voice. This cannot be undone.",
	);
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(
		screen.getByRole("region", { name: "Delete your persona" }),
	).toHaveTextContent(
		"Removes your persona from your Digital Twin and the twins you share.",
	);
});

it("leads Usage with the person's own Digital Twin and its picture, then the twins they share", async () => {
	const state = signedIn();
	const user = renderOwnPage({
		...state,
		mainTwin: {
			name: "Robin's Digital Twin",
			avatar: "data:image/png;base64,AAAA",
			agentId: "collaboration-agent",
		},
	});
	await openTab(user, "Usage");
	const toggle = await assistantSwitch();
	const shared = screen.getByText("Twins You Share");
	// their own twin's row comes first, led by the twin's picture
	expect(
		toggle.compareDocumentPosition(shared) &
			Node.DOCUMENT_POSITION_FOLLOWING,
	).toBeTruthy();
	const usage = screen.getByRole("tabpanel", { name: "Usage" });
	expect(usage.querySelector("img")).toHaveAttribute(
		"src",
		"data:image/png;base64,AAAA",
	);
	expect(
		screen.getByText(
			"The twins you share use your persona by default. You can switch it off in each twin's profile.",
		),
	).toBeVisible();
	expect(screen.getByRole("link", { name: "Manage twins" })).toHaveAttribute(
		"href",
		"/twins",
	);
});

it("keeps a section edit across Usage and offers one persona even with a legacy email style", async () => {
	const user = renderOwnPage(signedIn());
	await user.click(await screen.findByRole("button", { name: "Edit" }));
	const voice = screen.getByRole("textbox", { name: "Voice" });
	await user.type(voice, " Ask first.");

	expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
		"Persona",
		"Usage",
	]);
	await openTab(user, "Usage");
	expect(await assistantSwitch()).toBeVisible();
	await openTab(user, "Persona");
	expect(screen.getByRole("textbox", { name: "Voice" })).toHaveValue(
		"Direct. Ask first.",
	);
	expect(ran()).toEqual(["WorkGetTwinPersona();"]);
});

it("renders a dash-led summary as separate points in the page header", async () => {
	answers.WorkGetTwinPersona = persona({
		short: "- Start with the decision.\n- Offer a trade-off.",
		voice: "Direct.",
	});
	renderPage();
	const summary = await screen.findByRole("list", {
		name: "Persona summary",
	});
	expect(
		within(summary)
			.getAllByRole("listitem")
			.map((item) => item.textContent),
	).toEqual(["Start with the decision.", "Offer a trade-off."]);
});
