import { PanelRightCloseIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useIsMobile,
} from "@semoss/ui/next";
import type { RoomStore } from "@/stores/room/room.store";
import { HEADER_TOOLTIP_DELAY } from "./workspace-place-button";

export interface CloseWorkspaceButtonProps {
	/** The room whose Workspace it closes. */
	room: RoomStore;
}

/**
 * The room header's last control while the Workspace is open: it closes the
 * Workspace, keeping its tabs for the next time it opens.
 */
export const CloseWorkspaceButton = observer(
	({ room }: CloseWorkspaceButtonProps) => {
		const { t } = useTranslation("room");
		const isMobile = useIsMobile();
		if (!room.sidebar.isOpen) return null;
		const label = t("studio.closeWorkspace");
		return (
			<Tooltip delayDuration={HEADER_TOOLTIP_DELAY}>
				<TooltipTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size={isMobile ? "icon-lg" : "icon-sm"}
						aria-label={label}
						onClick={() => void room.closeSidebar()}
						className={cn(
							"shrink-0 text-muted-foreground",
							isMobile && "min-h-11 min-w-11",
						)}
					>
						<PanelRightCloseIcon
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
