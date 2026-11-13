import {
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type {
	ConnectorViewerProps,
	ConnectorViewerService,
} from "@semoss/connectors";
import { toast } from "@semoss/ui/next";
import { TwinContents } from "./twin-contents";

// one insight: the viewer saves into it and the copy has to run in the same one
const insight = vi.hoisted(() => ({
	actions: { run: vi.fn() },
	insightId: "insight-1",
}));
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));
// the viewers are the library's own; the page only has to take what one saved
vi.mock("@semoss/connectors", async (importOriginal) => {
	const viewer =
		(name: string, service: ConnectorViewerService) =>
		({ saveTargetName, showHeader, onSaved }: ConnectorViewerProps) => (
			<div>
				<p>
					{name}
					{showHeader === false ? ", without its own header" : ""}
				</p>
				<button
					type="button"
					onClick={() =>
						onSaved?.({
							path: "Budget review.md",
							name: "Budget review.md",
							service,
						})
					}
				>
					Save to {saveTargetName}
				</button>
			</div>
		);
	return {
		...(await importOriginal<typeof import("@semoss/connectors")>()),
		MailboxView: viewer("The Outlook mailbox", "outlook-mail"),
		TeamsChatViewer: viewer("The Teams chat list", "teams-chats"),
		OneDriveViewer: viewer("The OneDrive explorer", "onedrive"),
		TeamsFilesViewer: viewer("The Teams files explorer", "teams-files"),
	};
});
// the dock talks to SEMOSS; where it is pointed is what this page decides
vi.mock("@/features/routines/routine-documents-dock", () => ({
	RoutineDocumentsDock: ({ config }: { config: unknown }) => (
		<p>The file dock on {JSON.stringify(config)}</p>
	),
}));
vi.mock("@/features/connectors/api/microsoft", () => ({
	connectMicrosoft: vi.fn(),
}));

const BROWSE = 'BrowseAppAssets(filePath=["/"], project=["twin-1"]);';
const NEW_FOLDER =
	'NewAppAssetsDirectory(project=["twin-1"], filePath=["/public"]);';
/** What the server answers each reactor with; an Error is a refusal. */
let answers: Record<string, unknown>;
const ran = (): string[] =>
	insight.actions.run.mock.calls.map(([statement]) => String(statement));

