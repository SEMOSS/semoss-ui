/**
 * Collaboration outputs traced through mapResult(Object), the concrete helpers,
 * SQL row mappers, and PixelStreamUtility's default Gson writer. Nullable map
 * values are omitted on the wire; nullable top-level query results stay nullable.
 * See collaboration-output-evidence.json for producer and dynamic-leaf evidence.
 */
interface Page<T> {
	items: T[];
	total: number;
}

interface Profile {
	id: "me";
	name?: string;
	email?: string;
	org?: string;
	role: { value?: string; source: "you" | "learned"; note?: string };
	timezone?: string;
	workingHours?: string;
	style: {
		summary?: string;
		source: "you" | "learned";
		confirmed: boolean;
		examples: unknown[];
	};
	vips: (string | null)[];
}

interface Settings {
	draftFolderId: string;
	draftFolderName: string;
	classifierEngineId?: string;
	fileAt?: number;
	askAt?: number;
	version?: number;
	memory: { use: boolean; learn: boolean };
	assistantSkills: string[];
	sourcesJson: Record<string, boolean>;
	/** Added only by getSettings(User), not its string-owner overload. */
	assistantAgent?: { id: string; name: string; modelId?: string };
}

interface Job {
	id?: string;
	kind?: string;
	status?: string;
	step?: string;
	progress?: number;
	params?: Record<string, unknown>;
	counts?: Record<string, unknown>;
	error?: string;
	startedAt?: string;
	finishedAt?: string;
	insightsPending?: number;
}

interface FolderSummary {
	known: boolean;
	read: number;
	custom: number;
	linked: number;
	updatedAt?: string;
}

interface Connection {
	microsoft: { signedIn: boolean; account?: string; renewable: boolean };
	mailbox?: string;
	background: {
		saved: boolean;
		account?: string;
		renewable: boolean;
		canSave: boolean;
		otherAccount: boolean;
	};
	sources: {
		id: string;
		label: string;
		mark: string;
		status: string;
		lastSync?: string;
		scope: string;
		permission: string;
	}[];
	folders: FolderSummary;
}

interface Account {
	id?: string;
	name?: string;
	domain?: string;
	kind?: string;
	color?: string;
}

interface Person {
	id?: string;
	name?: string;
	initials: string;
	email?: string;
	accountId?: string;
	title?: string;
	relationship?: string;
	automated?: true;
	department?: string;
	follow: string;
	followReason?: string;
	color?: string;
	vip: boolean;
	strength: number;
	lastContact?: string;
	topicMembership?: { topicId?: string; role?: string; state?: string }[];
	threadInclusion?: { threadId?: string; included: boolean }[];
}

interface Memory {
	id?: string;
	kind?: string;
	text?: string;
	state?: string;
	origin?: string;
	confirmed: boolean;
	pinned: boolean;
	about: { type?: string; id?: string; name?: string }[];
	expiresAt?: string;
	replacesId?: string;
	source: {
		kind?: string;
		threadId?: string;
		roomId?: string;
		ref?: string;
		personId?: string;
		label?: string;
	};
	createdAt?: string;
	updatedAt?: string;
	confirmedAt?: string;
}

interface MemoryChange {
	status: string;
	note: string;
	memory?: Memory;
	replaced?: Memory;
	proposed?: {
		kind: string;
		text: string;
		about: { type: string; id: string }[];
		expiresAt?: string;
	};
}

interface Rule {
	id?: string;
	kind?: string;
	value?: string;
	topicId?: string;
	personId?: string;
	channel?: string;
	note?: string;
	createdBy?: string;
	createdAt?: string;
	disabledAt?: string;
}

interface Review {
	id?: string;
	kind?: string;
	text?: string;
	detail?: string;
	refType?: string;
	refId?: string;
	status?: string;
	actions: unknown[];
	data: Record<string, unknown>;
	createdAt?: string;
	resolvedAt?: string;
	resolvedBy?: string;
	resolution?: Record<string, unknown>;
	undone?: Record<string, unknown>;
}

interface TopicNote {
	noteId?: string;
	kind?: string;
	text?: string;
	resolution?: string;
	status?: string;
	by?: string;
	date?: string;
	source?: string;
}

interface TopicPerson {
	personId?: string;
	role?: string;
	engagement?: number;
	state?: string;
	origin?: string;
	reason?: string;
	name?: string;
	email?: string;
}

interface TopicFolder {
	id?: string;
	path: string;
	origin?: string;
}

