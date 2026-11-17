import type { ThemeMap } from "@semoss/shared";
import type {
	WorkbenchPanelConfigAny,
	WorkbenchSnapshot,
} from "@semoss/workbench";
import type { ChatMode, Engine, MCPConfig, Prompt } from "../../../types";
import type {
	MessageKey,
	MessageMap,
} from "../../conversation/store/message-map";
import type { ToolData } from "../../conversation/store/tool.store";
import type { LocalFoldersHost } from "../../local-folders/store/local-folders-host";

/** No agent tools; one array, so a room without an agent keeps its snapshot. */
export const NO_AGENT_TOOLS: readonly MCPConfig[] = [];

/** What a room holds. Every field is readonly. */
export interface RoomSnapshot {
	/** The room's id. */
	readonly roomId: string;

	/**
	 * The insight the room runs its pixels in. A new room starts on "new";
	 * `initialize` binds it to the insight the backend gives the room.
	 */
	readonly insightId: string;

	/** Whether the room is running a pixel or a turn. */
	readonly isLoading: boolean;

	/** The room's last failure, or null once a later run succeeds. */
	readonly error?: Error | null;

	/** How the room sends its messages. */
	readonly mode: ChatMode;

	/** What the room list shows about the room. */
	readonly metadata: {
		/** The room's name. */
		name: string;

		/** When the room was created. */
		dateCreated: string;
	};

	/**
	 * Every message of the room, on every branch, by client key: plain data,
	 * linked by keys. A change to one message replaces only its entry (and the
	 * map), so every other entry keeps its reference. A message taken from the
	 * tree is deleted with everything below it, and a load replaces the map.
	 */
	readonly messages: MessageMap;

	/** The hidden message every conversation in the room hangs from, until the room loads. */
	readonly rootKey: MessageKey | null;

	/**
	 * The agent's scripted opening message, rendered as the first bubble in
	 * the transcript. Re-read from the workspace on every initialize() — not
	 * a message, never sent to the model. Empty when there is none.
	 */
	readonly agentGreeting: string;

	/** Every tool call the room has seen, by id. */
	readonly tools: Readonly<Record<string, ToolData>>;

	/**
	 * The tools and knowledge the room's agent brings, read from the agent
	 * when the room loads and whenever its agent changes. The backend adds
	 * them to every turn itself, so they are never in `options.mcp`.
	 */
	readonly agentTools: readonly MCPConfig[];

	/** The model the room chats with. */
	readonly model: Engine;

	/** The room's settings, sent with each message and saved on the backend. */
	readonly options: {
		/** The instructions passed to the model. */
		instructions: string;

		/**
		 * The room's own MCPs, which the backend stores. The agent's are in
		 * `agentTools`.
		 */
		mcp: MCPConfig[];

		/** The agent (workspace) the room was started from. */
		workspace?: {
			/** The agent's id, as the backend names it. */
			workspace_id: string;
			/** The agent's display name, read when the room loads. */
			name?: string;
		};

		/** Prompts the room offers in its slash menu. */
		predefinedPrompts: Prompt[];

		/**
		 * Agent harness to run messages through (e.g. "semoss"). When set, the
		 * room runs in agent mode and messages are sent via RunAgent instead of
		 * AskPlayground. Persisted so the mode survives a reload.
		 */
		harnessType?: string;

		/**
		 * Temperature of the model (0–1). Only used when enableTemperature is true.
		 */
		temperature?: number;

		/**
		 * How this chat runs each default tool: `auto`, `ask`, or `disabled`,
		 * by tool name, for the tools set apart from their usual way. The
		 * browser sends the tools that are not disabled with every chat
		 * message; the backend only stores the setting.
		 */
		defaultTools?: Record<string, "auto" | "ask" | "disabled">;
	};

	/** The Workspace's on-screen state. */
	readonly sidebar: {
		/**
		 * Whether the Workspace is open.
		 *
		 * Only whether the panel is on screen. What is *in* it lives in the
		 * room's workbench store, which outlives every open/close.
		 */
		isOpen: boolean;
	};

	/** The arrangement the room's first sidebar mount starts from; see `sidebarSnapshot`. */
	readonly sidebarSnapshot: WorkbenchSnapshot;

	/** Whether a cancellable streaming job is in flight and not yet stopped. */
	readonly canCancelJob: boolean;

	/** Whether a stop of the streaming jobs is still unwinding. */
	readonly isCancellingJob: boolean;

	/**
	 * Whether a tool-phase stop is committing (cancelling the remaining tool
	 * calls), where there is no stream job to track.
	 */
	readonly isCancellingTools: boolean;
}

/** A room before it loads; the constructor adds its ids and arrangement. */
export const INITIAL_ROOM: Omit<
	RoomSnapshot,
	"roomId" | "insightId" | "sidebarSnapshot"
> = {
	isLoading: false,
	mode: "chat",
	metadata: {
		name: "",
		dateCreated: "",
	},
	model: null as unknown as Engine,
	messages: {},
	rootKey: null,
	agentGreeting: "",
	tools: {},
	agentTools: NO_AGENT_TOOLS,
	options: {
		predefinedPrompts: [],
		instructions: "",
		mcp: [],
		temperature: undefined,
	},
	sidebar: {
		isOpen: false,
	},
	canCancelJob: false,
	isCancellingJob: false,
	isCancellingTools: false,
};

/** The room's settings, sent with each message and saved on the backend. */
export type RoomOptions = RoomSnapshot["options"];

/** What a room is built from. */
export interface RoomStoreOptions {
	/** The playground theme. */
	theme: ThemeMap["playground"];
	/** The room's id. */
	roomId: string;
	/** The insight to start on; "new" until the room loads. */
	insightId?: string;
	/**
	 * The sidebar's panel blueprints. Handed in rather than imported: they
	 * render the chat's components, which import the room's store, so
	 * importing them there would close a module cycle. The composition root
	 * passes them down.
	 */
	panelComponents: Record<string, WorkbenchPanelConfigAny>;
	/**
	 * Whether the Workspace's rail offers Files. A new chat's draft has no
	 * insight for Files to read, so it leaves Files out until it prepares the
	 * room that takes its arrangement.
	 */
	includeFiles?: boolean;
	/**
	 * The host's way to the user's own files, where it has one (the desktop
	 * app); the room then keeps the folders attached to it.
	 */
	localFolders?: LocalFoldersHost;
}
