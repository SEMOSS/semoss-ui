import {
	BookOpenIcon,
	BotIcon,
	ChevronsDownUpIcon,
	HammerIcon,
	MessageCircleIcon,
	PanelRightCloseIcon,
	PaperclipIcon,
	SparklesIcon,
	TextQuoteIcon,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import type { SlashCommand } from "@/components/common/lexical/slash-command/types";
import type { PromptLibraryItem } from "@/components/prompts/prompt-library-dialog";
import { useRoomActionsContext } from "@/features/room-actions/room-actions.context";
import { useRoomActionItems } from "@/features/room-actions/use-room-action-items";
import {
	type NewRoomWorkbenchPanels,
	useWorkbenchPanels,
} from "@/features/workbench/use-workbench-panels";
import { WorkbenchPanelIcon } from "@/features/workbench/workbench-panel-icon";
import type { RoomStore } from "@/stores/room/room.store";

/** Other words a Workspace panel's command is found by, such as old names. */
const PANEL_KEYWORDS: Readonly<Record<string, string[]>> = {
	settings: [
		"room-options",
		"options",
		"model",
		"instructions",
		"tools",
		"default tools",
	],
};

/** What the composer hands {@link useRoomSlashCommands}. */
interface RoomSlashCommandsOptions {
	/** The room the composer sends to, or the new room before a chat's first message. */
	room: RoomStore;
	/** The room whose Workspace the panels open in; defaults to `room`. */
	workbenchRoom?: RoomStore;
	/** A new chat's own actions, until its first message. */
	newRoomPanels?: NewRoomWorkbenchPanels;
	/** Opens the knowledge, toolbox, or agent picker. */
	onOpenMcpOverlay: (tab: "AGENT" | "TOOLBOX" | "KNOWLEDGE") => void;
	/** Opens the file picker for the next message. */
	onAttachFiles: () => void;
	/** Compacts the conversation; leaves Compact out when absent. */
	onCompact?: () => void;
	/** Switches the chat to the agent harness. */
	onSwitchToAgent: () => void;
	/** Switches a new chat back to chat mode; leaves it out when absent. */
	onSwitchToChat?: () => void;
	/** Whether an agent can be chosen, which only a new chat allows. */
	canChooseAgent: boolean;
	/** The prompts the chat offers. */
	prompts: PromptLibraryItem[];
	/** Sends one of those prompts. */
	onRunPrompt: (prompt: PromptLibraryItem) => void;
}

/**
 * Every action the composer's "/" menu offers: adding to the next message,
 * switching mode, and compacting; each Workspace panel that can open now and
 * Close Workspace; the room's own actions, inside a room; and the room's
 * prompts. Panels share their labels with the Workbench rail and room actions
 * with Settings' Room section, so a command is found by the name it has there.
 * Call it from an observer: the panels are read from MobX.
 *
 * @param options - The composer's room and its actions.
 * @return The commands, by group.
 */
export const useRoomSlashCommands = ({
	room,
	workbenchRoom = room,
	newRoomPanels,
	onOpenMcpOverlay,
	onAttachFiles,
	onCompact,
	onSwitchToAgent,
	onSwitchToChat,
	canChooseAgent,
	prompts,
	onRunPrompt,
}: RoomSlashCommandsOptions): SlashCommand[] => {
	const { t } = useTranslation("room");
	const panels = useWorkbenchPanels(workbenchRoom, newRoomPanels);
	const roomActions = useRoomActionsContext();
	const roomActionItems = useRoomActionItems();
	const isAgentMode = room.mode === "agent";
	const command = (
		id: string,
		group: SlashCommand["group"],
		icon: SlashCommand["icon"],
		onExecute: () => void,
		extra: Partial<SlashCommand> = {},
	): SlashCommand => ({
		id: id,
		group: group,
		icon: icon,
		label: t(`slash.commands.${id}.label`),
		description: t(`slash.commands.${id}.description`),
		onExecute: onExecute,
		...extra,
	});

	const commands: SlashCommand[] = [
		command("attach", "chat", <PaperclipIcon />, onAttachFiles, {
			keywords: ["file", "document", "upload"],
		}),
		command("knowledge", "chat", <BookOpenIcon />, () =>
			onOpenMcpOverlay("KNOWLEDGE"),
		),
		command("toolbox", "chat", <HammerIcon />, () =>
			onOpenMcpOverlay("TOOLBOX"),
		),
	];
	if (canChooseAgent) {
		commands.push(
			command("agent", "chat", <BotIcon />, () =>
				onOpenMcpOverlay("AGENT"),
			),
		);
	}
	if (!isAgentMode) {
		commands.push(
			command(
				"agent-harness",
				"chat",
				<SparklesIcon />,
				onSwitchToAgent,
				{
					keywords: ["harness", "agent mode"],
				},
			),
		);
	} else if (onSwitchToChat) {
		commands.push(
			command("chat-mode", "chat", <MessageCircleIcon />, onSwitchToChat),
		);
	}
	if (onCompact) {
		commands.push(
			command("compact", "chat", <ChevronsDownUpIcon />, onCompact, {
				isLockedWhileBusy: true,
			}),
		);
	}

	// a panel waiting on a new chat's preparation cannot open yet
	for (const panel of panels) {
		if (panel.isDisabled) continue;
		commands.push(
			command(
				panel.id,
				"workspace",
				<WorkbenchPanelIcon place={panel} />,
				() => panel.onOpen(),
				{
					label: panel.label,
					description:
						panel.kind === "connector"
							? t("slash.openPlace", { name: panel.label })
							: panel.description,
					keywords: PANEL_KEYWORDS[panel.id],
				},
			),
		);
	}
	if (workbenchRoom.sidebar.isOpen) {
		commands.push(
			command(
				"close-workspace",
				"workspace",
				<PanelRightCloseIcon className="rtl:-scale-x-100" />,
				() => void workbenchRoom.closeSidebar(),
				{ label: t("studio.closeWorkspace") },
			),
		);
	}

	for (const item of roomActionItems) {
		const Icon = item.icon;
		commands.push(
			command(
				item.id,
				"room",
				<Icon />,
				// the composer keeps focus as the menu closes; rename after that
				item.id === "rename" && roomActions
					? () => setTimeout(roomActions.startRenaming, 0)
					: item.onSelect,
				{
					label: item.label,
					description: item.description,
					keywords: item.keywords,
				},
			),
		);
	}

	for (const prompt of prompts) {
		commands.push(
			command(
				`prompt-${prompt.id}`,
				"prompts",
				<TextQuoteIcon />,
				() => onRunPrompt(prompt),
				{
					label: prompt.title,
					description: prompt.intent,
					keywords: prompt.tags,
					isLockedWhileBusy: true,
				},
			),
		);
	}

	return commands;
};
