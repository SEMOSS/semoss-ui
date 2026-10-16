import {
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { loadLiveState } from "@/features/collaboration/live/live-state";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { reviewOverview, reviewQuestion } from "./brain-review.test-fixtures";
import type {
	ReviewDecisionPage,
	ReviewOverview,
	ReviewQuestion,
} from "./brain-review-api";
import { BrainReviewWorkspace } from "./brain-review-workspace";

const { run } = vi.hoisted(() => ({ run: vi.fn() }));
const actions = { run };
vi.mock("@semoss/sdk/react", async (original) => ({
	...(await original<typeof import("@semoss/sdk/react")>()),
	useInsight: () => ({ actions }),
}));
vi.mock("@/features/collaboration/live/live-state", () => ({
	loadLiveState: vi.fn(),
}));
vi.mock("@/features/collaboration/components/brain-overview", () => ({
	BrainOverview: () => <p>Brain context</p>,
}));
let overview: ReviewOverview;
let decisions: ReviewDecisionPage;
let job: Record<string, unknown> | null;
let failOverview = false,
	failAnswer = false,
	failUndo = false;
const answered = new Map<string, ReviewQuestion>();
function response(output: unknown) {
	return { pixelReturn: [{ output, operationType: ["MAP"] }] };
}
function LocationObserver() {
	const location = useLocation();
	return <output aria-label="Current location">{location.pathname}</output>;
}
function mount() {
	render(
		<CollaborationSessionProvider
			initialState={createInitialCollaborationState()}
		>
			<MemoryRouter initialEntries={["/brain"]}>
				<BrainReviewWorkspace />
				<LocationObserver />
			</MemoryRouter>
		</CollaborationSessionProvider>,
	);
}
beforeEach(() => {
	HTMLElement.prototype.hasPointerCapture = () => false;
	HTMLElement.prototype.setPointerCapture = () => {};
	HTMLElement.prototype.releasePointerCapture = () => {};
	vi.resetAllMocks();
	overview = reviewOverview();
	decisions = { items: [], total: 0 };
	job = null;
	failOverview = false;
	failAnswer = false;
	failUndo = false;
	answered.clear();
	vi.mocked(loadLiveState).mockResolvedValue(
		createInitialCollaborationState(),
	);
	run.mockImplementation(async (statement: string) => {
		if (statement.startsWith("BrainGetReviewOverview")) {
			if (failOverview) throw new Error("Review unavailable");
			return response({ ...overview, job });
		}
		if (statement.startsWith("BrainListReviewDecisions"))
			return response(decisions);
		if (statement.startsWith("BrainRequestFilingReview")) {
			const q = reviewQuestion(
				"correction",
				"wrong_topic",
				"Correct filing: Previously filed conversation",
				{
					subject: "Previously filed conversation",
					currentTopics: [
						{ id: "topic-a", name: "Northwind Migration" },
					],
				},
			);
			overview.pending.items = [q, ...overview.pending.items];
			overview.pending.total++;
			return response(q);
		}
		if (statement.startsWith("BrainAnswerReview")) {
			if (failAnswer) throw new Error("Answer unavailable");
			const q = overview.pending.items.find((row) =>
				statement.includes(`reviewId=["${row.id}"]`),
			);
			if (!q) throw new Error("Question missing");
			answered.set(q.id, q);
			overview.pending.items = overview.pending.items.filter(
				(row) => row.id !== q.id,
			);
			overview.pending.total--;
			overview.health = {
				...overview.health,
				questionsWaiting: overview.health.questionsWaiting - 1,
				decisionsAnswered: overview.health.decisionsAnswered + 1,
				...(q.kind === "unassigned"
					? { filedThreads: 4, unfiledThreads: 8, filedPercent: 33.3 }
					: {}),
			};
			decisions = {
				items: [
					{
						id: q.id,
						kind: q.kind,
						summary: `Answered: ${q.text}`,
						at: "2026-10-15T12:00:00Z",
						canUndo: true,
					},
					...decisions.items,
				],
				total: decisions.total + 1,
			};
			return response({ ...q, status: "accepted" });
		}
		if (statement.startsWith("BrainUndoReviewDecision")) {
			if (failUndo)
				throw new Error(
					"This data changed after your answer. Undo was not applied.",
				);
			const q = [...answered.values()].find((row) =>
				statement.includes(`reviewId=["${row.id}"]`),
			);
			if (!q) throw new Error("Decision missing");
			overview.pending.items = [q, ...overview.pending.items];
			overview.pending.total++;
			overview.health.decisionsAnswered--;
			decisions = {
				items: decisions.items.filter((row) => row.id !== q.id),
				total: decisions.total - 1,
			};
			return response(q);
		}
		if (statement.startsWith("BrainOptimize")) {
			job = {
				id: "optimize-one",
				kind: "optimize",
				status: "running",
				step: "Checking filing",
				progress: 15,
				counts: {},
				error: null,
			};
			return response(job);
		}
		if (statement.startsWith("BrainGetJob")) {
			job = {
				...job,
				status: "done",
				progress: 100,
				counts: {
					filings: 6,
					newTopics: 2,
					merges: 1,
					people: 1,
					quietTopics: 1,
				},
			};
			return response(job);
		}
		throw new Error(`Unexpected request: ${statement}`);
	});
});
afterEach(cleanup);

it("groups every review kind and shows measured health instead of a flat list", async () => {
	mount();
	await screen.findByRole("heading", { name: "Threads without a topic" });
	for (const heading of [
		"Suggested topic matches",
		"Topic changes you requested",
		"Suggested new topics",
		"Possible duplicate topics",
		"Topics with no recent activity",
		"Suggested topic members",
		"Frequent senders without a topic",
		"Memories to review",
	])
		expect(screen.getByRole("heading", { name: heading })).toBeVisible();
	expect(
		screen.getByText(/8.3% of mail conversations filed automatically/),
	).toHaveTextContent("9 with no topic");
	expect(screen.getByText(/3 of 12 mail conversations filed/)).toBeVisible();
	expect(
		screen.getByText("0 questions answered in the last 7 days"),
	).toBeVisible();
	expect(
		screen.getByRole("button", { name: "Optimize Brain" }),
	).toBeEnabled();
});

it("files an unassigned conversation inline and refreshes health and the decision log", async () => {
	const user = userEvent.setup();
	mount();
	const card = await screen.findByRole("article", {
		name: "ReviewCase: no topic",
	});
	await user.click(
		within(card).getByRole("combobox", { name: "Pick a topic" }),
	);
	await user.click(
		screen.getByRole("option", { name: "Northwind Migration" }),
	);
	await user.click(within(card).getByRole("button", { name: "File thread" }));
	await waitFor(() =>
		expect(
			screen.queryByRole("article", { name: "ReviewCase: no topic" }),
		).not.toBeInTheDocument(),
	);
	expect(screen.getByLabelText("Current location")).toHaveTextContent(
		"/brain",
	);
	await screen.findByText(/8 with no topic/);
	expect(
		screen.getByText("1 questions answered in the last 7 days"),
	).toBeVisible();
	expect(run).toHaveBeenCalledWith(
		'BrainAnswerReview(reviewId=["unfiled"], action=["accept"], topicId=["topic-a"]);',
	);
	await user.click(screen.getByRole("tab", { name: "Learned recently" }));
	await screen.findByText("Answered: ReviewCase: no topic");
	expect(screen.queryByText(/Filed under/)).not.toBeInTheDocument();
	await user.click(
		screen.getByRole("button", {
			name: "Undo: Answered: ReviewCase: no topic",
		}),
	);
	await waitFor(() =>
		expect(
			screen.queryByText("Answered: ReviewCase: no topic"),
		).not.toBeInTheDocument(),
	);
	await user.click(screen.getByRole("tab", { name: /Needs you/ }));
	await screen.findByRole("article", { name: "ReviewCase: no topic" });
});

it("opens an owner-requested wrong-topic correction before applying a new filing", async () => {
	const user = userEvent.setup();
	mount();
	await screen.findByRole("heading", { name: "Threads without a topic" });
	await user.click(screen.getByText("Start a topic change"));
	await user.click(screen.getByRole("combobox", { name: "Thread to move" }));
	await user.click(
		screen.getByRole("option", { name: "Previously filed conversation" }),
	);
	await user.click(screen.getByRole("button", { name: "Open topic change" }));
	const correction = await screen.findByRole("article", {
		name: "Previously filed conversation",
	});
	expect(within(correction).getByText("Currently filed under")).toBeVisible();
	expect(
		within(correction).getByText("Currently filed under")
			.nextElementSibling,
	).toHaveTextContent("Northwind Migration");
	expect(
		within(correction).getByRole("combobox", { name: "New topic" }),
	).toBeVisible();
	expect(
		within(correction).getByRole("button", { name: "Save topic change" }),
	).toBeVisible();
	expect(
		within(correction).getByText(/You requested a topic change/),
	).toBeVisible();
	expect(
		run.mock.calls.filter(([stmt]) => stmt.startsWith("BrainAnswerReview")),
	).toHaveLength(0);
});

it("keeps the inline selection after a failed answer and distinguishes load failures from empty Review", async () => {
	const user = userEvent.setup();
	failOverview = true;
	mount();
	await screen.findByRole("alert");
	expect(screen.queryByText(/All caught up/)).not.toBeInTheDocument();
	failOverview = false;
	await user.click(screen.getByRole("button", { name: "Refresh Review" }));
	const card = await screen.findByRole("article", {
		name: "ReviewCase: no topic",
	});
	await user.click(
		within(card).getByRole("combobox", { name: "Pick a topic" }),
	);
	await user.click(screen.getByRole("option", { name: "Product Launch" }));
	failAnswer = true;
	await user.click(within(card).getByRole("button", { name: "File thread" }));
	await screen.findByRole("alert");
	expect(
		within(card).getByRole("combobox", { name: "Pick a topic" }),
	).toHaveTextContent("Product Launch");
	expect(
		within(card).getByRole("button", { name: "File thread" }),
	).toBeEnabled();
});

it("shows Optimize progress, follows the exact job and reports proposals without answering them", async () => {
	const user = userEvent.setup();
	mount();
	await screen.findByRole("heading", { name: "Threads without a topic" });
	await user.click(screen.getByRole("button", { name: "Optimize Brain" }));
	await screen.findByText(/Checking filing · 15%/);
	expect(
		screen.getByRole("button", { name: "Optimizing Brain…" }),
	).toBeDisabled();
	await screen.findByText(
		/Optimization found 6 filing suggestions, 2 new topics, 1 merges/,
		{},
		{ timeout: 6000 },
	);
	expect(run).toHaveBeenCalledWith(
		'BrainGetJob(kind=["optimize"], jobId=["optimize-one"]);',
	);
	expect(
		run.mock.calls.filter(([stmt]) => stmt.startsWith("BrainAnswerReview")),
	).toHaveLength(0);
});

it("retains a decision when Undo is refused because its data changed", async () => {
	const user = userEvent.setup();
	mount();
	await screen.findByRole("heading", { name: "Memories to review" });
	await user.click(screen.getByRole("button", { name: "Keep memory" }));
	await user.click(screen.getByRole("tab", { name: "Learned recently" }));
	const undo = await screen.findByRole("button", {
		name: "Undo: Answered: Prefer a short weekly update",
	});
	failUndo = true;
	await user.click(undo);
	await screen.findByRole("alert");
	expect(undo).toBeEnabled();
	expect(
		screen.getByText("Answered: Prefer a short weekly update"),
	).toBeVisible();
});

it("validates an empty inline topic choice with an associated error", async () => {
	const user = userEvent.setup();
	mount();
	const card = await screen.findByRole("article", {
		name: "ReviewCase: no topic",
	});
	await user.click(within(card).getByRole("button", { name: "File thread" }));
	const field = within(card).getByRole("combobox", { name: "Pick a topic" });
	expect(field).toHaveAttribute("aria-invalid", "true");
	expect(field).toHaveAccessibleDescription("Choose a topic to continue.");
	expect(
		run.mock.calls.filter(([stmt]) => stmt.startsWith("BrainAnswerReview")),
	).toHaveLength(0);
});

it("keeps suggested topics actionable in their own section", async () => {
	const user = userEvent.setup();
	mount();
	const section = await screen.findByRole("region", {
		name: "Suggested topic matches",
	});
	expect(
		within(section).getByRole("button", {
			name: "File under Northwind Migration",
		}),
	).toBeVisible();
	expect(
		within(section).getByRole("button", {
			name: "File under Product Launch",
		}),
	).toBeVisible();
	await user.click(
		within(section).getByRole("button", {
			name: "File under Product Launch",
		}),
	);
	await waitFor(() =>
		expect(run).toHaveBeenCalledWith(
			'BrainAnswerReview(reviewId=["choice"], action=["accept"], topicId=["topic-b"]);',
		),
	);
});

it("shows loaded and total counts and retrieves the remaining questions", async () => {
	overview.pending.total = 10;
	overview.pendingCounts = {
		...overview.health.questionsByKind,
		unassigned: 3,
	};
	const original = run.getMockImplementation();
	run.mockImplementation(async (statement: string) => {
		if (
			statement.startsWith("BrainGetReviewOverview") &&
			statement.includes("offset=[8]")
		)
			return response({
				...overview,
				pending: {
					total: 10,
					items: [
						reviewQuestion(
							"extra-a",
							"unassigned",
							"Another unfiled thread",
						),
						reviewQuestion(
							"extra-b",
							"unassigned",
							"Last unfiled thread",
						),
					],
				},
			});
		return original?.(statement);
	});
	const user = userEvent.setup();
	mount();
	await screen.findByText(/Showing 8 of 10 questions/);
	const section = screen.getByRole("region", {
		name: "Threads without a topic",
	});
	expect(within(section).getByText("Showing 1 of 3 questions")).toBeVisible();
	await user.click(
		screen.getByRole("button", { name: "Load more questions" }),
	);
	await screen.findByText(/Showing 10 of 10 questions/);
	expect(within(section).getByText("Showing 3 of 3 questions")).toBeVisible();
	expect(
		screen.queryByRole("button", { name: "Load more questions" }),
	).not.toBeInTheDocument();
});

it("summarizes a failed model job and keeps the traceback behind technical details", async () => {
	job = {
		id: "failed-optimize",
		kind: "optimize",
		status: "failed",
		progress: 5,
		counts: {},
		error: "Traceback (most recent call last): POST classifier 502 Bad Gateway <html>nginx</html>",
	};
	mount();
	await screen.findByText(/The classifier service is unavailable/);
	const detail = screen.getByText("Technical details").closest("details");
	expect(detail).not.toHaveAttribute("open");
	expect(screen.getByText(/Traceback/)).not.toBeVisible();
	const user = userEvent.setup();
	await user.click(screen.getByText("Technical details"));
	expect(screen.getByText(/Traceback/)).toBeVisible();
});
