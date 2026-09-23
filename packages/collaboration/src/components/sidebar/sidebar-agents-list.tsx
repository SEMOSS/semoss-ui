import { ChevronDown, ChevronRight, MessageSquare, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	SidebarGroup,
	SidebarGroupAction,
	SidebarGroupContent,
	SidebarGroupLabel,
	Spinner,
	useSidebar,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { StatusLabel } from "@/components/common/status-label";
import { agentNewPath, draftRoomPath, roomPath } from "@/lib/workspace-paths";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";

const ROOMS_PER_PAGE = 5;
const RECENT_ROOM_LIMIT = 10;

const timeFormatter = new Intl.DateTimeFormat(undefined, {
	hour: "numeric",
	minute: "2-digit",
});

function roomTimestamp(room: Session) {
	const timestamp = Date.parse(room.updatedAt);
	return Number.isNaN(timestamp) ? 0 : timestamp;
}

function compareRoomsNewestFirst(a: Session, b: Session) {
	return roomTimestamp(b) - roomTimestamp(a);
}

function formatRoomTime(updatedAt: string) {
	const date = new Date(updatedAt);
	return Number.isNaN(date.getTime())
		? updatedAt
		: timeFormatter.format(date);
}

function RoomLink({
	room,
	active,
	variant = "room",
	onVisit,
}: {
	room: Session;
	active: boolean;
	variant?: "room" | "recent";
	onVisit: (roomId: string) => void;
}) {
	const isRecent = variant === "recent";

	return (
		<li>
			<Link
				to={roomPath(room.agentId, room.id)}
				onClick={(event) => {
					event.preventDefault();
					onVisit(room.id);
				}}
				aria-current={active ? "page" : undefined}
				className={cn(
					"group/room flex min-h-11 min-w-0 rounded-md px-2 py-2 text-start outline-hidden ring-sidebar-ring transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
					!isRecent && "gap-2",
					active &&
						"bg-sidebar-accent font-medium text-sidebar-accent-foreground",
				)}
			>
				{!isRecent && (
					<MessageSquare
						className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
						aria-hidden="true"
					/>
				)}
				<span className="min-w-0 flex-1">
					<span className="flex min-w-0 items-center gap-1.5">
						<span className="truncate text-xs">{room.title}</span>
						{room.unread && (
							<>
								<span
									className="size-2 shrink-0 rounded-full bg-link"
									aria-hidden="true"
								/>
								<span className="sr-only">Unread</span>
							</>
						)}
					</span>
					{!isRecent && room.preview.trim().length > 0 && (
						<span className="block truncate text-muted-foreground text-xs">
							{room.preview}
						</span>
					)}
					{!isRecent && (
						<span className="mt-1 flex items-center justify-between gap-2">
							<StatusLabel status={room.status} />
							<time
								dateTime={room.updatedAt}
								className="shrink-0 text-muted-foreground text-xs"
							>
								{formatRoomTime(room.updatedAt)}
							</time>
						</span>
					)}
				</span>
			</Link>
		</li>
	);
}

/** The unified agent tree and recent room list in the workspace sidebar. */
export function SidebarAgentsList({
	agents,
	sessions,
	activeAgentId,
	activeRoomId,
	isLoading = false,
	onRoomVisited,
}: {
	agents: Agent[];
	sessions: Session[];
	activeAgentId?: string;
	activeRoomId?: string;
	isLoading?: boolean;
	onRoomVisited: (roomId: string) => void;
}) {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { isMobile, setOpenMobile } = useSidebar();
	const [collapsedAgentIds, setCollapsedAgentIds] = useState<Set<string>>(
		() => new Set(),
	);
	const [visibleRoomCounts, setVisibleRoomCounts] = useState<
		Record<string, number>
	>({});

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
	const recentRooms = sortedSessions.slice(0, RECENT_ROOM_LIMIT);
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

	function setAgentExpanded(agentId: string, expanded: boolean) {
		setCollapsedAgentIds((current) => {
			const next = new Set(current);
			if (expanded) next.delete(agentId);
			else next.add(agentId);
			return next;
		});
	}

	function visitRoom(roomId: string) {
		onRoomVisited(roomId);
		if (isMobile) setOpenMobile(false);
	}

	function startRoom(agentId: string) {
		const currentModelId =
			agentId === activeAgentId
				? activeRoomId
					? sessions.find((session) => session.id === activeRoomId)
							?.modelId
					: searchParams.get("model") || undefined
				: undefined;
		navigate(draftRoomPath(agentId, crypto.randomUUID(), currentModelId));
		if (isMobile) setOpenMobile(false);
	}

	return (
		<div data-slot="unified-agent-room-navigation" className="w-full">
			<SidebarGroup className="px-0 py-2">
				<SidebarGroupLabel className="px-2">
					Your agents
				</SidebarGroupLabel>
				<SidebarGroupAction asChild aria-label="Create agent">
					<Link to={agentNewPath()}>
						<Plus aria-hidden="true" />
					</Link>
				</SidebarGroupAction>
				<SidebarGroupContent>
					{isLoading && agents.length === 0 ? (
						<div className="flex items-center gap-2 px-2 py-3 text-muted-foreground text-xs">
							<Spinner aria-hidden="true" className="size-3.5" />
							Loading agents
						</div>
					) : agents.length === 0 ? (
						<p className="px-2 py-3 text-muted-foreground text-xs">
							No agents yet
						</p>
					) : (
						<ul className="space-y-1" aria-label="Your agents">
							{agents.map((agent) => {
								const rooms = roomsByAgent.get(agent.id) ?? [];
								const expanded = !collapsedAgentIds.has(
									agent.id,
								);
								const activeRoomIndex =
									agent.id === activeAgentId && activeRoomId
										? rooms.findIndex(
												(room) =>
													room.id === activeRoomId,
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
									(room) => room.status === "In progress",
								);

								return (
									<Collapsible
										key={agent.id}
										open={expanded}
										onOpenChange={(open) =>
											setAgentExpanded(agent.id, open)
										}
										asChild
									>
										<li>
											<div
												className={cn(
													"group/agent flex min-h-11 min-w-0 items-center rounded-md hover:bg-sidebar-accent",
													agent.id ===
														activeAgentId &&
														"bg-sidebar-accent text-sidebar-accent-foreground",
												)}
											>
												<CollapsibleTrigger asChild>
													<Button
														variant="ghost"
														className="h-auto min-h-11 min-w-0 flex-1 justify-start gap-2 px-2 text-start hover:bg-transparent"
														aria-label={`${expanded ? "Collapse" : "Expand"} rooms for ${agent.name}`}
													>
														{expanded ? (
															<ChevronDown className="size-3.5 shrink-0" />
														) : (
															<ChevronRight className="size-3.5 shrink-0" />
														)}
														<AgentAvatar
															agent={agent}
															size="sm"
														/>
														<span className="min-w-0 flex-1">
															<span className="block truncate text-xs">
																{agent.name}
															</span>
															<span className="block truncate text-muted-foreground text-xs">
																{agent.role}
															</span>
														</span>
														{isWorking && (
															<Spinner
																className="size-3.5 shrink-0 text-chart-3 motion-reduce:animate-none"
																aria-label={`${agent.name} is working`}
															/>
														)}
														{unreadCount > 0 && (
															<span className="rounded-full bg-destructive/10 px-1.5 text-destructive text-xs leading-4">
																{unreadCount}
															</span>
														)}
													</Button>
												</CollapsibleTrigger>
												<Button
													variant="ghost"
													size="icon-sm"
													className="me-1 shrink-0"
													aria-label={`New room with ${agent.name}`}
													onClick={() =>
														startRoom(agent.id)
													}
												>
													<Plus aria-hidden="true" />
												</Button>
											</div>
											<CollapsibleContent>
												{rooms.length === 0 ? (
													<p className="py-2 ps-9 text-muted-foreground text-xs">
														No rooms yet
													</p>
												) : (
													<ul
														className="ms-4 space-y-1 border-s ps-2"
														aria-label={`Rooms for ${agent.name}`}
													>
														{visibleRooms.map(
															(room) => (
																<RoomLink
																	key={
																		room.id
																	}
																	room={room}
																	active={
																		room.id ===
																		activeRoomId
																	}
																	onVisit={
																		visitRoom
																	}
																/>
															),
														)}
														{remainingRooms > 0 && (
															<li>
																<Button
																	variant="ghost"
																	className="min-h-11 w-full justify-start px-2 text-link text-xs"
																	onClick={() =>
																		setVisibleRoomCounts(
																			(
																				current,
																			) => ({
																				...current,
																				[agent.id]:
																					Math.min(
																						requestedCount +
																							ROOMS_PER_PAGE,
																						rooms.length,
																					),
																			}),
																		)
																	}
																>
																	Show 5 more
																</Button>
															</li>
														)}
														{requestedCount >
															ROOMS_PER_PAGE && (
															<li>
																<Button
																	variant="ghost"
																	className="min-h-11 w-full justify-start px-2 text-muted-foreground text-xs"
																	onClick={() =>
																		setVisibleRoomCounts(
																			(
																				current,
																			) => ({
																				...current,
																				[agent.id]:
																					ROOMS_PER_PAGE,
																			}),
																		)
																	}
																>
																	Show less
																</Button>
															</li>
														)}
													</ul>
												)}
											</CollapsibleContent>
										</li>
									</Collapsible>
								);
							})}
						</ul>
					)}
				</SidebarGroupContent>
			</SidebarGroup>

			<SidebarGroup className="px-0 py-2">
				<SidebarGroupLabel className="px-2">Recent</SidebarGroupLabel>
				<SidebarGroupContent>
					{isLoading && recentRooms.length === 0 ? (
						<p className="px-2 py-3 text-muted-foreground text-xs">
							Loading rooms
						</p>
					) : recentRooms.length === 0 ? (
						<p className="px-2 py-3 text-muted-foreground text-xs">
							No recent rooms
						</p>
					) : (
						<ul className="space-y-1" aria-label="Recent rooms">
							{recentRooms.map((room) => (
								<RoomLink
									key={room.id}
									room={room}
									active={room.id === activeRoomId}
									variant="recent"
									onVisit={visitRoom}
								/>
							))}
						</ul>
					)}
				</SidebarGroupContent>
			</SidebarGroup>
		</div>
	);
}
