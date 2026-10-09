import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import {
	deferred,
	makeReview,
	type ReviewWire,
	reviewSession,
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

afterEach(cleanup);

describe("onboarding topic review", () => {
	it("shares initialization in Strict Mode and applies the canonical profile in one request", async () => {
		const pending = deferred<ReviewWire>();
		const generate = vi.fn(() => pending.promise);
		const session = reviewSession(generate);
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		expect(generate).toHaveBeenCalledOnce();
		expect(
			screen.getByRole("button", { name: "Keep 0 topics" }),
		).toBeDisabled();
		await act(async () => pending.resolve(makeReview()));
		const name = await screen.findByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.type(name, "Northwind Rollout");
		const description = screen.getByRole("textbox", {
			name: "What this topic covers",
		});
		expect(description.tagName).toBe("TEXTAREA");
		await user.clear(description);
		await user.type(
			description,
			"Launch readiness and delivery milestones.",
		);
		await user.click(screen.getByRole("button", { name: "Keep 1 topics" }));
		await waitFor(() => expect(onNext).toHaveBeenCalledOnce());
		expect(session.saved?.result.topics[0]).toMatchObject({
			name: "Northwind Rollout",
			short: "Northwind Rollout",
			description: "Launch readiness and delivery milestones.",
		});
		expect(
			session.run.mock.calls.filter(([statement]) =>
				statement.startsWith("BrainApplyTopicReview("),
			),
		).toHaveLength(1);
		expect(
			session.run.mock.calls.some(([statement]) =>
				statement.startsWith("BrainSaveTopic("),
			),
		).toBe(false);
	});

	it("preserves edits, added topics and people corrections across Back and remount", async () => {
		const session = reviewSession();
		const onBack = vi.fn();
		const user = userEvent.setup();
		const first = render(step(session.actions, vi.fn(), onBack));
		const name = await screen.findByDisplayValue("Northwind Migration");
		await user.clear(name);
		await user.type(name, "Northwind Delivery");
		await user.click(
			screen.getByRole("button", { name: "Remove Bo Chen" }),
		);
		expect(
			screen.getByRole("button", { name: "Restore Bo Chen" }),
		).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Add a topic" }));
		await user.type(
			screen.getByRole("textbox", { name: "Topic name" }),
			"Backend Hiring",
		);
		await user.click(screen.getByRole("button", { name: "Back" }));
		await waitFor(() => expect(onBack).toHaveBeenCalledOnce());
		first.unmount();
		render(step(session.actions));
		expect(
			await screen.findByDisplayValue("Northwind Delivery"),
		).toBeEnabled();
		expect(
			screen.getByRole("button", { name: "Restore Bo Chen" }),
		).toBeEnabled();
		await user.click(
			screen.getByRole("button", { name: "Edit Backend Hiring" }),
		);
		expect(screen.getByDisplayValue("Backend Hiring")).toBeEnabled();
	});

	it("blocks a kept blank name and associates the field error without dropping the topic", async () => {
		const session = reviewSession();
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		const name = await screen.findByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.click(screen.getByRole("button", { name: "Keep 1 topics" }));
		expect(
			await screen.findByText(
				"Name this topic or turn off Keep before continuing",
			),
		).toBeVisible();
		expect(name).toHaveAttribute("aria-invalid", "true");
		const errorId = name.getAttribute("aria-describedby");
		expect(
			errorId && document.getElementById(errorId)?.textContent,
		).toContain("Name this topic");
		expect(onNext).not.toHaveBeenCalled();
		expect(session.afterApply).not.toHaveBeenCalled();
	});

	it("allows manual setup and explicit zero-topic completion after suggestion failure", async () => {
		const initial = makeReview();
		initial.draft = {
			...initial.draft,
			topics: [],
			modelError: "Topic model unavailable",
		};
		const session = reviewSession(async () => initial);
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		expect(
			await screen.findByText(/You can still add your own topics/),
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Add a topic" }),
		).toBeEnabled();
		await user.click(screen.getByRole("button", { name: "Keep 0 topics" }));
		await waitFor(() => expect(onNext).toHaveBeenCalledOnce());
		expect(session.saved?.appliedRevision).toBe(session.saved?.revision);
		expect(session.saved?.filingJobId).toBeNull();
	});

	it("retains entered fields when autosave fails and supports explicit recovery", async () => {
		const session = reviewSession();
		session.afterSave.mockRejectedValueOnce(
			new Error("Review changed elsewhere"),
		);
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		const name = await screen.findByRole("textbox", { name: "Topic name" });
		await user.clear(name);
		await user.type(name, "Northwind Rollout");
		await user.click(screen.getByRole("button", { name: "Keep 1 topics" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Review changed elsewhere",
		);
		expect(name).toHaveValue("Northwind Rollout");
		expect(onNext).not.toHaveBeenCalled();
		await user.click(
			screen.getByRole("button", { name: "Reload saved review" }),
		);
		await waitFor(() =>
			expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
		);
		expect(screen.getByRole("textbox", { name: "Topic name" })).toHaveValue(
			"Northwind Rollout",
		);
	});

	it("reuses added-topic IDs after the apply response is lost", async () => {
		const session = reviewSession();
		session.afterApply.mockRejectedValueOnce(
			new Error("Connection lost after save"),
		);
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		await screen.findByDisplayValue("Northwind Migration");
		await user.click(screen.getByRole("button", { name: "Add a topic" }));
		await user.type(
			screen.getByRole("textbox", { name: "Topic name" }),
			"Backend Hiring",
		);
		await user.click(screen.getByRole("button", { name: "Keep 2 topics" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Connection lost after save",
		);
		const addedId = session.saved?.result.topics[1].id;
		await user.click(screen.getByRole("button", { name: "Retry" }));
		await waitFor(() => expect(onNext).toHaveBeenCalledOnce());
		expect(session.saved?.result.topics[1].id).toBe(addedId);
		expect(session.saved?.result.topics).toHaveLength(2);
	});

	it("does not continue when saved profile readback differs from the entered values", async () => {
		const session = reviewSession();
		session.afterApply.mockImplementationOnce(async (review) => {
			review.result.topics[0].short = "Old navigation name";
		});
		const onNext = vi.fn();
		const user = userEvent.setup();
		render(step(session.actions, onNext));
		await screen.findByDisplayValue("Northwind Migration");
		await user.click(screen.getByRole("button", { name: "Keep 1 topics" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"do not match your review",
		);
		expect(onNext).not.toHaveBeenCalled();
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
				await screen.findByDisplayValue("Backend Hiring"),
			).toBeEnabled();
			await act(async () => {
				if (outcome === "success")
					pending.resolve(makeReview("Old topic"));
				else pending.reject(new Error("Old request failed"));
			});
			expect(
				screen.queryByDisplayValue("Old topic"),
			).not.toBeInTheDocument();
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		},
	);
});

it("follows a pending topic-map job and recovers its saved review without starting another job", async () => {
	vi.useFakeTimers();
	let reads = 0;
	const run = vi.fn(async (statement: string) => {
		let output: unknown;
		if (statement === "BrainStartTopicReview();")
			output = {
				exists: false,
				pending: true,
				job: { id: "map-one", status: "running", progress: 40 },
			};
		else if (statement.startsWith("BrainGetJob(")) {
			reads++;
			if (reads === 1) throw new Error("Temporary disconnect");
			output = { id: "map-one", status: "done", progress: 100 };
		} else if (statement === "BrainGetTopicReview();")
			output = { exists: true, review: makeReview() };
		else throw new Error(`Unexpected request: ${statement}`);
		return { pixelReturn: [{ output, operationType: ["MAP"] }] };
	});
	try {
		render(step({ run } as unknown as InsightActions));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(2000);
		});
		expect(screen.getByText("Temporary disconnect")).toBeVisible();
		await act(async () => {
			await vi.advanceTimersByTimeAsync(4000);
		});
		expect(screen.getByDisplayValue("Northwind Migration")).toBeVisible();
		expect(
			run.mock.calls.filter(
				([statement]) => statement === "BrainStartTopicReview();",
			),
		).toHaveLength(1);
		expect(
			run.mock.calls.filter(([statement]) =>
				statement.startsWith("BrainGetJob("),
			),
		).toEqual([
			['BrainGetJob(kind=["topic_map"], jobId=["map-one"]);'],
			['BrainGetJob(kind=["topic_map"], jobId=["map-one"]);'],
		]);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(300);
		});
		const count = run.mock.calls.length;
		await act(async () => {
			await vi.advanceTimersByTimeAsync(60000);
		});
		expect(run).toHaveBeenCalledTimes(count);
	} finally {
		cleanup();
		vi.useRealTimers();
	}
});

it("recovers a committed area split after a lost response without resubmitting the old combined draft", async () => {
	const initial = makeReview();
	initial.draft.areas = [
		{
			key: "delivery",
			name: "Delivery",
			about: "Delivery scope",
			topicKeys: ["topic-1", "topic-2"],
			suggested: true,
			split: false,
			weight: 2,
			size: 3,
		},
	];
	initial.draft.topics[0].area = "delivery";
	initial.draft.topics[0].suggestedTerms = ["Launch"];
	initial.draft.topics[0].addedPeople = ["p-3"];
	initial.draft.topics[0].own = { name: "Original delivery" };
	initial.draft.corrections = [
		{
			threadId: "thread-1",
			topicKey: "topic-1",
			state: "include",
			primary: true,
		},
	];
	initial.draft.topics.push({
		...structuredClone(initial.draft.topics[0]),
		key: "topic-2",
		id: null,
		name: "Delivery support",
		keep: false,
		mergedIntoKey: "topic-1",
	});
	const session = reviewSession(async () => initial);
	const original = session.run.getMockImplementation();
	if (!original) throw new Error("Missing transport fixture");
	let writes = 0;
	session.run.mockImplementation(async (statement) => {
		if (!statement.startsWith("BrainSetTopicArea("))
			return original(statement);
		writes++;
		const split = writes === 1;
		expect(statement).toContain(`area=["delivery"], split=[${split}]`);
		const saved = session.saved;
		if (!saved?.draft.areas) throw new Error("Missing saved areas");
		saved.revision++;
		saved.draft.areas[0].split = split;
		saved.draft.topics[1].mergedIntoKey = split ? null : "topic-1";
		saved.draft.topics[1].keep = split;
		if (split) throw new Error("Area response lost");
		return {
			pixelReturn: [
				{
					output: { exists: true, review: structuredClone(saved) },
					operationType: ["MAP"],
				},
			],
		};
	});
	const user = userEvent.setup();
	render(step(session.actions));
	const name = await screen.findByRole("textbox", { name: "Topic name" });
	await user.clear(name);
	await user.type(name, "Delivery revised");
	await user.click(
		await screen.findByRole("button", { name: "Keep topics separate" }),
	);
	await screen.findByText("Area response lost");
	expect(screen.getByRole("textbox", { name: "Topic name" })).toBeDisabled();
	await user.click(screen.getByRole("button", { name: "Retry" }));
	await screen.findByRole("button", { name: "Edit Delivery support" });
	expect(writes).toBe(1);
	expect(session.saved?.draft.topics[0].suggestedTerms).toEqual(["Launch"]);
	expect(
		screen.getByRole("button", { name: "Combine into one topic" }),
	).toBeEnabled();
	await user.click(
		screen.getByRole("button", { name: "Combine into one topic" }),
	);
	await screen.findByRole("button", { name: "Keep topics separate" });
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Keep topics separate" }),
		).toHaveFocus(),
	);
	expect(session.saved?.draft.topics[0]).toMatchObject({
		name: "Delivery revised",
		addedPeople: ["p-3"],
		own: { name: "Original delivery" },
		suggestedTerms: ["Launch"],
	});
	expect(session.saved?.draft.corrections).toEqual(initial.draft.corrections);
	expect(
		screen.queryByRole("button", { name: "Edit Delivery support" }),
	).not.toBeInTheDocument();
	expect(writes).toBe(2);
});

