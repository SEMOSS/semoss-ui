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
	checkTopics,
	deferred,
	type MapJobWire,
	makeAreaReview,
	makeReview,
	makeTopic,
	nextStage,
	openTopic,
	press,
	type ReviewWire,
	reviewSession,
	setUpInBuilder,
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
	session = reviewSession(async () => setUpInBuilder(makeAreaReview())),
	onNext = vi.fn(),
	onBack = vi.fn(),
) {
	const user = userEvent.setup();
	const view = render(step(session.actions, onNext, onBack));
	await screen.findByRole("heading", { name: "Your main areas of work" });
	await checkTopics(user);
	return { session, user, view, onNext, onBack };
}

/** A kept topic's row in the Check stage list; topics not kept have none. */
const combineBox = (name: string) =>
	screen.queryByRole("checkbox", { name: `Select ${name} to combine` });

/** The disclosure that lists the topics found but not kept. */
const notKept = (count: number) =>
	screen.getByRole("button", {
		name: new RegExp(`^Also found, not kept \\(${count}\\)`),
	});

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
			screen.getByRole("button", {
				name: "Review suggested topic UNC Recruiting",
			}),
		).toBeEnabled();
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
			await screen.findByRole("button", {
				name: "Review suggested topic UNC Recruiting",
			}),
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
				await screen.findByRole("button", {
					name: "Review suggested topic Backend Hiring",
				}),
			).toBeEnabled();
			await act(async () => {
				if (outcome === "success")
					pending.resolve(makeReview("Old topic"));
				else pending.reject(new Error("Old request failed"));
			});
			expect(
				screen.queryByRole("button", {
					name: "Review suggested topic Old topic",
				}),
			).not.toBeInTheDocument();
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		},
	);
});

