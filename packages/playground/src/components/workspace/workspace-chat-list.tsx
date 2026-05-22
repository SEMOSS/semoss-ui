import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
	ArrowRightIcon,
	CheckIcon,
	PencilIcon,
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
	Muted,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useChat } from "@/hooks";

dayjs.extend(relativeTime);

interface WorkspaceChatListProps {
	/**
	 * List of chats associated with the workspace
	 */
	workspaceId: string;

	/**
	 * Search the chats by name
	 */
	search: string;

	/**
	 * Cap the initial fetch to this many rooms (and skip the pinned
	 * query). Default behavior fetches up to 25 rooms and a pinned-rooms
	 * query for favorite indicators.
	 */
	limit?: number;
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
 * Renders an agent's recent chats as a vertical timeline grouped by
 * calendar day. Each row supports favorite (pin), rename (inline),
 * and delete (confirmed).
 *
 * @component
 */
export const WorkspaceChatList = ({
	workspaceId,
	search,
	limit,
}: WorkspaceChatListProps) => {
	const { t } = useTranslation("workspace");
	const { chat } = useChat();

	const [deletedSet, setDeletedSet] = useState<Set<string>>(new Set());
	const [pendingDelete, setPendingDelete] = useState<Room | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [pinnedSet, setPinnedSet] = useState<Set<string>>(new Set());
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingName, setEditingName] = useState("");
	const [isRenaming, setIsRenaming] = useState(false);

	const getWorkspaceRooms = useIteratorPixel<
		{ total_count: number; rooms: Room[] },
		Room
	>(
		(l, offset) =>
			`GetWorkspaceRooms(workspaceId=["${workspaceId}"], ${search ? `filters=[Filter(room_name ?like "${search}")],` : ""} limit=[${l}], offset=[${offset}]);`,
		(response) => response.total_count,
		(response) => response.rooms,
		{ limit: limit ?? 25 },
		[search, workspaceId],
	);

	// Cross-workspace pinned-rooms query — filtered locally to this workspace
	const getPinnedRooms = usePixel<PinnedRoom[]>(
		`META | GetPlaygroundRooms(pinned=[true], offset=0, sort=["DESC"])`,
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

	// Group rooms by calendar day (descending)
	const groups = useMemo(() => {
		const map = new Map<
			string,
			{ label: string; ts: number; rooms: Room[] }
		>();
		for (const room of visibleRooms) {
			const raw = room.date_updated;
			const d = dayjs(raw.endsWith("Z") ? raw : `${raw}Z`);
			if (!d.isValid()) continue;
			const startOfDay = d.startOf("day");
			const key = startOfDay.format("YYYY-MM-DD");
			if (!map.has(key)) {
				map.set(key, {
					label: getDayLabel(startOfDay, t),
					ts: startOfDay.valueOf(),
					rooms: [],
				});
			}
			map.get(key)?.rooms.push(room);
		}
		return Array.from(map.values()).sort((a, b) => b.ts - a.ts);
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
		setEditingName(room.room_name);
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
			await runPixel(
				`RenameRoom(roomId=["${editingId}"], name=["${trimmed}"]);`,
			);
			toast.success(t("chat.renameSuccess"));
			setEditingId(null);
			setEditingName("");
			getWorkspaceRooms.reset();
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

	if (getWorkspaceRooms.isLoading && getWorkspaceRooms.data.length === 0) {
		return renderState(<Spinner />);
	}

	if (getWorkspaceRooms.isError) {
		return renderState(
			<>
				{t("chat.error")} {getWorkspaceRooms.error?.message}
			</>,
		);
	}

	if (visibleRooms.length === 0) {
		return renderState(<Muted>{t("chat.noChats")}</Muted>);
	}

	return (
		<>
			<div className="flex flex-col">
				{groups.map((g, gi) => {
					const isLast = gi === groups.length - 1;
					return (
						<div key={g.ts} className="flex gap-4">
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
											room={room}
											isFavorite={pinnedSet.has(
												room.room_id,
											)}
											isEditing={
												editingId === room.room_id
											}
											editingName={editingName}
											setEditingName={setEditingName}
											isRenaming={isRenaming}
											onStartRename={() =>
												handleStartRename(room)
											}
											onCancelRename={handleCancelRename}
											onSaveRename={handleSaveRename}
											onTogglePin={() =>
												handleTogglePin(room.room_id)
											}
											onRequestDelete={() =>
												setPendingDelete(room)
											}
										/>
									))}
								</div>
							</div>
						</div>
					);
				})}
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
		<div className="group/row relative flex items-center gap-2 rounded-lg border border-border bg-card pr-3 pl-2 transition-colors hover:border-border/80 hover:bg-accent/40">
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
				className="min-w-0 flex-1 truncate py-2.5 font-semibold text-foreground text-sm"
				title={room.room_name}
			>
				{room.room_name}
			</span>
			<div className="relative z-10 flex shrink-0 items-center gap-0.5">
				{/* Rename */}
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={t("chat.rename")}
							className="invisible text-muted-foreground hover:text-foreground focus-visible:visible group-hover/row:visible"
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
							className="invisible text-muted-foreground hover:text-destructive focus-visible:visible group-hover/row:visible"
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

				<ArrowRightIcon className="ml-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover/row:text-foreground" />
			</div>
		</div>
	);
}

function getDayLabel(
	startOfDay: dayjs.Dayjs,
	t: (key: string, params?: Record<string, unknown>) => string,
): string {
	const today = dayjs().startOf("day");
	const days = today.diff(startOfDay, "day");
	if (days <= 0) return t("chat.dayToday");
	if (days === 1) return t("chat.dayYesterday");
	if (days < 30) return t("chat.daysAgo", { count: days });
	return startOfDay.format("MMM D, YYYY");
}
