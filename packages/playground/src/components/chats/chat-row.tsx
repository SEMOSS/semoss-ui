import {
	ArrowRightIcon,
	DownloadIcon,
	MoreVerticalIcon,
	PencilIcon,
	StarIcon,
	TrashIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "@semoss/i18n";
import {
	Badge,
	Button,
	Checkbox,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Input,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { useChat } from "@/hooks";

export interface RoomItem {
	ROOM_ID: string;
	ROOM_NAME: string;
	DATE_CREATED: string;
	UPDATED_AT?: string;
	WORKSPACE_ID?: string;
	PINNED?: boolean;
	/** Number of this room's messages matching the current search — only set
	 *  for rooms found via message-content search, not name matches. */
	MATCH_COUNT?: number;
}

// Default-size checkbox with a slightly stronger border than the faint
// default, so the selection affordance stays distinct against the card
// without reading as a chunky form control.
export const CHECKBOX_CLASS =
	"border-muted-foreground/50 hover:border-muted-foreground";

interface ChatRowProps {
	room: RoomItem;
	isSelected: boolean;
	isPinned: boolean;
	onToggleSelect: () => void;
	onTogglePin: () => void;
	onDownloadClick: () => void;
	onDeleteClick: () => void;
}

/** Formats a timestamp for the date columns as a compact date + time,
 *  falling back to the raw string when it can't be parsed. */
const formatDateCell = (raw: string) => {
	const d = parseTimestampWithUtcDefault(raw);
	return d.isValid() ? d.format("MM/DD/YY h:mm A") : raw;
};

/**
 * A single chat row on the all-chats page — styled to match the
 * Agents/Workspaces table (raw `<table>`, `hover:bg-muted/40` rows, tabular
 * date columns): select checkbox, name, date created, date last modified,
 * and a "⋮" menu (favorite, download, rename, delete) matching the sidebar's
 * chat-history menu, plus a continue-chat link.
 *
 * Inline rename is owned here — it's per-row, ephemeral state. Saving runs
 * `chat.renameRoom`, which bumps the room counter so any list watching it
 * (the chats page, the sidebar) refetches on its own.
 */
export const ChatRow = ({
	room,
	isSelected,
	isPinned,
	onToggleSelect,
	onTogglePin,
	onDownloadClick,
	onDeleteClick,
}: ChatRowProps) => {
	const { t } = useTranslation(["workspace", "sidebar"]);
	const { chat } = useChat();

	const [isEditing, setIsEditing] = useState(false);
	const [editingName, setEditingName] = useState("");
	const [isRenaming, setIsRenaming] = useState(false);
	// Escape cancels synchronously, but the input still loses focus right
	// after (as it unmounts) — this skips the blur-triggered save that would
	// otherwise immediately follow a cancel.
	const skipBlurSaveRef = useRef(false);

	const handleStartRename = () => {
		setEditingName(room.ROOM_NAME);
		setIsEditing(true);
	};

	const handleCancelRename = () => {
		skipBlurSaveRef.current = true;
		setIsEditing(false);
		setEditingName("");
	};

	const handleSaveRename = async () => {
		const trimmed = editingName.trim();
		if (!trimmed) {
			toast.error(t("workspace:chat.renameEmpty"));
			return;
		}
		setIsRenaming(true);
		try {
			await chat.renameRoom(room.ROOM_ID, trimmed);
			toast.success(t("workspace:chat.renameSuccess"));
			handleCancelRename();
		} catch {
			toast.error(t("workspace:chat.renameFailed"));
		} finally {
			setIsRenaming(false);
		}
	};

	const created = formatDateCell(room.DATE_CREATED);
	const modified = formatDateCell(room.UPDATED_AT || room.DATE_CREATED);

	return (
		<tr
			className={cn(
				"transition-colors hover:bg-muted/40",
				isSelected && "bg-muted/30",
			)}
			data-testid={`chats-page--row-${room.ROOM_ID}`}
		>
			<td className="whitespace-nowrap px-2 py-3 text-center">
				<Checkbox
					checked={isSelected}
					onCheckedChange={onToggleSelect}
					aria-label={t("workspace:chats.selectChat", {
						name: room.ROOM_NAME,
					})}
					className={CHECKBOX_CLASS}
				/>
			</td>

			<td className="min-w-[180px] max-w-0 px-4 py-3">
				{isEditing ? (
					<Input
						autoFocus
						value={editingName}
						disabled={isRenaming}
						onChange={(e) => setEditingName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleSaveRename();
							} else if (e.key === "Escape") {
								handleCancelRename();
							}
						}}
						onBlur={() => {
							if (skipBlurSaveRef.current) {
								skipBlurSaveRef.current = false;
								return;
							}
							handleSaveRename();
						}}
						className="h-8 w-full"
					/>
				) : (
					<div className="flex min-w-0 items-center gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<p
									dir="auto"
									className="w-fit max-w-full cursor-text truncate font-medium text-sm hover:underline"
									onDoubleClick={handleStartRename}
								>
									{room.ROOM_NAME}
								</p>
							</TooltipTrigger>
							<TooltipContent>{room.ROOM_NAME}</TooltipContent>
						</Tooltip>
						{room.MATCH_COUNT !== undefined && (
							<Badge
								variant="secondary"
								className="shrink-0 text-xs"
							>
								{t("workspace:chats.matchCount", {
									count: room.MATCH_COUNT,
								})}
							</Badge>
						)}
					</div>
				)}
			</td>

			<td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground text-xs tabular-nums sm:table-cell">
				{created}
			</td>

			<td className="hidden whitespace-nowrap px-4 py-3 text-muted-foreground text-xs tabular-nums sm:table-cell">
				{modified}
			</td>

			<td className="whitespace-nowrap px-4 py-3">
				<div className="flex items-center justify-end gap-1">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								asChild
								type="button"
								variant="outline"
								size="sm"
								disabled={isEditing}
								data-testid={`chats-page--continue-${room.ROOM_ID}`}
							>
								<Link to={`/room/${room.ROOM_ID}`}>
									<ArrowRightIcon className="rtl:-scale-x-100 size-4" />
								</Link>
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{t("workspace:chat.selectRoom")}
						</TooltipContent>
					</Tooltip>
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								disabled={isEditing}
								aria-label={t("workspace:chat.rename")}
								className="text-muted-foreground hover:text-foreground"
								data-testid={`chats-page--menu-${room.ROOM_ID}`}
							>
								<MoreVerticalIcon className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							<DropdownMenuItem
								onClick={onTogglePin}
								data-testid={`chats-page--pin-${room.ROOM_ID}`}
							>
								<StarIcon
									className={cn(
										"me-2 size-4",
										isPinned &&
											"fill-yellow-500 text-yellow-500",
									)}
								/>
								{isPinned
									? t("workspace:chat.unpin")
									: t("workspace:chat.pin")}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={onDownloadClick}>
								<DownloadIcon className="me-2 size-4" />
								{t("sidebar:actions.download")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={handleStartRename}
								data-testid={`chats-page--rename-${room.ROOM_ID}`}
							>
								<PencilIcon className="me-2 size-4" />
								{t("workspace:chat.rename")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={onDeleteClick}
								className="text-destructive focus:text-destructive"
								data-testid={`chats-page--delete-${room.ROOM_ID}`}
							>
								<TrashIcon className="me-2 size-4" />
								{t("workspace:chat.delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</td>
		</tr>
	);
};
