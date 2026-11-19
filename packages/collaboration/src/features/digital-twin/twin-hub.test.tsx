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

const ROBIN = { project_id: "twin-1", project_name: "Robin Twin" };
const DANA = {
	project_id: "twin-2",
	project_name: "dana",
	project_display_name: "Dana Ortiz Twin",
};
/** The twins the server lists: the caller's own, then everyone's they can chat with. */
let twins: { mine: unknown; all: unknown };

beforeEach(() => {
	localStorage.clear();
	twins = { mine: [], all: [] };
	insight.actions.run.mockReset();
	insight.actions.run.mockImplementation(async (statement: string) => {
		const answer = statement.includes("createdByMe=[true]")
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
		await screen.findByRole("link", { name: "Create Digital Twin" }),
	).toHaveAttribute("href", "/twins/mine?create=true");
	expect(
		screen.getByText(/No one has shared a Digital Twin with you yet/),
	).toBeVisible();
	expect(screen.queryByRole("link", { name: /Chat/ })).toBeNull();
});

it("shows all the owner's twins with their own links, and each shared twin with its chat", async () => {
	const research = { project_id: "twin-3", project_name: "Research Twin" };
	twins = { mine: [ROBIN, research], all: [ROBIN, research, DANA] };
	renderHub();
	const mine = within(
		await screen.findByRole("region", { name: "Your Digital Twins" }),
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
		screen.getByRole("link", { name: "Create Digital Twin" }),
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
		screen.getByRole("region", { name: "Shared with you" }),
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
		await screen.findByRole("region", { name: "Shared with you" }),
	).getAllByRole("listitem");
	expect(within(dana).getByText("New")).toBeVisible();
	expect(within(park).queryByText("New")).toBeNull();
	// the person's own twins are never new to them
	expect(
		within(
			screen.getByRole("region", { name: "Your Digital Twins" }),
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
