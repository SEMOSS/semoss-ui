import { SettingsIcon } from "lucide-react";
import { useContext } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Separator,
} from "@semoss/ui/next";
import { ChatConfigContext } from "../../chat/config/chat-config.context";
import { useRoomActionItems } from "../../room/actions/use-room-action-items";
import { HeaderIconButton } from "../../room/header/header-icon-button";
import type { RoomStore } from "../../room/store/room.store";
import { DefaultWorkbenchRail } from "./default-workbench-rail";
import {
	type NewRoomWorkbenchPanels,
	useWorkbenchPanels,
} from "./use-workbench-panels";
import { WorkbenchRailContext } from "./workbench-rail.context";

/** Props for {@link RoomWorkbenchRail}. */
interface RoomWorkbenchRailProps {
	/** The room whose Workspace the rail opens panels in. */
	room: RoomStore;
	/** A new chat's own panel actions, which prepare its room, until its first message. */
	newRoomPanels?: NewRoomWorkbenchPanels;
	/** Which way a label or menu opens: into the dock, or below the mobile toolbar. */
	side: "right" | "bottom";
}

/**
 * The Workspace's rail, on the dock's left edge: the room's cog menu, then the
 * icons of `ChatConfig.components.WorkbenchRail` — by default one per panel
 * the room can open: Files, Settings, the activity log, and each connector
 * viewer the chat can show — each with its label on hover.
 *
 * It is the host's own chrome in a border slot, not a set of docked panels:
 * the dock's own rails carry no panels at all, so everything opens in the main
 * tab area. A click goes through the option's `onOpen` → `selectPanel`, which
 * selects the panel when it is already open anywhere in the dock and adds a
 * tab beside the others when it is not.
 *
 * An icon (`RailItem`) is also a drag source: dropping one on the dock opens
 * it where it lands, so a panel can be dropped into the centre, or beside
 * another as a split. A drag always spawns a *new* view, which is what makes
 * dropping Files beside an open Files useful.
 */
export const RoomWorkbenchRail = ({
	room,
	newRoomPanels,
	side,
}: RoomWorkbenchRailProps) => {
	const { t } = useTranslation(["room", "sidebar"]);
	// a double-click on the name renames, so the cog leaves Rename out
	const actionItems = useRoomActionItems().filter(
		(item) => item.id !== "rename",
	);

	// read without `useChatConfig`, so the rail also renders with no host config
	const Rail =
		useContext(ChatConfigContext)?.components?.WorkbenchRail ??
		DefaultWorkbenchRail;
	const panels = useWorkbenchPanels(room, newRoomPanels);

	return (
		<>
			{actionItems.length > 0 && (
				<>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<HeaderIconButton
								label={t("sidebar:actions.roomActions")}
								tooltipSide={side}
							>
								<SettingsIcon
									aria-hidden="true"
									className="size-4"
								/>
							</HeaderIconButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							side={side}
							align="start"
							className="w-56"
						>
							{actionItems.map((item) => (
								<DropdownMenuItem
									key={item.id}
									variant={
										item.isDestructive
											? "destructive"
											: "default"
									}
									className="gap-2.5 max-md:min-h-11"
									onSelect={item.onSelect}
								>
									<item.icon
										aria-hidden="true"
										className={cn(
											item.isActive &&
												"fill-current text-foreground",
										)}
									/>
									{item.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
					<Separator
						orientation={
							side === "bottom" ? "vertical" : "horizontal"
						}
						className={cn(
							"flex-none",
							side === "bottom" ? "mx-0.5 h-5" : "my-0.5 w-5",
						)}
					/>
				</>
			)}

			<WorkbenchRailContext.Provider
				value={{
					room: room,
					isNewChat: Boolean(newRoomPanels),
					side: side,
					panels: panels,
				}}
			>
				<Rail />
			</WorkbenchRailContext.Provider>
		</>
	);
};
