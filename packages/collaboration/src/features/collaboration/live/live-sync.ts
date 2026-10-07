import type { InsightActions } from "@/lib/pixel";
import { pixel } from "@/lib/pixel";
import type {
	CollaborationCommand,
	CollaborationState,
	Rule,
	Topic,
	TopicGoal,
	TopicNote,
} from "../state/collaboration.types";
import type { CollaborationChange } from "../state/collaboration-session.context";
import { runBatch } from "./live-state";

// Saves live-mode changes by diffing the state before and after each settled change, so any UI built on
// the existing commands is saved without knowing which button caused it.

// commands with no backend yet, or that carry what the server already holds; their effects stay in this
// browser session
const SESSION_ONLY = new Set<CollaborationCommand["type"]>([
	"thread.insights",
	"source.deleted",
	"session.create",
	"live.refresh",
	"source.import",
	"source.status",
	"live-profile.set",
	"snooze.expire",
]);

// a create returns the server id for the local one
type Create = {
	localId: string;
	statement: string;
	idOf: (out: unknown) => string | undefined;
};

interface Plan {
	creates: Create[];
	statements: string[];
}

const LOCAL = /^local-/;
// records imported in the browser from "Load your sources" have no server row yet
const imported = (value: string) =>
	value.startsWith("connected") || value.startsWith("session:");
const same = (a: unknown, b: unknown) =>
	JSON.stringify(a) === JSON.stringify(b);
const byId = <T extends { id: string }>(rows: T[]) =>
	new Map(rows.map((row) => [row.id, row]));

export type LiveSync = ((change: CollaborationChange) => void) & {
	/** Finish queued writes before reading their server echoes. */
	settled: () => Promise<void>;
	/** Keep session identities stable when a created row returns in a refresh. */
	localId: (serverId: string) => string;
};

/** Queue-backed saver: changes go out one at a time and in order. */
export function createLiveSync(
	actions: InsightActions,
	onError: (message: string) => void,
): LiveSync {
	const ids = new Map<string, string>();
	const id = (value: string) => ids.get(value) ?? value;
	let queue = Promise.resolve();
	const withServerIds = (statement: string) =>
		statement.replace(/"(local-[^"]+)"/g, (match, local) =>
			ids.has(local) ? JSON.stringify(ids.get(local)) : match,
		);

	const sync = (change: CollaborationChange): void => {
		const unsaved = change.commands.filter((command) =>
			SESSION_ONLY.has(command.type),
		);
		if (unsaved.length && unsaved.length === change.commands.length) return;
		queue = queue
			.then(async () => {
				// Earlier queued creates may have replaced these ids.
				const plan = planChange(change, id);
				for (const create of plan.creates) {
					// a step can point at an item created earlier in this change
					const [out] = await runBatch(actions, [
						withServerIds(create.statement),
					]);
					const serverId = create.idOf(out);
					if (!serverId)
						throw new Error(
							"The saved record did not return an id.",
						);
					ids.set(create.localId, serverId);
				}
				// statements built before the creates ran still hold local ids
				await runBatch(actions, plan.statements.map(withServerIds));
			})
			.catch((cause: unknown) =>
				onError(cause instanceof Error ? cause.message : String(cause)),
			);
	};
	return Object.assign(sync, {
		settled: () => queue,
		localId: (serverId: string): string =>
			[...ids].find(([, value]) => value === serverId)?.[0] ?? serverId,
	});
}