it("searches people on demand and saves added people and explicitly accepted clues", async () => {
	const review = makeReview();
	review.draft.topics[0].suggestedTerms = ["Project Atlas"];
	const session = reviewSession(async () => review);
	const original = session.run.getMockImplementation();
	if (!original) throw new Error("Missing transport fixture");
	session.run.mockImplementation(async (statement) => {
		if (statement.startsWith("BrainListPeople("))
			return {
				pixelReturn: [
					{
						output: {
							items: statement.includes("offset=[2]")
								? [{ id: "p-4", name: "Dee" }]
								: [
										{ id: "p-3", name: "Casey" },
										{
											id: "bot",
											name: "Automated sender",
											relationship: "automated",
										},
									],
							total: 3,
						},
						operationType: ["MAP"],
					},
				],
			};
		return original(statement);
	});
	const user = userEvent.setup();
	const back = vi.fn();
	render(step(session.actions, vi.fn(), back));
	await screen.findByDisplayValue("Northwind Migration");
	expect(
		session.run.mock.calls.some(([call]) =>
			call.startsWith("BrainListPeople("),
		),
	).toBe(false);
	await user.click(screen.getByRole("button", { name: "Add people" }));
	await user.click(await screen.findByRole("button", { name: "Casey" }));
	await user.click(screen.getByRole("button", { name: "More people" }));
	await user.click(await screen.findByRole("button", { name: "Dee" }));
	expect(session.run).toHaveBeenCalledWith(
		'BrainListPeople(query=[""], limit=[25], offset=[2]);',
	);
	expect(
		screen.queryByRole("button", { name: "Automated sender" }),
	).not.toBeInTheDocument();
	await user.click(
		screen.getByRole("button", { name: "Add clue: Project Atlas" }),
	);
	await user.click(screen.getByRole("button", { name: "Back" }));
	await waitFor(() => expect(back).toHaveBeenCalledOnce());
	expect(session.saved?.draft.topics[0]).toMatchObject({
		addedPeople: ["p-3", "p-4"],
		terms: "Project Atlas",
	});
});

