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
import type {
	ConnectorSavedItemsProps,
	ConnectorViewerProps,
	ConnectorViewerService,
} from "@semoss/connectors";
import { TwinCreateWizard } from "./twin-create-wizard";

// one insight, as the provider gives: a viewer saves into it, and the create copies out of the same one
const insight = vi.hoisted(() => ({
	actions: { run: vi.fn() },
	insightId: "insight-1",
}));
const upload = vi.hoisted(() => vi.fn());
const uploadToPage = vi.hoisted(() => vi.fn());
// saving a found item reads the owner's Microsoft 365, which is the library's own to do
const saveItem = vi.hoisted(() => vi.fn());
const saveAttachments = vi.hoisted(() => vi.fn());

vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => insight,
}));
vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	uploadProjectImage: upload,
}));
// the viewers are the library's own; the step only has to take what one saved, and say what was chosen
vi.mock("@semoss/connectors", async (importOriginal) => {
	const viewer =
		(name: string, service: ConnectorViewerService, file: string) =>
		({
			saveTargetName,
			savedItems,
			onSaved,
		}: ConnectorViewerProps & ConnectorSavedItemsProps) => {
			// the mail viewer knows an email by its thread; the others know an item by its id
			const itemKey =
				service === "outlook-mail" ? `conversation:${file}` : file;
			return (
				<div>
					<p>{name}</p>
					{/* one item, which a viewer marks in place of offering it once the host holds it */}
					{savedItems?.isSaved(itemKey) ? (
						<p>{savedItems.label}</p>
					) : (
						<button
							type="button"
							onClick={() =>
								onSaved?.({
									path: file,
									name: file,
									service,
									itemKey,
								})
							}
						>
							Save to {saveTargetName}
						</button>
					)}
				</div>
			);
		};
	return {
		...(await importOriginal<typeof import("@semoss/connectors")>()),
		MailboxView: viewer(
			"The Outlook mailbox",
			"outlook-mail",
			"Budget review.md",
		),
		TeamsChatViewer: viewer(
			"The Teams chat list",
			"teams-chats",
			"Design sync.md",
		),
		OneDriveViewer: viewer(
			"The OneDrive explorer",
			"onedrive",
			"Plan.docx",
		),
		TeamsFilesViewer: viewer(
			"The Teams files explorer",
			"teams-files",
			"Roadmap.pptx",
		),
		saveMicrosoftItem: saveItem,
		saveMailAttachments: saveAttachments,
	};
});
vi.mock("@/features/connectors/api/microsoft", () => ({
	connectMicrosoft: vi.fn(),
}));
vi.mock("@/features/rooms/api/upload-room-files", () => ({
	uploadRoomFiles: uploadToPage,
}));

// what each copy holds is described a moment after the twin exists; the step only has to say which twin, and
// the waiting has its own test
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

/** What the server answers each reactor with; an Error is a refusal, a promise an answer still on its way. */
let answers: Record<string, unknown>;
/** Which copies the server refuses, by the name of the file. */
let refusedCopies: string[];
const ran = (): string[] =>
	insight.actions.run.mock.calls.map(([statement]) =>
		String(statement).slice(0, String(statement).indexOf("(")),
	);
const copies = (): string[] =>
	insight.actions.run.mock.calls
		.map(([statement]) => String(statement))
		.filter((statement) => statement.startsWith("Copy("));

