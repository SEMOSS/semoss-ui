import type { SourceAttachment } from "@/features/connectors/types";
import type { DisplayBody } from "@/features/email/message-body";

/** Session-only collaboration records; imported identities retain nullable fields. */
export type Channel = "email" | "teams" | "calendar" | "room" | "task";
type TopicKind = "client" | "internal" | "event" | "personal";
type TopicStatus = "suggested" | "active" | "dormant" | "archived";
type PersonState = "member" | "suggested" | "removed";
type ItemStatus = "open" | "waiting" | "done" | "dismissed" | "snoozed";
type AskType =
	| "reply"
	| "approve"
	| "attend"
	| "review"
	| "waiting_on"
	| "errand"
	| "fyi";
type Priority = "P0" | "P1" | "P2" | "P3";

export interface Account {
	id: string;
	name: string;
	domain: string;
	kind: "client" | "internal" | "other";
	color: string;
}

export interface TopicGoal {
	noteId: string;
	text: string;
	status: "open" | "done";
}

interface TopicPerson {
	personId: string;
	role: string;
	engagement: number | null;
	state: PersonState;
	origin: "you" | "brain" | "assistant";
	reason?: string;
}

export interface Topic {
	id: string;
	name: string;
	short: string;
	accountId: string | null;
	kind: TopicKind;
	color: string;
	status: TopicStatus;
	description: string;
	keywords: string[];
	goals: TopicGoal[];
	people: TopicPerson[];
	calendarSeries: string[];
	stats: { threads: number; openItems: number; lastActivity: string };
	isSample: boolean;
}

export interface Person {
	id: string;
	name: string;
	initials: string;
	email: string | null;
	accountId: string | null;
	title: string;
	relationship: string;
	color: string;
	vip: boolean;
	neverIngest: boolean;
	strength: number | null;
	lastContact: string | null;
	channels: { email: number; teams: number; meetings: number };
	topics: string[];
	automated?: boolean;
	/** Your people: following (VIPs always), suggested by Brain, declined. Unset in sample data. */
	follow?: "following" | "suggested" | "declined" | null;
	followReason?: string;
	department?: string;
	isSample: boolean;
}

/** Your people: VIPs, the people you follow, and every sample contact (sample data has no follow state). */
export function isFollowed(person: Person): boolean {
	return (
		person.vip ||
		person.follow === "following" ||
		person.follow === undefined
	);
}

export interface ThreadTopicLink {
	topicId: string;
	source: "you" | "confirmed" | "suggested";
	confidence: number | null;
	primary: boolean;
}

interface Participant {
	personId: string;
	/** From the thread itself, for when the person is not loaded. */
	name?: string;
	email?: string;
	role: string;
	included: boolean;
	excludedBy?: "you" | "rule";
	excludedOn?: string;
	hiddenCount?: number;
}

interface SourceReference {
	kind: "outlook" | "teams" | "calendar";
	nativeId: string;
	webLink?: string;
	folder?: string;
	bodyTruncated?: boolean;
	conversationId?: string;
}

export interface Thread {
	id: string;
	channel: Channel;
	subject: string;
	topicLinks: ThreadTopicLink[];
	participants: Participant[];
	muted: boolean;
	automated?: boolean;
	messageCount: number;
	lastAt: string;
	roomId: string | null;
	summary: string;
	/** When Brain last wrote the summary and action items; absent when it never has. */
	summaryAt?: string;
	/** The summary was made from the thread's newest message. */
	summaryCurrent?: boolean;
	/** A summary is being made on the server. */
	summaryPending?: boolean;
	needsTopicChoice?: boolean;
	when?: string;
	conflict?: string;
	source?: SourceReference;
	isSample: boolean;
}

export interface WorkItem {
	id: string;
	threadId: string;
	channel: Channel;
	actorId: string;
	title: string;
	askType: AskType;
	priority: Priority | null;
	score: number | null;
	reasons: string[];
	due: string | null;
	received: string;
	status: ItemStatus;
	topicIds: string[];
	/** A direct topic association is independent of the source thread's topics. */
	linkTopicId?: string | null;
	roomId?: string | null;
	assignee?: string | null;
	suggested?: boolean;
	completedAt?: string;
	/** Why it closed; "no_response_needed" is the owner's correction for the classifier. */
	closedReason?: string;
	snoozeUntil?: string;
	snoozedFrom?: "open" | "waiting";
	isSample: boolean;
}