it("retains the previous reach after failure and retries only the expanded topic's selected people", async () => {
	const review = makeReview();
	review.draft.topics.push({
		...structuredClone(review.draft.topics[0]),
		key: "topic-2",
		id: "topic-2",
		name: "Unopened",
		people: [{ id: "unrelated", name: "Other person" }],
	});
	const session = reviewSession(async () => review);
	const original = session.run.getMockImplementation();
	if (!original) throw new Error("Missing transport fixture");
	let reads = 0;
	session.run.mockImplementation(async (statement) => {
		if (!statement.startsWith("BrainPreviewTopicReach("))
			return original(statement);
		reads++;
		if (reads === 2) throw new Error("Reach temporarily unavailable");
		return {
			pixelReturn: [
				{
					output: {
						threads: reads === 1 ? 12 : 5,
						together: reads === 1 ? 4 : 5,
						samples: [],
					},
					operationType: ["MAP"],
				},
			],
		};
	});
	const user = userEvent.setup();
	render(step(session.actions));
	await screen.findByText(/12 conversations involve these people/);
	await user.click(screen.getByRole("button", { name: "Remove Ana Lima" }));
	await screen.findByText("Reach temporarily unavailable");
	expect(
		screen.getByText(/Previous selection: 12 conversations/),
	).toBeVisible();
	expect(screen.getByRole("textbox", { name: "Topic name" })).toBeEnabled();
	await user.click(screen.getByRole("button", { name: "Refresh reach" }));
	await screen.findByText(/5 conversations involve these people/);
	expect(
		session.run.mock.calls.filter(([call]) =>
			call.startsWith("BrainPreviewTopicReach("),
		),
	).toEqual([
		['BrainPreviewTopicReach(reach=[{"people":["p-1","p-2"]}]);'],
		['BrainPreviewTopicReach(reach=[{"people":["p-2"]}]);'],
		['BrainPreviewTopicReach(reach=[{"people":["p-2"]}]);'],
	]);
});

