import { XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useContext } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	DrawerClose,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useWorkbench } from "@semoss/workbench";
import { DraftSettingsContext } from "@/features/workbench/draft-settings.context";
import type { RoomStore } from "@/stores/room/room.store";
import { SaveWorkspaceDialog } from "./room-workspace-creation";

interface RoomSidebarActionsProps {
	/** The room whose work area and publishing configuration these actions use. */
	room: RoomStore;
	/** Unprepared drafts expose only the workspace close action. */
	canPublish?: boolean;
}

/** Container actions shared by the desktop border and mobile actions drawer. */
export const RoomSidebarActions = observer(
	({ room, canPublish = true }: RoomSidebarActionsProps) => {
		const { t } = useTranslation("room");
		const draftSettings = useContext(DraftSettingsContext);
		const options = draftSettings?.options ?? room.options;
		const isMobileLayout = useWorkbench(
			(state) => state.layout.isMobileLayout,
		);
		const closeLabel = t("studio.closeWorkspace");
		const closeButton = (
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				aria-label={closeLabel}
				onClick={() => room.closeSidebar()}
			>
				<XIcon aria-hidden="true" />
			</Button>
		);

		return (
			<>
				{canPublish && (
					<SaveWorkspaceDialog
						systemPrompt={options.instructions}
						mcps={options.mcp}
					/>
				)}
				<Tooltip disableHoverableContent={false}>
					<TooltipTrigger asChild>
						{isMobileLayout ? (
							<DrawerClose asChild>{closeButton}</DrawerClose>
						) : (
							closeButton
						)}
					</TooltipTrigger>
					<TooltipContent>{closeLabel}</TooltipContent>
				</Tooltip>
			</>
		);
	},
);
