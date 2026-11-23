import {
	ChevronRightIcon,
	ExternalLinkIcon,
	Search,
	StarIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useSessionIteratorPixel } from "@semoss/sdk/react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Muted,
	ScrollArea,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useCacheState,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { useLatestRef } from "@semoss/utility/react/use-latest-ref";
import { useChatConfig } from "../../chat/config/chat-config.context";
import { useChatSession } from "../../chat/provider/chat-session.context";
import { useChatSelector } from "../../chat/store/use-chat-selector";
import { DownloadDialog } from "../../room/actions/download-dialog";
import { RoomAgentAvatar } from "./room-agent-avatar";
import {
	buildPlaygroundRoomsPixel,
	groupRoomList,
	type RoomListHeading,
	type RoomListItem,
} from "./room-list-groups";
import { RoomListRow } from "./room-list-row";
import {
	ROOM_LIST_ACTION_CLASS,
	RoomListViewMenu,
} from "./room-list-view-menu";
import { useRoomListScroll } from "./use-room-list-scroll";
import { useRoomListView } from "./use-room-list-view";

/** Whether the shortcut keys read ⌘ (Apple) or Ctrl. */
const isApplePlatform =
	typeof navigator !== "undefined" &&
	/mac|iphone|ipad/i.test(navigator.userAgent);

/**
 * Whether a stored value is a list of strings, as the collapsed section keys are.
 *
 * @param value - What was read from storage.
 * @returns Whether it can be used as the collapsed keys.
 */
const isStringList = (value: unknown): value is string[] =>
	Array.isArray(value) && value.every((item) => typeof item === "string");

/** Props for {@link RoomList}. */
interface RoomListProps {
	/** Whether the list is on screen; it only loads and pages while it is. */
	isVisible: boolean;
	/** The room open now, marked in the list. */
	activeRoomId?: string;
	/** Whether each room shows its date. */
	hasRoomDates: boolean;
	/** Open chat search. */
	onOpenSearch: () => void;
}

/**
 * The user's chats: a heading with search and the view menu over the rooms,
 * grouped and sorted as the view says, paged as the list scrolls. Each room
 * renames in place (double-click or F2) and has a menu to favorite, download,
 * or delete it.
 */
