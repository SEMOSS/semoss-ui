import { observer } from "mobx-react-lite";
import { useContext } from "react";
import {
	Button,
	cn,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	useIsMobile,
} from "@semoss/ui/next";
import { ConversationWorkspaceActionsContext } from "@/features/conversation/conversation-workspace-actions.context";
import { useSidebarPanelActive } from "@/hooks/use-sidebar-panel-active";
import type { RoomStore } from "@/stores/room/room.store";
import type { WorkspacePlace } from "./use-workspace-places";
import { WorkspacePlaceIcon } from "./workspace-place-icon";

/** How long the pointer rests on a header icon before its tooltip shows. */
export const HEADER_TOOLTIP_DELAY = 500;

export interface WorkspacePlaceButtonProps {
	/** The room whose Workspace the place opens in. */
	room: RoomStore;
	/** The place. */
	place: WorkspacePlace;
}

/**
 * One place in the header, shown by its icon with its name and what it holds
 * in a tooltip. It opens the Workspace on the place, and closes the Workspace
 * when the place is already in front and on screen.
 */
export const WorkspacePlaceButton = observer(
	({ room, place }: WorkspacePlaceButtonProps) => {
		const isMobile = useIsMobile();
		const workspace = useContext(ConversationWorkspaceActionsContext);
		const isActive = useSidebarPanelActive(
			room,
			place.panelType,
			place.panelConfig,
		);
		// behind the Chat tab on a narrow screen, the place is not in view yet
		const isInView = isActive && (workspace?.isWorkAreaVisible ?? true);
		return (
			// a short delay, so passing over the header does not flash tooltips
			<Tooltip delayDuration={HEADER_TOOLTIP_DELAY}>
				<TooltipTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size={isMobile ? "icon-lg" : "icon-sm"}
						aria-label={place.label}
						aria-pressed={isActive}
						aria-busy={place.isLoading || undefined}
						disabled={place.isDisabled}
						onClick={(event) => {
							if (isInView) void room.closeSidebar();
							else place.onOpen(event.currentTarget);
						}}
						className={cn(
							"shrink-0 text-muted-foreground",
							isMobile && "min-h-11 min-w-11",
							isActive && "bg-accent text-accent-foreground",
						)}
					>
						{place.isLoading ? (
							<Spinner className="size-4" />
						) : (
							<WorkspacePlaceIcon
								place={place}
								className="size-4"
							/>
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent
					side="bottom"
					sideOffset={6}
					collisionPadding={8}
					arrow={false}
					className="max-w-60 text-start"
				>
					<span className="font-medium">{place.label}</span>
					{place.description && (
						<span className="block text-background/70">
							{place.description}
						</span>
					)}
				</TooltipContent>
			</Tooltip>
		);
	},
);
