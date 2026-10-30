import {
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { toast } from "@semoss/ui/next";
import { getJob, type Job } from "@/features/onboarding/onboarding-api";
import {
	applyTopicMatches,
	startTopicMatches,
	type TopicMatch,
} from "../api/topic-matches";
import {
	WorkUpdatesContext,
	type WorkUpdatesStatus,
} from "../live/work-updates.context";
import { createInitialCollaborationState } from "../state/collaboration.fixtures";
import { CollaborationSessionProvider } from "../state/collaboration-session.context";
import { TopicDetail } from "./topic-detail";
import { TopicEditor } from "./topic-editor";
import { TopicMatchesDialog } from "./topic-matches-dialog";

// one insight for every render, as the real provider gives; job polling restarts when it changes
const insight = vi.hoisted(() => ({ actions: {} }));
vi.mock("@semoss/sdk/react", () => ({ useInsight: () => insight }));
// the topic page opens its assistant by default; these tests are not about it
vi.mock("@/features/daily-chat/landing-chat-composer", () => ({
	LandingChatComposer: () => null,
}));
vi.mock("@/features/dashboard/topic-sessions", () => ({
	TopicSessions: () => null,
}));
vi.mock("@/features/onboarding/onboarding-api", async (importOriginal) => ({
	...(await importOriginal<
		typeof import("@/features/onboarding/onboarding-api")
	>()),
	getJob: vi.fn(),
}));
vi.mock("../api/topic-matches", async (importOriginal) => ({
	...(await importOriginal<typeof import("../api/topic-matches")>()),
	startTopicMatches: vi.fn(),
	applyTopicMatches: vi.fn(),
}));

const TOPIC = "Northwind - Engineering partnership";

function job(overrides: Partial<Job>): Job {
	return {
		id: "job-1",
		status: "running",
		step: "scoring",
		progress: 40,
		counts: {},
		error: "",
		finishedAt: "",
		mode: "",
		reviewId: "",
		reviewRevision: null,
		...overrides,
	};
}

function match(threadId: string, overrides: Partial<TopicMatch> = {}) {
	return {
		threadId,
		subject: `Subject ${threadId}`,
		channel: "email",
		lastMessageAt: "2026-10-20T14:00:00Z",
		confidence: 90,
		fit: "best",
		links: [],
		ops: ["also_link"],
		op: "also_link",
		...overrides,
	} satisfies TopicMatch;
}

function finished(matches: TopicMatch[], scanned = 120): Job {
	return job({
		status: "done",
		progress: 100,
		finishedAt: "2026-10-29T15:04:00Z",
		counts: { scanned, matches, errors: 0 },
	});
}

function liveUpdates(): WorkUpdatesStatus {
	return {
		isRefreshing: false,
		lastUpdated: null,
		error: "",
		lastMailCheck: null,
		refresh: vi.fn(),
		refreshTopicGoal: vi.fn(),
		refreshTopic: vi.fn(),
		isSyncing: false,
		lastSync: null,
		syncError: "",
		syncMail: vi.fn(),
		// the page knows the topic by the id it was made with
		serverId: vi.fn(async (id: string) =>
			id === "t-geng" ? "server-geng" : id,
		),
		localId: (id: string) => (id === "server-geng" ? "t-geng" : id),
	};
}

function liveState() {
	const state = createInitialCollaborationState();
	const topic = state.topics.find((entry) => entry.id === "t-geng");
	if (!topic) throw new Error("Missing topic fixture");
	topic.isSample = false;
	return { state, topic };
}

function renderDialog() {
	const { state, topic } = liveState();
	const updates = liveUpdates();
	const onOpenChange = vi.fn();
	render(
		<CollaborationSessionProvider initialState={state}>
			<TopicMatchesDialog
				topic={topic}
				updates={updates}
				open
				onOpenChange={onOpenChange}
				returnFocusRef={{ current: null }}
			/>
		</CollaborationSessionProvider>,
	);
	return { updates, onOpenChange, user: userEvent.setup() };
}

beforeEach(() => {
	vi.mocked(startTopicMatches).mockReset().mockResolvedValue(job({}));
	vi.mocked(applyTopicMatches).mockReset();
	vi.mocked(getJob).mockReset();
});
afterEach(cleanup);

it("checks only when asked, with the topic's server id, and applies exactly the choices on screen", async () => {
	vi.mocked(getJob).mockResolvedValue(
		finished([
			match("guessed", {
				links: [
					{
						topicId: "t-gsales",
						source: "confirmed",
						primary: true,
						kept: false,
					},
				],
				ops: ["move", "also_link"],
				op: "move",
			}),
			match("filed", {
				links: [
					{
						topicId: "t-board",
						source: "you",
						primary: true,
						kept: true,
					},
				],
			}),
			match("unfiled"),
		]),
	);
	vi.mocked(applyTopicMatches).mockResolvedValue({
		applied: 3,
		skipped: 0,
		results: [],
	});
	const { updates, onOpenChange, user } = renderDialog();
	expect(startTopicMatches).not.toHaveBeenCalled();
	expect(screen.getByText(/Nothing changes until you apply/)).toBeVisible();

	await user.click(
		screen.getByRole("button", { name: "Check conversations" }),
	);
	expect(startTopicMatches).toHaveBeenCalledWith({}, "server-geng");
	const list = await screen.findByRole("list", {
		name: `Conversations for ${TOPIC}`,
	});
	for (const box of within(list).getAllByRole("checkbox"))
		expect(box).toBeChecked();
	const guessed = within(list).getByRole("group", {
		name: `How "Subject guessed" joins ${TOPIC}`,
	});
	expect(
		within(guessed).getByRole("radio", { name: "Move here" }),
	).toHaveAttribute("aria-checked", "true");
	expect(
		within(list).getByText(/Moves from Northwind - Sales \/ GTM/),
	).toBeVisible();
	// a conversation the owner filed may only gain the topic
	expect(
		within(list).queryByRole("group", {
			name: `How "Subject filed" joins ${TOPIC}`,
		}),
	).not.toBeInTheDocument();
	expect(
		within(list).getByText(/Stays in Board readout - Q4 \(you filed it\)/),
	).toBeVisible();

	await user.click(within(guessed).getByRole("radio", { name: "Also add" }));
	await user.click(
		within(list).getByRole("checkbox", { name: "Subject unfiled" }),
	);
	expect(
		within(list).getByText(new RegExp(`Not about ${TOPIC}`)),
	).toBeVisible();
	expect(
		screen.getByText("0 to move · 2 to add · 1 not about this topic"),
	).toBeVisible();

	await user.click(screen.getByRole("button", { name: "Apply 3 changes" }));
	await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
	expect(applyTopicMatches).toHaveBeenCalledWith({}, "server-geng", [
		{ threadId: "guessed", op: "also_link" },
		{ threadId: "filed", op: "also_link" },
		{ threadId: "unfiled", op: "reject" },
	]);
	expect(updates.refresh).toHaveBeenCalledOnce();
});

it("leaves conversations behind Show more alone and keeps reviewing the rest", async () => {
	const matches = Array.from({ length: 12 }, (_, index) =>
		match(`thread-${index + 1}`),
	);
	vi.mocked(getJob).mockResolvedValue(finished(matches));
	vi.mocked(applyTopicMatches).mockResolvedValue({
		applied: 10,
		skipped: 0,
		results: [],
	});
	const { onOpenChange, user } = renderDialog();
	await user.click(
		screen.getByRole("button", { name: "Check conversations" }),
	);
	expect(
		await screen.findByRole("button", { name: /Show more/ }),
	).toHaveTextContent("Show more (2 left)");

	await user.click(screen.getByRole("button", { name: "Apply 10 changes" }));
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Apply 2 changes" }),
		).toBeEnabled(),
	);
	const [, , changes] = vi.mocked(applyTopicMatches).mock.calls[0] ?? [];
	expect(changes?.map((change) => change.threadId)).toEqual(
		matches.slice(0, 10).map((entry) => entry.threadId),
	);
	expect(
		screen.getByRole("checkbox", { name: "Subject thread-11" }),
	).toBeChecked();
	expect(onOpenChange).not.toHaveBeenCalled();
});

