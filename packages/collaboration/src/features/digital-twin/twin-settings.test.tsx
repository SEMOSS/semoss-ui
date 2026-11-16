import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { MembersTableProps } from "@semoss/shared";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { TwinSettings } from "./twin-settings";

// one actions object, as the provider gives; a new one per render would read again forever
const insight = vi.hoisted(() => ({ actions: { run: vi.fn() } }));
const catalog = vi.hoisted(() => ({
	skills: [] as { id: string; name: string; description: string }[],
	isLoading: false,
	error: null,
	refresh: vi.fn(),
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
	// the directory is there, so the people dialog offers it
	useConfig: () => true,
}));
vi.mock("@/features/routines/use-skill-catalog", () => ({
	useSkillCatalog: () => catalog,
}));
// the step that picks what a new twin knows reads the owner's mailbox; its own test covers it
vi.mock("./twin-knowledge-step", () => ({
	TwinKnowledgeStep: () => <p>The places to pick from</p>,
}));
// the shared table reads the server itself; which people it is given is this page's part
vi.mock("@semoss/shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/shared")>()),
	MembersTable: ({ source, isDirectoryAvailable }: MembersTableProps) => (
		<p>
			The people table, adding with "{source?.addLabel}"
			{isDirectoryAvailable ? " from the directory too" : ""}
		</p>
	),
}));

const TWIN = {
	workspace_id: "twin-1",
	name: "Robin Twin",
	system_prompt: "Answer briefly.",
	mcp: [
		{ id: "vec-1", name: "policies", type: "VECTOR" },
		{ id: "db-1", name: "Sales", type: "DATABASE" },
	],
	skills: [],
	prompts: [],
	config_json: { greeting: "Hello", greeting_enabled: true },
};
/** What the server answers each reactor with; an Error is a refusal. */
let answers: Record<string, unknown>;
const ran = (): string[] =>
	insight.actions.run.mock.calls.map(([statement]) => String(statement));

function renderSettings(search = "") {
	const router = createMemoryRouter(
		[
			{ path: "/twins/mine", element: <TwinSettings /> },
			{ path: "/twins", element: <p>The hub</p> },
		],
		{ initialEntries: [`/twins/mine${search}`] },
	);
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<RouterProvider router={router} />
		</CollaborationSessionProvider>,
	);
	return { router, user: userEvent.setup() };
}

beforeEach(() => {
	answers = {
		MyProjects: [{ project_id: "twin-1", project_name: "Robin Twin" }],
		GetWorkspace: TWIN,
	};
	insight.actions.run.mockReset();
	insight.actions.run.mockImplementation(async (statement: string) => {
		const answer = answers[statement.slice(0, statement.indexOf("("))];
		if (answer instanceof Error) throw answer;
		return {
			pixelReturn: [
				{ output: answer ?? true, operationType: ["OPERATION"] },
			],
		};
	});
});
afterEach(cleanup);

it("is the steps that create a twin for someone who has none, starting from their own name", async () => {
	answers.MyProjects = [];
	renderSettings();
	expect(
		await screen.findByRole("heading", {
			level: 1,
			name: "Create your Digital Twin",
		}),
	).toBeVisible();
	expect(
		screen.getByRole("heading", {
			level: 2,
			name: "Who is your Digital Twin?",
		}),
	).toBeVisible();
	expect(screen.getByLabelText("Instructions")).toHaveDisplayValue(
		/^You are the Digital Twin of Robin Hale:/,
	);
	// nothing to manage, share or delete yet
	expect(screen.queryByRole("tab")).toBeNull();
	expect(screen.queryByRole("button", { name: /Delete/ })).toBeNull();
});

