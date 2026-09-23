import { Link } from "react-router";
import { cn } from "@semoss/ui/next";
import { roomPath } from "@/lib/workspace-paths";
import type { Session } from "@/types/session";

interface RecentRoomLinkProps {
	room: Session;
	active: boolean;
	onVisit: (roomId: string) => void;
}

/** A compact link in the sidebar's recent-room list. */
export function RecentRoomLink({ room, active, onVisit }: RecentRoomLinkProps) {
	return (
		<li>
			<Link
				to={roomPath(room.id)}
				onClick={(event) => {
					event.preventDefault();
					onVisit(room.id);
				}}
				aria-current={active ? "page" : undefined}
				className={cn(
					"group/room flex min-h-9 min-w-0 rounded-md px-2 py-1 text-start outline-hidden ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
					active &&
						"bg-sidebar-accent font-medium text-sidebar-accent-foreground",
				)}
			>
				<span className="min-w-0 flex-1">
					<span className="flex min-w-0 items-center gap-1.5">
						<span className="truncate text-sm">{room.title}</span>
						{room.unread && (
							<>
								<span
									className="size-2 shrink-0 rounded-full bg-primary"
									aria-hidden="true"
								/>
								<span className="sr-only">Unread</span>
							</>
						)}
					</span>
				</span>
			</Link>
		</li>
	);
}