it("says why a check stopped and offers to run it again", async () => {
	vi.mocked(getJob).mockResolvedValue(
		job({ status: "failed", error: "No classifier model is set" }),
	);
	const { user } = renderDialog();
	await user.click(
		screen.getByRole("button", { name: "Check conversations" }),
	);
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"No classifier model is set",
	);
	await user.click(screen.getByRole("button", { name: "Check again" }));
	expect(startTopicMatches).toHaveBeenCalledTimes(2);
});

it("reports a check that found nothing without offering an empty apply", async () => {
	vi.mocked(getJob).mockResolvedValue(finished([], 200));
	const { user } = renderDialog();
	await user.click(
		screen.getByRole("button", { name: "Check conversations" }),
	);
	expect(
		await screen.findByText(
			`Nothing else fits ${TOPIC} in the 200 conversations checked.`,
		),
	).toBeVisible();
	expect(
		screen.queryByRole("button", { name: /^Apply/ }),
	).not.toBeInTheDocument();
});

function renderTopicPage(isSample: boolean) {
	const { state, topic } = liveState();
	topic.isSample = isSample;
	const router = createMemoryRouter(
		[{ path: "/topics/:topicId", element: <TopicDetail /> }],
		{ initialEntries: [`/topics/${topic.id}`] },
	);
	render(
		<CollaborationSessionProvider initialState={state}>
			<WorkUpdatesContext.Provider value={liveUpdates()}>
				<RouterProvider router={router} />
			</WorkUpdatesContext.Provider>
		</CollaborationSessionProvider>,
	);
	return userEvent.setup();
}

