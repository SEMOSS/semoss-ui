import { z } from "@semoss/ui/next";
import type { SourceAttachment } from "@/features/connectors/types";
import { readDisplayBody } from "@/features/email/message-body";
import type { InsightActions } from "@/lib/pixel";
import { PixelError, pixel } from "@/lib/pixel";
import {
	setThreadAgent,
	type ThreadAgent,
} from "../../thread-assistant/thread-context";
import { createEmptyWorkspace } from "../state/collaboration.reducer";
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
	ThreadWorkspace,
	Topic,
	WorkItem,
	WorkspaceFact,
	WorkspaceMessage,
	WorkspaceStep,
} from "../state/collaboration.types";

// Brain and Work state loaded from the Collaboration reactors.
// Every record loads as connected (isSample false).

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

// the platform agent behind each thread's assistant; absent when unset or not shared with this user
function mapThreadAgent(value: unknown): ThreadAgent | null {
	const row = (value ?? {}) as Row;
	const id = str(row.id);
	return id
		? { id, name: str(row.name) || "Assistant", modelId: str(row.modelId) }
		: null;
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
		// live people always carry a follow state; null means not followed
		follow:
			row.follow === "following" ||
			row.follow === "suggested" ||
			row.follow === "declined"
				? row.follow
				: null,
		followReason: opt(row.followReason),
		department: opt(row.department),
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
	// Brain ids are internal ids. Only expose a source target when the server supplies its native id.
	const nativeId =
		channel === "teams"
			? str(row.conversationId)
			: str(row.latestMessageId);
	return {
		id: str(row.id),
		channel,
		// Teams chat identity is distinct from the latest message identity.
		source: nativeId
			? {
					kind: SOURCE_KINDS[channel] ?? "outlook",
					nativeId,
					conversationId: opt(row.conversationId),
				}
			: undefined,
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
			name: opt(participant.name),
			email: opt(participant.email),
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
		summaryAt: opt(row.summaryAt),
		summaryCurrent: row.summaryCurrent === true,
		summaryPending: row.summaryPending === true ? true : undefined,
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
		closedReason: opt(row.closedReason),
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
		workspacesPage,
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
		pixel("WorkListWorkspaces"),
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
		Page,
	];

	// Repeated list rows must not duplicate navigation entries or detail requests.
	const topicIds = [
		...new Set(topicsPage.items.map((topic) => str(topic.id))),
	];
	// topic notes, goals, and people come from the detail call
	const topicRows = (await runBatch(
		actions,
		topicIds.map((topicId) => pixel("BrainGetTopic", { topicId })),
	)) as Row[];
	const topics = topicRows.map(mapTopic);
	const people = peoplePage.items.map(mapPerson);
	const self = people.find((person) => person.relationship === "self");
	const profile = mapProfile(profileRow, self?.id);
	const settings = mapSettings(settingsRow);
	setThreadAgent(mapThreadAgent(settingsRow.assistantAgent));

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
		workspaces: mapWorkspaces(workspacesPage),
		openThreadIds: roomsPage.items.map((room) => str(room.threadId)),
		sequence: 1,
	};
}

// a due day is saved as midnight UTC; as a plain date it shows on that day in every time zone
function dueDay(value: unknown): string | null {
	const due = opt(value);
	return due?.endsWith("T00:00:00Z") ? due.slice(0, 10) : (due ?? null);
}

function mapStep(step: Row): WorkspaceStep {
	return {
		id: str(step.id),
		text: str(step.text),
		ownerId: str(step.ownerId, "me"),
		due: dueDay(step.due),
		status: str(step.status, "open") as WorkspaceStep["status"],
		kind: str(step.kind, "task") as WorkspaceStep["kind"],
		itemId: opt(step.itemId),
		linkTopicId: opt(step.linkTopicId),
		...(step.origin === "brain" ? { isGenerated: true } : {}),
	};
}

// saved goal, steps, and facts; messages load when the thread opens
function mapWorkspaces(page: Page): Record<string, ThreadWorkspace> {
	return Object.fromEntries(
		page.items.map((row) => [
			str(row.threadId),
			{
				...createEmptyWorkspace(),
				goal: str(row.goal),
				steps: list<Row>(row.steps).map(mapStep),
				facts: list<Row>(row.facts).map(
					(fact): WorkspaceFact => ({
						id: str(fact.id),
						text: str(fact.text),
						from: str(fact.from),
						status: str(
							fact.status,
							"confirmed",
						) as WorkspaceFact["status"],
						sourcePersonId: opt(fact.sourcePersonId),
					}),
				),
			},
		]),
	);
}

const attachmentSchema = z.object({
	id: z.string().min(1),
	name: z.string(),
	contentType: z.string().optional(),
	size: z.number().nonnegative().optional(),
	kind: z.string().optional(),
});

/**
 * An email's attachments; only a file carries bytes the thread can stage.
 * Malformed entries are skipped rather than failing the whole page.
 */