it("keeps large people selections saveable while enforcing preview and added-person limits", async () => {
	const review = makeReview();
	review.draft.topics[0].people = Array.from({ length: 61 }, (_, index) => ({
		id: `original-${index}`,
		name: `Person ${index}`,
	}));
	review.draft.topics[0].addedPeople = Array.from(
		{ length: 30 },
		(_, index) => `added-person-${index}`,
	);
	const session = reviewSession(async () => review);
	const original = session.run.getMockImplementation();
	if (!original) throw new Error("Missing transport fixture");
	session.run.mockImplementation(async (statement) =>
		statement.startsWith("BrainListPeople(")
			? {
					pixelReturn: [
						{
							output: {
								items: [{ id: "p-3", name: "Casey" }],
								total: 1,
							},
							operationType: ["MAP"],
						},
					],
				}
			: original(statement),
	);
	const back = vi.fn();
	const user = userEvent.setup();
	render(step(session.actions, vi.fn(), back));
	await screen.findByText(/Reach preview supports up to 60 people/);
	expect(
		session.run.mock.calls.some(([call]) =>
			call.startsWith("BrainPreviewTopicReach("),
		),
	).toBe(false);
	await user.click(screen.getByRole("button", { name: "Add people" }));
	expect(await screen.findByRole("button", { name: "Casey" })).toBeDisabled();
	await user.type(
		screen.getByRole("textbox", { name: "Topic name" }),
		" updated",
	);
	await user.click(screen.getByRole("button", { name: "Back" }));
	await waitFor(() => expect(back).toHaveBeenCalledOnce());
	expect(session.saved?.draft.topics[0].people).toHaveLength(61);
	expect(session.saved?.draft.topics[0].addedPeople).toHaveLength(30);
	expect(session.saved?.draft.topics[0].name).toBe(
		"Northwind Migration updated",
	);
});

