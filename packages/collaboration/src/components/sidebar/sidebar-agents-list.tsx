import { MoreHorizontal, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	TreeView,
	TreeViewItem,
	useSidebar,
} from "@semoss/ui/next";
import { parseTimestamp } from "@semoss/utility";
import { AgentAvatar } from "@/components/common/agent-avatar";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import { RecentRoomLink } from "./recent-room-link";
import { getSidebarRoomStatus } from "./sidebar-room-status";
import { SidebarSearchPalette } from "./sidebar-search-palette";

const ROOMS_PER_PAGE = 5;
const RECENT_ROOM_PAGE_SIZE = 20;

type SidebarTreeItem =
	| { kind: "agent"; agentId: string }
	| { kind: "room"; roomId: string }
	| { kind: "show-more"; agentId: string; roomCount: number }
	| { kind: "show-less"; agentId: string };

const timeFormatter = new Intl.DateTimeFormat(undefined, {
	hour: "numeric",
	minute: "2-digit",
});

function compareRoomsNewestFirst(a: Session, b: Session) {
	return (
		(parseTimestamp(b.updatedAt) ?? 0) - (parseTimestamp(a.updatedAt) ?? 0)
	);
}

function formatRoomTime(updatedAt: string) {
	const date = new Date(updatedAt);
	return Number.isNaN(date.getTime())
		? updatedAt
		: timeFormatter.format(date);
}

function agentTreeItemId(agentId: string) {
	return `agent-${agentId}`;
}