interface TopicSummary {
	id?: string;
	name?: string;
	short?: string;
	accountId?: string;
	kind?: string;
	color?: string;
	status?: string;
	stats: { threads: number; openItems: number; lastActivity?: string };
}

interface Topic extends TopicSummary {
	description?: string;
	keywords: unknown[];
	calendarSeries: unknown[];
	goals: Pick<TopicNote, "noteId" | "text" | "status" | "resolution">[];
	openActionItems: {
		itemId?: string;
		title?: string;
		threadId?: string;
		dueAt?: string;
		priority?: string;
	}[];
	people: TopicPerson[];
	folders: TopicFolder[];
	notes?: Memory[];
}

interface TopicLink {
	topicId?: string;
	source?: string;
	confidence: number;
	primary: boolean;
}

interface Thread {
	id?: string;
	channel?: string;
	conversationId?: string;
	subject?: string;
	muted: boolean;
	automated?: true;
	notAutomated?: true;
	messageCount: number;
	lastAt?: string;
	roomId?: string;
	needsTopicChoice?: true;
	summary?: string;
	summaryAt?: string;
	summaryCurrent?: boolean;
	summaryPending?: true;
	topicLinks?: TopicLink[];
	participants?: ThreadParticipant[];
	latestMessageId?: string;
}

interface ThreadParticipant {
	personId?: string;
	role?: string;
	name?: string;
	email?: string;
	included: boolean;
	excludedBy?: string;
	excludedOn?: string;
	hiddenCount?: number;
}

interface ThreadMatch {
	threadId?: string;
	type: "chat" | "meeting" | "email";
	subject: string;
	lastAt?: string;
	messageCount: number;
	people: string[];
	topics?: string[];
}

interface ThreadSearch
	extends Page<
		ThreadMatch & {
			score?: number;
			matchedOn?: string[];
			snippet?: string;
			topicLink?: string;
		}
	> {
	topicId?: string;
	searchedOn: string[];
	note: string;
}

interface Classification {
	classifier: string;
	dryRun: boolean;
	threads: number;
	topics: Record<string, number>;
	work: Record<string, number>;
	errors: number;
	results: {
		threadId?: string;
		topicId?: string;
		confidence?: number;
		band?: string;
		work?: string;
		priority?: string;
		/** Classifier score maps are model/version dependent. */
		scores?: Record<string, unknown>;
		error?: string;
	}[];
	automatedSenders?: number;
	senderVoteCalls?: number;
	automatedPeople?: number;
}

interface RoomTopics {
	roomId: string;
	threadId?: string;
	topics: {
		topicId?: string;
		name?: string;
		color?: string;
		state?: string;
		origin?: string;
		changedAt?: string;
	}[];
}

interface RoomThreads {
	roomId: string;
	threads: {
		threadId?: string;
		subject?: string;
		channel?: string;
		origin?: string;
		messageCount?: number;
		lastMessageAt?: string;
		seenAt?: string;
		newCount: number;
		added: boolean;
		emailIds?: string[];
	}[];
}

interface TopicReview {
	exists: boolean;
	review?: {
		id?: string;
		revision: number;
		/** Persisted JSON is versioned independently of the reactor's wire envelope. */
		draft?: Record<string, unknown>;
		appliedRevision?: number;
		result?: Record<string, unknown>;
		filingJobId?: string;
		updatedAt?: string;
		filingJob?: Job;
		profileConflicts: {
			topicKey: string;
			profileVersion: string;
			exists: boolean;
			savedProfile: {
				name: string;
				short: string;
				description: string;
				kind: string;
				status: string;
				terms: string;
				people: { id: string; name: string; state: string }[];
			};
			canReconcile: boolean;
			reason: string;
		}[];
	};
}

interface TopicSuggestions {
	accounts: (Account & {
		people: number;
		threads: number;
		twoWayThreads: number;
		vips: number;
		suggested: boolean;
	})[];
	dryRun: boolean;
	topics: {
		id: string;
		name?: string;
		kind: string;
		accountId?: string;
		reason?: string;
		threadIds: string[];
		memberIds: string[];
		people: { id: string; name: string }[];
		domains: string[];
		about?: string;
		folders: string[];
		folderIds: string[];
		fileFromFolder: boolean;
		suggestedTerms?: string[];
		sampleSubjects: string[];
		youWrote: number;
		vipThreads: number;
		suggested: boolean;
	}[];
	modelError?: string;
}

interface Step {
	id?: string;
	threadId?: string;
	text?: string;
	kind?: string;
	status?: string;
	ownerId?: string;
	due?: string;
	itemId?: string;
	linkTopicId?: string;
	origin?: string;
}

