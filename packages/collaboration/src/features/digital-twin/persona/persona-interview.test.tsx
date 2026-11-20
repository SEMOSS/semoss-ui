import {
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { PersonaInterview } from "./persona-interview";

// one actions object, as the provider gives; a new one per render would read again forever
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));

const SAID = {
	progress: { answered: 2, of: 11 },
	learned: ["blunt", "brief"],
	notes: [],
	wrapWait: "Looking for answers that do not add up",
};
const LIMITS = {
	phase: "asking",
	step: {
		id: "limits",
		kind: "choice",
		title: "What should be left to you?",
		detail: "Your twins will not discuss or decide these for you, and your assistant takes no position on them when it writes for you.",
		options: ["Budgets and pricing", "Hiring"],
		ordered: false,
	},
	...SAID,
};
const VOICE = {
	phase: "asking",
	step: {
		id: "voice",
		kind: "rounds",
		title: "Which is more you?",
		detail: "Pick the reply you would send, or write your own.",
		rounds: [
			{
				id: "r1",
				from: "Sam, a teammate",
				message: "Can we move the date?",
				a: "No.",
				b: "Let us look at it.",
			},
			{
				id: "r2",
				from: "Priya, your manager",
				message: "Can you take this on?",
				a: "Yes.",
				b: "Yes, happily.",
			},
		],
	},
	...SAID,
	progress: { answered: 1, of: 11 },
};
const PRIORITIES = {
	phase: "asking",
	step: {
		id: "priorities",
		kind: "choice",
		title: "What wins when things conflict?",
		detail: "Tap them in order.",
		options: ["Speed", "Quality"],
		ordered: true,
		wait: "Writing a hard call for you",
	},
	...SAID,
	progress: { answered: 4, of: 11 },
	checkpoint: true,
	canWrap: true,
};
const SECTIONS = {
	short: "Direct and brief.",
	voice: "- Leads with the answer.",
	decide: "",
	review: "",
	stands: "",
	people: "",
	limits: "Stay out of: Hiring.",
	examples: "",
};
const DONE = { phase: "done", brief: { sections: SECTIONS }, ...SAID };

/**
 * What the server answers each reactor with; an Error is a refusal. The
 * interview's own answers are a list taken in order, the last one repeating.
 */
let answers: Record<string, unknown>;
const ran = (): string[] =>
	insight.actions.run.mock.calls.map(([statement]) => String(statement));

beforeEach(() => {
	answers = { WorkTwinPersonaInterview: [{ phase: "none" }] };
	insight.actions.run.mockReset();
	insight.actions.run.mockImplementation(async (statement: string) => {
		const reactor = statement.slice(0, statement.indexOf("("));
		const given = answers[reactor];
		const output =
			reactor === "WorkTwinPersonaInterview" && Array.isArray(given)
				? given.length > 1
					? given.shift()
					: given[0]
				: given;
		if (output instanceof Error) throw output;
		return {
			pixelReturn: [{ output, operationType: ["OPERATION"] }],
		};
	});
});
afterEach(cleanup);

/** The interview as Digital Twins opens it, which is how it was before the persona had a door of its own. */
function renderInterview(search = "") {
	render(
		<MemoryRouter initialEntries={[`/twins/persona/interview${search}`]}>
			<PersonaInterview isFromTwins />
		</MemoryRouter>,
	);
	return userEvent.setup();
}

/** The interview as the persona's own page opens it. */
function renderOwnInterview() {
	render(
		<MemoryRouter initialEntries={["/persona/interview"]}>
			<PersonaInterview />
		</MemoryRouter>,
	);
	return userEvent.setup();
}
const next = () => screen.getByRole("button", { name: "Next" });

it("asks what it may read before anything is read, and reads only what is left on", async () => {
	const user = renderInterview();
	expect(screen.getByText("Loading your interview…")).toBeInTheDocument();
	expect(await screen.findByText("May I read how you write?")).toBeVisible();
	expect(ran()).toEqual(["WorkTwinPersonaInterview();"]);
	for (const place of [
		"Mail you sent",
		"Your Teams messages",
		"What the assistant has learned about you",
	]) {
		expect(screen.getByRole("switch", { name: place })).toBeChecked();
	}

	await user.click(
		screen.getByRole("switch", { name: "Your Teams messages" }),
	);
	answers.WorkTwinPersonaInterview = [LIMITS];
	await user.click(screen.getByRole("button", { name: "Start" }));
	expect(
		await screen.findByRole("heading", {
			level: 2,
			name: "What should be left to you?",
		}),
	).toHaveFocus();
	expect(ran().at(-1)).toBe(
		'WorkTwinPersonaInterview(sources=["mail","memory"]);',
	);
});

