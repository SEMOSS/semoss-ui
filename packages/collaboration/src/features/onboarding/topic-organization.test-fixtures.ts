import { vi } from "vitest";
import type { InsightActions } from "@/lib/pixel";
import type { TopicReviewChange } from "./topic-evidence-api";
import type {
	TopicOrganizationPreview,
	TopicOrganizationProposal,
} from "./topic-organization-api";
import type { TopicOrganizationGroup } from "./topic-organization-schema";
import {
	makeReview,
	type ReviewWire,
	reviewSession,
} from "./topic-review.test-fixtures";

export function organizationReview(count = 3): ReviewWire {
	const review = makeReview("UNC Recruiting");
	const first = review.draft.topics[0];
	review.draft.topics = Array.from({ length: count }, (_, index) => ({
		...structuredClone(first),
		key: `topic-${index + 1}`,
		id: `topic-${index + 1}`,
		name:
			["UNC Recruiting", "VCU Hiring", "Northwind Delivery"][index] ??
			`Project ${index + 1}`,
		description:
			index < 2
				? "University recruiting with John and Taylor."
				: "A separate client project.",
		terms: ["UNC", "VCU", "Northwind"][index] ?? "",
	}));
	return review;
}

export function organizationProposal(
	review: ReviewWire,
): TopicOrganizationProposal {
	const kept = review.draft.topics.filter(
		(topic) => topic.keep && !topic.mergedIntoKey,
	);
	return {
		reviewId: review.id,
		revision: review.revision,
		beforeCount: kept.length,
		proposedCount: kept.length - 1,
		groups: [
			{
				topicKeys: kept.slice(0, 2).map((topic) => topic.key),
				targetKey: kept[0].key,
				name: "Recruiting",
				description:
					"Recruiting across UNC and VCU with John and Taylor.",
				terms: "UNC\nVCU",
				reason: "Two labels for the same recruiting area.",
			},
			...kept.slice(2).map((topic) => ({
				topicKeys: [topic.key],
				targetKey: topic.key,
				name: topic.name,
				description: topic.description,
				terms: topic.terms,
				reason: "A distinct client project.",
			})),
		],
		questions: [
			"Does John support any unrelated projects that should stay separate?",
		],
	};
}

export function organizationPreview(
	review: ReviewWire,
	groups: TopicOrganizationGroup[],
): TopicOrganizationPreview {
	const kept = review.draft.topics.filter(
		(topic) => topic.keep && !topic.mergedIntoKey,
	);
	return {
		reviewId: review.id,
		revision: review.revision,
		beforeCount: kept.length,
		afterCount:
			kept.length -
			groups.reduce(
				(total, group) => total + group.topicKeys.length - 1,
				0,
			),
		scopeVersion: "a".repeat(64),
		groups: groups.map((group) => ({
			...group,
			contributing: group.topicKeys.map((key) => {
				const topic = kept.find((topic) => topic.key === key);
				if (!topic) throw new Error("Unknown fixture topic");
				return {
					key,
					name: topic.name,
					examples: topic.threadIds.length,
					accepted: topic.accepted,
				};
			}),
			examples: 2,
			impact: {
				linkedConversations: 2,
				workItems: 1,
				steps: 3,
				people: 1,
				notes: 1,
				rules: 1,
				pendingRelationships: 0,
				positiveOverExclusion: 0,
			},
			canApply: true,
			reason: "",
		})),
	};
}

export function packet(output: unknown) {
	return {
		pixelReturn: [
			{ output: structuredClone(output), operationType: ["MAP"] },
		],
	};
}

function parameter<T>(statement: string, name: string): T {
	const pattern = new RegExp(`${name}=(\\[[\\s\\S]*\\])\\);$`);
	const match = statement.match(pattern);
	if (!match) throw new Error(`Missing fixture parameter ${name}`);
	return (JSON.parse(match[1]) as [T])[0];
}