function renderContents(place = "") {
	const router = createMemoryRouter(
		[
			{ path: "/twins/mine/contents", element: <TwinContents /> },
			{ path: "/twins/mine", element: <p>The twin's own page</p> },
		],
		{
			initialEntries: [
				`/twins/mine/contents${place ? `?in=${place}` : ""}`,
			],
		},
	);
	render(<RouterProvider router={router} />);
	return { router, user: userEvent.setup() };
}

beforeEach(() => {
	answers = {
		MyProjects: [{ project_id: "twin-1", project_name: "Robin Twin" }],
		BrowseAppAssets: [
			{ name: "public", path: "/public", type: "directory" },
		],
		Copy: { targetFilePath: "public/emails/Budget review.md" },
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
	vi.spyOn(toast, "success").mockImplementation(() => "");
	vi.spyOn(toast, "error").mockImplementation(() => "");
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

it("opens on the twin's own files, kept to the folder a chat reads, and names every place", async () => {
	renderContents();
	expect(
		screen.getByRole("heading", {
			level: 1,
			name: "What your Digital Twin knows",
		}),
	).toBeVisible();
	expect(screen.getByText("Loading your Digital Twin…")).toBeInTheDocument();
	expect(
		await screen.findByText(
			'The file dock on {"mode":{"type":"APP","app":"twin-1"},"rootPath":"/public"}',
		),
	).toBeVisible();
	expect(
		screen.getByRole("heading", { level: 2, name: "Files" }),
	).toBeVisible();

	const rail = screen.getByRole("navigation", { name: "What to list" });
	expect(
		within(rail)
			.getAllByRole("button")
			.map((place) => place.textContent),
	).toEqual(["Files", "Outlook", "Teams chats", "OneDrive", "Teams files"]);
	expect(within(rail).getByRole("button", { name: "Files" })).toHaveAttribute(
		"aria-current",
		"true",
	);
	// the back link and Done both return to the twin's own page
	for (const name of ["Back to your Digital Twin", "Done"])
		expect(screen.getByRole("link", { name })).toHaveAttribute(
			"href",
			"/twins/mine",
		);
	// nothing is made just by opening the page
	expect(ran()).not.toContain(NEW_FOLDER);
});

it.each([
	["outlook", "Outlook", "The Outlook mailbox", "emails"],
	["teams-chats", "Teams chats", "The Teams chat list", "teams-chats"],
	["onedrive", "OneDrive", "The OneDrive explorer", "files"],
	["teams-files", "Teams files", "The Teams files explorer", "files"],
])(
	"copies what the %s viewer saved into the twin, and says so",
	async (place, title, viewer, folder) => {
		const { user } = renderContents(place);
		expect(
			await screen.findByText(`${viewer}, without its own header`),
		).toBeVisible();
		expect(
			screen.getByRole("heading", { level: 2, name: title }),
		).toBeVisible();
		expect(
			screen.getByText("Save an item to copy it into your Digital Twin."),
		).toBeVisible();

		await user.click(
			screen.getByRole("button", { name: "Save to Digital Twin" }),
		);

		await waitFor(() =>
			expect(toast.success).toHaveBeenCalledWith(
				'Added "Budget review.md" to your Digital Twin.',
			),
		);
		expect(ran().at(-1)).toBe(
			`Copy(sourceType=["INSIGHT"], sourceFilePath=["Budget review.md"], target=["twin-1"], targetType=["PROJECT"], targetFilePath=["public/${folder}/Budget review.md"]);`,
		);
		expect(
			screen.getByText('Added "Budget review.md" to your Digital Twin.'),
		).toBeVisible();
		expect(toast.error).not.toHaveBeenCalled();
	},
);

it("says when a copy fails, with the server's reason, and keeps the viewer", async () => {
	answers.Copy = new Error(
		"Project twin-1 does not exist or user does not have edit access",
	);
	const { user } = renderContents("outlook");
	await user.click(
		await screen.findByRole("button", { name: "Save to Digital Twin" }),
	);
	await waitFor(() =>
		expect(toast.error).toHaveBeenCalledWith(
			'Could not add "Budget review.md" to your Digital Twin.',
			{
				description:
					"Project twin-1 does not exist or user does not have edit access",
			},
		),
	);
	expect(
		screen.getByText(
			'"Budget review.md" was not added to your Digital Twin.',
		),
	).toBeVisible();
	expect(toast.success).not.toHaveBeenCalled();
	expect(screen.getByText(/The Outlook mailbox/)).toBeVisible();
});

it("moves between places in the address, and falls back to the files for a place it does not have", async () => {
	const { router, user } = renderContents("chats");
	expect(
		await screen.findByRole("heading", { level: 2, name: "Files" }),
	).toBeVisible();
	await user.click(
		within(
			screen.getByRole("navigation", { name: "What to list" }),
		).getByRole("button", { name: "Teams chats" }),
	);
	expect(router.state.location.search).toBe("?in=teams-chats");
	expect(await screen.findByText(/The Teams chat list/)).toBeVisible();
	expect(screen.queryByText(/The file dock on/)).not.toBeInTheDocument();
});

it("offers the files folder when the twin has none, and makes it only on the click", async () => {
	answers.BrowseAppAssets = [];
	const { user } = renderContents();
	const add = await screen.findByRole("button", {
		name: "Add the files folder",
	});
	expect(screen.queryByText(/The file dock on/)).not.toBeInTheDocument();
	expect(ran()).not.toContain(NEW_FOLDER);

	await user.click(add);
	expect(await screen.findByText(/The file dock on/)).toBeVisible();
	// looked for again first: asked for a folder that is there, the server makes a second one
	expect(ran().slice(-2)).toEqual([BROWSE, NEW_FOLDER]);
});

it("does not make a second folder when one appeared since the page opened", async () => {
	answers.BrowseAppAssets = [];
	const { user } = renderContents();
	const add = await screen.findByRole("button", {
		name: "Add the files folder",
	});
	answers.BrowseAppAssets = [
		{ name: "public", path: "/public", type: "directory" },
	];
	await user.click(add);
	expect(await screen.findByText(/The file dock on/)).toBeVisible();
	expect(ran()).not.toContain(NEW_FOLDER);
});

it("sends someone with no twin to the page that creates one", async () => {
	answers.MyProjects = [];
	const { router } = renderContents("outlook");
	expect(await screen.findByText("The twin's own page")).toBeVisible();
	expect(router.state.location.pathname).toBe("/twins/mine");
});

it("says when the twin could not be read, and reads again on request", async () => {
	answers.MyProjects = new Error("The server is restarting");
	const { user } = renderContents();
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"The server is restarting",
	);
	answers.MyProjects = [{ project_id: "twin-1", project_name: "Robin Twin" }];
	await user.click(screen.getByRole("button", { name: "Try again" }));
	expect(await screen.findByText(/The file dock on/)).toBeVisible();
});