it("says so when nothing may be read, and starts without reading", async () => {
	const user = renderInterview();
	await screen.findByText("May I read how you write?");
	for (const place of screen.getAllByRole("switch")) await user.click(place);
	answers.WorkTwinPersonaInterview = [LIMITS];
	await user.click(
		screen.getByRole("button", { name: "Start without reading" }),
	);
	await screen.findByRole("heading", { level: 2, name: LIMITS.step.title });
	expect(ran().at(-1)).toBe('WorkTwinPersonaInterview(sources=["none"]);');
});

it("shows where the interview is, sends the answer to the step with its id, and shows what was learned", async () => {
	answers.WorkTwinPersonaInterview = [LIMITS];
	const user = renderInterview();
	await screen.findByRole("heading", { level: 2, name: LIMITS.step.title });
	expect(screen.getByText("Step 3 of 11")).toBeVisible();
	expect(
		screen.getByRole("progressbar", { name: "How far the interview is" }),
	).toHaveAttribute("aria-valuenow", "2");
	const learned = within(
		screen.getByText("Learned so far").parentElement as HTMLElement,
	);
	expect(
		learned.getAllByRole("listitem").map((item) => item.textContent),
	).toEqual(["blunt", "brief"]);

	await user.click(screen.getByRole("button", { name: "Hiring" }));
	answers.WorkTwinPersonaInterview = [PRIORITIES];
	await user.click(next());
	await screen.findByText("That is a solid start");
	expect(ran().at(-1)).toBe(
		'WorkTwinPersonaInterview(answer=[{"picked":["Hiring"],"own":[],"stepId":"limits"}]);',
	);
});

it("goes on from a step that was not touched with nothing but its id, and skips one when asked", async () => {
	answers.WorkTwinPersonaInterview = [LIMITS];
	const user = renderInterview();
	await screen.findByRole("heading", { level: 2, name: LIMITS.step.title });
	await user.click(next());
	await vi.waitFor(() =>
		expect(ran().at(-1)).toBe(
			'WorkTwinPersonaInterview(answer=[{"stepId":"limits"}]);',
		),
	);
	await user.click(screen.getByRole("button", { name: "Skip" }));
	await vi.waitFor(() =>
		expect(ran().at(-1)).toBe(
			'WorkTwinPersonaInterview(answer=[{"stepId":"limits","skipped":true}]);',
		),
	);
});

it("takes a step of several rounds one at a time, and sends them together after the last", async () => {
	answers.WorkTwinPersonaInterview = [VOICE];
	const user = renderInterview();
	const title = await screen.findByRole("heading", {
		level: 2,
		name: "Which is more you?",
	});
	expect(screen.getByText("Step 2 of 11, part 1 of 2")).toBeVisible();
	// a step of several rounds is not skipped whole: each round can be left unanswered
	expect(screen.queryByRole("button", { name: "Skip" })).toBeNull();
	expect(title).toHaveFocus();

	await user.click(screen.getByRole("button", { name: "Reply A: No." }));
	await user.click(next());
	expect(ran()).toHaveLength(1);
	expect(screen.getByText("Step 2 of 11, part 2 of 2")).toBeVisible();
	expect(screen.getByText("Can you take this on?")).toBeVisible();
	// the next round starts at the title again
	expect(
		screen.getByRole("heading", { level: 2, name: "Which is more you?" }),
	).toHaveFocus();

	// back inside a step is the round before, with nothing sent
	await user.click(screen.getByRole("button", { name: "Back" }));
	expect(ran()).toHaveLength(1);
	expect(
		screen.getByRole("button", { name: "Reply A: No." }),
	).toHaveAttribute("aria-pressed", "true");
	// the first round of the first step has nothing before it
	expect(screen.queryByRole("button", { name: "Back" })).toBeNull();
	await user.click(next());
	await user.type(
		screen.getByLabelText("Neither? Write what you would send"),
		"No.",
	);
	answers.WorkTwinPersonaInterview = [LIMITS];
	await user.click(next());
	await screen.findByRole("heading", { level: 2, name: LIMITS.step.title });
	expect(ran().at(-1)).toBe(
		'WorkTwinPersonaInterview(answer=[{"rounds":{"r1":{"pick":"a"},"r2":{"pick":"own","text":"No."}},"stepId":"voice"}]);',
	);
});

