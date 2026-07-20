import dayjs from "dayjs";
import {
	MoreVerticalIcon,
	PencilIcon,
	SearchIcon,
	SquarePenIcon,
	StarIcon,
	Trash2Icon,
} from "lucide-react";
import { useState } from "react";
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
	ScrollArea,
	Spinner,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { DATE_BUCKET_ORDER, type DateBucket, getDateBucket } from "../lib/date";
import { cn } from "../lib/utils";
import type { RoomSummary } from "../types";

const BUCKET_LABELS: Record<DateBucket, string> = {
	today: "Today",
	yesterday: "Yesterday",
	fewDaysAgo: "Previous 3 Days",
	lastWeek: "Previous 7 Days",
	thisMonth: "This Month",
	lastMonth: "Last Month",
	older: "Older",
};

export interface RoomSidebarProps {
	pinnedRooms: RoomSummary[];
	rooms: RoomSummary[];
	activeRoomId?: string | null;
	search: string;
	onSearchChange: (value: string) => void;
	isLoading?: boolean;
	isLoadingMore?: boolean;
	hasMore?: boolean;
	onLoadMore: () => void;
	onSelectRoom?: (roomId: string) => void;
	onNewChat: () => void;
	onRenameRoom: (roomId: string, name: string) => void;
	onPinRoom: (roomId: string, pinned: boolean) => void;
	onDeleteRoom: (roomId: string) => void;
	className?: string;
}

interface RoomRowProps {
	room: RoomSummary;
	isActive: boolean;
	isEditing: boolean;
	editingName: string;
	onEditingNameChange: (value: string) => void;
	onStartRename: () => void;
	onCommitRename: () => void;
	onCancelRename: () => void;
	onSelect: () => void;
	onPin: () => void;
	onDelete: () => void;
}