beforeEach(() => {
	answers = {
		AddDigitalTwin: "twin-1",
		BrowseAppAssets: [
			{ name: "public", path: "/public/", type: "directory" },
		],
		GetWorkspace: {
			workspace_id: "twin-1",
			name: "Robin Twin",
			system_prompt: "",
			mcp: [],
			skills: [],
			prompts: [],
		},
		Copy: { targetFilePath: "public/copied" },
	};
	refusedCopies = [];
	insight.actions.run.mockReset();
	insight.actions.run.mockImplementation(async (statement: string) => {
		if (
			statement.startsWith("Copy(") &&
			refusedCopies.some((name) => statement.includes(name))
		)
			throw new Error("The file is no longer there");
		const answer =
			await answers[statement.slice(0, statement.indexOf("("))];
		if (answer instanceof Error) throw answer;
		return {
			pixelReturn: [
				{ output: answer ?? true, operationType: ["OPERATION"] },
			],
		};
	});
	upload.mockReset();
	upload.mockResolvedValue({});
	uploadToPage.mockReset();
	saveItem.mockReset();
	saveAttachments.mockReset();
	index.request.mockReset();
	index.twinId = undefined;
	// jsdom has no object URLs; the preview only needs an address
	URL.createObjectURL = vi.fn(() => "blob:preview");
	URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

function renderWizard(hasPersona = false) {
	const onOpenSettings = vi.fn();
	render(
		<MemoryRouter>
			<TwinCreateWizard
				ownerName="Robin Reyes"
				skills={[
					{
						id: "skill-1",
						name: "Client summary",
						description: "One section per client",
					},
				]}
				hasPersona={hasPersona}
				onOpenSettings={onOpenSettings}
			/>
		</MemoryRouter>,
	);
	return { onOpenSettings, user: userEvent.setup() };
}

type User = ReturnType<typeof userEvent.setup>;
const step = (name: string) => screen.getByRole("heading", { level: 2, name });
const next = (label: string) =>
	screen.getByRole("button", { name: `Next: ${label}` });
const nameField = () => screen.getByLabelText("Name (required)");
const stepList = () =>
	within(
		screen.getByRole("list", { name: "Steps to create your Digital Twin" }),
	)
		.getAllByRole("listitem")
		.map((entry) => entry.textContent);
const place = (name: string | RegExp) =>
	within(screen.getByRole("navigation", { name: "What to list" })).getByRole(
		"button",
		{ name },
	);
const reviewOf = (term: string) =>
	screen.getByText(term, { selector: "dt" }).nextElementSibling;
/** Name the twin and go as far as the step that chooses what it knows. */
async function reachKnowledge(user: User) {
	await user.type(nameField(), "Robin Twin");
	await user.click(next("Voice"));
	await user.click(next("Abilities"));
	await user.click(next("Knowledge"));
}
const create = (user: User) =>
	user.click(screen.getByRole("button", { name: "Create Digital Twin" }));

it("creates a skill during setup and carries its selection and name through review into the twin", async () => {
	answers.CreateSkill = { project_id: "skill-new", name: "Brief replies" };
	const { user } = renderWizard();
	await user.type(nameField(), "Robin Twin");
	await user.click(next("Voice"));
	await user.click(next("Abilities"));
	await user.click(screen.getByRole("button", { name: "Create skill" }));
	const dialog = within(screen.getByRole("dialog", { name: "Create skill" }));
	await user.type(
		dialog.getByLabelText("Skill name (required)"),
		"Brief replies",
	);
	await user.type(
		dialog.getByLabelText("Description (required)"),
		"For questions",
	);
	await user.type(
		dialog.getByLabelText("Skill instructions (required)"),
		"Use three bullets.",
	);
	await user.click(dialog.getByRole("button", { name: "Create skill" }));
	expect(
		await screen.findByRole("button", { name: "View Brief replies" }),
	).toBeVisible();
	expect(ran()).toEqual(["CreateSkill"]);
	expect(next("Knowledge")).toBeVisible();
	await user.click(next("Knowledge"));
	await user.click(next("Review"));
	expect(reviewOf("Skills and toolboxes")).toHaveTextContent("Brief replies");
	await create(user);
	await vi.waitFor(() => expect(ran()).toContain("AddDigitalTwin"));
	expect(
		insight.actions.run.mock.calls.find(([statement]) =>
			String(statement).startsWith("AddDigitalTwin"),
		)?.[0],
	).toContain('skills=["skill-new"]');
});

it("starts on who the twin is, one step of five, with nothing sent or read", () => {
	renderWizard();
	expect(
		screen.getByRole("heading", {
			level: 1,
			name: "Create your Digital Twin",
		}),
	).toBeVisible();
	expect(step("Who is your Digital Twin?")).toBeVisible();
	expect(stepList()).toEqual([
		"1Identity",
		"2Voice",
		"3Abilities",
		"4Knowledge",
		"5Review",
	]);
	expect(
		screen
			.getAllByRole("listitem")
			.filter((entry) => entry.getAttribute("aria-current") === "step")
			.map((entry) => entry.textContent),
	).toEqual(["1Identity"]);
	// the later steps are there, waiting, and out of the way
	expect(screen.getByLabelText("Instructions")).not.toBeVisible();
	// how it should sound; who it is and what it answers from are the server's to say
	expect(screen.getByLabelText("Instructions")).toHaveDisplayValue(
		"Answer the way Robin Reyes would explain it to a colleague: plainly and briefly. Lead with the answer.",
	);
	// the owner's mailbox is not read before they ask for it
	expect(screen.queryByText("The Outlook mailbox")).toBeNull();
	expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute(
		"href",
		"/twins",
	);
	expect(insight.actions.run).not.toHaveBeenCalled();
});

it.each([
	["", "Name is required"],
	[
		"1 twin",
		"Start with a letter, then use only letters, numbers, spaces, hyphens and underscores.",
	],
	[
		"Robin's twin",
		"Start with a letter, then use only letters, numbers, spaces, hyphens and underscores.",
	],
])("does not leave the first step with the name %j", async (name, problem) => {
	const { user } = renderWizard();
	if (name) await user.type(nameField(), name);
	await user.click(next("Voice"));
	expect(await screen.findByText(problem)).toBeVisible();
	expect(nameField()).toBeInvalid();
	expect(step("Who is your Digital Twin?")).toBeVisible();
	expect(insight.actions.run).not.toHaveBeenCalled();
});

it("moves a step at a time, starts each at its title, and keeps what was entered going back", async () => {
	const { user } = renderWizard();
	await user.type(nameField(), "Robin Twin");
	await user.click(next("Voice"));
	expect(step("How should it answer?")).toHaveFocus();
	expect(nameField()).not.toBeVisible();
	await user.type(screen.getByLabelText("Greeting"), "Ask me anything.");

	await user.click(screen.getByRole("button", { name: "Back" }));
	expect(step("Who is your Digital Twin?")).toHaveFocus();
	expect(nameField()).toHaveValue("Robin Twin");

	await user.click(next("Voice"));
	expect(screen.getByLabelText("Greeting")).toHaveValue("Ask me anything.");
	await user.click(next("Abilities"));
	expect(step("What else can it use?")).toHaveFocus();
	// nothing here, or on the next step, is required
	await user.click(next("Knowledge"));
	expect(step("What should it know?")).toHaveFocus();
	await user.click(next("Review"));
	expect(step("Ready to bring it to life?")).toHaveFocus();
	// the review says back what was chosen, each under its own name
	expect(reviewOf("Name and image")).toHaveTextContent("Robin Twin");
	expect(reviewOf("Greeting")).toHaveTextContent("Ask me anything.");
	expect(reviewOf("Skills and toolboxes")).toHaveTextContent("None");
	expect(reviewOf("What it knows")).toHaveTextContent(
		"Nothing yet. You can add it once your Digital Twin is created.",
	);
	expect(stepList()).toEqual([
		"Identity (done)",
		"Voice (done)",
		"Abilities (done)",
		"Knowledge (done)",
		"5Review",
	]);

	await user.click(
		screen.getByRole("button", { name: "Change name and image" }),
	);
	expect(step("Who is your Digital Twin?")).toHaveFocus();
	expect(insight.actions.run).not.toHaveBeenCalled();
});

it("chooses emails, Teams chats and files for the twin, and lets one be taken back out", async () => {
	uploadToPage.mockResolvedValue([
		{ fileName: "About me.pdf", fileLocation: "/About me.pdf" },
	]);
	const { user } = renderWizard();
	await reachKnowledge(user);
	// a viewer's own buttons and search fields must not submit the steps' form
	expect(step("What should it know?").closest("form")).toBeNull();
	expect(screen.getByText("The Outlook mailbox")).toBeVisible();
	expect(
		screen.getByText("Save an item to choose it for your Digital Twin."),
	).toBeVisible();

	await user.click(
		screen.getByRole("button", { name: "Save to Digital Twin" }),
	);
	expect(
		screen.getByText(
			'Chose "Budget review.md". It is added when your Digital Twin is created.',
		),
	).toBeVisible();
	// its viewer marks it from here on, in place of offering it again
	expect(screen.getByText("Chosen for your Digital Twin")).toBeVisible();
	expect(
		screen.queryByRole("button", { name: "Save to Digital Twin" }),
	).toBeNull();
	for (const [source, viewer] of [
		["Teams chats", "The Teams chat list"],
		["OneDrive", "The OneDrive explorer"],
		["Teams files", "The Teams files explorer"],
	]) {
		await user.click(place(source));
		expect(screen.getByText(viewer)).toBeVisible();
		await user.click(
			screen.getByRole("button", { name: "Save to Digital Twin" }),
		);
	}
	await user.click(place("Your computer"));
	const file = new File(["x"], "About me.pdf", { type: "application/pdf" });
	const picker = screen
		.getByRole("button", { name: "Choose files, or drop them here" })
		.querySelector("input");
	if (!picker) throw new Error("The upload place must hold a file input");
	await user.upload(picker, file);
	expect(await screen.findByText(/Chose "About me.pdf"/)).toBeVisible();
	// into the page's own files, where the create copies it from
	expect(uploadToPage).toHaveBeenCalledExactlyOnceWith("insight-1", [file]);

	await user.click(place(/What you chose/));
	expect(place(/What you chose/)).toHaveTextContent("5");
	expect(
		screen.getAllByRole("listitem").map((entry) => entry.textContent),
	).toEqual(
		expect.arrayContaining([
			"Budget review.mdEmail from Outlook",
			"Design sync.mdTeams chat",
			"Plan.docxFile from OneDrive",
			"Roadmap.pptxFile from Teams",
			"About me.pdfFile from your computer",
		]),
	);
	await user.click(
		screen.getByRole("button", { name: "Remove Roadmap.pptx" }),
	);
	expect(screen.queryByText("Roadmap.pptx")).toBeNull();
	expect(place(/What you chose/)).toHaveTextContent("4");
	// taken back out, it is offered again where it was picked; what stayed is still marked
	await user.click(place("Teams files"));
	expect(
		screen.getByRole("button", { name: "Save to Digital Twin" }),
	).toBeVisible();
	await user.click(place("OneDrive"));
	expect(screen.getByText("Chosen for your Digital Twin")).toBeVisible();

	// nothing has left the page yet
	expect(insight.actions.run).not.toHaveBeenCalled();
	await user.click(next("Review"));
	expect(reviewOf("What it knows")).toHaveTextContent(
		"1 email, 1 Teams chat, 2 files",
	);
});

it("finds what to choose from a description, and chooses a suggestion as a viewer's pick is chosen", async () => {
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
	const { user } = renderWizard();
	await reachKnowledge(user);
	await user.click(place("Find with AI"));
	expect(
		screen.getByText(
			"Add a suggestion to choose it for your Digital Twin.",
		),
	).toBeVisible();
	const question = () =>
		screen.getByRole("textbox", {
			name: "What should your Digital Twin know?",
		});
	await user.type(question(), "The Apollo cutover");
	await user.click(screen.getByRole("button", { name: "Find suggestions" }));
	// searching is the one thing here that leaves the page before the twin is made
	expect(ran()).toEqual(["WorkSuggestTwinKnowledge"]);
	await user.click(
		await screen.findByRole("button", { name: "Add Apollo cutover" }),
	);

	expect(
		await screen.findByText(
			'Chose "Apollo cutover.md". It is added when your Digital Twin is created.',
		),
	).toBeVisible();
	expect(saveItem).toHaveBeenCalledExactlyOnceWith("insight-1", {
		kind: "email",
		conversationId: "conv-1",
		subject: "Apollo cutover",
	});
	// marked where it was found, in place of being offered again
	expect(
		within(screen.getByRole("region", { name: "Emails 1" })).getByRole(
			"listitem",
		),
	).toHaveTextContent("Chosen for your Digital Twin");
	expect(
		screen.queryByRole("button", { name: "Add Apollo cutover" }),
	).toBeNull();

	// it waits with what the viewers picked, and what was asked is still there on coming back
	await user.click(place(/What you chose/));
	expect(place(/What you chose/)).toHaveTextContent("1");
	expect(
		screen.getByRole("button", { name: "Remove Apollo cutover.md" }),
	).toBeVisible();
	await user.click(place("Find with AI"));
	expect(question()).toHaveValue("The Apollo cutover");
	await user.click(next("Review"));
	expect(reviewOf("What it knows")).toHaveTextContent("1 email");
});

it("makes the twin step by step once the review is confirmed, copies in what was chosen, then shows it with where to go next", async () => {
	// the agent as it reads right after it is made
	answers.GetWorkspace = {
		...(answers.GetWorkspace as object),
		name: "Robin Twin",
	};
	// the folder is still being made, so the scene can be looked at mid-way
	let finishFolder = (): void => undefined;
	answers.NewAppAssetsDirectory = new Promise<boolean>((resolve) => {
		finishFolder = () => resolve(true);
	});
	const { onOpenSettings, user } = renderWizard();
	const image = new File(["x"], "robin.png", { type: "image/png" });
	await user.upload(screen.getByLabelText("Image"), image);
	await user.type(nameField(), "Robin Twin");
	await user.click(next("Voice"));
	await user.type(screen.getByLabelText("Greeting"), "Ask me anything.");
	await user.click(next("Abilities"));
	await user.click(next("Knowledge"));
	await user.click(
		screen.getByRole("button", { name: "Save to Digital Twin" }),
	);
	await user.click(next("Review"));
	await create(user);

	const making = await screen.findByRole("heading", {
		level: 1,
		name: "Bringing Robin Twin to life",
	});
	expect(making).toHaveFocus();
	expect(
		screen.getAllByRole("listitem").map((entry) => entry.textContent),
	).toEqual([
		"Create your Digital Twin",
		"Make room for what it knows",
		"Save its greeting",
		"Upload its image",
		"Add what you chose (0 of 1)",
	]);
	expect(
		screen.getByText("Step 2 of 5: Make room for what it knows"),
	).toBeInTheDocument();
	// the steps are out of the way while it is made
	expect(screen.queryByRole("heading", { level: 2 })).toBeNull();
	expect(ran()).toEqual(["AddDigitalTwin", "NewAppAssetsDirectory"]);

	finishFolder();
	expect(
		await screen.findByRole("heading", {
			level: 1,
			name: "Meet Robin Twin",
		}),
	).toBeVisible();
	expect(ran()).toEqual([
		"AddDigitalTwin",
		"NewAppAssetsDirectory",
		"GetWorkspace",
		"EditWorkspace",
		"Copy",
		// where the copy came from is recorded, so the owner's lists mark it from then on
		"BrowseAppAssets",
		"SaveAppAssets",
	]);
	expect(insight.actions.run.mock.calls[0]?.[0]).toMatch(
		/^AddDigitalTwin\(name=\["Robin Twin"\], systemPrompt=\["Answer the way Robin Reyes would explain it to a colleague: .*"\], mcp=\[\], skills=\[\]\);$/,
	);
	expect(insight.actions.run.mock.calls[3]?.[0]).toContain(
		'greeting="Ask me anything.", greetingEnabled=true);',
	);
	expect(upload).toHaveBeenCalledExactlyOnceWith("twin-1", image);
	// the image goes after the profile, and what was chosen goes in last
	expect(upload.mock.invocationCallOrder[0]).toBeGreaterThan(
		insight.actions.run.mock.invocationCallOrder[3] ?? 0,
	);
	expect(insight.actions.run.mock.invocationCallOrder[4]).toBeGreaterThan(
		upload.mock.invocationCallOrder[0] ?? 0,
	);
	expect(copies()).toEqual([
		'Copy(sourceType=["INSIGHT"], sourceFilePath=["Budget review.md"], target=["twin-1"], targetType=["PROJECT"], targetFilePath=["public/emails/Budget review.md"]);',
	]);
	// and what its files hold is described for its chats, now that there is a twin
	expect(index.twinId).toBe("twin-1");

	// it knows something by now, so sharing it is what comes next
	expect(screen.getByText(/it knows what you chose/)).toBeVisible();
	expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
		["Chat with it", "Add to what it knows", "Share it with people"],
	);
	expect(
		screen.getByRole("link", { name: "Add to what it knows" }),
	).toHaveAttribute("href", "/twins/mine/contents?twinId=twin-1");
	expect(screen.getByRole("link", { name: "Chat with it" })).toHaveAttribute(
		"href",
		"/twins/chat?agentId=twin-1",
	);
	const share = screen.getByRole("link", { name: "Share it with people" });
	expect(share).toHaveAttribute(
		"href",
		"/twins/mine?twinId=twin-1&tab=people",
	);
	expect(onOpenSettings).not.toHaveBeenCalled();
	await user.click(share);
	expect(onOpenSettings).toHaveBeenCalledOnce();
});

it("points a twin made with nothing to know at choosing that first", async () => {
	const { user } = renderWizard();
	await reachKnowledge(user);
	await user.click(next("Review"));
	await create(user);
	expect(
		await screen.findByRole("heading", {
			level: 1,
			name: "Meet Robin Twin",
		}),
	).toBeVisible();
	expect(ran()).toEqual(["AddDigitalTwin", "NewAppAssetsDirectory"]);
	expect(screen.getByText(/it knows nothing yet/)).toBeVisible();
	expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
		["Chat with it", "Share it with people", "Choose what it knows"],
	);
});