it("offers to wrap up once the essentials are answered, and goes on to the deeper steps when asked", async () => {
	answers.WorkTwinPersonaInterview = [PRIORITIES];
	const user = renderInterview();
	expect(
		await screen.findByRole("heading", {
			level: 2,
			name: "That is a solid start",
		}),
	).toHaveFocus();
	// the step waits behind the question of whether to go on
	expect(screen.queryByRole("button", { name: "Speed" })).toBeNull();

	await user.click(screen.getByRole("button", { name: "Keep going" }));
	expect(
		screen.getByRole("heading", {
			level: 2,
			name: "What wins when things conflict?",
		}),
	).toBeVisible();
	// from here on wrapping up stays within reach
	answers.WorkTwinPersonaInterview = [DONE];
	await user.click(screen.getByRole("button", { name: "Wrap up" }));
	await screen.findByRole("heading", {
		level: 2,
		name: "Here is what I wrote",
	});
	expect(ran().at(-1)).toBe("WorkTwinPersonaInterview(wrap=[true]);");
});

it("says what the server is writing while an answer is on its way, and keeps the answer when it does not get there", async () => {
	answers.WorkTwinPersonaInterview = [PRIORITIES];
	const user = renderInterview();
	await user.click(await screen.findByRole("button", { name: "Keep going" }));
	await user.click(screen.getByRole("button", { name: "Quality" }));

	let fail = (_cause: Error): void => undefined;
	insight.actions.run.mockImplementationOnce(
		() =>
			new Promise((_resolve, reject) => {
				fail = reject;
			}),
	);
	await user.click(next());
	expect(await screen.findByRole("status")).toHaveTextContent(
		"Writing a hard call for you…",
	);
	fail(new Error("The server is restarting."));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The server is restarting.",
	);
	// the step is back as it was left, with what was picked
	expect(screen.getByRole("button", { name: "1 Quality" })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	expect(screen.queryByRole("status")).toBeNull();
});

it("shows the persona it wrote to change and save, then how many of the owner's twins use it", async () => {
	answers.WorkTwinPersonaInterview = [DONE];
	answers.WorkSaveTwinPersona = {
		exists: true,
		sections: { ...SECTIONS, short: "Direct, brief and dry." },
		offTwins: ["twin-2"],
	};
	answers.MyProjects = [
		{ project_id: "twin-1", project_name: "Robin Twin" },
		{ project_id: "twin-2", project_name: "Client Twin" },
		{ project_id: "twin-3", project_name: "Team Twin" },
	];
	const user = renderInterview();
	await screen.findByRole("heading", {
		level: 2,
		name: "Here is what I wrote",
	});
	expect(screen.getByLabelText("Leave to you")).toHaveValue(
		"Stay out of: Hiring.",
	);
	expect(
		screen.getByText(/a twin can be talked into quoting what it was told/),
	).toBeVisible();
	expect(
		screen.getByRole("link", { name: "Keep grilling me" }),
	).toHaveAttribute("href", "/twins/persona/interview?go=more");
	// nothing is saved before the owner says so
	expect(ran()).toEqual(["WorkTwinPersonaInterview();"]);

	const short = screen.getByLabelText("In short");
	await user.clear(short);
	await user.type(short, "Direct, brief and dry.");
	await user.click(screen.getByRole("button", { name: "Save my persona" }));
	expect(
		await screen.findByRole("heading", {
			level: 1,
			name: "Meet your persona",
		}),
	).toHaveFocus();
	expect(
		screen.getByText("It now shapes how 2 of your Digital Twins answer."),
	).toBeVisible();
	expect(
		ran().find((statement) => statement.startsWith("WorkSaveTwinPersona")),
	).toBe(
		`WorkSaveTwinPersona(sections=[${JSON.stringify({ ...SECTIONS, short: "Direct, brief and dry." })}]);`,
	);
	expect(
		screen.getByRole("link", { name: "Open your persona" }),
	).toHaveAttribute("href", "/twins/persona");
	// opened from Digital Twins, it leads back there
	expect(
		screen.getByRole("link", { name: "Back to Digital Twins" }),
	).toHaveAttribute("href", "/twins");
	expect(screen.getByRole("link", { name: "Your persona" })).toHaveAttribute(
		"href",
		"/twins/persona",
	);
});