describe("onboarding topics: check stage", () => {
	it("lists the kept topics, opens the first, and saves a skipped one", async () => {
		const { session, user } = await openAreas();
		expect(screen.getByText("Step 7 of 8")).toBeVisible();
		for (const name of [
			"Recruiting",
			"Platform Operations",
			"Budget Planning",
			"Vendor Reviews",
			"Security Audits",
		])
			expect(combineBox(name)).toBeInTheDocument();
		expect(combineBox("Customer Onboarding")).not.toBeInTheDocument();
		expect(notKept(2)).toHaveAttribute("aria-expanded", "false");
		expect(
			screen.getByRole("region", { name: "Recruiting" }),
		).toBeVisible();
		expect((await screen.findAllByText("5 topics kept"))[0]).toBeVisible();

		await openTopic(user, "Platform Operations");
		await user.click(
			screen.getByRole("button", { name: "Skip this topic" }),
		);
		expect(combineBox("Platform Operations")).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Keep this topic" }),
		).toBeVisible();
		await waitFor(
			() =>
				expect(
					session.saved?.draft.topics.find(
						(topic) => topic.key === "topic-3",
					)?.keep,
				).toBe(false),
			SAVED,
		);
		expect((await screen.findAllByText("4 topics kept"))[0]).toBeVisible();
		const writes = statements(session, "BrainSaveTopicReview");
		expect(writes).toHaveLength(1);
		expect(writes[0]).toContain('reviewId=["review-1"], revision=[1]');
	});

	it("shows the topics found but not kept, and keeps one", async () => {
		const { session, user } = await openAreas();
		await user.click(notKept(2));
		await openTopic(user, "Customer Onboarding");
		expect(combineBox("Customer Onboarding")).not.toBeInTheDocument();
		await user.click(
			screen.getByRole("button", { name: "Keep this topic" }),
		);
		expect(combineBox("Customer Onboarding")).toBeInTheDocument();
		expect(notKept(1)).toBeVisible();
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
		expect((await screen.findAllByText("6 topics kept"))[0]).toBeVisible();
	});

	it("lists every kept topic, however far down the draft it is", async () => {
		const review = makeAreaReview();
		const last = review.draft.topics.find(
			(topic) => topic.key === "topic-8",
		);
		if (last) last.keep = true;
		await openAreas(reviewSession(async () => setUpInBuilder(review)));
		expect(combineBox("Team Offsite")).toBeInTheDocument();
		expect(combineBox("Customer Onboarding")).not.toBeInTheDocument();
		expect(notKept(1)).toBeVisible();
	});

	it("leaves out the topics not set up in the builder", async () => {
		await openAreas(reviewSession(async () => makeAreaReview()));
		expect(combineBox("Recruiting")).not.toBeInTheDocument();
		expect(notKept(7)).toBeVisible();
		expect((await screen.findAllByText("0 topics kept"))[0]).toBeVisible();
	});

	it("keeps an area's topics separate, then combines them again", async () => {
		const { session, user } = await openAreas();
		const area = screen.getByRole("region", { name: "Recruiting" });
		expect(within(area).getByText("Made of 2 parts")).toBeVisible();
		expect(within(area).getByText("UNC Recruiting")).toBeVisible();
		expect(within(area).getByText("VCU Hiring")).toBeVisible();
		expect(combineBox("VCU Hiring")).not.toBeInTheDocument();

		await user.click(
			within(area).getByRole("button", { name: "Keep these separate" }),
		);
		expect(
			await screen.findByRole("button", {
				name: "Combine back into one topic",
			}),
		).toBeVisible();
		expect(combineBox("UNC Recruiting")).toBeInTheDocument();
		expect(combineBox("VCU Hiring")).toBeInTheDocument();
		expect(statements(session, "BrainSetTopicArea")).toEqual([
			'BrainSetTopicArea(reviewId=["review-1"], revision=[1], area=["area-1"], split=[true]);',
		]);
		expect((await screen.findAllByText("6 topics kept"))[0]).toBeVisible();

		await user.click(
			screen.getByRole("button", { name: "Combine back into one topic" }),
		);
		expect(
			await screen.findByRole("button", { name: "Keep these separate" }),
		).toBeVisible();
		expect(combineBox("Recruiting")).toBeInTheDocument();
		expect(combineBox("VCU Hiring")).not.toBeInTheDocument();
		expect(statements(session, "BrainSetTopicArea")[1]).toBe(
			'BrainSetTopicArea(reviewId=["review-1"], revision=[2], area=["area-1"], split=[false]);',
		);
	});

	it("renames a topic in place and saves the new name", async () => {
		const { session, user } = await openAreas();
		await openTopic(user, "Platform Operations");
		await user.click(screen.getByRole("button", { name: "Rename" }));
		const name = screen.getByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.type(name, "Platform Delivery{Enter}");
		expect(
			await screen.findByRole("heading", { name: "Platform Delivery" }),
		).toBeVisible();
		expect(combineBox("Platform Delivery")).toBeInTheDocument();
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

	it("adds your own topic, kept, opened and saved", async () => {
		const { session, user } = await openAreas();
		expect(
			screen.getByRole("button", { name: "Add topic" }),
		).toBeDisabled();
		await user.type(
			screen.getByRole("textbox", { name: "Add a topic" }),
			"Backend Hiring{Enter}",
		);
		expect(
			await screen.findByRole("heading", { name: "Backend Hiring" }),
		).toBeVisible();
		expect(combineBox("Backend Hiring")).toBeInTheDocument();
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
		expect((await screen.findAllByText("6 topics kept"))[0]).toBeVisible();
	});

	it("keeps your edits when autosave fails and offers to reload the saved topics", async () => {
		const session = reviewSession(async () =>
			setUpInBuilder(makeAreaReview()),
		);
		session.afterSave.mockRejectedValueOnce(
			new Error("Review changed elsewhere"),
		);
		const { user } = await openAreas(session);
		await openTopic(user, "Platform Operations");
		await user.click(screen.getByRole("button", { name: "Rename" }));
		const name = screen.getByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.type(name, "Platform Delivery{Enter}");
		expect(await screen.findByRole("alert", undefined)).toHaveTextContent(
			"Review changed elsewhere",
		);
		expect(screen.getByText("Not saved")).toBeVisible();
		expect(combineBox("Platform Delivery")).toBeInTheDocument();
		await user.click(
			screen.getByRole("button", { name: "Reload saved topics" }),
		);
		await waitFor(() =>
			expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
		);
		// the server stored the edit before the response was lost
		expect(combineBox("Platform Delivery")).toBeInTheDocument();
	});

	it("saves your edits on Back, and Back from a later stage only steps back", async () => {
		const { session, user, view, onBack } = await openAreas();
		await openTopic(user, "Platform Operations");
		await user.click(
			screen.getByRole("button", { name: "Skip this topic" }),
		);
		await nextStage(user, "done");
		expect(
			screen.getByRole("heading", { name: "Ready to file" }),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Back" }));
		expect(
			screen.getByRole("heading", { name: "Check your topics" }),
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
		await screen.findByRole("heading", { name: "Your main areas of work" });
		await checkTopics(user);
		expect(combineBox("Platform Operations")).not.toBeInTheDocument();
		expect(notKept(3)).toBeVisible();
	});
});

describe("onboarding topics: people on a topic", () => {
	it("takes a suggested person off a topic and puts them back", async () => {
		const { session, user } = await openAreas();
		const topic = screen.getByRole("region", { name: "Recruiting" });
		const savedTopic = () =>
			session.saved?.draft.topics.find((item) => item.key === "topic-1");
		expect(
			within(topic).getByRole("button", { name: "Take Ana Lima off" }),
		).toBeVisible();

		await user.click(
			within(topic).getByRole("button", { name: "Take Bo Chen off" }),
		);
		expect(
			within(topic).getByRole("button", { name: "Put Bo Chen back" }),
		).toBeVisible();
		await waitFor(
			() => expect(savedTopic()?.removedPeople).toEqual(["p-2"]),
			SAVED,
		);
		expect(savedTopic()?.addedPeople).toEqual([]);

		await user.click(
			within(topic).getByRole("button", { name: "Put Bo Chen back" }),
		);
		expect(
			within(topic).getByRole("button", { name: "Take Bo Chen off" }),
		).toBeVisible();
		await waitFor(
			() => expect(savedTopic()?.removedPeople).toEqual([]),
			SAVED,
		);
		// someone already suggested is restored, never added twice
		expect(savedTopic()?.addedPeople).toEqual([]);
	});

	it("takes an added person off a topic with the X", async () => {
		const review = setUpInBuilder(makeAreaReview());
		const first = review.draft.topics[0];
		first.addedPeople = ["p-9"];
		first.addedPeopleInfo = [{ id: "p-9", name: "Cy Diaz" }];
		const { session, user } = await openAreas(
			reviewSession(async () => review),
		);
		const topic = screen.getByRole("region", { name: "Recruiting" });
		await user.click(
			within(topic).getByRole("button", { name: "Take Cy Diaz off" }),
		);
		expect(
			within(topic).queryByRole("button", { name: /Cy Diaz/ }),
		).not.toBeInTheDocument();
		await waitFor(
			() =>
				expect(
					session.saved?.draft.topics.find(
						(item) => item.key === "topic-1",
					)?.addedPeople,
				).toEqual([]),
			SAVED,
		);
		expect(
			session.saved?.draft.topics.find((item) => item.key === "topic-1")
				?.removedPeople,
		).toEqual([]);
	});
});

describe("onboarding topics: conversations on a topic", () => {
	it("takes a conversation off a topic and puts it back", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(async (review, key) =>
			makeEvidence(review, key, { total: 3 }),
		);
		const { user } = await openAreas(session);
		const off = await screen.findByRole("button", {
			name: 'Take "Conversation 2" off this topic',
		});
		await waitFor(() => expect(off).toBeEnabled());
		await user.click(off);
		expect(await screen.findByText(/^Taken off this topic/)).toBeVisible();
		await press(user, "Put back");
		await waitFor(() =>
			expect(
				screen.queryByText(/^Taken off this topic/),
			).not.toBeInTheDocument(),
		);

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
					threadIds: ["thread-2"],
					versions: { "thread-2": "relationship-version-2" },
				},
			},
		]);
		expect(session.saved?.draft.corrections).toEqual([
			{
				threadId: "thread-2",
				topicKey: "topic-1",
				state: "include",
				primary: false,
			},
		]);
	});

	it("keeps a choice already made when you come back to a topic", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(async (review, key) =>
			makeEvidence(review, key, { total: 3 }),
		);
		const { user } = await openAreas(session);
		await press(user, 'Take "Conversation 2" off this topic');
		await screen.findByText(/^Taken off this topic/);
		await openTopic(user, "Platform Operations");
		await openTopic(user, "Northwind Migration");
		expect(await screen.findByText(/^Taken off this topic/)).toBeVisible();
		expect(screen.getByRole("button", { name: "Put back" })).toBeVisible();
		expect(changesSent(session)).toHaveLength(1);
	});

	it("says when a topic has no conversations yet, and sends nothing", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(noEvidence);
		const { user } = await openAreas(session);
		expect(await screen.findByText(/No conversations yet/)).toBeVisible();
		await nextStage(user, "done");
		expect(
			await screen.findByRole("heading", { name: "Ready to file" }),
		).toBeVisible();
		expect(changesSent(session)).toEqual([]);
	});

	it("saves the draft before reading a topic's conversations", async () => {
		const session = evidenceSession();
		const { user } = await openAreas(session);
		expect(
			await screen.findByText("TLS certificate renewal"),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Rename" }));
		const name = screen.getByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.type(name, "Northwind Rollout{Enter}");
		await openTopic(user, "Platform Operations");
		await waitFor(() =>
			expect(session.saved?.draft.topics[0].name).toBe(
				"Northwind Rollout",
			),
		);
		const calls = session.run.mock.calls.map(([statement]) => statement);
		const save = calls.findIndex((statement) =>
			statement.startsWith("BrainSaveTopicReview("),
		);
		const read = calls.findIndex(
			(statement) =>
				statement.startsWith("BrainGetTopicReviewEvidence(") &&
				statement.includes('topicKey=["topic-2"]'),
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
		await nextStage(user, "done");
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

	it("lets you go back and change topics, people or conversations", async () => {
		const session = evidenceSession();
		session.evidence.mockImplementation(noEvidence);
		const { user } = await openAreas(session);
		await nextStage(user, "done");
		await screen.findByRole("heading", { name: "Ready to file" });
		await user.click(
			screen.getByRole("button", {
				name: "Change topics, people or conversations",
			}),
		);
		expect(
			screen.getByRole("heading", { name: "Check your topics" }),
		).toBeVisible();
	});

	it("says so when no topic is kept", async () => {
		const review = makeReview();
		review.draft.topics = [
			makeTopic("topic-1", "Northwind", { keep: false }),
		];
		const { user } = await openAreas(reviewSession(async () => review));
		await nextStage(user, "done");
		expect(screen.getByText(/No topics are kept/)).toBeVisible();
	});

	it("keeps the topics unsaved and explains when the saved names differ from the review", async () => {
		const session = evidenceSession(setUpInBuilder(makeReview()));
		session.evidence.mockImplementation(noEvidence);
		session.afterApply.mockImplementationOnce(async (review) => {
			review.result.topics[0].short = "Old navigation name";
		});
		const onNext = vi.fn();
		const { user } = await openAreas(session, onNext);
		await nextStage(user, "done");
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
		await screen.findByRole("heading", { name: "Backend Hiring" });
		await nextStage(user, "done");
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