it("comes back to the review with what failed once the twin exists, keeps what was entered, and finishes without creating again", async () => {
	answers.EditWorkspace = new Error("The agent is locked");
	const { user } = renderWizard();
	await user.type(nameField(), "Robin Twin");
	await user.click(next("Voice"));
	await user.type(screen.getByLabelText("Greeting"), "Ask me anything.");
	await user.click(next("Abilities"));
	await user.click(next("Knowledge"));
	await user.click(next("Review"));
	await create(user);

	const alert = await screen.findByRole("alert");
	expect(alert).toHaveTextContent(
		"Your Digital Twin was created, but its greeting could not be saved: The agent is locked. Everything you entered is still here: finish setting it up to try that part again.",
	);
	expect(step("Ready to bring it to life?")).toHaveFocus();
	// the reason sits above the title the page comes back at: under a long review it would be out of sight
	expect(
		alert.compareDocumentPosition(step("Ready to bring it to life?")) &
			Node.DOCUMENT_POSITION_FOLLOWING,
	).toBeTruthy();
	expect(nameField()).toHaveValue("Robin Twin");
	expect(screen.getByLabelText("Greeting")).toHaveValue("Ask me anything.");
	expect(
		screen.queryByRole("button", { name: "Create Digital Twin" }),
	).toBeNull();

	delete answers.EditWorkspace;
	await user.click(screen.getByRole("button", { name: "Finish setting up" }));
	expect(
		await screen.findByRole("heading", {
			level: 1,
			name: "Meet Robin Twin",
		}),
	).toBeVisible();
	expect(ran()).toEqual([
		"AddDigitalTwin",
		"NewAppAssetsDirectory",
		"GetWorkspace",
		"EditWorkspace",
		// the second try saves the profile again: no second twin, no second folder
		"GetWorkspace",
		"EditWorkspace",
	]);
});