function mapAttachments(
	value: unknown,
	messageId: string,
): SourceAttachment[] | undefined {
	const attachments = list(value).flatMap((item): SourceAttachment[] => {
		const parsed = attachmentSchema.safeParse(item);
		if (!parsed.success) return [];
		const { id, name, contentType, size, kind } = parsed.data;
		return [
			{
				id,
				name: name || "Attachment",
				...(contentType ? { contentType } : {}),
				...(size === undefined ? {} : { size }),
				isFile: kind === undefined || kind === "file",
				messageId,
			},
		];
	});
	return attachments.length ? attachments : undefined;
}

// To or Cc as names, the address when the source gave no name; undefined when empty
function recipientNames(value: unknown): string[] | undefined {
	const names = list<Row>(value)
		.map((recipient) => str(recipient.name) || str(recipient.address))
		.filter(Boolean);
	return names.length ? names : undefined;
}

const threadPageSchema = z.object({
	threadId: z.string().optional(),
	messages: z.array(z.record(z.string(), z.unknown())),
	hasMore: z.boolean().optional(),
	nextCursor: z.string().min(1).optional(),
	hiddenCount: z.number().optional(),
	unavailableCount: z.number().optional(),
});

export interface ThreadMessagePage {
	messages: WorkspaceMessage[];
	hasMore: boolean;
	nextCursor?: string;
	hiddenCount: number;
	unavailableCount: number;
}

/** Read one source page, validating continuation metadata at the boundary. */
export async function readThreadMessagesPage(
	actions: InsightActions,
	threadId: string,
	cursor?: string,
): Promise<ThreadMessagePage> {
	const [raw] = (await runBatch(actions, [
		pixel("BrainGetThreadMessages", {
			threadId,
			limit: 100,
			includeDisplayBody: true,
			includeAttachments: true,
			cursor,
		}),
	])) as [Row];
	const out = threadPageSchema.parse(raw);
	if (out.threadId && out.threadId !== threadId)
		throw new Error("Received history for a different thread.");
	const messages: WorkspaceMessage[] = out.messages.map((message) => ({
		id: str(message.id),
		subject: opt(message.subject),
		fromName: opt(message.fromName),
		fromAddress: opt(message.fromAddress),
		fromId: str(message.fromId),
		at: str(message.at),
		text: str(message.text),
		displayBody: readDisplayBody(message.displayBody),
		excluded: message.excluded === true ? true : undefined,
		history: message.history === true ? true : undefined,
		to: recipientNames(message.to),
		cc: recipientNames(message.cc),
		webLink:
			typeof message.webLink === "string" &&
			message.webLink.startsWith("https://")
				? message.webLink
				: undefined,
		attachments: mapAttachments(message.attachments, str(message.id)),
	}));
	return {
		messages,
		hasMore: out.hasMore ?? false,
		nextCursor: out.nextCursor,
		hiddenCount: out.hiddenCount ?? 0,
		unavailableCount: out.unavailableCount ?? 0,
	};
}

/** Legacy refresh callers attach the first page to the current owning thread. */
export async function loadThreadMessages(
	actions: InsightActions,
	threadId: string,
): Promise<(thread: Thread) => CollaborationCommand> {
	const { messages } = await readThreadMessagesPage(actions, threadId);
	return (thread) => ({
		type: "source.import",
		thread,
		people: [],
		workspace: { messages },
	});
}

const threadInsightsSchema = z.object({
	threadId: z.string(),
	status: z.enum(["running", "done", "failed"]),
	error: z.string().nullish(),
	summary: z.string().nullish(),
	summaryAt: z.string().nullish(),
	summaryCurrent: z.boolean(),
	steps: z.array(z.record(z.string(), z.unknown())),
});

/** A thread's summary run on the server, and the summary and steps it left. */
export interface ThreadInsightsResult {
	status: "running" | "done" | "failed";
	error: string;
	summary: string;
	summaryAt?: string;
	summaryCurrent: boolean;
	steps: WorkspaceStep[];
}

async function runThreadInsights(
	actions: InsightActions,
	statement: string,
	threadId: string,
): Promise<ThreadInsightsResult> {
	const [raw] = await runBatch(actions, [statement]);
	const out = threadInsightsSchema.parse(raw);
	if (out.threadId !== threadId)
		throw new Error("Received a summary for a different thread.");
	return {
		status: out.status,
		error: out.error ?? "",
		summary: out.summary ?? "",
		summaryAt: out.summaryAt ?? undefined,
		summaryCurrent: out.summaryCurrent,
		steps: out.steps.map(mapStep),
	};
}

/**
 * Ask Brain to summarize the thread and find its action items in the background, outside its assistant room.
 * Without force the server does nothing when the summary already covers the newest message.
 */
