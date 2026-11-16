import {
	ChevronRightIcon,
	DownloadIcon,
	ExternalLinkIcon,
	MoreVertical,
	Search,
	StarIcon,
	TrashIcon,
} from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useSessionIteratorPixel } from "@semoss/sdk/react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Muted,
	ScrollArea,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useCacheState,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { useChatSelector } from "../chat/use-chat-selector";
import { useChatSession } from "../chat/use-chat-session";
import { useChatConfig } from "../chat-config/use-chat-config";
import { DownloadConversationDialog } from "../room-actions/download-conversation-dialog";
import {
	renameRoom,
	toggleRoomFavorite,
} from "../room-actions/use-room-actions";
import { RoomName } from "../room-name/room-name";
import { RoomAgentAvatar } from "./room-agent-avatar";
import {
	buildPlaygroundRoomsPixel,
	getRoomDate,
	groupRoomList,
	type RoomListHeading,
	type RoomListItem,
} from "./room-list-groups";
import {
	ROOM_LIST_ACTION_CLASS,
	RoomListViewMenu,
} from "./room-list-view-menu";
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
	/** Open chat search. */
	onSearch: () => void;
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
	onSearch,
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
	const { theme, navigation } = useChatConfig();
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
	// the room whose actions menu is open, from its ⋯ button or a right click
	const [menuRoomId, setMenuRoomId] = useState<string | null>(null);
	const { chat } = useChatSession();
	const { roomCounter, optimisticRoomMap } = useChatSelector(
		chat,
		(current) => ({
			roomCounter: current.keys.roomCounter,
			optimisticRoomMap: current.optimisticRooms,
		}),
	);
	const isChatHistoryHidden = !!theme.featureFlags?.hideChatHistory;
	// The last scroll position is kept in a ref, so scrolling never re-renders
	// the nav, and put back only when the sidebar opens again.
	const savedScrollRef = useRef(0);
	const scrollElementRef = useRef<HTMLDivElement | null>(null);

	// Which view the rows on screen were loaded for. Until the first page of a
	// new view lands, the old rows stay, dimmed, and infinite scroll waits.
	const viewKey = `${view.sortBy}:${view.sortDir}:${view.groupBy}`;
	const viewKeyRef = useRef(viewKey);
	viewKeyRef.current = viewKey;
	const [loadedViewKey, setLoadedViewKey] = useState(viewKey);
	const isViewLoading = loadedViewKey !== viewKey;

	// the room whose name is being edited in place
	const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
	// rooms deleted here, hidden at once and until the refetch drops them
	const [deletedRoomIds, setDeletedRoomIds] = useState(new Set<string>());

	// The server orders by group, then favorites, then the sort, so each
	// section of the list arrives as one run and paging never reshuffles it.
	const getRooms = useSessionIteratorPixel<RoomListItem[], RoomListItem>(
		(limit, offset) =>
			isChatHistoryHidden
				? ""
				: buildPlaygroundRoomsPixel(view, { limit, offset }),
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
		onNext: () => {
			if (isVisible) {
				getRooms.next();
			}
		},
	});

	// one passive listener per viewport; it only records where the list is
	useEffect(() => {
		const element = scrollElementRef.current;
		if (!element || !isVisible) {
			return;
		}
		const handleScroll = () => {
			savedScrollRef.current = element.scrollTop;
		};
		element.addEventListener("scroll", handleScroll, { passive: true });
		return () => element.removeEventListener("scroll", handleScroll);
	}, [isVisible]);

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
		if (scrollElementRef.current) {
			scrollElementRef.current.scrollTop = 0;
		}
		savedScrollRef.current = 0;
	}, [getRooms.reset, roomCounter]);

	// A new order or grouping starts at the top; the iterator already reloads
	// from its first page for the new view
	const shownViewKeyRef = useRef(viewKey);
	useEffect(() => {
		if (shownViewKeyRef.current === viewKey) {
			return;
		}
		shownViewKeyRef.current = viewKey;
		if (scrollElementRef.current) {
			scrollElementRef.current.scrollTop = 0;
		}
		savedScrollRef.current = 0;
	}, [viewKey]);

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

	// put the list back where it was when the sidebar opens again
	useEffect(() => {
		const scrollElement = scrollElementRef.current;
		if (!scrollElement || !isVisible || savedScrollRef.current === 0) {
			return;
		}
		const frame = requestAnimationFrame(() => {
			scrollElement.scrollTop = savedScrollRef.current;
		});
		return () => cancelAnimationFrame(frame);
	}, [isVisible]);

	// Wire infinite scroll once the sidebar becomes visible. The
	// viewportRef callback only fires on mount, so when the mobile
	// Sheet opens after initial mount, this effect re-registers the
	// scroll target with useInfiniteScroll.
	useEffect(() => {
		if (isVisible && scrollElementRef.current) {
			setScroll(scrollElementRef.current);
		}
	}, [isVisible, setScroll]);

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

	// toggleRoomFavorite bumps roomCounter, which the effect above watches to
	// refetch the list
	const handleToggleFavorite = (roomId: string, isFavorite: boolean) =>
		toggleRoomFavorite(chat, roomId, isFavorite, t);

	const handleStartRename = (roomId: string) => setEditingRoomId(roomId);

	const handleStopRename = () => setEditingRoomId(null);

	// the room leaves the list at once, and comes back if the delete fails
	const handleDeleteRoom = async (roomId: string) => {
		try {
			setDeletedRoomIds((prev) => new Set([...prev, roomId]));
			await chat.closeRoom(roomId);
			toast.success(t("toasts.roomDeletedSuccess"));
			if (activeRoomId === roomId) {
				navigation.onRoomDeleted(roomId);
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

	// a plain click opens the room in place; a modified or middle click is the
	// browser's, so the link still opens in a new tab
	const handleOpenRoom = (
		event: MouseEvent<HTMLAnchorElement>,
		roomId: string,
	) => {
		if (
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}
		event.preventDefault();
		navigation.openRoom(roomId);
	};

	return (
		<>
			<SidebarContent
				className="min-h-[120px] flex-1 overflow-hidden pe-2"
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
									onClick={onSearch}
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
					viewportRef={(ele) => {
						if (ele) {
							scrollElementRef.current = ele;
							// Only wire infinite scroll when the sidebar is
							// actually visible. On mobile the sidebar mounts
							// inside a closed Sheet with 0-height viewport;
							// the IntersectionObserver would see the sentinel
							// as always-in-view and fire next() repeatedly,
							// pulling every page in rapid succession.
							if (isVisible) {
								setScroll(ele);
							}
						}
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
										navigation.agentHref ? (
											<a
												href={navigation.agentHref(
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
												{rooms.map((room) => {
													const roomId = room.ROOM_ID;
													const date = theme.sidebar
														.chatHistoryDate
														? parseTimestampWithUtcDefault(
																getRoomDate(
																	room,
																),
															)
																.toDate()
																.toLocaleString(
																	undefined,
																	{
																		month: "numeric",
																		day: "numeric",
																		year: "numeric",
																		hour: "numeric",
																		minute: "2-digit",
																		hour12: true,
																	},
																)
														: null;
													const isFavorite =
														room.PINNED || false;
													// grouped, favorites lead their group instead of a section
													const shouldShowFavoriteMark =
														isGrouped && isFavorite;
													const isEditing =
														editingRoomId ===
														roomId;

													// the same name, editable in place, whether or not it is being renamed
													const roomName = (
														<RoomName
															name={
																room.ROOM_NAME ??
																""
															}
															placeholder={t(
																"messages.untitled",
															)}
															isRenaming={
																isEditing
															}
															onStartRename={() =>
																handleStartRename(
																	roomId,
																)
															}
															onRename={(
																nextName,
															) =>
																renameRoom(
																	chat,
																	roomId,
																	nextName,
																	t,
																)
															}
															onStopRename={
																handleStopRename
															}
															className={
																isEditing
																	? "h-8 max-w-none flex-1"
																	: "min-w-0 flex-1 font-medium text-sm leading-tight"
															}
														/>
													);

													// deleted here, waiting for the refetch to drop it
													if (
														deletedRoomIds.has(
															roomId,
														)
													) {
														return null;
													}

													return (
														<SidebarMenuItem
															key={roomId}
															className="group/room relative flex"
														>
															{isEditing ? (
																roomName
															) : (
																<>
																	<SidebarMenuButton
																		asChild
																		isActive={
																			activeRoomId ===
																			roomId
																		}
																	>
																		<a
																			className={cn(
																				"flex h-auto flex-col items-start justify-center px-2 py-1",
																				date &&
																					"gap-1",
																			)}
																			href={navigation.roomHref(
																				roomId,
																			)}
																			onClick={(
																				event,
																			) =>
																				handleOpenRoom(
																					event,
																					roomId,
																				)
																			}
																			onContextMenu={(
																				event,
																			) => {
																				event.preventDefault();
																				setMenuRoomId(
																					roomId,
																				);
																			}}
																			onKeyDown={(
																				event,
																			) => {
																				if (
																					event.key !==
																					"F2"
																				)
																					return;
																				event.preventDefault();
																				handleStartRename(
																					roomId,
																				);
																			}}
																		>
																			<span className="flex w-full min-w-0 items-center gap-1.5">
																				{shouldShowFavoriteMark ? (
																					<StarIcon
																						className="size-3 shrink-0 fill-current text-muted-foreground"
																						aria-hidden="true"
																					/>
																				) : null}
																				{
																					roomName
																				}
																			</span>
																			{date && (
																				<span className="text-muted-foreground text-xs leading-none">
																					{
																						date
																					}
																				</span>
																			)}
																		</a>
																	</SidebarMenuButton>
																	<DropdownMenu
																		modal={
																			false
																		}
																		open={
																			menuRoomId ===
																			roomId
																		}
																		onOpenChange={(
																			isOpen,
																		) =>
																			setMenuRoomId(
																				isOpen
																					? roomId
																					: null,
																			)
																		}
																	>
																		<DropdownMenuTrigger
																			asChild
																		>
																			<Button
																				variant="ghost"
																				size="icon-sm"
																				aria-label={t(
																					"actions.roomActions",
																				)}
																				// shown on hover, keyboard focus, or while open; always on touch screens
																				className="text-muted-foreground hover:text-sidebar-accent-foreground focus-visible:opacity-100 data-[state=open]:opacity-100 md:opacity-0 md:group-hover/room:opacity-100 md:group-focus-within/room:opacity-100"
																				onClick={(
																					e,
																				) => {
																					e.stopPropagation();
																				}}
																			>
																				<MoreVertical className="size-4" />
																			</Button>
																		</DropdownMenuTrigger>
																		<DropdownMenuContent
																			align="start"
																			side="right"
																			sideOffset={
																				5
																			}
																			className="w-40"
																		>
																			<DropdownMenuItem
																				onClick={(
																					e,
																				) => {
																					e.stopPropagation();
																					handleToggleFavorite(
																						roomId,
																						isFavorite,
																					);
																				}}
																			>
																				<StarIcon
																					className={cn(
																						"me-2 size-4",
																						isFavorite &&
																							"fill-yellow-500 text-yellow-500",
																					)}
																				/>
																				{isFavorite
																					? t(
																							"actions.unfavorite",
																						)
																					: t(
																							"actions.favorite",
																						)}
																			</DropdownMenuItem>
																			<DropdownMenuItem
																				onClick={(
																					e,
																				) => {
																					e.stopPropagation();
																					setDownloadRoomId(
																						roomId,
																					);
																				}}
																			>
																				<DownloadIcon className="me-2 size-4" />
																				{t(
																					"actions.download",
																				)}
																			</DropdownMenuItem>
																			<DropdownMenuItem
																				onClick={(
																					e,
																				) => {
																					e.stopPropagation();
																					void handleDeleteRoom(
																						roomId,
																					);
																				}}
																				className="text-destructive focus:text-destructive"
																			>
																				<TrashIcon className="me-2 size-4" />
																				{t(
																					"actions.delete",
																				)}
																			</DropdownMenuItem>
																		</DropdownMenuContent>
																	</DropdownMenu>
																</>
															)}
														</SidebarMenuItem>
													);
												})}
											</SidebarMenu>
										</SidebarGroupContent>
									</CollapsibleContent>
								</SidebarGroup>
							</Collapsible>
						);
					})}
				</ScrollArea>
			</SidebarContent>
			<DownloadConversationDialog
				roomId={downloadRoomId}
				open={downloadRoomId !== null}
				onOpenChange={(open) => {
					if (!open) setDownloadRoomId(null);
				}}
			/>
		</>
	);
};
