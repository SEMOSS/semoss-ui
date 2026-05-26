// biome-ignore-all lint/suspicious/noArrayIndexKey: TODO
import dayjs from "dayjs";
import {
	ComputerIcon,
	HelpCircle,
	MapIcon,
	MessagesSquareIcon,
	MoreVertical,
	PencilIcon,
	Search,
	SquarePenIcon,
	StarIcon,
	TrashIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Link,
	matchPath,
	useLocation,
	useNavigate,
	useParams,
} from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { runPixel, useInsight, useIteratorPixel } from "@semoss/sdk/react";
import {
	Button,
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
	SidebarRail,
	Spinner,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
	useSidebar,
} from "@semoss/ui/next";
import { useChat, useRoot, useTour } from "@/hooks";
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
export const GlobalNav = observer(() => {
	const { system } = useInsight();
	const { t } = useTranslation("sidebar");

	const BUCKETS = [
		t("buckets.favorites"),
		t("buckets.today"),
		t("buckets.yesterday"),
		t("buckets.fewDaysAgo"),
		t("buckets.lastWeek"),
		t("buckets.thisMonth"),
		t("buckets.lastMonth"),
		t("buckets.older"),
	] as const;

	const { root } = useRoot();
	const [search, setSearch] = useState("");
	const [helpOpen, setHelpOpen] = useState(false);
	const { chat } = useChat();
	const { startTour } = useTour();
	const { open, openMobile, isMobile } = useSidebar();
	// True when the sidebar is actually visible to the user.
	// Desktop: tracks the expand/collapse state (`open`).
	// Mobile: tracks the Sheet's open state (`openMobile`) — the Sheet
	// mounts hidden with 0-height, so we must avoid wiring infinite
	// scroll until the user opens it.
	const isVisible = isMobile ? openMobile : open;
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

	const systemDate = dayjs(system.config.systemDate);

	const navigate = useNavigate();

	const handleStartTour = () => {
		navigate("/new");
		startTour();
	};
	const getPinnedRooms = useIteratorPixel<
		{
			ROOM_ID: string;
			ROOM_NAME: string;
			DATE_CREATED: string;
			WORKSPACE_ID?: string;
			PINNED?: boolean;
		}[],
		{
			ROOM_ID: string;
			ROOM_NAME: string;
			DATE_CREATED: string;
			WORKSPACE_ID?: string;
			PINNED?: boolean;
		}
	>(
		(_limit, _offset) =>
			`META | GetPlaygroundRooms(pinned=[true], sort=["DESC"]);`,
		() => -1,
		(response) => response,
		{},
		// Re-fetch when the chat store's roomCounter increments
		// (new chat, rename, delete elsewhere). The reset useEffect
		// below relies on MobX observability which is fragile inside
		// effect deps — wiring the counter directly into the iterator
		// deps is the source of truth.
		[chat.keys.roomCounter],
	);

	const getRooms = useIteratorPixel<
		{
			ROOM_ID: string;
			ROOM_NAME: string;
			DATE_CREATED: string;
			WORKSPACE_ID?: string;
			PINNED?: boolean;
		}[],
		{
			ROOM_ID: string;
			ROOM_NAME: string;
			DATE_CREATED: string;
			WORKSPACE_ID?: string;
			PINNED?: boolean;
		}
	>(
		(limit, offset) =>
			`META | GetPlaygroundRooms(${debouncedSearch ? `search="<encode>${debouncedSearch}</encode>", ` : ""}limit=${limit}, offset=${offset}, sort=["DESC"]);`,

		(response) => {
			// if its less than the limit, we know its the end
			if (response.length < 25) {
				return -1;
			}

			return Infinity;
		},
		(response) => {
			return response;
		},
		{
			limit: 25,
		},
		// Re-fetch on search change OR when the chat store's
		// roomCounter increments (rename / delete elsewhere in app).
		[debouncedSearch, chat.keys.roomCounter],
	);

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

	// Skip the reset on first mount — the iterators already fetch on
	// init, so resetting here would cause a duplicate request. Subsequent
	// runs (when `roomCounter` increments after a new chat is created)
	// should refetch as intended.
	const didInitialMount = useRef(false);
	useEffect(() => {
		// keep this counter
		chat.keys.roomCounter;
		if (!didInitialMount.current) {
			didInitialMount.current = true;
			return;
		}
		getRooms.reset();
		getPinnedRooms.reset();
		if (scrollElementRef.current) {
			scrollElementRef.current.scrollTop = 0;
			setSavedScrollPosition(0);
		}
	}, [getRooms.reset, getPinnedRooms.reset, chat.keys.roomCounter]);

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

	const bucketedRooms = getRooms.data.reduce(
		(acc, val) => {
			// Skip rooms handled by the dedicated pinned query
			if (val.PINNED || pinnedRoomIds.has(val.ROOM_ID)) return acc;

			const d = dayjs(`${val.DATE_CREATED}Z`);

			if (systemDate.isSame(d, "day")) {
				acc[t("buckets.today")].push(val);
			} else if (systemDate.subtract(1, "day").isSame(d, "day")) {
				acc[t("buckets.yesterday")].push(val);
			} else if (d.isAfter(systemDate.subtract(3, "day"))) {
				acc[t("buckets.fewDaysAgo")].push(val);
			} else if (d.isAfter(systemDate.subtract(7, "day"))) {
				acc[t("buckets.lastWeek")].push(val);
			} else if (systemDate.isSame(d, "month")) {
				acc[t("buckets.thisMonth")].push(val);
			} else if (systemDate.subtract(1, "month").isSame(d, "month")) {
				acc[t("buckets.lastMonth")].push(val);
			} else {
				acc[t("buckets.older")].push(val);
			}

			return acc;
		},
		{
			[t("buckets.favorites")]: [...getPinnedRooms.data],
			[t("buckets.today")]: [],
			[t("buckets.yesterday")]: [],
			[t("buckets.fewDaysAgo")]: [],
			[t("buckets.lastWeek")]: [],
			[t("buckets.thisMonth")]: [],
			[t("buckets.lastMonth")]: [],
			[t("buckets.older")]: [],
		} as Record<string, typeof getRooms.data>,
	);

	/**
	 * Handlers
	 */
	const handleToggleFavorite = async (
		roomId: string,
		isFavorite: boolean,
	) => {
		try {
			await runPixel(
				`PinRoom(roomId=["${roomId}"], pinned=[${!isFavorite}]);`,
			);

			// Refetch rooms after toggling favorite
			getRooms.reset();
			getPinnedRooms.reset();
		} catch {
			toast.error(
				isFavorite
					? t("toasts.failedToUnpin")
					: t("toasts.failedToPin"),
			);
		}
	};

	const handleStartRename = (roomId: string, currentName: string) => {
		setEditingRoomId(roomId);
		setEditingName(currentName);
	};

	const handleCancelRename = () => {
		setEditingRoomId(null);
		setEditingName("");
	};

	const handleSaveRename = async (roomId: string) => {
		if (!editingName.trim()) {
			toast.error(t("toasts.roomNameEmpty"));
			return;
		}

		try {
			await runPixel(
				`META | RenameRoom(roomId=["${roomId}"], name=["${editingName}"]);`,
			);

			toast.success(t("toasts.roomRenamedSuccess"));

			// Reset state
			setEditingRoomId(null);
			setEditingName("");

			// Refetch rooms after renaming
			getRooms.reset();
			getPinnedRooms.reset();
		} catch {
			toast.error(t("toasts.failedToRename"));
		}
	};

	return (
		<Sidebar
			collapsible="icon"
			variant="inset"
			className="h-full p-0 transition-[width] duration-200 ease-in-out"
		>
			<SidebarHeader>
				<SidebarMenu className="gap-1 transition-all duration-200 ease-in-out group-data-[collapsible=icon]:px-2">
					<SidebarMenuItem className="flex items-center overflow-hidden">
						<SidebarMenuButton size="lg" className="h-8" asChild>
							<Link
								to={"/"}
								aria-label={"Go Home"}
								className="flex h-12 w-full flex-1 items-center"
							>
								<AppLogo full={open} />
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>

				<SidebarMenu className="max-h-[45vh] gap-2 overflow-y-auto p-2">
					<InputGroup
						className="bg-background group-data-[collapsible=icon]:hidden"
						data-tour="tour-search"
					>
						<InputGroupInput
							placeholder={t("search")}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>
					{root.theme.featureFlags?.hideToolsInIframe &&
					isIframed ? null : (
						<>
							<SidebarMenuItem data-tour="tour-new-chat">
								<SidebarMenuButton
									asChild
									isActive={!!matchPath("/new", pathname)}
									tooltip={{
										children: t("nav.newChat.tooltip"),
										hidden: false,
									}}
								>
									<Link to={"/new"} aria-label={"New Chat"}>
										<SquarePenIcon />
										{t("nav.newChat.label")}
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
											children: t("nav.agents.tooltip"),
											hidden: false,
										}}
									>
										<Link
											to={"/agent"}
											aria-label={"agent"}
										>
											<ComputerIcon />
											{t("nav.agents.label")}
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}

							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={!!matchPath("/chats", pathname)}
									tooltip={{
										children: t("nav.allChats.tooltip"),
										hidden: false,
									}}
								>
									<Link to={"/chats"} aria-label={"chats"}>
										<MessagesSquareIcon />
										{t("nav.allChats.label")}
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>

							{root.theme.sidebar.headerItems.map(
								(item, index) => (
									<GlobalNavItem
										key={`header-${item.name}-${index}`}
										name={item.name}
										icon={item.icon}
										path={item.path}
										url={item.url}
										embed={item.embed}
									/>
								),
							)}
						</>
					)}
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent
				className="min-h-[120px] flex-1 overflow-hidden transition-all duration-200 ease-in-out"
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
						getRooms.data.length === 0 && (
							<div className="px-2 py-4 text-center">
								<Muted>{t("messages.noRoomsFound")}</Muted>
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
											const date = root.theme.sidebar
												.chatHistoryDate
												? new Date(
														`${room.DATE_CREATED}Z`,
													).toLocaleString(
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
												editingRoomId === roomId;

											// if the room is in the deleted set, don't render it
											if (deletedSet.has(roomId)) {
												return null;
											}

											return (
												<SidebarMenuItem
													key={roomId}
													className="group/room relative flex"
												>
													{isEditing ? (
														<Input
															value={editingName}
															onChange={(e) =>
																setEditingName(
																	e.target
																		.value,
																)
															}
															onKeyDown={(e) => {
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
																	className={`flex h-auto flex-col items-start p-2 ${date ? "gap-1" : ""}`}
																	to={`/room/${roomId}`}
																	aria-label={
																		"Select room"
																	}
																>
																	<span
																		dir="auto"
																		className="truncate font-medium text-sm leading-tight"
																	>
																		{name}
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
																modal={false}
															>
																<DropdownMenuTrigger
																	asChild
																>
																	<Button
																		variant="ghost"
																		size="icon-sm"
																		className="invisible group-hover/room:visible"
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
																			className={`me-2 size-4 ${
																				isFavorite
																					? "fill-yellow-500 text-yellow-500"
																					: ""
																			}`}
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
																			} finally {
																				// remove from deleted set after attempting deletion to allow re-render if deletion failed
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
													path={item.path}
													url={item.url}
													embed={item.embed}
												/>
											),
										)}
									</SidebarMenu>
								</div>
							)}
						</div>
					)}
					{root.theme.tour?.show !== false && (
						<SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
							<SidebarMenuButton
								onClick={handleStartTour}
								data-tour="tour-take-tour"
							>
								<MapIcon />
								{t("takeTour")}
							</SidebarMenuButton>
						</SidebarMenuItem>
					)}
					<SidebarMenuItem>
						<NavUser />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
});
