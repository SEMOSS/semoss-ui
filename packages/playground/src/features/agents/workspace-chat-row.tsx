import {
	ArrowRightIcon,
	CheckIcon,
	PencilIcon,
	StarIcon,
	Trash2Icon,
	XIcon,
} from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Input,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

/** A room in an agent's chat list, as `GetWorkspaceRooms` returns it. */
export interface WorkspaceChatRoom {
	/** The room's id. */
	room_id: string;
	/** The room's name. */
	room_name: string;
	/** When the room last changed, the timestamp it is grouped by. */
	date_updated: string;
}

/** Props for {@link WorkspaceChatRow}. */
interface WorkspaceChatRowProps {
	/** The room, with any rename made here already applied. */
	room: WorkspaceChatRoom;
	/** Whether the room is pinned. */
	isFavorite: boolean;
	/** Whether the row shows the inline rename. */
	isEditing: boolean;
	/** The name being typed in the inline rename. */
	editingName: string;
	/** Called as the user types a new name. */
	onEditingNameChange: (next: string) => void;
	/** Whether a rename is saving, which disables the rename controls. */
	isRenaming: boolean;
	/** Called to open the inline rename. */
	onStartRename: () => void;
	/** Called to close the inline rename without saving. */
	onCancelRename: () => void;
	/** Called to save the inline rename. */
	onSaveRename: () => void;
	/** Called to pin or unpin the room. */
	onTogglePin: () => void;
	/** Called to ask to delete the room; the list confirms first. */
	onRequestDelete: () => void;
}

/**
 * One room in an agent's chat list: a link to the room with pin, rename and
 * delete actions, or, while renaming, the inline name field.
 */
export const WorkspaceChatRow = ({
	room,
	isFavorite,
	isEditing,
	editingName,
	onEditingNameChange,
	isRenaming,
	onStartRename,
	onCancelRename,
	onSaveRename,
	onTogglePin,
	onRequestDelete,
}: WorkspaceChatRowProps) => {
	const { t } = useTranslation(["workspace", "sidebar"]);
	if (isEditing) {
		return (
			<div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
				<Input
					autoFocus
					value={editingName}
					disabled={isRenaming}
					onChange={(e) => onEditingNameChange(e.target.value)}
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

			{/* Favorite: before the name, always visible, filled when pinned */}
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
};
