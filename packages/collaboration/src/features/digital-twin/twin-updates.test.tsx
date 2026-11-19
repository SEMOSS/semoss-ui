import {
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import {
	type CollaborationChange,
	CollaborationSessionProvider,
} from "@/features/collaboration/state/collaboration-session.context";
import type { VisibleResource } from "@/features/dashboard/use-visible-resource";
import type {
	TwinCheck,
	TwinUpdate,
	TwinUpdates as TwinUpdatesFound,
} from "./api/twin-updates";
import { TwinUpdates } from "./twin-updates";

// one insight: an item is saved into it again and the copy is written from it
const insight = vi.hoisted(() => ({
	actions: { run: vi.fn() },
	insightId: "insight-1",
}));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
// saving an item again reads the owner's Microsoft 365, which is the library's own to do
const saveItem = vi.hoisted(() => vi.fn());
vi.mock("@semoss/connectors", () => ({ saveMicrosoftItem: saveItem }));
const signIn = vi.hoisted(() => vi.fn());
vi.mock("@/features/connectors/api/microsoft", () => ({
	connectMicrosoft: signIn,
}));

const THREAD: TwinUpdate = {
	id: "copy-thread",
	twinId: "twin-1",
	kind: "email",
	change: "changed",
	path: "public/emails/Email thread - Budget.md",
	key: "conversation:conv-1",
	title: "Budget review",
	count: 3,
	latestFrom: "Dana Lee",
	latestAt: "2026-11-18T15:00:00Z",
	copiedAt: "2026-11-12T17:00:00Z",
};
const FILE: TwinUpdate = {
	id: "copy-file",
	twinId: "twin-1",
	kind: "file",
	change: "changed",
	path: "public/files/Plan.pptx",
	key: "item-1",
	driveId: "b!drive",
	title: "Q4 plan.pptx",
	latestFrom: "Sam Park",
	latestAt: "2026-11-18T15:00:00Z",
	copiedAt: "2026-11-14T17:00:00Z",
	webUrl: "https://contoso.sharepoint.com/plan",
};
const CHAT: TwinUpdate = {
	id: "copy-chat",
	twinId: "twin-1",
	kind: "chat",
	change: "changed",
	path: "public/teams-chats/Chat - Hiring.md",
	key: "19:abc@thread.v2",
	count: 1,
	latestFrom: "Priya",
	latestAt: "2026-11-19T15:00:00Z",
};
const OLDER: TwinUpdate = {
	id: "copy-older",
	twinId: "twin-1",
	kind: "email",
	change: "duplicate",
	path: "public/emails/Email thread - Offsite.md",
	key: "conversation:conv-2",
	newerCopy: "public/emails/Email thread - Offsite (2).md",
};
const GONE: TwinUpdate = {
	id: "copy-gone",
	twinId: "twin-1",
	kind: "file",
	change: "gone",
	path: "public/files/Old pricing.xlsx",
	key: "item-2",
	driveId: "b!drive",
};
const ELSEWHERE: TwinUpdate = {
	...THREAD,
	id: "copy-other",
	twinId: "twin-2",
	path: "public/emails/Email thread - Elsewhere.md",
};
const ALL = [THREAD, FILE, CHAT, OLDER, GONE, ELSEWHERE];
const DONE: TwinCheck = {
	id: "job-0",
	status: "done",
	finishedAt: "2026-11-19T15:02:00Z",
};

/** What the server answers each reactor with; an Error is a refusal. */
let answers: Record<string, unknown>;
const ran = (): string[] =>
	insight.actions.run.mock.calls.map(([statement]) => statement as string);
const refresh = vi.fn();
const onChanged = vi.fn();

function resource(
	found: TwinUpdatesFound | null,
	error = "",
): VisibleResource<TwinUpdatesFound> {
	return { data: found, error, isLoading: false, checkedAt: null, refresh };
}

/** The place for twin-1; with a session it also offers how often to check. Returns what the session was told. */
function renderUpdates(
	updates: VisibleResource<TwinUpdatesFound>,
	hasSession = false,
) {
	const onChange = vi.fn<(change: CollaborationChange) => void>();
	const place = (
		<TwinUpdates twinId="twin-1" updates={updates} onChanged={onChanged} />
	);
	const view = render(
		hasSession ? (
			<CollaborationSessionProvider
				initialState={createInitialCollaborationState()}
				onChange={onChange}
			>
				{place}
			</CollaborationSessionProvider>
		) : (
			place
		),
	);
	return { ...view, onChange };
}
const row = (name: string): HTMLElement => {
	const item = screen.getByText(name).closest("li");
	if (!item) throw new Error(`No row for ${name}`);
	return item;
};

beforeEach(() => {
	answers = {
		SearchAppAssets: ALL.map((update) => ({ path: `/${update.path}` })),
	};
	insight.actions.run.mockReset();
	insight.actions.run.mockImplementation(async (statement: string) => {
		const reactor = statement.slice(0, statement.indexOf("("));
		const answer =
			reactor === "Copy"
				? {
						targetFilePath: /targetFilePath=\["([^"]+)"\]/.exec(
							statement,
						)?.[1],
					}
				: answers[reactor];
		if (answer instanceof Error) throw answer;
		return {
			pixelReturn: [
				{ output: answer ?? true, operationType: ["OPERATION"] },
			],
		};
	});
	saveItem.mockReset();
	saveItem.mockResolvedValue({
		path: "saved again.md",
		name: "saved again.md",
		service: "outlook-mail",
	});
	signIn.mockReset();
	refresh.mockReset();
	onChanged.mockReset();
	vi.spyOn(toast, "success").mockImplementation(() => "");
	vi.spyOn(toast, "error").mockImplementation(() => "");
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

it("lists what waits for this twin, each with why, and nothing of another twin", () => {
	renderUpdates(resource({ updates: ALL, lastCheck: DONE }));

	expect(
		within(screen.getByRole("list", { name: "Suggested updates" }))
			.getAllByRole("listitem")
			.map((item) => item.querySelector("p")?.textContent),
	).toEqual([
		"Email thread - Budget.md",
		"Plan.pptx",
		"Chat - Hiring.md",
		"Email thread - Offsite.md",
		"Old pricing.xlsx",
	]);
	expect(row("Email thread - Budget.md")).toHaveTextContent(
		/"Budget review": 3 new emails, latest from Dana Lee, Nov 1[78]\./,
	);
	// a file says who changed it, how old the copy is, and its name now
	expect(row("Plan.pptx")).toHaveTextContent(
		/Changed by Sam Park on Nov 1[78]\. Your copy is from Nov 1[34]\. It is now named "Q4 plan\.pptx"\./,
	);
	expect(
		within(row("Plan.pptx")).getByRole("link", { name: "Open original" }),
	).toHaveAttribute("href", "https://contoso.sharepoint.com/plan");
	expect(row("Chat - Hiring.md")).toHaveTextContent(
		/1 new message, latest from Priya/,
	);
	expect(row("Email thread - Offsite.md")).toHaveTextContent(
		'You hold a newer copy of this conversation: "Email thread - Offsite (2).md".',
	);
	expect(row("Old pricing.xlsx")).toHaveTextContent(
		"The original is no longer in its drive.",
	);
	// what can be done: a changed copy is updated or left, the others removed or kept
	expect(
		within(row("Email thread - Budget.md"))
			.getAllByRole("button")
			.map((button) => button.textContent),
	).toEqual(["Update", "Dismiss"]);
	expect(
		within(row("Old pricing.xlsx"))
			.getAllByRole("button")
			.map((button) => button.textContent),
	).toEqual(["Remove copy", "Keep"]);
	expect(screen.getByRole("button", { name: "Update all 3" })).toBeVisible();
	expect(screen.getByText(/^Last checked /)).toBeVisible();
});

it("updates a copy on the owner's press: the item is saved again and written over it", async () => {
	const user = userEvent.setup();
	renderUpdates(resource({ updates: ALL, lastCheck: DONE }));

	await user.click(
		screen.getByRole("button", {
			name: "Update: Email thread - Budget.md",
		}),
	);
	await waitFor(() =>
		expect(toast.success).toHaveBeenCalledWith(
			'Updated "Email thread - Budget.md" in your Digital Twin.',
		),
	);
	expect(saveItem).toHaveBeenCalledWith("insight-1", {
		kind: "email",
		conversationId: "conv-1",
	});
	expect(ran().slice(1)).toEqual([
		'Copy(sourceType=["INSIGHT"], sourceFilePath=["saved again.md"], target=["twin-1"], targetType=["PROJECT"], targetFilePath=["public/emails/Email thread - Budget.md"], override=[true]);',
		'WorkSettleTwinUpdate(updateId=["copy-thread"], action=["applied"]);',
	]);
	// the page reads what the twin holds again, and everyone who counts reads the list again
	expect(onChanged).toHaveBeenCalledOnce();
	expect(refresh).toHaveBeenCalled();
	expect(
		screen.queryByText("Email thread - Budget.md"),
	).not.toBeInTheDocument();
	expect(screen.getByText("Plan.pptx")).toBeVisible();
});

it("says why a copy could not be updated, and keeps its suggestion", async () => {
	const user = userEvent.setup();
	saveItem.mockRejectedValue(
		new Error("That email is no longer in the mailbox."),
	);
	renderUpdates(resource({ updates: [THREAD], lastCheck: DONE }));

	await user.click(screen.getByRole("button", { name: /^Update: / }));
	await waitFor(() =>
		expect(toast.error).toHaveBeenCalledWith(
			'Could not update "Email thread - Budget.md".',
			{ description: "That email is no longer in the mailbox." },
		),
	);
	expect(onChanged).not.toHaveBeenCalled();
	expect(screen.getByText("Email thread - Budget.md")).toBeVisible();
	expect(ran().some((statement) => statement.startsWith("Copy"))).toBe(false);
});

it("updates every changed copy in turn, and leaves the ones to remove", async () => {
	const user = userEvent.setup();
	renderUpdates(resource({ updates: ALL, lastCheck: DONE }));

	await user.click(screen.getByRole("button", { name: "Update all 3" }));
	await waitFor(() => expect(onChanged).toHaveBeenCalledOnce());
	expect(
		ran().filter((statement) =>
			statement.startsWith("WorkSettleTwinUpdate"),
		),
	).toEqual([
		'WorkSettleTwinUpdate(updateId=["copy-thread"], action=["applied"]);',
		'WorkSettleTwinUpdate(updateId=["copy-file"], action=["applied"]);',
		'WorkSettleTwinUpdate(updateId=["copy-chat"], action=["applied"]);',
	]);
	// a file is read again from the drive its copy recorded
	expect(saveItem).toHaveBeenCalledWith("insight-1", {
		kind: "file",
		itemId: "item-1",
		driveId: "b!drive",
		name: "Plan.pptx",
	});
	expect(
		screen
			.getAllByRole("listitem")
			.map((item) => item.querySelector("p")?.textContent),
	).toEqual(["Email thread - Offsite.md", "Old pricing.xlsx"]);
});

it("keeps a copy as it is, and removes one, on the owner's press", async () => {
	const user = userEvent.setup();
	renderUpdates(resource({ updates: ALL, lastCheck: DONE }));

	await user.click(
		screen.getByRole("button", { name: "Dismiss: Chat - Hiring.md" }),
	);
	await waitFor(() =>
		expect(screen.queryByText("Chat - Hiring.md")).not.toBeInTheDocument(),
	);
	expect(ran()).toEqual([
		'WorkSettleTwinUpdate(updateId=["copy-chat"], action=["dismissed"]);',
	]);
	// nothing in the twin changed
	expect(onChanged).not.toHaveBeenCalled();

	await user.click(
		screen.getByRole("button", { name: "Remove copy: Old pricing.xlsx" }),
	);
	await waitFor(() =>
		expect(toast.success).toHaveBeenCalledWith(
			'Removed "Old pricing.xlsx" from your Digital Twin.',
		),
	);
	expect(ran().slice(2)).toEqual([
		'DeleteAppAssets(project=["twin-1"], filePath=["/public/files/Old pricing.xlsx"]);',
		'WorkSettleTwinUpdate(updateId=["copy-gone"], action=["dismissed"]);',
	]);
	expect(onChanged).toHaveBeenCalledOnce();
});

it("checks now, saying what the check is doing, then reads the list again", async () => {
	const user = userEvent.setup();
	let finish: (job: TwinCheck) => void = () => {};
	answers.WorkCheckTwinUpdates = {
		id: "job-1",
		status: "running",
		step: "mail",
		progress: 15,
	};
	insight.actions.run.mockImplementationOnce(async () => ({
		pixelReturn: [
			{
				output: answers.WorkCheckTwinUpdates,
				operationType: ["OPERATION"],
			},
		],
	}));
	insight.actions.run.mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				finish = (job) =>
					resolve({
						pixelReturn: [
							{ output: job, operationType: ["OPERATION"] },
						],
					});
			}),
	);
	vi.useFakeTimers({ toFake: ["setTimeout"], shouldAdvanceTime: true });
	renderUpdates(resource({ updates: [], lastCheck: null }));
	expect(screen.getByText("Not checked yet.")).toBeVisible();

	await user.click(screen.getByRole("button", { name: "Check now" }));
	expect(
		await screen.findByText("Reading your Outlook conversations…"),
	).toBeVisible();
	expect(screen.getByRole("button", { name: "Checking…" })).toBeDisabled();
	expect(
		screen.getByRole("progressbar", { name: "How far the check is" }),
	).toHaveAttribute("aria-valuenow", "15");
	await vi.advanceTimersByTimeAsync(1600);
	finish({ id: "job-1", status: "done", progress: 100 });
	await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
	expect(screen.getByRole("button", { name: "Check now" })).toBeEnabled();
	expect(ran()).toEqual([
		"WorkCheckTwinUpdates();",
		'BrainGetJob(jobId=["job-1"]);',
	]);
	vi.useRealTimers();
});

