import {
	DownloadIcon,
	MoreVertical,
	PencilIcon,
	StarIcon,
	TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import type { PlaygroundRoomRow } from "@semoss/sdk";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Input,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@semoss/ui/next";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { RoomLink } from "../../components/room-link";
import { useChat } from "../../host/chat.context";
import {
	renameRoom,
	toggleRoomFavorite,
} from "../room-actions/use-room-actions";

/** Props for {@link RoomHistoryItem}. */
export interface RoomHistoryItemProps {
	/** The room the row shows. */
	room: PlaygroundRoomRow;
	/** Whether it is the room on screen. */
	isActive: boolean;
	/** Show when the room was created, under its name. */
	showDate: boolean;
	/** Download the room's conversation. */
	onDownload: (roomId: string) => void;
	/** Delete the room. */
	onDelete: (roomId: string) => void;
}

/**
 * One room in the chat history: a link to it, renamed in place, and its
 * menu (favorite, download, rename, delete).
 *
 * @component
 */
export const RoomHistoryItem = ({
	room,
	isActive,
	showDate,
	onDownload,
	onDelete,
}: RoomHistoryItemProps) => {
	const { t } = useTranslation(["sidebar", "workspace"]);
	const { chat } = useChat();
	const [editingName, setEditingName] = useState<string | null>(null);

	const roomId = room.ROOM_ID;
	const name = room.ROOM_NAME || t("messages.untitled");
	const isFavorite = room.PINNED || false;
	const date = showDate
		? parseTimestampWithUtcDefault(room.DATE_CREATED)
				.toDate()
				.toLocaleString(undefined, {
					month: "numeric",
					day: "numeric",
					year: "numeric",
					hour: "numeric",
					minute: "2-digit",
					hour12: true,
				})
		: null;

	const handleSaveRename = async (value: string) => {
		if (await renameRoom(chat, roomId, value, t)) {
			setEditingName(null);
		}
	};

	if (editingName !== null) {
		return (
			<SidebarMenuItem className="group relative flex">
				<Input
					value={editingName}
					onChange={(e) => setEditingName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							handleSaveRename(editingName);
						} else if (e.key === "Escape") {
							setEditingName(null);
						}
					}}
					onBlur={() => handleSaveRename(editingName)}
					autoFocus
					className="h-8 flex-1"
				/>
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem className="group relative flex">
			<SidebarMenuButton asChild isActive={isActive}>
				<RoomLink
					roomId={roomId}
					className={cn(
						"flex h-auto flex-col items-start p-2",
						date && "gap-1",
					)}
				>
					<span
						dir="auto"
						className="truncate font-medium text-sm leading-tight"
					>
						{name}
					</span>
					{date && (
						<span className="text-muted-foreground text-xs leading-none">
							{date}
						</span>
					)}
				</RoomLink>
			</SidebarMenuButton>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={t("workspace:chat.moreActions", { name })}
					>
						<MoreVertical className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="start"
					side="right"
					sideOffset={5}
					className="w-40"
				>
					<DropdownMenuItem
						onClick={() =>
							toggleRoomFavorite(chat, roomId, isFavorite, t)
						}
					>
						<StarIcon
							className={cn(
								"me-2 size-4",
								isFavorite && "fill-yellow-500 text-yellow-500",
							)}
						/>
						{isFavorite
							? t("actions.unfavorite")
							: t("actions.favorite")}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => onDownload(roomId)}>
						<DownloadIcon className="me-2 size-4" />
						{t("actions.download")}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setEditingName(name)}>
						<PencilIcon className="me-2 size-4" />
						{t("actions.rename")}
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => onDelete(roomId)}
						className="text-destructive focus:text-destructive"
					>
						<TrashIcon className="me-2 size-4" />
						{t("actions.delete")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</SidebarMenuItem>
	);
};
