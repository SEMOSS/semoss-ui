import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { MembersTableProps } from "@semoss/shared";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { TwinSettingsPage } from "@/pages/twin-settings.page";

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
			{ path: "/twins/mine", element: <TwinSettingsPage /> },
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
		/^Answer the way Robin Hale would explain it to a colleague:/,
	);
	// nothing to manage, share or delete yet
	expect(screen.queryByRole("tab")).toBeNull();
	expect(screen.queryByRole("button", { name: /Delete/ })).toBeNull();
});

it("opens creation even when the owner already has a twin", async () => {
	renderSettings("?create=true");
	expect(
		await screen.findByRole("heading", {
			level: 1,
			name: "Create your Digital Twin",
		}),
	).toBeVisible();
	expect(
		ran().some((statement) => statement.startsWith("GetWorkspace")),
	).toBe(false);
	expect(
		screen.queryByRole("button", { name: "Delete Digital Twin" }),
	).toBeNull();
});

it("keeps the chosen twin through tab changes and deletes only that twin", async () => {
	answers.MyProjects = [
		{ project_id: "first", project_name: "First Twin" },
		{ project_id: "twin-1", project_name: "Robin Twin" },
	];
	const { router, user } = renderSettings("?twinId=twin-1");
	await screen.findByRole("heading", { name: "Robin Twin", level: 1 });
	expect(ran()).toContain('GetWorkspace(workspaceId=["twin-1"]);');
	await user.click(
		screen.getByRole("button", { name: "Instructions and greeting" }),
	);
	await user.type(screen.getByLabelText("Greeting"), " again");
	await user.click(screen.getByRole("tab", { name: "People" }));
	expect(router.state.location.search).toBe("?twinId=twin-1&tab=people");
	await user.click(screen.getByRole("tab", { name: "Profile" }));
	expect(router.state.location.search).toBe("?twinId=twin-1");
	expect(screen.getByLabelText("Greeting")).toHaveValue("Hello again");
	await user.click(
		screen.getByRole("button", { name: "Delete Digital Twin" }),
	);
	await user.click(
		within(screen.getByRole("dialog")).getByRole("button", {
			name: "Delete",
		}),
	);
	await screen.findByText("The hub");
	expect(
		ran().filter((statement) => statement.startsWith("DeleteWorkspace")),
	).toEqual(['DeleteWorkspace(workspaceId=["twin-1"]);']);
});

it("flushes pending edits to their own twin and opens the next twin with its own profile", async () => {
	answers.MyProjects = [
		{ project_id: "twin-1", project_name: "Robin Twin" },
		{ project_id: "twin-2", project_name: "Research Twin" },
	];
	const { router, user } = renderSettings("?twinId=twin-1");
	await user.click(
		await screen.findByRole("button", {
			name: "Instructions and greeting",
		}),
	);
	await user.type(await screen.findByLabelText("Greeting"), " unsaved");
	await user.click(
		screen.getByRole("button", { name: "Delete Digital Twin" }),
	);
	answers.GetWorkspace = {
		...TWIN,
		workspace_id: "twin-2",
		name: "Research Twin",
	};
	await act(async () => {
		await router.navigate("/twins/mine?twinId=twin-2");
	});
	await user.click(
		await screen.findByRole("button", { name: "Name and portrait" }),
	);
	expect(await screen.findByLabelText("Name (required)")).toHaveValue(
		"Research Twin",
	);
	await user.click(
		screen.getByRole("button", { name: "Instructions and greeting" }),
	);
	expect(screen.getByLabelText("Greeting")).toHaveValue("Hello");
	expect(screen.queryByRole("dialog")).toBeNull();
	await vi.waitFor(
		() => {
			const edits = ran().filter((statement) =>
				statement.startsWith("EditWorkspace("),
			);
			expect(edits).toHaveLength(1);
			expect(edits[0]).toContain('workspaceId=["twin-1"]');
			expect(edits[0]).toContain('greeting="Hello unsaved"');
		},
		{ timeout: 2500 },
	);
});