/** Transport-only fixture. Saved reference and transaction behavior is exercised by the H2 checks. */
export function organizationSession(initial = organizationReview()) {
	const base = reviewSession(async () => structuredClone(initial));
	const afterSuggest = vi.fn(
		async (proposal: TopicOrganizationProposal) => proposal,
	);
	const afterPreview = vi.fn(
		async (preview: TopicOrganizationPreview) => preview,
	);
	const afterChange = vi.fn(
		async (_review: ReviewWire): Promise<void> => undefined,
	);
	const snapshots = new Map<
		string,
		{ before: ReviewWire; after: ReviewWire }
	>();
	const run = vi.fn(async (statement: string) => {
		const review = base.saved;
		if (statement.startsWith("BrainSuggestTopicOrganization(")) {
			if (!review) throw new Error("Missing review");
			return packet(await afterSuggest(organizationProposal(review)));
		}
		if (statement.startsWith("BrainPreviewTopicOrganization(")) {
			if (!review) throw new Error("Missing review");
			return packet(
				await afterPreview(
					organizationPreview(
						review,
						parameter<{ groups: TopicOrganizationGroup[] }>(
							statement,
							"proposal",
						).groups,
					),
				),
			);
		}
		if (statement.startsWith("BrainChangeTopicReview(")) {
			if (!review) throw new Error("Missing review");
			const match = statement.match(/operationId=\[("[^"]+")\]/);
			if (!match) throw new Error("Missing operation ID");
			const id = JSON.parse(match[1]) as string;
			const change = parameter<TopicReviewChange>(statement, "change");
			if (!(review.draft.operationIds ?? []).includes(id)) {
				const before = structuredClone(review);
				if (change.type === "organize") {
					for (const group of change.groups) {
						const target = review.draft.topics.find(
							(topic) => topic.key === group.targetKey,
						);
						if (!target) throw new Error("Unknown fixture target");
						Object.assign(target, {
							name: group.name,
							description: group.description,
							terms: group.terms,
						});
						for (const source of review.draft.topics.filter(
							(topic) =>
								group.topicKeys.includes(topic.key) &&
								topic.key !== target.key,
						)) {
							source.keep = false;
							source.mergedIntoKey = target.key;
							target.threadIds = [
								...new Set([
									...target.threadIds,
									...source.threadIds,
								]),
							];
						}
					}
					review.draft.history = [
						...(review.draft.history ?? []),
						{
							id,
							type: "organize",
							summary: "Combined overlapping topics",
						},
					];
					review.draft.lastChange = "Combined overlapping topics";
				} else if (change.type === "reconcile_profile") {
					const conflict = review.profileConflicts.find(
						(item) => item.topicKey === change.topicKey,
					);
					const topic = review.draft.topics.find(
						(item) => item.key === change.topicKey,
					);
					if (
						!conflict ||
						!topic ||
						change.profileVersion !== conflict.profileVersion
					)
						throw new Error("The saved topic changed again");
					if (change.choice === "saved")
						Object.assign(topic, {
							name: conflict.savedProfile.name,
							short: conflict.savedProfile.short,
							description: conflict.savedProfile.description,
							terms: conflict.savedProfile.terms,
						});
					review.profileConflicts = review.profileConflicts.filter(
						(item) => item.topicKey !== topic.key,
					);
					review.draft.history = [
						...(review.draft.history ?? []),
						{
							id,
							type: "reconcile_profile",
							summary: "Reconciled saved profile",
						},
					];
				} else if (change.type === "undo") {
					const snapshot = snapshots.get(change.changeId);
					if (!snapshot) throw new Error("Missing Undo snapshot");
					for (const topic of review.draft.topics) {
						const old = snapshot.before.draft.topics.find(
							(item) => item.key === topic.key,
						);
						const changed = snapshot.after.draft.topics.find(
							(item) => item.key === topic.key,
						);
						if (!old || !changed) continue;
						for (const field of [
							"name",
							"description",
							"terms",
							"keep",
							"mergedIntoKey",
							"threadIds",
						] as const) {
							if (
								JSON.stringify(topic[field]) ===
								JSON.stringify(changed[field])
							)
								Object.assign(topic, { [field]: old[field] });
						}
					}
					review.profileConflicts = snapshot.before.profileConflicts;
					review.draft.history = snapshot.before.draft.history;
					review.draft.lastChange = "Undid grouping";
				} else
					throw new Error(
						"Conversation changes use their own transport fixture",
					);
				review.revision += 1;
				review.draft.operationIds = [
					...(review.draft.operationIds ?? []),
					id,
				];
				snapshots.set(id, { before, after: structuredClone(review) });
			}
			await afterChange(review);
			return packet({ exists: true, review });
		}
		const response = await base.run(statement);
		if (statement.startsWith("BrainApplyTopicReview(") && base.saved) {
			base.saved.draft.history = [];
			return packet({ exists: true, review: base.saved });
		}
		return response;
	});
	return {
		...base,
		actions: { run } as unknown as InsightActions,
		run,
		afterSuggest,
		afterPreview,
		afterChange,
		get saved() {
			return base.saved;
		},
	};
}
