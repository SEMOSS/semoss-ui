import type {
	CollaborationCommand,
	CollaborationState,
	ThreadTopicLink,
	ThreadWorkspace,
	Topic,
	WorkItem,
} from "./collaboration.types";

/** New workspaces contain no inferred source bodies or assistant history. */
export function createEmptyWorkspace(): ThreadWorkspace {
	return {
		goal: "",
		facts: [],
		messages: [],
		steps: [],
		assets: [],
		drafts: [],
		suggestions: [],
		sampleChat: [],
		related: [],
		meetings: [],
	};
}

/** Keep one primary, retaining an existing primary before comparing confidence. */
export function normalizeTopicLinks(
	links: ThreadTopicLink[],
): ThreadTopicLink[] {
	const unique = links.filter(
		(link, index) =>
			links.findIndex(
				(candidate) => candidate.topicId === link.topicId,
			) === index,
	);
	const primary =
		unique.find((link) => link.primary) ??
		[...unique].sort(
			(a, b) => (b.confidence ?? -1) - (a.confidence ?? -1),
		)[0];
	return unique.map((link) => ({
		...link,
		primary: link.topicId === primary?.topicId,
	}));
}

function zonedParts(date: Date, timezone: string): Record<string, number> {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
		second: "numeric",
		hourCycle: "h23",
	}).formatToParts(date);
	return Object.fromEntries(
		parts
			.filter((part) => part.type !== "literal")
			.map((part) => [part.type, Number(part.value)]),
	);
}

/** Resolve tomorrow 08:00 in the profile timezone, including daylight saving changes. */
export function tomorrowAtEight(now: string, timezone: string): string {
	let zone = timezone;
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: zone }).format();
	} catch {
		zone = "UTC";
	}
	const local = zonedParts(new Date(now), zone);
	const target = Date.UTC(local.year, local.month - 1, local.day + 1, 8);
	let instant = target;
	for (let i = 0; i < 3; i += 1) {
		const parts = zonedParts(new Date(instant), zone);
		const representation = Date.UTC(
			parts.year,
			parts.month - 1,
			parts.day,
			parts.hour,
			parts.minute,
			parts.second,
		);
		instant += target - representation;
	}
	return new Date(instant).toISOString();
}

/** Derive all displayed membership/count values from the current shared records. */
export function reconcileCollaborationState(
	state: CollaborationState,
): CollaborationState {
	return {
		...state,
		threads: state.threads.map((thread) => ({
			...thread,
			topicLinks: normalizeTopicLinks(thread.topicLinks),
		})),
		topics: state.topics.map((topic) => {
			const threads = state.threads.filter((thread) =>
				thread.topicLinks.some((link) => link.topicId === topic.id),
			);
			return {
				...topic,
				stats: {
					threads: threads.length,
					openItems: state.items.filter(
						(item) =>
							item.topicIds.includes(topic.id) &&
							(item.status === "open" ||
								item.status === "waiting"),
					).length,
					lastActivity:
						threads
							.map((thread) => thread.lastAt)
							.sort()
							.at(-1) ?? topic.stats.lastActivity,
				},
			};
		}),
		people: state.people.map((person) => ({
			...person,
			topics: state.topics
				.filter((topic) =>
					topic.people.some(
						(member) =>
							member.personId === person.id &&
							member.state === "member",
					),
				)
				.map((topic) => topic.id),
		})),
		profile: {
			...state.profile,
			vips: state.people
				.filter((person) => person.isSample && person.vip)
				.map((person) => person.id),
		},
		liveProfile: state.liveProfile
			? {
					...state.liveProfile,
					vips: state.people
						.filter((person) => !person.isSample && person.vip)
						.map((person) => person.id),
				}
			: null,
	};
}

function newTopic(
	state: CollaborationState,
	patch: Partial<Topic>,
	now: string,
): Topic {
	return {
		name: patch.name ?? "Untitled topic",
		short: patch.short ?? patch.name ?? "New topic",
		accountId: patch.accountId ?? null,
		kind: patch.kind ?? "personal",
		color: "",
		status: "active",
		description: "",
		keywords: [],
		goals: [],
		notes: [],
		people: [],
		calendarSeries: [],
		stats: { threads: 0, openItems: 0, lastActivity: now },
		isSample: false,
		...patch,
		id: patch.id ?? `local-topic-${state.sequence++}`,
	};
}

