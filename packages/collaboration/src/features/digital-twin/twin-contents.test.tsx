import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type {
	ConnectorSavedItemsProps,
	ConnectorViewerProps,
	ConnectorViewerService,
} from "@semoss/connectors";
import { toast } from "@semoss/ui/next";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import type { RoutineDocumentsDock } from "@/features/routines/routine-documents-dock";
import { TwinContentsPage } from "@/pages/twin-contents.page";

// one insight: the viewer saves into it and the copy has to run in the same one
const insight = vi.hoisted(() => ({
	actions: { run: vi.fn() },
	insightId: "insight-1",
}));
// saving a found item reads the owner's Microsoft 365, which is the library's own to do
const saveItem = vi.hoisted(() => vi.fn());
const saveAttachments = vi.hoisted(() => vi.fn());
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));
// the viewers are the library's own; the page only has to take what one saved, and say what it holds
vi.mock("@semoss/connectors", async (importOriginal) => {
	const viewer =
		(name: string, service: ConnectorViewerService) =>
		({
			saveTargetName,
			showHeader,
			savedItems,
			onSaved,
		}: ConnectorViewerProps & ConnectorSavedItemsProps) => (
			<div>
				<p>
					{name}
					{showHeader === false ? ", without its own header" : ""}
				</p>
				{/* one item, which a viewer marks in place of offering it once the host holds it */}
				{savedItems?.isSaved("budget-review") ? (
					<p>{savedItems.label}</p>
				) : (
					<button
						type="button"
						onClick={() =>
							onSaved?.({
								path: "Budget review.md",
								name: "Budget review.md",
								service,
								itemKey: "budget-review",
							})
						}
					>
						Save to {saveTargetName}
					</button>
				)}
			</div>
		);
	return {
		...(await importOriginal<typeof import("@semoss/connectors")>()),
		MailboxView: viewer("The Outlook mailbox", "outlook-mail"),
		CalendarAgendaView: viewer("The Outlook calendar", "outlook-calendar"),
		TeamsChatViewer: viewer("The Teams chat list", "teams-chats"),
		OneDriveViewer: viewer("The OneDrive explorer", "onedrive"),
		TeamsFilesViewer: viewer("The Teams files explorer", "teams-files"),
		saveMicrosoftItem: saveItem,
		saveMailAttachments: saveAttachments,
	};
});
// the dock talks to SEMOSS; where it is pointed is what this page decides
vi.mock("@/features/routines/routine-documents-dock", () => ({
	RoutineDocumentsDock: ({
		config,
		onRefresh,
		renderOverview,
	}: ComponentProps<typeof RoutineDocumentsDock>) => (
		<div>
			<p>The file dock on {JSON.stringify(config)}</p>
			<button type="button" onClick={onRefresh}>
				Refresh documents
			</button>
			{renderOverview?.(undefined)}
		</div>
	),
}));
vi.mock("@/features/connectors/api/microsoft", () => ({
	connectMicrosoft: vi.fn(),
}));
// a transcript is written into the page's files first, as a viewer saves
const uploadToPage = vi.hoisted(() => vi.fn());
vi.mock("@/features/rooms/api/upload-room-files", () => ({
	uploadRoomFiles: uploadToPage,
}));
// what each copy holds is described a moment after a change; the page only has to ask, and the waiting has its own test
const index = vi.hoisted(() => ({
	twinId: undefined as string | undefined,
	request: vi.fn(),
}));
vi.mock("./use-twin-index", () => ({
	useTwinIndex: (twinId: string | undefined) => {
		index.twinId = twinId;
		return index.request;
	},
}));
// what a check found in the owner's twins, which the shell reads once for every page
const twinUpdates = vi.hoisted(() => ({
	found: null as unknown,
	refresh: vi.fn(),
}));
vi.mock("@/features/dashboard/dashboard.context", () => ({
	useTwinUpdates: () => ({
		data: twinUpdates.found,
		error: "",
		isLoading: false,
		checkedAt: null,
		refresh: twinUpdates.refresh,
	}),
}));

