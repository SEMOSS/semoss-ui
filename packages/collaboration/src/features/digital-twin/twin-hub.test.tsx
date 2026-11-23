import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { markTwinOpened } from "./opened-twins";
import { TwinHub } from "./twin-hub";

// one actions object, as the provider gives; a new one per render would read again forever
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
// the copies that wait for the owner in their twins, which the shell reads once for every page
const waiting = vi.hoisted(() => ({ updates: [] as { twinId: string }[] }));
vi.mock("@/features/dashboard/dashboard.context", () => ({
	useTwinUpdates: () => ({ data: { updates: waiting.updates } }),
}));

const ROBIN = { project_id: "twin-1", project_name: "Robin Twin" };
const DANA = {
	project_id: "twin-2",
	project_name: "dana",
	project_display_name: "Dana Ortiz Twin",
};
/** The twins the server lists: the caller's own, then everyone's they can chat with. */
let twins: { mine: unknown; all: unknown };
const NO_SECTIONS = {
	short: "",
	voice: "",
	decide: "",
	review: "",
	stands: "",
	people: "",
	limits: "",
	examples: "",
};
/** The caller's persona as the server answers it; none until a test writes one. */
let persona: unknown;

beforeEach(() => {
	localStorage.clear();
	twins = { mine: [], all: [] };
	persona = { exists: false, sections: NO_SECTIONS, offTwins: [] };
	waiting.updates = [];
	insight.actions.run.mockReset();
	insight.actions.run.mockImplementation(async (statement: string) => {
		const answer = statement.startsWith("WorkGetTwinPersona")
			? persona
			: statement.includes("createdByMe=[true]")
				? twins.mine
				: twins.all;
		if (answer instanceof Error) throw answer;
		return {
			pixelReturn: [{ output: answer, operationType: ["OPERATION"] }],
		};
	});
});
afterEach(cleanup);

const STATE = createInitialCollaborationState();
/** Who the marks are kept for. */
const PERSON = STATE.profile.email || STATE.profile.id;

const renderHub = () =>
	render(
		<CollaborationSessionProvider initialState={STATE}>
			<MemoryRouter>
				<TwinHub />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);

it("offers to create a twin to someone who has none, and says nothing is shared with them", async () => {
	renderHub();
	expect(screen.getByText("Loading Digital Twins…")).toBeInTheDocument();
	expect(
		await screen.findByRole("link", { name: "Create a Twin to Share" }),
	).toHaveAttribute("href", "/twins/mine?create=true");
	expect(
		screen.getByText(/No one has shared a Digital Twin with you yet/),
	).toBeVisible();
	expect(
		screen.getByText(
			"You are not sharing a twin yet. Create one, choose what it knows, then name the people who can ask it about you.",
		),
	).toBeVisible();
	// nothing is said of what shared twins know while there is none
	expect(screen.queryByText(/Each knows only/)).toBeNull();
	// the only chat is with their own twin
	expect(screen.getAllByRole("link", { name: /^Chat/ })).toHaveLength(1);
	expect(
		screen.getByRole("link", { name: "Chat: Your Digital Twin" }),
	).toHaveAttribute("href", "/");
});

it("leads with the person's own Digital Twin, whatever the lists below it are doing", async () => {
	// while the twins are read
	insight.actions.run.mockReturnValue(new Promise(() => undefined));
	const loading = renderHub();
	expect(screen.getByText("Loading Digital Twins…")).toBeInTheDocument();
	expect(
		screen.getByRole("region", { name: "Your Digital Twin" }),
	).toHaveTextContent(
		"Private to you. Works with your mail, Teams, calendar, files, work and routines.",
	);
	expect(
		screen.getByText(
			"Your own Digital Twin, the twins you share, and the twins other people share with you.",
		),
	).toBeVisible();
	loading.unmount();

	// after they could not be read
	insight.actions.run.mockRejectedValue(
		new Error("The server is restarting"),
	);
	renderHub();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The server is restarting",
	);
	expect(
		within(
			screen.getByRole("region", { name: "Your Digital Twin" }),
		).getByRole("link", { name: "Chat: Your Digital Twin" }),
	).toBeVisible();
});

