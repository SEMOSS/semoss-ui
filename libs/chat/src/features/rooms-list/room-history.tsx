import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import type { PlaygroundRoomRow } from "@semoss/sdk";
import { useRoomsClient } from "@semoss/sdk/react";
import {
	Muted,
	ScrollArea,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	Spinner,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import {
	DATE_BUCKET_ORDER,
	getDateBucket,
	parseTimestampWithUtcDefault,
} from "@semoss/utility/date";
import { useChat } from "../../host/chat.context";
import { DownloadConversationDialog } from "../room-actions/download-conversation-dialog";
import { RoomHistoryItem } from "./room-history-item";
import { useRoomsQuery } from "./use-rooms-query";

// matches useInfiniteScroll's: past this, the next page is on its way
const NEAR_BOTTOM_PX = 100;

/** Props for {@link RoomHistory}. */
export interface RoomHistoryProps {
	/** The search as typed; the list waits for the typing to pause. */
	search: string;
	/**
	 * Whether the list is on screen. Hidden, it renders no rows and reads no
	 * more pages: a collapsed or closed sidebar has no height, so its end
	 * would always look reached.
	 */
	isVisible: boolean;
	/** The room on screen, highlighted. */
	activeRoomId?: string;
	/** Show when each room was created, under its name. */
	showDates?: boolean;
}

/**
 * The chat history for a host's sidebar: favorites, then the rest by date,
 * read a page at a time as the list scrolls, each with its menu. Renders
 * inside a `@semoss/ui/next` `Sidebar`; the host keeps the search box.
 *
 * @component
 */
export const RoomHistory = ({
	search,
	isVisible,
	activeRoomId,
	showDates = false,
}: RoomHistoryProps) => {
	const { t } = useTranslation("sidebar");
	const { chat, config } = useChat();
	const debouncedSearch = useDebouncedValue(search);
	const [downloadRoomId, setDownloadRoomId] = useState<string | null>(null);
	// rooms deleted here, hidden until the lists read again without them
	const [deletedIds, setDeletedIds] = useState(() => new Set<string>());

	// favorites first, then the rest page by page; both read again whenever
	// a room is created, renamed, pinned or closed anywhere in the app
	const getPinnedRooms = useRoomsQuery({ pinned: true });
	const getRooms = useRoomsQuery({
		search: debouncedSearch,
		limit: 25,
		includeOptimistic: true,
	});

	const { setScroll } = useInfiniteScroll({
		disabled: !isVisible || getRooms.isLoading || !getRooms.hasMore,
		onNext: () => {
			if (isVisible) {
				getRooms.next();
			}
		},
	});

	/**
	 * Scroll position. Hiding the rows empties the list, which loses its
	 * scroll; it comes back where it was when the list shows again. Kept in
	 * a ref: a scroll is no reason to render the list.
	 */
	const scrollElementRef = useRef<HTMLDivElement | null>(null);
	const savedScrollTop = useRef(0);

	useEffect(() => {
		const element = scrollElementRef.current;
		if (!element) {
			return;
		}
		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = element;
			// near the end the next page is loading; the spot is not kept
			if (scrollHeight - (scrollTop + clientHeight) > NEAR_BOTTOM_PX) {
				savedScrollTop.current = scrollTop;
			}
		};
		element.addEventListener("scroll", handleScroll, { passive: true });
		return () => element.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
		const element = scrollElementRef.current;
		if (!isVisible || !element) {
			return;
		}
		// the list reads its end from this element once it has a height
		setScroll(element);
		if (savedScrollTop.current > 0) {
			const frame = requestAnimationFrame(() => {
				element.scrollTop = savedScrollTop.current;
			});
			return () => cancelAnimationFrame(frame);
		}
	}, [isVisible, setScroll]);

	// The lists read again when the rooms change (`roomsVersion`); the list
	// scrolls back to the top so the change is in view. Skipped on first
	// mount, which has nothing to scroll back from.
	const roomsVersion = useRoomsClient(chat, (client) => client.roomsVersion);
	const seenRoomsVersion = useRef(roomsVersion);
	useEffect(() => {
		if (seenRoomsVersion.current === roomsVersion) {
			return;
		}
		seenRoomsVersion.current = roomsVersion;
		savedScrollTop.current = 0;
		if (scrollElementRef.current) {
			scrollElementRef.current.scrollTop = 0;
		}
	}, [roomsVersion]);

	const handleDelete = async (roomId: string) => {
		// hidden at once; on success it stays hidden until the lists come
		// back without it, so it does not flash back in between
		setDeletedIds((prev) => new Set(prev).add(roomId));
		try {
			await chat.closeRoom(roomId);
			toast.success(t("toasts.roomDeletedSuccess"));
			if (activeRoomId === roomId) {
				config.navigation.onLeaveRoom();
			}
			getRooms.reset();
			getPinnedRooms.reset();
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message);
			}
			setDeletedIds((prev) => {
				const next = new Set(prev);
				next.delete(roomId);
				return next;
			});
		}
	};

	/**
	 * Bucket the rooms: favorites, then by date. Rooms created here and not
	 * listed yet go first, unless the server has since listed them.
	 */
	const pinnedRoomIds = new Set(getPinnedRooms.data.map((r) => r.ROOM_ID));
	const fetchedRoomIds = new Set([
		...getRooms.data.map((r) => r.ROOM_ID),
		...pinnedRoomIds,
	]);
	const optimisticRooms = getRooms.optimisticRooms.filter(
		(r) => !fetchedRoomIds.has(r.ROOM_ID),
	);
	const buckets: { label: string; rooms: PlaygroundRoomRow[] }[] = [
		{ label: t("buckets.favorites"), rooms: [...getPinnedRooms.data] },
		...DATE_BUCKET_ORDER.map((bucket) => ({
			label: t(`buckets.${bucket}`),
			rooms: [] as PlaygroundRoomRow[],
		})),
	];
	for (const room of [...optimisticRooms, ...getRooms.data]) {
		// favorites come from their own list
		if (room.PINNED || pinnedRoomIds.has(room.ROOM_ID)) {
			continue;
		}
		const bucket = getDateBucket(
			parseTimestampWithUtcDefault(room.DATE_CREATED),
		);
		buckets[DATE_BUCKET_ORDER.indexOf(bucket) + 1].rooms.push(room);
	}

	return (
		<>
			<ScrollArea
				className="[&_[data-slot=scroll-area-viewport]>div]:block! h-full"
				viewportRef={(element) => {
					scrollElementRef.current = element;
				}}
			>
				{isVisible && getRooms.isError && (
					<div className="px-2 py-4 text-center">
						<Muted className="text-destructive">
							{t("messages.errorLoadingRooms")}
						</Muted>
					</div>
				)}
				{isVisible &&
					getRooms.isLoading &&
					getRooms.data.length === 0 && (
						<div className="flex w-full items-center justify-center px-2 py-4">
							<Spinner className="size-4" />
						</div>
					)}
				{isVisible &&
					!getRooms.isLoading &&
					getRooms.data.length === 0 &&
					optimisticRooms.length === 0 && (
						<div className="px-2 py-4 text-center">
							<Muted>{t("messages.noRoomsFound")}</Muted>
						</div>
					)}
				{isVisible &&
					buckets.map(({ label, rooms }) => {
						const shown = rooms.filter(
							(room) => !deletedIds.has(room.ROOM_ID),
						);
						if (shown.length === 0) {
							return null;
						}
						return (
							<SidebarGroup
								key={label}
								className="ps-4 transition-all duration-200 ease-in-out group-data-[collapsible=icon]:hidden"
							>
								<SidebarGroupLabel className="truncate font-medium text-muted-foreground text-xs leading-normal">
									{label}
								</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										{shown.map((room) => (
											<RoomHistoryItem
												key={room.ROOM_ID}
												room={room}
												isActive={
													activeRoomId ===
													room.ROOM_ID
												}
												showDate={showDates}
												onDownload={setDownloadRoomId}
												onDelete={handleDelete}
											/>
										))}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						);
					})}
			</ScrollArea>
			<DownloadConversationDialog
				roomId={downloadRoomId}
				open={downloadRoomId !== null}
				onOpenChange={(open) => {
					if (!open) {
						setDownloadRoomId(null);
					}
				}}
			/>
		</>
	);
};