// the marker a viewer puts on an item the twin holds; the rail's group heading says the same words
const HELD = ["In This Twin", { selector: "p" }] as const;
const BROWSE = 'BrowseAppAssets(filePath=["/"], project=["twin-1"]);';
// the one item the viewers offer, as the twin records where a copy of it came from
const RECORD = { "public/emails/Budget review.md": "budget-review" };
const SAVE_RECORD = `SaveAppAssets(project=["twin-1"], filePath=["/twin-sources.json"], content=["<encode>${JSON.stringify(RECORD)}</encode>"]);`;
/** Answer as a twin that already holds a copy of the viewers' item, or held one the owner deleted since. */
const holdCopy = (isStillThere = true): void => {
	answers.BrowseAppAssets = [
		{ name: "public", path: "/public/", type: "directory" },
		{ name: "twin-sources.json", path: "/twin-sources.json", type: "json" },
	];
	answers.GetAppAssets = JSON.stringify(RECORD);
	answers.SearchAppAssets = isStillThere
		? [
				{
					name: "Budget review.md",
					path: "/public/emails/Budget review.md",
				},
			]
		: [];
};
// jsdom's File has no text()
const textOf = (file: File): Promise<string> =>
	new Promise((resolve) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.readAsText(file);
	});
const NEW_FOLDER =
	'NewAppAssetsDirectory(project=["twin-1"], filePath=["/public"]);';
/** What the server answers each reactor with; an Error is a refusal. */
let answers: Record<string, unknown>;
const ran = (): string[] =>
	insight.actions.run.mock.calls.map(([statement]) => String(statement));

/** The page; `canReadTranscripts` puts it in a session whose server can read a meeting's transcript. */
function renderContents(
	place = "",
	twinId?: string,
	canReadTranscripts = false,
) {
	const router = createMemoryRouter(
		[
			{ path: "/twins/mine/contents", element: <TwinContentsPage /> },
			{ path: "/twins/mine", element: <p>The twin's own page</p> },
		],
		{
			initialEntries: [
				`/twins/mine/contents?${new URLSearchParams({ ...(twinId === undefined ? {} : { twinId }), ...(place ? { in: place } : {}) })}`,
			],
		},
	);
	const session = createInitialCollaborationState();
	render(
		canReadTranscripts ? (
			<CollaborationSessionProvider
				initialState={{
					...session,
					settings: { ...session.settings, meetingTranscripts: true },
				}}
			>
				<RouterProvider router={router} />
			</CollaborationSessionProvider>
		) : (
			<RouterProvider router={router} />
		),
	);
	return { router, user: userEvent.setup() };
}

beforeEach(() => {
	answers = {
		MyProjects: [{ project_id: "twin-1", project_name: "Robin Twin" }],
		BrowseAppAssets: [
			{ name: "public", path: "/public", type: "directory" },
		],
		SearchAppAssets: [],
		Copy: { targetFilePath: "public/emails/Budget review.md" },
	};
	saveItem.mockReset();
	saveAttachments.mockReset();
	uploadToPage.mockReset();
	index.request.mockReset();
	index.twinId = undefined;
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
	vi.spyOn(toast, "warning").mockImplementation(() => "");
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	twinUpdates.found = null;
	twinUpdates.refresh.mockReset();
});

it("lists the copies that wait under Updates, counts them in the rail, and reads what the twin holds again once one is removed", async () => {
	holdCopy();
	const waiting = {
		id: "copy-1",
		twinId: "twin-1",
		kind: "email",
		change: "gone",
		path: "public/emails/Budget review.md",
		// the item the twin's record names for that copy: one of another item's is not removed
		key: RECORD["public/emails/Budget review.md"],
	};
	twinUpdates.found = {
		// one of another twin's, which this page neither lists nor counts
		updates: [waiting, { ...waiting, id: "copy-2", twinId: "twin-9" }],
		lastCheck: null,
	};
	const { user } = renderContents("updates");

	expect(
		await screen.findByRole("heading", { level: 2, name: "Updates" }),
	).toBeVisible();
	const rail = screen.getByRole("navigation", { name: "What to list" });
	expect(
		within(rail).getByRole("button", { name: /^Updates/ }),
	).toHaveTextContent(/^Updates1$/);
	// nothing is saved from this place, so it has no line that says to
	expect(screen.queryByText(/^Save an item/)).not.toBeInTheDocument();

	insight.actions.run.mockClear();
	await user.click(
		screen.getByRole("button", { name: "Remove copy: Budget review.md" }),
	);
	await waitFor(() => expect(index.request).toHaveBeenCalled());
	expect(ran()).toEqual(
		expect.arrayContaining([
			'DeleteAppAssets(project=["twin-1"], filePath=["/public/emails/Budget review.md"]);',
			'WorkSettleTwinUpdate(updateId=["copy-1"], action=["dismissed"]);',
			// what the lists mark as in the twin is read again
			BROWSE,
		]),
	);
	expect(twinUpdates.refresh).toHaveBeenCalled();
});

it("opens on the twin's own files, kept to the folder a chat reads, and names every place", async () => {
	renderContents();
	expect(
		screen.getByRole("heading", {
			level: 1,
			name: "What This Twin Knows",
		}),
	).toBeVisible();
	expect(screen.getByText("Loading this twin...")).toBeInTheDocument();
	// with no twin read yet, the way back is to the list of them
	expect(
		screen.getByRole("link", { name: "Back to Digital Twins" }),
	).toHaveAttribute("href", "/twins");
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
	).toEqual([
		"Files",
		// no count beside it while nothing waits
		"Updates",
		"Find with AI",
		"Outlook",
		"Calendar",
		"Teams chats",
		"OneDrive",
		"Teams files",
	]);
	expect(within(rail).getByRole("button", { name: "Files" })).toHaveAttribute(
		"aria-current",
		"true",
	);
	// the back link is the one way back to the twin's own page
	expect(
		screen.getByRole("link", { name: "Back to This Twin" }),
	).toHaveAttribute("href", "/twins/mine?twinId=twin-1");
	expect(screen.queryByRole("link", { name: "Done" })).toBeNull();
	// nothing is made just by opening the page
	expect(ran()).not.toContain(NEW_FOLDER);
});