it("does not turn an unavailable twin into a blank create form", async () => {
	renderSettings("?twinId=missing");
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"not yours to manage",
	);
	expect(screen.queryByLabelText("Name (required)")).toBeNull();
	expect(
		ran().some((statement) => statement.startsWith("GetWorkspace")),
	).toBe(false);
});

it("offers to keep failed edits or leave the page without sending another write", async () => {
	answers.EditWorkspace = new Error("Workspace is offline");
	const { router, user } = renderSettings("?twinId=twin-1");
	await user.click(
		await screen.findByRole("button", {
			name: "Instructions and greeting",
		}),
	);
	await user.type(screen.getByLabelText("Greeting"), " there");
	const back = screen.getByRole("link", { name: "Digital Twins" });
	await user.click(back);
	const prompt = await screen.findByRole("dialog", {
		name: "Leave with unsaved changes?",
	});
	expect(prompt).toHaveAccessibleDescription(/Workspace is offline/);
	expect(router.state.location.pathname).toBe("/twins/mine");
	const keepEditing = within(prompt).getByRole("button", {
		name: "Keep editing",
	});
	expect(keepEditing).toHaveFocus();
	await user.click(keepEditing);
	await vi.waitFor(() => expect(back).toHaveFocus());
	expect(screen.getByLabelText("Greeting")).toHaveValue("Hello there");
	await user.click(back);
	const leave = await screen.findByRole("button", {
		name: "Leave without saving",
	});
	const beforeLeaving = ran().filter((statement) =>
		statement.startsWith("EditWorkspace("),
	);
	expect(beforeLeaving.length).toBeGreaterThan(0);
	await user.click(leave);
	expect(await screen.findByText("The hub")).toBeVisible();
	expect(
		ran().filter((statement) => statement.startsWith("EditWorkspace(")),
	).toEqual(beforeLeaving);
});

it("creates another twin and opens that new twin's people after setup", async () => {
	const existing = {
		project_id: "existing-twin",
		project_name: "Existing Twin",
	};
	answers.MyProjects = [existing];
	answers.AddDigitalTwin = "twin-1";
	const { router, user } = renderSettings("?create=true");
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

	answers.MyProjects = [
		existing,
		{ project_id: "twin-1", project_name: "Robin Twin" },
	];
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
	expect(router.state.location.search).toBe("?twinId=twin-1&tab=people");
	expect(
		ran().filter((statement) => statement.startsWith("GetWorkspace")),
	).toEqual(['GetWorkspace(workspaceId=["twin-1"]);']);
});

