import {
	DownloadIcon,
	type LucideIcon,
	PackagePlusIcon,
	PencilIcon,
	StarIcon,
	TrashIcon,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { useRoomActionsContext } from "./room-actions.context";

/** One of a room's actions, as a menu item or a slash command shows it. */
interface RoomActionItem {
	/** Stable key; also the slash command's id. */
	id: "favorite" | "rename" | "publish" | "download" | "delete";
	/** The action's icon. */
	icon: LucideIcon;
	/** Its name, the same in Settings' Room section and the slash menu. */
	label: string;
	/** What it does, for the slash menu. */
	description: string;
	/** Other words the slash menu finds it by. */
	keywords: string[];
	/** Whether it is on, as Favorite is for a favorite room. */
	isActive?: boolean;
	/** Whether it destroys something. */
	isDestructive?: boolean;
	/** Runs it. */
	onSelect: () => void;
}

/**
 * The room's own actions in the order every menu lists them: Favorite,
 * Rename, Publish as Agent, Download, and Delete. Favorite is left out where
 * the chat history is hidden; only the slash menu lists Rename, since a
 * double-click on the name renames it. Call it from an observer inside a
 * `RoomActionsProvider`.
 *
 * @return The actions, or an empty list outside a room.
 */
export const useRoomActionItems = (): RoomActionItem[] => {
	const { t } = useTranslation(["room", "sidebar"]);
	const context = useRoomActionsContext();
	if (!context) return [];
	const { room, actions } = context;
	const items: RoomActionItem[] = [];
	if (!room.theme.featureFlags?.hideChatHistory) {
		items.push({
			id: "favorite",
			icon: StarIcon,
			label: actions.isFavorite
				? t("sidebar:actions.unfavorite")
				: t("sidebar:actions.favorite"),
			description: actions.isFavorite
				? t("room:slash.commands.unfavorite.description")
				: t("room:slash.commands.favorite.description"),
			keywords: ["favorite", "unfavorite", "pin"],
			isActive: actions.isFavorite,
			onSelect: () => void actions.toggleFavorite(),
		});
	}
	items.push(
		{
			id: "publish",
			icon: PackagePlusIcon,
			label: t("room:workspace.publish"),
			description: t("room:slash.commands.publish.description"),
			keywords: ["agent", "save as agent"],
			onSelect: context.openPublish,
		},
		{
			id: "rename",
			icon: PencilIcon,
			label: t("sidebar:actions.rename"),
			description: t("room:slash.commands.rename.description"),
			keywords: [],
			onSelect: context.startRenaming,
		},
		{
			id: "download",
			icon: DownloadIcon,
			label: t("sidebar:actions.download"),
			description: t("room:slash.commands.download.description"),
			keywords: ["export", "word", "pdf"],
			onSelect: context.openDownload,
		},
		{
			id: "delete",
			icon: TrashIcon,
			label: t("sidebar:actions.delete"),
			description: t("room:slash.commands.delete.description"),
			keywords: ["remove"],
			isDestructive: true,
			onSelect: () => void actions.remove(),
		},
	);
	return items;
};
