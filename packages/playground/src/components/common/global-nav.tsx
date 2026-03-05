import dayjs from "dayjs";
import {
	BrainCircuit,
	ComputerIcon,
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
	toast,
	useDebouncedValue,
	useInfiniteScroll,
	useSidebar,
} from "@semoss/ui/next";
import { useChat, useRoot } from "@/hooks";
import { AppLogo } from "./app-logo";
import { GlobalNavItem } from "./global-nav-item";
import { NavUser } from "./nav-user";

const ENABLE_AGENT = import.meta.env.VITE_ENABLE_AGENT === "true";

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
		t("buckets.lastWeek"),
		t("buckets.lastMonth"),
		t("buckets.older"),
	] as const;

	const { root } = useRoot();
	const [search, setSearch] = useState("");
	const { chat } = useChat();
	const { open } = useSidebar();
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

	const systemDate = dayjs(system.config.systemDate);

	const navigate = useNavigate();

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
			open
				? `GetPlaygroundRooms ( ${debouncedSearch ? `search = "<encode>${debouncedSearch}</encode>", ` : ""} limit = ${limit} , offset = ${offset} , sort = [ "DESC" ] ) ;`
				: "",

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
		[debouncedSearch],
	);

	/**
	 * Setup infinite scroll for the command list
	 */
	const { setScroll } = useInfiniteScroll({
		disabled: getRooms.isLoading || !getRooms.hasMore,
		onNext: () => {
			if (open) {
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

	useEffect(() => {
		// keep this counter
		chat.keys.roomCounter;
		getRooms.reset();
	}, [getRooms.reset, chat.keys.roomCounter]);

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
	 * Bucket the rooms by date
	 */
	const bucketedRooms = getRooms.data.reduce(
		(acc, val) => {
			const d = dayjs(val.DATE_CREATED);

			// Pinned rooms only go in Favorites bucket
			if (val.PINNED) {
				acc[t("buckets.favorites")].push(val);
				return acc; // Don't add to date buckets
			}

			// Non-pinned rooms go in date-based buckets
			if (systemDate.isSame(d, "day")) {
				acc[t("buckets.today")].push(val);
			} else if (systemDate.subtract(1, "day").isSame(d, "day")) {
				acc[t("buckets.yesterday")].push(val);
			} else if (systemDate.isSame(d, "week")) {
				acc[t("buckets.lastWeek")].push(val);
			} else if (systemDate.isSame(d, "month")) {
				acc[t("buckets.lastMonth")].push(val);
			} else {
				acc[t("buckets.older")].push(val);
			}

			return acc;
		},
		{
			[t("buckets.favorites")]: [],
			[t("buckets.today")]: [],
			[t("buckets.yesterday")]: [],
			[t("buckets.lastWeek")]: [],
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
				`RenameRoom(roomId=["${roomId}"], name=["${editingName}"]);`,
			);

			toast.success(t("toasts.roomRenamedSuccess"));

			// Reset state
			setEditingRoomId(null);
			setEditingName("");

			// Refetch rooms after renaming
			getRooms.reset();
		} catch {
			toast.error(t("toasts.failedToRename"));
		}
	};

	return (
		<Sidebar
			collapsible="icon"
			variant="inset"
			className="h-full justify-between p-0 transition-[width] duration-200 ease-in-out"
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

				<SidebarMenu className="gap-2 p-2">
					<InputGroup className="bg-background group-data-[collapsible=icon]:hidden">
						<InputGroupInput
							placeholder={t("search")}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
						/>
						<InputGroupAddon>
							<Search />
						</InputGroupAddon>
					</InputGroup>

					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							isActive={!!matchPath("/new", pathname)}
						>
							<Link to={"/new"} aria-label={"New Chat"}>
								<SquarePenIcon />
								{t("new")}
							</Link>
						</SidebarMenuButton>

						{ENABLE_AGENT && (
							<SidebarMenuItem>
								<SidebarMenuButton
									asChild
									isActive={!!matchPath("/agent", pathname)}
								>
									<Link to={"/agent"} aria-label={"agent"}>
										<ComputerIcon />
										{t("agents")}
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						)}
						{root.theme.sidebar.headerItems.map((item) => (
							<GlobalNavItem
								key={item.path}
								name={item.name}
								icon={item.icon}
								path={item.path}
								url={item.url}
								embed={item.embed}
							/>
						))}

						<SidebarMenuButton
							asChild
							isActive={!!matchPath("/knowledge", pathname)}
						>
							<Link
								to={"/knowledge"}
								aria-label={"knowledgeLibrary"}
							>
								<BrainCircuit />
								{t("Knowledge Library")}
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent
				className="transition-all duration-200 ease-in-out"
				ref={(ele) => {
					// Store reference for scroll position management
					if (ele) {
						scrollElementRef.current = ele;
						if (open) {
							setScroll(ele);
						}
					}
				}}
			>
				{open && getRooms.isError && (
					<div className="px-2 py-4 text-center">
						<Muted className="text-destructive">
							{t("messages.errorLoadingRooms")}
						</Muted>
					</div>
				)}
				{open && !getRooms.isLoading && getRooms.data.length === 0 && (
					<div className="px-2 py-4 text-center">
						<Muted>{t("messages.noRoomsFound")}</Muted>
					</div>
				)}
				{BUCKETS.map((bucket) => {
					const rooms = bucketedRooms[bucket];
					if (!open || rooms.length === 0) {
						return null;
					}

					return (
						<SidebarGroup
							key={bucket}
							className="pl-4 transition-all duration-200 ease-in-out group-data-[collapsible=icon]:hidden"
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
										const isFavorite = room.PINNED || false;
										const isEditing =
											editingRoomId === roomId;

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
																e.target.value,
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
																className="inline-block flex-1 truncate"
																to={`/room/${roomId}`}
																aria-label={
																	"Select room"
																}
															>
																{name}
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
																sideOffset={5}
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
																		className={`mr-2 size-4 ${
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
																	<PencilIcon className="mr-2 size-4" />
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
																		} catch (e) {
																			toast.error(
																				e.message,
																			);
																		}
																	}}
																	className="text-destructive focus:text-destructive"
																>
																	<TrashIcon className="mr-2 size-4" />
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
			</SidebarContent>
			<SidebarFooter>
				<Separator className="group-data-[collapsible=icon]:hidden" />
				<SidebarMenu className="gap-2 px-2 pt-2 group-data-[collapsible=icon]:hidden">
					{root.theme.sidebar.footerItems.map((item) => (
						<GlobalNavItem
							key={item.path}
							name={item.name}
							icon={item.icon}
							path={item.path}
							url={item.url}
							embed={item.embed}
						/>
					))}
				</SidebarMenu>
				<SidebarMenu className="gap-2 p-2">
					<SidebarMenuItem>
						<NavUser />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
});
