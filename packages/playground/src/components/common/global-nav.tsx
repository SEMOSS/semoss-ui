import {
	Bot,
	DownloadIcon,
	HelpCircle,
	MessagesSquareIcon,
	MoreVertical,
	PencilIcon,
	Search,
	SquarePenIcon,
	StarIcon,
	TrashIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Link,
	matchPath,
	useLocation,
	useNavigate,
	useParams,
} from "react-router";
import {
	DownloadConversationDialog,
	renameRoom,
	toggleRoomFavorite,
	useChat,
	useRoomsQuery,
} from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import { useRoomsClient } from "@semoss/sdk/react";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	ScrollArea,
	Separator,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	Spinner,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
	useSidebar,
} from "@semoss/ui/next";
import {
	DATE_BUCKET_ORDER,
	getDateBucket,
	parseTimestampWithUtcDefault,
} from "@semoss/utility/date";
import { MobileNavigationClose } from "@/features/navigation/mobile-navigation-close";
import { NavigationRail } from "@/features/navigation/navigation-rail";
import { NavigationToggle } from "@/features/navigation/navigation-toggle";
import { useRoot } from "@/hooks/use-root";
import { AppLogo } from "./app-logo";
import { GlobalNavItem } from "./global-nav-item";
import { NavUser } from "./nav-user";

let isIframed = false;
try {
	isIframed = window.self !== window.top;
} catch {
	isIframed = true;
}

/**
 * Renders a sidebar allowing users to navigate between pages
 *
 * @component
 */
