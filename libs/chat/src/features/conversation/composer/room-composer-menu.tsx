import { BotIcon, MessageCircleIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
} from "@semoss/ui/next";
import type { RoomStore } from "../../room/store/room.store";
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
	/** Only mutations are locked while a turn is running. */
	disabled: boolean;
	/** Present only while creating a chat. */
	onSelectChat?: () => void;
	/** Changes execution mode while keeping the selected saved agent. */
	onSelectAgent?: () => void;
	/** The room's mode, checked in the Chat and Agent choice. */
	mode?: "chat" | "agent" | "workspace";
	/** Shows the agent picker; true only while creating a chat. */
	isAgentEditable?: boolean;
	/** Shows the Chat and Agent choice. */
	canChooseMode?: boolean;
	/** Default Agent is picked, so the agent item names it. */
	isDefaultAgent?: boolean;
}

/**
 * The items of the composer's plus menu, shared by a new chat and an open
 * room: upload, knowledge, and toolboxes, then, while creating a chat, the
 * Chat and Agent choice and the agent picker.
 */
export function RoomComposerMenu({
	onOpenChange,
	onOpenMcpOverlay,
	options,
	disabled,
	onSelectChat,
	onSelectAgent,
	mode,
	isAgentEditable,
	canChooseMode,
	isDefaultAgent,
}: RoomComposerMenuProps) {
	const { t } = useTranslation("room");
	const close = () => onOpenChange(false);
	// Close the menu as the picker opens, so focus moves to the picker.
	const openPicker = (tab: "AGENT" | "KNOWLEDGE" | "TOOLBOX") => {
		onOpenMcpOverlay(tab);
		close();
	};
	const agentLabel = options.workspace
		? t("modes.selectedAgent", {
				name: options.workspace.name || options.workspace.workspace_id,
			})
		: isDefaultAgent
			? t("modes.selectedAgent", { name: t("modes.defaultAgent") })
			: t("menuWorkspace.selectAgent");
	return (
		<>
			<RoomInputMenuUpload disabled={disabled} onSelect={close} />
			<RoomInputMenuMCP
				type="KNOWLEDGE"
				options={options}
				disabled={disabled}
				onSelect={() => openPicker("KNOWLEDGE")}
			/>
			<RoomInputMenuMCP
				type="TOOLBOX"
				options={options}
				disabled={disabled}
				onSelect={() => openPicker("TOOLBOX")}
			/>
			{isAgentEditable && (
				<>
					<DropdownMenuSeparator />
					{canChooseMode && (
						<DropdownMenuRadioGroup
							aria-label={`${t("modes.ask")} / ${t("modes.agent")}`}
							value={mode === "agent" ? "agent" : "chat"}
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