it("refreshes the library after file changes, retains its last listing on error, and retries", async () => {
	holdCopy();
	const { user } = renderContents();
	expect(await screen.findByText("Budget review.md")).toBeVisible();

	answers.SearchAppAssets = new Error("Project temporarily unavailable");
	await user.click(screen.getByRole("button", { name: "Refresh documents" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Project temporarily unavailable",
	);
	expect(screen.getByText("Budget review.md")).toBeVisible();
	expect(index.request).toHaveBeenCalledOnce();

	// The copy was renamed in the explorer while the original refresh failed.
	answers.SearchAppAssets = [{ path: "/public/emails/Approved budget.md" }];
	await user.click(screen.getByRole("button", { name: "Try again" }));
	expect(await screen.findByText("Approved budget.md")).toBeVisible();
	expect(screen.queryByText("Budget review.md")).toBeNull();
	expect(screen.queryByRole("alert")).toBeNull();
});

it("copies to the selected twin and keeps it selected when changing places", async () => {
	answers.MyProjects = [
		{ project_id: "first", project_name: "First Twin" },
		{ project_id: "twin-1", project_name: "Robin Twin" },
	];
	const { router, user } = renderContents("outlook", "twin-1");
	await user.click(
		await screen.findByRole("button", { name: "Save to Digital Twin" }),
	);
	await waitFor(() => expect(ran()).toContain(SAVE_RECORD));
	expect(ran().find((statement) => statement.startsWith("Copy("))).toContain(
		'target=["twin-1"]',
	);
	await user.click(
		within(
			screen.getByRole("navigation", { name: "What to list" }),
		).getByRole("button", { name: "Files" }),
	);
	expect(router.state.location.search).toBe("?twinId=twin-1&in=files");
	expect(await screen.findByText(/The file dock on/)).toHaveTextContent(
		'"app":"twin-1"',
	);
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
		"What Robin Twin Knows",
	);
});

it("does not carry copied-item markers to another twin", async () => {
	answers.MyProjects = [
		{ project_id: "twin-1", project_name: "Robin Twin" },
		{ project_id: "twin-2", project_name: "Research Twin" },
	];
	const { router, user } = renderContents("outlook", "twin-1");
	await user.click(
		await screen.findByRole("button", { name: "Save to Digital Twin" }),
	);
	await waitFor(() => expect(ran()).toContain(SAVE_RECORD));
	expect(screen.getByText(...HELD)).toBeVisible();
	await act(async () => {
		await router.navigate("/twins/mine/contents?twinId=twin-2&in=outlook");
	});
	expect(
		await screen.findByRole("button", { name: "Save to Digital Twin" }),
	).toBeVisible();
	expect(screen.queryByText(...HELD)).toBeNull();
	expect(ran()).toContain(
		'BrowseAppAssets(filePath=["/"], project=["twin-2"]);',
	);
	expect(
		screen.getByRole("link", { name: "Back to This Twin" }),
	).toHaveAttribute("href", "/twins/mine?twinId=twin-2");
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
			screen.getByText("Save an item to copy it into this twin."),
		).toBeVisible();

		await user.click(
			screen.getByRole("button", { name: "Save to Digital Twin" }),
		);

		await waitFor(() =>
			expect(toast.success).toHaveBeenCalledWith(
				'Added "Budget review.md" to this twin.',
			),
		);
		expect(ran()).toContain(
			`Copy(sourceType=["INSIGHT"], sourceFilePath=["Budget review.md"], target=["twin-1"], targetType=["PROJECT"], targetFilePath=["public/${folder}/Budget review.md"]);`,
		);
		// then where the copy came from is recorded, for the next time the page opens, and the server is told
		// of the copy, so a check compares it with now
		expect(ran().slice(-2)).toEqual([
			SAVE_RECORD,
			'WorkNoteTwinCopy(project=["twin-1"], filePath=["public/emails/Budget review.md"]);',
		]);
		// and the twin's index of what its files hold is asked for, for its chats
		expect(index.twinId).toBe("twin-1");
		expect(index.request).toHaveBeenCalledTimes(1);
		expect(
			screen.getByText('Added "Budget review.md" to this twin.'),
		).toBeVisible();
		expect(toast.error).not.toHaveBeenCalled();
		// its viewer marks it from here on, in place of offering it again
		expect(screen.getByText(...HELD)).toBeVisible();
		expect(
			screen.queryByRole("button", { name: "Save to Digital Twin" }),
		).not.toBeInTheDocument();
	},
);