it("opens the review from a live topic's threads and its menu", async () => {
	const user = renderTopicPage(false);
	await user.click(screen.getByRole("tab", { name: "Threads" }));
	await user.click(
		screen.getByRole("button", { name: "Find conversations" }),
	);
	expect(
		await screen.findByRole("dialog", {
			name: `Find conversations for ${TOPIC}`,
		}),
	).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	await user.click(
		screen.getByRole("button", { name: "More topic actions" }),
	);
	await user.click(
		screen.getByRole("menuitem", { name: "Find conversations..." }),
	);
	expect(
		await screen.findByRole("dialog", {
			name: `Find conversations for ${TOPIC}`,
		}),
	).toBeVisible();
});

it("offers no review for a sample topic", async () => {
	const user = renderTopicPage(true);
	await user.click(screen.getByRole("tab", { name: "Threads" }));
	expect(
		screen.queryByRole("button", { name: "Find conversations" }),
	).not.toBeInTheDocument();
	await user.click(
		screen.getByRole("button", { name: "More topic actions" }),
	);
	expect(
		screen.queryByRole("menuitem", { name: "Find conversations..." }),
	).not.toBeInTheDocument();
});

function renderEditor(onFindConversations: () => void) {
	const { state, topic } = liveState();
	render(
		<CollaborationSessionProvider initialState={state}>
			<TopicEditor
				topic={topic}
				onClose={vi.fn()}
				returnFocusRef={{ current: null }}
				onFindConversations={onFindConversations}
			/>
		</CollaborationSessionProvider>,
	);
	return userEvent.setup();
}

it("offers the review after an edit to what Brain matches on, and only then", async () => {
	const saved = vi.spyOn(toast, "success").mockImplementation(() => "saved");
	const onFindConversations = vi.fn();
	const user = renderEditor(onFindConversations);
	await user.type(
		screen.getByRole("textbox", { name: "Short name (required)" }),
		"2",
	);
	await user.click(screen.getByRole("button", { name: "Save topic" }));
	expect(saved).not.toHaveBeenCalled();
	cleanup();

	const next = renderEditor(onFindConversations);
	await next.type(
		screen.getByRole("textbox", { name: "Description" }),
		" and GPUs",
	);
	await next.click(screen.getByRole("button", { name: "Save topic" }));
	expect(saved).toHaveBeenCalledWith(
		"Topic saved",
		expect.objectContaining({
			action: {
				label: "Find conversations",
				onClick: onFindConversations,
			},
		}),
	);
	saved.mockRestore();
});
