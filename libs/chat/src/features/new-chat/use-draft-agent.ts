import { useEffect, useMemo, useState } from "react";
import { useSession, useSessionPixel } from "@semoss/sdk/react";
import type { ChatMode, Prompt } from "../../types";
import {
	readDeploymentNewChatDefaults,
	readNewChatPreferences,
	readSessionNewChat,
	resolveNewChatAgentId,
	resolveNewChatMode,
} from "../chat/config/new-chat-preferences";
import { useChatConfig } from "../chat/config/use-chat-config";
import { useChatSession } from "../chat/provider/use-chat-session";
import { useChatSelector } from "../chat/store/use-chat-selector";
import {
	canChooseAgentMode,
	offersAgentMode,
} from "../conversation/composer/agent-mode-choice";
import type { ComposerSession } from "../conversation/composer/use-composer-session";
import type { RoomStore } from "../room/store/room.store";
import { useRoomSelector } from "../room/store/use-room-selector";
import type { AgentChoice, AgentRef } from "../tools/mcp/agent-choice";
import { runsDefaultAgent } from "../tools/mcp/mcp-utils";
import {
	type AgentWorkspaceRead,
	useAgentWorkspace,
} from "../tools/mcp/use-agent-workspace";
import { clearAgentOptions } from "./clear-agent-options";

/** What {@link useDraftAgent} returns. */
export interface DraftAgent {
	/** The mode the chat starts in. */
	readonly mode: ChatMode;
	/** The saved agent the chat starts with, or empty for none. */
	readonly agentId: string;
	/** The read of the agent asked for, with its Retry. */
	readonly agent: AgentWorkspaceRead;
	/** Whether the agent's options have not reached the draft yet, so sending waits. */
	readonly isAgentOptionsPending: boolean;
	/** Whether the agent asked for could not be read. */
	readonly hasAgentLoadFailed: boolean;
	/** Whether the agent is the one the page's agent link names. */
	readonly isAgentFromLink: boolean;
	/** The draft's model, options and agent, for the composer and Settings. */
	readonly session: ComposerSession;
	/** Picks the mode, from the Chat and Agent choice. */
	readonly chooseMode: (mode: ChatMode) => void;
}

/** An agent the user picked, and the agent link the page had then. */
interface AgentPick {
	readonly agentId: string;
	readonly linkAgentId: string | null;
}

/** The agent whose options were merged into a draft, and whether it set the model. */
interface AppliedAgent {
	readonly room: RoomStore;
	readonly agentId: string;
	readonly hasSetModel: boolean;
}

/** No predefined prompts, the same array every time. */
const NO_PROMPT_IDS: readonly string[] = [];

/**
 * A new chat's agent and mode. The chat starts as the last chat started in
 * this login session did, else as the user's defaults say (Settings >
 * General), else as the deployment's do; an agent link wins over all three,
 * and a default agent the user can no longer open gives way to Default Agent.
 * The picked agent's instructions, toolboxes, prompts and model are merged
 * into the draft once it is read, keeping the knowledge and tools the user
 * added. With `modeFollowsAgent` the agent decides the mode.
 *
 * @param newRoom - The draft that holds the new chat's options.
 * @param linkAgentId - The agent the page's agent link names, if any.
 * @returns The mode, the agent and its read, and the draft's session.
 */
