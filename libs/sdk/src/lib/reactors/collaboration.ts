/**
 * Built-in reactor inventory at Semoss 12781b2478eb97e2a27a911e9bdbc94b6f34ee88.
 * Named keys include inherited constructors and reachable execution/helper reads.
 * Required inputs are included where reachable organizeKeys/checkOptional enforces
 * them. Output shapes follow source values and PixelStreamUtility. Remaining value,
 * validation, and nested-shape gaps are explicit in contract-gaps.json; audited
 * contracts override these base contracts in catalog.ts.
 */
import type { SourceParameters } from "./source-parameters";
import type { ReactorContract } from "./value-types";

export interface CollaborationReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainApplyTopicReviewReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainApplyTopicReview: ReactorContract<
		SourceParameters<"retryFiling" | "reviewId" | "revision", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainChangeTopicReviewReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainChangeTopicReview: ReactorContract<
		SourceParameters<
			"change" | "operationId" | "reviewId" | "revision",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainClassifyThreadsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainClassifyThreads: ReactorContract<
		SourceParameters<"async" | "dryRun" | "threadIds" | "topics", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainCompleteGoalReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainCompleteGoal: ReactorContract<
		SourceParameters<"goalId" | "resolution" | "topicId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainCreateDraftFolderReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainCreateDraftFolder: ReactorContract<
		SourceParameters<"inInbox" | "name", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainDeleteMemoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainDeleteMemory: ReactorContract<
		SourceParameters<"memoryId", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainDeleteRuleReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainDeleteRule: ReactorContract<
		SourceParameters<"ruleId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainDeleteTopicReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainDeleteTopic: ReactorContract<
		SourceParameters<"topicId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainDeleteTopicNoteReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainDeleteTopicNote: ReactorContract<
		SourceParameters<"noteId" | "topicId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainEditThreadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainEditThread: ReactorContract<
		SourceParameters<
			| "addTopic"
			| "makePrimary"
			| "muted"
			| "notAutomated"
			| "removeTopic"
			| "threadId",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainEditTopicReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainEditTopic: ReactorContract<
		SourceParameters<
			| "addGoal"
			| "addNote"
			| "addPeople"
			| "completeGoalId"
			| "deleteNoteId"
			| "description"
			| "goalResolution"
			| "name"
			| "removePeople"
			| "status"
			| "topic"
			| "topicId",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainForgetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainForget: ReactorContract<
		SourceParameters<"memoryId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainForgetBackgroundAccessReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainForgetBackgroundAccess: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainGetConnectionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainGetConnection: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainGetJobReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainGetJob: ReactorContract<
		SourceParameters<"jobId" | "kind" | "mode", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainGetProfileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainGetProfile: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainGetRelatedItemsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainGetRelatedItems: ReactorContract<
		SourceParameters<"limit" | "threadId", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainGetSearchRecordReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainGetSearchRecord: ReactorContract<
		SourceParameters<"id" | "kind", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainGetSettingsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainGetSettings: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainGetThreadMessagesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainGetThreadMessages: ReactorContract<
		SourceParameters<
			| "cursor"
			| "includeAttachments"
			| "includeDisplayBody"
			| "limit"
			| "refresh"
			| "threadId",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainGetTopicReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainGetTopic: ReactorContract<
		SourceParameters<"topicId", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainGetTopicReviewReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainGetTopicReview: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainGetTopicReviewEvidenceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainGetTopicReviewEvidence: ReactorContract<
		SourceParameters<
			"limit" | "offset" | "query" | "reviewId" | "revision" | "topicKey",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainImportMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainImportMail: ReactorContract<
		SourceParameters<"days" | "teams", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainLinkRoomThreadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainLinkRoomThread: ReactorContract<
		SourceParameters<"remove" | "roomId" | "threadId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainLinkRoomTopicReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainLinkRoomTopic: ReactorContract<
		SourceParameters<
			"remove" | "roomId" | "topicId" | "topicName",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainLinkThreadTopicReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainLinkThreadTopic: ReactorContract<
		SourceParameters<
			"primary" | "remove" | "threadId" | "topicId",
			"named"
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainLinkTopicFolderReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainLinkTopicFolder: ReactorContract<
		SourceParameters<"folderId" | "remove" | "topicId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainListAccountsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainListAccounts: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainListDraftFoldersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainListDraftFolders: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainListMailFoldersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainListMailFolders: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainListMemoriesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainListMemories: ReactorContract<
		SourceParameters<
			"limit" | "offset" | "query" | "refId" | "refType" | "state",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainListPeopleReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainListPeople: ReactorContract<
		SourceParameters<
			| "accountId"
			| "follow"
			| "limit"
			| "offset"
			| "query"
			| "relationship"
			| "topicId",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainListReviewReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainListReview: ReactorContract<
		SourceParameters<"limit" | "offset" | "status", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainListRoomThreadsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainListRoomThreads: ReactorContract<
		SourceParameters<"roomId" | "withIds", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainListRoomTopicsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainListRoomTopics: ReactorContract<
		SourceParameters<"roomId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainListRulesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainListRules: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainListThreadRoomsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainListThreadRooms: ReactorContract<
		SourceParameters<"threadId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainListThreadsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainListThreads: ReactorContract<
		SourceParameters<
			"channel" | "detail" | "filter" | "limit" | "offset" | "topicId",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainListTopicRoomsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainListTopicRooms: ReactorContract<
		SourceParameters<"limit" | "offset" | "topicId", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainListTopicsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainListTopics: ReactorContract<
		SourceParameters<
			"accountId" | "limit" | "offset" | "status" | "topic" | "topicId",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainMailboxOverviewReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainMailboxOverview: ReactorContract<
		SourceParameters<"days", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainMergeTopicsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainMergeTopics: ReactorContract<
		SourceParameters<"sourceTopicId" | "targetTopicId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainPreviewTopicOrganizationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainPreviewTopicOrganization: ReactorContract<
		SourceParameters<"proposal" | "reviewId" | "revision", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainPreviewTopicReachReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainPreviewTopicReach: ReactorContract<
		SourceParameters<"reach", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainRecallMemoriesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainRecallMemories: ReactorContract<
		SourceParameters<"roomId" | "threadId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainRememberReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainRemember: ReactorContract<
		SourceParameters<
			"about" | "everywhere" | "expiresAt" | "kind" | "replaces" | "text",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainReopenReviewReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainReopenReview: ReactorContract<
		SourceParameters<"reviewId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainResetMyDataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainResetMyData: ReactorContract<
		SourceParameters<"confirm", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainResolveMemoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainResolveMemory: ReactorContract<
		SourceParameters<"action" | "memoryId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainResolveReviewReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainResolveReview: ReactorContract<
		SourceParameters<"action" | "paramValues" | "reviewId", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSaveAccountReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSaveAccount: ReactorContract<
		SourceParameters<"account", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSaveBackgroundAccessReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSaveBackgroundAccess: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSaveMemoryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSaveMemory: ReactorContract<
		SourceParameters<"memory", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSavePersonReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSavePerson: ReactorContract<
		SourceParameters<"person", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSaveProfileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSaveProfile: ReactorContract<
		SourceParameters<"profile", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSaveRuleReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSaveRule: ReactorContract<
		SourceParameters<"rule", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSaveSettingsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSaveSettings: ReactorContract<
		SourceParameters<"settings", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSaveTopicReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSaveTopic: ReactorContract<
		SourceParameters<"topic", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSaveTopicNoteReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSaveTopicNote: ReactorContract<
		SourceParameters<
			"kind" | "noteId" | "state" | "text" | "topicId",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSaveTopicReviewReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSaveTopicReview: ReactorContract<
		SourceParameters<"draft" | "reviewId" | "revision", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSearchMemoriesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSearchMemories: ReactorContract<
		SourceParameters<"about" | "limit" | "query", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSearchThreadsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSearchThreads: ReactorContract<
		SourceParameters<
			"from" | "limit" | "person" | "query" | "to" | "topic" | "topicId",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSetThreadMutedReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSetThreadMuted: ReactorContract<
		SourceParameters<"muted" | "threadId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSetThreadNotAutomatedReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSetThreadNotAutomated: ReactorContract<
		SourceParameters<"notAutomated" | "threadId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSetThreadParticipantReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSetThreadParticipant: ReactorContract<
		SourceParameters<"included" | "personId" | "threadId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSetTopicAreaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSetTopicArea: ReactorContract<
		SourceParameters<"area" | "reviewId" | "revision" | "split", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSetTopicPersonReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSetTopicPerson: ReactorContract<
		SourceParameters<"personId" | "role" | "state" | "topicId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSetTopicStatusReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSetTopicStatus: ReactorContract<
		SourceParameters<"status" | "topicId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainStartTopicReviewReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainStartTopicReview: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSuggestAccountsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSuggestAccounts: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSuggestTopicOrganizationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSuggestTopicOrganization: ReactorContract<
		SourceParameters<"reviewId" | "revision", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSuggestTopicsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSuggestTopics: ReactorContract<
		SourceParameters<"dryRun", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainSyncReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainSync: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainTagTopicReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainTagTopic: ReactorContract<
		SourceParameters<"confident" | "topic", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainTopicReviewChatReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainTopicReviewChat: ReactorContract<
		SourceParameters<"chat" | "reviewId" | "revision", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/BrainUndoTopicChangeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	BrainUndoTopicChange: ReactorContract<
		SourceParameters<"changeId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/SearchCollaborationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SearchCollaboration: ReactorContract<
		SourceParameters<"limit" | "offset" | "query", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkCloseRoomReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkCloseRoom: ReactorContract<
		SourceParameters<"threadId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkComposeEmailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkComposeEmail: ReactorContract<
		SourceParameters<
			| "attachments"
			| "bcc"
			| "cc"
			| "forward"
			| "message"
			| "openEmailId"
			| "replyTo"
			| "subject"
			| "to",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkCreateItemReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkCreateItem: ReactorContract<
		SourceParameters<
			"askType" | "assignee" | "dueAt" | "threadId" | "title",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkDeleteMySkillReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkDeleteMySkill: ReactorContract<
		SourceParameters<"skillId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkDeleteStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkDeleteStep: ReactorContract<
		SourceParameters<"stepId" | "threadId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkDownloadAttachmentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkDownloadAttachment: ReactorContract<
		SourceParameters<
			| "attachmentId"
			| "attachmentName"
			| "fileName"
			| "includeText"
			| "messageId"
			| "threadId",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkGetAgendaRoutineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkGetAgendaRoutine: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkGetInboxRoutineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkGetInboxRoutine: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkGetThreadInsightsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkGetThreadInsights: ReactorContract<
		SourceParameters<"threadId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkListCustomRoutinesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkListCustomRoutines: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkListItemsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkListItems: ReactorContract<
		SourceParameters<
			"channel" | "limit" | "offset" | "sort" | "topicId" | "view",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkListMySkillsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkListMySkills: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkListOpenRoomsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkListOpenRooms: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkListWorkspacesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkListWorkspaces: ReactorContract<
		SourceParameters<"threadId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkManageCustomRoutineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkManageCustomRoutine: ReactorContract<
		SourceParameters<"action" | "routineId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkOpenRoomReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkOpenRoom: ReactorContract<
		SourceParameters<"roomId" | "threadId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkOpenRoutineRoomReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkOpenRoutineRoom: ReactorContract<
		SourceParameters<"routineId" | "startedAt", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkOpenSkillReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkOpenSkill: ReactorContract<
		SourceParameters<"skillId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkPublishSkillReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkPublishSkill: ReactorContract<
		SourceParameters<"path", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkReadEmailAttachmentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkReadEmailAttachment: ReactorContract<
		SourceParameters<"path" | "sha256", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkRunAgendaRoutineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkRunAgendaRoutine: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkRunCustomRoutineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkRunCustomRoutine: ReactorContract<
		SourceParameters<"routineId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkRunInboxRoutineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkRunInboxRoutine: ReactorContract<
		SourceParameters<never, "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkSaveAgendaRoutineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkSaveAgendaRoutine: ReactorContract<
		SourceParameters<"settings", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkSaveCustomRoutineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkSaveCustomRoutine: ReactorContract<
		SourceParameters<
			| "agentId"
			| "days"
			| "delivery"
			| "enabled"
			| "name"
			| "prompt"
			| "routineId"
			| "skills"
			| "time"
			| "timezone",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkSaveInboxRoutineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkSaveInboxRoutine: ReactorContract<
		SourceParameters<"settings", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkSaveStepReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkSaveStep: ReactorContract<
		SourceParameters<"step" | "threadId", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkSendEmailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkSendEmail: ReactorContract<
		SourceParameters<
			| "bcc"
			| "cc"
			| "draftId"
			| "from"
			| "message"
			| "openEmailId"
			| "replyTo"
			| "subject"
			| "to",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkStageRoutineAttachmentsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkStageRoutineAttachments: ReactorContract<
		SourceParameters<"runId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkSummarizeThreadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkSummarizeThread: ReactorContract<
		SourceParameters<"force" | "threadId", "named">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkUpdateItemReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkUpdateItem: ReactorContract<
		SourceParameters<
			| "closedReason"
			| "dueAt"
			| "itemId"
			| "priority"
			| "reason"
			| "snoozeUntil"
			| "status"
			| "suggested"
			| "title",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/collaboration/WorkUseSkillInAssistantReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WorkUseSkillInAssistant: ReactorContract<
		SourceParameters<"skillId" | "use", "named">,
		unknown,
		false
	>;
}