export interface ReviewEntry {
	id: string;
	kind: "new_topic" | "topic_choice" | "add_person" | "unassigned";
	text: string;
	detail: string;
	refId: string | null;
	status: "open" | "accepted" | "dismissed";
	actions: string[];
	createdAt?: string;
	/** Live reads mark this false; older fixture entries omit it. */
	isSample?: boolean;
	resolvedAt?: string;
	topicId?: string;
	candidate?: {
		name: string;
		accountId: string | null;
		mergeCandidate?: string | null;
	};
}

export interface Rule {
	id: string;
	kind:
		| "never_sender"
		| "never_domain"
		| "never_folder"
		| "never_keyword"
		| "exclude_topic"
		| "exclude_channel"
		| "exclude_everywhere"
		| "mute_sender";
	value: string;
	topicId?: string;
	personId?: string;
	channel?: string;
	note?: string;
	createdBy: string;
	createdAt: string;
	disabledAt?: string;
	isSample?: boolean;
}

export interface Profile {
	id: string;
	name: string;
	initials: string;
	email: string;
	org: string;
	role: { value: string; source: "learned" | "you"; note?: string };
	timezone: string;
	workingHours: string;
	vips: string[];
	style: {
		summary: string;
		source: "learned" | "you";
		confirmed: boolean;
		examples: string[];
	};
}

export interface Settings {
	classifierEngineId: string;
	fileAt: number;
	askAt: number;
	sourcesJson: Record<string, boolean>;
	/** Memory in the thread assistant, and suggestions from finished chats. */
	memory: { use: boolean; learn: boolean };
	version: number;
}

type MemoryRefType = "person" | "topic" | "account" | "thread";

/** Who or what a memory is about. */
export interface MemoryRef {
	type: MemoryRefType;
	id: string;
}

/** One statement the thread assistant keeps across threads (Brain memory). */
export interface Memory {
	id: string;
	/** preference: how the owner wants things done; fact: something true about a person, topic, account, or thread. */
	kind: "preference" | "fact";
	text: string;
	/** active is used; suggested waits for the owner; dismissed was undone or turned down. */
	state: "active" | "suggested" | "dismissed";
	/** you typed it; the assistant saved it in a chat; Brain proposed it from a finished chat. */
	origin: "you" | "assistant" | "brain";
	/** Typed, accepted, edited, or confirmed by the owner; only then a preference is an instruction. */
	confirmed: boolean;
	pinned: boolean;
	/** No links: it applies everywhere. */
	about: MemoryRef[];
	expiresAt: string | null;
	/** The memory this one replaces once it is accepted. */
	replacesId: string | null;
	source: {
		kind?: string;
		threadId?: string;
		roomId?: string;
		personId?: string;
		label?: string;
	};
	createdAt: string;
	updatedAt: string;
	isSample: boolean;
}

export interface SourceStatus {
	id: string;
	label: string;
	mark: string;
	status: "connected" | "needs_permission" | "off";
	lastSync: string | null;
	scope: string;
	volume: string | null;
	permission: string;
	isSample: boolean;
}

export interface WorkspaceMessage {
	/** Source-owned envelope details for reading and searching. */
	subject?: string;
	fromName?: string;
	fromAddress?: string;
	/** Original provider body for rendering only. */
	displayBody?: DisplayBody;
	id: string;
	fromId: string;
	at: string;
	text: string;
	excluded?: boolean;
	isTruncated?: boolean;
	/** Holds forwarded or earlier mail the thread has no copy of; not trimmed as a quoted reply. */
	history?: boolean;
	/** Names on To and Cc, as the source reported them. */
	to?: string[];
	cc?: string[];
	/** Opens the message in Outlook or Teams. */
	webLink?: string;
	/** Files and links attached to an email, described without their bytes. */
	attachments?: SourceAttachment[];
}

/** A message as the assistant receives it in the thread context. */
export interface ContextMessage {
	id: string;
	fromId: string;
	subject?: string;
	fromName?: string;
	fromAddress?: string;
	at: string;
	text: string;
	/** No readable body remains after source cleanup; metadata may still be useful. */
	bodyStatus?: "no_readable_text";
	isTruncated?: boolean;
	/** Names only; a file reaches the assistant only when the owner attaches it. */
	attachments?: string[];
}

