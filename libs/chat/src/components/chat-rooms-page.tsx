import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
	ArrowRightIcon,
	CheckIcon,
	PencilIcon,
	SearchIcon,
	StarIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { useChatRoomsContext } from "../chat-rooms-provider";
import {
	DATE_BUCKET_ORDER,
	type DateBucket,
	getDateBucket,
	normalizeTimestamp,
} from "../lib/date";
import { cn } from "../lib/utils";
import type { RoomSummary } from "../types";

dayjs.extend(relativeTime);

const BUCKET_LABELS: Record<DateBucket, string> = {
	today: "Today",
	yesterday: "Yesterday",
	fewDaysAgo: "Previous 3 Days",
	lastWeek: "Previous 7 Days",
	thisMonth: "This Month",
	lastMonth: "Last Month",
	older: "Older",
};

const CHECKBOX_CLASS =
	"border-muted-foreground/50 hover:border-muted-foreground";

export interface ChatRoomsPageProps {
	className?: string;
	/** Page title shown above the list. */
	title?: ReactNode;
	/** Optional subtitle under the title. */
	description?: ReactNode;
	/** Optional callback when a room is selected from the list. */
	onSelectRoom?: (roomId: string) => void;
	/** Optional callback when New Chat is clicked. */
	onNewChat?: () => void;
	/** Optional callback when All Chats is clicked. */
	onAllChats?: () => void;
}

interface ChatRoomRowProps {
	room: RoomSummary;
	isSelected: boolean;
	isPinned: boolean;
	onToggleSelect: () => void;
	onTogglePin: () => void;
	onSelectRoom: () => void;
	onRenameRoom: (name: string) => Promise<void>;
}

function ChatRoomRow({
	room,
	isSelected,
	isPinned,
	onToggleSelect,
	onTogglePin,
	onSelectRoom,
	onRenameRoom,
}: ChatRoomRowProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editingName, setEditingName] = useState(room.name);
	const [isRenaming, setIsRenaming] = useState(false);

	const displayName = room.name || "Untitled";
	const created = normalizeTimestamp(dayjs(room.dateCreated).toISOString());
	const relative = created.isValid() ? created.fromNow() : "";
	const absolute = created.isValid()
		? created.format("MMM D, YYYY h:mm A")
		: room.dateCreated.toISOString();

	function handleStartRename() {
		setEditingName(room.name);
		setIsEditing(true);
	}

	function handleCancelRename() {
		setIsEditing(false);
		setEditingName("");
	}

	async function handleSaveRename() {
		const trimmed = editingName.trim();
		if (!trimmed) {
			return;
		}
		setIsRenaming(true);
		try {
			await onRenameRoom(trimmed);
			setIsEditing(false);
		} finally {
			setIsRenaming(false);
		}
	}

	if (isEditing) {
		return (
			<div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
				<Input
					autoFocus
					value={editingName}
					disabled={isRenaming}
					onChange={(event) => setEditingName(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							void handleSaveRename();
						} else if (event.key === "Escape") {
							handleCancelRename();
						}
					}}
					className="h-8 flex-1"
				/>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					disabled={isRenaming}
					onClick={() => {
						void handleSaveRename();
					}}
					aria-label={`Save rename for ${displayName}`}
				>
					<CheckIcon className="size-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					disabled={isRenaming}
					onClick={handleCancelRename}
					aria-label={`Cancel rename for ${displayName}`}
				>
					<XIcon className="size-4" />
				</Button>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"group/row relative flex min-w-0 items-center rounded-lg border border-border bg-card transition-colors hover:border-border/80 hover:bg-accent/40",
				isSelected && "border-primary bg-accent/30",
			)}
		>
			<div className="relative z-1 flex shrink-0 items-center py-2.5 ps-3 pe-2.5">
				<Checkbox
					checked={isSelected}
					onCheckedChange={onToggleSelect}
					onClick={(event) => event.stopPropagation()}
					aria-label={`Select chat ${displayName}`}
					className={CHECKBOX_CLASS}
				/>
			</div>

			<button
				type="button"
				onClick={onSelectRoom}
				className="min-w-0 flex-1 py-2.5 text-start"
			>
				<div
					dir="auto"
					className="truncate font-semibold text-foreground text-sm leading-tight"
					title={displayName}
				>
					{displayName}
				</div>
				<div
					className="text-muted-foreground text-xs leading-tight"
					title={absolute}
				>
					{relative}
				</div>
			</button>

			<div className="relative z-1 flex shrink-0 items-center gap-0.5 pe-2">
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={
						isPinned
							? `Unfavorite ${displayName}`
							: `Favorite ${displayName}`
					}
					className={cn(
						"hover:text-yellow-500",
						isPinned ? "text-yellow-500" : "text-muted-foreground",
					)}
					onClick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						onTogglePin();
					}}
				>
					<StarIcon
						className={cn("size-4", isPinned && "fill-yellow-500")}
					/>
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={`Rename ${displayName}`}
					className="text-muted-foreground hover:text-foreground"
					onClick={(event) => {
						event.preventDefault();
						event.stopPropagation();
						handleStartRename();
					}}
				>
					<PencilIcon className="size-4" />
				</Button>
				<ArrowRightIcon className="ms-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover/row:text-foreground" />
			</div>
		</div>
	);
}

