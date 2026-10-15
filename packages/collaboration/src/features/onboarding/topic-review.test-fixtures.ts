import { screen, waitFor } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import { expect, vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import { topicClues } from "./topic-clues";
import type {
	ReviewTopic,
	TopicReview,
	TopicReviewDraft,
} from "./topic-review-api";

export interface JobWire {
	id: string;
	status: "running" | "done" | "failed";
	progress: number;
	params: { mode: string; reviewId: string; reviewRevision: number };
	counts: Record<string, unknown>;
	error?: string;
}

/** The background job that groups and names topics (kind topic_map). */
export interface MapJobWire {
	id: string;
	status: "running" | "done" | "failed";
	step: string;
	progress: number;
	params: Record<string, unknown>;
	counts: Record<string, unknown>;
	error?: string;
}

export type ReviewWire = Omit<TopicReview, "filingJob"> & {
	filingJob: JobWire | null;
};

export function topicMapJob(
	status: MapJobWire["status"] = "running",
	step = "naming",
	found: string[] = [],
	conversations = 120,
): MapJobWire {
	return {
		id: "map-1",
		status,
		step,
		progress: status === "done" ? 100 : 40,
		params: {},
		counts: { found, conversations },
	};
}

export function makeTopic(
	key: string,
	name: string,
	extra: Partial<ReviewTopic> = {},
): ReviewTopic {
	return {
		key,
		id: key,
		name,
		description: `About ${name}.`,
		short: "",
		terms: "",
		keep: true,
		removedPeople: [],
		addedPeople: [],
		addedPeopleInfo: [],
		suggestedTerms: [],
		accepted: false,
		mergedIntoKey: null,
		mergeApplied: false,
		reason: "Related project conversations",
		threadIds: ["thread-1", "thread-2"],
		sampleSubjects: ["Northwind launch readiness"],
		people: [
			{ id: "p-1", name: "Ana Lima" },
			{ id: "p-2", name: "Bo Chen" },
		],
		domains: ["northwind.example"],
		area: null,
		youWrote: 0,
		vipThreads: 0,
		own: null,
		...extra,
	};
}

export function makeReview(name = "Northwind Migration"): ReviewWire {
	return {
		id: "review-1",
		revision: 1,
		profileConflicts: [],
		appliedRevision: null,
		result: { topics: [], skipped: [] },
		filingJobId: null,
		filingJob: null,
		updatedAt: null,
		draft: {
			modelError: "",
			guidance: "",
			granularity: "broad",
			areas: [],
			topics: [
				makeTopic("topic-1", name, {
					description: "Moving Northwind to the new platform.",
				}),
			],
		},
	};
}

/**
 * Seven areas. The first is two topics shown as one ("Recruiting"); areas 6 and 7
 * start unkept, so only the first five show until Show more.
 */
export function makeAreaReview(): ReviewWire {
	const review = makeReview();
	// key, name, kept, suggested
	const singles: [string, string, boolean, boolean][] = [
		["topic-3", "Platform Operations", true, true],
		["topic-4", "Budget Planning", true, true],
		["topic-5", "Vendor Reviews", true, true],
		["topic-6", "Security Audits", true, true],
		["topic-7", "Customer Onboarding", false, true],
		["topic-8", "Team Offsite", false, false],
	];
	review.draft.topics = [
		makeTopic("topic-1", "Recruiting", {
			area: "area-1",
			own: { name: "UNC Recruiting" },
		}),
		makeTopic("topic-2", "VCU Hiring", {
			area: "area-1",
			mergedIntoKey: "topic-1",
			keep: false,
			threadIds: ["thread-3"],
			people: [],
		}),
		...singles.map(([key, name, keep], index) =>
			makeTopic(key, name, { area: `area-${index + 2}`, keep }),
		),
	];
	review.draft.areas = [
		{
			key: "area-1",
			name: "Recruiting",
			about: "",
			topicKeys: ["topic-1", "topic-2"],
			suggested: true,
			split: false,
		},
		...singles.map(([key, name, , suggested], index) => ({
			key: `area-${index + 2}`,
			name,
			about: "",
			topicKeys: [key],
			suggested,
			split: false,
		})),
	];
	return review;
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
				keywords: topicClues(topic.terms),
			};
		});
	// parts of a skipped area are skipped with it, not merged
	const merges = review.draft.topics
		.filter((topic) => topic.mergedIntoKey && !topic.mergeApplied)
		.flatMap((source) => {
			const target = review.result.topics.find(
				(item) => item.key === source.mergedIntoKey,
			);
			if (!target) return [];
			const receipt = {
				sourceKey: source.key,
				targetKey: target.key,
				sourceId: source.id,
				targetId: target.id,
				mergedInto: target.id,
			};
			source.id = null;
			source.mergeApplied = true;
			return [receipt];
		});
	if (merges.length) review.result.merges = merges;
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

