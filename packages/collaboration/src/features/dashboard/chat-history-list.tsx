import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	P,
	Skeleton,
	Small,
} from "@semoss/ui/next";
import {
	DATE_BUCKET_ORDER,
	type DateBucket,
	getDateBucket,
	parseTimestampWithUtcDefault,
} from "@semoss/utility/date";
import { roomPath } from "@/lib/workspace-paths";
import { useDashboard } from "./dashboard.context";

const dateLabels: Record<DateBucket, string> = {
	today: "Today",
	yesterday: "Yesterday",
	fewDaysAgo: "Previous 3 days",
	lastWeek: "Previous 7 days",
	thisMonth: "This month",
	lastMonth: "Last month",
	older: "Earlier",
};

interface ChatHistoryListProps {
	/** Controls the disclosure when the shell owns its saved preference. */
	isOpen?: boolean;
	/** Saves the user's disclosure choice. */
	onOpenChange?: (isOpen: boolean) => void;
	/** Closes mobile navigation after a conversation opens. */
	onNavigate?: () => void;
}

/** Date groups and pagination share the sidebar scroller and keep its position. */
export function ChatHistoryList({
	isOpen,
	onOpenChange,
	onNavigate,
}: ChatHistoryListProps) {
	const [isLocalOpen, setIsLocalOpen] = useState(true);
	const isExpanded = isOpen ?? isLocalOpen;
	const { history, openRoom, openingRoom } = useDashboard();
	const { pathname, state: routeState } = useLocation();
	const navigationState: unknown = routeState;
	const openedRoomId =
		navigationState &&
		typeof navigationState === "object" &&
		"openedRoomId" in navigationState
			? navigationState.openedRoomId
			: undefined;
	const scrollRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const roomsByDate = DATE_BUCKET_ORDER.map((bucket) => ({
		bucket,
		rooms: history.rooms.filter((room) => {
			const date = room.dateUpdated || room.dateCreated;
			return (
				(date
					? getDateBucket(parseTimestampWithUtcDefault(date))
					: "older") === bucket
			);
		}),
	})).filter((group) => group.rooms.length > 0);
	useEffect(() => {
		if (isExpanded && scrollRef.current)
			scrollRef.current.scrollTop = history.scrollTop.current;
	}, [history.scrollTop, isExpanded]);
	useEffect(() => {
		if (
			!isExpanded ||
			!history.hasMore ||
			history.isLoading ||
			history.error ||
			!sentinelRef.current ||
			!scrollRef.current ||
			typeof IntersectionObserver === "undefined"
		)
			return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting))
					history.loadMore();
			},
			{ root: scrollRef.current, rootMargin: "100px" },
		);
		observer.observe(sentinelRef.current);
		return () => observer.disconnect();
	}, [
		isExpanded,
		history.hasMore,
		history.isLoading,
		history.error,
		history.loadMore,
	]);
	return (
		<Collapsible
			open={isExpanded}
			onOpenChange={onOpenChange ?? setIsLocalOpen}
			asChild
		>
			<section
				aria-label="Sessions"
				className={cn(
					"flex flex-col",
					isExpanded ? "min-h-28 flex-1" : "shrink-0",
				)}
			>
				<div className="shrink-0 px-2">
					<CollapsibleTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="pointer-coarse:min-h-11 w-full justify-start gap-2 px-2 font-normal text-muted-foreground text-xs has-[>svg]:px-2"
						>
							<ChevronRight
								aria-hidden="true"
								className={cn(
									"size-4",
									isExpanded && "rotate-90",
								)}
							/>
							Sessions
						</Button>
					</CollapsibleTrigger>
				</div>
				{/* Keep the list mounted while removing folded sessions from focus and accessibility navigation. */}
				<CollapsibleContent forceMount hidden={!isExpanded} asChild>
					<div
						ref={scrollRef}
						onScroll={(event) => {
							if (isExpanded)
								history.scrollTop.current =
									event.currentTarget.scrollTop;
						}}
						className="min-h-0 flex-1 overflow-y-auto px-2 pb-2"
					>
						<nav aria-label="Sessions" className="space-y-2">
							{roomsByDate.map(({ bucket, rooms }) => (
								<div key={bucket} className="space-y-0.5">
									<Small className="px-2 text-muted-foreground text-xs leading-4">
										{dateLabels[bucket]}
									</Small>
									{rooms.map((room) => {
										const isActive =
											pathname ===
												roomPath(room.roomId) ||
											(pathname.startsWith("/thread/") &&
												openedRoomId === room.roomId);
										const title =
											room.roomName || "Untitled chat";
										return (
											<Button
												key={room.roomId}
												variant="ghost"
												title={title}
												aria-current={
													isActive
														? "page"
														: undefined
												}
												aria-label={
													openingRoom === room.roomId
														? `Opening ${title}`
														: title
												}
												className={cn(
													"h-auto min-h-8 pointer-coarse:min-h-11 w-full justify-start gap-2 rounded-lg px-2 py-1 font-normal text-xs hover:bg-foreground/5",
													isActive &&
														"bg-foreground/5 font-medium",
												)}
												disabled={
													openingRoom === room.roomId
												}
												onClick={() => {
													void openRoom(
														room.roomId,
													).then(onNavigate);
												}}
											>
												<span
													aria-hidden="true"
													className={cn(
														"size-1.5 shrink-0 rounded-full",
														isActive
															? "bg-foreground"
															: "bg-transparent",
													)}
												/>
												<span className="truncate">
													{openingRoom === room.roomId
														? "Opening…"
														: title}
												</span>
											</Button>
										);
									})}
								</div>
							))}
						</nav>
						{history.isLoading && (
							<output
								aria-label="Loading sessions"
								className="block space-y-2 p-2"
							>
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</output>
						)}
						{history.error && (
							<div role="alert" className="space-y-2 p-2">
								<P className="text-xs leading-4">
									{history.error}
								</P>
								<Button
									size="sm"
									variant="outline"
									className="pointer-coarse:min-h-11 px-2 text-xs"
									onClick={history.retry}
								>
									Retry sessions
								</Button>
							</div>
						)}
						{!history.isLoading &&
							!history.error &&
							history.rooms.length === 0 && (
								<P className="p-2 text-muted-foreground text-xs leading-4">
									Your conversations will appear here after
									your first message.
								</P>
							)}
						<div ref={sentinelRef} className="h-1" />
						{history.hasMore &&
							!history.isLoading &&
							!history.error && (
								<Button
									variant="ghost"
									size="sm"
									className="pointer-coarse:min-h-11 w-full px-2 text-muted-foreground text-xs"
									onClick={history.loadMore}
								>
									Load more sessions
								</Button>
							)}
					</div>
				</CollapsibleContent>
			</section>
		</Collapsible>
	);
}