it("shows the owner's twin with its profile, its people and the ways on from it", async () => {
	const { user } = renderSettings();
	expect(
		await screen.findByRole("heading", { level: 1, name: "Robin Twin" }),
	).toBeVisible();
	expect(screen.getByRole("link", { name: "What it knows" })).toHaveAttribute(
		"href",
		"/twins/mine/contents?twinId=twin-1",
	);
	expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute(
		"href",
		"/twins/chat?agentId=twin-1",
	);
	for (const name of [
		"Name and portrait",
		"Instructions and greeting",
		"About you",
		"Skills and toolboxes",
	]) {
		expect(screen.getByRole("button", { name })).toHaveAttribute(
			"aria-expanded",
			"false",
		);
	}
	expect(
		screen.getByRole("button", { name: "Name and portrait" }),
	).toHaveAccessibleDescription("Robin Twin");
	expect(
		screen.getByRole("button", { name: "Instructions and greeting" }),
	).toHaveAccessibleDescription("Answer briefly.");
	await user.click(screen.getByRole("button", { name: "Name and portrait" }));
	expect(screen.getByLabelText("Name (required)")).toHaveValue("Robin Twin");
	await user.click(
		screen.getByRole("button", { name: "Instructions and greeting" }),
	);
	expect(screen.getByLabelText("Greeting")).toHaveValue("Hello");
	// a knowledge base is not a toolbox; the form leaves it to the save to keep
	await user.click(
		screen.getByRole("button", { name: "Skills and toolboxes" }),
	);
	expect(screen.getByText("Sales")).toBeVisible();
	expect(screen.queryByText("policies")).toBeNull();

	await user.type(screen.getByLabelText("Greeting"), " again");
	await user.click(screen.getByRole("tab", { name: "People" }));
	expect(
		screen.getByText(
			'The people table, adding with "Add People" from the directory too',
		),
	).toBeVisible();
	await act(async () =>
		vi.waitFor(
			() =>
				expect(
					ran().filter((statement) =>
						statement.startsWith("EditWorkspace("),
					),
				).toEqual([expect.stringContaining('greeting="Hello again"')]),
			{ timeout: 2500 },
		),
	);
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

it("shows the owner's note with the profile, read from the twin's files", async () => {
	// one listing answers for the project's top folder and for its files folder
	answers.BrowseAppAssets = [
		{ name: "public", path: "/public", type: "directory" },
		{ name: "About me.md", path: "/public/About me.md" },
	];
	answers.GetAppAssets = "I run renewals.";
	const { user } = renderSettings();
	await user.click(await screen.findByRole("button", { name: "About you" }));
	expect(screen.getByRole("textbox", { name: "About you" })).toHaveValue(
		"I run renewals.",
	);
	expect(ran()).toContain(
		'GetAppAssets(filePath=["/public/About me.md"], project=["twin-1"]);',
	);
});

it("opens the twin with its note locked when the twin's files cannot be read", async () => {
	answers.BrowseAppAssets = new Error("The server is restarting");
	const { user } = renderSettings();
	await user.click(await screen.findByRole("button", { name: "About you" }));
	const about = screen.getByRole("textbox", { name: "About you" });
	expect(about).toBeDisabled();
	expect(about).toHaveValue("");
	expect(about).toHaveAccessibleDescription(/could not be read just now/);
	// the rest of the page is there to use
	await user.click(screen.getByRole("button", { name: "Name and portrait" }));
	expect(screen.getByLabelText("Name (required)")).toHaveValue("Robin Twin");
	expect(screen.getByRole("tab", { name: "People" })).toBeVisible();
});

const PERSONA = {
	exists: true,
	sections: {
		short: "Runs renewals.",
		voice: "",
		decide: "",
		review: "",
		stands: "",
		people: "",
		limits: "",
		examples: "",
	},
	offTwins: [] as string[],
};

it("shows whether the twin uses its owner's persona, read with the twin", async () => {
	answers.WorkGetTwinPersona = PERSONA;
	renderSettings("?twinId=twin-1");
	expect(
		await screen.findByRole("switch", { name: "Use my persona" }),
	).toBeChecked();
	cleanup();

	// switched off for this twin, and on for the rest
	answers.WorkGetTwinPersona = { ...PERSONA, offTwins: ["twin-1"] };
	renderSettings("?twinId=twin-1");
	expect(
		await screen.findByRole("switch", { name: "Use my persona" }),
	).not.toBeChecked();
});

it("opens the twin without the switch when the persona cannot be read, and for someone with none", async () => {
	answers.WorkGetTwinPersona = new Error("The server is restarting.");
	renderSettings("?twinId=twin-1");
	await screen.findByRole("heading", { name: "Robin Twin", level: 1 });
	expect(screen.queryByRole("switch", { name: "Use my persona" })).toBeNull();
	cleanup();

	answers.WorkGetTwinPersona = { ...PERSONA, exists: false };
	renderSettings("?twinId=twin-1");
	await screen.findByRole("heading", { name: "Robin Twin", level: 1 });
	expect(screen.queryByRole("switch", { name: "Use my persona" })).toBeNull();
});

it("starts a new twin without instructions for someone whose persona says how it sounds", async () => {
	answers.WorkGetTwinPersona = PERSONA;
	const { user } = renderSettings("?create=true");
	await user.type(
		await screen.findByLabelText("Name (required)"),
		"Second Twin",
	);
	await user.click(screen.getByRole("button", { name: "Next: Voice" }));
	expect(
		screen.getByRole("switch", { name: "Use my persona" }),
	).toBeChecked();
	expect(screen.getByLabelText("Instructions")).toHaveValue("");
});