export function summarizeThread(
	actions: InsightActions,
	threadId: string,
	force: boolean,
): Promise<ThreadInsightsResult> {
	return runThreadInsights(
		actions,
		pixel("WorkSummarizeThread", { threadId, force: force || undefined }),
		threadId,
	);
}

/** Poll a summary run started by {@link summarizeThread}, a sync, or another tab. */
export function readThreadInsights(
	actions: InsightActions,
	threadId: string,
): Promise<ThreadInsightsResult> {
	return runThreadInsights(
		actions,
		pixel("WorkGetThreadInsights", { threadId }),
		threadId,
	);
}

/** Refresh work metadata through existing bounded reads without reloading the application. */
export async function readWorkUpdates(actions: InsightActions): Promise<
	Pick<CollaborationState, "threads" | "workspaces" | "items"> & {
		lastMailCheck: MailCheck | null;
	}
> {
	const outputs = await runBatch(actions, [
		pixel("BrainListThreads", { limit: 5000, detail: true }),
		pixel("WorkListWorkspaces"),
		pixel("WorkListItems", { view: "all", limit: 5000 }),
		pixel("BrainGetJob", { kind: "sync" }),
	]);
	const schema = z.object({
		items: z.array(z.record(z.string(), z.unknown())),
		total: z.number().optional().default(0),
	});
	const [threads, workspaces, items] = outputs
		.slice(0, 3)
		.map((output) => schema.parse(output));
	return {
		threads: threads.items.map(mapThread),
		workspaces: mapWorkspaces(workspaces),
		items: items.items.map(mapItem),
		lastMailCheck: mapMailCheck(outputs[3]),
	};
}

/** The newest mail sync on the server, from whichever trigger ran it (Refresh, a send, later the webhook). */
export interface MailCheck {
	status: "running" | "done" | "failed";
	/** When it finished, or started while still running. */
	at: string;
	error: string;
}

function mapMailCheck(output: unknown): MailCheck | null {
	const job = (output ?? {}) as Row;
	const status = opt(job.status);
	if (status !== "running" && status !== "done" && status !== "failed")
		return null;
	return {
		status,
		at: str(job.finishedAt) || str(job.startedAt),
		error: str(job.error),
	};
}

export type SyncOutcome = "new" | "updated" | "cleared" | "automated" | "quiet";

export interface MailSyncResult {
	/** Messages newly brought in through the rules gate (kept-out mail is not counted). */
	newMessages: number;
	/** Reply items closed because the owner answered. */
	closedByReply: number;
	/** Threads with new mail by where they went. */
	outcomes: Partial<Record<SyncOutcome, number>>;
	/** Up to 50 of those threads, for "What came in". */
	changes: { threadId: string; outcome: SyncOutcome }[];
}

const SYNC_OUTCOMES = new Set<string>([
	"new",
	"updated",
	"cleared",
	"automated",
	"quiet",
]);

const SYNC_POLL_MS = 1500;
const SYNC_TIMEOUT_MS = 10 * 60_000;

/** Pull new mail (and Teams when on) from Microsoft 365 through the shared sync job, then return its counts. */
export async function syncMail(
	actions: InsightActions,
	wait: (ms: number) => Promise<void> = (ms) =>
		new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<MailSyncResult> {
	const job = z.object({
		status: z.string().optional(),
		error: z.string().nullish(),
		counts: z.record(z.string(), z.unknown()).nullish(),
	});
	const [started] = await runBatch(actions, [pixel("BrainSync")]);
	let current = job.parse(started);
	const deadline = Date.now() + SYNC_TIMEOUT_MS;
	while (current.status === "running") {
		if (Date.now() > deadline)
			throw new Error("Checking for new mail is taking too long.");
		await wait(SYNC_POLL_MS);
		const [polled] = await runBatch(actions, [
			pixel("BrainGetJob", { kind: "sync" }),
		]);
		current = job.parse(polled);
	}
	if (current.status !== "done")
		throw new Error(current.error || "Checking for new mail failed.");
	const count = (key: string) => {
		const value = Number(current.counts?.[key]);
		return Number.isFinite(value) ? value : 0;
	};
	const outcomes = (current.counts?.outcomes ?? {}) as Record<
		string,
		unknown
	>;
	const changes = Array.isArray(current.counts?.changes)
		? (current.counts.changes as Row[])
		: [];
	return {
		newMessages: count("imported"),
		closedByReply: count("closedByReply"),
		outcomes: Object.fromEntries(
			Object.entries(outcomes)
				.filter(([key]) => SYNC_OUTCOMES.has(key))
				.map(([key, value]) => [key, Number(value) || 0]),
		),
		changes: changes
			.filter(
				(change) =>
					typeof change.threadId === "string" &&
					SYNC_OUTCOMES.has(String(change.outcome)),
			)
			.map((change) => ({
				threadId: String(change.threadId),
				outcome: change.outcome as SyncOutcome,
			})),
	};
}