export const useDraftAgent = (
	newRoom: RoomStore,
	linkAgentId: string | null,
): DraftAgent => {
	const { theme, newChatDefaults } = useChatConfig();
	const { chat } = useChatSession();
	const lastLogin = useSession((state) => state.user?.lastLogin);
	const userMeta = useSession((state) => state.user?.meta);
	// Read once: a default changed meanwhile applies to the next new chat.
	const [initial] = useState(() => {
		const session = readSessionNewChat(lastLogin);
		const preferences = readNewChatPreferences(userMeta);
		const deployment = readDeploymentNewChatDefaults(
			theme,
			newChatDefaults,
		);
		const mode = resolveNewChatMode(
			session,
			preferences,
			deployment,
			offersAgentMode(theme.featureFlags),
		);
		return {
			mode,
			// an agent link names its own agent
			agentId:
				mode === "agent" && !linkAgentId
					? resolveNewChatAgentId(session, preferences, deployment)
					: "",
		};
	});
	const [chosenMode, setChosenMode] = useState<ChatMode>(initial.mode);
	// The user's pick holds while the link stays the one it was made under;
	// a new link names its own agent. The link the page opened with counts as
	// picked, so the agent stays when the link goes.
	const [pick, setPick] = useState<AgentPick | null>(() =>
		linkAgentId ? { agentId: linkAgentId, linkAgentId } : null,
	);
	const requestedAgentId =
		pick && pick.linkAgentId === linkAgentId
			? pick.agentId
			: linkAgentId || (pick?.agentId ?? initial.agentId);
	const agent = useAgentWorkspace(requestedAgentId);
	// the defaults' agent, one the user can no longer open, is dropped quietly
	// for Default Agent rather than shown as an error
	const isDefaultAgentGone =
		!pick && !linkAgentId && agent.status === "ERROR";
	const agentId = isDefaultAgentGone ? "" : requestedAgentId;
	const modeFollowsAgent = !!theme.featureFlags?.modeFollowsAgent;
	const mode: ChatMode = modeFollowsAgent && agentId ? "agent" : chosenMode;

	const [applied, setApplied] = useState<AppliedAgent | null>(null);
	const isApplied = applied?.room === newRoom && applied.agentId === agentId;
	const isAgentOptionsPending = Boolean(agentId) && !isApplied;
	const workspace = agentId ? agent.workspace : null;

	// The draft's mode is read by the composer, its slash menu and the room
	// it prepares, which all take the draft as their room.
	useEffect(() => {
		newRoom.setMode(mode);
	}, [mode, newRoom]);

	// merge the agent's instructions, toolboxes and model into the draft, once
	// per agent picked: a refetch keeps a model the user then picked by hand
	useEffect(() => {
		if (!workspace || isApplied) return;
		// An agent that names a default model switches the picker to it. An
		// agent with no default leaves the current model alone.
		const agentModelId = workspace.config_json?.model_id ?? "";
		if (agentModelId) void chat.selectModelById(agentModelId);
		setApplied({ room: newRoom, agentId, hasSetModel: !!agentModelId });
		// the agent's tools stay apart from the knowledge and tools the user adds
		newRoom.setAgentTools(agentId, workspace.mcp);
		newRoom.setOptions({
			instructions: workspace.system_prompt || "",
			workspace: {
				workspace_id: agentId,
				name: workspace.display_name || workspace.name,
			},
		});
	}, [workspace, isApplied, agentId, newRoom, chat]);

	// the agent's predefined prompts, read by id and put on the draft
	const promptIds = useMemo(
		() => workspace?.prompts.map((prompt) => prompt.id) ?? NO_PROMPT_IDS,
		[workspace],
	);
	const getPrompts = useSessionPixel<Prompt[]>(
		promptIds.length > 0
			? `META | ListPrompt(filters=[Filter( (PROMPT__ID == [${promptIds.map((p) => `"${p}"`).join(", ")}]) )])`
			: "",
		{ data: [] },
	);
	useEffect(() => {
		if (
			promptIds.length === 0 ||
			getPrompts.status !== "SUCCESS" ||
			!getPrompts.data?.length
		) {
			return;
		}
		newRoom.setOptions({
			predefinedPrompts: getPrompts.data
				.filter((prompt) => promptIds.includes(prompt.id))
				.map((p) => ({
					id: p.id,
					title: p.title,
					context: p.context,
					tags: p.tags,
					version: p.version,
					intent: p.intent,
					// TODO: figure out why this is done this way
					createdBy: (p as unknown as { created_by: string })
						.created_by,
					dateCreated: (p as unknown as { date_created: string })
						.date_created,
					global: false, // TODO: figure out if this is needed
				})),
		});
	}, [promptIds, getPrompts.status, getPrompts.data, newRoom]);

	/**
	 * Pick an agent, or none. A different agent's options replace the last
	 * one's, keeping the knowledge and tools the user added by hand, and the
	 * new one's arrive once it is read.
	 *
	 * @param next - The agent, or null for none.
	 */
	const changeAgent = (next: AgentRef | null): void => {
		if (next?.workspace_id !== newRoom.options.workspace?.workspace_id) {
			// an agent's model gives way to the new chat's default with it
			if (!next && isApplied && applied?.hasSetModel) {
				chat.selectNewChatDefaultModel();
			}
			setApplied(null);
			newRoom.setOptions({
				...clearAgentOptions(newRoom.options),
				workspace: next ?? undefined,
			});
		}
		setPick({ agentId: next?.workspace_id ?? "", linkAgentId });
	};

	const options = useRoomSelector(newRoom, (current) => current.options);
	const agentTools = useRoomSelector(
		newRoom,
		(current) => current.agentTools,
	);
	const model = useChatSelector(chat, (current) => current.models.selected);
	const isAgentMode = mode === "agent";
	// With modeFollowsAgent the agent picker decides the mode: a saved agent
	// or Default Agent runs in agent mode, No Agent in chat mode.
	const agentChoice: AgentChoice = modeFollowsAgent
		? {
				kind: "savedOrDefault",
				isDefaultAgent: runsDefaultAgent({
					workspace: options.workspace,
					isAgentMode,
				}),
			}
		: {
				kind: "saved",
				withModeChoice: canChooseAgentMode(theme.featureFlags),
			};

	return {
		mode,
		agentId,
		agent,
		isAgentOptionsPending,
		hasAgentLoadFailed: isAgentOptionsPending && agent.status === "ERROR",
		isAgentFromLink: !!linkAgentId && linkAgentId === agentId,
		session: {
			model,
			options,
			agentTools,
			isAgentMode,
			agent: agentChoice,
			onModelChange: (next) => {
				if (next) chat.setSelectedModel(next);
			},
			onOptionsChange: (next) => {
				if ("workspace" in next) changeAgent(next.workspace ?? null);
				newRoom.setOptions(next);
			},
			onDefaultAgentChange: (isDefaultAgent) =>
				setChosenMode(isDefaultAgent ? "agent" : "chat"),
		},
		chooseMode: setChosenMode,
	};
};