it("says which chosen item could not be added, and on the next try copies only that one", async () => {
	refusedCopies = ["Design sync.md"];
	const { user } = renderWizard();
	await reachKnowledge(user);
	await user.click(
		screen.getByRole("button", { name: "Save to Digital Twin" }),
	);
	await user.click(place("Teams chats"));
	await user.click(
		screen.getByRole("button", { name: "Save to Digital Twin" }),
	);
	await user.click(next("Review"));
	await create(user);

	expect(await screen.findByRole("alert")).toHaveTextContent(
		'Your Digital Twin was created, but not everything you chose could be added: "Design sync.md": The file is no longer there. Everything you entered is still here',
	);
	expect(copies()).toHaveLength(2);
	// the email is in the twin by now, so only the chat is still a choice
	await user.click(
		screen.getByRole("button", { name: "Change what it knows" }),
	);
	await user.click(place(/What you chose/));
	expect(screen.getByText("Design sync.md")).toBeVisible();
	expect(screen.queryByText("Budget review.md")).toBeNull();

	refusedCopies = [];
	await user.click(next("Review"));
	await user.click(screen.getByRole("button", { name: "Finish setting up" }));
	expect(
		await screen.findByRole("heading", {
			level: 1,
			name: "Meet Robin Twin",
		}),
	).toBeVisible();
	// the email was not copied a second time, which would have left two of it
	expect(
		copies().map(
			(statement) => /sourceFilePath=\["([^"]+)"/.exec(statement)?.[1],
		),
	).toEqual(["Budget review.md", "Design sync.md", "Design sync.md"]);
	expect(
		ran().filter((reactor) => reactor === "AddDigitalTwin"),
	).toHaveLength(1);
});

