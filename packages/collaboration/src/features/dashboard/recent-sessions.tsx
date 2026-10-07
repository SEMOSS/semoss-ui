import { MessageSquare } from "lucide-react";
import { useState } from "react";
import { Button, P, Skeleton } from "@semoss/ui/next";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { BriefPanel } from "./brief-panel";
import { useDashboard } from "./dashboard.context";

/** A small window into saved conversations; selection always resumes that room. */
export function RecentSessions() {
	const { history, openRoom, openingRoom } = useDashboard();
	const [visibleCount, setVisibleCount] = useState(5);
	const rooms = history.rooms
		.map((room) => {
			const raw = room.dateUpdated || room.dateCreated;
			const parsed = raw ? parseTimestampWithUtcDefault(raw) : null;
			return { room, date: parsed?.isValid() ? parsed : null };
		})
		.sort((a, b) => (b.date?.valueOf() ?? 0) - (a.date?.valueOf() ?? 0));
	const hasMore = visibleCount < rooms.length || history.hasMore;
	return (
		<BriefPanel title="Recent sessions">
			<ul className="-mx-2 divide-y">
				{rooms.slice(0, visibleCount).map(({ room, date }) => {
					const title = room.roomName || "Untitled chat";
					const isOpening = openingRoom === room.roomId;
					return (
						<li key={room.roomId}>
							<Button
								variant="ghost"
								aria-label={
									isOpening ? `Opening ${title}` : title
								}
								disabled={isOpening}
								className="h-auto min-h-12 w-full items-start justify-start gap-3 whitespace-normal px-2 py-3 text-left font-normal"
								onClick={() => {
									void openRoom(room.roomId);
								}}
							>
								<MessageSquare
									aria-hidden="true"
									className="mt-0.5 size-4 shrink-0 text-muted-foreground"
								/>
								<span className="min-w-0 space-y-1">
									<span className="block break-words leading-snug">
										{isOpening ? "Opening…" : title}
									</span>
									{date ? (
										<time
											dateTime={date.toISOString()}
											className="block text-muted-foreground text-xs"
										>
											{date
												.toDate()
												.toLocaleDateString(undefined, {
													month: "short",
													day: "numeric",
													year: "numeric",
												})}
										</time>
									) : (
										<span className="block text-muted-foreground text-xs">
											Date unavailable
										</span>
									)}
								</span>
							</Button>
						</li>
					);
				})}
			</ul>
			{history.isLoading && (
				<output
					aria-label="Loading recent sessions"
					className="block space-y-3 py-3"
				>
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-3/4" />
				</output>
			)}
			{history.error && (
				<div role="alert" className="space-y-3 py-3">
					<P className="text-sm">{history.error}</P>
					<Button
						variant="outline"
						size="sm"
						className="pointer-coarse:min-h-11"
						onClick={history.retry}
					>
						Retry recent sessions
					</Button>
				</div>
			)}
			{!history.isLoading && !history.error && rooms.length === 0 && (
				<P className="py-3 text-muted-foreground text-sm">
					Your conversations will appear here after your first
					message.
				</P>
			)}
			{hasMore && !history.error && (
				<Button
					variant="ghost"
					size="sm"
					disabled={history.isLoading}
					className="mt-3 min-h-9 pointer-coarse:min-h-11 self-start"
					onClick={() => {
						if (visibleCount >= rooms.length) history.loadMore();
						setVisibleCount((count) => count + 5);
					}}
				>
					Show more sessions
				</Button>
			)}
		</BriefPanel>
	);
}