function packet(output: unknown) {
	return {
		pixelReturn: [
			{ output: structuredClone(output), operationType: ["MAP"] },
		],
	};
}

/** What the owner can edit; the rest of a topic is evidence the server owns. */
function editable(topic: TopicReviewDraft["topics"][number]) {
	return {
		key: topic.key,
		id: topic.id,
		name: topic.name,
		description: topic.description,
		short: topic.short,
		terms: topic.terms,
		keep: topic.keep,
		removedPeople: topic.removedPeople,
		addedPeople: topic.addedPeople,
	};
}

/**
 * A saved-review transport fixture; production transaction behavior is checked separately.
 * generate returns the first draft, or the background job still building it.
 */
export function reviewSession(
	generate: () => Promise<ReviewWire | { job: MapJobWire }> = async () =>
		makeReview(),
) {
	let saved: ReviewWire | null = null;
	const afterSave = vi.fn(
		async (_review: ReviewWire): Promise<void> => undefined,
	);
	const afterApply = vi.fn(
		async (_review: ReviewWire): Promise<void> => undefined,
	);
	const getJob = vi.fn(
		async (_statement: string): Promise<unknown> => ({ status: "none" }),
	);
	const run = vi.fn(async (statement: string) => {
		if (statement === "BrainStartTopicReview();") {
			if (!saved) {
				const started = await generate();
				if ("job" in started)
					return packet({
						exists: false,
						pending: true,
						job: started.job,
					});
				saved = started;
			}
		} else if (statement === "BrainGetTopicReview();") {
			/* Read the same owner draft. */
		} else if (statement.startsWith("BrainGetJob(")) {
			return packet(await getJob(statement));
		} else if (statement.startsWith("BrainListPeople(")) {
			return packet({ items: [] });
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
					...makeTopic(topic.key, topic.name, {
						reason: "",
						threadIds: [],
						sampleSubjects: [],
						people: [],
						domains: [],
					}),
					...original,
					...topic,
					id: original?.id ?? topic.id,
				};
			});
			if (
				JSON.stringify(topics.map(editable)) !==
					JSON.stringify(saved.draft.topics.map(editable)) ||
				draft.guidance !== saved.draft.guidance ||
				draft.granularity !== saved.draft.granularity
			) {
				saved.draft.topics = topics;
				saved.draft.guidance = draft.guidance;
				saved.draft.granularity = draft.granularity;
				saved.revision += 1;
			}
			await afterSave(saved);
		} else if (statement.startsWith("BrainSetTopicArea(")) {
			if (!saved) throw new Error("Review not found");
			const areaKey = JSON.parse(
				statement.match(/area=(\[[^\]]+\])/)?.[1] || "[]",
			)[0] as string;
			const split = statement.includes("split=[true]");
			const area = saved.draft.areas.find((item) => item.key === areaKey);
			if (!area) throw new Error("Unknown area");
			const [first, ...parts] = area.topicKeys.map((key) => {
				const topic = saved?.draft.topics.find(
					(item) => item.key === key,
				);
				if (!topic) throw new Error("Unknown area topic");
				return topic;
			});
			area.split = split;
			// a combined area's first topic stands for the whole area
			first.name = split ? (first.own?.name ?? first.name) : area.name;
			for (const part of parts) {
				part.mergedIntoKey = split ? null : first.key;
				part.keep = split ? first.keep : false;
			}
			saved.revision += 1;
		} else if (statement.startsWith("BrainApplyTopicReview(")) {
			if (!saved) throw new Error("Review not found");
			if (saved.appliedRevision !== saved.revision)
				saved = applyReceipt(saved);
			await afterApply(saved);
		} else throw new Error(`Unexpected request: ${statement}`);
		return packet({
			exists: saved !== null,
			review: saved,
		});
	});
	return {
		actions: { run } as unknown as InsightActions,
		run,
		afterSave,
		afterApply,
		getJob,
		get saved() {
			return saved;
		},
	};
}

/** Moves on from the areas stage; each stage has its own Next button. */
export async function nextStage(
	user: ReturnType<typeof userEvent.setup>,
	stage: "people" | "conversations",
) {
	await press(user, `Next: ${stage}`);
}

/** Click a button once it is enabled; a stage disables its buttons while it loads or saves. */
export async function press(
	user: ReturnType<typeof userEvent.setup>,
	name: string | RegExp,
) {
	const button = await screen.findByRole("button", { name });
	await waitFor(() => expect(button).toBeEnabled());
	await user.click(button);
}