it("shows all the owner's twins with their own links, and each shared twin with its chat", async () => {
	const research = { project_id: "twin-3", project_name: "Research Twin" };
	twins = { mine: [ROBIN, research], all: [ROBIN, research, DANA] };
	renderHub();
	const mine = within(
		await screen.findByRole("region", { name: "Twins You Share" }),
	);
	expect(
		mine.getByRole("heading", { level: 3, name: "Robin Twin" }),
	).toBeVisible();
	expect(
		mine.getByRole("link", { name: "Manage: Robin Twin" }),
	).toHaveAttribute("href", "/twins/mine?twinId=twin-1");
	expect(
		mine.getByRole("link", { name: "What it knows: Robin Twin" }),
	).toHaveAttribute("href", "/twins/mine/contents?twinId=twin-1");
	expect(
		mine.getByRole("link", { name: "Chat: Robin Twin" }),
	).toHaveAttribute("href", "/twins/chat?agentId=twin-1");
	expect(
		screen.getByRole("link", { name: "Create a Twin to Share" }),
	).toHaveAttribute("href", "/twins/mine?create=true");
	expect(mine.getAllByRole("listitem")).toHaveLength(2);
	expect(
		mine.getByRole("link", { name: "Manage: Research Twin" }),
	).toHaveAttribute("href", "/twins/mine?twinId=twin-3");
	expect(
		mine.getByRole("link", { name: "What it knows: Research Twin" }),
	).toHaveAttribute("href", "/twins/mine/contents?twinId=twin-3");

	// the owner's own twin is not listed again among the shared ones
	const shared = within(
		screen.getByRole("region", { name: "Shared With You" }),
	);
	expect(shared.getAllByRole("listitem")).toHaveLength(1);
	expect(
		shared.getByRole("link", { name: "Chat: Dana Ortiz Twin" }),
	).toHaveAttribute("href", "/twins/chat?agentId=twin-2");
	expect(shared.queryByRole("link", { name: /Manage/ })).toBeNull();
});

it("says when the twins could not be read, and reads again on request", async () => {
	twins.all = new Error("The server is restarting");
	renderHub();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The server is restarting",
	);
	twins.all = [DANA];
	await userEvent.click(screen.getByRole("button", { name: "Try again" }));
	expect(
		await screen.findByRole("link", { name: "Chat: Dana Ortiz Twin" }),
	).toBeVisible();
});

it("marks a twin shared with the person as new until its chat has been opened in this browser", async () => {
	const lee = { project_id: "twin-4", project_name: "Lee Park Twin" };
	twins = { mine: [ROBIN], all: [ROBIN, DANA, lee] };
	markTwinOpened(PERSON, "twin-4");
	// what someone else opened in this browser is theirs
	markTwinOpened("someone-else@example.com", "twin-2");
	renderHub();
	const [dana, park] = within(
		await screen.findByRole("region", { name: "Shared With You" }),
	).getAllByRole("listitem");
	expect(within(dana).getByText("New")).toBeVisible();
	expect(within(park).queryByText("New")).toBeNull();
	// the person's own twins are never new to them
	expect(
		within(
			screen.getByRole("region", { name: "Twins You Share" }),
		).queryByText("New"),
	).toBeNull();
});

it("marks every shared twin as new when what this browser remembers cannot be read", async () => {
	localStorage.setItem(
		`semoss:collaboration:opened-twins:v1:${encodeURIComponent(PERSON)}`,
		'{"version":1,"ids":"twin-2"}',
	);
	twins = { mine: [], all: [DANA] };
	renderHub();
	expect(await screen.findByText("New")).toBeVisible();
});

it("says on each of the owner's twins how many copies wait for them, linking to its Updates", async () => {
	twins = { mine: [ROBIN, DANA], all: [ROBIN, DANA] };
	waiting.updates = [
		{ twinId: "twin-1" },
		{ twinId: "twin-1" },
		{ twinId: "twin-1" },
	];
	renderHub();
	expect(
		await screen.findByRole("link", {
			name: "3 updates to review: Robin Twin",
		}),
	).toHaveAttribute("href", "/twins/mine/contents?twinId=twin-1&in=updates");
	// a twin nothing waits in says nothing
	expect(
		screen.queryByRole("link", { name: /to review: Dana Ortiz Twin/ }),
	).not.toBeInTheDocument();
});

