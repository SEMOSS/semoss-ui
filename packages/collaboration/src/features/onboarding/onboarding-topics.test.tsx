import {
	act,
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import {
	changesSent,
	evidenceSession,
	makeEvidence,
	noEvidence,
} from "./topic-evidence.test-fixtures";
import { DOT } from "./topic-flow-utils";
import {
	deferred,
	type MapJobWire,
	makeAreaReview,
	makeReview,
	makeTopic,
	nextStage,
	press,
	type ReviewWire,
	reviewSession,
	topicMapJob,
} from "./topic-review.test-fixtures";
import { TopicsStep } from "./topics-step";

function step(actions: InsightActions, onNext = vi.fn(), onBack = vi.fn()) {
	return (
		<StrictMode>
			<TopicsStep
				actions={actions}
				onNext={onNext}
				onBack={onBack}
				eyebrow="Step 7 of 8"
			/>
		</StrictMode>
	);
}

type Session = { run: { mock: { calls: unknown[][] } } };

// autosave waits half a second before it writes
const SAVED = { timeout: 3000 };

const statements = (session: Session, reactor: string) =>
	session.run.mock.calls
		.map(([statement]) => String(statement))
		.filter((statement) => statement.startsWith(`${reactor}(`));

async function openAreas(
	session = reviewSession(async () => makeAreaReview()),
	onNext = vi.fn(),
	onBack = vi.fn(),
) {
	const user = userEvent.setup();
	const view = render(step(session.actions, onNext, onBack));
	await screen.findByRole("heading", { name: "Your main areas of work" });
	return { session, user, view, onNext, onBack };
}

beforeEach(() => {
	vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});
afterEach(() => {
	cleanup();
	vi.useRealTimers();
	vi.restoreAllMocks();
});

describe("onboarding topics: building the draft", () => {
	it("shares initialization in Strict Mode and never polls when the draft already exists", async () => {
		const pending = deferred<ReviewWire>();
		const generate = vi.fn(() => pending.promise);
		const session = reviewSession(generate);
		render(step(session.actions));
		expect(generate).toHaveBeenCalledOnce();
		expect(
			screen.getByRole("heading", { name: "Finding your topics" }),
		).toBeVisible();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
		await act(async () => pending.resolve(makeAreaReview()));
		expect(
			await screen.findByRole("heading", {
				name: "Your main areas of work",
			}),
		).toBeVisible();
		expect(generate).toHaveBeenCalledOnce();
		expect(session.getJob).not.toHaveBeenCalled();
	});

	it("polls the topic job, shows what it found so far, then loads the draft", async () => {
		// only timeouts are faked; the clock also follows real time so Testing Library can settle
		vi.useFakeTimers({
			toFake: ["setTimeout", "clearTimeout"],
			shouldAdvanceTime: true,
		});
		const generate = vi
			.fn<() => Promise<ReviewWire | { job: MapJobWire }>>()
			.mockResolvedValueOnce({ job: topicMapJob("running", "reading") })
			.mockResolvedValue(makeAreaReview());
		const session = reviewSession(generate);
		session.getJob
			.mockResolvedValueOnce(
				topicMapJob("running", "naming", [
					"Northwind Migration",
					"Hiring",
				]),
			)
			.mockResolvedValueOnce(
				topicMapJob("running", "areas", [
					"Northwind Migration",
					"Hiring",
					"Budget Planning",
				]),
			)
			.mockResolvedValue(topicMapJob("done", "saving"));
		render(step(session.actions));
		expect(await screen.findByText("Naming each group")).toBeVisible();
		expect(screen.getByText("Found so far")).toBeVisible();
		expect(screen.getByText("Northwind Migration")).toBeVisible();
		expect(screen.getByText("Hiring")).toBeVisible();
		expect(screen.queryByText("Budget Planning")).not.toBeInTheDocument();
		expect(screen.getByText("120 conversations")).toBeVisible();
		expect(screen.getByRole("progressbar")).toBeVisible();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
		expect(session.getJob).toHaveBeenCalledWith(
			'BrainGetJob(kind=["topic_map"], jobId=["map-1"]);',
		);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});
		expect(
			await screen.findByText("Finding your main areas of work"),
		).toBeVisible();
		expect(screen.getByText("Budget Planning")).toBeVisible();
		expect(generate).toHaveBeenCalledOnce();

		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});
		expect(
			await screen.findByRole("heading", {
				name: "Your main areas of work",
			}),
		).toBeVisible();
		// the draft is read again once the job is done
		expect(generate).toHaveBeenCalledTimes(2);
		expect(
			screen.getByRole("checkbox", { name: "Recruiting" }),
		).toBeChecked();
		expect(screen.queryByText("Found so far")).not.toBeInTheDocument();
	});

	it("explains a failed job and starts over on Retry", async () => {
		const generate = vi
			.fn<() => Promise<ReviewWire | { job: MapJobWire }>>()
			.mockResolvedValueOnce({ job: topicMapJob("running", "reading") })
			.mockResolvedValue(makeAreaReview());
		const session = reviewSession(generate);
		session.getJob.mockResolvedValue({
			...topicMapJob("failed"),
			error: "Naming model unavailable",
		});
		const user = userEvent.setup();
		render(step(session.actions));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Naming model unavailable",
		);
		await user.click(screen.getByRole("button", { name: "Retry" }));
		expect(
			await screen.findByRole("heading", {
				name: "Your main areas of work",
			}),
		).toBeVisible();
		expect(generate).toHaveBeenCalledTimes(2);
	});

	it("shows a start failure and recovers on Retry", async () => {
		const generate = vi
			.fn<() => Promise<ReviewWire>>()
			.mockRejectedValueOnce(new Error("Mailbox is not connected"))
			.mockResolvedValue(makeAreaReview());
		const user = userEvent.setup();
		render(step(reviewSession(generate).actions));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Mailbox is not connected",
		);
		await user.click(screen.getByRole("button", { name: "Retry" }));
		expect(
			await screen.findByRole("checkbox", { name: "Recruiting" }),
		).toBeEnabled();
	});

	it.each(["success", "failure"])(
		"ignores a late %s from the previous insight",
		async (outcome) => {
			const pending = deferred<ReviewWire>();
			const old = reviewSession(() => pending.promise);
			const current = reviewSession(async () =>
				makeReview("Backend Hiring"),
			);
			const view = render(step(old.actions));
			view.rerender(step(current.actions));
			expect(
				await screen.findByRole("checkbox", { name: "Backend Hiring" }),
			).toBeEnabled();
			await act(async () => {
				if (outcome === "success")
					pending.resolve(makeReview("Old topic"));
				else pending.reject(new Error("Old request failed"));
			});
			expect(
				screen.queryByRole("checkbox", { name: "Old topic" }),
			).not.toBeInTheDocument();
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		},
	);
});

