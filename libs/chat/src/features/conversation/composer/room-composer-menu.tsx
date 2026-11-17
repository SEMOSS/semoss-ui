import { BotIcon, MessageCircleIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import type { MCPConfig } from "@semoss/shared";
import {
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
} from "@semoss/ui/next";
import type { RoomStore } from "../../room/store/room.store";
import type { AgentChoice } from "../../tools/mcp/agent-choice";
import { getAgentLabel } from "../../tools/mcp/mcp-utils";
import { RoomInputMenuAttachFolder } from "./room-input-menu-attach-folder";
import { RoomInputMenuMCP } from "./room-input-menu-mcp";
import { RoomInputMenuUpload } from "./room-input-menu-upload";

/** Props for {@link RoomComposerMenu}, also the props of a host's replacement menu. */
export interface RoomComposerMenuProps {
	/** Opens or closes the menu. */
	onOpenChange: (isOpen: boolean) => void;
	/** Opens the picker on the given tab. */
	onOpenMcpOverlay: (tab: "AGENT" | "KNOWLEDGE" | "TOOLBOX") => void;
	/** The room's options, for the selected agent and the resource counts. */
	options: RoomStore["options"];
	/** The tools and knowledge the room's agent brings, counted with the room's own. */
	agentTools: readonly MCPConfig[];
	/** Only mutations are locked while a turn is running. */
	disabled: boolean;
	/** Present only while creating a chat. */
	onSelectChat?: () => void;
	/** Changes execution mode while keeping the selected saved agent. */
	onSelectAgent?: () => void;
	/** Whether the chat runs in agent mode, checked in the Chat and Agent choice. */
	isAgentMode: boolean;
	/**
	 * How the chat offers its agent: a new chat's lists the agent picker, and
	 * the Chat and Agent choice when it is `saved` `withModeChoice`.
	 */
	agent: AgentChoice;
	/**
	 * Attach folders from the user's machine, where the host can reach them;
	 * the menu then offers Attach Folder. A new chat's prepares its room.
	 */
	onAttachFolder?: (() => void) | null;
	/** Whether the folder picker is open, which locks Attach Folder. */
	isAttachingFolder?: boolean;
}

/**
 * The items of the composer's plus menu, shared by a new chat and an open
 * room: upload, a folder from the user's machine where the host can reach
 * one, knowledge, and toolboxes, then, while creating a chat, the
 * Chat and Agent choice and the agent picker.
 */
export function RoomComposerMenu({
	onOpenChange,
	onOpenMcpOverlay,
	options,
	agentTools,
	disabled,
	onSelectChat,
	onSelectAgent,
	isAgentMode,
	agent,
	onAttachFolder,
	isAttachingFolder = false,
}: RoomComposerMenuProps) {
	const { t } = useTranslation("room");
	const close = () => onOpenChange(false);
	// Close the menu as the picker opens, so focus moves to the picker.
	const openPicker = (tab: "AGENT" | "KNOWLEDGE" | "TOOLBOX") => {
		onOpenMcpOverlay(tab);
		close();
	};
	const canChooseMode = agent.kind === "saved" && agent.withModeChoice;
	const agentName = getAgentLabel({
		workspace: options.workspace,
		isAgentMode,
		defaultAgentLabel: t("modes.defaultAgent"),
	});
	const agentLabel = agentName
		? t("modes.selectedAgent", { name: agentName })
		: t("menuWorkspace.selectAgent");
	return (
		<>
			<RoomInputMenuUpload disabled={disabled} onSelect={close} />
			{onAttachFolder ? (
				<RoomInputMenuAttachFolder
					onAttach={onAttachFolder}
					disabled={disabled || isAttachingFolder}
					onSelect={close}
				/>
			) : null}
			<RoomInputMenuMCP
				type="KNOWLEDGE"
				options={options}
				agentTools={agentTools}
				disabled={disabled}
				onSelect={() => openPicker("KNOWLEDGE")}
			/>
			<RoomInputMenuMCP
				type="TOOLBOX"
				options={options}
				agentTools={agentTools}
				disabled={disabled}
				onSelect={() => openPicker("TOOLBOX")}
			/>
			{agent.kind !== "fixed" && (
				<>
					<DropdownMenuSeparator />
					{canChooseMode && (
						<DropdownMenuRadioGroup
							aria-label={`${t("modes.ask")} / ${t("modes.agent")}`}
							value={isAgentMode ? "agent" : "chat"}
						>
							<DropdownMenuRadioItem
								value="chat"
								disabled={disabled}
								onSelect={() => {
									onSelectChat?.();
									close();
								}}
							>
								<MessageCircleIcon aria-hidden="true" />
								{t("modes.ask")}
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem
								value="agent"
								disabled={disabled}
								onSelect={() => {
									onSelectAgent?.();
									close();
								}}
							>
								<BotIcon aria-hidden="true" />
								{t("modes.agent")}
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					)}
					{canChooseMode && <DropdownMenuSeparator />}
					<DropdownMenuItem
						disabled={disabled}
						onSelect={() => openPicker("AGENT")}
					>
						<BotIcon aria-hidden="true" />
						<span className="min-w-0 whitespace-normal break-words">
							{agentLabel}
						</span>
					</DropdownMenuItem>
				</>
			)}
		</>
	);
}
