import type {
	CollaborationState,
	Person,
	Rule,
	Thread,
	ThreadContext,
	WorkItem,
} from "./collaboration.types";

/** Work filters never mix sample and connected items implicitly. */
export function selectWorkItems(
	state: CollaborationState,
	options: {
		view?: "needs_me" | "waiting" | "done_today" | "suggested";
		topicId?: string;
		channel?: string;
		isSample?: boolean;
		sort?: "top" | "latest";
		search?: string;
	} = {},
): { items: WorkItem[]; total: number } {
	const search = options.search?.trim().toLocaleLowerCase();
	const items = state.items
		.filter((item) => {
			const thread = state.threads.find(
				(candidate) => candidate.id === item.threadId,
			);
			if (thread?.muted) return false;
			if (
				options.isSample !== undefined &&
				item.isSample !== options.isSample
			)
				return false;
			if (options.topicId && !item.topicIds.includes(options.topicId))
				return false;
			if (options.channel && item.channel !== options.channel)
				return false;
			if (
				search &&
				!`${item.title} ${thread?.subject ?? ""}`
					.toLocaleLowerCase()
					.includes(search)
			)
				return false;
			if (options.view === "waiting") return item.status === "waiting";
			if (options.view === "done_today") return item.status === "done";
			if (options.view === "suggested")
				return item.status === "open" && item.suggested === true;
			return item.status === "open";
		})
		.sort((a, b) =>
			options.sort === "latest"
				? b.received.localeCompare(a.received)
				: (b.score ?? -1) - (a.score ?? -1) ||
					b.received.localeCompare(a.received),
		);
	return { items, total: items.length };
}

function personMatchesRule(
	person: Person | undefined,
	rule: Rule,
	thread: Thread,
): boolean {
	if (rule.personId && person?.id !== rule.personId) return false;
	if (rule.kind === "exclude_topic" || rule.kind === "exclude_channel")
		return Boolean(rule.personId) && threadMatchesRule(thread, rule);
	if (rule.kind === "exclude_everywhere" && rule.personId)
		return person?.id === rule.personId;
	if (rule.kind === "never_sender")
		return (
			person?.email?.toLocaleLowerCase() ===
			rule.value.toLocaleLowerCase()
		);
	if (rule.kind === "never_domain")
		return (
			person?.email?.split("@").at(-1)?.toLocaleLowerCase() ===
			rule.value.replace(/^@/, "").toLocaleLowerCase()
		);
	return (
		rule.kind === "exclude_everywhere" &&
		(person?.id === rule.value ||
			person?.email?.toLocaleLowerCase() ===
				rule.value.toLocaleLowerCase())
	);
}

function threadMatchesRule(thread: Thread, rule: Rule): boolean {
	if (rule.kind === "never_folder")
		return (
			thread.source?.folder?.toLocaleLowerCase() ===
			rule.value.toLocaleLowerCase()
		);
	if (rule.kind === "exclude_channel")
		return thread.channel === (rule.channel ?? rule.value);
	if (rule.kind === "exclude_topic")
		return thread.topicLinks.some(
			(link) => link.topicId === (rule.topicId ?? rule.value),
		);
	return false;
}

/** Strip recognizable quoted reply blocks to avoid reintroducing excluded senders. */
function removeQuotedReplies(text: string): string {
	const boundary = text.search(
		/(?:^|\n)(?:On .{1,240}wrote:|From:\s|[-_]{3,}\s*(?:Original Message|Forwarded message))/im,
	);
	const body = boundary >= 0 ? text.slice(0, boundary) : text;
	return body
		.split("\n")
		.filter((line) => !/^\s*>/.test(line))
		.join("\n")
		.trim();
}

/** Stable compact revision is for history freshness, not a cryptographic signature. */
function revisionOf(value: string): string {
	let first = 2166136261;
	let second = 5381;
	for (let index = 0; index < value.length; index += 1) {
		const character = value.charCodeAt(index);
		first = Math.imul(first ^ character, 16777619);
		second = Math.imul(second, 33) ^ character;
	}
	return `${value.length}-${(first >>> 0).toString(36)}-${(second >>> 0).toString(36)}`;
}

