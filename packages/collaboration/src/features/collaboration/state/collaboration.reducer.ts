import type {
	CollaborationCommand,
	CollaborationState,
	Memory,
	Thread,
	ThreadTopicLink,
	ThreadWorkspace,
	Topic,
	WorkItem,
	WorkspaceStep,
} from "./collaboration.types";
import { dropTopicMemories, moveTopicMemories } from "./memory";

/** New workspaces contain no inferred source bodies or assistant history. */
export function createEmptyWorkspace(): ThreadWorkspace {
	return {
		goal: "",
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
function normalizeTopicLinks(links: ThreadTopicLink[]): ThreadTopicLink[] {
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
	state.memories = moveTopicMemories(state.memories, sourceId, targetId);
	state.topics = state.topics.filter((topic) => topic.id !== sourceId);
}

/** Mirrors BrainDeleteTopic: links, rules, and open reviews about the topic go with it. */
function deleteTopic(
	state: CollaborationState,
	topicId: string,
	now: string,
): void {
	if (!state.topics.some((topic) => topic.id === topicId)) return;
	for (const thread of state.threads) {
		if (!thread.topicLinks.some((link) => link.topicId === topicId))
			continue;
		// a thread that loses its primary gets its next most confident link
		thread.topicLinks = normalizeTopicLinks(
			thread.topicLinks.filter((link) => link.topicId !== topicId),
		);
	}
	for (const item of state.items)
		item.topicIds = item.topicIds.filter((id) => id !== topicId);
	state.rules = state.rules.filter((rule) => rule.topicId !== topicId);
	for (const review of state.reviews)
		if (review.refId === topicId && review.status === "open") {
			review.status = "dismissed";
			review.resolvedAt = now;
		}
	for (const workspace of Object.values(state.workspaces))
		for (const step of workspace.steps)
			if (step.linkTopicId === topicId) step.linkTopicId = undefined;
	state.memories = dropTopicMemories(state.memories, topicId);
	state.topics = state.topics.filter((topic) => topic.id !== topicId);
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

// a copy of the thread read before a newer summary landed must not bring the old one back
function isOlderSummary(incoming: Thread, current: Thread): boolean {
	return Boolean(
		current.summaryAt &&
			(!incoming.summaryAt || incoming.summaryAt < current.summaryAt),
	);
}

function summaryOf(thread: Thread): Partial<Thread> {
	return {
		summary: thread.summary,
		summaryAt: thread.summaryAt,
		summaryCurrent: thread.summaryCurrent,
		summaryPending: thread.summaryPending,
	};
}

/**
 * The server's steps for one thread over the local list; saves made before the read have landed. A step
 * changed or added here after the read went out (keep) stays as it is here. A generated step the server no
 * longer has was dropped by a later summary; other local-only steps are unsaved and stay.
 */
function mergeServerSteps(
	local: WorkspaceStep[],
	server: WorkspaceStep[],
	keep: ReadonlySet<string>,
): WorkspaceStep[] {
	const incoming = new Map(server.map((step) => [step.id, step]));
	const merged = local.flatMap((step) => {
		const next = incoming.get(step.id);
		incoming.delete(step.id);
		if (keep.has(step.id)) return [step];
		if (!next) return step.isGenerated ? [] : [step];
		return [{ ...next }];
	});
	return [...merged, ...[...incoming.values()].map((step) => ({ ...step }))];
}

/**
 * The server's memories over the local list. One changed here after the read went out (keep), a sample, or one
 * not saved yet stays as it is here; one the server no longer lists was deleted, dismissed, or replaced.
 */
function mergeServerMemories(
	local: Memory[],
	server: Memory[],
	keep: ReadonlySet<string>,
): Memory[] {
	const incoming = new Map(server.map((memory) => [memory.id, memory]));
	const merged = local.flatMap((memory) => {
		const next = incoming.get(memory.id);
		incoming.delete(memory.id);
		if (memory.isSample || keep.has(memory.id)) return [memory];
		if (!next) return memory.id.startsWith("local-") ? [memory] : [];
		return [{ ...next }];
	});
	return [
		...merged,
		...[...incoming.values()].map((memory) => ({ ...memory })),
	];
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
		case "topic.delete":
			deleteTopic(state, command.topicId, now);
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
				topic.goals = topic.goals.filter(
					(goal) => goal.noteId !== command.noteId,
				);
				break;
			}
			const existing = topic.goals.find(
				(goal) => goal.noteId === command.noteId,
			);
			const text = (command.text ?? existing?.text)?.trim();
			if (!text) break;
			const noteId = command.noteId ?? `local-note-${state.sequence++}`;
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
			// a new status without a reason drops the old one; the server sets its own
			if (command.changes.status && !command.changes.closedReason)
				delete item.closedReason;
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
									state.accounts.find(
										(account) =>
											account.id ===
											review.candidate.accountId,
									)?.kind === "internal"
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
		case "thread.insights": {
			const thread = state.threads.find(
				(item) => item.id === command.threadId,
			);
			if (
				!thread ||
				isOlderSummary(
					{ ...thread, summaryAt: command.summaryAt },
					thread,
				)
			)
				break;
			thread.summary = command.summary;
			thread.summaryAt = command.summaryAt;
			thread.summaryCurrent = command.summaryCurrent;
			delete thread.summaryPending;
			state.workspaces[command.threadId] ??= createEmptyWorkspace();
			const workspace = state.workspaces[command.threadId];
			workspace.steps = mergeServerSteps(
				workspace.steps,
				command.steps,
				new Set(command.keepStepIds),
			);
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
			else if (existing)
				Object.assign(existing, command.step, { isUserEdited: true });
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
		case "memory.save": {
			const patch = command.memory;
			const existing = patch.id
				? state.memories.find((memory) => memory.id === patch.id)
				: undefined;
			if (existing) {
				const text = (patch.text ?? existing.text).trim();
				if (!text || existing.state === "dismissed") break;
				// editing a suggestion accepts it, and it takes the place of the memory it replaces
				if (existing.state === "suggested" && existing.replacesId)
					state.memories = state.memories.filter(
						(memory) => memory.id !== existing.replacesId,
					);
				Object.assign(existing, {
					...(patch.kind ? { kind: patch.kind } : {}),
					...(patch.about ? { about: patch.about } : {}),
					...(patch.pinned !== undefined
						? { pinned: patch.pinned }
						: {}),
					...(patch.expiresAt !== undefined
						? { expiresAt: patch.expiresAt }
						: {}),
					text,
					state: "active",
					confirmed: true,
					updatedAt: now,
				});
				break;
			}
			const text = patch.text?.trim();
			if (!text) break;
			state.memories.push({
				id: patch.id ?? `local-memory-${state.sequence++}`,
				kind: patch.kind ?? "fact",
				text,
				state: "active",
				origin: "you",
				confirmed: true,
				pinned: patch.pinned ?? false,
				about: patch.about ?? [],
				expiresAt: patch.expiresAt ?? null,
				replacesId: null,
				source: { kind: "ui" },
				createdAt: now,
				updatedAt: now,
				isSample: patch.isSample ?? false,
			});
			break;
		}
		case "memory.delete":
			state.memories = state.memories.filter(
				(memory) => memory.id !== command.memoryId,
			);
			break;
		case "memory.clear":
			state.memories = state.memories.filter((memory) => memory.isSample);
			break;
		case "memory.resolve": {
			const memory = state.memories.find(
				(candidate) => candidate.id === command.memoryId,
			);
			if (!memory) break;
			const before = memory.state;
			if (command.action === "accept" && before === "suggested") {
				memory.state = "active";
				memory.confirmed = true;
				if (memory.replacesId)
					state.memories = state.memories.filter(
						(candidate) => candidate.id !== memory.replacesId,
					);
			} else if (command.action === "confirm" && before === "active")
				memory.confirmed = true;
			else if (
				command.action === "dismiss" &&
				(before === "suggested" ||
					(before === "active" &&
						!memory.confirmed &&
						memory.origin !== "you"))
			)
				memory.state = "dismissed";
			else if (command.action === "restore" && before === "dismissed")
				memory.state = "active";
			else if (command.action === "reopen" && before === "dismissed")
				memory.state = "suggested";
			else break;
			memory.updatedAt = now;
			break;
		}
		case "memory.server": {
			// a dismissed copy has left the lists on the server
			const removed = new Set([
				...(command.removedIds ?? []),
				...(command.memories ?? [])
					.filter((memory) => memory.state === "dismissed")
					.map((memory) => memory.id),
			]);
			state.memories = state.memories.filter(
				(memory) => !removed.has(memory.id),
			);
			for (const incoming of command.memories ?? []) {
				if (incoming.state === "dismissed") continue;
				const index = state.memories.findIndex(
					(memory) => memory.id === incoming.id,
				);
				if (index >= 0) state.memories[index] = { ...incoming };
				else state.memories.push({ ...incoming });
			}
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
		case "session.create": {
			if (state.threads.some((thread) => thread.id === command.sessionId))
				break;
			state.threads.push({
				id: command.sessionId,
				channel: "room",
				subject: "New session",
				topicLinks: [],
				participants: [],
				muted: false,
				messageCount: 0,
				lastAt: now,
				roomId: null,
				summary: "",
				isSample: false,
			});
			state.workspaces[command.sessionId] = createEmptyWorkspace();
			state.openThreadIds.push(command.sessionId);
			break;
		}
		case "source.deleted": {
			state.deletedSourceIds = [
				...new Set([
					...(state.deletedSourceIds ?? []),
					command.sourceId,
				]),
			];
			for (const thread of state.threads) {
				const workspace = state.workspaces[thread.id];
				if (!workspace) continue;
				const removed = workspace.messages.some(
					(message) => message.id === command.sourceId,
				);
				workspace.messages = workspace.messages.filter(
					(message) => message.id !== command.sourceId,
				);
				if (removed || thread.source?.nativeId === command.sourceId)
					thread.messageCount = Math.max(0, thread.messageCount - 1);
				if (thread.source?.nativeId === command.sourceId) {
					const replacement = workspace.messages.at(-1);
					thread.source = replacement
						? {
								...thread.source,
								nativeId: replacement.id,
								webLink: replacement.webLink,
							}
						: undefined;
				}
			}
			break;
		}
		case "source.import": {
			if (
				command.thread.isSample ||
				!command.thread.source ||
				state.deletedSourceIds?.includes(
					command.thread.source.nativeId,
				) ||
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
					...(isOlderSummary(command.thread, existing)
						? summaryOf(existing)
						: {}),
					participants,
				});
			} else if (!state.threads.some((thread) => thread.id === id))
				state.threads.push(command.thread);
			else break;
			const workspace = state.workspaces[id] ?? createEmptyWorkspace();
			state.workspaces[id] = {
				...workspace,
				...command.workspace,
				messages: (
					command.workspace?.messages ?? workspace.messages
				).filter(
					(message) => !state.deletedSourceIds?.includes(message.id),
				),
				goal: workspace.goal || command.workspace?.goal || "",
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
		case "live.refresh": {
			const keepThreads = new Set(command.updates.keepThreadIds);
			const keepSteps = new Set(command.updates.keepStepIds);
			for (const incoming of command.updates.threads) {
				const thread = state.threads.find(
					(item) => item.id === incoming.id,
				);
				if (!thread) {
					state.threads.push(incoming);
					state.workspaces[incoming.id] =
						command.updates.workspaces[incoming.id] ??
						createEmptyWorkspace();
					continue;
				}
				thread.messageCount = incoming.messageCount;
				thread.lastAt = incoming.lastAt;
				// what Brain decided on the server (filing, Ignore, automated) shows without a reload
				if (!keepThreads.has(thread.id)) {
					thread.topicLinks = incoming.topicLinks;
					thread.muted = incoming.muted;
					thread.automated = incoming.automated;
				}
				// Brain writes summaries in the background, so a new one shows without opening the thread
				if (!isOlderSummary(incoming, thread))
					Object.assign(thread, summaryOf(incoming));
				const workspace = state.workspaces[thread.id];
				// a thread missing from the workspace list has no steps left on the server
				if (workspace)
					workspace.steps = mergeServerSteps(
						workspace.steps,
						command.updates.workspaces[thread.id]?.steps ?? [],
						keepSteps,
					);
			}
			// server state wins for items already shown (closed by a reply, updated by a new message), except
			// the ones edited locally while the read was in flight
			const keepItems = new Set(command.updates.keepItemIds);
			const incomingItems = new Map(
				command.updates.items.map((item) => [item.id, item]),
			);
			state.items = state.items.map((item) => {
				const next = incomingItems.get(item.id);
				if (!next || keepItems.has(item.id)) return item;
				const updated = { ...item, ...next };
				syncItemSteps(state, updated);
				return updated;
			});
			const ids = new Set(state.items.map((item) => item.id));
			state.items.push(
				...command.updates.items.filter((item) => !ids.has(item.id)),
			);
			if (command.updates.memories)
				state.memories = mergeServerMemories(
					state.memories,
					command.updates.memories,
					new Set(command.updates.keepMemoryIds),
				);
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
			// a profile loaded from the server (its own id) outranks the signed-in placeholder
			if (
				!command.profile ||
				!state.liveProfile ||
				state.liveProfile.id === command.profile.id
			)
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
	const next = reconcileCollaborationState(state);
	return JSON.stringify(next) === JSON.stringify(previous) ? previous : next;
}
