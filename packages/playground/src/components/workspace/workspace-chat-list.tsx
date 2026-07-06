import {
	ArrowRightIcon,
	CheckIcon,
	PencilIcon,
	SearchIcon,
	StarIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import { runPixel, useIteratorPixel, usePixel } from "@semoss/sdk/react";
import {
	Button,
	cn,
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
	Muted,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { useChat } from "@/hooks";
import {
	DATE_BUCKET_ORDER,
	getDateBucket,
	normalizeTimestamp,
} from "@/utility";

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

interface Room {
	room_id: string;
	room_name: string;
	date_updated: string;
}

interface PinnedRoom {
	ROOM_ID: string;
	ROOM_NAME?: string;
	WORKSPACE_ID?: string;
	PINNED?: boolean;
}

/**
 * Renders an agent's recent chats as a vertical timeline grouped into
 * date buckets. Each row supports favorite (pin), rename (inline),
 * and delete (confirmed).
 *
 * @component
 */
export const WorkspaceChatList = ({
	workspaceId,
	limit,
	maxHeightClassName = "max-h-96",
}: WorkspaceChatListProps) => {
	const { t } = useTranslation(["workspace", "sidebar"]);
	const { chat } = useChat();

	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const [deletedSet, setDeletedSet] = useState<Set<string>>(new Set());
	const [pendingDelete, setPendingDelete] = useState<Room | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [pinnedSet, setPinnedSet] = useState<Set<string>>(new Set());
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");
	const [isRenaming, setIsRenaming] = useState(false);
	const [renamedMap, setRenamedMap] = useState<Record<string, string>>({});

	const getWorkspaceRooms = useIteratorPixel<
		{ total_count: number; rooms: Room[] },
		Room
	>(
		(limit, offset) =>
			`GetWorkspaceRooms(workspaceId=["${workspaceId}"], ${debouncedSearch ? `filters=[Filter(ROOM__ROOM_NAME ?like "<encode>${debouncedSearch}</encode>")],` : ""} limit=[${limit}], offset=[${offset}]);`,
		(response) => response.total_count,
		(response) => response.rooms,
		{ limit: limit ?? 25 },
		[debouncedSearch, workspaceId],
	);

	const { setScroll } = useInfiniteScroll({
		disabled: getWorkspaceRooms.isLoading || !getWorkspaceRooms.hasMore,
		onNext: () => getWorkspaceRooms.next(),
	});

	// Cross-workspace pinned-rooms query — filtered locally to this workspace
	const getPinnedRooms = usePixel<PinnedRoom[]>(
		`META | GetPlaygroundRooms(pinned=[true], sort=["DESC"]);`,
		{ data: [] },
	);

	useEffect(() => {
		if (getPinnedRooms.status !== "SUCCESS" || !getPinnedRooms.data) {
			return;
		}
		const ids = getPinnedRooms.data
			.filter((r) => r.WORKSPACE_ID === workspaceId)
			.map((r) => r.ROOM_ID);
		setPinnedSet(new Set(ids));
	}, [getPinnedRooms.status, getPinnedRooms.data, workspaceId]);

	const visibleRooms = useMemo(
		() => getWorkspaceRooms.data.filter((r) => !deletedSet.has(r.room_id)),
		[getWorkspaceRooms.data, deletedSet],
	);

	// Group rooms into date buckets, matching the sidebar.
	const groups = useMemo(() => {
		const byBucket = new Map<string, Room[]>();
		for (const room of visibleRooms) {
			const d = normalizeTimestamp(room.date_updated);
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

	/* Handlers */
	const handleConfirmDelete = async () => {
		if (!pendingDelete) return;
		const roomId = pendingDelete.room_id;

		setIsDeleting(true);
		setDeletedSet((prev) => new Set([...prev, roomId]));

		try {
			await chat.closeRoom(roomId);
			toast.success(t("chat.deleteSuccess"));
			setPendingDelete(null);
			getWorkspaceRooms.reset();
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

	const handleStartRename = (room: Room) => {
		setEditingId(room.room_id);
		setEditingName(renamedMap[room.room_id] ?? room.room_name);
	};

	const handleCancelRename = () => {
		setEditingId(null);
		setEditingName("");
	};

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

	/* Render */
	const renderState = (children: React.ReactNode) => (
		<div className="flex w-full items-center justify-center py-4">
			{children}
		</div>
	);

	const showInitialLoading =
		getWorkspaceRooms.isLoading && getWorkspaceRooms.data.length === 0;
	const showError = !showInitialLoading && getWorkspaceRooms.isError;
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

				{/* Scrollable body — owns infinite scroll target */}
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
								{t("chat.error")}{" "}
								{getWorkspaceRooms.error?.message}
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
													<ChatRow
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
														setEditingName={
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
								getWorkspaceRooms.isLoading &&
								getWorkspaceRooms.data.length > 0 && (
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

interface ChatRowProps {
	t: (key: string, params?: Record<string, unknown>) => string;
	room: Room;
	isFavorite: boolean;
	isEditing: boolean;
	editingName: string;
	setEditingName: (next: string) => void;
	isRenaming: boolean;
	onStartRename: () => void;
	onCancelRename: () => void;
	onSaveRename: () => void;
	onTogglePin: () => void;
	onRequestDelete: () => void;
}

function ChatRow({
	t,
	room,
	isFavorite,
	isEditing,
	editingName,
	setEditingName,
	isRenaming,
	onStartRename,
	onCancelRename,
	onSaveRename,
	onTogglePin,
	onRequestDelete,
}: ChatRowProps) {
	if (isEditing) {
		return (
			<div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
				<Input
					autoFocus
					value={editingName}
					disabled={isRenaming}
					onChange={(e) => setEditingName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							onSaveRename();
						} else if (e.key === "Escape") {
							onCancelRename();
						}
					}}
					className="h-8 flex-1"
				/>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							disabled={isRenaming}
							onClick={onSaveRename}
							aria-label={t("chat.renameSave")}
						>
							<CheckIcon className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>{t("chat.renameSave")}</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							disabled={isRenaming}
							onClick={onCancelRename}
							aria-label={t("chat.cancel")}
						>
							<XIcon className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>{t("chat.cancel")}</TooltipContent>
				</Tooltip>
			</div>
		);
	}

	return (
		<div className="group/row relative flex items-center gap-2 rounded-lg border border-border bg-card py-2 ps-2 pe-3 transition-colors hover:border-border/80 hover:bg-accent/40">
			{/* Stretched link: makes the whole row clickable */}
			<Link
				to={`/room/${room.room_id}`}
				aria-label={t("chat.selectRoom")}
				className="absolute inset-0 z-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			/>

			{/* Favorite — to the left of the name (always visible, filled when pinned) */}
			<div className="relative z-10 shrink-0">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={
								isFavorite ? t("chat.unpin") : t("chat.pin")
							}
							className={cn(
								"hover:text-yellow-500",
								isFavorite
									? "text-yellow-500"
									: "text-muted-foreground",
							)}
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onTogglePin();
							}}
							data-testid={`workspace-chat-list--pin-${room.room_id}`}
						>
							<StarIcon
								className={cn(
									"size-4",
									isFavorite && "fill-yellow-500",
								)}
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{isFavorite ? t("chat.unpin") : t("chat.pin")}
					</TooltipContent>
				</Tooltip>
			</div>

			<span
				dir="auto"
				className="min-w-0 flex-1 truncate font-semibold text-foreground text-sm"
				title={room.room_name}
			>
				{room.room_name}
			</span>
			{/* Right actions: rename + delete (both hover-revealed) + arrow.
			    Wrapper is `pointer-events-none` so clicks on the arrow
			    (purely visual) fall through to the stretched Link and
			    navigate to the room. Each Button re-enables events on
			    itself via `pointer-events-auto`. */}
			<div className="pointer-events-none relative z-10 flex shrink-0 items-center gap-0.5">
				{/* Rename */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={t("chat.rename")}
							className="pointer-events-auto invisible text-muted-foreground hover:text-foreground focus-visible:visible group-hover/row:visible"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onStartRename();
							}}
							data-testid={`workspace-chat-list--rename-${room.room_id}`}
						>
							<PencilIcon className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>{t("chat.rename")}</TooltipContent>
				</Tooltip>

				{/* Delete */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={t("chat.delete")}
							className="pointer-events-auto invisible text-muted-foreground hover:text-destructive focus-visible:visible group-hover/row:visible"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onRequestDelete();
							}}
							data-testid={`workspace-chat-list--delete-${room.room_id}`}
						>
							<Trash2Icon className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>{t("chat.delete")}</TooltipContent>
				</Tooltip>

				<ArrowRightIcon className="rtl:-scale-x-100 ms-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover/row:text-foreground" />
			</div>
		</div>
	);
}
