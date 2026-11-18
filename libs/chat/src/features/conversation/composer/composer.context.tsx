import { createContext } from "react";
import type { MCPConfig } from "@semoss/shared";
import type { RoomStore } from "../../room/store/room.store";
import type { AgentChoice } from "../../tools/mcp/agent-choice";
import type { MCPOverlayTab } from "../../tools/mcp/mcp-overlay-picker";
import type { NewRoomWorkbenchPanels } from "../../workbench/rail/use-workbench-panels";
import type { PromptLibraryItem } from "./prompt-library-dialog";

/**
 * What the composer gives the items of its plus menu and the commands of its
 * "/" menu, the chat's own and a host's: an open room's or a new chat's.
 */
export interface Composer {
	/** The room the composer sends to, or a new chat's draft. */
	readonly room: RoomStore;
	/** Whether this is a new chat, before its first message. */
	readonly isNewChat: boolean;
	/** Whether a turn is running, which locks what would change the chat. */
	readonly isBusy: boolean;
	/** The room's options, for the selected agent and the resource counts. */
	readonly options: RoomStore["options"];
	/** The tools and knowledge the room's agent brings, counted with the room's own. */
	readonly agentTools: readonly MCPConfig[];
	/** Whether the chat runs in agent mode. */
	readonly isAgentMode: boolean;
	/**
	 * How the chat offers its agent: a new chat's lists the agent picker, and
	 * the Chat and Agent choice when it is `saved` `withModeChoice`.
	 */
	readonly agent: AgentChoice;
	/** Close the plus menu; nothing happens outside it. */
	readonly closeMenu: () => void;
	/**
	 * Open the knowledge, toolbox, or agent picker, after the plus menu
	 * closes, so focus moves to the picker.
	 */
	readonly openPicker: (tab: MCPOverlayTab) => void;
	/** Switch the chat to agent mode. */
	readonly switchToAgent: () => void;
	/** Switch a new chat back to chat mode; null in an open room. */
	readonly switchToChat: (() => void) | null;
	/** Compact the conversation; null in a new chat. */
	readonly compact: (() => void) | null;
	/** The prompts the chat offers. */
	readonly prompts: readonly PromptLibraryItem[];
	/** Send one of those prompts. */
	readonly runPrompt: (prompt: PromptLibraryItem) => void;
	/**
	 * The room something a host keeps for the chat belongs to, such as the
	 * desktop app's attached folders: an open room itself, or the room a new
	 * chat prepares before its first message.
	 *
	 * @returns The room, or null when it cannot be prepared now.
	 */
	readonly prepareRoom: () => Promise<RoomStore | null>;
	/** Show the room's Files in its Workspace. */
	readonly openFiles: () => void;
}

/** Where the composer's "/" menu opens Workspace panels. */
export interface ComposerWorkbench {
	/** The room whose Workspace the panels open in. */
	readonly room: RoomStore;
	/** A new chat's own panel actions, until its first message. */
	readonly newRoomPanels?: NewRoomWorkbenchPanels;
}

/** The composer, for its menus' items. Null outside a composer. */
export const ComposerContext = createContext<Composer | null>(null);

/** Where the composer's "/" menu opens panels. Null outside a composer. */
export const ComposerWorkbenchContext = createContext<ComposerWorkbench | null>(
	null,
);
