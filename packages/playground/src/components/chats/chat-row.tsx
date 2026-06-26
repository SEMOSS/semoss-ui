import {
	ArrowRightIcon,
	CheckIcon,
	PencilIcon,
	StarIcon,
	XIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Checkbox,
	cn,
	Input,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { normalizeTimestamp } from "@/utility";

export interface RoomItem {
	ROOM_ID: string;
	ROOM_NAME: string;
	DATE_CREATED: string;
	WORKSPACE_ID?: string;
	PINNED?: boolean;
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
	isEditing: boolean;
	editingName: string;
	setEditingName: (next: string) => void;
	isRenaming: boolean;
	onToggleSelect: () => void;
	onTogglePin: () => void;
	onStartRename: () => void;
	onCancelRename: () => void;
	onSaveRename: () => void;
}

/**
 * A single chat row on the all-chats page: select checkbox, name + date,
 * favorite (pin) toggle, inline rename, and navigation to the room.
 */
export const ChatRow = ({
	room,
	isSelected,
	isPinned,
	isEditing,
	editingName,
	setEditingName,
	isRenaming,
	onToggleSelect,
	onTogglePin,
	onStartRename,
	onCancelRename,
	onSaveRename,
}: ChatRowProps) => {
	const { t } = useTranslation("workspace");
	const d = normalizeTimestamp(room.DATE_CREATED);
	const relative = d.isValid() ? d.fromNow() : room.DATE_CREATED;
	const absolute = d.isValid()
		? d.format("MMM D, YYYY h:mm A")
		: room.DATE_CREATED;

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
							aria-label={t("workspace:chat.renameSave")}
						>
							<CheckIcon className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{t("workspace:chat.renameSave")}
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							disabled={isRenaming}
							onClick={onCancelRename}
							aria-label={t("workspace:chat.cancel")}
						>
							<XIcon className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{t("workspace:chat.cancel")}
					</TooltipContent>
				</Tooltip>
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
			{/* Stretched link covers the WHOLE row but z-0, so anything with
			    z-[1] above it intercepts clicks before the link does. */}
			<Link
				to={`/room/${room.ROOM_ID}`}
				aria-label={t("workspace:chat.selectRoom")}
				className="absolute inset-0 z-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			/>

			{/* Left select zone — wider hit area for the checkbox. Clicking
			    anywhere here toggles selection instead of opening the room. */}
			{/* biome-ignore lint/a11y/useSemanticElements: cannot use a real <button> here — it would wrap the interactive Checkbox component, which is itself a button (Radix renders <button role="checkbox">). Nested buttons are invalid HTML. The role + tabIndex + aria-label + onKeyDown gives equivalent a11y semantics. */}
			<div
				role="button"
				tabIndex={-1}
				aria-label={t("workspace:chats.selectChat", {
					name: room.ROOM_NAME,
					defaultValue: "Select chat {{name}}",
				})}
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					onToggleSelect();
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						e.stopPropagation();
						onToggleSelect();
					}
				}}
				className="relative z-1 flex shrink-0 cursor-pointer items-center py-2.5 @md:ps-4 ps-3 @md:pe-3 pe-2.5"
			>
				<Checkbox
					checked={isSelected}
					onCheckedChange={onToggleSelect}
					onClick={(e) => e.stopPropagation()}
					aria-label={t("workspace:chats.selectChat", {
						name: room.ROOM_NAME,
						defaultValue: "Select chat {{name}}",
					})}
					className={CHECKBOX_CLASS}
				/>
			</div>

			{/* Name + date — link covers this area for navigation */}
			<div className="pointer-events-none relative z-1 flex min-w-0 flex-1 flex-col py-2.5">
				<div
					dir="auto"
					className="truncate font-semibold text-foreground text-sm leading-tight"
					title={room.ROOM_NAME}
				>
					{room.ROOM_NAME}
				</div>
				<div
					className="text-muted-foreground text-xs leading-tight"
					title={absolute}
				>
					{relative}
				</div>
			</div>

			{/* Right actions: pin (always visible) + rename (always visible)
			    + arrow. Wrapper is `pointer-events-none` so clicks on the
			    arrow (purely visual) fall through to the stretched Link and
			    navigate to the room. Each Button re-enables events on itself
			    via `pointer-events-auto`. */}
			<div className="pointer-events-none relative z-1 flex shrink-0 items-center gap-0.5 @md:pe-3 pe-2">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={
								isPinned
									? t("workspace:chat.unpin")
									: t("workspace:chat.pin")
							}
							className={cn(
								"pointer-events-auto hover:text-yellow-500",
								isPinned
									? "text-yellow-500"
									: "text-muted-foreground",
							)}
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onTogglePin();
							}}
							data-testid={`chats-page--pin-${room.ROOM_ID}`}
						>
							<StarIcon
								className={cn(
									"size-4",
									isPinned && "fill-yellow-500",
								)}
							/>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{isPinned
							? t("workspace:chat.unpin")
							: t("workspace:chat.pin")}
					</TooltipContent>
				</Tooltip>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label={t("workspace:chat.rename")}
							className="pointer-events-auto text-muted-foreground hover:text-foreground"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onStartRename();
							}}
							data-testid={`chats-page--rename-${room.ROOM_ID}`}
						>
							<PencilIcon className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{t("workspace:chat.rename")}
					</TooltipContent>
				</Tooltip>
				<ArrowRightIcon className="rtl:-scale-x-100 ms-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover/row:text-foreground" />
			</div>
		</div>
	);
};