/** Move source associations atomically, retaining target membership decisions. */
function mergeTopics(
	state: CollaborationState,
	sourceId: string,
	targetId: string,
): void {
	if (sourceId === targetId) return;
	const source = state.topics.find((topic) => topic.id === sourceId);
	const target = state.topics.find((topic) => topic.id === targetId);
	if (!source || !target || source.isSample !== target.isSample) return;
	target.goals.push(
		...source.goals.filter(
			(goal) =>
				!target.goals.some((other) => other.noteId === goal.noteId),
		),
	);
	target.notes.push(
		...source.notes.filter(
			(note) =>
				!target.notes.some((other) => other.noteId === note.noteId),
		),
	);
	target.people.push(
		...source.people.filter(
			(person) =>
				!target.people.some(
					(other) => other.personId === person.personId,
				),
		),
	);
	target.keywords = [...new Set([...target.keywords, ...source.keywords])];
	target.calendarSeries = [
		...new Set([...target.calendarSeries, ...source.calendarSeries]),
	];
	for (const thread of state.threads) {
		const sourceLink = thread.topicLinks.find(
			(link) => link.topicId === sourceId,
		);
		if (!sourceLink) continue;
		const targetLink = thread.topicLinks.find(
			(link) => link.topicId === targetId,
		);
		thread.topicLinks = thread.topicLinks.filter(
			(link) => link.topicId !== sourceId,
		);
		if (targetLink)
			targetLink.primary = targetLink.primary || sourceLink.primary;
		else thread.topicLinks.push({ ...sourceLink, topicId: targetId });
		thread.topicLinks = normalizeTopicLinks(thread.topicLinks);
	}
	for (const item of state.items)
		item.topicIds = [
			...new Set(
				item.topicIds.map((id) => (id === sourceId ? targetId : id)),
			),
		];
	for (const rule of state.rules)
		if (rule.topicId === sourceId) rule.topicId = targetId;
	for (const review of state.reviews) {
		if (review.topicId === sourceId) review.topicId = targetId;
		if (review.refId === sourceId) review.refId = targetId;
	}
	for (const workspace of Object.values(state.workspaces)) {
		for (const step of workspace.steps)
			if (step.linkTopicId === sourceId) step.linkTopicId = targetId;
	}
	state.topics = state.topics.filter((topic) => topic.id !== sourceId);
}

function syncThreadItems(state: CollaborationState, threadId: string): void {
	const thread = state.threads.find((candidate) => candidate.id === threadId);
	if (!thread) return;
	thread.topicLinks = normalizeTopicLinks(thread.topicLinks);
	for (const item of state.items)
		if (item.threadId === threadId)
			item.topicIds = thread.topicLinks.map((link) => link.topicId);
}

/** Only explicitly associated steps participate in Work-item status changes. */
function syncItemSteps(state: CollaborationState, item: WorkItem): void {
	for (const workspace of Object.values(state.workspaces)) {
		for (const step of workspace.steps) {
			if (step.itemId !== item.id) continue;
			if (item.status === "done") step.status = "done";
			else if (item.status === "waiting") step.status = "waiting";
			else if (item.status === "open")
				step.status = item.suggested ? "suggested" : "open";
		}
	}
}

