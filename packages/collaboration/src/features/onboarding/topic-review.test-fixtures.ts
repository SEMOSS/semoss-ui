import { vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import type { TopicReview, TopicReviewDraft } from "./topic-review-api";

export interface JobWire {
	id: string;
	status: "running" | "done" | "failed";
	progress: number;
	params: { mode: string; reviewId: string; reviewRevision: number };
	counts: Record<string, unknown>;
	error?: string;
}

export type ReviewWire = Omit<TopicReview, "filingJob"> & {
	filingJob: JobWire | null;
};

export function makeReview(name = "Northwind Migration"): ReviewWire {
	return {
		id: "review-1",
		revision: 1,
		appliedRevision: null,
		result: { topics: [], skipped: [] },
		filingJobId: null,
		filingJob: null,
		updatedAt: null,
		draft: {
			modelError: "",
			topics: [
				{
					key: "topic-1",
					id: "topic-1",
					name,
					description: "Moving Northwind to the new platform.",
					short: "",
					keep: true,
					removedPeople: [],
					accepted: false,
					reason: "Related project conversations",
					threadIds: ["thread-1", "thread-2"],
					sampleSubjects: ["Northwind launch readiness"],
					people: [
						{ id: "p-1", name: "Ana Lima" },
						{ id: "p-2", name: "Bo Chen" },
					],
					domains: ["northwind.example"],
				},
			],
		},
	};
}

export function filingJob(
	review: ReviewWire,
	status: JobWire["status"] = "done",
	errors = 0,
): JobWire {
	return {
		id: "job-1",
		status,
		progress: status === "done" ? 100 : 25,
		params: {
			mode: "topics",
			reviewId: review.id,
			reviewRevision: review.revision,
		},
		counts: {
			errors,
			done: 2,
			total: 2,
			topics: { filed: errors ? 1 : 2, asked: 0 },
		},
	};
}

export function applyReceipt(input: ReviewWire): ReviewWire {
	const review = structuredClone(input);
	review.appliedRevision = review.revision;
	review.result.topics = review.draft.topics
		.filter((topic) => topic.keep)
		.map((topic, index) => {
			topic.id ||= `saved-${index}`;
			topic.name = topic.name.trim();
			topic.description = topic.description.trim();
			topic.accepted = true;
			return {
				key: topic.key,
				id: topic.id,
				name: topic.name,
				short: topic.short.trim() || topic.name,
				description: topic.description,
			};
		});
	if (review.result.topics.length) {
		review.filingJob = filingJob(review);
		review.filingJobId = review.filingJob.id;
	}
	return review;
}

export function deferred<T>() {
	let resolve: (value: T) => void = () => undefined;
	let reject: (cause: Error) => void = () => undefined;
	const promise = new Promise<T>((done, fail) => {
		resolve = done;
		reject = fail;
	});
	return { promise, resolve, reject };
}

/** A saved-review transport fixture; production transaction behavior is checked separately. */
export function reviewSession(
	generate: () => Promise<ReviewWire> = async () => makeReview(),
) {
	let saved: ReviewWire | null = null;
	const afterSave = vi.fn(
		async (_review: ReviewWire): Promise<void> => undefined,
	);
	const afterApply = vi.fn(
		async (_review: ReviewWire): Promise<void> => undefined,
	);
	const run = vi.fn(async (statement: string) => {
		if (statement === "BrainStartTopicReview();")
			saved ||= await generate();
		else if (statement === "BrainGetTopicReview();") {
			/* Read the same owner draft. */
		} else if (statement.startsWith("BrainSaveTopicReview(")) {
			if (!saved) throw new Error("Review not found");
			const match = statement.match(/draft=(\[[\s\S]*\])\);$/);
			if (!match) throw new Error("Missing draft");
			const [draft] = JSON.parse(match[1]) as [TopicReviewDraft];
			const topics = draft.topics.map((topic) => {
				const original = saved?.draft.topics.find(
					(current) => current.key === topic.key,
				);
				return {
					...{
						reason: "",
						threadIds: [],
						sampleSubjects: [],
						people: [],
						domains: [],
						accepted: false,
					},
					...original,
					...topic,
					id: original?.id ?? topic.id,
				};
			});
			if (JSON.stringify(topics) !== JSON.stringify(saved.draft.topics)) {
				saved.draft.topics = topics;
				saved.revision += 1;
			}
			await afterSave(saved);
		} else if (statement.startsWith("BrainApplyTopicReview(")) {
			if (!saved) throw new Error("Review not found");
			if (saved.appliedRevision !== saved.revision)
				saved = applyReceipt(saved);
			await afterApply(saved);
		} else throw new Error(`Unexpected request: ${statement}`);
		return {
			pixelReturn: [
				{
					output: {
						exists: saved !== null,
						review: structuredClone(saved),
					},
					operationType: ["MAP"],
				},
			],
		};
	});
	return {
		actions: { run } as unknown as InsightActions,
		run,
		afterSave,
		afterApply,
		get saved() {
			return saved;
		},
	};
}
