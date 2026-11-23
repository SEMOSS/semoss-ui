import { FolderPlusIcon } from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import type { RoomLocalFoldersStore } from "./room-local-folders.store";
import { useLocalFolders } from "./use-local-folders";

/** Props for {@link AttachFolderButton}. */
interface AttachFolderButtonProps {
	/** The room's attached folders. */
	store: RoomLocalFoldersStore;
	/** Show the label beside the icon, as in an empty Desktop section. */
	isLabelled?: boolean;
}

/**
 * Attach Folder, which opens the machine's folder picker and attaches what the
 * user picks to the room.
 *
 * @param props - The room's folders, and whether to show the label.
 * @returns The button.
 */
export const AttachFolderButton = ({
	store,
	isLabelled = false,
}: AttachFolderButtonProps) => {
	const { t } = useTranslation("desktop");
	const isPicking = useLocalFolders(store, (snapshot) => snapshot.isPicking);
	const handleClick = () => {
		store.attach().catch((error: unknown) => {
			toast.error(
				t("localFolders.attachFailed", {
					message: getErrorMessage(error, ""),
				}),
			);
		});
	};
	const label = t("localFolders.attach");

	if (isLabelled) {
		return (
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={isPicking}
				onClick={handleClick}
			>
				<FolderPlusIcon aria-hidden />
				{label}
			</Button>
		);
	}

	return (
		<Tooltip disableHoverableContent={false}>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					aria-label={label}
					disabled={isPicking}
					onClick={handleClick}
				>
					<FolderPlusIcon aria-hidden className="size-3" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				{t("localFolders.attachDescription")}
			</TooltipContent>
		</Tooltip>
	);
};
