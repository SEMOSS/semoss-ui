import { PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useContext } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useIsMobile,
} from "@semoss/ui/next";
import { ConversationWorkspaceActionsContext } from "@/features/conversation/conversation-workspace-actions.context";
import type { RoomStore } from "@/stores/room/room.store";
import type { DraftWorkspacePlaces } from "./use-workspace-places";

/** How long the pointer rests on a header icon before its tooltip shows. */
export const HEADER_TOOLTIP_DELAY = 500;

export interface WorkspaceToggleButtonProps {
	/** The room whose Workspace it opens and closes. */
	room: RoomStore;
	/** A new chat's own actions, until its first message. */
	draft?: DraftWorkspacePlaces;
}

/**
 * The room header's last control: it opens the Workspace as it was left, with
 * its rail beside it, and closes it again, keeping its tabs for next time.
 * Behind the Chat tab on a narrow screen, it brings the Workspace forward.
 * A new chat's toggle also prepares its room.
 */
export const WorkspaceToggleButton = observer(
	({ room, draft }: WorkspaceToggleButtonProps) => {
		const { t } = useTranslation("room");
		const isMobile = useIsMobile();
		const workspace = useContext(ConversationWorkspaceActionsContext);
		const isOpen = room.sidebar.isOpen;
		// behind the Chat tab on a narrow screen, it is not in view yet
		const isInView = isOpen && (workspace?.isWorkAreaVisible ?? true);
		const label = isInView
			? t("studio.closeWorkspace")
			: t("studio.openWorkspace");
		const Icon = isInView ? PanelRightCloseIcon : PanelRightOpenIcon;
		return (
			<Tooltip delayDuration={HEADER_TOOLTIP_DELAY}>
				<TooltipTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size={isMobile ? "icon-lg" : "icon-sm"}
						aria-label={label}
						aria-pressed={isInView}
						onClick={(event) => {
							if (isInView) {
								void room.closeSidebar();
								return;
							}
							if (draft) draft.onOpenWorkspace();
							else room.openSidebar();
							workspace?.revealWorkArea(event.currentTarget);
						}}
						className={cn(
							"shrink-0 text-muted-foreground",
							isMobile && "min-h-11 min-w-11",
							isInView && "bg-accent text-accent-foreground",
						)}
					>
						<Icon
							aria-hidden="true"
							className="rtl:-scale-x-100 size-4"
						/>
					</Button>
				</TooltipTrigger>
				<TooltipContent
					side="bottom"
					sideOffset={6}
					collisionPadding={8}
					arrow={false}
				>
					{label}
				</TooltipContent>
			</Tooltip>
		);
	},
);