it("offers the Microsoft sign in when a check needs it, and checks again after it", async () => {
	const user = userEvent.setup();
	answers.WorkCheckTwinUpdates = new Error('{"type":"microsoft"}');
	signIn.mockImplementation(async () => {
		answers.WorkCheckTwinUpdates = { id: "job-2", status: "done" };
	});
	renderUpdates(resource({ updates: [], lastCheck: null }));

	await user.click(screen.getByRole("button", { name: "Check now" }));
	expect(
		await screen.findByText(
			"Sign in to Microsoft 365 to check your Digital Twins.",
		),
	).toBeVisible();
	await user.click(
		screen.getByRole("button", { name: "Sign in to Microsoft 365" }),
	);
	await waitFor(() =>
		expect(
			screen.queryByText(
				"Sign in to Microsoft 365 to check your Digital Twins.",
			),
		).not.toBeInTheDocument(),
	);
	expect(signIn).toHaveBeenCalledOnce();
	expect(ran()).toEqual([
		"WorkCheckTwinUpdates();",
		"WorkCheckTwinUpdates();",
	]);
});

it("says why a check failed, in the server's words", async () => {
	const user = userEvent.setup();
	answers.WorkCheckTwinUpdates = {
		id: "job-3",
		status: "failed",
		error: "Microsoft 365 did not answer",
	};
	renderUpdates(resource({ updates: [], lastCheck: DONE }));

	await user.click(screen.getByRole("button", { name: "Check now" }));
	expect(
		await screen.findByText("Microsoft 365 did not answer"),
	).toBeVisible();
	expect(
		screen.queryByRole("button", { name: "Sign in to Microsoft 365" }),
	).not.toBeInTheDocument();
});

