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

export interface ConnectorsReactorCatalog {
	/**
	 * @source Semoss/src/prerna/io/connector/jira/AdminJiraInsertConnectionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminJiraInsertConnections: ReactorContract<
		SourceParameters<
			"alias" | "clientId" | "clientSecret" | "scope" | "userProfileUrl",
			"both",
			["alias", "clientId", "clientSecret", "scope", "userProfileUrl"],
			5
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/salesforce/AdminSalesforceInsertConnectionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminSalesforceInsertConnections: ReactorContract<
		SourceParameters<
			"alias" | "clientId" | "clientSecret",
			"both",
			["clientId", "clientSecret", "alias"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/servicenow/AdminServiceNowInsertConnectionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AdminServiceNowInsertConnections: ReactorContract<
		SourceParameters<
			| "alias"
			| "clientId"
			| "clientSecret"
			| "instanceUrl"
			| "userProfileUrl",
			"both",
			[
				"instanceUrl",
				"clientId",
				"clientSecret",
				"userProfileUrl",
				"alias",
			],
			5
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/GetJiraConnectionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetJiraConnections: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/salesforce/GetSalesforceConnectionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetSalesforceConnections: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/servicenow/GetServiceNowConnectionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetServiceNowConnections: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/surveymonkey/GetSurveyMonkeySurveysReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetSurveyMonkeySurveys: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/github/GitHubBranchReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitHubBranch: ReactorContract<
		SourceParameters<
			| "action"
			| "branch"
			| "fromBranch"
			| "owner"
			| "page"
			| "perPage"
			| "repo",
			"both",
			["action", "owner", "repo"],
			3
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/github/GitHubCheckInstallationReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitHubCheckInstallation: ReactorContract<
		SourceParameters<"project", "both", ["project"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/github/GitHubIssueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitHubIssue: ReactorContract<
		SourceParameters<
			| "action"
			| "assignees"
			| "body"
			| "commentId"
			| "issueNumber"
			| "labels"
			| "owner"
			| "page"
			| "perPage"
			| "query"
			| "repo"
			| "state"
			| "title",
			"both",
			["action"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/github/GitHubPullProjectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitHubPullProject: ReactorContract<
		SourceParameters<"project", "both", ["project"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/github/GitHubPullRequestReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitHubPullRequest: ReactorContract<
		SourceParameters<
			| "action"
			| "assignees"
			| "base"
			| "body"
			| "commentId"
			| "head"
			| "labels"
			| "owner"
			| "page"
			| "perPage"
			| "pullNumber"
			| "query"
			| "repo"
			| "state"
			| "title",
			"both",
			["action"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/github/GitHubPushProjectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitHubPushProject: ReactorContract<
		SourceParameters<"comment" | "project", "both", ["project"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/github/GitHubRepoReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitHubRepo: ReactorContract<
		SourceParameters<
			"action" | "owner" | "page" | "perPage" | "query",
			"both",
			["action"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/github/GitHubUserReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitHubUser: ReactorContract<
		SourceParameters<"username", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/github/GitHubWebhookDeliveriesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GitHubWebhookDeliveries: ReactorContract<
		SourceParameters<"limit" | "project", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarCreateEventReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleCalendarCreateEvent: ReactorContract<
		SourceParameters<
			| "attendees"
			| "body"
			| "calendarId"
			| "categories"
			| "end"
			| "html"
			| "importance"
			| "isAllDay"
			| "isOnlineMeeting"
			| "location"
			| "mailbox"
			| "optionalAttendees"
			| "recurrence"
			| "recurrenceUntil"
			| "reminderMinutesBeforeStart"
			| "showAs"
			| "start"
			| "subject"
			| "timeZone",
			"both",
			["start", "end"],
			3
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarDeleteEventReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleCalendarDeleteEvent: ReactorContract<
		SourceParameters<"calendarId" | "id" | "mailbox", "both", ["id"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarGetEventReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleCalendarGetEvent: ReactorContract<
		SourceParameters<
			"calendarId" | "id" | "mailbox" | "maxBodyChars" | "timeZone",
			"both",
			["id"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarGetScheduleReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleCalendarGetSchedule: ReactorContract<
		SourceParameters<
			"days" | "end" | "schedules" | "start" | "timeZone",
			"both",
			["schedules"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarListCalendarsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleCalendarListCalendars: ReactorContract<
		SourceParameters<"limit" | "mailbox" | "offset", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarListEventsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleCalendarListEvents: ReactorContract<
		SourceParameters<
			| "calendarId"
			| "days"
			| "end"
			| "includeBody"
			| "limit"
			| "mailbox"
			| "maxBodyChars"
			| "offset"
			| "start"
			| "subject"
			| "timeZone",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarListPermissionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleCalendarListPermissions: ReactorContract<
		SourceParameters<"calendarId" | "limit" | "mailbox" | "offset", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarRespondToEventReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleCalendarRespondToEvent: ReactorContract<
		SourceParameters<
			| "calendarId"
			| "comment"
			| "id"
			| "mailbox"
			| "response"
			| "sendResponse",
			"both",
			["id", "response"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/calendar/GoogleCalendarUpdateEventReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleCalendarUpdateEvent: ReactorContract<
		SourceParameters<
			| "attendees"
			| "body"
			| "calendarId"
			| "categories"
			| "end"
			| "html"
			| "id"
			| "importance"
			| "isAllDay"
			| "isOnlineMeeting"
			| "location"
			| "mailbox"
			| "optionalAttendees"
			| "recurrence"
			| "recurrenceUntil"
			| "reminderMinutesBeforeStart"
			| "showAs"
			| "start"
			| "subject"
			| "timeZone",
			"both",
			["id"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/docs/GoogleDocsCreateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleDocsCreate: ReactorContract<
		SourceParameters<"content" | "promptTitle", "both", ["promptTitle"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/docs/GoogleDocsDeleteReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleDocsDelete: ReactorContract<
		SourceParameters<"id", "both", ["id"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/docs/GoogleDocsListReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleDocsList: ReactorContract<
		SourceParameters<"limit", "both", ["limit"], 1>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/docs/GoogleDocsReadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleDocsRead: ReactorContract<
		SourceParameters<"id", "both", ["id"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/docs/GoogleDocsUpdateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleDocsUpdate: ReactorContract<
		SourceParameters<"content" | "id", "both", ["id", "content"], 2>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/drive/GoogleDriveDeleteReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleDriveDelete: ReactorContract<
		SourceParameters<"id", "both", ["id"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/drive/GoogleDriveDownloadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleDriveDownload: ReactorContract<
		SourceParameters<
			"fileName" | "filePath" | "id",
			"both",
			["id", "filePath"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/drive/GoogleDriveListReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleDriveList: ReactorContract<
		SourceParameters<"limit", "both", ["limit"], 1>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/drive/GoogleDriveReadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleDriveRead: ReactorContract<
		SourceParameters<"id", "both", ["id"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/drive/GoogleDriveUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleDriveUpload: ReactorContract<
		SourceParameters<"filePath" | "name", "both", ["name", "filePath"], 2>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailDeleteMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleGmailDeleteMail: ReactorContract<
		SourceParameters<"id", "both", ["id"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailDownloadAttachmentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleGmailDownloadAttachment: ReactorContract<
		SourceParameters<"attachmentId" | "fileName" | "id", "both", ["id"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailForwardMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleGmailForwardMail: ReactorContract<
		SourceParameters<
			"asDraft" | "attachments" | "body" | "html" | "id" | "to",
			"both",
			["id", "to"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailGetMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleGmailGetMail: ReactorContract<
		SourceParameters<
			| "id"
			| "includeAttachments"
			| "includeDisplayBody"
			| "includeReplyRecipients"
			| "maxBodyChars",
			"both",
			["id"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailListMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleGmailListMail: ReactorContract<
		SourceParameters<
			| "conversationId"
			| "folder"
			| "from"
			| "includeBody"
			| "limit"
			| "maxBodyChars"
			| "offset"
			| "sinceDays"
			| "subject"
			| "unreadOnly",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailListMailFoldersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleGmailListMailFolders: ReactorContract<
		SourceParameters<"limit" | "offset", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailMarkMailReadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleGmailMarkMailRead: ReactorContract<
		SourceParameters<"id" | "read", "both", ["id"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailMoveMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleGmailMoveMail: ReactorContract<
		SourceParameters<"folder" | "id", "both", ["id", "folder"], 2>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailProfileByIdReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleGmailProfileById: ReactorContract<
		SourceParameters<never, "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailReplyMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleGmailReplyMail: ReactorContract<
		SourceParameters<
			| "asDraft"
			| "attachments"
			| "body"
			| "cc"
			| "html"
			| "id"
			| "overrideRecipients"
			| "replyAll"
			| "to",
			"both",
			["id", "body"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailSaveDraftReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleGmailSaveDraft: ReactorContract<
		SourceParameters<
			"attachments" | "bcc" | "body" | "cc" | "html" | "subject" | "to",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailSendDraftReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleGmailSendDraft: ReactorContract<
		SourceParameters<"id", "both", ["id"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/google/gmail/GoogleGmailSendMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleGmailSendMail: ReactorContract<
		SourceParameters<
			"attachments" | "bcc" | "body" | "cc" | "html" | "subject" | "to",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraAssignIssueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraAssignIssue: ReactorContract<
		SourceParameters<"assignee" | "jiraid", "both", ["jiraid"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraAttachmentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraAttachment: ReactorContract<
		SourceParameters<
			"action" | "attachmentId" | "filePath" | "jiraid",
			"both",
			["action"],
			1
		>,
		Record<string, unknown> | unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraCommentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraComment: ReactorContract<
		SourceParameters<
			"action" | "comment" | "commentId" | "jiraid",
			"both",
			["action", "jiraid"],
			2
		>,
		Record<string, unknown> | unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraCreateIssueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraCreateIssue: ReactorContract<
		SourceParameters<"paramMap", "both", ["paramMap"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraDeleteIssueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraDeleteIssue: ReactorContract<
		SourceParameters<
			"deleteSubtasks" | "jiraid" | "project",
			"both",
			["project", "jiraid"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraGetAssignableUsersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraGetAssignableUsers: ReactorContract<
		SourceParameters<"project" | "query", "both", ["project"], 1>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraGetCreateFieldsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraGetCreateFields: ReactorContract<
		SourceParameters<
			"issuetypeid" | "project",
			"both",
			["project", "issuetypeid"],
			2
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraGetIssueLinkTypesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraGetIssueLinkTypes: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraGetPriorityReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraGetPriority: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraGetProjectsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraGetProjects: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraGetTransitionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraGetTransitions: ReactorContract<
		SourceParameters<"jiraid", "both", ["jiraid"], 1>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraGetUpdateFieldsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraGetUpdateFields: ReactorContract<
		SourceParameters<"jiraid", "both", ["jiraid"], 1>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraIssueLinkReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraIssueLink: ReactorContract<
		SourceParameters<
			"action" | "inwardIssue" | "linkId" | "linkType" | "outwardIssue",
			"both",
			["action"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraIssueTypeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraIssueType: ReactorContract<
		SourceParameters<"project", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraReadIssueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraReadIssue: ReactorContract<
		SourceParameters<"jiraid", "both", ["jiraid"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraSearchReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraSearch: ReactorContract<
		SourceParameters<
			"jql" | "maxResults" | "nextPageToken",
			"both",
			["jql"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraUpdateIssueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraUpdateIssue: ReactorContract<
		SourceParameters<
			"jiraid" | "paramMap",
			"both",
			["jiraid", "paramMap"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/jira/JiraWorklogReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	JiraWorklog: ReactorContract<
		SourceParameters<
			| "action"
			| "comment"
			| "jiraid"
			| "started"
			| "timeSpent"
			| "worklogId",
			"both",
			["action", "jiraid"],
			2
		>,
		Record<string, unknown> | unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarCreateEventReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftCalendarCreateEvent: ReactorContract<
		SourceParameters<
			| "attendees"
			| "body"
			| "calendarId"
			| "categories"
			| "end"
			| "html"
			| "importance"
			| "isAllDay"
			| "isOnlineMeeting"
			| "location"
			| "mailbox"
			| "optionalAttendees"
			| "recurrence"
			| "recurrenceUntil"
			| "reminderMinutesBeforeStart"
			| "showAs"
			| "start"
			| "subject"
			| "timeZone",
			"both",
			["start", "end"],
			3
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarDeleteEventReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftCalendarDeleteEvent: ReactorContract<
		SourceParameters<"calendarId" | "id" | "mailbox", "both", ["id"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarGetEventReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftCalendarGetEvent: ReactorContract<
		SourceParameters<
			"calendarId" | "id" | "mailbox" | "maxBodyChars" | "timeZone",
			"both",
			["id"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarGetScheduleReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftCalendarGetSchedule: ReactorContract<
		SourceParameters<
			"days" | "end" | "schedules" | "start" | "timeZone",
			"both",
			["schedules"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarListCalendarsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftCalendarListCalendars: ReactorContract<
		SourceParameters<"limit" | "mailbox" | "offset", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarListEventsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftCalendarListEvents: ReactorContract<
		SourceParameters<
			| "calendarId"
			| "days"
			| "end"
			| "includeBody"
			| "limit"
			| "mailbox"
			| "maxBodyChars"
			| "offset"
			| "start"
			| "subject"
			| "timeZone",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarListPermissionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftCalendarListPermissions: ReactorContract<
		SourceParameters<"calendarId" | "limit" | "mailbox" | "offset", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarRespondToEventReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftCalendarRespondToEvent: ReactorContract<
		SourceParameters<
			| "calendarId"
			| "comment"
			| "id"
			| "mailbox"
			| "response"
			| "sendResponse",
			"both",
			["id", "response"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/calendar/MicrosoftCalendarUpdateEventReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftCalendarUpdateEvent: ReactorContract<
		SourceParameters<
			| "attendees"
			| "body"
			| "calendarId"
			| "categories"
			| "end"
			| "html"
			| "id"
			| "importance"
			| "isAllDay"
			| "isOnlineMeeting"
			| "location"
			| "mailbox"
			| "optionalAttendees"
			| "recurrence"
			| "recurrenceUntil"
			| "reminderMinutesBeforeStart"
			| "showAs"
			| "start"
			| "subject"
			| "timeZone",
			"both",
			["id"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/onedrive/MicrosoftOneDriveCreateFolderReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOneDriveCreateFolder: ReactorContract<
		SourceParameters<
			"conflictBehavior" | "driveId" | "itemId" | "name" | "path",
			"both",
			["name"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/onedrive/MicrosoftOneDriveDeleteFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOneDriveDeleteFile: ReactorContract<
		SourceParameters<"driveId" | "itemId" | "path", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/onedrive/MicrosoftOneDriveDownloadFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOneDriveDownloadFile: ReactorContract<
		SourceParameters<
			"driveId" | "fileName" | "itemId" | "path" | "shareUrl",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/onedrive/MicrosoftOneDriveGetFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOneDriveGetFile: ReactorContract<
		SourceParameters<"driveId" | "itemId" | "path" | "shareUrl", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/onedrive/MicrosoftOneDriveListDrivesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOneDriveListDrives: ReactorContract<
		SourceParameters<"limit", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/onedrive/MicrosoftOneDriveListFilesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOneDriveListFiles: ReactorContract<
		SourceParameters<"driveId" | "itemId" | "limit" | "path", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/onedrive/MicrosoftOneDriveListSharedFilesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOneDriveListSharedFiles: ReactorContract<
		SourceParameters<"limit" | "search", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/onedrive/MicrosoftOneDriveSearchFilesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOneDriveSearchFiles: ReactorContract<
		SourceParameters<
			"driveId" | "itemId" | "limit" | "path" | "scope" | "search",
			"both",
			["search"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/onedrive/MicrosoftOneDriveShareFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOneDriveShareFile: ReactorContract<
		SourceParameters<
			| "driveId"
			| "expirationDateTime"
			| "itemId"
			| "linkType"
			| "password"
			| "path"
			| "recipients"
			| "scope",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/onedrive/MicrosoftOneDriveUploadFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOneDriveUploadFile: ReactorContract<
		SourceParameters<
			| "conflictBehavior"
			| "driveId"
			| "filePath"
			| "itemId"
			| "name"
			| "path",
			"both",
			["filePath"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookCreateMailFolderReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOutlookCreateMailFolder: ReactorContract<
		SourceParameters<"name" | "parent", "both", ["name"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookDeleteMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOutlookDeleteMail: ReactorContract<
		SourceParameters<"id", "both", ["id"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookDownloadAttachmentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOutlookDownloadAttachment: ReactorContract<
		SourceParameters<"attachmentId" | "fileName" | "id", "both", ["id"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookForwardMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOutlookForwardMail: ReactorContract<
		SourceParameters<
			"asDraft" | "attachments" | "body" | "html" | "id" | "to",
			"both",
			["id", "to"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookGetMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOutlookGetMail: ReactorContract<
		SourceParameters<
			| "id"
			| "includeAttachments"
			| "includeDisplayBody"
			| "includeReplyRecipients"
			| "maxBodyChars",
			"both",
			["id"],
			1
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookListMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOutlookListMail: ReactorContract<
		SourceParameters<
			| "conversationId"
			| "folder"
			| "from"
			| "includeBody"
			| "limit"
			| "maxBodyChars"
			| "offset"
			| "sinceDays"
			| "subject"
			| "unreadOnly",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookListMailFoldersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOutlookListMailFolders: ReactorContract<
		SourceParameters<"limit" | "offset", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookMarkMailReadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOutlookMarkMailRead: ReactorContract<
		SourceParameters<"id" | "read", "both", ["id"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookMoveMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOutlookMoveMail: ReactorContract<
		SourceParameters<"folder" | "id", "both", ["id", "folder"], 2>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookReplyMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOutlookReplyMail: ReactorContract<
		SourceParameters<
			| "asDraft"
			| "attachments"
			| "body"
			| "cc"
			| "html"
			| "id"
			| "overrideRecipients"
			| "replyAll"
			| "to",
			"both",
			["id", "body"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookSaveDraftReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOutlookSaveDraft: ReactorContract<
		SourceParameters<
			"attachments" | "bcc" | "body" | "cc" | "html" | "subject" | "to",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookSendDraftReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOutlookSendDraft: ReactorContract<
		SourceParameters<"id", "both", ["id"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/outlook/MicrosoftOutlookSendMailReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftOutlookSendMail: ReactorContract<
		SourceParameters<
			| "attachments"
			| "bcc"
			| "body"
			| "cc"
			| "html"
			| "saveToSentItems"
			| "subject"
			| "to",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsCreateChatReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsCreateChat: ReactorContract<
		SourceParameters<
			"chatType" | "members" | "topic",
			"both",
			["members"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsDeleteChannelMessageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsDeleteChannelMessage: ReactorContract<
		SourceParameters<
			"channelId" | "messageId" | "replyId" | "teamId",
			"both",
			["teamId", "channelId", "messageId"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsDeleteChatMessageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsDeleteChatMessage: ReactorContract<
		SourceParameters<
			"chatId" | "messageId",
			"both",
			["chatId", "messageId"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsDownloadFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsDownloadFile: ReactorContract<
		SourceParameters<
			"channelId" | "driveId" | "fileName" | "id" | "teamId",
			"both",
			["id"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsDownloadMessageAttachmentReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsDownloadMessageAttachment: ReactorContract<
		SourceParameters<
			| "attachmentId"
			| "channelId"
			| "chatId"
			| "fileName"
			| "messageId"
			| "replyId"
			| "teamId",
			"both",
			["messageId"],
			4
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsGetChannelMessageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsGetChannelMessage: ReactorContract<
		SourceParameters<
			| "channelId"
			| "includeReplies"
			| "maxBodyChars"
			| "messageId"
			| "replyId"
			| "teamId",
			"both",
			["teamId", "channelId", "messageId"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsGetChatReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsGetChat: ReactorContract<
		SourceParameters<"chatId", "both", ["chatId"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsGetChatMessageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsGetChatMessage: ReactorContract<
		SourceParameters<
			"chatId" | "maxBodyChars" | "messageId",
			"both",
			["chatId", "messageId"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsListChannelMessagesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsListChannelMessages: ReactorContract<
		SourceParameters<
			| "channelId"
			| "includeReplies"
			| "limit"
			| "maxBodyChars"
			| "teamId",
			"both",
			["teamId", "channelId"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsListChannelsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsListChannels: ReactorContract<
		SourceParameters<"limit" | "teamId", "both", ["teamId"], 1>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsListChatMessagesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsListChatMessages: ReactorContract<
		SourceParameters<
			"chatId" | "includeDisplayBody" | "limit" | "maxBodyChars",
			"both",
			["chatId"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsListChatsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsListChats: ReactorContract<
		SourceParameters<"includeLastMessage" | "limit" | "unreadOnly", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsListFilesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsListFiles: ReactorContract<
		SourceParameters<
			"channelId" | "folderPath" | "limit" | "teamId",
			"both",
			["teamId", "channelId"],
			2
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsListTeamsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsListTeams: ReactorContract<
		SourceParameters<"limit", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsSendChannelMessageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsSendChannelMessage: ReactorContract<
		SourceParameters<
			| "attachmentNames"
			| "attachmentUrls"
			| "channelId"
			| "html"
			| "mentions"
			| "message"
			| "replyToId"
			| "subject"
			| "teamId",
			"both",
			["teamId", "channelId", "message"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsSendChatMessageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsSendChatMessage: ReactorContract<
		SourceParameters<
			| "attachmentNames"
			| "attachmentUrls"
			| "chatId"
			| "html"
			| "mentions"
			| "message"
			| "recipients",
			"both",
			["message"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/ms/teams/MicrosoftTeamsUploadFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MicrosoftTeamsUploadFile: ReactorContract<
		SourceParameters<
			| "channelId"
			| "conflictBehavior"
			| "filePath"
			| "folderPath"
			| "name"
			| "teamId",
			"both",
			["teamId", "channelId", "filePath"],
			4
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/salesforce/SalesforceCreateRecordReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SalesforceCreateRecord: ReactorContract<
		SourceParameters<
			"map" | "sObjectName",
			"both",
			["sObjectName", "map"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/salesforce/SalesforceDeleteRecordReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SalesforceDeleteRecord: ReactorContract<
		SourceParameters<
			"recordId" | "sObjectName",
			"both",
			["sObjectName", "recordId"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/salesforce/SalesforceObjectSchemaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SalesforceObjectSchema: ReactorContract<
		SourceParameters<"sObjectName", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/salesforce/SalesforceRecordByIdReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SalesforceRecordById: ReactorContract<
		SourceParameters<
			"recordId" | "sObjectName",
			"both",
			["sObjectName", "recordId"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/salesforce/SalesforceSoqlQueryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SalesforceSoqlQuery: ReactorContract<
		SourceParameters<"soqlQuery", "both", ["soqlQuery"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/salesforce/SalesforceSoslSearchReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SalesforceSoslSearch: ReactorContract<
		SourceParameters<"soslQuery", "both", ["soslQuery"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/salesforce/SalesforceUpdateRecordReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SalesforceUpdateRecord: ReactorContract<
		SourceParameters<
			"map" | "recordId" | "sObjectName",
			"both",
			["sObjectName", "recordId", "map"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/servicenow/ServiceNowCreateRecordReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ServiceNowCreateRecord: ReactorContract<
		SourceParameters<
			"instanceURL" | "map" | "table",
			"both",
			["table", "instanceURL", "map"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/servicenow/ServiceNowDeleteRecordReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ServiceNowDeleteRecord: ReactorContract<
		SourceParameters<
			"instanceURL" | "sysId" | "table",
			"both",
			["table", "sysId", "instanceURL"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/servicenow/ServiceNowListTablesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ServiceNowListTables: ReactorContract<
		SourceParameters<"instanceURL", "both", ["instanceURL"], 1>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/servicenow/ServiceNowRetrieveRecordsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ServiceNowRetrieveRecords: ReactorContract<
		SourceParameters<
			"instanceURL" | "limit" | "table",
			"both",
			["table", "limit", "instanceURL"],
			3
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/servicenow/ServiceNowRetrieveSingleRecordReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ServiceNowRetrieveSingleRecord: ReactorContract<
		SourceParameters<
			"instanceURL" | "sysId" | "table",
			"both",
			["table", "sysId", "instanceURL"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/servicenow/ServiceNowTableMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ServiceNowTableMetadata: ReactorContract<
		SourceParameters<
			"instanceURL" | "table",
			"both",
			["table", "instanceURL"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/servicenow/ServiceNowUpdateRecordReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ServiceNowUpdateRecord: ReactorContract<
		SourceParameters<
			"instanceURL" | "map" | "sysId" | "table",
			"both",
			["table", "sysId", "instanceURL", "map"],
			4
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/io/connector/surveymonkey/SurveyMonkeyListSurveysReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SurveyMonkeyListSurveys: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
}