export interface WorkspaceStep {
	/** Changed by the owner in this browser session. */
	isUserEdited?: boolean;
	/** Brain made it from the thread; a later summary can reword, close or drop it. */
	isGenerated?: boolean;
	id: string;
	text: string;
	ownerId: string;
	due: string | null;
	status: "open" | "waiting" | "done" | "suggested" | "draft_ready";
	kind: "reply" | "task" | "waiting_on" | "errand" | "approve";
	itemId?: string;
	linkTopicId?: string;
}

interface WorkspaceAsset {
	id: string;
	name: string;
	kind: string;
	size: string;
	source: string;
	by: string;
	when: string;
	isSample: boolean;
	insightId?: string;
	path?: string;
	nativeId?: string;
}

interface WorkspaceDraft {
	id: string;
	to: string;
	cc: string;
	bcc?: string;
	subject: string;
	body: string;
	isSample: boolean;
}

export interface ThreadWorkspace {
	goal: string;
	messages: WorkspaceMessage[];
	steps: WorkspaceStep[];
	assets: WorkspaceAsset[];
	drafts: WorkspaceDraft[];
	suggestions: string[];
	sampleChat: {
		id: string;
		role: "user" | "assistant";
		text: string;
		citations?: string[];
		options?: { name: string; meta: string }[];
	}[];
	related: { threadId: string; why: string }[];
	meetings: { title: string; when: string; state: string }[];
}

export interface CollaborationState {
	deletedSourceIds?: string[];
	today: string;
	topics: Topic[];
	people: Person[];
	threads: Thread[];
	items: WorkItem[];
	reviews: ReviewEntry[];
	accounts: Account[];
	profile: Profile;
	liveProfile: Profile | null;
	settings: Settings;
	rules: Rule[];
	sources: SourceStatus[];
	workspaces: Record<string, ThreadWorkspace>;
	/** Active and suggested memories; dismissed ones stay until the next read. */
	memories: Memory[];
	openThreadIds: string[];
	sequence: number;
}

export type ResourceScope =
	| "directory"
	| "items"
	| "threads"
	| "people"
	| "memories"
	| "reviews"
	| "accounts"
	| "rules"
	| `topic:${string}`
	| `topic-work:${string}`
	| `topic-context:${string}`;
export type ResourceRows = Partial<
	Pick<
		CollaborationState,
		| "topics"
		| "items"
		| "threads"
		| "people"
		| "memories"
		| "reviews"
		| "accounts"
		| "rules"
	>
>;