describe("onboarding topics: areas stage", () => {
	it("shows the first five areas and saves each keep toggle", async () => {
		const { session, user } = await openAreas();
		expect(screen.getByText("Step 7 of 8")).toBeVisible();
		for (const name of [
			"Recruiting",
			"Platform Operations",
			"Budget Planning",
			"Vendor Reviews",
			"Security Audits",
		])
			expect(screen.getByRole("checkbox", { name })).toBeChecked();
		expect(
			screen.queryByRole("checkbox", { name: "Customer Onboarding" }),
		).not.toBeInTheDocument();
		expect(await screen.findByText("5 topics kept")).toBeVisible();
		expect(
			screen.getAllByText(
				`2 conversations ${DOT} with Ana Lima, Bo Chen`,
			),
		).toHaveLength(5);

		await user.click(
			screen.getByRole("checkbox", { name: "Platform Operations" }),
		);
		expect(
			screen.getByRole("checkbox", { name: "Platform Operations" }),
		).not.toBeChecked();
		await waitFor(
			() =>
				expect(
					session.saved?.draft.topics.find(
						(topic) => topic.key === "topic-3",
					)?.keep,
				).toBe(false),
			SAVED,
		);
		expect(await screen.findByText("4 topics kept")).toBeVisible();
		const writes = statements(session, "BrainSaveTopicReview");
		expect(writes).toHaveLength(1);
		expect(writes[0]).toContain('reviewId=["review-1"], revision=[1]');
	});

	it("reveals five more areas and keeps the ones you take part in", async () => {
		const { session, user } = await openAreas();
		await user.click(screen.getByRole("button", { name: /^Show 2 more/ }));
		// suggested areas start kept, the rest stay off
		expect(
			screen.getByRole("checkbox", { name: "Customer Onboarding" }),
		).toBeChecked();
		expect(
			screen.getByRole("checkbox", { name: "Team Offsite" }),
		).not.toBeChecked();
		expect(
			screen.queryByRole("button", { name: /^Show/ }),
		).not.toBeInTheDocument();
		await waitFor(
			() =>
				expect(
					session.saved?.draft.topics.find(
						(topic) => topic.key === "topic-7",
					)?.keep,
				).toBe(true),
			SAVED,
		);
		expect(
			session.saved?.draft.topics.find((topic) => topic.key === "topic-8")
				?.keep,
		).toBe(false);
		expect(await screen.findByText("6 topics kept")).toBeVisible();
	});

	it("never hides a kept area behind Show more", async () => {
		const review = makeAreaReview();
		const last = review.draft.topics.find(
			(topic) => topic.key === "topic-8",
		);
		if (last) last.keep = true;
		await openAreas(reviewSession(async () => review));
		expect(
			screen.getByRole("checkbox", { name: "Team Offsite" }),
		).toBeChecked();
		expect(
			screen.getByRole("checkbox", { name: "Customer Onboarding" }),
		).not.toBeChecked();
		expect(
			screen.queryByRole("button", { name: /^Show/ }),
		).not.toBeInTheDocument();
	});

	it("keeps an area's topics separate, then combines them again", async () => {
		const { session, user } = await openAreas();
		expect(
			screen.getByText(`Includes UNC Recruiting ${DOT} VCU Hiring`),
		).toBeVisible();
		expect(
			screen.queryByRole("checkbox", { name: "VCU Hiring" }),
		).not.toBeInTheDocument();

		await user.click(
			screen.getByRole("button", { name: "Keep these separate" }),
		);
		expect(
			await screen.findByRole("button", {
				name: "Combine into one topic",
			}),
		).toBeVisible();
		expect(
			screen.getByRole("checkbox", { name: "UNC Recruiting" }),
		).toBeChecked();
		expect(
			screen.getByRole("checkbox", { name: "VCU Hiring" }),
		).toBeChecked();
		expect(statements(session, "BrainSetTopicArea")).toEqual([
			'BrainSetTopicArea(reviewId=["review-1"], revision=[1], area=["area-1"], split=[true]);',
		]);
		expect(await screen.findByText("6 topics kept")).toBeVisible();

		await user.click(
			screen.getByRole("button", { name: "Combine into one topic" }),
		);
		expect(
			await screen.findByRole("button", { name: "Keep these separate" }),
		).toBeVisible();
		expect(
			screen.getByRole("checkbox", { name: "Recruiting" }),
		).toBeChecked();
		expect(
			screen.queryByRole("checkbox", { name: "VCU Hiring" }),
		).not.toBeInTheDocument();
		expect(statements(session, "BrainSetTopicArea")[1]).toBe(
			'BrainSetTopicArea(reviewId=["review-1"], revision=[2], area=["area-1"], split=[false]);',
		);
	});

	it("renames a topic in place and saves the new name", async () => {
		const { session, user } = await openAreas();
		await user.click(
			screen.getByRole("button", { name: "Rename Platform Operations" }),
		);
		const name = screen.getByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.type(name, "Platform Delivery{Enter}");
		expect(
			await screen.findByRole("checkbox", { name: "Platform Delivery" }),
		).toBeChecked();
		await waitFor(
			() =>
				expect(
					session.saved?.draft.topics.find(
						(topic) => topic.key === "topic-3",
					)?.name,
				).toBe("Platform Delivery"),
			SAVED,
		);
	});

	it("adds your own topic, kept and saved", async () => {
		const { session, user } = await openAreas();
		const add = screen.getByRole("button", { name: "Add" });
		expect(add).toBeDisabled();
		await user.type(
			screen.getByRole("textbox", { name: "Add a topic" }),
			"Backend Hiring{Enter}",
		);
		expect(
			await screen.findByRole("checkbox", { name: "Backend Hiring" }),
		).toBeChecked();
		expect(
			screen.getByRole("textbox", { name: "Add a topic" }),
		).toHaveValue("");
		await waitFor(
			() =>
				expect(
					session.saved?.draft.topics.find((topic) =>
						topic.key.startsWith("added-"),
					),
				).toMatchObject({ name: "Backend Hiring", keep: true }),
			SAVED,
		);
		expect(await screen.findByText("6 topics kept")).toBeVisible();
	});

	it("keeps your edits when autosave fails and offers to reload the saved topics", async () => {
		const session = reviewSession(async () => makeAreaReview());
		session.afterSave.mockRejectedValueOnce(
			new Error("Review changed elsewhere"),
		);
		const { user } = await openAreas(session);
		await user.click(
			screen.getByRole("button", { name: "Rename Platform Operations" }),
		);
		const name = screen.getByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.type(name, "Platform Delivery{Enter}");
		expect(await screen.findByRole("alert", undefined)).toHaveTextContent(
			"Review changed elsewhere",
		);
		expect(screen.getByText("Not saved")).toBeVisible();
		expect(
			screen.getByRole("checkbox", { name: "Platform Delivery" }),
		).toBeChecked();
		await user.click(
			screen.getByRole("button", { name: "Reload saved topics" }),
		);
		await waitFor(() =>
			expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
		);
		// the server stored the edit before the response was lost
		expect(
			screen.getByRole("checkbox", { name: "Platform Delivery" }),
		).toBeChecked();
	});

	it("saves your edits on Back, and Back from a later stage only steps back", async () => {
		const { session, user, view, onBack } = await openAreas();
		await user.click(
			screen.getByRole("checkbox", { name: "Platform Operations" }),
		);
		await nextStage(user, "people");
		expect(
			screen.getByRole("heading", { name: "Who belongs on each topic" }),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Back" }));
		expect(
			screen.getByRole("heading", { name: "Your main areas of work" }),
		).toBeVisible();
		expect(onBack).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "Back" }));
		await waitFor(() => expect(onBack).toHaveBeenCalledOnce());
		expect(
			session.saved?.draft.topics.find((topic) => topic.key === "topic-3")
				?.keep,
		).toBe(false);
		view.unmount();
		render(step(session.actions));
		expect(
			await screen.findByRole("checkbox", {
				name: "Platform Operations",
			}),
		).not.toBeChecked();
	});
});

