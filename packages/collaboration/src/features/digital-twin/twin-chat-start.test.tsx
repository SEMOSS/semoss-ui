import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import type { ComposerPrompt } from "@/features/rooms/components/room-composer.types";
import { readOpenedTwins } from "./opened-twins";
import { TwinChatStart } from "./twin-chat-start";

// one actions object, as the provider gives; a new one per render would read again forever
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
// the ask box opens a room of its own; where it shows is what this page decides, and that its
// agent stays the twin: an ask box whose agent could be changed is not "The ask box" here
vi.mock("@/features/daily-chat/landing-chat-composer", () => ({
	LandingChatComposer: ({
		isAgentLocked,
		starterPrompts,
	}: {
		isAgentLocked?: boolean;
		starterPrompts?: readonly ComposerPrompt[];
	}) => (
		<>
			<p>{isAgentLocked ? "The ask box" : "An ask box for any agent"}</p>
			{starterPrompts?.map((prompt) => (
				<span key={prompt.id}>{prompt.title}</span>
			))}
		</>
	),
}));

const answer = (output: unknown) => ({
	pixelReturn: [{ output, operationType: ["OPERATION"] }],
});
const twin = (config_json: unknown) => ({
	workspace_id: "twin-2",
	name: "Dana Ortiz Twin",
	system_prompt: "",
	digital_twin_file_access: "read",
	config_json,
});
/** The twin's row in the list, the read that names whose twin it is. */
const row = (owner: string | null) => [
	{
		project_id: "twin-2",
		project_name: "dana",
		digital_twin_owner_name: owner,
	},
];
/** Answers the twin's own read with `workspace` and every read of the list with `rows`. */
const serve = (workspace: unknown, rows: unknown) =>
	insight.actions.run.mockImplementation(async (pixel: string) =>
		answer(pixel.startsWith("GetWorkspace(") ? workspace : rows),
	);

beforeEach(() => {
	localStorage.clear();
	insight.actions.run.mockReset();
});
afterEach(cleanup);

const STATE = createInitialCollaborationState();
/** Who the marks are kept for. */
const PERSON = STATE.profile.email || STATE.profile.id;

const renderStart = (agentId: string) =>
	render(
		<CollaborationSessionProvider initialState={STATE}>
			<MemoryRouter>
				<TwinChatStart agentId={agentId} />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);

it("shows who the twin is and whose, its greeting as written, and the ask box", async () => {
	serve(
		twin({
			greeting: "Ask me about the **renewal**.",
			greeting_enabled: true,
		}),
		row("Dana Ortiz"),
	);
	renderStart("twin-2");
	expect(screen.getByText("Loading the Digital Twin…")).toBeInTheDocument();
	expect(
		await screen.findByRole("heading", {
			level: 1,
			name: "Dana Ortiz Twin",
		}),
	).toBeVisible();
	expect(insight.actions.run.mock.calls).toEqual([
		[
			'GetWorkspace(workspaceId=["twin-2"], includeDigitalTwinFileAccess=[true]);',
		],
		[
			'MyProjects(projectType=["WORKSPACE"], metaFilters=[{"digital_twin":["true"]}], noMeta=[true], project=["twin-2"], limit=[1]);',
		],
	]);
	// a twin's name is its owner's to choose, so the page says whose it is
	expect(screen.getByText("Shared by Dana Ortiz")).toBeVisible();
	// Markdown, not its source
	expect(screen.getByText("renewal").tagName).toBe("STRONG");
	expect(screen.getByText(/Ask this AI twin/)).toBeVisible();
	expect(screen.getByText("The ask box")).toBeVisible();
	expect(
		screen.getByText(/no access to your own mail, calendar, or files/),
	).toBeVisible();
	expect(screen.getByText("Find a source")).toBeVisible();
	expect(screen.queryByText("Add a document")).toBeNull();
	expect(screen.queryByText("Choose What This Twin Shares")).toBeNull();
	expect([...readOpenedTwins(PERSON)]).toEqual(["twin-2"]);
});

it("explains approval and original files to the owner and links to this twin’s copies", async () => {
	serve(
		{
			...twin({}),
			permission: "OWNER",
			digital_twin_file_access: "manage",
		},
		row("Robin Hale"),
	);
	renderStart("twin-2");
	expect(
		await screen.findByRole("heading", {
			name: "Choose What This Twin Shares",
		}),
	).toBeVisible();
	// their own twin is "this twin"; it is not named after them a second time
	expect(screen.getByText(/^This twin answers/)).toBeVisible();
	expect(screen.queryByText(/^Shared by/)).toBeNull();
	expect(
		screen.getByText(
			/deleting its saved copy.*approve each change.*original files/i,
		),
	).toBeVisible();
	expect(
		screen.getByRole("link", { name: "View shared documents" }),
	).toHaveAttribute("href", "/twins/mine/contents?twinId=twin-2&in=files");
	expect(screen.getByText("Add a document")).toBeVisible();
	expect(screen.queryByText("Find a source")).toBeNull();
});

it("describes approved additions on a server that only supports adding copies in chat", async () => {
	serve(
		{
			...twin({}),
			permission: "OWNER",
			digital_twin_file_access: undefined,
		},
		[{ project_id: "twin-2", project_name: "Dana Ortiz Twin" }],
	);
	renderStart("twin-2");
	expect(await screen.findByText(/approve each addition/)).toBeVisible();
	expect(screen.queryByText(/deleting its saved copy/)).toBeNull();
	expect(
		screen.getByRole("link", { name: "View or remove shared documents" }),
	).toHaveAttribute("href", "/twins/mine/contents?twinId=twin-2&in=files");
});

it.each([
	{ why: "the server cannot tell", rows: row(null) },
	{ why: "the list cannot be read", rows: { error: "not a list" } },
])(
	"opens a shared twin without naming its owner when $why",
	async ({ rows }) => {
		serve(twin({}), rows);
		renderStart("twin-2");
		expect(await screen.findByText(/^Ask this AI twin/)).toBeVisible();
		expect(screen.getByText("The ask box")).toBeVisible();
		expect(screen.queryByText(/^Shared by/)).toBeNull();
	},
);

it("shows no greeting for a twin whose greeting is off", async () => {
	insight.actions.run.mockResolvedValue(
		answer(
			twin({ greeting: "A draft nobody sees", greeting_enabled: false }),
		),
	);
	renderStart("twin-2");
	expect(await screen.findByText("The ask box")).toBeVisible();
	expect(screen.queryByText("A draft nobody sees")).toBeNull();
});

it("says so instead of offering a chat with a twin the person cannot open", async () => {
	insight.actions.run.mockRejectedValue(
		new Error("User unauthorized to perform this operation"),
	);
	renderStart("twin-3");
	const alert = await screen.findByRole("alert");
	expect(alert).toHaveTextContent("This Digital Twin could not be opened");
	expect(alert).toHaveTextContent(
		"User unauthorized to perform this operation",
	);
	expect(screen.queryByText("The ask box")).toBeNull();
	// a twin that did not open stays new
	expect(readOpenedTwins(PERSON).size).toBe(0);
	expect(screen.getByRole("link", { name: "Digital Twins" })).toHaveAttribute(
		"href",
		"/twins",
	);
});

it("asks the server nothing for a link that names no twin", async () => {
	renderStart("");
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The link names no Digital Twin.",
	);
	expect(insight.actions.run).not.toHaveBeenCalled();
	expect(screen.queryByText("The ask box")).toBeNull();
});