function planChange(
	change: CollaborationChange,
	id: (value: string) => string,
): Plan {
	const plan: Plan = { creates: [], statements: [] };
	const { previous: prev, next } = change;
	const merges = change.commands.filter(
		(
			command,
		): command is Extract<CollaborationCommand, { type: "topic.merge" }> =>
			command.type === "topic.merge",
	);
	// a merge moves links, people, and notes on the server in one call
	if (merges.length) {
		for (const merge of merges)
			plan.statements.push(
				pixel("BrainMergeTopics", {
					sourceTopicId: id(merge.sourceId),
					targetTopicId: id(merge.targetId),
				}),
			);
		return plan;
	}
	// a delete drops the topic's links, people, notes, and rules on the server in one call
	const deletes = change.commands.filter(
		(
			command,
		): command is Extract<CollaborationCommand, { type: "topic.delete" }> =>
			command.type === "topic.delete",
	);
	if (deletes.length) {
		for (const deleted of deletes)
			plan.statements.push(
				pixel("BrainDeleteTopic", { topicId: id(deleted.topicId) }),
			);
		return plan;
	}
	planTopics(plan, prev, next, id);
	planThreads(plan, prev, next, id);
	planItems(plan, prev, next, id);
	planWorkspaces(plan, prev, next, id);
	planPeople(plan, prev, next, id);
	planRules(plan, prev, next, id);
	planReviews(plan, prev, next, change.commands, id);
	planProfile(plan, prev, next);
	planRooms(plan, prev, next, id);
	return plan;
}

const TOPIC_FIELDS = [
	"name",
	"short",
	"accountId",
	"kind",
	"color",
	"description",
	"keywords",
	"calendarSeries",
] as const;

function planTopics(
	plan: Plan,
	prev: CollaborationState,
	next: CollaborationState,
	id: (v: string) => string,
) {
	const before = byId(prev.topics);
	const after = byId(next.topics);
	for (const topic of next.topics) {
		const old = before.get(topic.id);
		if (!old) {
			const fields = Object.fromEntries(
				Object.entries(pick(topic, TOPIC_FIELDS)).filter(
					([, value]) => value !== null && value !== "",
				),
			);
			// accepting a suggested topic passes its id; a local one gets a server id
			if (LOCAL.test(topic.id))
				plan.creates.push({
					localId: topic.id,
					statement: pixel("BrainSaveTopic", { topic: fields }),
					idOf: (out) => (out as Topic)?.id,
				});
			else
				plan.statements.push(
					pixel("BrainSaveTopic", {
						topic: { id: topic.id, ...fields },
					}),
				);
			planTopicParts(
				plan,
				{ ...topic, goals: [], notes: [], people: [] },
				topic,
				id,
			);
			continue;
		}
		const changed = TOPIC_FIELDS.filter(
			(field) => !same(old[field], topic[field]),
		);
		if (changed.length)
			plan.statements.push(
				pixel("BrainSaveTopic", {
					topic: { id: id(topic.id), ...pick(topic, changed) },
				}),
			);
		if (old.status !== topic.status)
			plan.statements.push(
				pixel("BrainSetTopicStatus", {
					topicId: id(topic.id),
					status: topic.status,
				}),
			);
		planTopicParts(plan, old, topic, id);
	}
	for (const topic of prev.topics)
		if (!after.has(topic.id))
			plan.statements.push(
				pixel("BrainDeleteTopic", { topicId: id(topic.id) }),
			);
}

function planTopicParts(
	plan: Plan,
	old: Topic,
	topic: Topic,
	id: (v: string) => string,
) {
	const topicId = id(topic.id);
	const notes = (goals: TopicGoal[], rows: TopicNote[]) =>
		new Map<string, { kind: string; text: string; state: string }>([
			...goals.map(
				(goal) =>
					[
						goal.noteId,
						{ kind: "goal", text: goal.text, state: goal.status },
					] as const,
			),
			...rows.map(
				(note) =>
					[
						note.noteId,
						{
							kind: note.kind,
							text: note.text,
							state: note.status,
						},
					] as const,
			),
		]);
	const before = notes(old.goals, old.notes);
	const after = notes(topic.goals, topic.notes);
	for (const [noteId, note] of after) {
		const was = before.get(noteId);
		if (was && same(was, note)) continue;
		if (!was && LOCAL.test(noteId))
			plan.creates.push({
				localId: noteId,
				statement: pixel("BrainSaveTopicNote", { topicId, ...note }),
				idOf: (out) => (out as { noteId?: string })?.noteId,
			});
		else
			plan.statements.push(
				pixel("BrainSaveTopicNote", {
					topicId,
					noteId: id(noteId),
					...note,
				}),
			);
	}
	for (const noteId of before.keys())
		if (!after.has(noteId))
			plan.statements.push(
				pixel("BrainDeleteTopicNote", { topicId, noteId: id(noteId) }),
			);

	const members = new Map(
		old.people.map((person) => [person.personId, person]),
	);
	for (const person of topic.people) {
		const was = members.get(person.personId);
		if (was && was.state === person.state && was.role === person.role)
			continue;
		plan.statements.push(
			pixel("BrainSetTopicPerson", {
				topicId,
				personId: person.personId,
				state: person.state,
				role: person.role || undefined,
			}),
		);
	}
	for (const [personId] of members)
		if (!topic.people.some((person) => person.personId === personId))
			plan.statements.push(
				pixel("BrainSetTopicPerson", {
					topicId,
					personId,
					state: "removed",
				}),
			);
}

