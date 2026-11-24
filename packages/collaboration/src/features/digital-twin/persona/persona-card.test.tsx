import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { PersonaSections } from "./api/persona";
import { PersonaCard } from "./persona-card";

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
/** What the server says of the persona; an Error is a refusal. */
let answer: unknown;

beforeEach(() => {
	answer = { exists: false, sections: BLANK, offTwins: [] };
	insight.actions.run.mockReset();
	insight.actions.run.mockImplementation(async () => {
		if (answer instanceof Error) throw answer;
		return {
			pixelReturn: [{ output: answer, operationType: ["OPERATION"] }],
		};
	});
});
afterEach(cleanup);

const renderCard = (twinIds: string[] = []) =>
	render(
		<MemoryRouter>
			<PersonaCard twinIds={twinIds} />
		</MemoryRouter>,
	);

it("says what a persona is for to someone with none, with the way to the interview and to writing it by hand", async () => {
	renderCard(["twin-1"]);
	expect(screen.getByText("Loading your persona…")).toBeInTheDocument();
	expect(
		await screen.findByRole("link", { name: "Start the interview" }),
	).toHaveAttribute("href", "/twins/persona/interview");
	expect(
		screen.getByRole("link", { name: "Or write it by hand" }),
	).toHaveAttribute("href", "/twins/persona");
	const card = screen.getByRole("region", { name: "Your persona" });
	expect(card).toHaveTextContent(
		"Teach your Digital Twin how you decide and write, and the twins you share how you sound. A few questions, once, and all of them use it.",
	);
	// who uses it is only said of a persona that exists
	expect(card).not.toHaveTextContent(/uses it\.|switched off/);
});

it("names the way into an interview for where it is: under way, or with what it wrote waiting", async () => {
	answer = {
		exists: false,
		sections: BLANK,
		offTwins: [],
		interview: { answered: 3, of: 11, wrapped: false, done: false },
	};
	const { unmount } = renderCard();
	expect(
		await screen.findByRole("link", { name: "Continue the interview" }),
	).toHaveAttribute("href", "/twins/persona/interview");
	unmount();

	// wrapped up early, with what it wrote not saved yet: going on is at the steps it left out
	answer = {
		exists: false,
		sections: BLANK,
		offTwins: [],
		interview: { answered: 6, of: 6, wrapped: true, done: true },
	};
	renderCard();
	expect(
		await screen.findByRole("link", { name: "Keep grilling me" }),
	).toHaveAttribute("href", "/twins/persona/interview?go=more");
});

it("shows how the persona opens, whether the person's own twin uses it, and how many of the twins they share do", async () => {
	answer = {
		exists: true,
		sections: { ...BLANK, voice: "Direct.", short: "Runs renewals." },
		offTwins: ["twin-2", "twin-gone"],
	};
	const { rerender } = renderCard(["twin-1", "twin-2", "twin-3"]);
	expect(
		await screen.findByRole("link", { name: "Open your persona" }),
	).toHaveAttribute("href", "/twins/persona");
	// what it says in short comes first, as its owner reads it
	expect(screen.getByText("Runs renewals.")).toBeVisible();
	expect(screen.queryByText("Direct.")).toBeNull();
	// a twin it was switched off for is not counted, and neither is one that is gone
	const usage = (shared: string) =>
		screen.getByText(`Your Digital Twin uses it. ${shared}`);
	expect(usage("Used by 2 of the 3 twins you share.")).toBeVisible();

	const again = (twinIds: string[]) =>
		rerender(
			<MemoryRouter>
				<PersonaCard twinIds={twinIds} />
			</MemoryRouter>,
		);
	again(["twin-1", "twin-3"]);
	expect(usage("Used by all 2 twins you share.")).toBeVisible();
	again(["twin-1"]);
	expect(usage("The twin you share uses it.")).toBeVisible();
	again([]);
	expect(usage("The next twin you share will use it.")).toBeVisible();
	// switched off everywhere reads as that, not as a count of none
	again(["twin-2"]);
	expect(usage("It is switched off for the twin you share.")).toBeVisible();
	again(["twin-2", "twin-gone"]);
	expect(
		usage("It is switched off for all the twins you share."),
	).toBeVisible();
});

it("says when the person's own twin does not use the persona, apart from the twins they share", async () => {
	answer = {
		exists: true,
		sections: { ...BLANK, short: "Runs renewals." },
		offTwins: [],
		assistant: false,
	};
	renderCard(["twin-1"]);
	expect(
		await screen.findByText(
			"It is switched off for your Digital Twin. The twin you share uses it.",
		),
	).toBeVisible();
	cleanup();

	// switched on for their own twin, and off for the one they share
	answer = {
		exists: true,
		sections: { ...BLANK, short: "Runs renewals." },
		offTwins: ["twin-1"],
		assistant: true,
	};
	renderCard(["twin-1"]);
	expect(
		await screen.findByText(
			"Your Digital Twin uses it. It is switched off for the twin you share.",
		),
	).toBeVisible();
});

it("opens on the first section that says anything when the persona has nothing in short", async () => {
	answer = {
		exists: true,
		sections: { ...BLANK, limits: "Budgets: ask Dana Smith." },
		offTwins: [],
	};
	renderCard(["twin-1"]);
	expect(await screen.findByText("Budgets: ask Dana Smith.")).toBeVisible();
});

it("says when the persona cannot be read without taking the page down, and reads it again when asked", async () => {
	answer = new Error("The server is restarting.");
	renderCard(["twin-1"]);
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The server is restarting.",
	);
	answer = { exists: false, sections: BLANK, offTwins: [] };
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Try again" }));
	expect(
		await screen.findByRole("link", { name: "Start the interview" }),
	).toBeVisible();
});