describe("onboarding topics: people stage", () => {
	it("takes a suggested person off a topic and puts them back", async () => {
		const { session, user } = await openAreas();
		await nextStage(user, "people");
		const row = screen.getByText("Recruiting").closest("li");
		if (!row) throw new Error("Topic row not found");
		const bo = within(row).getByRole("button", { name: "Bo Chen" });
		expect(bo).toHaveAttribute("aria-pressed", "true");
		expect(
			within(row).getByRole("button", { name: "Ana Lima" }),
		).toHaveAttribute("aria-pressed", "true");
		const savedTopic = () =>
			session.saved?.draft.topics.find(
				(topic) => topic.key === "topic-1",
			);

		await user.click(bo);
		expect(bo).toHaveAttribute("aria-pressed", "false");
		await waitFor(
			() => expect(savedTopic()?.removedPeople).toEqual(["p-2"]),
			SAVED,
		);
		expect(savedTopic()?.addedPeople).toEqual([]);

		await user.click(bo);
		expect(bo).toHaveAttribute("aria-pressed", "true");
		await waitFor(
			() => expect(savedTopic()?.removedPeople).toEqual([]),
			SAVED,
		);
		// someone already suggested is restored, never added twice
		expect(savedTopic()?.addedPeople).toEqual([]);
	});

	it("lists only kept topics and takes an added person off with the X", async () => {
		const review = makeAreaReview();
		const first = review.draft.topics[0];
		first.addedPeople = ["p-9"];
		first.addedPeopleInfo = [{ id: "p-9", name: "Cy Diaz" }];
		const { session, user } = await openAreas(
			reviewSession(async () => review),
		);
		await user.click(
			screen.getByRole("checkbox", { name: "Budget Planning" }),
		);
		await nextStage(user, "people");
		expect(screen.queryByText("Budget Planning")).not.toBeInTheDocument();
		expect(screen.getByText("Platform Operations")).toBeVisible();
		await user.click(
			screen.getByRole("button", { name: "Take Cy Diaz off Recruiting" }),
		);
		expect(screen.queryByText("Cy Diaz")).not.toBeInTheDocument();
		await waitFor(
			() =>
				expect(
					session.saved?.draft.topics.find(
						(topic) => topic.key === "topic-1",
					)?.addedPeople,
				).toEqual([]),
			SAVED,
		);
		expect(
			session.saved?.draft.topics.find((topic) => topic.key === "topic-1")
				?.removedPeople,
		).toEqual([]);
	});

	it("says so when no topic is kept", async () => {
		const review = makeReview();
		review.draft.topics = [
			makeTopic("topic-1", "Northwind", { keep: false }),
		];
		const { user } = await openAreas(reviewSession(async () => review));
		await nextStage(user, "people");
		expect(screen.getByText(/No topics are kept yet/)).toBeVisible();
	});
});