function planThreads(
	plan: Plan,
	prev: CollaborationState,
	next: CollaborationState,
	id: (v: string) => string,
) {
	const before = byId(prev.threads);
	for (const thread of next.threads) {
		const old = before.get(thread.id);
		if (!old || imported(thread.id)) continue;
		if (old.muted !== thread.muted)
			plan.statements.push(
				pixel("BrainSetThreadMuted", {
					threadId: thread.id,
					muted: thread.muted,
				}),
			);
		for (const participant of thread.participants) {
			const was = old.participants.find(
				(candidate) => candidate.personId === participant.personId,
			);
			if (was && was.included !== participant.included)
				plan.statements.push(
					pixel("BrainSetThreadParticipant", {
						threadId: thread.id,
						personId: participant.personId,
						included: participant.included,
					}),
				);
		}
		const oldLinks = new Map(
			old.topicLinks.map((link) => [link.topicId, link]),
		);
		const newLinks = new Map(
			thread.topicLinks.map((link) => [link.topicId, link]),
		);
		for (const [topicId] of oldLinks)
			if (!newLinks.has(topicId))
				plan.statements.push(
					pixel("BrainLinkThreadTopic", {
						threadId: thread.id,
						topicId: id(topicId),
						remove: true,
					}),
				);
		// The new primary goes last and demotes the old one itself. Suggested links stay server-owned.
		const changed = thread.topicLinks
			.filter((link) => {
				const was = oldLinks.get(link.topicId);
				if (same(was, link) || link.source === "suggested")
					return false;
				return !(
					was?.primary &&
					!link.primary &&
					same({ ...was, primary: false }, link)
				);
			})
			.sort((a, b) => Number(a.primary) - Number(b.primary));
		for (const link of changed)
			plan.statements.push(
				pixel("BrainLinkThreadTopic", {
					threadId: thread.id,
					topicId: id(link.topicId),
					primary: link.primary,
				}),
			);
		const goal = next.workspaces[thread.id]?.goal ?? "";
		if (goal !== (prev.workspaces[thread.id]?.goal ?? ""))
			plan.statements.push(
				pixel("WorkSetThreadGoal", { threadId: thread.id, goal }),
			);
	}
}

const ITEM_FIELDS = [
	"status",
	"closedReason",
	"priority",
	"title",
	"snoozeUntil",
	"suggested",
] as const;

function planItems(
	plan: Plan,
	prev: CollaborationState,
	next: CollaborationState,
	id: (v: string) => string,
) {
	const before = byId(prev.items);
	for (const item of next.items) {
		const old = before.get(item.id);
		if (imported(item.id) || imported(item.threadId)) continue;
		if (!old) {
			if (LOCAL.test(item.id))
				plan.creates.push({
					localId: item.id,
					statement: pixel("WorkCreateItem", {
						threadId: item.threadId,
						title: item.title,
						askType: item.askType,
						dueAt: item.due ?? undefined,
					}),
					idOf: (out) => (out as { id?: string })?.id,
				});
			continue;
		}
		const changed = ITEM_FIELDS.filter(
			(field) => !same(old[field], item[field]),
		);
		if (!changed.length) continue;
		const args: Record<string, unknown> = { itemId: id(item.id) };
		for (const field of changed) {
			// reopening clears the reason on the server
			if (field === "closedReason" && !item.closedReason) continue;
			// leaving snoozed clears snoozeUntil on the server by itself
			if (field === "snoozeUntil" && !item.snoozeUntil) continue;
			// A present empty noun clears the optional priority on existing servers.
			if (field === "priority" && !item.priority) {
				args.priority = [];
				continue;
			}
			if (field === "suggested") args.suggested = item.suggested === true;
			else args[field] = item[field];
		}
		if (item.status === "snoozed") args.snoozeUntil = item.snoozeUntil;
		if (Object.keys(args).length > 1)
			plan.statements.push(pixel("WorkUpdateItem", args));
	}
}

