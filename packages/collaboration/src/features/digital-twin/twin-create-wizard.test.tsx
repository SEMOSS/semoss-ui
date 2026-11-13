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
		}: ConnectorViewerProps & ConnectorSavedItemsProps) => (
			<div>
				<p>{name}</p>
				{/* one item, which a viewer marks in place of offering it once the host holds it */}
				{savedItems?.isSaved(file) ? (
					<p>{savedItems.label}</p>
				) : (
					<button
						type="button"
						onClick={() =>
							onSaved?.({
								path: file,
								name: file,
								service,
								itemKey: file,
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
	};
});
vi.mock("@/features/connectors/api/microsoft", () => ({
	connectMicrosoft: vi.fn(),
}));
vi.mock("@/features/rooms/api/upload-room-files", () => ({
	uploadRoomFiles: uploadToPage,
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
	// jsdom has no object URLs; the preview only needs an address
	URL.createObjectURL = vi.fn(() => "blob:preview");
	URL.revokeObjectURL = vi.fn();
});
afterEach(cleanup);

function renderWizard() {
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
	expect(screen.getByLabelText("Instructions")).toHaveDisplayValue(
		/^You are the Digital Twin of Robin Reyes: .* Do not make commitments or decisions for Robin Reyes\.$/,
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
		/^AddDigitalTwin\(name=\["Robin Twin"\], systemPrompt=\["You are the Digital Twin of Robin Reyes: .*"\], mcp=\[\], skills=\[\]\);$/,
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

	// it knows something by now, so sharing it is what comes next
	expect(screen.getByText(/it knows what you chose/)).toBeVisible();
	expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual(
		["Chat with it", "Add to what it knows", "Share it with people"],
	);
	expect(
		screen.getByRole("link", { name: "Add to what it knows" }),
	).toHaveAttribute("href", "/twins/mine/contents");
	expect(screen.getByRole("link", { name: "Chat with it" })).toHaveAttribute(
		"href",
		"/twins/chat?agentId=twin-1",
	);
	const share = screen.getByRole("link", { name: "Share it with people" });
	expect(share).toHaveAttribute("href", "/twins/mine?tab=people");
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
	answers.AddDigitalTwin = new Error("You already have a Digital Twin");
	const { user } = renderWizard();
	await reachKnowledge(user);
	await user.click(next("Review"));
	await create(user);
	expect(await screen.findByRole("alert")).toHaveTextContent(
		/^You already have a Digital Twin$/,
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