it("reviews chat proposals explicitly and preserves independent partial acceptance", async () => {
	const session = reviewSession();
	const original = session.run.getMockImplementation();
	if (!original) throw new Error("Missing transport fixture");
	session.run.mockImplementation(async (statement) => {
		if (statement.startsWith("BrainTopicReviewChat("))
			return {
				pixelReturn: [
					{
						output: {
							reviewId: "review-1",
							revision: session.saved?.revision,
							reply: "Review these two changes.",
							changes: [
								{
									type: "edit_topic",
									topicKey: "topic-1",
									topicKeys: [],
									name: "Northwind Delivery",
									description: "",
									addTerms: [],
									addPeople: [],
									removePeople: [],
									reason: "Clarify the scope",
								},
								{
									type: "add_topic",
									topicKey: "",
									topicKeys: [],
									name: "Hiring",
									description: "Recruiting",
									addTerms: ["Campus"],
									addPeople: [],
									removePeople: [],
									reason: "Separate work",
								},
							],
						},
						operationType: ["MAP"],
					},
				],
			};
		return original(statement);
	});
	const user = userEvent.setup();
	render(step(session.actions));
	await user.type(
		await screen.findByRole("textbox", {
			name: "Message the setup assistant",
		}),
		"Rename delivery and add hiring",
	);
	await user.click(
		screen.getByRole("button", { name: "Send to setup assistant" }),
	);
	await screen.findByText("Review these two changes.");
	await waitFor(() =>
		expect(
			screen.getByRole("textbox", {
				name: "Message the setup assistant",
			}),
		).toHaveFocus(),
	);
	expect(session.saved?.draft.topics).toHaveLength(1);
	expect(session.saved?.draft.topics[0].name).toBe("Northwind Migration");
	await user.click(
		screen.getAllByRole("button", { name: "Use in my draft" })[0],
	);
	await screen.findByDisplayValue("Northwind Delivery");
	await waitFor(() =>
		expect(
			screen.getByRole("textbox", {
				name: "Message the setup assistant",
			}),
		).toHaveFocus(),
	);
	await user.click(screen.getByRole("button", { name: "Use in my draft" }));
	await screen.findByRole("button", { name: "Edit Hiring" });
	expect(session.saved?.draft.topics).toHaveLength(2);
	expect(session.saved?.draft.topics[1]).toMatchObject({
		name: "Hiring",
		terms: "Campus",
	});
	expect(
		screen.getByRole("button", { name: "Suggest a better grouping" }),
	).toBeEnabled();
	expect(
		session.run.mock.calls.filter(([call]) =>
			call.startsWith("BrainApplyTopicReview("),
		),
	).toHaveLength(0);
});

