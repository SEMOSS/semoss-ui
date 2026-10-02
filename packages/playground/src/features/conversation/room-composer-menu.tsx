import { BotIcon, MessageCircleIcon, PanelRightOpenIcon } from "lucide-react";
import type { ConnectorViewerService } from "@semoss/connectors";
import { useTranslation } from "@semoss/i18n";
import {
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
} from "@semoss/ui/next";
import { RoomInputMenuMCP } from "@/components/room/room-input-menu-mcp";
import { RoomInputMenuUpload } from "@/components/room/room-input-menu-upload";
import { TeamworkSourcesMenuItem } from "@/features/teamwork/components/teamwork-sources-menu-item";
import type { RoomStore } from "@/stores/room/room.store";

export interface RoomComposerMenuProps {
	/** Owns the connector configuration and context queue. */
	room: RoomStore;
	/** Drafts prepare a room before opening a connector viewer. */
	onOpenSource?: (service: ConnectorViewerService) => void;
	/** Retained for custom composer menus. */
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	onOpenMcpOverlay: (tab: "AGENT" | "KNOWLEDGE" | "TOOLBOX") => void;
	options: RoomStore["options"];
	/** Only mutations are locked while a turn is running. */
	disabled: boolean;
	onOpenWorkspace: () => void;
	/** Present only while creating a chat. */
	onSelectChat?: () => void;
	mode?: "chat" | "agent" | "workspace";
	agentEditable?: boolean;
	enableAgentHarness?: boolean;
}

/** Stable composer actions shared by draft and existing conversations. */
export function RoomComposerMenu({
	room,
	onOpenSource,
	onOpenChange,
	onOpenMcpOverlay,
	options,
	disabled,
	onOpenWorkspace,
	onSelectChat,
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
	const agentLabel =
		mode === "agent" || options.workspace
			? t("modes.selectedAgent", {
					name:
						options.workspace?.name ||
						options.workspace?.workspace_id ||
						t("modes.defaultAgent"),
				})
			: t("modes.agent");
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
			<TeamworkSourcesMenuItem
				teamwork={room.teamwork}
				onOpenSource={onOpenSource}
				onSelect={close}
			/>
			{agentEditable && (
				<>
					<DropdownMenuSeparator />
					{enableAgentHarness ? (
						<DropdownMenuRadioGroup
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
								onSelect={() => openPicker("AGENT")}
							>
								<BotIcon aria-hidden="true" />
								<span className="min-w-0 whitespace-normal break-words">
									{agentLabel}
								</span>
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					) : (
						<DropdownMenuItem
							disabled={disabled}
							onSelect={() => openPicker("AGENT")}
						>
							<BotIcon aria-hidden="true" />
							{agentLabel}
						</DropdownMenuItem>
					)}
				</>
			)}
			<DropdownMenuSeparator />
			<DropdownMenuItem
				onSelect={() => {
					onOpenWorkspace();
					close();
				}}
			>
				<PanelRightOpenIcon aria-hidden="true" />
				{t("studio.openWorkArea")}
			</DropdownMenuItem>
		</>
	);
}