it("puts the owner's persona above their twins, counting the twins that use it", async () => {
	twins = { mine: [ROBIN, DANA], all: [ROBIN, DANA] };
	persona = {
		exists: true,
		sections: { ...NO_SECTIONS, short: "Runs renewals." },
		offTwins: ["twin-2"],
	};
	renderHub();
	const card = within(
		await screen.findByRole("region", { name: "Your persona" }),
	);
	expect(await card.findByText("Runs renewals.")).toBeVisible();
	expect(
		card.getByText(
			"Your Digital Twin uses it. Used by 1 of the 2 twins you share.",
		),
	).toBeVisible();
	expect(
		card.getByRole("link", { name: "Open your persona" }),
	).toHaveAttribute("href", "/twins/persona");
	// the person's own twin leads the page, then their persona, then the twins they share and the ones shared with them
	expect(
		screen
			.getAllByRole("heading", { level: 2 })
			.map((heading) => heading.textContent),
	).toEqual([
		"Your Digital Twin",
		"Your persona",
		"Twins You Share",
		"Shared With You",
	]);
	const regions = screen
		.getAllByRole("region")
		.map((region) => region.getAttribute("aria-labelledby"));
	expect(regions[0]).toBe(
		screen.getByRole("heading", { level: 2, name: "Your Digital Twin" }).id,
	);
	expect(regions[1]).toBe(
		screen.getByRole("heading", { level: 2, name: "Your persona" }).id,
	);
	expect(
		screen.getByText("Each knows only what you copied into it."),
	).toBeVisible();
});

it("still lists the twins when the persona cannot be read", async () => {
	twins = { mine: [ROBIN], all: [ROBIN] };
	persona = new Error("The server is restarting.");
	renderHub();
	expect(
		await screen.findByRole("link", { name: "Manage: Robin Twin" }),
	).toBeVisible();
	// the persona is read beside the twins, so its failure can land after they are listed
	expect(
		await within(
			screen.getByRole("region", { name: "Your persona" }),
		).findByRole("alert"),
	).toHaveTextContent("The server is restarting.");
});

it("expands the owned gallery and searches every twin and shared owner without changing persona usage", async () => {
	const user = userEvent.setup();
	const ownRows = ["Planning", "Handoffs", "Research", "Reviews"].map(
		(name, index) => ({
			project_id: `owned-${index}`,
			project_name: name,
		}),
	);
	twins = {
		mine: ownRows,
		all: [...ownRows, { ...DANA, digital_twin_owner_name: "Maya Chen" }],
	};
	persona = {
		exists: true,
		sections: { ...NO_SECTIONS, short: "Direct and collaborative." },
		offTwins: [],
	};
	renderHub();
	const own = within(
		await screen.findByRole("region", { name: "Twins You Share" }),
	);
	expect(own.getAllByRole("listitem")).toHaveLength(3);
	await user.click(own.getByRole("button", { name: "View all 4" }));
	expect(own.getAllByRole("listitem")).toHaveLength(4);
	await user.click(own.getByRole("button", { name: "Show fewer" }));
	expect(own.getAllByRole("listitem")).toHaveLength(3);
	const search = screen.getByRole("searchbox", {
		name: "Find a twin or owner",
	});
	await user.type(search, "reviews");
	expect(own.getByRole("link", { name: "Chat: Reviews" })).toBeVisible();
	await user.clear(search);
	await user.type(search, "mAyA");
	expect(screen.getByText("By Maya Chen")).toBeVisible();
	expect(
		screen.queryByRole("region", { name: "Twins You Share" }),
	).toBeNull();
	expect(
		screen.getByText(
			"Your Digital Twin uses it. Used by all 4 twins you share.",
		),
	).toBeVisible();
	// the person's own twin is no search result: it stays whatever is searched for
	expect(
		screen.getByRole("region", { name: "Your Digital Twin" }),
	).toBeVisible();
	await user.type(search, "xyz");
	expect(
		screen.getByRole("heading", { name: "No matching twins" }),
	).toBeVisible();
	expect(
		screen.getByRole("region", { name: "Your Digital Twin" }),
	).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Clear search" }));
	expect(search).toHaveFocus();
	expect(
		within(
			screen.getByRole("region", { name: "Twins You Share" }),
		).getAllByRole("listitem"),
	).toHaveLength(3);
});