describe("onboarding topics: conversations stage", () => {
	it("records what you looked at: unchecked are rejected, the rest confirmed", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(async (review, key) =>
			makeEvidence(review, key, { total: 3 }),
		);
		const { user } = await openAreas(session);
		await nextStage(user, "people");
		await nextStage(user, "conversations");
		expect(await screen.findByText("Topic 1 of 2")).toBeVisible();
		const second = await screen.findByRole("checkbox", {
			name: /Conversation 2/,
		});
		await waitFor(() => expect(second).toBeEnabled());
		await user.click(second);
		expect(second).not.toBeChecked();
		await press(user, "Looks right, next topic");
		expect(await screen.findByText("Topic 2 of 2")).toBeVisible();

		expect(changesSent(session)).toEqual([
			{
				revision: 1,
				operationId: expect.any(String),
				change: {
					type: "reject",
					topicKey: "topic-1",
					threadIds: ["thread-2"],
					versions: { "thread-2": "relationship-version-2" },
				},
			},
			{
				revision: 2,
				operationId: expect.any(String),
				change: {
					type: "confirm",
					topicKey: "topic-1",
					threadIds: ["thread-1", "thread-3"],
					versions: {
						"thread-1": "relationship-version-1",
						"thread-3": "relationship-version-3",
					},
				},
			},
		]);
		expect(session.saved?.draft.corrections).toEqual(
			expect.arrayContaining([
				{
					threadId: "thread-2",
					topicKey: "topic-1",
					state: "exclude",
					primary: false,
				},
				{
					threadId: "thread-1",
					topicKey: "topic-1",
					state: "include",
					primary: false,
				},
			]),
		);
	});

	it("does not send choices that are already recorded when you come back", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(async (review, key) =>
			makeEvidence(review, key, { total: 3 }),
		);
		const { user } = await openAreas(session);
		await nextStage(user, "people");
		await nextStage(user, "conversations");
		await user.click(
			await screen.findByRole("checkbox", { name: /Conversation 2/ }),
		);
		await press(user, "Looks right, next topic");
		await screen.findByText("Topic 2 of 2");
		await press(user, "Previous topic");
		expect(await screen.findByText("Topic 1 of 2")).toBeVisible();
		// what was unchecked before comes back unchecked
		const second = await screen.findByRole("checkbox", {
			name: /Conversation 2/,
		});
		await waitFor(() => expect(second).not.toBeChecked());
		const before = changesSent(session).length;
		await press(user, "Looks right, next topic");
		await screen.findByText("Topic 2 of 2");
		expect(changesSent(session)).toHaveLength(before);
	});

	it("tells you when a topic has no conversations and moves on without sending anything", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(noEvidence);
		const { user } = await openAreas(session);
		await nextStage(user, "people");
		await nextStage(user, "conversations");
		expect(
			await screen.findByText(
				/No conversations found for this topic yet/,
			),
		).toBeVisible();
		await press(user, "Looks right, next topic");
		expect(await screen.findByText("Topic 2 of 2")).toBeVisible();
		await press(user, "Looks right, finish");
		expect(
			await screen.findByRole("heading", { name: "Ready to file" }),
		).toBeVisible();
		expect(changesSent(session)).toEqual([]);
	});

	it("loads the conversations of the first kept topic from the saved draft", async () => {
		const session = evidenceSession();
		const { user } = await openAreas(session);
		await user.click(
			screen.getByRole("button", { name: "Rename Northwind Migration" }),
		);
		const name = screen.getByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.type(name, "Northwind Rollout{Enter}");
		await nextStage(user, "people");
		await nextStage(user, "conversations");
		expect(
			await screen.findByText("TLS certificate renewal"),
		).toBeVisible();
		expect(session.saved?.draft.topics[0].name).toBe("Northwind Rollout");
		const calls = session.run.mock.calls.map(([statement]) => statement);
		const save = calls.findIndex((statement) =>
			statement.startsWith("BrainSaveTopicReview("),
		);
		const read = calls.findIndex((statement) =>
			statement.startsWith("BrainGetTopicReviewEvidence("),
		);
		expect(save).toBeGreaterThan(-1);
		expect(read).toBeGreaterThan(save);
		expect(calls[read]).toContain("revision=[2]");
	});
});

