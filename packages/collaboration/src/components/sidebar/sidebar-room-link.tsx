import type { ReactNode } from "react";
import { Link } from "react-router";
import {
	Button,
	cn,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { roomPath } from "@/lib/workspace-paths";
import type { Session } from "@/types/session";
import { getSidebarRoomStatus } from "./sidebar-room-status";

interface SidebarRoomLinkProps {
	room: Session;
	active: boolean;
	trailingAction?: ReactNode;
	onVisit: (roomId: string) => void;
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
	hour: "numeric",
	minute: "2-digit",
});

function formatRoomTime(updatedAt: string): string {
	const date = new Date(updatedAt);
	return Number.isNaN(date.getTime())
		? updatedAt
		: timeFormatter.format(date);
}

/** A compact room link with status, preview, and trailing actions. */
export function SidebarRoomLink({
	room,
	active,
	trailingAction,
	onVisit,
}: SidebarRoomLinkProps) {
	const status = getSidebarRoomStatus(room);

	return (
		<li
			className={cn(
				"group/room flex min-h-9 min-w-0 items-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
				active &&
					"bg-sidebar-accent font-medium text-sidebar-accent-foreground",
			)}
		>
			{status && (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={status.label}
							className={cn(
								"ms-1 size-6 shrink-0 rounded-sm p-0",
								status.className,
							)}
						>
							{status.icon}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="right" sideOffset={4}>
						{status.label}
					</TooltipContent>
				</Tooltip>
			)}
			<HoverCard openDelay={300} closeDelay={150}>
				<HoverCardTrigger asChild>
					<Link
						to={roomPath(room.id)}
						onClick={(event) => {
							event.preventDefault();
							onVisit(room.id);
						}}
						aria-current={active ? "page" : undefined}
						className="flex min-h-9 min-w-0 flex-1 items-center rounded-md px-2 py-1 text-start outline-hidden ring-sidebar-ring focus-visible:ring-2"
					>
						<span className="min-w-0 flex-1 truncate text-sm">
							{room.title}
						</span>
					</Link>
				</HoverCardTrigger>
				<HoverCardContent
					side="right"
					align="start"
					sideOffset={8}
					avoidCollisions={false}
					className="space-y-2"
				>
					<P className="wrap-break-word text-sm">
						{room.preview.trim() || "No recent message"}
					</P>
					<time
						dateTime={room.updatedAt}
						className="block text-muted-foreground text-xs"
					>
						{formatRoomTime(room.updatedAt)}
					</time>
				</HoverCardContent>
			</HoverCard>
			{trailingAction}
		</li>
	);
}
