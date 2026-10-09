import { Link } from "react-router";
import {
	Alert,
	AlertDescription,
	Button,
	P,
	Small,
	Spinner,
} from "@semoss/ui/next";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { dateLabel } from "@/features/collaboration/date-label";
import { roomPath } from "@/lib/workspace-paths";
import { useDashboard } from "./dashboard.context";
import { useTopicSessions } from "./use-topic-sessions";

interface TopicSessionsProps {
	/** The topic whose current source threads identify linked conversations. */
	topicId: string;
}

/** Saved conversations with explicit links to this topic's source threads. */
export function TopicSessions({ topicId }: TopicSessionsProps) {
	const { history, openRoom, openingRoom } = useDashboard();
	const sessions = useTopicSessions(topicId);
	return (
		<section aria-label="Topic sessions" className="space-y-4 p-4 md:p-6">
			<P className="text-muted-foreground text-sm">
				Conversations opened from this topic's threads.
			</P>
			{sessions.rooms.length > 0 && (
				<ul className="divide-y divide-border">
					{sessions.rooms.map((room) => {
						const title = room.roomName || "Untitled chat";
						const rawDate = room.dateUpdated || room.dateCreated;
						const parsedDate = rawDate
							? parseTimestampWithUtcDefault(rawDate)
							: null;
						const date = parsedDate?.isValid()
							? parsedDate.toISOString()
							: undefined;
						return (
							<li key={room.roomId}>
								<Link
									to={roomPath(room.roomId)}
									aria-disabled={
										openingRoom === room.roomId || undefined
									}
									className="flex min-h-11 min-w-0 flex-wrap items-center justify-between gap-2 rounded-md px-2 py-3 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
									onClick={(event) => {
										if (
											event.button !== 0 ||
											event.metaKey ||
											event.ctrlKey ||
											event.shiftKey ||
											event.altKey
										)
											return;
										event.preventDefault();
										if (openingRoom !== room.roomId)
											void openRoom(room.roomId);
									}}
								>
									<span className="min-w-0 break-words text-sm">
										{openingRoom === room.roomId
											? `Opening ${title}…`
											: title}
									</span>
									<Small className="shrink-0 font-normal text-muted-foreground text-xs">
										{date ? (
											<time dateTime={date}>
												{dateLabel(date)}
											</time>
										) : (
											"Date unavailable"
										)}
									</Small>
								</Link>
							</li>
						);
					})}
				</ul>
			)}
			{sessions.isLoading && (
				<output className="flex items-center gap-2 text-muted-foreground text-sm">
					<Spinner aria-hidden="true" />
					Checking linked sessions…
				</output>
			)}
			{sessions.errorCount > 0 && (
				<Alert variant="destructive">
					<AlertDescription className="space-y-2">
						<P className="text-sm">
							Could not check {sessions.errorCount}{" "}
							{sessions.errorCount === 1 ? "session" : "sessions"}
							. These results may be incomplete.
						</P>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="pointer-coarse:min-h-11"
							disabled={sessions.isLoading}
							onClick={sessions.retry}
						>
							Retry session links
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{history.error && (
				<Alert variant="destructive">
					<AlertDescription className="space-y-2">
						<P className="text-sm">{history.error}</P>
						<Button
							type="button"
							size="sm"
							variant="outline"
							className="pointer-coarse:min-h-11"
							onClick={history.retry}
						>
							Retry sessions
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{!sessions.isLoading &&
				!sessions.errorCount &&
				!history.error &&
				!sessions.rooms.length && (
					<P className="text-muted-foreground text-sm">
						No linked sessions in loaded history.
					</P>
				)}
			{sessions.checkedCount > 0 && (
				<Small className="block font-normal text-muted-foreground text-xs">
					Checked {sessions.checkedCount} saved{" "}
					{sessions.checkedCount === 1 ? "session" : "sessions"}.
				</Small>
			)}
			{sessions.hasMore && !history.error && (
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="pointer-coarse:min-h-11"
					disabled={sessions.isLoading}
					onClick={sessions.loadMore}
				>
					Load more sessions
				</Button>
			)}
		</section>
	);
}