it("finds what to add from a description, copies an added suggestion into the twin, and keeps what it found", async () => {
	answers.WorkSuggestTwinKnowledge = {
		suggestions: [
			{
				kind: "email",
				id: "conv-1",
				title: "Apollo cutover",
				from: "Sam Lee",
				date: "2026-11-03T09:00:00Z",
				preview: "Confirmed for the 14th",
				reason: "Sets the cutover date",
			},
		],
		notes: [],
	};
	answers.Copy = { targetFilePath: "public/emails/Apollo cutover.md" };
	saveItem.mockResolvedValue({
		path: "Apollo cutover.md",
		name: "Apollo cutover.md",
		service: "outlook-mail",
		itemKey: "conversation:conv-1",
	});
	const { user } = renderContents("find");
	expect(
		await screen.findByRole("heading", { level: 2, name: "Find with AI" }),
	).toBeVisible();
	expect(
		screen.getByText("Add a suggestion to copy it into this twin."),
	).toBeVisible();
	const question = () =>
		screen.getByRole("textbox", {
			name: "What Should This Twin Know?",
		});
	await user.type(question(), "The Apollo cutover");
	await user.click(screen.getByRole("button", { name: "Find suggestions" }));
	await user.click(
		await screen.findByRole("button", { name: "Add Apollo cutover" }),
	);

	// saved into the page's files as its own viewer saves it, then copied into the twin from there
	await waitFor(() =>
		expect(toast.success).toHaveBeenCalledWith(
			'Added "Apollo cutover.md" to this twin.',
		),
	);
	expect(saveItem).toHaveBeenCalledExactlyOnceWith("insight-1", {
		kind: "email",
		conversationId: "conv-1",
		subject: "Apollo cutover",
	});
	expect(ran().find((statement) => statement.startsWith("Copy("))).toBe(
		'Copy(sourceType=["INSIGHT"], sourceFilePath=["Apollo cutover.md"], target=["twin-1"], targetType=["PROJECT"], targetFilePath=["public/emails/Apollo cutover.md"]);',
	);
	const found = () =>
		within(screen.getByRole("region", { name: "Emails 1" })).getByRole(
			"listitem",
		);
	expect(found()).toHaveTextContent("In This Twin");
	expect(within(found()).queryByRole("button")).toBeNull();

	// a look at another place does not lose what was asked or what was found
	const rail = screen.getByRole("navigation", { name: "What to list" });
	await user.click(within(rail).getByRole("button", { name: "Outlook" }));
	expect(await screen.findByText(/The Outlook mailbox/)).toBeVisible();
	await user.click(
		within(rail).getByRole("button", { name: "Find with AI" }),
	);
	expect(question()).toHaveValue("The Apollo cutover");
	expect(found()).toHaveTextContent("Sets the cutover date");
});