export const RoomList = ({
	isVisible,
	activeRoomId,
	hasRoomDates,
	onOpenSearch,
}: RoomListProps) => {
	const { t } = useTranslation("sidebar");

	/**
	 * The label of an agent group's link to its agent.
	 *
	 * @param name - The agent's name, if it has one.
	 * @returns "Open <name>", or the unnamed agent's label.
	 */
	const getAgentLinkLabel = (name: string | undefined): string =>
		t("groups.openAgent", { name: name || t("groups.unnamedAgent") });
	const { options, callbacks } = useChatConfig();
	const [downloadRoomId, setDownloadRoomId] = useState<string | null>(null);
	const { view, isCustomized, setView } = useRoomListView();
	// section keys the user collapsed, kept across reloads
	const [storedCollapsed, setStoredCollapsed] = useCacheState<unknown>(
		[],
		"sidebar--collapsedRoomGroups--v1",
	);
	const collapsedKeys = new Set(
		isStringList(storedCollapsed) ? storedCollapsed : [],
	);
	const { chat } = useChatSession();
	const { roomCounter, optimisticRoomMap } = useChatSelector(
		chat,
		(current) => ({
			roomCounter: current.keys.roomCounter,
			optimisticRoomMap: current.optimisticRooms,
		}),
	);
	// Which view the rows on screen were loaded for. Until the first page of a
	// new view lands, the old rows stay, dimmed, and infinite scroll waits.
	const viewKey = `${view.sortBy}:${view.sortDir}:${view.groupBy}`;
	const viewKeyRef = useLatestRef(viewKey);
	const [loadedViewKey, setLoadedViewKey] = useState(viewKey);
	const isViewLoading = loadedViewKey !== viewKey;

	// the room whose name is being edited in place
	const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
	// rooms deleted here, hidden at once and until the refetch drops them
	const [deletedRoomIds, setDeletedRoomIds] = useState(new Set<string>());

	// The server orders by group, then favorites, then the sort, so each
	// section of the list arrives as one run and paging never reshuffles it.
	const getRooms = useSessionIteratorPixel<RoomListItem[], RoomListItem>(
		(limit, offset) => buildPlaygroundRoomsPixel(view, { limit, offset }),
		// a short page is the last one
		(response) => (response.length < 25 ? -1 : Infinity),
		(response) => response,
		{
			limit: 25,
			onSuccess: (_rows, isLoadingMore) => {
				if (!isLoadingMore) {
					setLoadedViewKey(viewKeyRef.current);
				}
			},
		},
		// Re-fetch from the top when the view changes. Counter-based refreshes
		// are handled by the useEffect below, which calls reset() and keeps
		// the current rows until the new ones land (no blank flash).
		[view.sortBy, view.sortDir, view.groupBy],
	);

	// pages in more rooms as the list scrolls, but not while a new view loads
	const { setScroll } = useInfiniteScroll({
		disabled:
			!isVisible ||
			isViewLoading ||
			getRooms.isLoading ||
			!getRooms.hasMore,
		// never while hidden: `disabled` covers it
		onNext: () => getRooms.next(),
	});

	// Skip the reset on first mount — the iterators already fetch on
	// init, so resetting here would cause a duplicate request. Subsequent
	// runs (when `roomCounter` increments after a new chat is created)
	// should refetch as intended.
	const hasMountedRef = useRef(false);
	useEffect(() => {
		// read so the effect runs again whenever the counter changes
		roomCounter;
		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			return;
		}
		getRooms.reset();
	}, [getRooms.reset, roomCounter]);

	// Once the refetch returns a room we were showing optimistically, drop the
	// optimistic entry so the store's map doesn't grow unbounded across a
	// session. The render-time filter already hides it, so this is housekeeping.
	useEffect(() => {
		const fetchedIds = new Set(getRooms.data.map((r) => r.ROOM_ID));
		Object.keys(chat.optimisticRooms).forEach((roomId) => {
			if (fetchedIds.has(roomId)) {
				chat.removeOptimisticRoom(roomId);
			}
		});
	}, [getRooms.data, chat]);

	// a new view or a refetch starts the list at the top
	const { viewportRef } = useRoomListScroll(
		isVisible,
		`${viewKey}#${roomCounter}`,
		setScroll,
	);

	// Rooms optimistically shown before their first message has persisted.
	// Drop any that the server has since returned (real data wins).
	const fetchedRoomIds = new Set(getRooms.data.map((r) => r.ROOM_ID));
	const optimisticRooms: RoomListItem[] = Object.values(
		optimisticRoomMap,
	).filter((r) => !fetchedRoomIds.has(r.ROOM_ID));

	const sections = groupRoomList(getRooms.data, view, optimisticRooms);
	const isGrouped = view.groupBy === "agent";

	// collapsing or expanding a section saves the whole set of collapsed keys
	const handleSectionOpenChange = (key: string, isOpen: boolean) => {
		const next = new Set(collapsedKeys);
		if (isOpen) {
			next.delete(key);
		} else {
			next.add(key);
		}
		setStoredCollapsed([...next]);
	};

	// what each kind of section shows in its collapsible heading
	const renderHeading = (heading: RoomListHeading) => {
		switch (heading.type) {
			case "pinned":
				return (
					<>
						<StarIcon
							className="size-3 fill-current"
							aria-hidden="true"
						/>
						{t("buckets.favorites")}
					</>
				);
			case "date":
				return t(`buckets.${heading.bucket}`);
			case "all":
				return t("groups.all");
			case "agent":
				return (
					<>
						<RoomAgentAvatar
							workspaceId={heading.workspaceId}
							workspaceName={heading.workspaceName}
						/>
						<span className="truncate text-foreground leading-none">
							{heading.workspaceName || t("groups.unnamedAgent")}
						</span>
					</>
				);
			case "noAgent":
				// no icon and no indent: a quiet, placeholder-like label
				return (
					<span className="truncate font-normal text-muted-foreground/70 leading-none">
						{t("groups.noAgent")}
					</span>
				);
		}
	};

	// the room leaves the list at once, and comes back if the delete fails
	const handleDeleteRoom = async (roomId: string) => {
		try {
			setDeletedRoomIds((prev) => new Set([...prev, roomId]));
			await chat.closeRoom(roomId);
			toast.success(t("toasts.roomDeletedSuccess"));
			if (activeRoomId === roomId) {
				callbacks.onOpenNewChat();
			}
			getRooms.reset();
		} catch (e) {
			if (e instanceof Error) {
				toast.error(e.message);
			}
			// Deletion failed — restore the room in the list.
			// On the success path we intentionally leave the
			// roomId in deletedRoomIds until the refetch lands, so
			// the room doesn't briefly reappear between the
			// reset() call and the new data arriving.
			setDeletedRoomIds((prev) => {
				const next = new Set(prev);
				next.delete(roomId);
				return next;
			});
		}
	};

	return (
		<>
			<SidebarContent
				className="min-h-30 flex-1 overflow-hidden pe-2"
				data-tour="tour-chat-history"
			>
				<div className="flex items-center justify-between gap-2 ps-6 pe-1 group-data-[collapsible=icon]:hidden">
					<h2 className="font-medium text-sidebar-foreground/70 text-xs">
						{t("chats")}
					</h2>
					<div className="flex items-center gap-0.5">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									className={ROOM_LIST_ACTION_CLASS}
									onClick={onOpenSearch}
									aria-haspopup="dialog"
									aria-label={t("searchChats.label")}
									aria-keyshortcuts={
										isApplePlatform ? "Meta+K" : "Control+K"
									}
									data-tour="tour-search"
								>
									<Search />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								{t("searchChats.label")}
								<span className="ms-2 text-muted-foreground">
									{isApplePlatform ? "⌘K" : "Ctrl K"}
								</span>
							</TooltipContent>
						</Tooltip>
						<RoomListViewMenu
							view={view}
							isCustomized={isCustomized}
							onViewChange={setView}
						/>
					</div>
				</div>
				<ScrollArea
					className="[&_[data-slot=scroll-area-viewport]>div]:block! min-h-0 flex-1"
					viewportRef={viewportRef}
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
					{sections.map((section) => {
						const rooms = section.rooms;
						if (!isVisible || rooms.length === 0) {
							return null;
						}

						return (
							<Collapsible
								key={section.key}
								open={!collapsedKeys.has(section.key)}
								onOpenChange={(isOpen) =>
									handleSectionOpenChange(section.key, isOpen)
								}
								asChild
							>
								<SidebarGroup
									className={cn(
										"group/section py-0.5 ps-4 group-data-[collapsible=icon]:hidden",
										isViewLoading && "opacity-60",
									)}
									aria-busy={isViewLoading}
								>
									{/* stays at the top while its rooms scroll by; the next heading pushes it up */}
									<div className="sticky top-0 z-10 bg-sidebar">
										<SidebarGroupLabel asChild>
											<CollapsibleTrigger className="w-full gap-2 truncate font-medium text-muted-foreground text-xs leading-none hover:text-sidebar-foreground">
												{renderHeading(section.heading)}
												<ChevronRightIcon
													aria-hidden="true"
													className="ms-auto size-3 shrink-0 text-muted-foreground/60 opacity-0 transition-[transform,opacity] group-focus-within/section:opacity-100 group-hover/section:opacity-100 group-data-[state=open]/section:rotate-90 group-data-[state=closed]/section:opacity-100"
												/>
											</CollapsibleTrigger>
										</SidebarGroupLabel>
										{section.heading.type === "agent" &&
										options.agentHref ? (
											<a
												href={options.agentHref(
													section.heading.workspaceId,
												)}
												target="_blank"
												rel="noopener noreferrer"
												aria-label={getAgentLinkLabel(
													section.heading
														.workspaceName,
												)}
												title={getAgentLinkLabel(
													section.heading
														.workspaceName,
												)}
												// beside the heading, not in it: the heading is the collapse button
												className="absolute end-7 top-1.5 flex size-5 items-center justify-center rounded-md text-muted-foreground opacity-0 outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:opacity-100 focus-visible:ring-2 group-hover/section:opacity-100 max-md:opacity-100"
											>
												<ExternalLinkIcon
													aria-hidden="true"
													className="size-3.5"
												/>
											</a>
										) : null}
									</div>
									<CollapsibleContent>
										<SidebarGroupContent>
											<SidebarMenu className="gap-0">
												{rooms.map((room) =>
													// deleted here, waiting for the refetch to drop it
													deletedRoomIds.has(
														room.ROOM_ID,
													) ? null : (
														<RoomListRow
															key={room.ROOM_ID}
															room={room}
															isActive={
																activeRoomId ===
																room.ROOM_ID
															}
															hasDate={
																hasRoomDates
															}
															isRenaming={
																editingRoomId ===
																room.ROOM_ID
															}
															// grouped, favorites lead their group instead of a section
															shouldShowFavoriteMark={
																isGrouped &&
																!!room.PINNED
															}
															onStartRename={() =>
																setEditingRoomId(
																	room.ROOM_ID,
																)
															}
															onStopRename={() =>
																setEditingRoomId(
																	null,
																)
															}
															onDownload={() =>
																setDownloadRoomId(
																	room.ROOM_ID,
																)
															}
															onDelete={() =>
																void handleDeleteRoom(
																	room.ROOM_ID,
																)
															}
														/>
													),
												)}
											</SidebarMenu>
										</SidebarGroupContent>
									</CollapsibleContent>
								</SidebarGroup>
							</Collapsible>
						);
					})}
				</ScrollArea>
			</SidebarContent>
			<DownloadDialog
				ns="sidebar"
				open={downloadRoomId !== null}
				onOpenChange={(open) => {
					if (!open) setDownloadRoomId(null);
				}}
				onDownload={(format) =>
					chat.downloadConversation(downloadRoomId ?? "", format)
				}
			/>
		</>
	);
};