const PERSON_FIELDS = [
	"vip",
	"relationship",
	"accountId",
	"neverIngest",
	"follow",
] as const;

function planPeople(
	plan: Plan,
	prev: CollaborationState,
	next: CollaborationState,
	_id: (v: string) => string,
) {
	const before = byId(prev.people);
	for (const person of next.people) {
		const old = before.get(person.id);
		if (!old || imported(person.id)) continue;
		const changed = PERSON_FIELDS.filter(
			(field) => !same(old[field], person[field]),
		);
		if (changed.length)
			plan.statements.push(
				pixel("BrainSavePerson", {
					person: { id: person.id, ...pick(person, changed) },
				}),
			);
	}
}

function ruleFields(rule: Rule) {
	return pick(rule, [
		"kind",
		"value",
		"topicId",
		"personId",
		"channel",
		"note",
	] as const);
}

function planRules(
	plan: Plan,
	prev: CollaborationState,
	next: CollaborationState,
	id: (v: string) => string,
) {
	const before = byId(prev.rules);
	const after = byId(next.rules);
	for (const rule of next.rules) {
		const old = before.get(rule.id);
		const active = !rule.disabledAt;
		if (active && !old)
			plan.creates.push({
				localId: rule.id,
				statement: pixel("BrainSaveRule", { rule: ruleFields(rule) }),
				idOf: (out) => (out as { id?: string })?.id,
			});
		else if (!active && old && !old.disabledAt)
			plan.statements.push(
				pixel("BrainDeleteRule", { ruleId: id(rule.id) }),
			);
	}
	for (const rule of prev.rules)
		if (!after.has(rule.id) && !rule.disabledAt)
			plan.statements.push(
				pixel("BrainDeleteRule", { ruleId: id(rule.id) }),
			);
}

function planReviews(
	plan: Plan,
	prev: CollaborationState,
	next: CollaborationState,
	commands: CollaborationCommand[],
	_id: (v: string) => string,
) {
	const before = byId(prev.reviews);
	for (const review of next.reviews) {
		const old = before.get(review.id);
		if (!old || old.status === review.status || review.status === "open")
			continue;
		const command = commands.find(
			(
				candidate,
			): candidate is Extract<
				CollaborationCommand,
				{ type: "review.resolve" }
			> =>
				candidate.type === "review.resolve" &&
				candidate.reviewId === review.id,
		);
		const decision =
			command?.decision ??
			(review.status === "dismissed" ? "dismiss" : "accept");
		const action =
			decision === "accept" &&
			review.kind === "topic_choice" &&
			command?.targetTopicId
				? "choose"
				: decision;
		plan.statements.push(
			pixel("BrainResolveReview", {
				reviewId: review.id,
				action,
				paramValues: command?.targetTopicId
					? { topicId: command.targetTopicId }
					: undefined,
			}),
		);
	}
}

const PROFILE_FIELDS = [
	"name",
	"email",
	"org",
	"role",
	"timezone",
	"workingHours",
	"style",
] as const;
const SETTINGS_FIELDS = [
	"classifierEngineId",
	"fileAt",
	"askAt",
	"sourcesJson",
] as const;