it("leads back to the persona's own page when it was opened from there, with no way to Digital Twins", async () => {
	answers.WorkTwinPersonaInterview = [DONE];
	answers.WorkSaveTwinPersona = {
		exists: true,
		sections: SECTIONS,
		offTwins: [],
	};
	answers.MyProjects = [];
	const user = renderOwnInterview();
	await screen.findByRole("heading", {
		level: 2,
		name: "Here is what I wrote",
	});
	expect(screen.getByRole("link", { name: "Your persona" })).toHaveAttribute(
		"href",
		"/persona",
	);
	expect(
		screen.getByRole("link", { name: "Keep grilling me" }),
	).toHaveAttribute("href", "/persona/interview?go=more");
	await user.click(screen.getByRole("button", { name: "Save my persona" }));
	await screen.findByRole("heading", { level: 1, name: "Meet your persona" });
	expect(
		screen.getByRole("link", { name: "Open your persona" }),
	).toHaveAttribute("href", "/persona");
	expect(screen.queryByRole("link", { name: /Digital Twins/ })).toBeNull();

	// and so does the way to write it by hand, when the interview cannot be opened
	cleanup();
	answers.WorkTwinPersonaInterview = [
		new Error("The interview needs Collaboration's text model."),
	];
	renderOwnInterview();
	expect(
		await screen.findByRole("link", { name: "Write it by hand" }),
	).toHaveAttribute("href", "/persona");
});

it("says the persona is for the owner's assistant as well as their twins, and after saving only when the assistant uses it", async () => {
	renderInterview();
	await screen.findByText("May I read how you write?");
	expect(
		screen.getByText(/Every Digital Twin you created then answers/),
	).toHaveTextContent(/your assistant writes for you the way you would/);
	expect(
		screen.getByText(/Nothing changes for your Digital Twins/),
	).toHaveTextContent(/or your assistant until you save/);

	// a server from before the switch says nothing of it, and uses the persona; a switch that is off is not spoken for
	for (const [assistant, isSaid] of [
		[undefined, true],
		[true, true],
		[false, false],
	] as const) {
		cleanup();
		answers.WorkTwinPersonaInterview = [DONE];
		answers.WorkSaveTwinPersona = {
			exists: true,
			sections: SECTIONS,
			offTwins: [],
			assistant,
		};
		answers.MyProjects = [];
		const user = renderInterview();
		await user.click(
			await screen.findByRole("button", { name: "Save my persona" }),
		);
		await screen.findByRole("heading", {
			level: 1,
			name: "Meet your persona",
		});
		expect(
			screen.getByText(
				"The next Digital Twin you create will answer this way.",
			),
		).toBeVisible();
		expect(
			screen.queryByText(
				"Your assistant writes email and Teams messages for you this way too.",
			) !== null,
		).toBe(isSaid);
	}
});