it("marks what the twin already holds when the page opens, and offers a copy the owner deleted again", async () => {
	holdCopy();
	const held = renderContents("outlook");
	expect(await screen.findByText(...HELD)).toBeVisible();
	expect(
		screen.queryByRole("button", { name: "Save to Digital Twin" }),
	).not.toBeInTheDocument();
	held.router.dispose();
	cleanup();

	holdCopy(false);
	renderContents("outlook");
	expect(
		await screen.findByRole("button", { name: "Save to Digital Twin" }),
	).toBeVisible();
	expect(screen.queryByText(...HELD)).not.toBeInTheDocument();
});

it("reads what the twin holds again when the owner comes back from its files", async () => {
	holdCopy();
	const { user } = renderContents("outlook");
	expect(await screen.findByText(...HELD)).toBeVisible();

	const rail = screen.getByRole("navigation", { name: "What to list" });
	await user.click(within(rail).getByRole("button", { name: "Files" }));
	expect(await screen.findByText(/The file dock on/)).toBeVisible();
	// nothing changed on the way in
	expect(index.request).not.toHaveBeenCalled();
	// the owner deletes the copy there
	holdCopy(false);
	await user.click(within(rail).getByRole("button", { name: "Outlook" }));
	expect(
		await screen.findByRole("button", { name: "Save to Digital Twin" }),
	).toBeVisible();
	// and what the files hold is described again, since they may have changed
	expect(index.request).toHaveBeenCalledTimes(1);
});

it("keeps an added item marked, and says so, when where it came from could not be recorded", async () => {
	answers.SaveAppAssets = new Error("The disk is full");
	const { user } = renderContents("outlook");
	await user.click(
		await screen.findByRole("button", { name: "Save to Digital Twin" }),
	);
	await waitFor(() =>
		expect(toast.warning).toHaveBeenCalledWith(
			'"Budget review.md" will not show as added once this page is reloaded.',
			{ description: "The disk is full." },
		),
	);
	// it is in the twin all the same
	expect(toast.success).toHaveBeenCalledWith(
		'Added "Budget review.md" to this twin.',
	);
	expect(screen.getByText(...HELD)).toBeVisible();
});

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
			'Could not add "Budget review.md" to this twin.',
			{
				description:
					"Project twin-1 does not exist or user does not have edit access",
			},
		),
	);
	expect(
		screen.getByText('"Budget review.md" was not added to this twin.'),
	).toBeVisible();
	expect(toast.success).not.toHaveBeenCalled();
	expect(index.request).not.toHaveBeenCalled();
	expect(screen.getByText(/The Outlook mailbox/)).toBeVisible();
	// not in the twin, so it is offered again and not marked
	expect(screen.queryByText(...HELD)).not.toBeInTheDocument();
	expect(
		screen.getByRole("button", { name: "Save to Digital Twin" }),
	).toBeVisible();
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

