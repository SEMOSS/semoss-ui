import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import * as api from "./topic-builder-api";
import * as evidence from "./topic-evidence-api";
import { TopicFlow } from "./topic-flow";
import {
	deferred,
	makeReview,
	reviewSession,
} from "./topic-review.test-fixtures";
import * as reviewApi from "./topic-review-api";
import { topicReviewSchema } from "./topic-review-api";

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

function renderFlow() {
	vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
	const review = topicReviewSchema.parse(
		makeReview("NIH Genesis/NIAID/ClinNotes"),
	);
	review.draft.topics[0].built = true;
	render(
		<TopicFlow
			actions={reviewSession().actions}
			initialReview={review}
			eyebrow="Step 7 of 8"
			onNext={vi.fn()}
			onBack={vi.fn()}
			onRestart={vi.fn()}
		/>,
	);
	return review;
}

const emptySearch = { threads: [], checked: 0, matched: 0, unchecked: 0 };

it("preserves the saved NIH topic and advances one card per successful save", async () => {
	const user = userEvent.setup();
	const review = renderFlow();
	const names = [
		"NIH (Genesis, NIAID, ClinNotes)",
		"FDA",
		"AIMES/Air Force",
		"Teamwork",
		"AI Core/SEMOSS/GovConnect",
		"Intermediate draft",
	];
	vi.spyOn(api, "startTopicBuild").mockResolvedValue({
		reviewId: review.id,
		revision: 1,
		reply: "",
		topics: names.map((name, index) => ({
			line: index + 1,
			lineText: name,
			name,
			description: "",
			people: [],
			suggestions: [],
			clues: [],
			question: null,
		})),
	});
	const search = deferred<api.FoundThreads>();
	vi.spyOn(api, "findTopicThreads")
		.mockReturnValueOnce(search.promise)
		.mockResolvedValue(emptySearch);
	const write = vi
		.spyOn(evidence, "changeTopicReview")
		.mockRejectedValueOnce(new Error("Save failed"))
		.mockResolvedValue(review);
	await user.type(
		screen.getByLabelText("Topics to set up"),
		names.join("\n"),
	);
	await user.click(screen.getByRole("button", { name: "Draft my topics" }));
	expect(await screen.findByRole("heading", { name: "FDA" })).toHaveFocus();
	expect(screen.getByText(/Already set up.*NIH/)).toBeVisible();
	expect(screen.queryByRole("button", { name: "Check topics" })).toBeNull();
	expect(
		screen.getByRole("button", { name: /Finding conversations…/ }),
	).toBeDisabled();
	await user.click(
		screen.getByRole("button", {
			name: "Drop Intermediate draft from queue",
		}),
	);
	expect(screen.queryByText("Intermediate draft")).toBeNull();
	expect(screen.getByRole("heading", { name: "FDA" })).toBeVisible();
	search.resolve(emptySearch);
	const save = await screen.findByRole("button", {
		name: "Save and continue to AIMES/Air Force",
	});
	await user.click(save);
	expect(await screen.findByText("Save failed")).toBeVisible();
	await user.click(save);
	expect(
		await screen.findByRole("heading", { name: "AIMES/Air Force" }),
	).toHaveFocus();
	await user.click(
		await screen.findByRole("button", { name: "Skip this one" }),
	);
	expect(
		await screen.findByRole("heading", { name: "Teamwork" }),
	).toBeVisible();
	await user.click(
		await screen.findByRole("button", {
			name: "Save and continue to AI Core/SEMOSS/GovConnect",
		}),
	);
	expect(
		await screen.findByRole("heading", {
			name: "AI Core/SEMOSS/GovConnect",
		}),
	).toBeVisible();
	await user.click(await screen.findByRole("button", { name: "Save topic" }));
	expect(
		await screen.findByRole("button", { name: "Check topics" }),
	).toBeEnabled();
	expect(
		write.mock.calls.map(
			([, , , change]) => change.type === "build" && change.name,
		),
	).toEqual(["FDA", "FDA", "Teamwork", "AI Core/SEMOSS/GovConnect"]);
});

it("keeps existing conversations when a new search returns fewer rows", async () => {
	const user = userEvent.setup();
	const review = renderFlow();
	vi.spyOn(api, "findTopicThreads")
		.mockRejectedValueOnce(new Error("Search failed"))
		.mockResolvedValue(emptySearch);
	const write = vi
		.spyOn(evidence, "changeTopicReview")
		.mockResolvedValue(review);
	await user.click(screen.getByRole("button", { name: /^NIH Genesis/ }));
	expect(await screen.findByText("Search failed")).toBeVisible();
	expect(screen.getByRole("button", { name: "Save topic" })).toBeDisabled();
	await user.click(
		screen.getByRole("button", { name: "Find conversations" }),
	);
	await screen.findByText(/Nothing fits yet/);
	await user.click(screen.getByRole("button", { name: "Save topic" }));
	expect(write.mock.calls[0][3]).toMatchObject({
		type: "build",
		topicKey: "topic-1",
		include: ["thread-1", "thread-2"],
	});
});