/**
 * Full-page chat history view that mirrors playground's all-chats page:
 * sticky heading, search, select-all toolbar, favorites section, date
 * buckets, inline rename, and bulk delete confirmation.
 */
export function ChatRoomsPage({
	className,
	title = "All Chats",
	description = "Browse all conversations across rooms.",
	onSelectRoom,
}: ChatRoomsPageProps) {
	const {
		pinnedRooms,
		rooms,
		search,
		setSearch,
		isLoading,
		isLoadingMore,
		hasMore,
		loadMore,
		renameRoom,
		pinRoom,
		deleteRoom,
		setActiveRoom,
	} = useChatRoomsContext();

	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [deletedSet, setDeletedSet] = useState<Set<string>>(new Set());
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const pinnedIds = useMemo(
		() => new Set(pinnedRooms.map((room) => room.roomId)),
		[pinnedRooms],
	);

	const roomById = useMemo(() => {
		const map = new Map<string, RoomSummary>();
		for (const room of pinnedRooms) {
			map.set(room.roomId, room);
		}
		for (const room of rooms) {
			map.set(room.roomId, room);
		}
		return map;
	}, [pinnedRooms, rooms]);

	const visibleRooms = useMemo(
		() => rooms.filter((room) => !deletedSet.has(room.roomId)),
		[rooms, deletedSet],
	);

	const isSearching = search.trim().length > 0;

	const visiblePinnedRooms = useMemo(() => {
		if (isSearching) {
			return [];
		}
		return pinnedRooms.filter((room) => !deletedSet.has(room.roomId));
	}, [deletedSet, isSearching, pinnedRooms]);

	const groups = useMemo(() => {
		const byBucket = new Map<DateBucket, RoomSummary[]>();
		for (const room of visibleRooms) {
			if (!isSearching && pinnedIds.has(room.roomId)) {
				continue;
			}
			const bucket = getDateBucket(dayjs(room.dateCreated));
			const bucketRooms = byBucket.get(bucket);
			if (bucketRooms) {
				bucketRooms.push(room);
			} else {
				byBucket.set(bucket, [room]);
			}
		}
		return DATE_BUCKET_ORDER.filter((bucket) => byBucket.has(bucket)).map(
			(bucket) => ({
				bucket,
				label: BUCKET_LABELS[bucket],
				rooms: byBucket.get(bucket) ?? [],
			}),
		);
	}, [visibleRooms, pinnedIds, isSearching]);

	const allVisibleIds = useMemo(() => {
		const ids: string[] = [];
		for (const room of visiblePinnedRooms) {
			ids.push(room.roomId);
		}
		for (const group of groups) {
			for (const room of group.rooms) {
				ids.push(room.roomId);
			}
		}
		return ids;
	}, [groups, visiblePinnedRooms]);

	const hasRooms = allVisibleIds.length > 0;
	const hasSelection = selectedIds.size > 0;
	const allSelected =
		hasRooms && allVisibleIds.every((roomId) => selectedIds.has(roomId));

	const { setScroll } = useInfiniteScroll({
		disabled: isLoading || isLoadingMore || !hasMore,
		onNext: loadMore,
	});

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			const inEditableField =
				!!target &&
				(target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.isContentEditable);

			if (event.key === "Escape" && hasSelection && !inEditableField) {
				setSelectedIds(new Set());
				return;
			}

			if (
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === "a" &&
				!inEditableField &&
				hasRooms
			) {
				event.preventDefault();
				setSelectedIds(new Set(allVisibleIds));
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [allVisibleIds, hasRooms, hasSelection]);

	function toggleSelectOne(roomId: string) {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(roomId)) {
				next.delete(roomId);
			} else {
				next.add(roomId);
			}
			return next;
		});
	}

	function toggleSelectAll() {
		if (allSelected) {
			setSelectedIds(new Set());
			return;
		}
		setSelectedIds(new Set(allVisibleIds));
	}

	function handleSelectRoom(roomId: string) {
		setActiveRoom(roomId);
		onSelectRoom?.(roomId);
	}

	async function handleConfirmDelete() {
		if (selectedIds.size === 0) {
			return;
		}
		const ids = Array.from(selectedIds);
		setIsDeleting(true);
		setDeletedSet((prev) => new Set([...prev, ...ids]));

		const results = await Promise.allSettled(
			ids.map((roomId) => deleteRoom(roomId)),
		);
		const failedIds = ids.filter(
			(_, index) => results[index].status === "rejected",
		);

		if (failedIds.length > 0) {
			setDeletedSet((prev) => {
				const next = new Set(prev);
				for (const roomId of failedIds) {
					next.delete(roomId);
				}
				return next;
			});
		}

		setSelectedIds(new Set());
		setConfirmOpen(false);
		setIsDeleting(false);
	}

	return (
		<div
			ref={(element) => {
				if (element) {
					setScroll(element);
				}
			}}
			data-slot="chat-rooms-page"
			className={cn(
				"@container h-full w-full overflow-y-auto",
				className,
			)}
		>
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-4 @3xl:px-12 @md:px-6 px-4 pt-8 pb-4">
				<div className="-mx-4 -mt-8 @md:-mx-6 @3xl:-mx-12 sticky top-0 z-20 flex items-center gap-3 border-border border-b bg-background/95 @3xl:px-12 @md:px-6 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80">
					<div className="min-w-0 flex-1">
						<h2 className="truncate font-semibold @md:text-2xl text-foreground text-xl leading-tight">
							{title}
						</h2>
						{description ? (
							<p className="@md:block hidden text-muted-foreground text-sm">
								{description}
							</p>
						) : null}
					</div>
				</div>

				<InputGroup className="bg-background">
					<InputGroupInput
						placeholder="Search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
				</InputGroup>

				{hasRooms ? (
					<div className="flex h-8 items-center gap-3 px-1">
						<Checkbox
							checked={allSelected}
							onCheckedChange={toggleSelectAll}
							aria-label="Select all chats"
							className={CHECKBOX_CLASS}
						/>
						<button
							type="button"
							onClick={toggleSelectAll}
							className="font-medium text-foreground text-sm hover:text-foreground/80"
						>
							{allSelected ? "Deselect all" : "Select all"}
						</button>
						{hasSelection ? (
							<>
								<span className="text-muted-foreground text-sm">
									{selectedIds.size} selected
								</span>
								<div className="ms-auto flex items-center gap-1">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setConfirmOpen(true)}
										disabled={isDeleting}
										className="text-destructive hover:bg-destructive/10 hover:text-destructive"
									>
										<Trash2Icon />
										Delete
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											setSelectedIds(new Set())
										}
										disabled={isDeleting}
									>
										Cancel
									</Button>
								</div>
							</>
						) : null}
					</div>
				) : null}

				<div>
					{isLoading && rooms.length === 0 ? (
						<div className="flex w-full items-center justify-center py-12">
							<Spinner />
						</div>
					) : !hasRooms ? (
						<div className="flex w-full items-center justify-center py-12 text-muted-foreground text-sm">
							No chats found.
						</div>
					) : (
						<div className="flex w-full flex-col gap-6">
							{visiblePinnedRooms.length > 0 ? (
								<div className="flex flex-col gap-2">
									<div className="flex items-center gap-1.5 px-1 font-medium text-muted-foreground text-xs">
										<StarIcon className="size-3.5 fill-yellow-500 text-yellow-500" />
										Favorites
									</div>
									<div className="flex flex-col gap-2">
										{visiblePinnedRooms.map((room) => (
											<ChatRoomRow
												key={room.roomId}
												room={room}
												isSelected={selectedIds.has(
													room.roomId,
												)}
												isPinned={pinnedIds.has(
													room.roomId,
												)}
												onToggleSelect={() =>
													toggleSelectOne(room.roomId)
												}
												onTogglePin={() => {
													void pinRoom(
														room.roomId,
														!room.pinned,
													);
												}}
												onSelectRoom={() =>
													handleSelectRoom(
														room.roomId,
													)
												}
												onRenameRoom={(name) =>
													renameRoom(
														room.roomId,
														name,
													)
												}
											/>
										))}
									</div>
								</div>
							) : null}

							{groups.map((group) => (
								<div
									key={group.bucket}
									className="flex flex-col gap-2"
								>
									<div className="px-1 font-medium text-muted-foreground text-xs">
										{group.label}
									</div>
									<div className="flex flex-col gap-2">
										{group.rooms.map((room) => {
											const mappedRoom =
												roomById.get(room.roomId) ??
												room;
											const isPinned = pinnedIds.has(
												mappedRoom.roomId,
											);
											return (
												<ChatRoomRow
													key={mappedRoom.roomId}
													room={mappedRoom}
													isSelected={selectedIds.has(
														mappedRoom.roomId,
													)}
													isPinned={isPinned}
													onToggleSelect={() =>
														toggleSelectOne(
															mappedRoom.roomId,
														)
													}
													onTogglePin={() => {
														void pinRoom(
															mappedRoom.roomId,
															!isPinned,
														);
													}}
													onSelectRoom={() =>
														handleSelectRoom(
															mappedRoom.roomId,
														)
													}
													onRenameRoom={(name) =>
														renameRoom(
															mappedRoom.roomId,
															name,
														)
													}
												/>
											);
										})}
									</div>
								</div>
							))}

							{isLoadingMore ? (
								<div className="flex items-center justify-center p-4">
									<Spinner className="size-4" />
								</div>
							) : null}
						</div>
					)}
				</div>
			</div>

			<Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							Delete {selectedIds.size} selected chats?
						</DialogTitle>
						<DialogDescription>
							This action permanently deletes the selected chats.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setConfirmOpen(false)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								void handleConfirmDelete();
							}}
							disabled={isDeleting}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