it("offers an added email's attachments, copies them in beside it, and says what was left out", async () => {
	answers.WorkSuggestTwinKnowledge = {
		suggestions: [
			{
				kind: "email",
				id: "conv-1",
				title: "Apollo cutover",
				from: "Sam Lee",
				date: "2026-11-03T09:00:00Z",
				preview: "Confirmed for the 14th",
				reason: "Sets the cutover date",
			},
		],
		notes: [],
	};
	saveItem.mockResolvedValue({
		path: "Apollo cutover.md",
		name: "Apollo cutover.md",
		service: "outlook-mail",
		itemKey: "conversation:conv-1",
	});
	const offer = () =>
		screen.queryByRole("button", { name: "Add the email's attachments" });
	const { user } = renderContents("find");
	await user.type(
		await screen.findByRole("textbox", {
			name: "What Should This Twin Know?",
		}),
		"The Apollo cutover",
	);
	await user.click(screen.getByRole("button", { name: "Find suggestions" }));
	expect(offer()).toBeNull();
	await user.click(
		await screen.findByRole("button", { name: "Add Apollo cutover" }),
	);
	await waitFor(() => expect(offer()).toBeVisible());
	// nothing is read for them until the owner asks
	expect(saveAttachments).not.toHaveBeenCalled();

	// the mailbox could not be read: the offer stays, to try again
	saveAttachments.mockRejectedValueOnce(new Error("Sign in to Microsoft"));
	await user.click(offer() as HTMLElement);
	await waitFor(() =>
		expect(toast.error).toHaveBeenCalledWith(
			"Could not add the attachments.",
			{ description: "Sign in to Microsoft" },
		),
	);
	expect(offer()).toBeEnabled();

	saveAttachments.mockResolvedValue({
		saved: [
			{
				path: "Plan.docx",
				name: "Plan.docx",
				service: "outlook-mail",
				itemKey: "m-2:a-1",
			},
		],
		skipped: ["Recording.mp4"],
	});
	await user.click(offer() as HTMLElement);
	expect(
		await screen.findByText(
			"Added 1 attachment to this twin. Left out for being over 25 MB: Recording.mp4.",
		),
	).toBeVisible();
	expect(saveAttachments).toHaveBeenLastCalledWith("insight-1", "conv-1");
	// beside its email, through the same copy
	expect(ran().filter((statement) => statement.startsWith("Copy("))).toEqual([
		expect.stringContaining(
			'targetFilePath=["public/emails/Apollo cutover.md"]',
		),
		'Copy(sourceType=["INSIGHT"], sourceFilePath=["Plan.docx"], target=["twin-1"], targetType=["PROJECT"], targetFilePath=["public/emails/Plan.docx"]);',
	]);
	// done with, so it is not offered again
	expect(offer()).toBeNull();
});

it("offers no attachments for something that is not an email", async () => {
	const { user } = renderContents("teams-chats");
	await user.click(
		await screen.findByRole("button", { name: "Save to Digital Twin" }),
	);
	await waitFor(() =>
		expect(toast.success).toHaveBeenCalledWith(
			'Added "Budget review.md" to this twin.',
		),
	);
	expect(screen.queryByRole("button", { name: /attachments/ })).toBeNull();
});

