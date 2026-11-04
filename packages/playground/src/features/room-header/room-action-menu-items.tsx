import {
	DownloadIcon,
	PackagePlusIcon,
	PencilIcon,
	StarIcon,
	TrashIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import {
	cn,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
} from "@semoss/ui/next";
import { useRoomTitle } from "./room-title.context";

/** One menu row's spacing, roomier on touch screens. */
const ITEM_CLASS_NAME = "gap-2.5 max-md:min-h-11";

export interface RoomActionMenuItemsProps {
	/** Heads the items with "Room", where they share a menu with other things. */
	showLabel?: boolean;
}

/**
 * The room's own actions as menu items: Favorite, Rename, Publish as Agent,
 * Download, and Delete. Rendered in any header menu inside a room's
 * `RoomTitleProvider`, whose content passes `handleMenuCloseAutoFocus` as its
 * `onCloseAutoFocus` so Rename can start; outside one it renders nothing.
 */
export const RoomActionMenuItems = observer(
	({ showLabel = false }: RoomActionMenuItemsProps) => {
		const { t } = useTranslation(["room", "sidebar"]);
		const title = useRoomTitle();
		if (!title) return null;
		const { room, actions } = title;
		const hideChatHistory = Boolean(
			room.theme.featureFlags?.hideChatHistory,
		);
		return (
			<>
				{showLabel && (
					<DropdownMenuLabel className="text-muted-foreground text-xs">
						{t("room:header.roomSection")}
					</DropdownMenuLabel>
				)}
				<DropdownMenuGroup>
					{!hideChatHistory && (
						<DropdownMenuItem
							className={ITEM_CLASS_NAME}
							onSelect={() => void actions.togglePinned()}
						>
							<StarIcon
								aria-hidden="true"
								className={cn(
									actions.isPinned &&
										"fill-current text-foreground",
								)}
							/>
							{actions.isPinned
								? t("sidebar:actions.unfavorite")
								: t("sidebar:actions.favorite")}
						</DropdownMenuItem>
					)}
					<DropdownMenuItem
						className={ITEM_CLASS_NAME}
						onSelect={title.requestRename}
					>
						<PencilIcon aria-hidden="true" />
						{t("sidebar:actions.rename")}
					</DropdownMenuItem>
					<DropdownMenuItem
						className={ITEM_CLASS_NAME}
						onSelect={title.openPublish}
					>
						<PackagePlusIcon aria-hidden="true" />
						{t("room:workspace.publishTooltip")}
					</DropdownMenuItem>
					<DropdownMenuItem
						className={ITEM_CLASS_NAME}
						onSelect={title.openDownload}
					>
						<DownloadIcon aria-hidden="true" />
						{t("sidebar:actions.download")}
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						className={ITEM_CLASS_NAME}
						onSelect={() => void actions.remove()}
					>
						<TrashIcon aria-hidden="true" />
						{t("sidebar:actions.delete")}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</>
		);
	},
);
