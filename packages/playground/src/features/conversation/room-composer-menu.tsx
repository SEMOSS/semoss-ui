import { BotIcon, MessageCircleIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
} from "@semoss/ui/next";
import { RoomInputMenuMCP } from "@/components/room/room-input-menu-mcp";
import { RoomInputMenuUpload } from "@/components/room/room-input-menu-upload";
import type { RoomStore } from "@/stores/room/room.store";

export interface RoomComposerMenuProps {
	onOpenChange: (isOpen: boolean) => void;
	onOpenMcpOverlay: (tab: "AGENT" | "KNOWLEDGE" | "TOOLBOX") => void;
	options: RoomStore["options"];
	/** Only mutations are locked while a turn is running. */
	disabled: boolean;
	/** Present only while creating a chat. */
	onSelectChat?: () => void;
	/** Changes execution mode while keeping the selected saved agent. */
	onSelectAgent?: () => void;
	mode?: "chat" | "agent" | "workspace";
	agentEditable?: boolean;
	enableAgentHarness?: boolean;
}

/** Stable composer actions shared by draft and existing conversations. */
export function RoomComposerMenu({
	onOpenChange,
	onOpenMcpOverlay,
	options,
	disabled,
	onSelectChat,
	onSelectAgent,
	mode,
	agentEditable,
	enableAgentHarness,
}: RoomComposerMenuProps) {
	const { t } = useTranslation("room");
	const close = () => onOpenChange(false);
	const openPicker = (tab: "AGENT" | "KNOWLEDGE" | "TOOLBOX") => {
		onOpenMcpOverlay(tab);
		close();
	};
	const agentLabel = options.workspace
		? t("modes.selectedAgent", {
				name: options.workspace.name || options.workspace.workspace_id,
			})
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
			{agentEditable && (
				<>
					<DropdownMenuSeparator />
					{enableAgentHarness && (
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
					{enableAgentHarness && <DropdownMenuSeparator />}
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
