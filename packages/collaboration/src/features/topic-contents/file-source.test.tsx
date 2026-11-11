import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { OneDriveViewerProps } from "@semoss/connectors";
import { toast } from "@semoss/ui/next";
import {
	WorkUpdatesContext,
	type WorkUpdatesStatus,
} from "@/features/collaboration/live/work-updates.context";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { TopicFile } from "@/features/collaboration/state/collaboration.types";
import {
	CollaborationSessionProvider,
	useCollaborationSession,
} from "@/features/collaboration/state/collaboration-session.context";
import { linkTopicFile } from "./api/topic-files";
import { FileSource } from "./file-source";

const mocks = vi.hoisted(() => ({ insight: { actions: {} } }));

// a drive's explorer is the library's own; the list only has to give each file its box
vi.mock("@semoss/connectors", async (importOriginal) => {
	const drive =
		(name: string) =>
		({ getFileAction }: OneDriveViewerProps) => {
			const action = getFileAction?.({
				id: "item-plan",
				driveId: "drive-1",
				name: "Plan.docx",
				isFolder: false,
			});
			return (
				<div>
					<p>{name}</p>
					{action && (
						<button
							type="button"
							onClick={() =>
								void action.action({
									name: "Plan.docx",
									path: "/Plan.docx",
								})
							}
						>
							{action.name}
						</button>
					)}
				</div>
			);
		};
	return {
		...(await importOriginal<typeof import("@semoss/connectors")>()),
		OneDriveViewer: drive("The OneDrive explorer"),
		TeamsFilesViewer: drive("The Teams files explorer"),
	};
});
vi.mock("@semoss/sdk/react", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk/react")>()),
	useInsight: () => mocks.insight,
}));
vi.mock("./api/topic-files", () => ({ linkTopicFile: vi.fn() }));
vi.mock("@/features/connectors/api/microsoft", () => ({
	connectMicrosoft: vi.fn(),
}));

const TOPIC = "t-geng";
const link = vi.mocked(linkTopicFile);
const BUDGET: TopicFile = {
	itemId: "item-budget",
	driveId: "drive-1",
	name: "Budget.xlsx",
	source: "onedrive",
};
const PLAN: TopicFile = {
	itemId: "item-plan",
	driveId: "drive-1",
	name: "Plan.docx",
	source: "teams",
};

const updates: WorkUpdatesStatus = {
	isRefreshing: false,
	lastUpdated: null,
	error: "",
	lastMailCheck: null,
	refresh: vi.fn(),
	refreshTopic: vi.fn(),
	isSyncing: false,
	lastSync: null,
	syncError: "",
	syncMail: vi.fn(),
	serverId: async (id) => (id === TOPIC ? "server-geng" : id),
	localId: (id) => id,
};

function SourceFixture({ view }: { view: "topic" | "onedrive" | "teams" }) {
	const { state } = useCollaborationSession();
	const topic = state.topics.find((candidate) => candidate.id === TOPIC);
	if (!topic) throw new Error("Missing topic fixture");
	return <FileSource topic={topic} view={view} />;
}

/** The fixture's topic as a saved one holding the given files. */
function setup(view: "topic" | "onedrive" | "teams", files: TopicFile[] = []) {
	const state = createInitialCollaborationState();
	for (const topic of state.topics) {
		topic.isSample = false;
		if (topic.id === TOPIC) topic.files = files;
	}
	render(
		<WorkUpdatesContext.Provider value={updates}>
			<CollaborationSessionProvider initialState={state}>
				<SourceFixture view={view} />
			</CollaborationSessionProvider>
		</WorkUpdatesContext.Provider>,
	);
	return userEvent.setup();
}

const box = (name: string) => screen.getByRole("checkbox", { name });

beforeEach(() => {
	vi.clearAllMocks();
});
afterEach(cleanup);

