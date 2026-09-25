import type { InsightActions } from "@/lib/pixel";
import { PixelError, pixel } from "@/lib/pixel";
import type {
	Account,
	CollaborationCommand,
	CollaborationState,
	Person,
	Profile,
	ReviewEntry,
	Rule,
	Settings,
	SourceStatus,
	Thread,
	Topic,
	WorkItem,
	WorkspaceMessage,
} from "../state/collaboration.types";

// Live data: Brain and Work state loaded from the Collaboration reactors instead of the sample fixtures.
// Every record loads as connected (isSample false).

const LIVE_KEY = "collaboration.data";

/** Live when the build says so or this browser opted in (localStorage collaboration.data = live). */
export function isLiveData(): boolean {
	const stored =
		typeof window === "undefined"
			? null
			: window.localStorage.getItem(LIVE_KEY);
	if (stored === "live" || stored === "sample") return stored === "live";
	return import.meta.env.VITE_COLLABORATION_DATA === "live";
}

export function setLiveData(live: boolean) {
	window.localStorage.setItem(LIVE_KEY, live ? "live" : "sample");
}

/** Run several statements in one request; throws on the first reactor error. */
export async function runBatch(
	actions: InsightActions,
	statements: string[],
): Promise<unknown[]> {
	if (!statements.length) return [];
	const joined = statements.join(" ");
	const response = await actions.run<unknown[]>(joined);
	const entries = response?.pixelReturn ?? [];
	if (entries.length !== statements.length)
		throw new PixelError(
			`Expected ${statements.length} results, got ${entries.length}`,
			joined,
		);
	return entries.map((entry, index) => {
		if (entry.operationType?.includes("ERROR"))
			throw new PixelError(String(entry.output), statements[index]);
		return entry.output;
	});
}

type Row = Record<string, unknown>;
type Page = { items: Row[]; total: number };

const str = (value: unknown, fallback = ""): string =>
	typeof value === "string" ? value : fallback;
const opt = (value: unknown): string | undefined =>
	typeof value === "string" ? value : undefined;
const list = <T = unknown>(value: unknown): T[] =>
	Array.isArray(value) ? (value as T[]) : [];

function initials(name: string): string {
	return (
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join("") || "?"
	);
}

function mapProfile(row: Row, selfId: string | undefined): Profile {
	const role = (row.role ?? {}) as Row;
	const style = (row.style ?? {}) as Row;
	const name = str(row.name, "You");
	const hours = row.workingHours as Row | string | undefined;
	return {
		id: selfId ?? "me",
		name,
		initials: initials(name),
		email: str(row.email),
		org: str(row.org),
		role: {
			value: str(role.value),
			source: role.source === "you" ? "you" : "learned",
			note: opt(role.note),
		},
		timezone: str(
			row.timezone,
			Intl.DateTimeFormat().resolvedOptions().timeZone,
		),
		workingHours:
			typeof hours === "string"
				? hours
				: hours
					? `${str(hours.start)} - ${str(hours.end)}`
					: "",
		vips: list<string>(row.vips),
		style: {
			summary: str(style.summary),
			source: style.source === "you" ? "you" : "learned",
			confirmed: style.confirmed === true,
			examples: list<string>(style.examples),
		},
	};
}

function mapSettings(row: Row): Settings {
	return {
		classifierEngineId: str(row.classifierEngineId),
		fileAt: Number(row.fileAt ?? 85),
		askAt: Number(row.askAt ?? 40),
		sourcesJson: (row.sourcesJson ?? {}) as Record<string, boolean>,
		version: Number(row.version ?? 0),
	};
}

// no source-connection reactor yet (SRC-06): show what settings turns on
function mapSources(settings: Settings): SourceStatus[] {
	const labels: [string, string, string][] = [
		["email", "Outlook mail", "E"],
		["calendar", "Outlook calendar", "C"],
		["teams", "Teams chats", "T"],
	];
	return labels.map(([id, label, mark]) => ({
		id,
		label,
		mark,
		status: settings.sourcesJson[id] ? "connected" : "off",
		lastSync: null,
		scope: "",
		volume: null,
		permission: "",
		isSample: false,
	}));
}