function planProfile(
	plan: Plan,
	prev: CollaborationState,
	next: CollaborationState,
) {
	if (prev.liveProfile && next.liveProfile) {
		const old = prev.liveProfile;
		const profile = next.liveProfile;
		const changed = PROFILE_FIELDS.filter(
			(field) => !same(old[field], profile[field]),
		);
		if (changed.length)
			plan.statements.push(
				pixel("BrainSaveProfile", { profile: pick(profile, changed) }),
			);
	}
	const changed = SETTINGS_FIELDS.filter(
		(field) => !same(prev.settings[field], next.settings[field]),
	);
	if (changed.length)
		plan.statements.push(
			pixel("BrainSaveSettings", {
				settings: pick(next.settings, changed),
			}),
		);
}

const STEP_FIELDS = [
	"text",
	"kind",
	"status",
	"ownerId",
	"due",
	"itemId",
	"linkTopicId",
] as const;
const FACT_FIELDS = ["text", "from", "status", "sourcePersonId"] as const;

// steps and facts are saved one row at a time; a cleared field goes out as "" since pixel drops nulls
function planWorkspaces(
	plan: Plan,
	prev: CollaborationState,
	next: CollaborationState,
	id: (v: string) => string,
) {
	const threadIds = new Set([
		...Object.keys(prev.workspaces),
		...Object.keys(next.workspaces),
	]);
	for (const threadId of threadIds) {
		if (imported(threadId)) continue;
		const before = prev.workspaces[threadId];
		const after = next.workspaces[threadId];
		if (before === after) continue;
		planRows(plan, threadId, before?.steps ?? [], after?.steps ?? [], {
			fields: STEP_FIELDS,
			save: "WorkSaveStep",
			remove: "WorkDeleteStep",
			key: "step",
			idKey: "stepId",
			id,
		});
		planRows(plan, threadId, before?.facts ?? [], after?.facts ?? [], {
			fields: FACT_FIELDS,
			save: "WorkSaveFact",
			remove: "WorkDeleteFact",
			key: "fact",
			idKey: "factId",
			id,
		});
	}
}

function planRows<T extends { id: string }>(
	plan: Plan,
	threadId: string,
	oldRows: T[],
	newRows: T[],
	how: {
		fields: readonly (keyof T & string)[];
		save: string;
		remove: string;
		key: string;
		idKey: string;
		id: (v: string) => string;
	},
) {
	const before = byId(oldRows);
	const after = byId(newRows);
	for (const row of newRows) {
		const old = before.get(row.id);
		if (!old) {
			if (!LOCAL.test(row.id)) continue;
			const fields = Object.fromEntries(
				how.fields
					.filter((field) => row[field] != null && row[field] !== "")
					.map((field) => [field, row[field]]),
			);
			plan.creates.push({
				localId: row.id,
				statement: pixel(how.save, { threadId, [how.key]: fields }),
				idOf: (out) => (out as { id?: string })?.id,
			});
			continue;
		}
		const changed = how.fields.filter(
			(field) => !same(old[field], row[field]),
		);
		if (changed.length)
			plan.statements.push(
				pixel(how.save, {
					threadId,
					[how.key]: {
						id: how.id(row.id),
						...Object.fromEntries(
							changed.map((field) => [field, row[field] ?? ""]),
						),
					},
				}),
			);
	}
	for (const row of oldRows)
		if (!after.has(row.id) && !LOCAL.test(how.id(row.id)))
			plan.statements.push(
				pixel(how.remove, { threadId, [how.idKey]: how.id(row.id) }),
			);
}

function planRooms(
	plan: Plan,
	prev: CollaborationState,
	next: CollaborationState,
	_id: (v: string) => string,
) {
	for (const threadId of next.openThreadIds)
		if (!imported(threadId) && !prev.openThreadIds.includes(threadId))
			plan.statements.push(pixel("WorkOpenRoom", { threadId }));
	for (const threadId of prev.openThreadIds)
		if (!imported(threadId) && !next.openThreadIds.includes(threadId))
			plan.statements.push(pixel("WorkCloseRoom", { threadId }));
}

function pick<T extends object, K extends keyof T>(
	row: T,
	fields: readonly K[],
): Partial<Pick<T, K>> {
	const out: Partial<Pick<T, K>> = {};
	for (const field of fields)
		if (row[field] !== undefined) out[field] = row[field];
	return out;
}
