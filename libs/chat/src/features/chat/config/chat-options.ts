import type { MCP } from "../../../types";
import type { CompactionStrategy } from "../../room/store/room-compaction";
import type { NewChatDefaults } from "./new-chat-defaults";

/**
 * How a new chat's mode is chosen.
 *
 * - `chat-only`: every chat runs in chat mode; agent mode is never offered.
 * - `choice`: users pick with the Chat and Agent choice.
 * - `follows-agent`: the agent picker decides: a saved agent or Default Agent
 *   runs in agent mode, No Agent in chat mode.
 * - `agent-only`: every new chat runs in agent mode, with Default Agent unless
 *   a saved agent is picked. Chats already created keep their mode.
 */
export type AgentModePolicy =
	| "chat-only"
	| "choice"
	| "follows-agent"
	| "agent-only";

/** A room's actions, in the order every menu lists them. */
export const ROOM_ACTION_IDS = [
	"favorite",
	"publish",
	"rename",
	"download",
	"delete",
] as const;

/** The id of one of a room's actions. */
export type RoomActionId = (typeof ROOM_ACTION_IDS)[number];

/**
 * A response's actions, in the order they are shown. `feedback` is the
 * thumbs up and down; `copy` copies its text or image.
 */
export const MESSAGE_ACTION_IDS = [
	"rewrite",
	"feedback",
	"copy",
	"download",
] as const;

/** The id of one of a response's actions. */
export type MessageActionId = (typeof MESSAGE_ACTION_IDS)[number];

/**
 * A rule that turns an error into the message shown: the first whose
 * `pattern` is in the error's message wins, showing its `text` or the chat's
 * translation of `gracefulErrors.<errorKey>`.
 */
export type GracefulError =
	| { readonly pattern: string; readonly errorKey: string }
	| { readonly pattern: string; readonly text: string };

/**
 * What the chat is configured with: data the host owns, in the chat's words.
 * Every field but `roomHref` is optional; the chat fills each gap from
 * `DEFAULT_CHAT_OPTIONS`, so a host sets only what it changes. Keep the
 * object's identity stable: a new one makes a new chat store.
 */
export interface ChatOptions {
	/** A room's link, so it opens in a new tab like any link. */
	readonly roomHref: (roomId: string) => string;
	/** An agent's link; without it, chat UI shows no agent links. */
	readonly agentHref?: (workspaceId: string) => string;
	/** Where the SEMOSS platform app is served, for catalog links and tool UIs. */
	readonly platformUrl?: string;
	/**
	 * The origin tool views frame an app's pages from, such as the desktop
	 * app's second local origin, so a tool's page is on another origin than
	 * chat UI and cannot script it. Without it, they are framed from the
	 * module as it is.
	 */
	readonly toolFrameOrigin?: string;
	/**
	 * A catalog item's page on the platform, which the knowledge and toolbox
	 * pickers link to; without it, they show no platform links.
	 */
	readonly catalogItemHref?: (item: MCP) => string;
	/** The app's name, used to title a downloaded room. Default: "Chat". */
	readonly appName?: string;
	/**
	 * What a new chat starts with when neither this login session nor the
	 * user names it.
	 */
	readonly newChat?: NewChatDefaults;
	/** How a new chat's mode is chosen. Default: `chat-only`. */
	readonly agentMode?: AgentModePolicy;
	/**
	 * Whether users pick a chat's model. Without it, every chat runs
	 * `newChat.modelId`. Default: true.
	 */
	readonly isModelSelectable?: boolean;
	/** Whether users set a chat's temperature. Default: false. */
	readonly isTemperatureEditable?: boolean;
	/** Whether the composer offers to optimize a prompt. Default: true. */
	readonly hasPromptOptimizer?: boolean;
	/** Whether a table in a response can be exported. Default: false. */
	readonly isTableExportable?: boolean;
	/** Whether rating a response asks for a comment. Default: true. */
	readonly hasFeedbackComment?: boolean;
	/** Whether the catalog pickers list items tagged SYSTEM. Default: true. */
	readonly hasSystemCatalogItems?: boolean;
	/**
	 * Whether a new knowledge source is made an MCP (MakeEngineMCP), and the
	 * knowledge picker lists only those. Default: true.
	 */
	readonly shouldMakeKnowledgeMcp?: boolean;
	/** Whether a new knowledge source's embedder can be picked. Default: true. */
	readonly isEmbedderSelectable?: boolean;
	/** The embedder a new knowledge source starts with. Default: none. */
	readonly defaultEmbedderId?: string;
	/**
	 * The extensions of files sent to the model with a message; other files
	 * are only uploaded. Default: none, which sends every file.
	 */
	readonly allowedFileTypes?: readonly string[];
	/** A note shown while files are dragged over the composer. Default: none. */
	readonly fileDragDisclaimer?: string;
	/** Link prefixes a response may use beside the chat's own. Default: none. */
	readonly allowedUrlPrefixes?: readonly string[];
	/** How many auto tool calls run at once. Default: the chat's own limit. */
	readonly toolAutoExecutionLimit?: number | null;
	/** How a room's context is compacted until the user picks. Default: `AUTO`. */
	readonly compactionStrategy?: CompactionStrategy;
	/** Rules that turn errors into friendlier messages. Default: none. */
	readonly gracefulErrors?: readonly GracefulError[];
	/**
	 * The room's actions, handed the chat's and returning the host's, as in
	 * leaving out `favorite` where the host shows no room history. They apply
	 * everywhere a room's actions are listed: the room's menu, the room
	 * history's, and the "/" menu's Room group. Default: all.
	 */
	readonly roomActions?: (
		actions: readonly RoomActionId[],
	) => readonly RoomActionId[];
	/**
	 * A response's actions, handed the chat's and returning the host's.
	 * Default: all.
	 */
	readonly messageActions?: (
		actions: readonly MessageActionId[],
	) => readonly MessageActionId[];
}