describe("onboarding topics: done stage", () => {
	it("lists what will be saved and applies it once on Save", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(noEvidence);
		const onNext = vi.fn();
		const { user } = await openAreas(session, onNext);
		await nextStage(user, "people");
		await nextStage(user, "conversations");
		await press(user, "Looks right, next topic");
		await press(user, "Looks right, finish");
		expect(
			await screen.findByRole("heading", { name: "Ready to file" }),
		).toBeVisible();
		const row = screen.getByText("Northwind Migration").closest("li");
		expect(row).toHaveTextContent(`2 people ${DOT} 2 conversations`);
		expect(onNext).not.toHaveBeenCalled();

		await user.click(screen.getByRole("button", { name: "Save 2 topics" }));
		await waitFor(() => expect(onNext).toHaveBeenCalledOnce());
		expect(statements(session, "BrainApplyTopicReview")).toEqual([
			'BrainApplyTopicReview(reviewId=["review-1"], revision=[1]);',
		]);
		expect(session.saved?.result.topics.map((topic) => topic.name)).toEqual(
			["Northwind Migration", "Platform Operations"],
		);
	});

	it("lets you go back and change a stage", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(noEvidence);
		const { user } = await openAreas(session);
		await nextStage(user, "people");
		await nextStage(user, "conversations");
		await press(user, "Looks right, next topic");
		await press(user, "Looks right, finish");
		await screen.findByRole("heading", { name: "Ready to file" });
		await user.click(screen.getByRole("button", { name: "People" }));
		expect(
			screen.getByRole("heading", { name: "Who belongs on each topic" }),
		).toBeVisible();
	});

	it("keeps the topics unsaved and explains when the saved names differ from the review", async () => {
		const session = evidenceSession(makeReview());
		session.evidence.mockImplementation(noEvidence);
		session.afterApply.mockImplementationOnce(async (review) => {
			review.result.topics[0].short = "Old navigation name";
		});
		const onNext = vi.fn();
		const { user } = await openAreas(session, onNext);
		await nextStage(user, "people");
		await nextStage(user, "conversations");
		await press(user, "Looks right, finish");
		await user.click(
			await screen.findByRole("button", { name: "Save 1 topic" }),
		);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"do not match your review",
		);
		expect(onNext).not.toHaveBeenCalled();
	});

	it("reuses the saved topic IDs when Save is retried after a lost response", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(noEvidence);
		session.afterApply.mockRejectedValueOnce(
			new Error("Connection lost after save"),
		);
		const onNext = vi.fn();
		const { user } = await openAreas(session, onNext);
		await user.type(
			screen.getByRole("textbox", { name: "Add a topic" }),
			"Backend Hiring{Enter}",
		);
		await nextStage(user, "people");
		await nextStage(user, "conversations");
		for (const name of [
			"Looks right, next topic",
			"Looks right, next topic",
			"Looks right, finish",
		])
			await press(user, name);
		await user.click(
			await screen.findByRole("button", { name: "Save 3 topics" }),
		);
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Connection lost after save",
		);
		const addedId = session.saved?.result.topics[2].id;
		expect(addedId).toBeTruthy();
		await user.click(screen.getByRole("button", { name: "Retry" }));
		await waitFor(() => expect(onNext).toHaveBeenCalledOnce());
		expect(session.saved?.result.topics[2].id).toBe(addedId);
		expect(session.saved?.result.topics).toHaveLength(3);
	});
});