it("keeps chat input and direct edits available after an optional assistant failure", async () => {
	const session = reviewSession();
	const original = session.run.getMockImplementation();
	if (!original) throw new Error("Missing transport fixture");
	session.run.mockImplementation(async (statement) => {
		if (statement.startsWith("BrainTopicReviewChat("))
			throw new Error("Setup assistant unavailable");
		return original(statement);
	});
	const user = userEvent.setup();
	render(step(session.actions));
	const input = await screen.findByRole("textbox", {
		name: "Message the setup assistant",
	});
	await user.type(input, "Help with topics");
	await user.click(
		screen.getByRole("button", { name: "Send to setup assistant" }),
	);
	await screen.findByText("Setup assistant unavailable");
	expect(input).toHaveValue("Help with topics");
	expect(screen.getByRole("textbox", { name: "Topic name" })).toBeEnabled();
	expect(
		screen.getByRole("button", { name: "Suggest a better grouping" }),
	).toBeEnabled();
});

it("recovers an accepted new-topic proposal after a lost save without duplicating its identity", async () => {
	const session = reviewSession();
	const original = session.run.getMockImplementation();
	if (!original) throw new Error("Missing transport fixture");
	session.run.mockImplementation(async (statement) => {
		if (statement.startsWith("BrainTopicReviewChat("))
			return {
				pixelReturn: [
					{
						output: {
							reviewId: "review-1",
							revision: session.saved?.revision,
							reply: "Review the new topic.",
							changes: [
								{
									type: "add_topic",
									topicKey: "",
									topicKeys: [],
									name: "Hiring",
									description: "",
									addTerms: [],
									addPeople: [],
									removePeople: [],
									reason: "Separate work",
								},
							],
						},
						operationType: ["MAP"],
					},
				],
			};
		return original(statement);
	});
	const user = userEvent.setup();
	render(step(session.actions));
	await user.type(
		await screen.findByRole("textbox", {
			name: "Message the setup assistant",
		}),
		"Add hiring",
	);
	await user.click(
		screen.getByRole("button", { name: "Send to setup assistant" }),
	);
	await screen.findByText("Review the new topic.");
	session.afterSave.mockRejectedValueOnce(new Error("Save response lost"));
	await user.click(screen.getByRole("button", { name: "Use in my draft" }));
	await screen.findByText("Save response lost");
	const key = session.saved?.draft.topics[1].key;
	await user.click(screen.getByRole("button", { name: "Retry" }));
	await screen.findByRole("button", { name: "Edit Hiring" });
	expect(session.saved?.draft.topics).toHaveLength(2);
	expect(session.saved?.draft.topics[1].key).toBe(key);
	expect(
		session.run.mock.calls.filter(([statement]) =>
			statement.startsWith("BrainSaveTopicReview("),
		),
	).toHaveLength(1);
});