it("says where it stands before anything is listed", () => {
	const reading = renderUpdates(resource(null));
	expect(screen.getByText("Reading what waits for you…")).toBeVisible();
	reading.unmount();

	const failed = renderUpdates(resource(null, "The server did not answer."));
	expect(screen.getByText("The server did not answer.")).toBeVisible();
	screen.getByRole("button", { name: "Try again" }).click();
	expect(refresh).toHaveBeenCalledOnce();
	failed.unmount();

	const never = renderUpdates(resource({ updates: [], lastCheck: null }));
	expect(screen.getByText(/^Check now to see whether /)).toBeVisible();
	never.unmount();

	const current = renderUpdates(resource({ updates: [], lastCheck: DONE }));
	expect(screen.getByText(/^Nothing to update: /)).toBeVisible();
	current.unmount();

	// a check the server started by itself shows as one under way
	const running = renderUpdates(
		resource({
			updates: [],
			lastCheck: { id: "job-4", status: "running", step: "files" },
		}),
	);
	expect(screen.getByText("Reading your files…")).toBeVisible();
	expect(screen.getByRole("button", { name: "Checking…" })).toBeDisabled();
	running.unmount();

	renderUpdates(
		resource({
			updates: [],
			lastCheck: {
				id: "job-5",
				status: "failed",
				error: "Could not sign in to Microsoft",
			},
		}),
	);
	expect(screen.getByText("The last check did not finish.")).toBeVisible();
	expect(screen.getByText("Could not sign in to Microsoft")).toBeVisible();
});

it("lets the owner choose how often their twins are checked, where a session is around it", async () => {
	const user = userEvent.setup();
	const { onChange } = renderUpdates(
		resource({ updates: [], lastCheck: DONE }),
		true,
	);

	const often = screen.getByRole("combobox", { name: "Check automatically" });
	expect(often).toHaveTextContent("Every day");
	often.focus();
	await user.keyboard("{Enter}");
	expect(
		screen.getAllByRole("option").map((option) => option.textContent),
	).toEqual(["Every day", "Every 4 hours", "Every hour", "Off"]);
	await user.keyboard("{ArrowDown}{Enter}");
	await waitFor(() =>
		expect(onChange).toHaveBeenCalledWith(
			expect.objectContaining({
				next: expect.objectContaining({
					settings: expect.objectContaining({
						twinCheckEveryHours: 4,
					}),
				}),
			}),
		),
	);
	cleanup();
	// no session, as on an isolated surface: nothing to choose
	renderUpdates(resource({ updates: [], lastCheck: DONE }));
	expect(
		screen.queryByRole("combobox", { name: "Check automatically" }),
	).not.toBeInTheDocument();
});
