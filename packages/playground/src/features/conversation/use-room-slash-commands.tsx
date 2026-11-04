import {
	BookOpenIcon,
	BotIcon,
	ChevronsDownUpIcon,
	DownloadIcon,
	HammerIcon,
	MessageCircleIcon,
	PackagePlusIcon,
	PanelRightCloseIcon,
	PaperclipIcon,
	PencilIcon,
	SparklesIcon,
	StarIcon,
	TextQuoteIcon,
	TrashIcon,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import type { SlashCommand } from "@/components/common/lexical/slash-command/types";
import type { PromptLibraryItem } from "@/components/prompts/prompt-library-dialog";
import { useRoomTitle } from "@/features/room-header/room-title.context";
import {
	type DraftWorkspacePlaces,
	useWorkspacePlaces,
} from "@/features/workbench/use-workspace-places";
import { WorkspacePlaceIcon } from "@/features/workbench/workspace-place-icon";
import type { RoomStore } from "@/stores/room/room.store";

/** What the composer hands {@link useRoomSlashCommands}. */
export interface RoomSlashCommandsOptions {
	/** The room the composer sends to, or a new chat's draft. */
	room: RoomStore;
	/** The room whose Workspace the places open in; defaults to `room`. */
	workspaceRoom?: RoomStore;
	/** A new chat's own actions, until its first message. */
	draft?: DraftWorkspacePlaces;
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
 * switching mode, and compacting; each of the Workspace's places, its
 * connector viewers, and closing it; the room's own Favorite, Rename,
 * Publish, Download, and Delete, inside a room; and the room's prompts. Labels and descriptions are the ones
 * the rest of the app uses, so a command is found by the name it has
 * elsewhere. Call it from an observer: the places are read from MobX.
 *
 * @param options - The composer's room and its actions.
 * @return The commands, by group.
 */
export const useRoomSlashCommands = ({
	room,
	workspaceRoom = room,
	draft,
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
	const places = useWorkspacePlaces(workspaceRoom, draft);
	const roomTitle = useRoomTitle();
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
		noChip: true,
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
				disableWithTools: true,
			}),
		);
	}

	for (const place of places) {
		const icon = <WorkspacePlaceIcon place={place} />;
		if (place.kind === "connector") {
			commands.push({
				id: place.id,
				group: "workspace",
				icon: icon,
				label: place.label,
				description: t("slash.openPlace", { name: place.label }),
				onExecute: () => place.onOpen(),
				noChip: true,
			});
			continue;
		}
		commands.push({
			id: place.id,
			group: "workspace",
			icon: icon,
			label: place.label,
			description: place.description,
			keywords:
				place.id === "settings"
					? [
							"room-options",
							"options",
							"model",
							"instructions",
							"tools",
							"default tools",
						]
					: undefined,
			onExecute: () => place.onOpen(),
			noChip: true,
		});
	}
	if (workspaceRoom.sidebar.isOpen) {
		commands.push(
			command(
				"close-workspace",
				"workspace",
				<PanelRightCloseIcon className="rtl:-scale-x-100" />,
				() => void workspaceRoom.closeSidebar(),
			),
		);
	}

	// the room's own actions, as the header's Other menu lists them
	if (roomTitle) {
		const { actions } = roomTitle;
		commands.push(
			command(
				actions.isPinned ? "unfavorite" : "favorite",
				"room",
				<StarIcon />,
				() => void actions.togglePinned(),
				{ keywords: ["favorite", "pin"] },
			),
			// the composer keeps focus as the menu closes; rename after that
			command("rename", "room", <PencilIcon />, () =>
				setTimeout(roomTitle.startRename, 0),
			),
			command(
				"publish",
				"room",
				<PackagePlusIcon />,
				roomTitle.openPublish,
				{
					keywords: ["agent", "save as agent"],
				},
			),
			command(
				"download",
				"room",
				<DownloadIcon />,
				roomTitle.openDownload,
				{
					keywords: ["export", "word", "pdf"],
				},
			),
			command(
				"delete",
				"room",
				<TrashIcon />,
				() => void actions.remove(),
				{
					keywords: ["remove"],
				},
			),
		);
	}

	for (const prompt of prompts) {
		commands.push({
			id: `prompt-${prompt.id}`,
			group: "prompts",
			icon: <TextQuoteIcon />,
			label: prompt.title,
			description: prompt.intent,
			keywords: prompt.tags,
			onExecute: () => onRunPrompt(prompt),
			noChip: true,
			disableWithTools: true,
		});
	}

	return commands;
};