/** The options every chat fills in when a host leaves them out. */
type DefaultedOption = Exclude<
	keyof ChatOptions,
	| "roomHref"
	| "agentHref"
	| "platformUrl"
	| "toolFrameOrigin"
	| "catalogItemHref"
	| "toolAutoExecutionLimit"
>;

/** A host's {@link ChatOptions} with every default filled in. */
export type ResolvedChatOptions = ChatOptions & {
	readonly [K in DefaultedOption]-?: NonNullable<ChatOptions[K]>;
};

/** Hands back the list it is given: every action the chat has. */
const keepAll = <T>(items: readonly T[]): readonly T[] => items;

/** The chat's own options, used for anything a host leaves out. */
export const DEFAULT_CHAT_OPTIONS: {
	readonly [K in DefaultedOption]-?: NonNullable<ChatOptions[K]>;
} = {
	appName: "",
	newChat: {},
	agentMode: "chat-only",
	isModelSelectable: true,
	isTemperatureEditable: false,
	hasPromptOptimizer: true,
	isTableExportable: false,
	hasFeedbackComment: true,
	hasSystemCatalogItems: true,
	shouldMakeKnowledgeMcp: true,
	isEmbedderSelectable: true,
	defaultEmbedderId: "",
	allowedFileTypes: [],
	fileDragDisclaimer: "",
	allowedUrlPrefixes: [],
	compactionStrategy: "AUTO",
	gracefulErrors: [],
	roomActions: keepAll,
	messageActions: keepAll,
};

/** One resolved object per host options object, so the store and UI agree. */
const resolved = new WeakMap<ChatOptions, ResolvedChatOptions>();

/**
 * Fill the gaps in a host's options from the chat's defaults. An option set
 * to `undefined` counts as left out.
 *
 * @param options - The host's options.
 * @returns The options with every default filled in; the same object every
 * time for the same host options.
 */
export const resolveChatOptions = (
	options: ChatOptions,
): ResolvedChatOptions => {
	const cached = resolved.get(options);
	if (cached) return cached;
	const set = Object.fromEntries(
		Object.entries(options).filter(([, value]) => value !== undefined),
	) as ChatOptions;
	const next: ResolvedChatOptions = { ...DEFAULT_CHAT_OPTIONS, ...set };
	resolved.set(options, next);
	return next;
};