it("keeps a twin just made on its own scene, and opens its people when the owner goes on to share it", async () => {
	answers.MyProjects = [];
	answers.AddDigitalTwin = "twin-1";
	const { user } = renderSettings();
	await user.type(
		await screen.findByLabelText("Name (required)"),
		"Robin Twin",
	);
	for (const label of ["Voice", "Abilities", "Knowledge", "Review"])
		await user.click(
			screen.getByRole("button", { name: `Next: ${label}` }),
		);
	await user.click(
		screen.getByRole("button", { name: "Create Digital Twin" }),
	);
	expect(
		await screen.findByRole("heading", {
			level: 1,
			name: "Meet Robin Twin",
		}),
	).toBeVisible();
	// the twin exists now, yet its page waits for the owner
	expect(screen.queryByRole("tab")).toBeNull();

	answers.MyProjects = [{ project_id: "twin-1", project_name: "Robin Twin" }];
	await user.click(
		screen.getByRole("link", { name: "Share it with people" }),
	);
	expect(
		await screen.findByText(
			'The people table, adding with "Add People" from the directory too',
		),
	).toBeVisible();
	expect(screen.getByRole("tab", { name: "People" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
});

it("shows the owner's twin with its profile, its people and the ways on from it", async () => {
	const { user } = renderSettings();
	expect(
		await screen.findByRole("heading", { level: 1, name: "Robin Twin" }),
	).toBeVisible();
	expect(screen.getByRole("link", { name: "What it knows" })).toHaveAttribute(
		"href",
		"/twins/mine/contents",
	);
	expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute(
		"href",
		"/twins/chat?agentId=twin-1",
	);
	expect(screen.getByLabelText("Name (required)")).toHaveValue("Robin Twin");
	expect(screen.getByLabelText("Greeting")).toHaveValue("Hello");
	// a knowledge base is not a toolbox; the form leaves it to the save to keep
	expect(screen.getByText("Sales")).toBeVisible();
	expect(screen.queryByText("policies")).toBeNull();

	await user.type(screen.getByLabelText("Greeting"), " again");
	await user.click(screen.getByRole("tab", { name: "People" }));
	expect(
		screen.getByText(
			'The people table, adding with "Add People" from the directory too',
		),
	).toBeVisible();
	// the half-made change is still there after a look at People
	await user.click(screen.getByRole("tab", { name: "Profile" }));
	expect(screen.getByLabelText("Greeting")).toHaveValue("Hello again");
});

it("deletes the twin only after the owner confirms, then goes back to the hub", async () => {
	const { router, user } = renderSettings();
	await user.click(
		await screen.findByRole("button", { name: "Delete Digital Twin" }),
	);
	const dialog = screen.getByRole("dialog", { name: "Delete Robin Twin?" });
	expect(ran().some((statement) => statement.startsWith("Delete"))).toBe(
		false,
	);
	await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
	expect(screen.queryByRole("dialog")).toBeNull();
	expect(ran().some((statement) => statement.startsWith("Delete"))).toBe(
		false,
	);

	await user.click(
		screen.getByRole("button", { name: "Delete Digital Twin" }),
	);
	await user.click(
		within(screen.getByRole("dialog")).getByRole("button", {
			name: "Delete",
		}),
	);
	expect(await screen.findByText("The hub")).toBeVisible();
	expect(ran().at(-1)).toBe('DeleteWorkspace(workspaceId=["twin-1"]);');
	expect(router.state.location.pathname).toBe("/twins");
});

it("keeps the twin and says why when the server refuses to delete it", async () => {
	answers.DeleteWorkspace = new Error("Only admins can delete agents");
	const { router, user } = renderSettings();
	await user.click(
		await screen.findByRole("button", { name: "Delete Digital Twin" }),
	);
	const dialog = screen.getByRole("dialog");
	await user.click(within(dialog).getByRole("button", { name: "Delete" }));
	expect(await within(dialog).findByRole("alert")).toHaveTextContent(
		"Only admins can delete agents",
	);
	expect(
		within(dialog).getByRole("button", { name: "Delete" }),
	).toBeEnabled();
	expect(router.state.location.pathname).toBe("/twins/mine");
});

it("says when the twin could not be read, and reads again on request", async () => {
	answers.GetWorkspace = new Error("The server is restarting");
	const { user } = renderSettings();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The server is restarting",
	);
	answers.GetWorkspace = TWIN;
	await user.click(screen.getByRole("button", { name: "Try again" }));
	expect(
		await screen.findByRole("heading", { level: 1, name: "Robin Twin" }),
	).toBeVisible();
});
