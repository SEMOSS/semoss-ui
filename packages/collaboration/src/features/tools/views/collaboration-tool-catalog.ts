import type { ConversationTool } from "@/features/messages/types/message";

/** A family shares its presentation while each call keeps its own result and arguments. */
export interface CollaborationToolDefinition {
	title: string;
	family:
		| "calendar"
		| "topics"
		| "mail"
		| "teams"
		| "files"
		| "memory"
		| "routines"
		| "skills";
	collection?: string;
	view?: string;
}

/** The dedicated tools, including ones available only to routines or the owner's chat. */
export const COLLABORATION_TOOL_VIEWS = {
	ListCalendars: {
		title: "Calendars",
		family: "calendar",
		collection: "calendars",
	},
	ListEvents: {
		title: "Calendar events",
		family: "calendar",
		view: "calendar/agenda",
	},
	GetEvent: {
		title: "Calendar event",
		family: "calendar",
		view: "calendar/event",
	},
	GetSchedule: {
		title: "Availability",
		family: "calendar",
		view: "calendar/availability",
	},
	CreateEvent: {
		title: "Create an event",
		family: "calendar",
		view: "calendar/event-edit?intent=create",
	},
	UpdateEvent: {
		title: "Update an event",
		family: "calendar",
		view: "calendar/event-edit?intent=update",
	},
	DeleteEvent: {
		title: "Delete an event",
		family: "calendar",
		view: "calendar/event?intent=delete",
	},
	RespondToEvent: {
		title: "Respond to an invitation",
		family: "calendar",
		view: "calendar/event?intent=respond",
	},
	ListTopics: { title: "Topics", family: "topics", collection: "items" },
	SearchMail: { title: "Mail search", family: "mail", collection: "items" },
	ReadThread: {
		title: "Conversation",
		family: "mail",
		collection: "messages",
	},
	EditTopic: { title: "Update a topic", family: "topics" },
	EditThread: { title: "Organize a conversation", family: "topics" },
	TagTopic: { title: "Chat topic", family: "topics" },
	ListM365Mail: { title: "Outlook mail", family: "mail", view: "mail/list" },
	ComposeEmail: { title: "Email draft", family: "mail" },
	SendEmail: { title: "Send email", family: "mail" },
	SaveDraft: {
		title: "Save an Outlook draft",
		family: "mail",
		view: "mail/compose?intent=draft",
	},
	DownloadAttachment: { title: "Email attachment", family: "files" },
	ShowItem: { title: "Item preview", family: "files" },
	ListTeams: { title: "Teams", family: "teams", collection: "teams" },
	ListChannels: {
		title: "Channels",
		family: "teams",
		collection: "channels",
	},
	ListChannelFiles: {
		title: "Channel files",
		family: "files",
		collection: "files",
	},
	DownloadChannelFile: { title: "Channel file download", family: "files" },
	UploadChannelFile: { title: "Upload a channel file", family: "files" },
	ListChats: { title: "Teams chats", family: "teams", collection: "chats" },
	GetChat: { title: "Teams chat", family: "teams" },
	ListChatMessages: {
		title: "Chat messages",
		family: "teams",
		collection: "messages",
	},
	SearchTeamsMessages: {
		title: "Teams message search",
		family: "teams",
		collection: "messages",
	},
	GetChatMessage: { title: "Chat message", family: "teams" },
	SendChatMessage: { title: "Send a chat message", family: "teams" },
	DownloadMessageAttachment: { title: "Chat attachment", family: "files" },
	ListDrives: { title: "Drives", family: "files", collection: "drives" },
	ListDriveFiles: {
		title: "Drive files",
		family: "files",
		collection: "files",
	},
	ListSharedFiles: {
		title: "Shared files",
		family: "files",
		collection: "files",
	},
	SearchFiles: { title: "File search", family: "files", collection: "files" },
	GetFile: { title: "File details", family: "files" },
	DownloadDriveFile: { title: "File download", family: "files" },
	CreateDriveFolder: { title: "Create a OneDrive folder", family: "files" },
	UploadDriveFile: { title: "Upload a file to OneDrive", family: "files" },
	Remember: { title: "Remember a detail", family: "memory" },
	Forget: { title: "Forget a memory", family: "memory" },
	SearchMemories: {
		title: "Memories",
		family: "memory",
		collection: "items",
	},
	CreateRoutine: { title: "Save a routine", family: "routines" },
	ListRoutines: {
		title: "Your routines",
		family: "routines",
		collection: "routines",
	},
	ManageRoutine: { title: "Manage a routine", family: "routines" },
	ListMySkills: {
		title: "Your skills",
		family: "skills",
		collection: "skills",
	},
	OpenSkill: { title: "Skill instructions", family: "skills" },
	PublishSkill: { title: "Publish a skill", family: "skills" },
	UseSkillInAssistant: { title: "Assistant skills", family: "skills" },
	DeleteMySkill: { title: "Delete a skill", family: "skills" },
} satisfies Record<string, CollaborationToolDefinition>;

export type CollaborationToolName = keyof typeof COLLABORATION_TOOL_VIEWS;

/** Recognize exact built-in names without taking over an attached MCP with a similar name. */
function collaborationToolName(
	tool: ConversationTool,
): CollaborationToolName | undefined {
	if (
		tool.serverTool ||
		(tool.metadata?.SMSS_ENGINE_ID &&
			tool.metadata.SMSS_TOOL_KIND !== "semoss_collaboration_tool")
	)
		return undefined;
	return Object.hasOwn(COLLABORATION_TOOL_VIEWS, tool.name)
		? (tool.name as CollaborationToolName)
		: undefined;
}

/** Explicit custom UIs win. The name fallback also gives older saved calls a native view. */
export function collaborationToolViewUri(
	tool: ConversationTool,
): string | undefined {
	if (tool.serverTool || tool.uiUrl) return undefined;
	const ui = tool.metadata?.SMSS_MCP_UI;
	const resource =
		typeof ui === "object" && ui !== null && "resourceURI" in ui
			? ui.resourceURI
			: undefined;
	if (typeof resource === "string" && resource.trim())
		return resource.startsWith("component://") ? resource : undefined;
	const name = collaborationToolName(tool);
	if (!name) return undefined;
	const definition: CollaborationToolDefinition =
		COLLABORATION_TOOL_VIEWS[name];
	return definition.view
		? `component://${definition.view}${definition.view.includes("?") ? "&" : "?"}provider=microsoft`
		: `component://collaboration/tool?tool=${name}`;
}
