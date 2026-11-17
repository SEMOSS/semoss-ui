import { DownloadIcon, MoreVertical, StarIcon, TrashIcon } from "lucide-react";
import { type MouseEvent, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@semoss/ui/next";
import { parseTimestampWithUtcDefault } from "@semoss/utility/date";
import { useChatConfig } from "../../chat/config/use-chat-config";
import { useChatSession } from "../../chat/provider/use-chat-session";
import {
	renameRoom,
	toggleRoomFavorite,
} from "../../room/actions/use-room-actions";
import { RoomName } from "../../room/header/room-name";
import { getRoomDate, type RoomListItem } from "./room-list-groups";

/** Props for {@link RoomListRow}. */
interface RoomListRowProps {
	/** The room the row shows. */
	room: RoomListItem;
	/** Whether the room is the one open now. */
	isActive: boolean;
	/** Whether the room's name is being edited in place. */
	isRenaming: boolean;
	/** Whether a favorite shows its star, as it does when the list is grouped. */
	shouldShowFavoriteMark: boolean;
	/** Start editing the name: a double-click on it, or F2 on the row. */
	onStartRename: () => void;
	/** Stop editing the name. */
	onStopRename: () => void;
	/** Open the room's download dialog. */
	onDownload: () => void;
	/** Delete the room. */
	onDelete: () => void;
}

/**
 * One room in the list: a link to it with its name, and its date when the
 * theme shows dates, beside a menu to favorite, download, or delete it. The
 * menu opens from its ⋯ button or a right click on the row; F2 or a
 * double-click on the name renames it in place.
 */
export const RoomListRow = ({
	room,
	isActive,
	isRenaming,
	shouldShowFavoriteMark,
	onStartRename,
	onStopRename,
	onDownload,
	onDelete,
}: RoomListRowProps) => {
	const { t } = useTranslation("sidebar");
	const { theme, navigation } = useChatConfig();
	const { chat } = useChatSession();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const roomId = room.ROOM_ID;
	const isFavorite = room.PINNED || false;
	const date = theme.sidebar.chatHistoryDate
		? parseTimestampWithUtcDefault(getRoomDate(room))
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

	/**
	 * A plain click opens the room in place; a modified or middle click is
	 * the browser's, so the link still opens in a new tab.
	 *
	 * @param event - The click on the room's link.
	 */
	const handleOpen = (event: MouseEvent<HTMLAnchorElement>) => {
		if (
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}
		event.preventDefault();
		navigation.openRoom(roomId);
	};

	// the same name, editable in place, whether or not it is being renamed
	const roomName = (
		<RoomName
			name={room.ROOM_NAME ?? ""}
			placeholder={t("messages.untitled")}
			isRenaming={isRenaming}
			onStartRename={onStartRename}
			onRename={(nextName) => renameRoom(chat, roomId, nextName, t)}
			onStopRename={onStopRename}
			className={
				isRenaming
					? "h-8 max-w-none flex-1"
					: "min-w-0 flex-1 font-medium text-sm leading-tight"
			}
		/>
	);

	if (isRenaming) {
		return (
			<SidebarMenuItem className="group/room relative flex">
				{roomName}
			</SidebarMenuItem>
		);
	}

	return (
		<SidebarMenuItem className="group/room relative flex">
			<SidebarMenuButton asChild isActive={isActive}>
				<a
					className={cn(
						"flex h-auto flex-col items-start justify-center px-2 py-1",
						date && "gap-1",
					)}
					href={navigation.roomHref(roomId)}
					onClick={handleOpen}
					onContextMenu={(event) => {
						event.preventDefault();
						setIsMenuOpen(true);
					}}
					onKeyDown={(event) => {
						if (event.key !== "F2") return;
						event.preventDefault();
						onStartRename();
					}}
				>
					<span className="flex w-full min-w-0 items-center gap-1.5">
						{shouldShowFavoriteMark ? (
							<StarIcon
								className="size-3 shrink-0 fill-current text-muted-foreground"
								aria-hidden="true"
							/>
						) : null}
						{roomName}
					</span>
					{date && (
						<span className="text-muted-foreground text-xs leading-none">
							{date}
						</span>
					)}
				</a>
			</SidebarMenuButton>
			<DropdownMenu
				modal={false}
				open={isMenuOpen}
				onOpenChange={setIsMenuOpen}
			>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={t("actions.roomActions")}
						// shown on hover, keyboard focus, or while open; always on touch screens
						className="text-muted-foreground hover:text-sidebar-accent-foreground focus-visible:opacity-100 data-[state=open]:opacity-100 md:opacity-0 md:group-hover/room:opacity-100 md:group-focus-within/room:opacity-100"
						onClick={(e) => {
							e.stopPropagation();
						}}
					>
						<MoreVertical aria-hidden="true" className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="start"
					side="right"
					sideOffset={5}
					className="w-40"
				>
					<DropdownMenuItem
						onClick={(e) => {
							e.stopPropagation();
							// it bumps the room counter, which refetches the list
							void toggleRoomFavorite(
								chat,
								roomId,
								isFavorite,
								t,
							);
						}}
					>
						<StarIcon
							aria-hidden="true"
							className={cn(
								"me-2 size-4",
								isFavorite && "fill-warning text-warning",
							)}
						/>
						{isFavorite
							? t("actions.unfavorite")
							: t("actions.favorite")}
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={(e) => {
							e.stopPropagation();
							onDownload();
						}}
					>
						<DownloadIcon
							aria-hidden="true"
							className="me-2 size-4"
						/>
						{t("actions.download")}
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						className="text-destructive focus:text-destructive"
					>
						<TrashIcon aria-hidden="true" className="me-2 size-4" />
						{t("actions.delete")}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</SidebarMenuItem>
	);
};