/** Commands contain UI intent and updates received from the backend. */
export type CollaborationCommand =
	| {
			type: "resource.received";
			scope: ResourceScope;
			rows: ResourceRows;
			baseline: ResourceRows;
	  }
	| { type: "topic.received"; topic: Topic }
	| { type: "topic.goal.received"; topicId: string; goal: TopicGoal }
	| { type: "item.received"; item: WorkItem }
	| {
			type: "topic.context.received";
			topic?: Topic;
			threads: Thread[];
			/** The scoped topic and complete source list allow stale memberships to be removed. */
			topicId?: string;
			completeThreads?: boolean;
			baseline?: { topic: Topic | null; threads: Thread[] };
			keepTopic?: boolean;
			keepThreadIds?: string[];
	  }
	| {
			type: "topic.work.received";
			topicId: string;
			items: WorkItem[];
			/** Only a fully paginated read can remove stale associations. */
			complete: boolean;
			/** Compare in the reducer so a save batched with this response still wins. */
			baseline?: { topicExists: boolean; items: WorkItem[] };
			keepItemIds?: string[];
	  }
	| {
			type: "live.refresh";
			updates: Pick<
				CollaborationState,
				"threads" | "workspaces" | "items"
			> & {
				/** Snapshot when the read began; reducer checks also cover batched saves and deletions. */
				baseline?: Pick<
					CollaborationState,
					"topics" | "threads" | "items"
				>;
				/** Every active and suggested memory on the server, when the read included them. */
				memories?: Memory[];
				/** Complete open-review snapshot; omitted when the read did not include it. */
				reviews?: ReviewEntry[];
				/** Fresh context records referenced by pending reviews and memories. */
				topics?: Topic[];
				people?: Person[];
				/** Changed locally while the read was in flight: the local copy wins this round. */
				keepItemIds?: string[];
				keepThreadIds?: string[];
				keepMemoryIds?: string[];
				keepReviewIds?: string[];
				keepTopicIds?: string[];
				keepPersonIds?: string[];
				/** Steps added or changed locally after the read was sent: the local copy wins this round. */
				keepStepIds?: string[];
			};
	  }
	| {
			/** Brain's summary and the thread's steps, as the server holds them after a summary run. */
			type: "thread.insights";
			threadId: string;
			summary: string;
			summaryAt?: string;
			summaryCurrent: boolean;
			steps: WorkspaceStep[];
			/** Steps added or changed locally after the read was sent: the local copy wins this round. */
			keepStepIds?: string[];
	  }
	| { type: "source.deleted"; sourceId: string }
	| { type: "session.create"; sessionId: string }
	| { type: "topic.save"; topic: Partial<Topic> & { name?: string } }
	| { type: "topic.merge"; sourceId: string; targetId: string }
	| { type: "topic.delete"; topicId: string }
	| {
			type: "topic.person";
			topicId: string;
			personId: string;
			state: PersonState;
			role?: string;
	  }
	| {
			/** A topic goal; topic notes are memories about the topic. */
			type: "topic.note";
			topicId: string;
			kind: "goal";
			operation: "save" | "remove";
			noteId?: string;
			text?: string;
			status?: "open" | "done";
	  }
	| {
			type: "thread.link";
			threadId: string;
			topicId: string;
			operation: "add" | "confirm" | "remove" | "primary";
	  }
	| {
			type: "thread.participant";
			threadId: string;
			personId: string;
			included: boolean;
	  }
	| { type: "thread.mute"; threadId: string; muted: boolean }
	| { type: "thread.goal"; threadId: string; goal: string }
	| {
			type: "person.save";
			personId: string;
			changes: Partial<Omit<Person, "id" | "isSample">>;
	  }
	| {
			type: "item.update";
			itemId: string;
			changes: Partial<
				Pick<
					WorkItem,
					| "status"
					| "closedReason"
					| "priority"
					| "title"
					| "snoozeUntil"
					| "suggested"
				>
			>;
	  }
	| { type: "item.create"; threadId: string; text: string; ownerId?: string }
	| {
			type: "review.resolve";
			reviewId: string;
			decision: "accept" | "dismiss" | "both" | "merge";
			targetTopicId?: string;
	  }
	| {
			type: "profile.save";
			changes: Partial<Profile>;
			target?: "sample" | "live";
	  }
	| { type: "settings.save"; changes: Partial<Settings> }
	| { type: "rule.add"; rule: Omit<Rule, "id" | "createdBy" | "createdAt"> }
	| { type: "rule.remove"; ruleId: string }
	| {
			type: "workspace.step";
			threadId: string;
			operation: "save" | "remove";
			step: Partial<WorkspaceStep> & { id?: string };
	  }
	| {
			/** Adds a memory (no id or an unknown one) or changes the fields passed; the owner's save confirms it. */
			type: "memory.save";
			memory: Partial<Omit<Memory, "origin" | "confirmed" | "state">> & {
				id?: string;
			};
	  }
	| { type: "memory.delete"; memoryId: string }
	| { type: "memory.clear" }
	| {
			type: "memory.resolve";
			memoryId: string;
			action: "accept" | "confirm" | "dismiss" | "restore" | "reopen";
	  }
	| {
			/** What the server returned for a memory action made outside the saver (the chat card). */
			type: "memory.server";
			memories?: Memory[];
			removedIds?: string[];
	  }
	| { type: "workspace.open" | "workspace.close"; threadId: string }
	| {
			type: "source.import";
			thread: Thread;
			people: Person[];
			workspace?: Partial<ThreadWorkspace>;
			item?: WorkItem;
	  }
	| { type: "source.status"; source: SourceStatus }
	| { type: "live-profile.set"; profile: Profile | null }
	| { type: "snooze.expire" };

export interface ThreadContext {
	threadId: string;
	subject?: string;
	channel?: Channel;
	isSample: boolean;
	goal: string;
	profile: Profile | null;
	topics: {
		id: string;
		name: string;
		description: string;
		goals: TopicGoal[];
		/** The topic's account, for memories about the account. */
		account?: { id: string; name: string };
	}[];
	participants: { personId: string; name: string; included: boolean }[];
	messages: ContextMessage[];
	/** Left out by an exclusion or a rule. */
	hiddenCount: number;
	/** Allowed, but no text once quoted replies are removed (an invite or an image, say). */
	emptyIds: string[];
	revision: string;
}