/** Exact assistant context uses allowed messages and owner-confirmed facts only. */
export function selectThreadContext(
	state: CollaborationState,
	threadId: string,
): ThreadContext | null {
	const thread = state.threads.find((candidate) => candidate.id === threadId);
	if (!thread) return null;
	const workspace = state.workspaces[threadId];
	const rules = state.rules.filter(
		(rule) =>
			!rule.disabledAt && Boolean(rule.isSample) === thread.isSample,
	);
	const isThreadExcluded = rules.some(
		(rule) => !rule.personId && threadMatchesRule(thread, rule),
	);
	const profile = thread.isSample ? state.profile : state.liveProfile;
	const participants = thread.participants.map((participant) => {
		const person = state.people.find(
			(candidate) =>
				candidate.id === participant.personId &&
				candidate.isSample === thread.isSample,
		);
		const isOwner = participant.personId === profile?.id;
		return {
			personId: participant.personId,
			name: isOwner
				? (profile?.name ?? "You")
				: (person?.name ?? "Unknown participant"),
			included:
				participant.included &&
				!isThreadExcluded &&
				!person?.neverIngest &&
				!rules.some((rule) => personMatchesRule(person, rule, thread)),
		};
	});
	const allowed = new Set(
		participants
			.filter((participant) => participant.included)
			.map((participant) => participant.personId),
	);
	const messages = (workspace?.messages ?? [])
		.filter(
			(message) =>
				allowed.has(message.fromId) &&
				!rules.some(
					(rule) =>
						rule.kind === "never_keyword" &&
						message.text
							.toLocaleLowerCase()
							.includes(rule.value.toLocaleLowerCase()),
				),
		)
		.map((message) => ({
			id: message.id,
			fromId: message.fromId,
			at: message.at,
			text: removeQuotedReplies(message.text),
			...(message.isTruncated ? { isTruncated: true } : {}),
		}))
		.filter((message) => message.text.length > 0);
	const topics = thread.topicLinks
		.filter((link) => link.source !== "suggested")
		.sort((a, b) => Number(b.primary) - Number(a.primary))
		.flatMap((link) => {
			const topic = state.topics.find(
				(candidate) =>
					candidate.id === link.topicId &&
					candidate.isSample === thread.isSample,
			);
			return topic
				? [
						{
							id: topic.id,
							name: topic.name,
							description: topic.description,
							goals: topic.goals,
							notes: topic.notes.filter(
								(note) => note.status === "confirmed",
							),
						},
					]
				: [];
		});
	const facts = (workspace?.facts ?? []).filter(
		(fact) =>
			!isThreadExcluded &&
			fact.status === "confirmed" &&
			(!fact.sourcePersonId || allowed.has(fact.sourcePersonId)),
	);
	const confirmedProfile = profile
		? {
				...profile,
				role:
					profile.role.source === "you"
						? profile.role
						: { value: "", source: "you" as const },
				style: profile.style.confirmed
					? profile.style
					: {
							summary: "",
							source: "you" as const,
							confirmed: false,
							examples: [],
						},
				vips: profile.vips.filter((id) => allowed.has(id)),
			}
		: null;
	const snapshot = {
		threadId,
		isSample: thread.isSample,
		goal: workspace?.goal ?? "",
		profile: confirmedProfile,
		topics,
		participants,
		messages,
		facts,
		hiddenCount: Math.max(
			0,
			(workspace?.messages.length ?? 0) - messages.length,
		),
	};
	return { ...snapshot, revision: revisionOf(JSON.stringify(snapshot)) };
}

/** Search the loaded session only; no source search is triggered by this selector. */
export function selectSearchResults(
	state: CollaborationState,
	query: string,
): {
	topics: CollaborationState["topics"];
	people: CollaborationState["people"];
	threads: CollaborationState["threads"];
} {
	const value = query.trim().toLocaleLowerCase();
	if (!value) return { topics: [], people: [], threads: [] };
	return {
		topics: state.topics.filter((topic) =>
			`${topic.name} ${topic.description}`
				.toLocaleLowerCase()
				.includes(value),
		),
		people: state.people.filter((person) =>
			`${person.name} ${person.email ?? ""}`
				.toLocaleLowerCase()
				.includes(value),
		),
		threads: state.threads.filter((thread) =>
			thread.subject.toLocaleLowerCase().includes(value),
		),
	};
}
