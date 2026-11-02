import { observer } from "mobx-react-lite";
import {
	Button,
	cn,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useSidebarPanelActive } from "@/hooks/use-sidebar-panel-active";
import type { RoomStore } from "@/stores/room/room.store";
import type { WorkspacePlace } from "./use-workspace-places";
import { WorkspacePlaceIcon } from "./workspace-place-icon";

export interface WorkspaceRailItemProps {
	/** The room whose Workspace the place opens in. */
	room: RoomStore;
	/** The place. */
	place: WorkspacePlace;
}

/**
 * One place on the rail, shown by its icon with its name in a tooltip. It
 * opens the Workspace on the place, and closes the Workspace when the place is
 * already in front.
 */
export const WorkspaceRailItem = observer(
	({ room, place }: WorkspaceRailItemProps) => {
		const isActive = useSidebarPanelActive(
			room,
			place.panelType,
			place.panelConfig,
		);
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label={place.label}
						aria-pressed={isActive}
						aria-busy={place.isLoading || undefined}
						disabled={place.isDisabled}
						onClick={
							isActive
								? () => void room.closeSidebar()
								: place.onOpen
						}
						className={cn(
							"shrink-0 text-muted-foreground",
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
				<TooltipContent side="left">{place.label}</TooltipContent>
			</Tooltip>
		);
	},
);
