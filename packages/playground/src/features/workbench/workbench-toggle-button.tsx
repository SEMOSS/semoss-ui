import { PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { type MouseEvent, useContext } from "react";
import { useTranslation } from "@semoss/i18n";
import { cn } from "@semoss/ui/next";
import { RoomLayoutActionsContext } from "@/features/conversation/room-layout-actions.context";
import { HeaderIconButton } from "@/features/room-header/header-icon-button";
import type { RoomStore } from "@/stores/room/room.store";
import type { NewRoomWorkbenchPanels } from "./use-workbench-panels";

export interface WorkbenchToggleButtonProps {
	/** The room whose Workspace it opens and closes. */
	room: RoomStore;
	/** A new chat's own actions, until its first message. */
	newRoomPanels?: NewRoomWorkbenchPanels;
}

/**
 * The room header's last control: it opens the Workspace as it was left, with
 * its rail beside it, and closes it again, keeping its tabs for next time.
 * Behind the Chat tab on a narrow screen, it brings the Workspace forward.
 * A new chat's toggle also prepares its room.
 */
export const WorkbenchToggleButton = observer(
	({ room, newRoomPanels }: WorkbenchToggleButtonProps) => {
		const { t } = useTranslation("room");
		const roomLayout = useContext(RoomLayoutActionsContext);
		const isInView =
			room.sidebar.isOpen && (roomLayout?.isWorkbenchVisible ?? true);
		const Icon = isInView ? PanelRightCloseIcon : PanelRightOpenIcon;

		const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
			if (isInView) {
				void room.closeSidebar();
				return;
			}
			if (newRoomPanels) newRoomPanels.onOpenPanel({ kind: "workbench" });
			else room.openSidebar();
			roomLayout?.revealWorkbench(event.currentTarget);
		};

		return (
			<HeaderIconButton
				label={
					isInView
						? t("studio.closeWorkspace")
						: t("studio.openWorkspace")
				}
				aria-pressed={isInView}
				onClick={handleClick}
				className={cn(isInView && "bg-accent text-accent-foreground")}
			>
				<Icon aria-hidden="true" className="rtl:-scale-x-100 size-4" />
			</HeaderIconButton>
		);
	},
);