it("still shows the persona as saved when the twins cannot be counted, and keeps the review when the save is refused", async () => {
	answers.WorkTwinPersonaInterview = [DONE];
	answers.WorkSaveTwinPersona = new Error("Collaboration is not enabled.");
	const user = renderInterview();
	await screen.findByRole("heading", {
		level: 2,
		name: "Here is what I wrote",
	});
	await user.click(screen.getByRole("button", { name: "Save my persona" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Collaboration is not enabled.",
	);
	expect(screen.getByLabelText("In short")).toHaveValue("Direct and brief.");

	answers.WorkSaveTwinPersona = {
		exists: true,
		sections: SECTIONS,
		offTwins: [],
	};
	answers.MyProjects = new Error("The server is restarting.");
	await user.click(screen.getByRole("button", { name: "Save my persona" }));
	await screen.findByRole("heading", { level: 1, name: "Meet your persona" });
	expect(
		screen.getByText(
			"Your Digital Twins answer this way from their next chat.",
		),
	).toBeVisible();
});

it("goes on with an interview that was wrapped up when the address asks for it", async () => {
	answers.WorkTwinPersonaInterview = [
		{ ...PRIORITIES, checkpoint: undefined },
	];
	renderInterview("?go=more");
	await screen.findByRole("heading", {
		level: 2,
		name: "What wins when things conflict?",
	});
	expect(ran()).toEqual(["WorkTwinPersonaInterview(wrap=[false]);"]);
});

it("says why the interview cannot be opened, with the way to write the persona by hand", async () => {
	answers.WorkTwinPersonaInterview = [
		new Error("The interview needs Collaboration's text model."),
	];
	const user = renderInterview();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The interview needs Collaboration's text model.",
	);
	expect(
		screen.getByRole("link", { name: "Write it by hand" }),
	).toHaveAttribute("href", "/twins/persona");
	answers.WorkTwinPersonaInterview = [{ phase: "none" }];
	await user.click(screen.getByRole("button", { name: "Try again" }));
	expect(await screen.findByText("May I read how you write?")).toBeVisible();
});

it("says what could not be read where the interview starts, and lets the owner start over", async () => {
	answers.WorkTwinPersonaInterview = [
		{
			...LIMITS,
			progress: { answered: 0, of: 10 },
			notes: ["I found no Teams messages of yours to read."],
		},
	];
	const user = renderInterview();
	expect(
		await screen.findByText("I found no Teams messages of yours to read."),
	).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Start over" }));
	expect(screen.getByText("May I read how you write?")).toBeVisible();
	// nothing is thrown away until the owner starts again
	expect(ran()).toEqual(["WorkTwinPersonaInterview();"]);
});

it("goes back to the step before with what was answered there, and on from it unchanged when it is not touched", async () => {
	answers.WorkTwinPersonaInterview = [{ ...PRIORITIES, canBack: true }];
	const user = renderInterview();
	// the question of whether to wrap up can be left backwards too
	await screen.findByText("That is a solid start");
	answers.WorkTwinPersonaInterview = [
		{
			...LIMITS,
			canBack: true,
			previous: { picked: ["Hiring"], own: ["Vendor names"] },
		},
	];
	await user.click(screen.getByRole("button", { name: "Back" }));
	expect(
		await screen.findByRole("heading", {
			level: 2,
			name: LIMITS.step.title,
		}),
	).toHaveFocus();
	expect(ran().at(-1)).toBe("WorkTwinPersonaInterview(back=[true]);");
	expect(screen.getByRole("button", { name: "Hiring" })).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	expect(
		screen.getByRole("button", { name: "Remove Vendor names" }),
	).toBeVisible();

	answers.WorkTwinPersonaInterview = [PRIORITIES];
	await user.click(next());
	await screen.findByText("That is a solid start");
	expect(ran().at(-1)).toBe(
		'WorkTwinPersonaInterview(answer=[{"picked":["Hiring"],"own":["Vendor names"],"stepId":"limits"}]);',
	);
});

it("opens a step of several rounds at its last round when it is come back to, with what was picked", async () => {
	answers.WorkTwinPersonaInterview = [{ ...LIMITS, canBack: true }];
	const user = renderInterview();
	await screen.findByRole("heading", { level: 2, name: LIMITS.step.title });
	answers.WorkTwinPersonaInterview = [
		{
			...VOICE,
			canBack: true,
			previous: { rounds: { r1: { pick: "a" }, r2: { pick: "b" } } },
		},
	];
	await user.click(screen.getByRole("button", { name: "Back" }));
	expect(await screen.findByText("Step 2 of 11, part 2 of 2")).toBeVisible();
	expect(
		screen.getByRole("button", { name: "Reply B: Yes, happily." }),
	).toHaveAttribute("aria-pressed", "true");
	const calls = ran().length;
	await user.click(screen.getByRole("button", { name: "Back" }));
	expect(screen.getByText("Step 2 of 11, part 1 of 2")).toBeVisible();
	expect(
		screen.getByRole("button", { name: "Reply A: No." }),
	).toHaveAttribute("aria-pressed", "true");
	expect(ran()).toHaveLength(calls);

	// going on from it, the step that follows starts at its beginning
	await user.click(next());
	answers.WorkTwinPersonaInterview = [LIMITS];
	await user.click(next());
	await screen.findByRole("heading", { level: 2, name: LIMITS.step.title });
	expect(ran().at(-1)).toBe(
		'WorkTwinPersonaInterview(answer=[{"rounds":{"r1":{"pick":"a"},"r2":{"pick":"b"}},"stepId":"voice"}]);',
	);
});

it("stands the owner's own Microsoft photo at the centre of a scene, and their initials when it cannot be loaded", async () => {
	answers.WorkTwinPersonaInterview = [DONE];
	answers.WorkSaveTwinPersona = {
		exists: true,
		sections: SECTIONS,
		offTwins: [],
	};
	answers.MyProjects = [];
	const state = createInitialCollaborationState();
	state.liveProfile = {
		...state.profile,
		name: "Taylor Morgan",
		email: "taylor@example.invalid",
	};
	render(
		<CollaborationSessionProvider initialState={state}>
			<MemoryRouter initialEntries={["/twins/persona/interview"]}>
				<PersonaInterview />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
	await userEvent
		.setup()
		.click(await screen.findByRole("button", { name: "Save my persona" }));
	await screen.findByRole("heading", { level: 1, name: "Meet your persona" });
	// the portrait is decoration to a screen reader, so it is found as an element
	const photo = document.querySelector("img");
	expect(photo?.getAttribute("src")).toContain(
		"/msgraph/photo?email=taylor%40example.invalid",
	);
	expect(screen.queryByText("TM")).toBeNull();
	if (photo) fireEvent.error(photo);
	expect(document.querySelector("img")).toBeNull();
	expect(screen.getByText("TM")).toBeInTheDocument();
});
