import { useState } from "react";
import { toast } from "@semoss/ui/next";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { dateLabel } from "@/features/collaboration/date-label";
import type { Topic } from "@/features/collaboration/state/collaboration.types";
import { useDashboard } from "@/features/dashboard/dashboard.context";
import { useRoomSearch } from "@/features/dashboard/use-room-search";
import {
	type TopicSessionRoom,
	useTopicSessions,
} from "@/features/dashboard/use-topic-sessions";
import type { RoomRow } from "@/features/rooms/api/room-schemas";
import { TopicChecklist, type TopicChecklistRow } from "./topic-checklist";

// the topic's own chats list this many; Show more adds as many again
const PAGE_SIZE = 50;

const VIA_TEXT: Record<NonNullable<TopicSessionRoom["via"]>, string> = {
	thread: "From one of this topic's threads",
	assistant: "Added by the assistant",
};

interface ChatSourceProps {
	/** A saved topic that is active or dormant; the server links a chat to no other. */
	topic: Topic;
	/** The topic's own chats, or every chat the owner has. */
	view: "topic" | "all";
}

/**
 * The owner's assistant chats, each with a box that puts it in the topic or takes it off. A change is saved
 * before the row shows it, and the chat stays listed so it can be undone where it was made.
 */
export function ChatSource({ topic, view }: ChatSourceProps) {
	const { actions, history } = useDashboard();
	const sessions = useTopicSessions(topic.id);
	const [query, setQuery] = useState("");
	const [limit, setLimit] = useState(PAGE_SIZE);
	const [changed, setChanged] = useState<ReadonlyMap<string, RoomRow>>(
		new Map(),
	);
	const [savingIds, setSavingIds] = useState<ReadonlySet<string>>(new Set());
	const [status, setStatus] = useState("");
	const search = useRoomSearch(actions, view === "all" ? query : "");

	const inTopic = new Map(sessions.rooms.map((room) => [room.roomId, room]));
	const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
	const titleOf = (room: RoomRow): string => room.roomName || "Untitled chat";
	// one of three lists: the topic's chats, a search by name, or the loaded history
	let source: {
		rooms: RoomRow[];
		isLoading: boolean;
		error: string;
		retry: () => void;
		hasMore: boolean;
		moreCount?: number;
		showMore: () => void;
	};
	if (view === "topic") {
		// the topic's chats, then the ones just taken off it
		const kept = [...changed.values()].filter(
			(room) => !inTopic.has(room.roomId),
		);
		const matches = [...sessions.rooms, ...kept].filter((room) => {
			const title = titleOf(room).toLocaleLowerCase();
			return terms.every((term) => title.includes(term));
		});
		source = {
			rooms: matches.slice(0, limit),
			isLoading: sessions.isLoading,
			error: sessions.linkedError,
			retry: sessions.retry,
			hasMore: matches.length > limit,
			moreCount: matches.length - limit,
			showMore: () => setLimit((current) => current + PAGE_SIZE),
		};
	} else if (terms.length > 0) {
		source = { ...search, showMore: () => undefined, hasMore: false };
	} else {
		source = {
			rooms: history.rooms,
			isLoading: history.isLoading,
			error: history.error,
			retry: history.retry,
			hasMore: history.hasMore,
			showMore: history.loadMore,
		};
	}
	const rows = source.rooms.map((room): TopicChecklistRow => {
		const raw = room.dateUpdated || room.dateCreated;
		const date = raw ? parseTimestampWithUtcDefault(raw) : null;
		const via = inTopic.get(room.roomId)?.via;
		return {
			id: room.roomId,
			title: titleOf(room),
			detail: via ? VIA_TEXT[via] : undefined,
			date: date?.isValid()
				? dateLabel(date.toISOString(), undefined, "date")
				: undefined,
			isChecked: inTopic.has(room.roomId),
			isSaving: savingIds.has(room.roomId),
		};
	});

	const handleToggle = async (
		roomId: string,
		isChecked: boolean,
	): Promise<void> => {
		const room = source.rooms.find((entry) => entry.roomId === roomId);
		if (!room || savingIds.has(roomId)) return;
		const setSaving = (isSaving: boolean): void =>
			setSavingIds((current) => {
				const next = new Set(current);
				if (isSaving) next.add(roomId);
				else next.delete(roomId);
				return next;
			});
		setSaving(true);
		try {
			await sessions.setInTopic(room, isChecked);
			setChanged((current) => new Map(current).set(roomId, room));
			setStatus(
				isChecked
					? `Added "${titleOf(room)}" to this topic.`
					: `Removed "${titleOf(room)}" from this topic.`,
			);
		} catch (cause) {
			toast.error(
				`Could not ${isChecked ? "add" : "remove"} "${titleOf(room)}".`,
				{
					description:
						cause instanceof Error ? cause.message : undefined,
				},
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		// rows with nothing to read beside them stay a readable width on a wide screen
		<div className="flex min-h-0 min-w-0 flex-1">
			<div className="flex min-h-0 min-w-0 flex-1 flex-col xl:max-w-3xl xl:border-r">
				<TopicChecklist
					label={
						view === "topic"
							? "Assistant chats in this topic"
							: "Assistant chats"
					}
					description={
						view === "topic"
							? "Your chats with the assistant that are filed under this topic. Uncheck one to take it off."
							: "Your chats with the assistant in this app. These are not Teams chats."
					}
					noun="chats"
					searchPlaceholder="Search by chat name"
					query={query}
					onQueryChange={(next) => {
						setQuery(next);
						setLimit(PAGE_SIZE);
					}}
					rows={rows}
					onToggle={(roomId, isChecked) =>
						void handleToggle(roomId, isChecked)
					}
					hasMore={source.hasMore}
					moreCount={source.moreCount}
					onShowMore={source.showMore}
					isLoading={source.isLoading}
					error={source.error}
					onRetry={source.retry}
					emptyText={
						view === "topic"
							? "No assistant chats in this topic yet. Pick some under Assistant chats."
							: "You have no assistant chats yet."
					}
					footnote={
						view === "all" && terms.length > 0 && search.hasMore
							? "Showing the first matches. Keep typing to narrow it down."
							: undefined
					}
					status={status}
					hint={
						view === "topic"
							? "Uncheck a chat to take it off this topic."
							: undefined
					}
				/>
			</div>
		</div>
	);
}