it("keeps a refused create a create, so it can be tried again", async () => {
	answers.AddDigitalTwin = new Error(
		"You are not allowed to create an agent",
	);
	const { user } = renderWizard();
	await reachKnowledge(user);
	await user.click(next("Review"));
	await create(user);
	expect(await screen.findByRole("alert")).toHaveTextContent(
		/^You are not allowed to create an agent$/,
	);
	expect(
		screen.getByRole("button", { name: "Create Digital Twin" }),
	).toBeEnabled();
	expect(ran()).toEqual(["AddDigitalTwin"]);
});

it("goes to the step that holds a problem when it is not the one on screen", async () => {
	const { user } = renderWizard();
	await user.type(nameField(), "Robin Twin");
	await user.click(next("Voice"));
	fireEvent.change(screen.getByLabelText("Greeting"), {
		target: { value: "x".repeat(2001) },
	});
	await user.click(screen.getByRole("button", { name: "Back" }));
	await user.click(next("Voice"));
	await user.click(next("Abilities"));
	expect(
		await screen.findByText(
			"Keep the greeting to 2,000 characters or fewer.",
		),
	).toBeVisible();
	expect(step("How should it answer?")).toBeVisible();
});

it("takes a note about the owner with how the twin answers, and saves it into the new twin", async () => {
	const { user } = renderWizard();
	await user.type(nameField(), "Robin Twin");
	await user.click(next("Voice"));
	const about = screen.getByLabelText("About you");
	expect(about).toHaveValue("");
	expect(about).toHaveAttribute(
		"placeholder",
		expect.stringContaining("Who to ask instead:"),
	);
	await user.type(about, "I run renewals.");
	await user.click(next("Abilities"));
	await user.click(next("Knowledge"));
	await user.click(next("Review"));
	expect(reviewOf("About you")).toHaveTextContent("I run renewals.");
	// the note is still being saved, so the scene can be looked at mid-way
	let finishNote = (): void => undefined;
	answers.SaveAppAssets = new Promise<boolean>((resolve) => {
		finishNote = () => resolve(true);
	});
	await create(user);
	expect(
		await screen.findByText("Step 3 of 3: Save your note"),
	).toBeInTheDocument();
	finishNote();
	expect(
		await screen.findByRole("heading", {
			level: 1,
			name: "Meet Robin Twin",
		}),
	).toBeVisible();
	expect(
		insight.actions.run.mock.calls.map(([statement]) => statement),
	).toEqual([
		expect.stringMatching(/^AddDigitalTwin\(/),
		'NewAppAssetsDirectory(project=["twin-1"], filePath=["/public"]);',
		'SaveAppAssets(project=["twin-1"], filePath=["/public/About me.md"], content=["I run renewals."]);',
	]);
});

it("chooses a picked email's attachments with it, as files of their own", async () => {
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
	// the found email has two; the one picked in the mailbox has none
	saveAttachments.mockImplementation(async (_insightId, thread) => ({
		saved:
			thread === "conv-1"
				? [
						{
							path: "Plan.docx",
							name: "Plan.docx",
							service: "outlook-mail",
							itemKey: "m-2:a-1",
						},
						{
							path: "Costs.xlsx",
							name: "Costs.xlsx",
							service: "outlook-mail",
							itemKey: "m-2:a-2",
						},
					]
				: [],
		skipped: [],
	}));
	const { user } = renderWizard();
	await reachKnowledge(user);
	expect(screen.queryByRole("button", { name: /attachments/ })).toBeNull();
	// an email picked in the mailbox
	await user.click(
		screen.getByRole("button", { name: "Save to Digital Twin" }),
	);
	expect(
		screen.getByRole("button", { name: "Add the email's attachments" }),
	).toBeVisible();

	await user.click(place("Find with AI"));
	await user.type(
		screen.getByRole("textbox", {
			name: "What should your Digital Twin know?",
		}),
		"The Apollo cutover",
	);
	await user.click(screen.getByRole("button", { name: "Find suggestions" }));
	await user.click(
		await screen.findByRole("button", { name: "Add Apollo cutover" }),
	);
	// one button for both emails, and nothing read for them before it is pressed
	expect(saveAttachments).not.toHaveBeenCalled();
	await user.click(
		await screen.findByRole("button", {
			name: "Add the attachments of 2 emails",
		}),
	);
	expect(
		await screen.findByText(
			"Chose 2 attachments. They are added when your Digital Twin is created.",
		),
	).toBeVisible();
	expect(saveAttachments.mock.calls).toEqual([
		["insight-1", "Budget review.md"],
		["insight-1", "conv-1"],
	]);
	expect(screen.queryByRole("button", { name: /attachments/ })).toBeNull();

	await user.click(place(/What you chose/));
	expect(place(/What you chose/)).toHaveTextContent("4");
	expect(screen.getAllByText("Attachment from Outlook")).toHaveLength(2);
	await user.click(next("Review"));
	// the viewer's pick and the found email are emails; what was attached counts as files
	expect(reviewOf("What it knows")).toHaveTextContent("2 emails, 2 files");
});

it("makes a twin that uses its owner's persona without a step for it, and with no instructions of its own", async () => {
	const { user } = renderWizard(true);
	await user.type(nameField(), "Robin Twin");
	await user.click(next("Voice"));
	expect(
		screen.getByRole("switch", { name: "Use my persona" }),
	).toBeChecked();
	// their persona says how it sounds, so no line about that is waiting in the box
	expect(screen.getByLabelText("Instructions")).toHaveValue("");
	await user.click(next("Abilities"));
	await user.click(next("Knowledge"));
	await user.click(next("Review"));
	expect(reviewOf("Persona")).toHaveTextContent("It answers in your voice");
	expect(reviewOf("Instructions")).toHaveTextContent("None");
	await create(user);
	expect(
		await screen.findByRole("heading", {
			level: 1,
			name: "Meet Robin Twin",
		}),
	).toBeVisible();
	expect(
		insight.actions.run.mock.calls.map(([statement]) => statement),
	).toEqual([
		expect.stringContaining('systemPrompt=[""]'),
		'NewAppAssetsDirectory(project=["twin-1"], filePath=["/public"]);',
	]);
});

it("makes a plain twin for an owner who switches their persona off: it gets how to sound, and the persona is switched off for it", async () => {
	const { user } = renderWizard(true);
	await user.type(nameField(), "Robin Twin");
	await user.click(next("Voice"));
	await user.click(screen.getByRole("switch", { name: "Use my persona" }));
	await user.click(next("Abilities"));
	await user.click(next("Knowledge"));
	await user.click(next("Review"));
	expect(reviewOf("Persona")).toHaveTextContent("Off for this twin");
	// with neither a persona nor instructions it would have nothing on how to sound
	expect(reviewOf("Instructions")).toHaveTextContent(
		"Answer the way Robin Reyes would explain it to a colleague",
	);
	// the switch is still being sent, so the scene can be looked at mid-way
	let finishSwitch = (): void => undefined;
	answers.WorkSetTwinPersona = new Promise<boolean>((resolve) => {
		finishSwitch = () => resolve(true);
	});
	await create(user);
	expect(
		await screen.findByText("Step 3 of 3: Switch your persona off for it"),
	).toBeInTheDocument();
	finishSwitch();
	await screen.findByRole("heading", { level: 1, name: "Meet Robin Twin" });
	expect(
		insight.actions.run.mock.calls.map(([statement]) => statement),
	).toEqual([
		expect.stringContaining(
			'systemPrompt=["Answer the way Robin Reyes would explain it to a colleague: plainly and briefly. Lead with the answer."]',
		),
		'NewAppAssetsDirectory(project=["twin-1"], filePath=["/public"]);',
		'WorkSetTwinPersona(project=["twin-1"], enabled=[false]);',
	]);
});

it("keeps instructions an owner wrote whichever way the persona switch is, and shows no switch to someone with no persona", async () => {
	const { user } = renderWizard(true);
	await user.type(nameField(), "Robin Twin");
	await user.click(next("Voice"));
	await user.type(screen.getByLabelText("Instructions"), "Answer in Dutch.");
	await user.click(screen.getByRole("switch", { name: "Use my persona" }));
	await user.click(next("Abilities"));
	await user.click(next("Knowledge"));
	await user.click(next("Review"));
	expect(reviewOf("Instructions")).toHaveTextContent("Answer in Dutch.");
	cleanup();

	const plain = renderWizard();
	await plain.user.type(nameField(), "Robin Twin");
	await plain.user.click(next("Voice"));
	expect(screen.queryByRole("switch", { name: "Use my persona" })).toBeNull();
	expect(screen.getByText(/You have no persona yet/)).toBeVisible();
	// someone without one may still make a twin with no instructions, as before
	await plain.user.clear(screen.getByLabelText("Instructions"));
	await plain.user.click(next("Abilities"));
	await plain.user.click(next("Knowledge"));
	await plain.user.click(next("Review"));
	expect(screen.queryByText("Persona", { selector: "dt" })).toBeNull();
	expect(reviewOf("Instructions")).toHaveTextContent("None");
});