it("copies a meeting from the calendar into the twin's meetings, and offers no transcript where the server cannot read one", async () => {
	answers.Copy = { targetFilePath: "public/meetings/Budget review.md" };
	const { user } = renderContents("calendar");
	expect(
		await screen.findByText("The Outlook calendar, without its own header"),
	).toBeVisible();
	await user.click(
		screen.getByRole("button", { name: "Save to Digital Twin" }),
	);
	await waitFor(() =>
		expect(toast.success).toHaveBeenCalledWith(
			'Added "Budget review.md" to this twin.',
		),
	);
	expect(ran().find((statement) => statement.startsWith("Copy("))).toBe(
		'Copy(sourceType=["INSIGHT"], sourceFilePath=["Budget review.md"], target=["twin-1"], targetType=["PROJECT"], targetFilePath=["public/meetings/Budget review.md"]);',
	);
	expect(screen.queryByRole("button", { name: /transcript/ })).toBeNull();
});

it("adds what was said in an added meeting beside it, where the server can read transcripts", async () => {
	const offer = () =>
		screen.queryByRole("button", { name: "Add the meeting's transcript" });
	const read = (offset?: number) =>
		`MicrosoftCalendarGetMeetingTranscript(id=["budget-review"]${offset === undefined ? "" : `, offset=[${offset}]`});`;
	const { user } = renderContents("calendar", undefined, true);
	await user.click(
		await screen.findByRole("button", { name: "Save to Digital Twin" }),
	);
	await waitFor(() => expect(offer()).toBeVisible());
	// nothing is read for it until the owner asks
	expect(ran().some((statement) => statement.includes("Transcript"))).toBe(
		false,
	);

	// two pages of talk
	const pages: Record<string, unknown> = {
		[read()]: {
			subject: "Budget review",
			transcript: "Ann Lee: Shall we start?",
			hasMore: true,
			nextOffset: 1,
		},
		[read(1)]: {
			subject: "Budget review",
			transcript: "Bo Chen: Yes.",
			hasMore: false,
		},
	};
	const run = insight.actions.run.getMockImplementation();
	insight.actions.run.mockImplementation(async (statement: string) =>
		statement in pages
			? {
					pixelReturn: [
						{
							output: pages[statement],
							operationType: ["OPERATION"],
						},
					],
				}
			: run?.(statement),
	);
	uploadToPage.mockResolvedValue([
		{
			fileLocation: "Budget-review-transcript.md",
			fileName: "Budget-review-transcript.md",
		},
	]);
	await user.click(offer() as HTMLElement);
	expect(
		await screen.findByText("Added 1 transcript to this twin."),
	).toBeVisible();
	expect(ran()).toEqual(expect.arrayContaining([read(), read(1)]));
	const [insightId, [file]] = uploadToPage.mock.calls[0] as [string, File[]];
	expect(insightId).toBe("insight-1");
	expect(file.name).toBe("Budget-review-transcript.md");
	expect(await textOf(file)).toBe(
		"# Budget review: transcript\n\nAnn Lee: Shall we start?\nBo Chen: Yes.\n",
	);
	expect(
		ran()
			.filter((statement) => statement.startsWith("Copy("))
			.at(-1),
	).toBe(
		'Copy(sourceType=["INSIGHT"], sourceFilePath=["Budget-review-transcript.md"], target=["twin-1"], targetType=["PROJECT"], targetFilePath=["public/meetings/Budget-review-transcript.md"]);',
	);
	// done with, so it is not offered again
	expect(offer()).toBeNull();
});

it("says why a meeting has no transcript, in the server's words, and adds nothing", async () => {
	answers.MicrosoftCalendarGetMeetingTranscript = {
		subject: "Budget review",
		message: "This meeting has no transcript: it was not transcribed.",
	};
	const { user } = renderContents("calendar", undefined, true);
	await user.click(
		await screen.findByRole("button", { name: "Save to Digital Twin" }),
	);
	await user.click(
		await screen.findByRole("button", {
			name: "Add the meeting's transcript",
		}),
	);
	expect(
		await screen.findByText(
			"This meeting has no transcript: it was not transcribed.",
		),
	).toBeVisible();
	expect(uploadToPage).not.toHaveBeenCalled();
	expect(screen.queryByRole("button", { name: /transcript/ })).toBeNull();
});
