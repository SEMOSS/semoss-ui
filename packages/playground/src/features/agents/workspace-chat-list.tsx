import { SearchIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useChatSession } from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import {
	runPixel,
	useSessionIteratorPixel,
	useSessionPixel,
} from "@semoss/sdk/react";
import {
	Button,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	Spinner,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import {
	DATE_BUCKET_ORDER,
	getDateBucket,
	parseTimestampWithUtcDefault,
} from "@semoss/utility/date";
import {
	type WorkspaceChatRoom,
	WorkspaceChatRow,
} from "@/features/agents/workspace-chat-row";

/** Props for {@link WorkspaceChatList}. */
interface WorkspaceChatListProps {
	/**
	 * Workspace (agent) id whose chats to render.
	 */
	workspaceId: string;

	/**
	 * Page size for the iterator. Default 25.
	 */
	limit?: number;

	/**
	 * Max height for the scrollable list area. Default `24rem` (`max-h-96`).
	 */
	maxHeightClassName?: string;
}

/** A pinned room, as `GetPlaygroundRooms` returns it. */
interface PinnedRoom {
	/** The room's id. */
	ROOM_ID: string;
	/** The room's name. */
	ROOM_NAME?: string;
	/** The agent the room belongs to, if any. */
	WORKSPACE_ID?: string;
	/** Whether the room is pinned. */
	PINNED?: boolean;
}

/**
 * Renders an agent's recent chats as a vertical timeline grouped into
 * date buckets. Each row supports favorite (pin), rename (inline),
 * and delete (confirmed), each applied optimistically over the list.
 */
export const WorkspaceChatList = ({
	workspaceId,
	limit,
	maxHeightClassName = "max-h-96",
}: WorkspaceChatListProps) => {
	const { t } = useTranslation(["workspace", "sidebar"]);
	const { chat } = useChatSession();

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	// Rooms deleted or renamed here, laid over the fetched pages so the list
	// changes before it refetches
	const [deletedSet, setDeletedSet] = useState<Set<string>>(new Set());
	const [pendingDelete, setPendingDelete] =
		useState<WorkspaceChatRoom | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [pinnedSet, setPinnedSet] = useState<Set<string>>(new Set());
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");
	const [isRenaming, setIsRenaming] = useState(false);
	const [renamedMap, setRenamedMap] = useState<Record<string, string>>({});

	// One page of the agent's rooms at a time, restarted by a new search
	const roomList = useSessionIteratorPixel<
		{ total_count: number; rooms: WorkspaceChatRoom[] },
		WorkspaceChatRoom
	>(
		(limit, offset) =>
			`GetWorkspaceRooms(workspaceId=["${workspaceId}"], ${debouncedSearch ? `filters=[Filter(ROOM__ROOM_NAME ?like "<encode>${debouncedSearch}</encode>")],` : ""} limit=[${limit}], offset=[${offset}]);`,
		(response) => response.total_count,
		(response) => response.rooms,
		{ limit: limit ?? 25 },
		[debouncedSearch, workspaceId],
	);

	const { setScroll } = useInfiniteScroll({
		disabled: roomList.isLoading || !roomList.hasMore,
		onNext: () => roomList.next(),
	});

	// Every pinned room, across agents; narrowed to this agent below
	const pinnedRoomsPixel = useSessionPixel<PinnedRoom[]>(
		`META | GetPlaygroundRooms(pinned=[true], sort=["DESC"]);`,
		{ data: [] },
	);

	// Seed the pins from the server; later toggles update the set directly
	useEffect(() => {
		if (pinnedRoomsPixel.status !== "SUCCESS" || !pinnedRoomsPixel.data) {
			return;
		}
		const ids = pinnedRoomsPixel.data
			.filter((r) => r.WORKSPACE_ID === workspaceId)
			.map((r) => r.ROOM_ID);
		setPinnedSet(new Set(ids));
	}, [pinnedRoomsPixel.status, pinnedRoomsPixel.data, workspaceId]);

	const visibleRooms = useMemo(
		() => roomList.data.filter((r) => !deletedSet.has(r.room_id)),
		[roomList.data, deletedSet],
	);

	// Group rooms into date buckets, matching the sidebar.
	const groups = useMemo(() => {
		const byBucket = new Map<string, WorkspaceChatRoom[]>();
		for (const room of visibleRooms) {
			const d = parseTimestampWithUtcDefault(room.date_updated);
			if (!d.isValid()) continue;
			const bucket = getDateBucket(d);
			const rooms = byBucket.get(bucket);
			if (rooms) rooms.push(room);
			else byBucket.set(bucket, [room]);
		}
		return DATE_BUCKET_ORDER.filter((bucket) => byBucket.has(bucket)).map(
			(bucket) => ({
				bucket,
				label: t(`sidebar:buckets.${bucket}`),
				rooms: byBucket.get(bucket) ?? [],
			}),
		);
	}, [visibleRooms, t]);

	/** Deletes the room awaiting confirmation, hiding it until the server answers. */
	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		const roomId = pendingDelete.room_id;

		setIsDeleting(true);
		setDeletedSet((prev) => new Set([...prev, roomId]));

		try {
			await chat.closeRoom(roomId);
			toast.success(t("chat.deleteSuccess"));
			setPendingDelete(null);
			roomList.reset();
		} catch (e) {
			setDeletedSet((prev) => {
				const next = new Set(prev);
				next.delete(roomId);
				return next;
			});
			toast.error(
				e instanceof Error ? e.message : t("chat.deleteFailed"),
			);
		} finally {
			setIsDeleting(false);
		}
	};

	/**
	 * Pins or unpins a room, optimistically.
	 *
	 * @param roomId - The room to toggle.
	 */
	const handleTogglePin = async (roomId: string) => {
		const wasFavorite = pinnedSet.has(roomId);
		// Optimistic toggle
		setPinnedSet((prev) => {
			const next = new Set(prev);
			if (wasFavorite) next.delete(roomId);
			else next.add(roomId);
			return next;
		});
		try {
			await runPixel(
				`PinRoom(roomId=["${roomId}"], pinned=[${!wasFavorite}]);`,
			);
		} catch {
			// Revert on failure
			setPinnedSet((prev) => {
				const next = new Set(prev);
				if (wasFavorite) next.add(roomId);
				else next.delete(roomId);
				return next;
			});
			toast.error(
				wasFavorite ? t("chat.unpinFailed") : t("chat.pinFailed"),
			);
		}
	};

	/**
	 * Opens the inline rename for a room.
	 *
	 * @param room - The room to rename.
	 */
	const handleStartRename = (room: WorkspaceChatRoom) => {
		setEditingId(room.room_id);
		setEditingName(renamedMap[room.room_id] ?? room.room_name);
	};

	/** Closes the inline rename without saving. */
	const handleCancelRename = () => {
		setEditingId(null);
		setEditingName("");
	};

	/** Saves the inline rename; an empty name is refused. */
	const handleSaveRename = async () => {
		if (!editingId) return;
		const trimmed = editingName.trim();
		if (!trimmed) {
			toast.error(t("chat.renameEmpty"));
			return;
		}
		setIsRenaming(true);
		try {
			await chat.renameRoom(editingId, trimmed);
			toast.success(t("chat.renameSuccess"));
			setRenamedMap((prev) => ({ ...prev, [editingId]: trimmed }));
			setEditingId(null);
			setEditingName("");
		} catch {
			toast.error(t("chat.renameFailed"));
		} finally {
			setIsRenaming(false);
		}
	};

	/**
	 * Centers a loading, error or empty state in the list.
	 *
	 * @param children - The state to show.
	 * @returns The centered state.
	 */
	const renderState = (children: React.ReactNode) => (
		<div className="flex w-full items-center justify-center py-4">
			{children}
		</div>
	);

	const showInitialLoading = roomList.isLoading && roomList.data.length === 0;
	const showError = !showInitialLoading && roomList.isError;
	const showEmpty =
		!showInitialLoading && !showError && visibleRooms.length === 0;
	const showList = !showInitialLoading && !showError && !showEmpty;

	return (
		<>
			<div className="flex flex-col gap-3">
				{/* Search */}
				<InputGroup className="bg-background">
					<InputGroupInput
						placeholder={t("chat.searchPlaceholder", {
							defaultValue: "Search chats",
						})}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<InputGroupAddon>
						<SearchIcon />
					</InputGroupAddon>
				</InputGroup>

				{/* Scrollable body: the infinite scroll's target */}
				<div
					ref={(el) => {
						if (el) setScroll(el);
					}}
					className={cn("overflow-y-auto pe-1", maxHeightClassName)}
				>
					{showInitialLoading && renderState(<Spinner />)}
					{showError &&
						renderState(
							<>
								{t("chat.error")} {roomList.error?.message}
							</>,
						)}
					{showEmpty &&
						renderState(<Muted>{t("chat.noChats")}</Muted>)}
					{showList && (
						<div className="flex flex-col">
							{groups.map((g, gi) => {
								const isLast = gi === groups.length - 1;
								return (
									<div key={g.bucket} className="flex gap-4">
										{/* Timeline column */}
										<div className="relative flex w-3 shrink-0 flex-col items-center pt-2">
											<div
												className={cn(
													"z-10 size-3 shrink-0 rounded-full ring-2 ring-background",
													gi === 0
														? "bg-primary"
														: "bg-muted-foreground/40",
												)}
											/>
											{!isLast && (
												<div className="absolute top-3 bottom-0 w-px bg-border" />
											)}
										</div>

										{/* Content column */}
										<div
											className={cn(
												"flex min-w-0 flex-1 flex-col gap-2",
												!isLast && "pb-6",
											)}
										>
											<div className="text-muted-foreground text-sm">
												{g.label}
											</div>
											<div className="flex flex-col gap-2">
												{g.rooms.map((room) => (
													<WorkspaceChatRow
														key={room.room_id}
														t={t}
														room={
															renamedMap[
																room.room_id
															]
																? {
																		...room,
																		room_name:
																			renamedMap[
																				room
																					.room_id
																			],
																	}
																: room
														}
														isFavorite={pinnedSet.has(
															room.room_id,
														)}
														isEditing={
															editingId ===
															room.room_id
														}
														editingName={
															editingName
														}
														onEditingNameChange={
															setEditingName
														}
														isRenaming={isRenaming}
														onStartRename={() =>
															handleStartRename(
																room,
															)
														}
														onCancelRename={
															handleCancelRename
														}
														onSaveRename={
															handleSaveRename
														}
														onTogglePin={() =>
															handleTogglePin(
																room.room_id,
															)
														}
														onRequestDelete={() =>
															setPendingDelete(
																room,
															)
														}
													/>
												))}
											</div>
										</div>
									</div>
								);
							})}

							{!showInitialLoading &&
								roomList.isLoading &&
								roomList.data.length > 0 && (
									<div className="flex items-center justify-center p-4">
										<Spinner className="size-4" />
									</div>
								)}
						</div>
					)}
				</div>
			</div>

			<Dialog
				open={!!pendingDelete}
				onOpenChange={(open) => {
					if (!open) setPendingDelete(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{t("chat.deleteConfirmTitle")}
						</DialogTitle>
						<DialogDescription>
							{t("chat.deleteConfirmDescription", {
								name: pendingDelete?.room_name ?? "",
							})}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setPendingDelete(null)}
							disabled={isDeleting}
						>
							{t("chat.cancel")}
						</Button>
						<Button
							variant="destructive"
							onClick={handleConfirmDelete}
							disabled={isDeleting}
						>
							{t("chat.delete")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
};
