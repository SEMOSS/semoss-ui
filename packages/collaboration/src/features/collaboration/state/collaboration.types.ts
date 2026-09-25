/** Session-only collaboration records; imported identities retain nullable fields. */
export type Channel = "email" | "teams" | "calendar" | "room" | "task";
export type TopicKind = "client" | "internal" | "event" | "personal";
export type TopicStatus = "suggested" | "active" | "dormant" | "archived";
export type PersonState = "member" | "suggested" | "removed";
export type ItemStatus = "open" | "waiting" | "done" | "dismissed" | "snoozed";
export type AskType =
	| "reply"
	| "approve"
	| "attend"
	| "review"
	| "waiting_on"
	| "errand"
	| "fyi";
export type Priority = "P0" | "P1" | "P2" | "P3";

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

export interface TopicNote {
	noteId: string;
	kind: "goal" | "note";
	text: string;
	status: "draft" | "confirmed";
	by: "you" | "assistant";
	date: string;
	source?: string;
}

export interface TopicPerson {
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
	notes: TopicNote[];
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
	isSample: boolean;
}

export interface ThreadTopicLink {
	topicId: string;
	source: "you" | "confirmed" | "suggested";
	confidence: number | null;
	primary: boolean;
}

export interface Participant {
	personId: string;
	role: string;
	included: boolean;
	excludedBy?: "you" | "rule";
	excludedOn?: string;
	hiddenCount?: number;
}

export interface SourceReference {
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
	suggested?: boolean;
	completedAt?: string;
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
	version: number;
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
	id: string;
	fromId: string;
	at: string;
	text: string;
	excluded?: boolean;
	isTruncated?: boolean;
}

export interface WorkspaceStep {
	id: string;
	text: string;
	ownerId: string;
	due: string | null;
	status: "open" | "waiting" | "done" | "suggested" | "draft_ready";
	kind: "reply" | "task" | "waiting_on" | "errand" | "approve";
	itemId?: string;
	linkTopicId?: string;
}

export interface WorkspaceFact {
	id: string;
	text: string;
	from: string;
	status: "draft" | "confirmed";
	sourcePersonId?: string;
}

export interface WorkspaceAsset {
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

export interface WorkspaceDraft {
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
	facts: WorkspaceFact[];
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
	openThreadIds: string[];
	sequence: number;
}

/** Commands contain UI intent; backend receipts are never written through undo. */
export type CollaborationCommand =
	| { type: "topic.save"; topic: Partial<Topic> & { name?: string } }
	| { type: "topic.merge"; sourceId: string; targetId: string }
	| {
			type: "topic.person";
			topicId: string;
			personId: string;
			state: PersonState;
			role?: string;
	  }
	| {
			type: "topic.note";
			topicId: string;
			kind: "goal" | "note";
			operation: "save" | "remove";
			noteId?: string;
			text?: string;
			status?: "draft" | "confirmed" | "open" | "done";
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
			type: "workspace.fact";
			threadId: string;
			operation: "save" | "remove";
			fact: Partial<WorkspaceFact> & { id?: string };
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
	isSample: boolean;
	goal: string;
	profile: Profile | null;
	topics: {
		id: string;
		name: string;
		description: string;
		goals: TopicGoal[];
		notes: TopicNote[];
	}[];
	participants: { personId: string; name: string; included: boolean }[];
	messages: WorkspaceMessage[];
	facts: WorkspaceFact[];
	hiddenCount: number;
	revision: string;
}
