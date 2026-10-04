import { vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import type { TopicEvidence, TopicReviewChange } from "./topic-evidence-api";
import {
	makeReview,
	type ReviewWire,
	reviewSession,
} from "./topic-review.test-fixtures";
import type { TopicReview } from "./topic-review-api";

export function makeEvidence(
	review: Pick<TopicReview, "id" | "revision">,
	topicKey = "topic-1",
): TopicEvidence {
	return {
		reviewId: review.id,
		revision: review.revision,
		topicKey,
		items: [
			{
				id: "thread-1",
				source: "email",
				subject: "TLS certificate renewal",
				lastMessageAt: "2023-10-12T09:00:00Z",
				messageCount: 3,
				people: [
					{ id: "p-1", name: "Ana Lima", email: "ana@example.org" },
				],
				links: [
					{
						topicId: "topic-1",
						name: "Northwind Migration",
						source: "seed",
						confidence: 74,
						primary: true,
					},
					{
						topicId: "topic-3",
						name: "Client A",
						source: "you",
						confidence: 100,
						primary: false,
					},
				],
				rejectedTopicIds: [],
				canCorrect: true,
				version: "relationship-version-1",
			},
		],
		total: 1,
		offset: 0,
		hasMore: false,
		hiddenOrUnavailable: 2,
		limited: false,
		scope: "Imported examples and existing topic links",
	};
}

export function twoTopics(): ReviewWire {
	const review = makeReview();
	review.draft.topics.push({
		...structuredClone(review.draft.topics[0]),
		key: "topic-2",
		id: "topic-2",
		name: "Platform Operations",
		description: "Infrastructure and certificate work.",
		threadIds: [],
		sampleSubjects: [],
		people: [],
		domains: [],
	});
	return review;
}

export function wire(output: unknown) {
	return { pixelReturn: [{ output, operationType: ["MAP"] }] };
}

/** Controlled transport acknowledgements only; relationship transactions are checked in H2. */
export function evidenceSession() {
	const session = reviewSession(async () => twoTopics());
	const afterChange = vi.fn(
		async (_review: ReviewWire): Promise<void> => undefined,
	);
	const evidence = vi.fn(
		async (review: ReviewWire, key: string, query: string) => {
			const page = makeEvidence(review, key);
			if (
				query &&
				!page.items[0].subject
					.toLowerCase()
					.includes(query.toLowerCase())
			)
				page.items = [];
			page.total = page.items.length;
			return page;
		},
	);
	const run = vi.fn(async (statement: string) => {
		if (statement.startsWith("BrainGetTopicReviewEvidence(")) {
			if (!session.saved) throw new Error("Review not found");
			const key = JSON.parse(
				statement.match(/topicKey=(\[[^\]]+\])/)?.[1] || "[]",
			)[0] as string;
			const query = JSON.parse(
				statement.match(/query=(\[[^\]]*\])/)?.[1] || '[""]',
			)[0] as string;
			return wire(await evidence(session.saved, key, query));
		}
		if (statement.startsWith("BrainGetThreadMessages(")) {
			return wire({
				threadId: "thread-1",
				source: "email",
				hiddenCount: 1,
				unavailableCount: 0,
				hasMore: true,
				messages: [
					{
						id: "message-1",
						fromName: "Ana Lima",
						fromAddress: "ana@example.org",
						at: "2023-10-12T09:00:00Z",
						text: "Please renew the certificate.",
						webLink: "https://outlook.office.com/mail/message-1",
					},
				],
			});
		}
		if (statement.startsWith("BrainChangeTopicReview(")) {
			const review = session.saved;
			if (!review) throw new Error("Review not found");
			const operationId = JSON.parse(
				statement.match(/operationId=(\[[^\]]+\])/)?.[1] || "[]",
			)[0] as string;
			const [change] = JSON.parse(
				statement.match(/change=(\[[\s\S]*\])\);$/)?.[1] || "[]",
			) as [TopicReviewChange];
			if (!(review.draft.operationIds ?? []).includes(operationId)) {
				review.revision += 1;
				review.draft.operationIds = [
					...(review.draft.operationIds ?? []),
					operationId,
				];
				if (change.type === "undo") {
					review.draft.corrections = [];
					review.draft.history = [];
					review.draft.lastChange = "Undid conversation correction";
				} else {
					review.draft.corrections = [
						{
							threadId: "thread-1",
							topicKey: change.topicKey,
							state:
								change.type === "move" ||
								change.type === "reject"
									? "exclude"
									: "include",
							primary: false,
						},
					];
					if (change.targetKey)
						review.draft.corrections.push({
							threadId: "thread-1",
							topicKey: change.targetKey,
							state: "include",
							primary: change.type === "move",
						});
					review.draft.history = [
						{
							id: operationId,
							type: change.type,
							summary: "Reviewed one conversation",
						},
					];
					review.draft.lastChange = "Reviewed one conversation";
				}
			}
			await afterChange(review);
			return wire({ exists: true, review: structuredClone(review) });
		}
		return session.run(statement);
	});
	return {
		...session,
		actions: { run } as unknown as InsightActions,
		run,
		afterChange,
		evidence,
		get saved() {
			return session.saved;
		},
	};
}