/** Apply a single local intent atomically. The caller supplies time for deterministic tests. */
export function collaborationReducer(
	previous: CollaborationState,
	command: CollaborationCommand,
	now: string,
): CollaborationState {
	const state = structuredClone(previous);
	switch (command.type) {
		case "topic.save": {
			const topic = state.topics.find(
				(candidate) => candidate.id === command.topic.id,
			);
			if (topic) {
				const {
					goals: _goals,
					notes: _notes,
					people: _people,
					...patch
				} = command.topic;
				Object.assign(topic, patch, {
					id: topic.id,
					isSample: topic.isSample,
				});
			} else if (command.topic.name?.trim())
				state.topics.push(newTopic(state, command.topic, now));
			break;
		}
		case "topic.merge":
			mergeTopics(state, command.sourceId, command.targetId);
			break;
		case "topic.person": {
			const topic = state.topics.find(
				(candidate) => candidate.id === command.topicId,
			);
			const person = state.people.find(
				(candidate) => candidate.id === command.personId,
			);
			if (!topic || !person || topic.isSample !== person.isSample) break;
			const membership = topic.people.find(
				(candidate) => candidate.personId === person.id,
			);
			if (membership) {
				const origin =
					membership.state === "suggested" &&
					command.state === "member"
						? membership.origin
						: "you";
				Object.assign(membership, {
					state: command.state,
					origin,
					role: command.role ?? membership.role,
				});
			} else
				topic.people.push({
					personId: person.id,
					role: command.role ?? person.title,
					engagement: null,
					state: command.state,
					origin: "you",
				});
			break;
		}
		case "topic.note": {
			const topic = state.topics.find(
				(candidate) => candidate.id === command.topicId,
			);
			if (!topic) break;
			if (command.operation === "remove") {
				topic.notes = topic.notes.filter(
					(note) => note.noteId !== command.noteId,
				);
				topic.goals = topic.goals.filter(
					(goal) => goal.noteId !== command.noteId,
				);
				break;
			}
			const existing =
				command.kind === "goal"
					? topic.goals.find((goal) => goal.noteId === command.noteId)
					: topic.notes.find(
							(note) => note.noteId === command.noteId,
						);
			const text = (command.text ?? existing?.text)?.trim();
			if (!text) break;
			const noteId = command.noteId ?? `local-note-${state.sequence++}`;
			if (command.kind === "goal") {
				const goal = {
					noteId,
					text,
					status:
						(command.status ?? existing?.status) === "done"
							? ("done" as const)
							: ("open" as const),
				};
				topic.goals = existing
					? topic.goals.map((item) =>
							item.noteId === noteId ? goal : item,
						)
					: [...topic.goals, goal];
			} else {
				const existingNote = topic.notes.find(
					(note) => note.noteId === noteId,
				);
				const note = {
					...existingNote,
					noteId,
					kind: "note" as const,
					text,
					status:
						(command.status ?? existing?.status) === "draft"
							? ("draft" as const)
							: ("confirmed" as const),
					by:
						command.text === undefined && existingNote
							? existingNote.by
							: ("you" as const),
					date: now,
				};
				topic.notes = existing
					? topic.notes.map((item) =>
							item.noteId === noteId ? note : item,
						)
					: [...topic.notes, note];
			}
			break;
		}
		case "thread.link": {
			const thread = state.threads.find(
				(candidate) => candidate.id === command.threadId,
			);
			const topic = state.topics.find(
				(candidate) => candidate.id === command.topicId,
			);
			if (!thread || !topic || thread.isSample !== topic.isSample) break;
			const existing = thread.topicLinks.find(
				(link) => link.topicId === topic.id,
			);
			if (command.operation === "remove")
				thread.topicLinks = thread.topicLinks.filter(
					(link) => link.topicId !== topic.id,
				);
			else {
				if (!existing)
					thread.topicLinks.push({
						topicId: topic.id,
						source: "you",
						confidence: 100,
						primary: !thread.topicLinks.length,
					});
				else if (
					command.operation === "confirm" ||
					command.operation === "add"
				)
					existing.source = "confirmed";
				if (command.operation === "primary")
					thread.topicLinks = thread.topicLinks.map((link) => ({
						...link,
						primary: link.topicId === topic.id,
					}));
			}
			thread.needsTopicChoice = thread.topicLinks.some(
				(link) => link.source === "suggested",
			);
			syncThreadItems(state, thread.id);
			break;
		}
		case "thread.participant": {
			const thread = state.threads.find(
				(candidate) => candidate.id === command.threadId,
			);
			const participant = thread?.participants.find(
				(candidate) => candidate.personId === command.personId,
			);
			if (!participant) break;
			participant.included = command.included;
			if (command.included) {
				delete participant.excludedBy;
				delete participant.excludedOn;
			} else {
				participant.excludedBy = "you";
				participant.excludedOn = now;
			}
			break;
		}
		case "thread.mute": {
			const thread = state.threads.find(
				(candidate) => candidate.id === command.threadId,
			);
			if (thread) thread.muted = command.muted;
			break;
		}
		case "thread.goal": {
			if (!state.threads.some((thread) => thread.id === command.threadId))
				break;
			state.workspaces[command.threadId] ??= createEmptyWorkspace();
			state.workspaces[command.threadId].goal = command.goal;
			break;
		}
		case "person.save": {
			const person = state.people.find(
				(candidate) => candidate.id === command.personId,
			);
			if (person) Object.assign(person, command.changes);
			break;
		}
		case "item.update": {
			const item = state.items.find(
				(candidate) => candidate.id === command.itemId,
			);
			if (!item) break;
			if (command.changes.status === "snoozed") {
				item.snoozedFrom =
					item.status === "waiting" ? "waiting" : "open";
				item.snoozeUntil =
					command.changes.snoozeUntil ??
					tomorrowAtEight(
						now,
						item.isSample
							? state.profile.timezone
							: (state.liveProfile?.timezone ??
									Intl.DateTimeFormat().resolvedOptions()
										.timeZone),
					);
			}
			Object.assign(item, command.changes);
			if (item.status === "done") item.completedAt = now;
			else delete item.completedAt;
			if (item.status !== "snoozed") {
				delete item.snoozeUntil;
				delete item.snoozedFrom;
			}
			syncItemSteps(state, item);
			break;
		}
		case "item.create": {
			const thread = state.threads.find(
				(candidate) => candidate.id === command.threadId,
			);
			if (!thread || !command.text.trim()) break;
			const item: WorkItem = {
				id: `local-item-${state.sequence++}`,
				threadId: thread.id,
				channel: "task",
				actorId:
					command.ownerId ??
					(thread.isSample ? "me" : (state.liveProfile?.id ?? "you")),
				title: command.text.trim(),
				askType: "errand",
				priority: "P2",
				score: null,
				reasons: ["Added by you"],
				due: null,
				received: now,
				status: "open",
				topicIds: thread.topicLinks.map((link) => link.topicId),
				isSample: thread.isSample,
			};
			state.items.push(item);
			state.workspaces[thread.id] ??= createEmptyWorkspace();
			state.workspaces[thread.id].steps.push({
				id: `local-step-${state.sequence++}`,
				text: item.title,
				ownerId: item.actorId,
				due: null,
				status: "open",
				kind: "task",
				itemId: item.id,
			});
			break;
		}
		case "review.resolve": {
			const review = state.reviews.find(
				(candidate) => candidate.id === command.reviewId,
			);
			if (!review || review.status !== "open") break;
			if (command.decision === "dismiss") {
				review.status = "dismissed";
				review.resolvedAt = now;
				break;
			}
			if (review.kind === "new_topic") {
				if (!review.refId || !review.candidate) break;
				if (
					command.decision === "merge" &&
					!state.topics.some(
						(topic) =>
							topic.id === command.targetTopicId &&
							topic.isSample,
					)
				)
					break;
				if (!state.topics.some((topic) => topic.id === review.refId))
					state.topics.push(
						newTopic(
							state,
							{
								id: review.refId,
								name: review.candidate.name,
								accountId: review.candidate.accountId,
								kind:
									review.candidate.accountId === "deloitte"
										? "internal"
										: "client",
								isSample: true,
							},
							now,
						),
					);
				if (command.decision === "merge" && command.targetTopicId)
					mergeTopics(state, review.refId, command.targetTopicId);
			} else if (review.kind === "topic_choice") {
				const thread = state.threads.find(
					(candidate) => candidate.id === review.refId,
				);
				if (!thread) break;
				if (command.decision === "both")
					thread.topicLinks = thread.topicLinks.map((link) => ({
						...link,
						source: "confirmed",
					}));
				else {
					const topicId = command.targetTopicId;
					if (
						!topicId ||
						!thread.topicLinks.some(
							(link) => link.topicId === topicId,
						)
					)
						break;
					thread.topicLinks = thread.topicLinks
						.filter(
							(link) =>
								link.source !== "suggested" ||
								link.topicId === topicId,
						)
						.map((link) => ({
							...link,
							source:
								link.topicId === topicId
									? "confirmed"
									: link.source,
						}));
				}
				thread.needsTopicChoice = false;
				syncThreadItems(state, thread.id);
			} else if (review.kind === "add_person") {
				const topic = state.topics.find(
					(candidate) =>
						candidate.id ===
						(command.targetTopicId ?? review.topicId),
				);
				const membership = topic?.people.find(
					(member) => member.personId === review.refId,
				);
				if (!membership) break;
				membership.state = "member";
			}
			review.status = "accepted";
			review.resolvedAt = now;
			break;
		}
		case "profile.save": {
			if (command.changes.vips) {
				for (const person of state.people) {
					if (person.isSample === (command.target !== "live"))
						person.vip = command.changes.vips.includes(person.id);
				}
			}
			if (command.target === "live") {
				if (state.liveProfile)
					Object.assign(state.liveProfile, command.changes);
			} else Object.assign(state.profile, command.changes);
			break;
		}
		case "settings.save": {
			const fileAt = Math.min(
				99,
				Math.max(
					60,
					Math.round(command.changes.fileAt ?? state.settings.fileAt),
				),
			);
			state.settings = {
				...state.settings,
				...command.changes,
				fileAt,
				askAt: Math.min(
					fileAt - 5,
					Math.max(
						10,
						Math.round(
							command.changes.askAt ?? state.settings.askAt,
						),
					),
				),
				version: state.settings.version + 1,
			};
			break;
		}
		case "rule.add": {
			if (!command.rule.value.trim()) break;
			state.rules.push({
				...command.rule,
				value: command.rule.value.trim(),
				id: `local-rule-${state.sequence++}`,
				createdBy: "you",
				createdAt: now,
				isSample: command.rule.isSample ?? false,
			});
			break;
		}
		case "rule.remove": {
			const rule = state.rules.find(
				(candidate) => candidate.id === command.ruleId,
			);
			if (rule) rule.disabledAt = now;
			break;
		}
		case "workspace.step": {
			if (!state.threads.some((thread) => thread.id === command.threadId))
				break;
			state.workspaces[command.threadId] ??= createEmptyWorkspace();
			const workspace = state.workspaces[command.threadId];
			const existing = workspace.steps.find(
				(step) => step.id === command.step.id,
			);
			if (command.operation === "remove")
				workspace.steps = workspace.steps.filter(
					(step) => step.id !== command.step.id,
				);
			else if (existing) Object.assign(existing, command.step);
			else if (command.step.text?.trim())
				workspace.steps.push({
					...command.step,
					id: command.step.id ?? `local-step-${state.sequence++}`,
					text: command.step.text.trim(),
					ownerId: command.step.ownerId ?? "me",
					due: command.step.due ?? null,
					status: command.step.status ?? "open",
					kind: command.step.kind ?? "task",
				});
			const step = workspace.steps.find(
				(candidate) => candidate.id === command.step.id,
			);
			const item = step?.itemId
				? state.items.find((candidate) => candidate.id === step.itemId)
				: null;
			if (step && item && command.operation === "save") {
				if (step.status === "done") {
					item.status = "done";
					item.completedAt = now;
				} else if (step.status === "waiting") {
					item.status = "waiting";
					delete item.completedAt;
				} else {
					item.status = "open";
					item.suggested = step.status === "suggested";
					delete item.completedAt;
				}
				syncItemSteps(state, item);
			}
			break;
		}
		case "workspace.fact": {
			if (!state.threads.some((thread) => thread.id === command.threadId))
				break;
			state.workspaces[command.threadId] ??= createEmptyWorkspace();
			const workspace = state.workspaces[command.threadId];
			const existing = workspace.facts.find(
				(fact) => fact.id === command.fact.id,
			);
			if (command.operation === "remove")
				workspace.facts = workspace.facts.filter(
					(fact) => fact.id !== command.fact.id,
				);
			else if (existing) Object.assign(existing, command.fact);
			else if (command.fact.text?.trim())
				workspace.facts.push({
					...command.fact,
					id: command.fact.id ?? `local-fact-${state.sequence++}`,
					text: command.fact.text.trim(),
					from: command.fact.from ?? "Added by you",
					status: command.fact.status ?? "confirmed",
				});
			break;
		}
		case "workspace.open": {
			if (!state.threads.some((thread) => thread.id === command.threadId))
				break;
			state.workspaces[command.threadId] ??= createEmptyWorkspace();
			if (!state.openThreadIds.includes(command.threadId))
				state.openThreadIds.push(command.threadId);
			break;
		}
		case "workspace.close":
			state.openThreadIds = state.openThreadIds.filter(
				(id) => id !== command.threadId,
			);
			break;
		case "source.import": {
			if (
				command.thread.isSample ||
				!command.thread.source ||
				command.people.some((person) => person.isSample)
			)
				break;
			const existing = state.threads.find(
				(thread) =>
					!thread.isSample &&
					thread.source?.kind === command.thread.source?.kind &&
					thread.source?.nativeId === command.thread.source?.nativeId,
			);
			const id = existing?.id ?? command.thread.id;
			if (!existing && state.threads.some((thread) => thread.id === id))
				break;
			for (const person of command.people) {
				const current = state.people.find(
					(candidate) => candidate.id === person.id,
				);
				if (!current) state.people.push(person);
				else if (!current.isSample)
					Object.assign(current, person, {
						relationship: current.relationship,
						neverIngest: current.neverIngest,
						vip: current.vip,
						topics: current.topics,
					});
			}
			if (existing) {
				const participants = command.thread.participants.map(
					(participant) => {
						const current = existing.participants.find(
							(candidate) =>
								candidate.personId === participant.personId,
						);
						return current
							? {
									...participant,
									included: current.included,
									excludedBy: current.excludedBy,
									excludedOn: current.excludedOn,
								}
							: participant;
					},
				);
				Object.assign(existing, command.thread, {
					id,
					topicLinks: existing.topicLinks,
					muted: existing.muted,
					roomId: existing.roomId,
					participants,
				});
			} else if (!state.threads.some((thread) => thread.id === id))
				state.threads.push(command.thread);
			else break;
			const workspace = state.workspaces[id] ?? createEmptyWorkspace();
			state.workspaces[id] = {
				...workspace,
				...command.workspace,
				goal: workspace.goal || command.workspace?.goal || "",
				facts: workspace.facts,
				steps: workspace.steps,
				drafts: workspace.drafts,
			};
			if (
				command.item &&
				!state.items.some((item) => item.threadId === id)
			)
				state.items.push({
					...command.item,
					threadId: id,
					isSample: false,
				});
			break;
		}
		case "source.status":
			state.sources = [
				...state.sources.filter(
					(source) =>
						source.id !== command.source.id ||
						source.isSample !== command.source.isSample,
				),
				command.source,
			];
			break;
		case "live-profile.set":
			state.liveProfile = command.profile;
			break;
		case "snooze.expire": {
			for (const item of state.items) {
				if (
					item.status !== "snoozed" ||
					!item.snoozeUntil ||
					item.snoozeUntil > now
				)
					continue;
				item.status = item.snoozedFrom ?? "open";
				delete item.snoozeUntil;
				delete item.snoozedFrom;
				syncItemSteps(state, item);
			}
			break;
		}
	}
	return reconcileCollaborationState(state);
}

export interface CollaborationHistory {
	state: CollaborationState;
	past: CollaborationState[];
}

export type HistoryAction =
	| { command: CollaborationCommand; now: string }
	| { type: "undo" };

const UNRECORDED_COMMANDS = new Set<CollaborationCommand["type"]>([
	"source.import",
	"source.status",
	"live-profile.set",
	"workspace.open",
	"workspace.close",
	"snooze.expire",
]);

/** External imports survive local undo by also updating historical session snapshots. */
export function collaborationHistoryReducer(
	history: CollaborationHistory,
	action: HistoryAction,
): CollaborationHistory {
	if ("type" in action) {
		const previous = history.past.at(-1);
		return previous
			? { state: previous, past: history.past.slice(0, -1) }
			: history;
	}
	const state = collaborationReducer(
		history.state,
		action.command,
		action.now,
	);
	if (JSON.stringify(state) === JSON.stringify(history.state)) return history;
	if (UNRECORDED_COMMANDS.has(action.command.type))
		return {
			state,
			past: history.past.map((previous) =>
				collaborationReducer(previous, action.command, action.now),
			),
		};
	return { state, past: [...history.past.slice(-49), history.state] };
}
