import { Info } from "lucide-react";
import { useId } from "react";
import { Link, useLocation } from "react-router";
import {
	cn,
	Small,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { formatLocalDateTime } from "@semoss/utility/date";
import { topicTone } from "@/features/collaboration/topic-tone";
import { roomPath } from "@/lib/workspace-paths";
import type { RoomTreeRoom } from "./room-tree.types";

interface RoomTreeRoomLinkProps {
	/** Summary identifying the exact saved conversation. */
	room: RoomTreeRoom;
	/** Closes a mobile drawer after selecting a conversation. */
	onNavigate?: () => void;
}

/** A real link supports keyboard navigation, new tabs, and accessible full titles. */
export function RoomTreeRoomLink({ room, onNavigate }: RoomTreeRoomLinkProps) {
	const unavailableId = useId();
	const unreadId = useId();
	const topicsId = useId();
	const activityId = useId();
	const { pathname, state: routeState } = useLocation();
	const navigationState: unknown = routeState;
	const openedRoomId =
		navigationState &&
		typeof navigationState === "object" &&
		"openedRoomId" in navigationState
			? navigationState.openedRoomId
			: undefined;
	const title = room.roomName || "Untitled chat";
	const topicNames = room.topics.map((topic) => topic.name).join(", ");
	const activityLabel = formatLocalDateTime(room.activityAt);
	const isActive =
		pathname === roomPath(room.roomId) ||
		(pathname.startsWith("/thread/") && openedRoomId === room.roomId);
	const descriptionIds = [
		room.isUnread ? unreadId : undefined,
		room.topicUnavailable ? unavailableId : undefined,
		topicNames ? topicsId : undefined,
		activityLabel ? activityId : undefined,
	]
		.filter(Boolean)
		.join(" ");
	return (
		<Tooltip disableHoverableContent={false} delayDuration={300}>
			<TooltipTrigger asChild>
				<Link
					to={roomPath(room.roomId)}
					aria-label={title}
					aria-describedby={descriptionIds || undefined}
					aria-current={isActive ? "page" : undefined}
					onClick={(event) => {
						if (
							event.button === 0 &&
							!event.metaKey &&
							!event.ctrlKey &&
							!event.shiftKey &&
							!event.altKey
						)
							onNavigate?.();
					}}
					className={cn(
						"flex min-h-8 pointer-coarse:min-h-11 min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-solid",
						isActive && "bg-sidebar-accent font-medium",
					)}
				>
					<span className="min-w-0 flex-1 truncate pointer-coarse:whitespace-normal pointer-coarse:break-words">
						{title}
					</span>
					{room.topics.length > 0 && (
						<>
							<span
								aria-hidden="true"
								className="flex shrink-0 items-center gap-1"
							>
								{room.topics.slice(0, 3).map((topic) => (
									<span
										key={topic.topicId}
										data-testid="room-topic-indicator"
										className={cn(
											"size-2 shrink-0 rounded-full",
											topicTone(topic.topicId),
										)}
									/>
								))}
								{room.topics.length > 3 && (
									<span className="text-muted-foreground tabular-nums">
										+{room.topics.length - 3}
									</span>
								)}
							</span>
							<span id={topicsId} className="sr-only">
								Topics: {topicNames}
							</span>
						</>
					)}
					{activityLabel && (
						<span id={activityId} className="sr-only">
							Latest activity: {activityLabel}
						</span>
					)}
					{room.topicUnavailable && (
						<>
							<Info
								aria-hidden="true"
								className="size-3.5 shrink-0 text-muted-foreground"
							/>
							<span id={unavailableId} className="sr-only">
								Topic unavailable
							</span>
						</>
					)}
					{room.isUnread && (
						<>
							<span
								aria-hidden="true"
								data-testid="room-tree-room-link-unread-indicator"
								className="size-1.5 shrink-0 rounded-full bg-primary"
							/>
							<span id={unreadId} className="sr-only">
								Unread activity
							</span>
						</>
					)}
				</Link>
			</TooltipTrigger>
			<TooltipContent
				side="right"
				className="max-w-64 space-y-1 break-words text-left"
			>
				<Small className="block font-medium text-xs">{title}</Small>
				{topicNames && (
					<Small className="block font-normal text-xs">
						Topics: {topicNames}
					</Small>
				)}
				{room.topicUnavailable && (
					<Small className="block font-normal text-xs">
						Topic unavailable
					</Small>
				)}
				{activityLabel && (
					<Small className="block font-normal text-xs">
						Latest activity: {activityLabel}
					</Small>
				)}
			</TooltipContent>
		</Tooltip>
	);
}