function RoomRow({
	room,
	isActive,
	isEditing,
	editingName,
	onEditingNameChange,
	onStartRename,
	onCommitRename,
	onCancelRename,
	onSelect,
	onPin,
	onDelete,
}: RoomRowProps) {
	const displayName = room.name || "Untitled";

	if (isEditing) {
		return (
			<Input
				value={editingName}
				onChange={(event) => onEditingNameChange(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						onCommitRename();
					} else if (event.key === "Escape") {
						onCancelRename();
					}
				}}
				onBlur={onCommitRename}
				autoFocus
				className="h-8"
			/>
		);
	}

	return (
		<div
			data-slot="room-row"
			className={cn(
				"group flex min-w-0 items-center gap-1 rounded-md",
				isActive && "bg-accent",
			)}
		>
			<button
				type="button"
				onClick={onSelect}
				className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-md p-2 text-start hover:bg-accent"
			>
				<span className="w-full truncate font-medium text-sm leading-tight">
					{displayName}
				</span>
			</button>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={`More actions for ${displayName}`}
						className="shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
						onClick={(event) => event.stopPropagation()}
					>
						<MoreVerticalIcon className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="start"
					side="right"
					className="w-40"
				>
					<DropdownMenuItem
						onClick={(event) => {
							event.stopPropagation();
							onPin();
						}}
					>
						<StarIcon
							className={cn(
								"me-2 size-4",
								room.pinned &&
									"fill-yellow-500 text-yellow-500",
							)}
						/>
						{room.pinned ? "Unfavorite" : "Favorite"}
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={(event) => {
							event.stopPropagation();
							onStartRename();
						}}
					>
						<PencilIcon className="me-2 size-4" />
						Rename
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onClick={(event) => {
							event.stopPropagation();
							onDelete();
						}}
					>
						<Trash2Icon className="me-2 size-4" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

/**
 * Room-history sidebar — search/switch/rename/favorite/delete past
 * conversations, matching real playground's GlobalNav structure (search,
 * new chat, favorites section, date-bucketed sections, per-row kebab menu)
 * without its app-shell chrome (collapsible width, logo, /agent /chats
 * nav links) — that's playground's own shell, not a chat concern, per
 * docs/chat-components/PLAN.md.
 *
 * Pure props, like MessageList/ChatInput — does not call useChatRooms()
 * itself, so a caller drives it from that hook (or a fully custom source)
 * at the call site.
 */
export function RoomSidebar({
	pinnedRooms,
	rooms,
	activeRoomId: controlledActiveRoomId,
	search,
	onSearchChange,
	isLoading = false,
	isLoadingMore = false,
	hasMore = false,
	onLoadMore,
	onSelectRoom,
	onNewChat,
	onRenameRoom,
	onPinRoom,
	onDeleteRoom,
	className,
}: RoomSidebarProps) {
	const [internalActiveRoomId, setInternalActiveRoomId] = useState<
		string | null
	>(null);
	const activeRoomId = controlledActiveRoomId ?? internalActiveRoomId;

	function handleSelectRoom(roomId: string) {
		setInternalActiveRoomId(roomId);
		onSelectRoom?.(roomId);
	}

	function handleNewChat() {
		setInternalActiveRoomId(null);
		onNewChat();
	}

	const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");

	const { setScroll } = useInfiniteScroll({
		disabled: isLoading || isLoadingMore || !hasMore,
		onNext: onLoadMore,
	});

	function startRename(room: RoomSummary) {
		setEditingRoomId(room.roomId);
		setEditingName(room.name);
	}

	function commitRename() {
		if (editingRoomId) {
			const trimmed = editingName.trim();
			if (trimmed) {
				onRenameRoom(editingRoomId, trimmed);
			}
		}
		setEditingRoomId(null);
	}

	function cancelRename() {
		setEditingRoomId(null);
	}

	const pinnedIds = new Set(pinnedRooms.map((room) => room.roomId));
	const unpinnedRooms = rooms.filter((room) => !pinnedIds.has(room.roomId));
	const bucketed = new Map<DateBucket, RoomSummary[]>();
	for (const room of unpinnedRooms) {
		const bucket = getDateBucket(dayjs(room.dateCreated));
		const existing = bucketed.get(bucket);
		if (existing) {
			existing.push(room);
		} else {
			bucketed.set(bucket, [room]);
		}
	}

	const isEmpty =
		!isLoading && pinnedRooms.length === 0 && unpinnedRooms.length === 0;

	function renderRoom(room: RoomSummary) {
		return (
			<RoomRow
				key={room.roomId}
				room={room}
				isActive={room.roomId === activeRoomId}
				isEditing={editingRoomId === room.roomId}
				editingName={editingName}
				onEditingNameChange={setEditingName}
				onStartRename={() => startRename(room)}
				onCommitRename={commitRename}
				onCancelRename={cancelRename}
				onSelect={() => handleSelectRoom(room.roomId)}
				onPin={() => onPinRoom(room.roomId, !room.pinned)}
				onDelete={() => onDeleteRoom(room.roomId)}
			/>
		);
	}

	return (
		<div
			data-slot="room-sidebar"
			className={cn(
				"flex h-full w-64 shrink-0 flex-col border-border border-e bg-card",
				className,
			)}
		>
			<div className="flex flex-col gap-2 p-2">
				<InputGroup className="bg-background">
					<InputGroupInput
						placeholder="Search"
						value={search}
						onChange={(event) => onSearchChange(event.target.value)}
					/>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
				</InputGroup>
				<Button
					variant="ghost"
					className="justify-start gap-2"
					onClick={handleNewChat}
				>
					<SquarePenIcon className="size-4" />
					New Chat
				</Button>
			</div>
			<ScrollArea
				// Radix's ScrollArea Viewport wraps children in a
				// `display: table` div (for content-size measurement),
				// which lets a long room title's truncate span blow out
				// past the sidebar's fixed width instead of actually
				// truncating within it — same fix real playground's
				// GlobalNav already applies for the same reason.
				className="[&_[data-slot=scroll-area-viewport]>div]:block! min-h-0 flex-1"
				viewportRef={(ele) => setScroll(ele)}
			>
				<div className="flex min-w-0 flex-col gap-4 p-2 pb-4">
					{pinnedRooms.length > 0 && (
						<div className="flex flex-col gap-1">
							<div className="truncate px-2 font-medium text-muted-foreground text-xs">
								Favorites
							</div>
							{pinnedRooms.map(renderRoom)}
						</div>
					)}
					{DATE_BUCKET_ORDER.map((bucket) => {
						const bucketRooms = bucketed.get(bucket);
						if (!bucketRooms || bucketRooms.length === 0) {
							return null;
						}
						return (
							<div key={bucket} className="flex flex-col gap-1">
								<div className="truncate px-2 font-medium text-muted-foreground text-xs">
									{BUCKET_LABELS[bucket]}
								</div>
								{bucketRooms.map(renderRoom)}
							</div>
						);
					})}
					{isEmpty && (
						<div className="px-2 py-4 text-center text-muted-foreground text-sm">
							No conversations found.
						</div>
					)}
					{(isLoading || isLoadingMore) && (
						<div className="flex items-center justify-center py-2">
							<Spinner className="size-4" />
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}
