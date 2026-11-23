import { PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react";
import { type MouseEvent, useContext } from "react";
import { useTranslation } from "@semoss/i18n";
import { cn } from "@semoss/ui/next";
import { HeaderIconButton } from "../../room/header/header-icon-button";
import { SplitLayoutActionsContext } from "../../room/layout/split-layout-actions.context";
import type { RoomStore } from "../../room/store/room.store";
import { useRoomSelector } from "../../room/store/use-room-selector";
import type { DraftWorkbenchPanels } from "./use-workbench-panels";

/** Props for {@link RoomWorkbenchToggle}. */
interface RoomWorkbenchToggleProps {
	/** The room whose Workspace it opens and closes. */
	room: RoomStore;
	/** A new chat's own actions, until its first message. */
	draftPanels?: DraftWorkbenchPanels;
}

/**
 * The room header's last control: it opens the Workspace as it was left, with
 * its rail beside it, and closes it again, keeping its tabs for next time.
 * Behind the Chat tab on a narrow screen, it brings the Workspace forward.
 * A new chat's toggle also prepares its room.
 */
export const RoomWorkbenchToggle = ({
	room,
	draftPanels,
}: RoomWorkbenchToggleProps) => {
	const { t } = useTranslation("room");
	const roomLayout = useContext(SplitLayoutActionsContext);
	const isOpen = useRoomSelector(
		room,
		(current) => current.workbenchPane.isOpen,
	);
	// open but behind the narrow Chat tab counts as out of view
	const isInView = isOpen && (roomLayout?.isWorkbenchVisible ?? true);
	const Icon = isInView ? PanelRightCloseIcon : PanelRightOpenIcon;

	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		if (isInView) {
			room.closeWorkbench();
			return;
		}
		if (draftPanels) draftPanels.onOpenPanel({ kind: "workbench" });
		else room.openWorkbench();
		roomLayout?.revealWorkbench(event.currentTarget);
	};

	return (
		<HeaderIconButton
			label={
				isInView
					? t("workbench.closeWorkspace")
					: t("workbench.openWorkspace")
			}
			aria-pressed={isInView}
			onClick={handleClick}
			className={cn(isInView && "bg-accent text-accent-foreground")}
		>
			<Icon aria-hidden="true" className="rtl:-scale-x-100 size-4" />
		</HeaderIconButton>
	);
};