function mapTopic(row: Row): Topic {
	const stats = (row.stats ?? {}) as Row;
	return {
		id: str(row.id),
		name: str(row.name),
		short: str(row.short, str(row.name)),
		accountId: opt(row.accountId) ?? null,
		kind: (row.kind as Topic["kind"]) ?? "internal",
		color: str(row.color, "#8a9099"),
		status: (row.status as Topic["status"]) ?? "active",
		description: str(row.description),
		keywords: list<string>(row.keywords),
		goals: list(row.goals),
		notes: list(row.notes),
		people: list<Row>(row.people).map((person) => ({
			personId: str(person.personId),
			role: str(person.role),
			engagement:
				typeof person.engagement === "number"
					? person.engagement
					: null,
			state:
				(person.state as Topic["people"][number]["state"]) ?? "member",
			origin:
				(person.origin as Topic["people"][number]["origin"]) ?? "brain",
			reason: opt(person.reason),
		})),
		calendarSeries: list<string>(row.calendarSeries),
		stats: {
			threads: Number(stats.threads ?? 0),
			openItems: Number(stats.openItems ?? 0),
			lastActivity: str(stats.lastActivity),
		},
		isSample: false,
	};
}

function mapPerson(row: Row): Person {
	const channels = (row.channels ?? {}) as Row;
	const name = str(row.name, str(row.email, "Unknown"));
	return {
		id: str(row.id),
		name,
		initials: str(row.initials, initials(name)),
		email: opt(row.email) ?? null,
		accountId: opt(row.accountId) ?? null,
		title: str(row.title),
		relationship: str(row.relationship),
		color: str(row.color, "#8a9099"),
		vip: row.vip === true,
		neverIngest: row.neverIngest === true,
		strength: typeof row.strength === "number" ? row.strength : null,
		lastContact: opt(row.lastContact) ?? null,
		channels: {
			email: Number(channels.email ?? 0),
			teams: Number(channels.teams ?? 0),
			meetings: Number(channels.meetings ?? 0),
		},
		topics: list<string>(row.topics),
		automated: row.automated === true ? true : undefined,
		isSample: false,
	};
}

const SOURCE_KINDS: Record<string, NonNullable<Thread["source"]>["kind"]> = {
	email: "outlook",
	teams: "teams",
	calendar: "calendar",
};

function mapThread(row: Row): Thread {
	const channel = (row.channel as Thread["channel"]) ?? "email";
	return {
		id: str(row.id),
		channel,
		// the thread view replies to source.nativeId; source also lets loaded messages attach to the thread
		source: {
			kind: SOURCE_KINDS[channel] ?? "outlook",
			nativeId: str(row.latestMessageId, str(row.id)),
		},
		subject: str(row.subject, "(no subject)"),
		topicLinks: list<Row>(row.topicLinks).map((link) => ({
			topicId: str(link.topicId),
			source:
				(link.source as Thread["topicLinks"][number]["source"]) ??
				"suggested",
			confidence:
				typeof link.confidence === "number" ? link.confidence : null,
			primary: link.primary === true,
		})),
		participants: list<Row>(row.participants).map((participant) => ({
			personId: str(participant.personId),
			role: str(participant.role),
			included: participant.included !== false,
			excludedBy:
				participant.excludedBy === "rule"
					? "rule"
					: participant.excludedBy
						? "you"
						: undefined,
			excludedOn: opt(participant.excludedOn),
			hiddenCount:
				typeof participant.hiddenCount === "number"
					? participant.hiddenCount
					: undefined,
		})),
		muted: row.muted === true,
		automated: row.automated === true ? true : undefined,
		messageCount: Number(row.messageCount ?? 0),
		lastAt: str(row.lastAt),
		roomId: opt(row.roomId) ?? null,
		summary: str(row.summary),
		needsTopicChoice: row.needsTopicChoice === true ? true : undefined,
		isSample: false,
	};
}

function mapItem(row: Row): WorkItem {
	return {
		id: str(row.id),
		threadId: str(row.threadId),
		channel: (row.channel as WorkItem["channel"]) ?? "email",
		actorId: str(row.actorId, str(row.origin, "brain")),
		title: str(row.title),
		askType: (row.askType as WorkItem["askType"]) ?? "reply",
		priority: (opt(row.priority) as WorkItem["priority"]) ?? null,
		score: typeof row.score === "number" ? row.score : null,
		reasons: list<string>(row.reasons),
		due: opt(row.due) ?? null,
		received: str(row.received),
		status: (row.status as WorkItem["status"]) ?? "open",
		topicIds: list<string>(row.topicIds),
		suggested: row.suggested === true ? true : undefined,
		completedAt: row.status === "done" ? opt(row.closedAt) : undefined,
		snoozeUntil: opt(row.snoozeUntil),
		isSample: false,
	};
}

