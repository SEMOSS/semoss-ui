import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { Button, cn, P, Skeleton, Small } from "@semoss/ui/next";
import {
	DATE_BUCKET_ORDER,
	type DateBucket,
	getDateBucket,
	parseTimestampWithUtcDefault,
} from "@semoss/utility/date";
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
	/** Closes mobile navigation after a conversation opens. */
	onNavigate?: () => void;
}

/** Date groups and pagination share the sidebar scroller and keep its position. */
export function ChatHistoryList({ onNavigate }: ChatHistoryListProps) {
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
		if (scrollRef.current)
			scrollRef.current.scrollTop = history.scrollTop.current;
	}, [history.scrollTop]);
	useEffect(() => {
		if (
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
	}, [history.hasMore, history.isLoading, history.error, history.loadMore]);
	return (
		<section
			aria-label="Sessions"
			className="flex min-h-28 flex-1 flex-col"
		>
			<div className="flex shrink-0 items-center gap-3 px-6 pt-1 pb-2">
				<Small className="text-muted-foreground">Sessions</Small>
				<div className="h-px flex-1 bg-border" aria-hidden="true" />
			</div>
			<div
				ref={scrollRef}
				onScroll={(event) => {
					history.scrollTop.current = event.currentTarget.scrollTop;
				}}
				className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
			>
				<nav aria-label="Sessions" className="space-y-4">
					{roomsByDate.map(({ bucket, rooms }) => (
						<div key={bucket} className="space-y-1">
							<Small className="px-3 pt-1 text-muted-foreground">
								{dateLabels[bucket]}
							</Small>
							{rooms.map((room) => {
								const isActive =
									pathname ===
										`/room/${encodeURIComponent(room.roomId)}` ||
									(pathname.startsWith("/work/thread/") &&
										openedRoomId === room.roomId);
								const title = room.roomName || "Untitled chat";
								return (
									<Button
										key={room.roomId}
										variant="ghost"
										title={title}
										aria-current={
											isActive ? "page" : undefined
										}
										aria-label={
											openingRoom === room.roomId
												? `Opening ${title}`
												: title
										}
										className={cn(
											"h-auto min-h-9 pointer-coarse:min-h-11 w-full justify-start gap-3 rounded-lg px-3 py-2 font-normal text-sm hover:bg-foreground/5",
											isActive &&
												"bg-foreground/5 font-medium",
										)}
										disabled={openingRoom === room.roomId}
										onClick={() => {
											void openRoom(room.roomId).then(
												onNavigate,
											);
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
						className="block space-y-2 p-3"
					>
						<Skeleton className="h-5 w-full" />
						<Skeleton className="h-5 w-3/4" />
					</output>
				)}
				{history.error && (
					<div role="alert" className="space-y-2 p-3">
						<P className="text-sm">{history.error}</P>
						<Button
							size="sm"
							variant="outline"
							onClick={history.retry}
						>
							Retry sessions
						</Button>
					</div>
				)}
				{!history.isLoading &&
					!history.error &&
					history.rooms.length === 0 && (
						<P className="px-3 py-2 text-muted-foreground text-sm">
							Your conversations will appear here after your first
							message.
						</P>
					)}
				<div ref={sentinelRef} className="h-1" />
				{history.hasMore && !history.isLoading && !history.error && (
					<Button
						variant="ghost"
						size="sm"
						className="w-full text-muted-foreground"
						onClick={history.loadMore}
					>
						Load more sessions
					</Button>
				)}
			</div>
		</section>
	);
}
