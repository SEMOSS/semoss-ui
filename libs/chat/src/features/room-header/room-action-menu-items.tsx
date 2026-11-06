import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	cn,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from "@semoss/ui/next";
import { useRoomActionItems } from "../room-actions/use-room-action-items";
import {
	HEADER_MENU_ITEM_CLASS_NAME,
	HEADER_MENU_LABEL_CLASS_NAME,
} from "./header-menu.constants";

/**
 * The More actions menu's Room section: Favorite, Rename, Publish as Agent,
 * Download, and Delete, after a separator. Its menu passes
 * `handleMenuCloseAutoFocus` as `onCloseAutoFocus` so Rename can start.
 * Outside a `RoomActionsProvider` it renders nothing.
 */
export const RoomActionMenuItems = () => {
	const { t } = useTranslation("room");
	const labelId = useId();
	const items = useRoomActionItems();
	if (items.length === 0) return null;
	return (
		<>
			<DropdownMenuSeparator />
			<DropdownMenuGroup aria-labelledby={labelId}>
				<DropdownMenuLabel
					id={labelId}
					className={HEADER_MENU_LABEL_CLASS_NAME}
				>
					{t("header.roomSection")}
				</DropdownMenuLabel>
				{items.map((item) => (
					<DropdownMenuItem
						key={item.id}
						variant={item.isDestructive ? "destructive" : "default"}
						className={HEADER_MENU_ITEM_CLASS_NAME}
						onSelect={item.onSelect}
					>
						<item.icon
							aria-hidden="true"
							className={cn(
								item.isActive && "fill-current text-foreground",
							)}
						/>
						{item.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuGroup>
		</>
	);
};