interface Workspace {
	threadId?: string;
	steps: Omit<Step, "threadId">[];
}

interface WorkItem {
	id?: string;
	threadId?: string;
	channel?: string;
	actorId?: string;
	actorName?: string;
	title?: string;
	askType?: string;
	priority?: string;
	score?: number;
	reasons: unknown[];
	due?: string;
	received?: string;
	status?: string;
	suggested?: true;
	origin?: string;
	snoozeUntil?: string;
	closedReason?: string;
	closedAt?: string;
	assignee?: string;
	linkTopicId?: string;
	roomId?: string;
	changeId?: string;
	topicIds: string[];
}

interface ThreadInsights {
	threadId: string;
	status: string;
	error?: string;
	summary?: string;
	summaryAt?: string;
	summaryCurrent: boolean;
	steps: Omit<Step, "threadId">[];
}

interface Routine {
	id: string;
	time: string;
	days: string[];
	timezone: string;
	configured: boolean;
	enabled: boolean;
	schedulerAvailable: boolean;
	mailboxAvailable: boolean;
	assistantAvailable: boolean;
	availabilityMessage?: string;
	nextRunAt?: string;
	lastRun?: {
		status?: string;
		startedAt?: string;
		finishedAt?: string;
		roomId?: string;
		summary?: string;
		error?: string;
		errorCause?: string;
		html?: string;
	};
	flow: {
		nodes: {
			id: string;
			type: string;
			label: string;
			position?: { x: number; y: number };
		}[];
		edges: {
			source: string;
			target: string;
			sourcePort: string;
			targetPort: string;
		}[];
	};
}

interface InboxRoutine extends Routine {
	lookbackHours: number;
}
interface AgendaRoutine extends Routine {
	meetings: string[];
	ignored: string[];
}
interface CustomRoutine extends Routine {
	name: string;
	prompt: string;
	delivery: string;
	agentId: string;
	skills: string[];
}

interface TopicGroup {
	topicKeys: string[];
	targetKey: string;
	name: string;
	description: string;
	terms: string;
}

interface Message {
	id?: string;
	emailRef?: string;
	fromId?: string;
	fromName?: string;
	fromAddress?: string;
	at?: string;
	subject?: string;
	text?: string;
	footer?: string;
	history?: true;
	excluded: boolean;
	muted: boolean;
	to: { name?: string; address?: string }[];
	cc: { name?: string; address?: string }[];
	meeting?: true;
	webLink?: string;
	displayBody?: {
		contentType: "text" | "html";
		content: string;
		isTruncated: boolean;
		attachments?: { name: string }[];
	};
	attachments?: {
		/** Passed through from the provider or configured fixture without coercion. */
		id?: unknown;
		name: string;
		contentType?: string;
		size?: number;
		kind: "file" | "item" | "link" | "other";
		isInline: boolean;
	}[];
}