it("links a file picked in OneDrive by the ids Microsoft 365 knows it by, and shows it as in the topic", async () => {
	link.mockResolvedValue([{ ...PLAN, source: "onedrive" }]);
	const user = setup("onedrive");
	expect(
		screen.getByRole("heading", { level: 2, name: "OneDrive" }),
	).toBeVisible();
	expect(screen.getByText("The OneDrive explorer")).toBeVisible();
	expect(
		screen.getByText("Check a file to add it to this topic."),
	).toBeVisible();

	await user.click(
		screen.getByRole("button", { name: "Add Plan.docx to this topic" }),
	);

	// the topic by the id the server knows it by
	expect(link).toHaveBeenCalledWith(
		mocks.insight.actions,
		"server-geng",
		expect.objectContaining({
			itemId: "item-plan",
			driveId: "drive-1",
			source: "onedrive",
		}),
		false,
	);
	expect(
		await screen.findByRole("button", {
			name: "Remove Plan.docx from this topic",
		}),
	).toBeVisible();
	expect(screen.getByText('Added "Plan.docx" to this topic.')).toBeVisible();
});

it("takes a file off the topic from the drive it was picked in, and says a Teams file came from Teams", async () => {
	link.mockResolvedValue([]);
	const user = setup("teams", [PLAN]);
	expect(
		screen.getByRole("heading", { level: 2, name: "Teams files" }),
	).toBeVisible();
	expect(screen.getByText("The Teams files explorer")).toBeVisible();

	await user.click(
		screen.getByRole("button", {
			name: "Remove Plan.docx from this topic",
		}),
	);

	expect(link).toHaveBeenCalledWith(
		mocks.insight.actions,
		"server-geng",
		expect.objectContaining({ itemId: "item-plan", source: "teams" }),
		true,
	);
	expect(
		await screen.findByRole("button", {
			name: "Add Plan.docx to this topic",
		}),
	).toBeVisible();
	expect(
		screen.getByText('Removed "Plan.docx" from this topic.'),
	).toBeVisible();
});

it("lists the topic's files, and keeps one taken off in the list so it can be put back", async () => {
	const user = setup("topic", [BUDGET, PLAN]);
	expect(
		screen.getByRole("list", { name: "Files in this topic" }),
	).toBeVisible();
	expect(box("Budget.xlsx")).toBeChecked();
	expect(box("Budget.xlsx")).toHaveAccessibleDescription("In OneDrive");
	expect(box("Plan.docx")).toHaveAccessibleDescription("In Teams");

	link.mockResolvedValue([PLAN]);
	await user.click(box("Budget.xlsx"));
	await waitFor(() => expect(box("Budget.xlsx")).not.toBeChecked());
	expect(link).toHaveBeenLastCalledWith(
		mocks.insight.actions,
		"server-geng",
		expect.objectContaining({ itemId: "item-budget" }),
		true,
	);
	expect(
		screen.getByText('Removed "Budget.xlsx" from this topic.'),
	).toBeVisible();
	// in the place it had, not moved to the end of the list
	expect(screen.getAllByRole("checkbox")[0]).toBe(box("Budget.xlsx"));

	link.mockResolvedValue([PLAN, BUDGET]);
	await user.click(box("Budget.xlsx"));
	await waitFor(() => expect(box("Budget.xlsx")).toBeChecked());
	expect(screen.getAllByRole("checkbox")[0]).toBe(box("Budget.xlsx"));
	expect(link).toHaveBeenLastCalledWith(
		mocks.insight.actions,
		"server-geng",
		expect.objectContaining({ itemId: "item-budget", driveId: "drive-1" }),
		false,
	);
});

it("narrows the topic's files by name", async () => {
	const user = setup("topic", [BUDGET, PLAN]);
	await user.type(
		screen.getByRole("searchbox", { name: "Search Files in this topic" }),
		"plan",
	);
	expect(screen.getAllByRole("checkbox")).toHaveLength(1);
	expect(box("Plan.docx")).toBeChecked();
});

it("says when a file could not be linked, with the server's reason, and leaves it out of the topic", async () => {
	const error = vi.spyOn(toast, "error");
	link.mockRejectedValue(new Error("That is a folder. Choose a file"));
	const user = setup("onedrive");

	await user.click(
		screen.getByRole("button", { name: "Add Plan.docx to this topic" }),
	);

	await waitFor(() =>
		expect(error).toHaveBeenCalledWith('Could not add "Plan.docx".', {
			description: "That is a folder. Choose a file",
		}),
	);
	expect(
		screen.getByRole("button", { name: "Add Plan.docx to this topic" }),
	).toBeVisible();
	expect(
		screen.getByText("Check a file to add it to this topic."),
	).toBeVisible();
});