it.each([false, true])(
	"saves confirmed edits and conversation choices with optional repeat search (repeat = %s)",
	async (repeat) => {
		const user = userEvent.setup();
		const review = renderFlow();
		const topic = {
			line: 1,
			lineText: "FDA",
			name: "FDA",
			description: "Original scope",
			clues: [],
			people: [{ id: "old", name: "Old contact", reason: "initial" }],
			suggestions: [],
			question: {
				text: "Which scope?",
				options: ["ELSA", "Regulatory work"],
				descriptions: {
					ELSA: "ELSA projects only.",
					"Regulatory work": "CBER and CDER regulatory work.",
				},
			},
		};
		vi.spyOn(api, "startTopicBuild").mockResolvedValue({
			reviewId: review.id,
			revision: 1,
			reply: "",
			topics: [
				topic,
				{
					...topic,
					line: 2,
					name: "AI Core",
					description: "Software",
					clues: ["SEMOSS"],
					question: null,
				},
			],
		});
		const results: api.FoundThreads = {
			...emptySearch,
			threads: [1, 2].map((i) => ({
				threadId: String(i),
				subject: `ELSA meeting ${i}`,
				channel: "email",
				lastAt: null,
				people: ["Alex"],
				participants: [{ id: "alex", name: "Alex" }],
				subjectClues: ["ELSA", "SEMOSS"],
				fits: "yes",
				reason: "same subject",
				preticked: true,
			})),
		};
		const find = vi
			.spyOn(api, "findTopicThreads")
			.mockResolvedValue(results);
		vi.spyOn(api, "previewTopicReach").mockResolvedValue({
			threads: 2,
			together: 2,
			samples: [],
		});
		await user.type(
			screen.getByLabelText("Topics to set up"),
			"FDA and AI Core",
		);
		await user.click(
			screen.getByRole("button", { name: "Draft my topics" }),
		);
		await screen.findByRole("button", { name: "Add Alex (2)" });
		expect(
			screen.queryByRole("button", { name: /Add clue.*SEMOSS/ }),
		).toBeNull();
		expect(find.mock.calls[0][2].otherTopics).toEqual([
			{ name: "AI Core", description: "Software", clues: ["SEMOSS"] },
		]);
		expect(screen.getByLabelText("What belongs")).toHaveValue(
			"Original scope",
		);
		await user.click(
			screen.getByRole("button", { name: "Regulatory work" }),
		);
		expect(screen.getByLabelText("What belongs")).toHaveValue(
			"CBER and CDER regulatory work.",
		);
		await user.click(screen.getByRole("button", { name: "Add Alex (2)" }));
		await user.click(
			screen.getByRole("button", { name: "Remove Old contact (0)" }),
		);
		const first = screen.getAllByRole("checkbox")[0];
		await user.click(first);
		expect(screen.queryByRole("button", { name: /Add clue/ })).toBeNull();
		await user.click(first);
		await user.click(
			screen.getByRole("button", { name: /Add clue.*ELSA/ }),
		);
		await user.click(first);
		expect(find.mock.calls.map((call) => call[2].name)).toEqual([
			"FDA",
			"AI Core",
		]);
		expect(
			screen.getByRole("button", { name: /Save and continue/ }),
		).toBeEnabled();
		if (repeat) {
			await user.click(
				screen.getByRole("button", { name: "Find again" }),
			);
			expect(find.mock.calls.at(-1)?.[2]).toMatchObject({
				name: "FDA",
				description: "CBER and CDER regulatory work.",
				people: ["alex"],
				clues: ["ELSA"],
			});
		}
		const callsBeforeSave = find.mock.calls.length;
		const write = vi
			.spyOn(evidence, "changeTopicReview")
			.mockResolvedValue(review);
		await user.click(
			screen.getByRole("button", { name: /Save and continue/ }),
		);
		expect(write.mock.calls[0][3]).toMatchObject({
			type: "build",
			name: "FDA",
			description: "CBER and CDER regulatory work.",
			people: ["alex"],
			terms: "ELSA",
			include: ["2"],
			exclude: ["1"],
		});
		expect(
			await screen.findByRole("heading", { name: "AI Core" }),
		).toBeVisible();
		// Advancing reuses the background search.
		expect(
			find.mock.calls.slice(callsBeforeSave).map((call) => call[2].name),
		).toEqual([]);
	},
);

it("removes an intermediate built topic from the sidebar through the saved draft", async () => {
	const user = userEvent.setup();
	const review = renderFlow();
	const persist = vi.spyOn(reviewApi, "saveTopicReview").mockResolvedValue({
		...review,
		revision: 2,
		draft: {
			...review.draft,
			topics: review.draft.topics.map((t) => ({ ...t, keep: false })),
		},
	});
	await user.click(
		screen.getByRole("button", { name: /Remove NIH.*from setup/ }),
	);
	expect(
		await screen.findByRole("heading", { name: "Your topics (0)" }),
	).toBeVisible();
	expect(persist.mock.calls[0][2].topics[0]).toMatchObject({
		name: "NIH Genesis/NIAID/ClinNotes",
		keep: false,
	});
});
