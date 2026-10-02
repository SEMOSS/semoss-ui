import {
	FolderTreeIcon,
	ScrollTextIcon,
	Settings2Icon,
	WrenchIcon,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import { DropdownMenuItem } from "@semoss/ui/next";

export interface WorkspaceMenuItemsProps {
	/** Opens or focuses the room's file explorer. */
	onOpenFiles: () => void;
	/**
	 * Opens or focuses Chat Tools, every tool the assistant has. Absent for a
	 * draft, whose tools are not settled until its first message.
	 */
	onOpenTools?: () => void;
	/** Opens the current draft's settings. */
	onOpenSettings: () => void;
	/** Absent until a room has been prepared. */
	onOpenActivity?: () => void;
	/** Deployment-level activity log visibility. */
	showActivityLog?: boolean;
	/** Prevent duplicate room preparation while keeping Settings available. */
	isPreparing?: boolean;
	/** Dismiss the containing mobile drawer after selecting a destination. */
	onNavigate?: () => void;
}

/** The same flat destinations in draft and room Workspace menus. */
export function WorkspaceMenuItems({
	onOpenFiles,
	onOpenTools,
	onOpenSettings,
	onOpenActivity,
	showActivityLog = true,
	isPreparing = false,
	onNavigate,
}: WorkspaceMenuItemsProps) {
	const { t } = useTranslation("room");
	const { t: tTeamwork } = useTranslation("teamwork");
	const select = (action: () => void) => {
		action();
		onNavigate?.();
	};
	return (
		<>
			<DropdownMenuItem
				className="text-xs max-md:min-h-11"
				disabled={isPreparing}
				onSelect={() => select(onOpenFiles)}
			>
				<FolderTreeIcon aria-hidden="true" />
				{t(
					isPreparing
						? "studio.preparingWorkspace"
						: "menuFileExplorer.open",
				)}
			</DropdownMenuItem>
			{onOpenTools && (
				<DropdownMenuItem
					className="text-xs max-md:min-h-11"
					onSelect={() => select(onOpenTools)}
				>
					<WrenchIcon aria-hidden="true" />
					{tTeamwork("menu.showTools")}
				</DropdownMenuItem>
			)}
			{showActivityLog && (
				<DropdownMenuItem
					className="text-xs max-md:min-h-11"
					disabled={!onOpenActivity}
					onSelect={() => onOpenActivity && select(onOpenActivity)}
				>
					<ScrollTextIcon aria-hidden="true" />
					{t("studio.viewActivityLog")}
				</DropdownMenuItem>
			)}
			<DropdownMenuItem
				className="text-xs max-md:min-h-11"
				onSelect={() => select(onOpenSettings)}
			>
				<Settings2Icon aria-hidden="true" />
				{t("settings.edit")}
			</DropdownMenuItem>
		</>
	);
}