/** The unified agent tree and recent room list in the workspace sidebar. */
export function SidebarAgentsList({
	agents,
	sessions,
	activeAgentId,
	activeRoomId,
	isLoading = false,
	onNewSession,
	onRouteVisited,
	onRoomVisited,
}: {
	agents: Agent[];
	sessions: Session[];
	activeAgentId?: string;
	activeRoomId?: string;
	isLoading?: boolean;
	onNewSession: (agentId?: string) => void;
	onRouteVisited: (path: string) => void;
	onRoomVisited: (roomId: string) => void;
}) {
	const { isMobile, setOpenMobile, state } = useSidebar();
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const searchTriggerRef = useRef<HTMLButtonElement>(null);
	const shouldRestoreSearchFocus = useRef(false);
	const [collapsedAgentIds, setCollapsedAgentIds] = useState<Set<string>>(
		() => new Set(),
	);
	const [visibleRoomCounts, setVisibleRoomCounts] = useState<
		Record<string, number>
	>({});
	const [visibleRecentRoomCount, setVisibleRecentRoomCount] = useState(
		RECENT_ROOM_PAGE_SIZE,
	);

	const sortedSessions = useMemo(
		() => [...sessions].sort(compareRoomsNewestFirst),
		[sessions],
	);
	const roomsByAgent = useMemo(() => {
		const grouped = new Map<string, Session[]>();
		for (const room of sortedSessions) {
			const rooms = grouped.get(room.agentId) ?? [];
			rooms.push(room);
			grouped.set(room.agentId, rooms);
		}
		return grouped;
	}, [sortedSessions]);
	const unassignedRooms = sortedSessions.filter((room) => !room.agentId);
	const recentRooms = unassignedRooms.slice(0, visibleRecentRoomCount);
	const hasMoreRecentRooms = recentRooms.length < unassignedRooms.length;
	const canResizeRecentRooms = unassignedRooms.length > RECENT_ROOM_PAGE_SIZE;
	const expandedAgentIds = agents
		.filter((agent) => !collapsedAgentIds.has(agent.id))
		.map((agent) => agentTreeItemId(agent.id));
	const activeRouteKey = activeAgentId
		? `${activeAgentId}:${activeRoomId ?? ""}`
		: "";

	useEffect(() => {
		if (!activeAgentId || !activeRouteKey) return;
		setCollapsedAgentIds((current) => {
			if (!current.has(activeAgentId)) return current;
			const next = new Set(current);
			next.delete(activeAgentId);
			return next;
		});
	}, [activeAgentId, activeRouteKey]);

	useEffect(() => {
		if (isSearchOpen || !shouldRestoreSearchFocus.current) return;
		let cancelled = false;
		queueMicrotask(() => {
			if (cancelled) return;
			searchTriggerRef.current?.focus();
			shouldRestoreSearchFocus.current = false;
		});
		return () => {
			cancelled = true;
		};
	}, [isSearchOpen]);

	function openSearch(): void {
		shouldRestoreSearchFocus.current = true;
		setIsSearchOpen(true);
	}

	function handleResizeRecentRooms(): void {
		setVisibleRecentRoomCount((current) =>
			hasMoreRecentRooms
				? current + RECENT_ROOM_PAGE_SIZE
				: RECENT_ROOM_PAGE_SIZE,
		);
	}

	function setAgentExpanded(agentId: string, expanded: boolean) {
		setCollapsedAgentIds((current) => {
			const next = new Set(current);
			if (expanded) next.delete(agentId);
			else next.add(agentId);
			return next;
		});
	}

	function handleExpandedChange(expandedIds: string[]): void {
		const expandedIdSet = new Set(expandedIds);
		setCollapsedAgentIds(
			new Set(
				agents
					.filter(
						(agent) =>
							!expandedIdSet.has(agentTreeItemId(agent.id)),
					)
					.map((agent) => agent.id),
			),
		);
	}

	function visitRoom(roomId: string) {
		onRoomVisited(roomId);
		if (isMobile) setOpenMobile(false);
	}

	function visitRoute(path: string) {
		onRouteVisited(path);
		if (isMobile) setOpenMobile(false);
	}

	function startNewSession(agentId?: string) {
		if (agentId) onNewSession(agentId);
		else onNewSession();
		if (isMobile) setOpenMobile(false);
	}

	function handleTreeItemSelect(item: SidebarTreeItem): void {
		if (item.kind === "room") {
			visitRoom(item.roomId);
			return;
		}

		if (item.kind === "agent") {
			if ((roomsByAgent.get(item.agentId)?.length ?? 0) > 0) {
				setAgentExpanded(
					item.agentId,
					collapsedAgentIds.has(item.agentId),
				);
			}
			return;
		}

		setVisibleRoomCounts((current) => ({
			...current,
			[item.agentId]:
				item.kind === "show-more"
					? Math.min(
							(current[item.agentId] ?? ROOMS_PER_PAGE) +
								ROOMS_PER_PAGE,
							item.roomCount,
						)
					: ROOMS_PER_PAGE,
		}));
	}

	return (
		<>
			{state === "collapsed" && !isMobile ? (
				<div
					data-slot="collapsed-agent-room-navigation"
					className="flex w-full justify-center py-1"
				>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								ref={searchTriggerRef}
								type="button"
								variant="ghost"
								size="icon-lg"
								aria-label="Search routes and rooms"
								onClick={openSearch}
							>
								<Search aria-hidden="true" />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="right">
							Search routes and rooms
						</TooltipContent>
					</Tooltip>
				</div>
			) : (
				<div
					data-slot="unified-agent-room-navigation"
					className="w-full"
				>
					<SidebarGroup className="group/agents px-0 py-2">
						<SidebarGroupLabel className="px-2">
							Your agents
						</SidebarGroupLabel>
						<Tooltip>
							<TooltipTrigger asChild>
								<SidebarGroupAction
									ref={searchTriggerRef}
									type="button"
									className="end-2 top-3 size-6 transition-opacity group-focus-within/agents:opacity-100 group-hover/agents:opacity-100 [@media(hover:hover)]:opacity-0"
									aria-label="Search routes and rooms"
									onClick={openSearch}
								>
									<Search aria-hidden="true" />
								</SidebarGroupAction>
							</TooltipTrigger>
							<TooltipContent>
								Search routes and rooms
							</TooltipContent>
						</Tooltip>
						<SidebarGroupContent>
							{isLoading && agents.length === 0 ? (
								<div className="flex items-center gap-2 px-2 py-2 text-muted-foreground text-xs">
									<Spinner
										aria-hidden="true"
										className="size-3.5"
									/>
									Loading agents
								</div>
							) : agents.length === 0 ? (
								<p className="px-2 py-2 text-muted-foreground text-xs">
									No agents yet
								</p>
							) : (
								<TreeView<SidebarTreeItem>
									aria-label="Your agents"
									className="space-y-0.5 [&>li>div>button]:size-6"
									expanded={expandedAgentIds}
									onExpandChange={handleExpandedChange}
									onItemSelect={handleTreeItemSelect}
								>
									{agents.map((agent) => {
										const rooms =
											roomsByAgent.get(agent.id) ?? [];
										const activeRoomIndex = activeRoomId
											? rooms.findIndex(
													(room) =>
														room.id ===
														activeRoomId,
												)
											: -1;
										const requestedCount =
											visibleRoomCounts[agent.id] ??
											ROOMS_PER_PAGE;
										const activeRoomCount =
											activeRoomIndex >= 0
												? Math.ceil(
														(activeRoomIndex + 1) /
															ROOMS_PER_PAGE,
													) * ROOMS_PER_PAGE
												: 0;
										const visibleCount = Math.max(
											requestedCount,
											activeRoomCount,
										);
										const visibleRooms = rooms.slice(
											0,
											visibleCount,
										);
										const remainingRooms = Math.max(
											0,
											rooms.length - visibleRooms.length,
										);
										const unreadCount = rooms.filter(
											(room) => room.unread,
										).length;
										const isWorking = rooms.some(
											(room) =>
												room.status === "In progress",
										);

										return (
											<TreeViewItem<SidebarTreeItem>
												key={agent.id}
												id={agentTreeItemId(agent.id)}
												item={{
													kind: "agent",
													agentId: agent.id,
												}}
												aria-label={agent.name}
												className={cn(
													"group/agent pr-1 [&>div]:min-h-9 [&>div]:rounded-md [&>div]:py-0 [&>div]:hover:bg-sidebar-accent",
													agent.id ===
														activeAgentId &&
														"[&>div]:bg-sidebar-accent [&>div]:text-sidebar-accent-foreground",
												)}
												label={
													<div className="flex min-h-9 min-w-0 items-center gap-2">
														<AgentAvatar
															agent={agent}
															size="xs"
														/>
														<span className="min-w-0 flex-1 truncate text-sm">
															{agent.name}
														</span>
														{isWorking && (
															<Spinner
																className="size-3.5 shrink-0 text-primary motion-reduce:animate-none"
																aria-label={`${agent.name} is working`}
															/>
														)}
														{unreadCount > 0 && (
															<span className="rounded-full bg-destructive/10 px-1.5 text-destructive text-xs leading-4">
																{unreadCount}
															</span>
														)}
														<div className="hidden shrink-0 group-focus-within/agent:block group-hover/agent:block has-data-[state=open]:block [@media(hover:none)]:block">
															<DropdownMenu>
																<DropdownMenuTrigger
																	asChild
																>
																	<Button
																		type="button"
																		variant="ghost"
																		size="icon-sm"
																		className="shrink-0"
																		aria-label={`Actions for ${agent.name}`}
																		onClick={(
																			event,
																		) =>
																			event.stopPropagation()
																		}
																		onKeyDown={(
																			event,
																		) =>
																			event.stopPropagation()
																		}
																	>
																		<MoreHorizontal aria-hidden="true" />
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align="end">
																	<DropdownMenuItem
																		onSelect={() =>
																			startNewSession(
																				agent.id,
																			)
																		}
																	>
																		New
																		session
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														</div>
													</div>
												}
											>
												{rooms.length > 0 ? (
													<>
														{visibleRooms.map(
															(room) => {
																const status =
																	getSidebarRoomStatus(
																		room,
																	);

																return (
																	<TreeViewItem<SidebarTreeItem>
																		key={
																			room.id
																		}
																		id={`room-${room.id}`}
																		item={{
																			kind: "room",
																			roomId: room.id,
																		}}
																		aria-label={
																			room.title
																		}
																		aria-current={
																			room.id ===
																			activeRoomId
																				? "page"
																				: undefined
																		}
																		leadingIcon={
																			status ? (
																				<Tooltip>
																					<TooltipTrigger
																						asChild
																					>
																						<Button
																							type="button"
																							variant="ghost"
																							size="icon-sm"
																							aria-label={
																								status.label
																							}
																							className={cn(
																								"-m-1 size-6 rounded-sm p-0",
																								status.className,
																							)}
																						>
																							{
																								status.icon
																							}
																						</Button>
																					</TooltipTrigger>
																					<TooltipContent
																						side="right"
																						sideOffset={
																							4
																						}
																					>
																						{
																							status.label
																						}
																					</TooltipContent>
																				</Tooltip>
																			) : undefined
																		}
																		className={cn(
																			"[&>div]:min-h-9 [&>div]:rounded-md [&>div]:py-0 [&>div]:hover:bg-sidebar-accent",
																			room.id ===
																				activeRoomId &&
																				"[&>div]:bg-sidebar-accent [&>div]:font-medium [&>div]:text-sidebar-accent-foreground",
																		)}
																		label={
																			<HoverCard
																				openDelay={
																					300
																				}
																				closeDelay={
																					150
																				}
																			>
																				<HoverCardTrigger
																					asChild
																				>
																					<span className="flex min-h-9 min-w-0 items-center py-1 text-start">
																						<span className="truncate text-sm">
																							{
																								room.title
																							}
																						</span>
																					</span>
																				</HoverCardTrigger>
																				<HoverCardContent
																					side="right"
																					align="start"
																					sideOffset={
																						8
																					}
																					avoidCollisions={
																						false
																					}
																					className="space-y-2"
																				>
																					<p className="wrap-break-word text-sm">
																						{room.preview.trim() ||
																							"No recent message"}
																					</p>
																					<time
																						dateTime={
																							room.updatedAt
																						}
																						className="block text-muted-foreground text-xs"
																					>
																						{formatRoomTime(
																							room.updatedAt,
																						)}
																					</time>
																				</HoverCardContent>
																			</HoverCard>
																		}
																	/>
																);
															},
														)}
														{remainingRooms > 0 && (
															<TreeViewItem<SidebarTreeItem>
																id={`show-more-${agent.id}`}
																item={{
																	kind: "show-more",
																	agentId:
																		agent.id,
																	roomCount:
																		rooms.length,
																}}
																aria-label="Show 5 more rooms"
																className="[&>div]:min-h-9 [&>div]:py-0"
																label={
																	<span className="flex min-h-9 items-center text-primary text-xs">
																		Show 5
																		more
																	</span>
																}
															/>
														)}
														{requestedCount >
															ROOMS_PER_PAGE && (
															<TreeViewItem<SidebarTreeItem>
																id={`show-less-${agent.id}`}
																item={{
																	kind: "show-less",
																	agentId:
																		agent.id,
																}}
																aria-label="Show fewer rooms"
																className="[&>div]:min-h-9 [&>div]:py-0"
																label={
																	<span className="flex min-h-9 items-center text-muted-foreground text-xs">
																		Show
																		less
																	</span>
																}
															/>
														)}
													</>
												) : undefined}
											</TreeViewItem>
										);
									})}
								</TreeView>
							)}
						</SidebarGroupContent>
					</SidebarGroup>

					<SidebarGroup className="px-0 py-1">
						<SidebarGroupLabel className="h-7 px-2">
							Recent
						</SidebarGroupLabel>
						<SidebarGroupContent>
							{isLoading && recentRooms.length === 0 ? (
								<p className="px-2 py-2 text-muted-foreground text-xs">
									Loading rooms
								</p>
							) : recentRooms.length === 0 ? (
								<p className="px-2 py-2 text-muted-foreground text-xs">
									No recent rooms
								</p>
							) : (
								<>
									<ul
										className="space-y-0.5"
										aria-label="Recent rooms"
									>
										{recentRooms.map((room) => (
											<RecentRoomLink
												key={room.id}
												room={room}
												active={
													room.id === activeRoomId
												}
												onVisit={visitRoom}
											/>
										))}
									</ul>
									{canResizeRecentRooms && (
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="mt-1 w-full justify-start px-2"
											onClick={handleResizeRecentRooms}
										>
											{hasMoreRecentRooms
												? "Load more rooms"
												: "Show fewer rooms"}
										</Button>
									)}
								</>
							)}
						</SidebarGroupContent>
					</SidebarGroup>
				</div>
			)}
			<SidebarSearchPalette
				open={isSearchOpen}
				onOpenChange={setIsSearchOpen}
				agents={agents}
				sessions={sessions}
				isLoading={isLoading}
				onRouteVisited={visitRoute}
				onRoomVisited={visitRoom}
			/>
		</>
	);
}
