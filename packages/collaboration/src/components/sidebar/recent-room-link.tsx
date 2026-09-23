import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@semoss/ui/next";
import { roomPath } from "@/lib/workspace-paths";
import type { Session } from "@/types/session";

interface RecentRoomLinkProps {
	room: Session;
	active: boolean;
	trailingAction?: ReactNode;
	onVisit: (roomId: string) => void;
}

/** A compact link in the sidebar's recent-room list. */
export function RecentRoomLink({
	room,
	active,
	trailingAction,
	onVisit,
}: RecentRoomLinkProps) {
	return (
		<li
			className={cn(
				"group/room flex min-h-9 min-w-0 items-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
				active &&
					"bg-sidebar-accent font-medium text-sidebar-accent-foreground",
			)}
		>
			<Link
				to={roomPath(room.id)}
				onClick={(event) => {
					event.preventDefault();
					onVisit(room.id);
				}}
				aria-current={active ? "page" : undefined}
				className="flex min-h-9 min-w-0 flex-1 rounded-md px-2 py-1 text-start outline-hidden ring-sidebar-ring focus-visible:ring-2"
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
			{trailingAction}
		</li>
	);
}