/** Output-only refinements; input forms and parameter omission remain in the catalog. */
export interface CollaborationOutputTypes {
	BrainApplyTopicReview: TopicReview;
	BrainChangeTopicReview: TopicReview;
	BrainClassifyThreads: Job | Classification | null;
	BrainCompleteGoal: { changes: string[]; topic: Topic };
	BrainCreateDraftFolder: { id: string; name: string; path: string };
	BrainDeleteMemory: { deleted: number } | { id: string; deleted: true };
	BrainDeleteRule: { deleted: true };
	BrainDeleteTopicNote: { topicId: string; noteId: string };
	BrainDeleteTopic: {
		topicId: string;
		threadsUnlinked: number;
		changeId?: string;
	};
	BrainEditThread: {
		topicLinks?: TopicLink[];
		threadId: string;
		changes: string[];
	};
	BrainEditTopic: { changes: string[]; topic: Topic };
	BrainForgetBackgroundAccess: Connection;
	BrainForget: MemoryChange;
	BrainGetConnection: Connection;
	BrainGetJob: Partial<Job>;
	BrainGetProfile: Profile | null;
	BrainGetRelatedItems: Page<
		ThreadMatch & { reasons: string[]; score: number }
	> & { threadId: string; documents: never[] };
	BrainGetSearchRecord: {
		topics: Topic[];
		people: Person[];
		threads: Thread[];
		items: WorkItem[];
		workspaces: Page<Workspace>;
		memories: Memory[];
	};
	BrainGetSettings: Settings;
	BrainGetThreadMessages: {
		threadId: string;
		source: string;
		muted: boolean;
		messages: Message[];
		hiddenCount: number;
		unavailableCount: number;
		hasMore: boolean;
		nextCursor?: string;
	};
	BrainGetTopic: Topic;
	BrainGetTopicReviewEvidence: {
		reviewId?: string;
		revision: number;
		topicKey: string;
		items: {
			id?: string;
			source?: string;
			subject: string;
			lastMessageAt?: string;
			messageCount: number;
			muted: boolean;
			links: (TopicLink & { name: string })[];
			people: { id: string; name: string; email: string }[];
			rejectedTopicIds: string[];
			canCorrect: boolean;
			version: string;
		}[];
		total: number;
		offset: number;
		hasMore: boolean;
		hiddenOrUnavailable: number;
		limited: boolean;
		scope: string;
	};
	BrainGetTopicReview: TopicReview;
	BrainImportMail: Job | null;
	BrainLinkRoomThread: RoomThreads;
	BrainLinkRoomTopic: RoomTopics;
	BrainLinkThreadTopic: TopicLink[];
	BrainLinkTopicFolder: {
		topicId: string;
		folders: TopicFolder[];
		filed: number;
	};
	BrainListAccounts: Page<Account>;
	BrainListDraftFolders: {
		folders: { id: string; name: string; path: string }[];
	};
	BrainListMailFolders: {
		folders: {
			id: string;
			name: string;
			path: string;
			total: number;
			topicIds: string[];
		}[];
		summary: FolderSummary;
	};
	BrainListMemories: Page<Memory>;
	BrainListPeople: Page<Person>;
	BrainListReview: Page<Review>;
	BrainListRoomThreads: RoomThreads;
	BrainListRoomTopics: RoomTopics;
	BrainListRules: Page<Rule>;
	BrainListThreadRooms: Page<{
		roomId?: string;
		name?: string;
		origin?: string;
		lastAt?: string;
	}> & { threadId: string };
	BrainListThreads: Page<Thread>;
	BrainListTopicRooms: Page<{
		roomId?: string;
		origin?: string;
		linkedAt?: string;
		name?: string;
		lastAt?: string;
	}> & { topicId: string };
	BrainListTopics: Topic | Page<TopicSummary>;
	BrainMailboxOverview: {
		mailbox: { address: string; name?: string };
		days: number;
		counts: Record<string, Record<string, number>>;
		truncated: boolean;
		topSenders: {
			address: string;
			name?: string;
			count: number;
			youWrote: boolean;
		}[];
		wroteTo: number;
		keepOut: {
			kind: string;
			value: string;
			name?: string;
			count: number;
			reason: string;
			alreadyKeptOut: boolean;
		}[];
		lastImport?: Job;
	};
	BrainMergeTopics: {
		topicId: string;
		mergedInto: string;
		threadsMoved: number;
		changeId?: string;
	};
	BrainPreviewTopicOrganization: {
		reviewId?: string;
		revision: number;
		groups: (TopicGroup & {
			contributing: {
				key: string;
				name: string;
				examples: number;
				accepted: boolean;
			}[];
			examples: number;
			impact: {
				linkedConversations: number;
				workItems: number;
				steps: number;
				people: number;
				notes: number;
				rules: number;
				pendingRelationships: number;
				positiveOverExclusion: number;
			};
			canApply: boolean;
			reason: string;
		})[];
		beforeCount: number;
		afterCount: number;
		scopeVersion: string;
	};
	BrainPreviewTopicReach: {
		threads: number;
		together: number;
		samples: string[];
	};
	BrainRecallMemories: {
		enabled: boolean;
		items: (Memory & { bucket: string })[];
		hidden: number;
		prompt?: string;
	};
	BrainRemember: MemoryChange;
	BrainReopenReview: Review;
	BrainResetMyData: { rows: number; tables: Record<string, number> };
	BrainResolveMemory: { memory?: Memory; restored?: Memory };
	BrainResolveReview: Review | null;
	BrainSaveAccount: Account | null;
	BrainSaveBackgroundAccess: Connection;
	BrainSaveMemory: Memory | null;
	BrainSavePerson: Person;
	BrainSaveProfile: Profile | null;
	BrainSaveRule: Rule | null;
	BrainSaveSettings: Settings;
	BrainSaveTopicNote: TopicNote | null;
	BrainSaveTopic: Topic;
	BrainSaveTopicReview: TopicReview;
	BrainSearchMemories: Page<Memory> & { note?: string };
	BrainSearchThreads: ThreadSearch;
	BrainSetThreadMuted: Thread | null;
	BrainSetThreadNotAutomated: {
		reopened?: (string | null)[];
		reclassified?: Classification;
		reclassifyError?: string;
		thread: Thread;
	};
	BrainSetThreadParticipant: ThreadParticipant | null;
	BrainSetTopicArea: TopicReview;
	BrainSetTopicPerson: TopicPerson | null;
	BrainSetTopicStatus: Topic;
	BrainStartTopicReview:
		| TopicReview
		| { exists: false; pending: true; job: Job | null };
	BrainSuggestAccounts: TopicSuggestions;
	BrainSuggestTopicOrganization: {
		reviewId: string;
		revision: number;
		groups: (TopicGroup & { reason: string })[];
		questions: string[];
		beforeCount: number;
		proposedCount: number;
	};
	BrainSuggestTopics: TopicSuggestions;
	BrainSync: Job | null;
	BrainTagTopic: { topicId?: string; outcome: string };
	BrainTopicReviewChat: {
		reviewId: string;
		revision: number;
		reply: string;
		changes: {
			type: string;
			topicKey: string;
			topicKeys: string[];
			name: string;
			description: string;
			addTerms: string[];
			addPeople: { id: string; name: string }[];
			removePeople: { id: string; name: string }[];
			reason: string;
		}[];
	};
	BrainUndoTopicChange: {
		changeId?: string;
		undoOf: string;
		topicId?: string;
	};
	SearchCollaboration: Page<{
		kind?: string;
		id?: string;
		name?: string;
		detail?: string;
	}>;
	WorkCloseRoom: { threadId: string; closed: true };
	WorkComposeEmail: {
		sourceMessage?: { id: string; subject: string };
		attachments?: {
			path: string;
			name: string;
			size: number;
			sha256: string;
		}[];
		shown: true;
		mode: "reply" | "forward" | "edit" | "new";
		replyTo?: string;
		forward?: string;
		note: string;
	};
	WorkCreateItem: WorkItem | null;
	WorkDeleteMySkill: { skillId: string; deleted: true };
	WorkDeleteStep: { id: string; deleted: true };
	WorkDownloadAttachment: {
		threadId: string;
		messageId: string;
		attachmentId: string;
		name: string;
		contentType?: string;
		size: number;
		filePath: string;
		textPath?: string;
		textTruncated?: true;
		textError?: string;
	};
	WorkGetAgendaRoutine: AgendaRoutine;
	WorkGetInboxRoutine: InboxRoutine;
	WorkGetThreadInsights: ThreadInsights;
	WorkListCustomRoutines: { routines: CustomRoutine[] };
	WorkListItems: Page<WorkItem> & {
		fyiCount: number;
		automatedSkippedCount: number;
	};
	WorkListMySkills: {
		skills: {
			id: string;
			name?: string;
			description?: string;
			inAssistant: boolean;
		}[];
	};
	WorkListOpenRooms: Page<{
		threadId?: string;
		roomId?: string;
		subject?: string;
		lastAt?: string;
		pinned: boolean;
	}>;
	WorkListWorkspaces: Page<Workspace>;
	WorkManageCustomRoutine:
		| CustomRoutine
		| { routineId: string; status: "started"; note: string }
		| { routineId: string; deleted: true };
	WorkOpenRoom: { threadId: string; roomId?: string; lastAt: string };
	WorkOpenRoutineRoom: { roomId: string };
	WorkOpenSkill: {
		path: string;
		files: string[];
		skillMd: string;
		note: string;
	};
	WorkPublishSkill: {
		status: "created" | "updated";
		path: string;
		added: string[];
		changed: string[];
		removed: string[];
		files: string[];
		note: string;
	};
	WorkReadEmailAttachment: {
		path: string;
		name: string;
		size: number;
		contentBase64: string;
	};
	WorkRunAgendaRoutine: { status: "skipped" | "completed" | "failed" };
	WorkRunCustomRoutine: { status: "skipped" | "completed" | "failed" };
	WorkRunInboxRoutine: { status: "skipped" | "completed" | "failed" };
	WorkSaveAgendaRoutine: AgendaRoutine;
	WorkSaveCustomRoutine: CustomRoutine;
	WorkSaveInboxRoutine: InboxRoutine;
	WorkSaveStep: Step | null;
	WorkSendEmail: {
		sent: true;
		from?: string;
		to?: string[];
		cc?: string[];
		subject?: unknown;
	};
	WorkStageRoutineAttachments: { attachments: string[]; skipped: string[] };
	WorkSummarizeThread: ThreadInsights;
	WorkUpdateItem: WorkItem;
	WorkUseSkillInAssistant: Settings;
}
