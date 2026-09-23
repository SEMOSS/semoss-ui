import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	cn,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import type { Agent } from "@/types/agent";
import type { Session } from "@/types/session";
import {
	getSidebarRoomStatus,
	type SidebarRoomStatus,
} from "./sidebar-room-status";

const INITIAL_ROOM_LIMIT = 10;

interface RoomPaletteItem {
	room: Session;
	agentName: string;
	status: SidebarRoomStatus | null;
	searchText: string;
}

interface SidebarSearchPaletteProps {
	/** Whether the search palette is visible. */
	open: boolean;
	/** Updates the palette's controlled visibility. */
	onOpenChange: (open: boolean) => void;
	/** Agents available in the current workspace. */
	agents: Agent[];
	/** Rooms available in the current workspace. */
	sessions: Session[];
	/** Whether workspace navigation data is still loading. */
	isLoading: boolean;
	/** Opens the selected agent. */
	onAgentVisited: (agentId: string) => void;
	/** Opens the selected room. */
	onRoomVisited: (roomId: string) => void;
}

function roomTimestamp(room: Session): number {
	const timestamp = Date.parse(room.updatedAt);
	return Number.isNaN(timestamp) ? 0 : timestamp;
}

function matchesSearch(value: string, query: string): boolean {
	return value.toLocaleLowerCase().includes(query);
}

function AccessibleCommandLabel() {
	const anchorRef = useRef<HTMLSpanElement>(null);

	useLayoutEffect(() => {
		const commandLabel = anchorRef.current
			?.closest('[data-slot="command"]')
			?.querySelector("[cmdk-label]");
		if (commandLabel) commandLabel.textContent = "Search rooms and agents";
	}, []);

	return <span ref={anchorRef} aria-hidden="true" className="sr-only" />;
}

/** Centered search across actionable updates, agents, and rooms. */
export function SidebarSearchPalette({
	open,
	onOpenChange,
	agents,
	sessions,
	isLoading,
	onAgentVisited,
	onRoomVisited,
}: SidebarSearchPaletteProps) {
	const [search, setSearch] = useState("");
	const query = search.trim().toLocaleLowerCase();

	const agentResults = useMemo(
		() =>
			[...agents]
				.filter((agent) =>
					matchesSearch(`${agent.name} ${agent.description}`, query),
				)
				.sort((first, second) =>
					first.name.localeCompare(second.name, undefined, {
						sensitivity: "base",
					}),
				),
		[agents, query],
	);

	const roomCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const room of sessions) {
			counts.set(room.agentId, (counts.get(room.agentId) ?? 0) + 1);
		}
		return counts;
	}, [sessions]);

	const roomResults = useMemo(() => {
		const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
		return sessions
			.map((room): RoomPaletteItem => {
				const agentName =
					agentsById.get(room.agentId)?.name ?? room.agentId;
				const status = getSidebarRoomStatus(room);
				return {
					room,
					agentName,
					status,
					searchText:
						`${room.title} ${room.preview} ${agentName} ${room.status} ${status?.label ?? "ready"} ${status?.keywords ?? "ready"}`.toLocaleLowerCase(),
				};
			})
			.filter((item) => item.searchText.includes(query))
			.sort(
				(first, second) =>
					roomTimestamp(second.room) - roomTimestamp(first.room) ||
					first.room.id.localeCompare(second.room.id),
			);
	}, [agents, query, sessions]);

	const notificationResults = roomResults
		.filter(
			(item): item is RoomPaletteItem & { status: SidebarRoomStatus } =>
				item.status !== null,
		)
		.sort(
			(first, second) =>
				first.status.priority - second.status.priority ||
				roomTimestamp(second.room) - roomTimestamp(first.room) ||
				first.room.id.localeCompare(second.room.id),
		);
	const readyRoomResults = roomResults.filter((item) => item.status === null);
	const visibleReadyRooms = query
		? readyRoomResults
		: readyRoomResults.slice(0, INITIAL_ROOM_LIMIT);

	function handleOpenChange(nextOpen: boolean): void {
		onOpenChange(nextOpen);
		if (!nextOpen) setSearch("");
	}

	function handleAgentSelect(agentId: string): void {
		handleOpenChange(false);
		onAgentVisited(agentId);
	}

	function handleRoomSelect(roomId: string): void {
		handleOpenChange(false);
		onRoomVisited(roomId);
	}

	return (
		<CommandDialog
			open={open}
			onOpenChange={handleOpenChange}
			title="Search rooms and agents"
			description="Search workspace notifications, agents, and rooms."
			showCloseButton={false}
			className="border-input bg-card shadow-lg transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 sm:max-w-xl [&_[data-slot=command]]:bg-card"
		>
			<AccessibleCommandLabel />
			<CommandInput
				aria-label="Search rooms and agents"
				placeholder="Search rooms and agents…"
				value={search}
				onValueChange={setSearch}
			/>
			<CommandList className="max-h-96 p-1">
				<CommandEmpty>
					{isLoading
						? "Loading rooms and agents…"
						: "No rooms or agents found."}
				</CommandEmpty>
				{notificationResults.length > 0 ? (
					<CommandGroup heading="Notifications">
						{notificationResults.map((item) => (
							<CommandItem
								key={`notification-${item.room.id}`}
								value={`notification-${item.room.id} ${item.searchText}`}
								onSelect={() => handleRoomSelect(item.room.id)}
							>
								<span
									className={cn(
										"flex size-6 shrink-0 items-center justify-center",
										item.status.className,
									)}
								>
									{item.status.icon}
								</span>
								<span className="min-w-0 flex-1">
									<span className="block truncate">
										{item.room.title}
									</span>
									<span className="block truncate text-muted-foreground text-xs">
										{item.agentName}
									</span>
								</span>
								<span
									className={cn(
										"shrink-0 text-xs",
										item.status.className,
									)}
								>
									{item.status.label}
								</span>
							</CommandItem>
						))}
					</CommandGroup>
				) : null}
				{agentResults.length > 0 ? (
					<CommandGroup heading="Agents">
						{agentResults.map((agent) => {
							const roomCount = roomCounts.get(agent.id) ?? 0;
							return (
								<CommandItem
									key={`agent-${agent.id}`}
									value={`agent-${agent.id} ${agent.name} ${agent.description}`}
									onSelect={() => handleAgentSelect(agent.id)}
								>
									<AgentAvatar agent={agent} size="xs" />
									<span className="min-w-0 flex-1 truncate">
										{agent.name}
									</span>
									<span className="shrink-0 text-muted-foreground text-xs">
										{roomCount}{" "}
										{roomCount === 1 ? "room" : "rooms"}
									</span>
								</CommandItem>
							);
						})}
					</CommandGroup>
				) : null}
				{visibleReadyRooms.length > 0 ? (
					<CommandGroup heading={query ? "Rooms" : "Recent rooms"}>
						{visibleReadyRooms.map((item) => (
							<CommandItem
								key={`room-${item.room.id}`}
								value={`room-${item.room.id} ${item.searchText}`}
								onSelect={() => handleRoomSelect(item.room.id)}
							>
								<span className="min-w-0 flex-1">
									<span className="block truncate">
										{item.room.title}
									</span>
									<span className="block truncate text-muted-foreground text-xs">
										{item.agentName}
										{item.room.preview.trim()
											? ` · ${item.room.preview}`
											: ""}
									</span>
								</span>
							</CommandItem>
						))}
					</CommandGroup>
				) : null}
			</CommandList>
		</CommandDialog>
	);
}