// the UI keys a new-topic review on the candidate topic and an add-person review on its topic
function mapReview(row: Row, topics: Topic[]): ReviewEntry {
	const data = (row.data ?? {}) as Row;
	const kind = row.kind as ReviewEntry["kind"];
	const candidateId = opt(data.candidate);
	const candidate = topics.find((topic) => topic.id === candidateId);
	return {
		id: str(row.id),
		kind,
		text: str(row.text),
		detail: str(row.detail),
		refId:
			kind === "new_topic"
				? (candidateId ?? null)
				: (opt(row.refId) ?? null),
		status: (row.status as ReviewEntry["status"]) ?? "open",
		actions: list<string>(row.actions),
		resolvedAt: opt(row.resolvedAt),
		topicId: kind === "add_person" ? opt(data.suggestedTopic) : undefined,
		candidate:
			kind === "new_topic"
				? {
						name: candidate?.name ?? str(row.text),
						accountId: candidate?.accountId ?? null,
					}
				: undefined,
	};
}

/** Loads everything the Work and Brain screens read, in two requests. */
export async function loadLiveState(
	actions: InsightActions,
): Promise<CollaborationState> {
	const [
		profileRow,
		settingsRow,
		accountsPage,
		topicsPage,
		peoplePage,
		threadsPage,
		itemsPage,
		openReviews,
		acceptedReviews,
		dismissedReviews,
		rulesPage,
		roomsPage,
	] = (await runBatch(actions, [
		pixel("BrainGetProfile"),
		pixel("BrainGetSettings"),
		pixel("BrainListAccounts", { limit: 1000 }),
		pixel("BrainListTopics", { limit: 1000 }),
		pixel("BrainListPeople", { limit: 5000 }),
		pixel("BrainListThreads", { limit: 5000, detail: true }),
		pixel("WorkListItems", { view: "all", limit: 5000 }),
		pixel("BrainListReview", { status: "open", limit: 1000 }),
		pixel("BrainListReview", { status: "accepted", limit: 1000 }),
		pixel("BrainListReview", { status: "dismissed", limit: 1000 }),
		pixel("BrainListRules"),
		pixel("WorkListOpenRooms"),
	])) as [
		Row,
		Row,
		Page,
		Page,
		Page,
		Page,
		Page,
		Page,
		Page,
		Page,
		Page,
		Page,
	];

	// topic notes, goals, and people come from the detail call
	const topicRows = (await runBatch(
		actions,
		topicsPage.items.map((topic) =>
			pixel("BrainGetTopic", { topicId: str(topic.id) }),
		),
	)) as Row[];
	const topics = topicRows.map(mapTopic);
	const people = peoplePage.items.map(mapPerson);
	const self = people.find((person) => person.relationship === "self");
	const profile = mapProfile(profileRow, self?.id);
	const settings = mapSettings(settingsRow);

	return {
		today: new Date().toISOString().slice(0, 10),
		topics,
		people,
		threads: threadsPage.items.map(mapThread),
		items: itemsPage.items.map(mapItem),
		reviews: [
			...openReviews.items,
			...acceptedReviews.items,
			...dismissedReviews.items,
		].map((row) => mapReview(row, topics)),
		accounts: accountsPage.items as unknown as Account[],
		profile,
		liveProfile: profile,
		settings,
		rules: rulesPage.items.map(
			(row) => ({ ...row, isSample: false }) as unknown as Rule,
		),
		sources: mapSources(settings),
		workspaces: {},
		openThreadIds: roomsPage.items.map((room) => str(room.threadId)),
		sequence: 1,
	};
}

/** Reads a thread's messages; the command attaches them to the thread as it is when they arrive. */
export async function loadThreadMessages(
	actions: InsightActions,
	threadId: string,
): Promise<(thread: Thread) => CollaborationCommand> {
	const [out] = (await runBatch(actions, [
		pixel("BrainGetThreadMessages", { threadId, limit: 100 }),
	])) as [Row];
	const messages: WorkspaceMessage[] = list<Row>(out.messages).map(
		(message) => ({
			id: str(message.id),
			fromId: str(message.fromId),
			at: str(message.at),
			text: str(message.text),
			excluded: message.excluded === true ? true : undefined,
		}),
	);
	// source.import is not undone and keeps the owner's links, mute, and exclusions
	return (thread) => ({
		type: "source.import",
		thread,
		people: [],
		workspace: { messages },
	});
}
