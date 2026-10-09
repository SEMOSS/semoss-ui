import { vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import type { TopicEvidence, TopicReviewChange } from "./topic-evidence-api";
import {
	makeReview,
	type ReviewWire,
	reviewSession,
} from "./topic-review.test-fixtures";
import type { TopicReview } from "./topic-review-api";

/** Items are numbered from 1; item 1 is the detailed one. Pages follow offset, limit and total. */
export function makeEvidence(
	review: Pick<TopicReview, "id" | "revision">,
	topicKey = "topic-1",
	page: { total?: number; offset?: number; limit?: number } = {},
): TopicEvidence {
	const { total = 1, offset = 0, limit = 20 } = page;
	const count = Math.max(0, Math.min(limit, total - offset));
	const items = Array.from({ length: count }, (_, index) =>
		evidenceItem(offset + index + 1),
	);
	return {
		reviewId: review.id,
		revision: review.revision,
		topicKey,
		items,
		total,
		offset,
		hasMore: offset + count < total,
		hiddenOrUnavailable: 2,
		limited: false,
		scope: "Imported examples and existing topic links",
	};
}

function evidenceItem(number: number): TopicEvidence["items"][number] {
	return {
		id: `thread-${number}`,
		source: "email",
		subject:
			number === 1 ? "TLS certificate renewal" : `Conversation ${number}`,
		lastMessageAt: "2023-10-12T09:00:00Z",
		messageCount: 3,
		people: [{ id: "p-1", name: "Ana Lima", email: "ana@example.org" }],
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
		version: `relationship-version-${number}`,
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

/** A topic with no conversations yet; there is nothing to check, so nothing is sent. */
export async function noEvidence(
	review: ReviewWire,
	key: string,
	_offset: number,
) {
	return makeEvidence(review, key, { total: 0 });
}

/** Every BrainChangeTopicReview request so far, with the revision it was sent against. */
export function changesSent(session: {
	run: { mock: { calls: unknown[][] } };
}) {
	return session.run.mock.calls
		.map(([statement]) => String(statement))
		.filter((statement) => statement.startsWith("BrainChangeTopicReview("))
		.map((statement) => ({
			revision: Number(statement.match(/revision=\[(\d+)\]/)?.[1]),
			operationId: JSON.parse(
				statement.match(/operationId=(\[[^\]]+\])/)?.[1] || "[]",
			)[0] as string,
			change: JSON.parse(
				statement.match(/change=(\[[\s\S]*\])\);$/)?.[1] || "[]",
			)[0] as TopicReviewChange,
		}));
}

/** Controlled transport acknowledgements only; relationship transactions are checked in H2. */
export function evidenceSession(initial: ReviewWire = twoTopics()) {
	const session = reviewSession(async () => structuredClone(initial));
	const afterChange = vi.fn(
		async (_review: ReviewWire): Promise<void> => undefined,
	);
	// override with mockImplementation for longer lists or locked conversations
	const evidence = vi.fn(
		async (review: ReviewWire, key: string, _offset: number) =>
			makeEvidence(review, key),
	);
	const run = vi.fn(async (statement: string) => {
		if (statement.startsWith("BrainGetTopicReviewEvidence(")) {
			if (!session.saved) throw new Error("Review not found");
			const key = JSON.parse(
				statement.match(/topicKey=(\[[^\]]+\])/)?.[1] || "[]",
			)[0] as string;
			const offset = Number(
				statement.match(/offset=\[(\d+)\]/)?.[1] ?? 0,
			);
			return wire(await evidence(session.saved, key, offset));
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
				} else if (
					change.type === "organize" ||
					change.type === "reconcile_profile"
				) {
					throw new Error(
						"Organization changes use the organization transport fixture",
					);
				} else {
					// each conversation keeps its latest choice per topic
					const touched = new Set([
						change.topicKey,
						change.targetKey,
					]);
					const next = (review.draft.corrections ?? []).filter(
						(row) =>
							!(
								change.threadIds.includes(row.threadId) &&
								touched.has(row.topicKey)
							),
					);
					for (const threadId of change.threadIds) {
						next.push({
							threadId,
							topicKey: change.topicKey,
							state:
								change.type === "move" ||
								change.type === "reject"
									? "exclude"
									: "include",
							primary: false,
						});
						if (change.targetKey)
							next.push({
								threadId,
								topicKey: change.targetKey,
								state: "include",
								primary: change.type === "move",
							});
					}
					review.draft.corrections = next;
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