export const GlobalNav = () => {
	const { t } = useTranslation(["sidebar", "appNav"]);

	const dateBucketLabels = DATE_BUCKET_ORDER.map((bucket) =>
		t(`buckets.${bucket}`),
	);
	const BUCKETS = [t("buckets.favorites"), ...dateBucketLabels];
	const [downloadRoomId, setDownloadRoomId] = useState<string | null>(null);
	const { root } = useRoot();
	const [search, setSearch] = useState("");
	const [helpOpen, setHelpOpen] = useState(false);
	const { chat } = useChat();
	const { open, openMobile, isMobile } = useSidebar();
	const hideChatHistory = !!root.theme.featureFlags?.hideChatHistory;
	// True when the sidebar is actually visible to the user.
	// Desktop: tracks the expand/collapse state (`open`).
	// Mobile: tracks the Sheet's open state (`openMobile`) — the Sheet
	// mounts hidden with 0-height, so we must avoid wiring infinite
	// scroll until the user opens it.
	const isVisible = (isMobile ? openMobile : open) && !hideChatHistory;
	const { pathname } = useLocation();
	const { roomId: activeRoomId } = useParams<{ roomId: string }>();
	const debouncedSearch = useDebouncedValue(search);

	/**
	 * Preserving scroll position
	 */
	const [savedScrollPosition, setSavedScrollPosition] = useState(0);
	const scrollElementRef = useRef<HTMLDivElement | null>(null);

	/**
	 * Inline rename state - tracks which room is being renamed
	 */
	const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");

	const [deletedSet, setDeletedSet] = useState(new Set<string>());

	const navigate = useNavigate();

	// favorites first, then the rest page by page; both read again whenever
	// a room is created, renamed, pinned or closed anywhere in the app
	const getPinnedRooms = useRoomsQuery({
		pinned: true,
		enabled: !hideChatHistory,
	});
	const getRooms = useRoomsQuery({
		search: debouncedSearch,
		limit: 25,
		enabled: !hideChatHistory,
		includeOptimistic: true,
	});

	/**
	 * Setup infinite scroll for the command list
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: !isVisible || getRooms.isLoading || !getRooms.hasMore,
		onNext: () => {
			if (isVisible) {
				getRooms.next();
			}
		},
	});

	const handleScroll = useCallback(() => {
		if (scrollElementRef.current) {
			if (savedScrollPosition !== scrollElementRef.current.scrollTop) {
				const { scrollTop, scrollHeight, clientHeight } =
					scrollElementRef.current;
				const distanceFromBottom =
					scrollHeight - (scrollTop + clientHeight);

				// Threshold pulled from use-infinite-scroll
				if (distanceFromBottom > 100) {
					setSavedScrollPosition(scrollElementRef.current.scrollTop);
				}
			}
		}
	}, [savedScrollPosition]);

	/**
	 * Effects
	 */
	useEffect(() => {
		const element = scrollElementRef.current;
		if (element) {
			element.addEventListener("scroll", handleScroll);
			return () => element.removeEventListener("scroll", handleScroll);
		}
	}, [handleScroll]);

	// The rooms queries read again when the rooms change (`roomsVersion`);
	// the list scrolls back to the top so the change is in view. Skipped on
	// first mount, which has nothing to scroll back from.
	const roomsVersion = useRoomsClient(chat, (client) => client.roomsVersion);
	const seenRoomsVersion = useRef(roomsVersion);
	useEffect(() => {
		if (seenRoomsVersion.current === roomsVersion) {
			return;
		}
		seenRoomsVersion.current = roomsVersion;
		if (scrollElementRef.current) {
			scrollElementRef.current.scrollTop = 0;
			setSavedScrollPosition(0);
		}
	}, [roomsVersion]);

	/**
	 * Save and restore scroll position when sidebar opens/closes
	 */
	useEffect(() => {
		const scrollElement = scrollElementRef.current;

		if (!scrollElement || !open) return;

		if (
			savedScrollPosition > 0 &&
			savedScrollPosition !== scrollElement.scrollTop
		) {
			// Restore scroll position when opening
			requestAnimationFrame(() => {
				scrollElement.scrollTop = savedScrollPosition;
			});
		}
	}, [open, savedScrollPosition]);

	/**
	 * Wire infinite scroll once the sidebar becomes visible. The
	 * viewportRef callback only fires on mount, so when the mobile
	 * Sheet opens after initial mount, this effect re-registers the
	 * scroll target with useInfiniteScroll.
	 */
	useEffect(() => {
		if (isVisible && scrollElementRef.current) {
			setScroll(scrollElementRef.current);
		}
	}, [isVisible, setScroll]);

	/**
	 * Bucket the rooms by date
	 */
	const pinnedRoomIds = new Set(getPinnedRooms.data.map((r) => r.ROOM_ID));

	// Rooms optimistically shown before their first message has persisted.
	// Drop any that the server has since returned (real data wins), and skip
	// them entirely while searching so they don't pollute filtered results.
	const fetchedRoomIds = new Set([
		...getRooms.data.map((r) => r.ROOM_ID),
		...pinnedRoomIds,
	]);
	const optimisticRooms = getRooms.optimisticRooms.filter(
		(r) => !fetchedRoomIds.has(r.ROOM_ID),
	);

	const bucketedRooms = [...optimisticRooms, ...getRooms.data].reduce(
		(acc, val) => {
			// Skip rooms handled by the dedicated pinned query
			if (val.PINNED || pinnedRoomIds.has(val.ROOM_ID)) return acc;

			const d = parseTimestampWithUtcDefault(val.DATE_CREATED);
			const bucket = getDateBucket(d);
			acc[t(`buckets.${bucket}`)].push(val);

			return acc;
		},
		{
			[t("buckets.favorites")]: [...getPinnedRooms.data],
			...Object.fromEntries(dateBucketLabels.map((label) => [label, []])),
		} as Record<string, typeof getRooms.data>,
	);

	/**
	 * Handlers
	 */
	// pinRoom bumps the rooms version, so both room queries here read again
	// and the chats page stays in sync
	const handleToggleFavorite = (roomId: string, isFavorite: boolean) =>
		toggleRoomFavorite(chat, roomId, isFavorite, t);

	const handleStartRename = (roomId: string, currentName: string) => {
		setEditingRoomId(roomId);
		setEditingName(currentName);
	};

	const handleCancelRename = () => {
		setEditingRoomId(null);
		setEditingName("");
	};

	const handleSaveRename = async (roomId: string) => {
		if (await renameRoom(chat, roomId, editingName, t))
			handleCancelRename();
	};

	return (
		<>
			<Sidebar
				collapsible="icon"
				variant="inset"
				className="z-30 h-full p-0 transition-[width] duration-200 ease-in-out"
			>
				<SidebarHeader>
					<SidebarMenu className="gap-1 transition-all duration-200 ease-in-out group-data-[collapsible=icon]:px-2">
						<SidebarMenuItem className="flex min-w-0 items-center">
							<SidebarMenuButton
								size="lg"
								className="h-8 min-w-0 flex-1 group-data-[collapsible=icon]:hidden"
								asChild
							>
								<Link
									to={"/"}
									aria-label={"Go Home"}
									className="flex h-12 w-full flex-1 items-center"
								>
									<AppLogo full={open} />
								</Link>
							</SidebarMenuButton>
							<NavigationToggle />
							<MobileNavigationClose />
						</SidebarMenuItem>
					</SidebarMenu>

					<SidebarMenu className="max-h-[45vh] gap-2 overflow-y-auto p-2">
						{!hideChatHistory && (
							<InputGroup
								className="bg-background group-data-[collapsible=icon]:hidden"
								data-tour="tour-search"
							>
								<InputGroupInput
									placeholder={t("appNav:search")}
									value={search}
									onChange={(e) => setSearch(e.target.value)}
								/>
								<InputGroupAddon>
									<Search />
								</InputGroupAddon>
							</InputGroup>
						)}
						{root.theme.featureFlags?.hideToolsInIframe &&
						isIframed ? null : (
							<>
								<SidebarMenuItem data-tour="tour-new-chat">
									<SidebarMenuButton
										asChild
										isActive={!!matchPath("/new", pathname)}
										tooltip={{
											children: t(
												"appNav:nav.newChat.tooltip",
											),
											hidden: false,
										}}
									>
										<Link
											to={"/new"}
											aria-label={"New Chat"}
										>
											<SquarePenIcon />
											{t("appNav:nav.newChat.label")}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>

								{root.theme.featureFlags?.enableAgent && (
									<SidebarMenuItem>
										<SidebarMenuButton
											asChild
											isActive={
												!!matchPath("/agent", pathname)
											}
											tooltip={{
												children: t(
													"appNav:nav.agents.tooltip",
												),
												hidden: false,
											}}
										>
											<Link
												to={"/agent"}
												aria-label={"agent"}
											>
												<Bot />
												{t("appNav:nav.agents.label")}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)}

								{!hideChatHistory && (
									<SidebarMenuItem>
										<SidebarMenuButton
											asChild
											isActive={
												!!matchPath("/chats", pathname)
											}
											tooltip={{
												children: t(
													"appNav:nav.allChats.tooltip",
												),
												hidden: false,
											}}
										>
											<Link
												to={"/chats"}
												aria-label={"chats"}
											>
												<MessagesSquareIcon />
												{t("appNav:nav.allChats.label")}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								)}

								{root.theme.sidebar.headerItems.map(
									(item, index) => (
										<GlobalNavItem
											key={`header-${item.name}-${index}`}
											name={item.name}
											icon={item.icon}
											iconDark={item.iconDark}
											path={item.path}
											url={item.url}
											embed={item.embed}
											tooltip={item.tooltip}
										/>
									),
								)}
							</>
						)}
					</SidebarMenu>
				</SidebarHeader>
				{!hideChatHistory && (
					<SidebarContent
						className="min-h-[120px] flex-1 overflow-hidden pe-2 transition-all duration-200 ease-in-out"
						data-tour="tour-chat-history"
					>
						<ScrollArea
							className="[&_[data-slot=scroll-area-viewport]>div]:block! h-full"
							viewportRef={(ele) => {
								// Store reference for scroll position management
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
										<Muted>
											{t("messages.noRoomsFound")}
										</Muted>
									</div>
								)}
							{BUCKETS.map((bucket) => {
								const rooms = bucketedRooms[bucket];
								if (!isVisible || rooms.length === 0) {
									return null;
								}

								return (
									<SidebarGroup
										key={bucket}
										className="ps-4 transition-all duration-200 ease-in-out group-data-[collapsible=icon]:hidden"
									>
										<SidebarGroupLabel className="truncate font-medium text-muted-foreground text-xs leading-normal">
											{bucket}
										</SidebarGroupLabel>
										<SidebarGroupContent>
											<SidebarMenu>
												{rooms.map((room) => {
													const roomId = room.ROOM_ID;
													const name =
														room.ROOM_NAME ||
														t("messages.untitled");
													const date = root.theme
														.sidebar.chatHistoryDate
														? parseTimestampWithUtcDefault(
																room.DATE_CREATED,
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
													const isEditing =
														editingRoomId ===
														roomId;

													// if the room is in the deleted set, don't render it
													if (
														deletedSet.has(roomId)
													) {
														return null;
													}

													return (
														<SidebarMenuItem
															key={roomId}
															className="group relative flex"
														>
															{isEditing ? (
																<Input
																	value={
																		editingName
																	}
																	onChange={(
																		e,
																	) =>
																		setEditingName(
																			e
																				.target
																				.value,
																		)
																	}
																	onKeyDown={(
																		e,
																	) => {
																		if (
																			e.key ===
																			"Enter"
																		) {
																			handleSaveRename(
																				roomId,
																			);
																		} else if (
																			e.key ===
																			"Escape"
																		) {
																			handleCancelRename();
																		}
																	}}
																	onBlur={() =>
																		handleSaveRename(
																			roomId,
																		)
																	}
																	autoFocus
																	className="h-8 flex-1"
																/>
															) : (
																<>
																	<SidebarMenuButton
																		asChild
																		isActive={
																			activeRoomId ===
																			roomId
																		}
																	>
																		<Link
																			className={cn(
																				"flex h-auto flex-col items-start p-2",
																				date &&
																					"gap-1",
																			)}
																			to={`/room/${roomId}`}
																			aria-label={
																				"Select room"
																			}
																		>
																			<span
																				dir="auto"
																				className="truncate font-medium text-sm leading-tight"
																			>
																				{
																					name
																				}
																			</span>
																			{date && (
																				<span className="text-muted-foreground text-xs leading-none">
																					{
																						date
																					}
																				</span>
																			)}
																		</Link>
																	</SidebarMenuButton>
																	<DropdownMenu
																		modal={
																			false
																		}
																	>
																		<DropdownMenuTrigger
																			asChild
																		>
																			<Button
																				variant="ghost"
																				size="icon-sm"
																				className=""
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
																					handleStartRename(
																						roomId,
																						name,
																					);
																				}}
																			>
																				<PencilIcon className="me-2 size-4" />
																				{t(
																					"actions.rename",
																				)}
																			</DropdownMenuItem>
																			<DropdownMenuItem
																				onClick={async (
																					e,
																				) => {
																					e.stopPropagation();

																					try {
																						// optimistically add to deleted set to remove from UI immediately
																						setDeletedSet(
																							(
																								prev,
																							) =>
																								new Set(
																									[
																										...prev,
																										roomId,
																									],
																								),
																						);

																						await chat.closeRoom(
																							roomId,
																						);

																						toast.success(
																							t(
																								"toasts.roomDeletedSuccess",
																							),
																						);
																						if (
																							activeRoomId ===
																							roomId
																						) {
																							navigate(
																								"/",
																							);
																						}

																						// Refetch rooms after deletion
																						getRooms.reset();
																						getPinnedRooms.reset();
																					} catch (e) {
																						if (
																							e instanceof
																							Error
																						) {
																							toast.error(
																								e.message,
																							);
																						}
																						// Deletion failed — restore the room in the list.
																						// On the success path we intentionally leave the
																						// roomId in deletedSet until the refetch lands, so
																						// the room doesn't briefly reappear between the
																						// reset() call and the new data arriving.
																						setDeletedSet(
																							(
																								prev,
																							) => {
																								const newSet =
																									new Set(
																										prev,
																									);
																								newSet.delete(
																									roomId,
																								);
																								return newSet;
																							},
																						);
																					}
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
									</SidebarGroup>
								);
							})}
						</ScrollArea>
					</SidebarContent>
				)}
				<SidebarFooter>
					<Separator className="group-data-[collapsible=icon]:hidden" />
					<SidebarMenu className="gap-2 p-2">
						{root.theme.sidebar.footerItems.length > 0 && (
							// biome-ignore lint/a11y/useSemanticElements: keeping div for layout reasons
							<div
								className="relative group-data-[collapsible=icon]:hidden"
								role="button"
								tabIndex={0}
								onMouseEnter={() => setHelpOpen(true)}
								onMouseLeave={() => setHelpOpen(false)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
									}
								}}
								onClick={() => setHelpOpen((prev) => !prev)}
							>
								<SidebarMenuItem>
									<SidebarMenuButton>
										<HelpCircle />
										Help
									</SidebarMenuButton>
								</SidebarMenuItem>
								{helpOpen && (
									<div className="absolute start-0 bottom-full z-50 w-full rounded-md border bg-popover p-1 shadow-md">
										<SidebarMenu>
											{root.theme.sidebar.footerItems.map(
												(item) => (
													<GlobalNavItem
														key={item.path}
														name={item.name}
														icon={item.icon}
														iconDark={item.iconDark}
														path={item.path}
														url={item.url}
														embed={item.embed}
														tooltip={item.tooltip}
													/>
												),
											)}
										</SidebarMenu>
									</div>
								)}
							</div>
						)}
						<SidebarMenuItem>
							<NavUser />
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
				<NavigationRail />
			</Sidebar>

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
