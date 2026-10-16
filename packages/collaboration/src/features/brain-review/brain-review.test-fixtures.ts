import type { ReviewOverview, ReviewQuestion } from "./brain-review-api";
/** Deterministic saved-data responses; the mailbox/model path is exercised separately in backend tests. */
export function reviewQuestion(
	id: string,
	kind: ReviewQuestion["kind"],
	text: string,
	data: Partial<ReviewQuestion["data"]> = {},
): ReviewQuestion {
	return {
		id,
		kind,
		text,
		detail: "A question that improves Brain.",
		refId:
			kind === "memory"
				? "memory-one"
				: kind === "add_person" || kind === "unknown_sender"
					? "person-one"
					: "thread-one",
		status: "open",
		removedTopicIds: [],
		data: { candidates: [], ...data },
	};
}
export function reviewOverview(): ReviewOverview {
	return {
		health: {
			days: 7,
			eligibleMailThreads: 12,
			filedThreads: 3,
			automaticallyFiledThreads: 1,
			unfiledThreads: 9,
			filedPercent: 25,
			automaticPercent: 8.3,
			questionsWaiting: 8,
			decisionsAnswered: 0,
			questionsByKind: {
				unassigned: 1,
				topic_choice: 1,
				new_topic: 1,
				merge_topic: 1,
				quiet_topic: 1,
				add_person: 1,
				unknown_sender: 1,
				memory: 1,
			},
		},
		topics: [
			{ id: "topic-a", name: "Northwind Migration" },
			{ id: "topic-b", name: "Product Launch" },
		],
		filedThreads: [
			{ id: "filed-one", name: "Previously filed conversation" },
		],
		job: null,
		pending: {
			total: 8,
			items: [
				reviewQuestion("unfiled", "unassigned", "ReviewCase: no topic"),
				reviewQuestion(
					"choice",
					"topic_choice",
					"Which topic fits this conversation?",
					{ candidates: ["topic-a", "topic-b"] },
				),
				reviewQuestion(
					"new",
					"new_topic",
					"New topic: Product delivery",
				),
				reviewQuestion(
					"merge",
					"merge_topic",
					"Combine duplicate topics?",
					{ targetTopicId: "topic-a" },
				),
				reviewQuestion(
					"quiet",
					"quiet_topic",
					"Archive the quiet topic?",
				),
				reviewQuestion(
					"person",
					"add_person",
					"Add this person to Northwind?",
					{ suggestedTopic: "topic-a" },
				),
				reviewQuestion(
					"unknown",
					"unknown_sender",
					"Where does the frequent sender belong?",
				),
				reviewQuestion(
					"memory",
					"memory",
					"Prefer a short weekly update",
					{ memoryAction: "accept" },
				),
			],
		},
	};
}
