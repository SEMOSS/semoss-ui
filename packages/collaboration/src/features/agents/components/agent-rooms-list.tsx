import { MessageSquare, Plus, Search } from "lucide-react";
import { memo, useState } from "react";
import {
	Button,
	cn,
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
	Input,
} from "@semoss/ui/next";
import { useAgent } from "@/app/agent.context";
import { EmptyView } from "@/components/common/empty-view";
import { SourceLabel } from "@/components/common/source-label";
import { StatusLabel } from "@/components/common/status-label";
import type { Session } from "@/types/session";

type RoomFilter = "All" | "Unread" | "Preview" | "Pinned";

interface AgentRoomsListProps {
	agentId: string;
	collapsed: boolean;
	sessions: Session[];
	selectedRoomId?: string;
	onSelectRoom: (roomId: string) => void;
	onNewRoom: () => void;
}

export const AgentRoomsList = memo(function AgentRoomsList({
	agentId,
	collapsed,
	sessions,
	selectedRoomId,
	onSelectRoom,
	onNewRoom,
}: AgentRoomsListProps) {
	const { agent } = useAgent();
	const [filter, setFilter] = useState<RoomFilter>("All");
	const [search, setSearch] = useState("");
	const rooms = sessions
		.filter((session) => session.agentId === agentId)
		.filter((session) => {
			const matchesSearch = session.title
				.toLowerCase()
				.includes(search.trim().toLowerCase());
			const matchesFilter =
				filter === "All" ||
				(filter === "Unread" && session.unread) ||
				(filter === "Preview" && session.status === "Your review") ||
				(filter === "Pinned" && session.pinned);
			return matchesSearch && matchesFilter;
		})
		.sort((first, second) =>
			second.updatedAt.localeCompare(first.updatedAt),
		);
	const unreadCount = sessions.filter(
		(session) => session.agentId === agentId && session.unread,
	).length;

	return (
		<div className="flex h-full min-h-0 flex-col bg-muted/40">
			<div className="flex h-17 shrink-0 items-center justify-between border-b px-4 group-data-[collapsible=icon]/room-sidebar:h-auto group-data-[collapsible=icon]/room-sidebar:justify-center group-data-[collapsible=icon]/room-sidebar:border-b-0 group-data-[collapsible=icon]/room-sidebar:px-0 group-data-[collapsible=icon]/room-sidebar:py-3">
				{!collapsed && (
					<div className="min-w-0">
						<h1 className="truncate font-semibold text-sm">
							Sessions
						</h1>
						<p className="truncate text-muted-foreground text-xs">
							{agent.name}
						</p>
					</div>
				)}
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={`New session with ${agent.name}`}
						onClick={onNewRoom}
					>
						<Plus />
					</Button>
				</div>
			</div>
			{!collapsed && (
				<div className="shrink-0 space-y-3 border-b p-3">
					<div className="relative">
						<Search className="absolute top-2.5 left-2.5 size-3.5 text-muted-foreground" />
						<Input
							className="h-9 bg-background pl-8 text-xs"
							placeholder="Search sessions..."
							aria-label="Search sessions"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
						/>
					</div>
					<fieldset
						className="flex gap-0.5"
						aria-label="Filter sessions"
					>
						{(
							[
								"All",
								"Unread",
								"Preview",
								"Pinned",
							] as RoomFilter[]
						).map((option) => (
							<button
								type="button"
								key={option}
								onClick={() => setFilter(option)}
								aria-pressed={filter === option}
								className={cn(
									"inline-flex min-w-0 flex-1 items-center justify-center gap-1 rounded-sm px-1.5 py-1 text-xs",
									filter === option
										? "bg-background font-medium shadow-sm"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								{option}
								{option === "Unread" && unreadCount > 0 && (
									<span className="rounded-full bg-destructive/10 px-1.5 font-medium text-destructive text-xs leading-4">
										{unreadCount}
									</span>
								)}
							</button>
						))}
					</fieldset>
				</div>
			)}
			<div className="min-h-0 flex-1 overflow-y-auto p-2 group-data-[collapsible=icon]/room-sidebar:flex-none group-data-[collapsible=icon]/room-sidebar:overflow-visible group-data-[collapsible=icon]/room-sidebar:p-0">
				{rooms.map((room) => {
					const roomButton = (
						<button
							key={room.id}
							type="button"
							aria-label={room.title}
							onClick={() => onSelectRoom(room.id)}
							className={cn(
								"relative mb-1 flex w-full gap-2.5 rounded-md px-2.5 py-3 text-left",
								collapsed &&
									"mx-auto mb-2 size-8 items-center justify-center p-0",
								selectedRoomId === room.id
									? "bg-accent"
									: "hover:bg-secondary",
							)}
						>
							{collapsed ? (
								<>
									<MessageSquare
										className="size-4 shrink-0"
										aria-hidden="true"
									/>
									{room.unread && (
										<span className="absolute top-1 right-1">
											<span className="block size-1.5 rounded-full bg-destructive" />
										</span>
									)}
								</>
							) : (
								<span className="min-w-0 flex-1">
									<span className="flex items-center gap-1.5">
										<strong className="min-w-0 flex-1 truncate font-medium text-xs">
											{room.title}
										</strong>
										{room.unread && (
											<span className="block size-1.5 rounded-full bg-destructive" />
										)}
									</span>
									<span className="mt-1 block truncate text-muted-foreground text-xs">
										{room.preview}
									</span>
									<span className="mt-2 flex items-center justify-between gap-2">
										<SourceLabel origin={room.origin} />
										<StatusLabel status={room.status} />
									</span>
								</span>
							)}
						</button>
					);

					if (!collapsed) return roomButton;

					return (
						<HoverCard key={room.id}>
							<HoverCardTrigger asChild>
								{roomButton}
							</HoverCardTrigger>
							<HoverCardContent side="right" align="start">
								<div className="space-y-2">
									<div className="flex items-start gap-2">
										<strong className="min-w-0 flex-1 font-medium text-sm leading-5">
											{room.title}
										</strong>
										{room.unread && (
											<>
												<span
													className="size-2 rounded-full bg-destructive"
													aria-hidden="true"
												/>
												<span className="sr-only">
													Unread
												</span>
											</>
										)}
									</div>
									<p className="wrap-break-word text-muted-foreground text-xs leading-5">
										{room.preview}
									</p>
									<div className="flex items-center justify-between gap-2">
										<SourceLabel origin={room.origin} />
										<StatusLabel status={room.status} />
									</div>
								</div>
							</HoverCardContent>
						</HoverCard>
					);
				})}
				{!collapsed && rooms.length === 0 && (
					<div>
						<EmptyView title="No sessions found">
							Try another filter or start a new session.
						</EmptyView>
					</div>
				)}
			</div>
		</div>
	);
});
