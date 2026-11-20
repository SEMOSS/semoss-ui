import type { DragEvent, ReactNode } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	type WorkbenchPanelParams,
	type WorkbenchPanelType,
	writeSpawnDragSpec,
} from "@semoss/workbench";
import { HeaderIconButton } from "../../room/header/header-icon-button";
import { useWorkbench } from "./use-workbench";

/** Props for {@link RailItem}. */
export interface RailItemProps {
	/** Its name, on hover and as its accessible name. */
	label: string;
	/** Its icon, sized by the rail. */
	icon: ReactNode;
	/** Opens its panel. */
	onOpen: () => void;
	/** Whether it cannot open yet. */
	isDisabled?: boolean;
	/** Whether it waits on a new chat preparing its room. */
	isLoading?: boolean;
	/**
	 * The panel a drag onto the dock opens; without it, the icon does not
	 * drag.
	 */
	panel?: { type: WorkbenchPanelType; config: WorkbenchPanelParams };
}

/**
 * One icon on the Workspace's rail, with its label on hover. It is also a
 * drag source: dropping it on the dock opens a new view of its panel where it
 * lands (`writeSpawnDragSpec`). A new chat's icons do not drag: its panels
 * have to prepare the draft's room first, which only a click does.
 */
export const RailItem = ({
	label,
	icon,
	onOpen,
	isDisabled = false,
	isLoading = false,
	panel,
}: RailItemProps) => {
	const { t } = useTranslation("room");
	const { isNewChat, side } = useWorkbench();
	const isDraggable = Boolean(panel) && !isNewChat && !isDisabled;
	/** Hands the dock the panel a dropped icon spawns. */
	const handleDragStart = (event: DragEvent<HTMLElement>): void => {
		if (!panel) return;
		// the dock asks for `copy` on a spawn drop; anything the source does
		// not allow resolves the drag to "none" and never fires `drop`
		event.dataTransfer.effectAllowed = "copy";
		writeSpawnDragSpec(event.dataTransfer, {
			type: panel.type,
			config: panel.config,
			name: label,
		});
	};

	return (
		<HeaderIconButton
			label={isLoading ? t("studio.preparingWorkspace") : label}
			tooltipSide={side}
			disabled={isDisabled}
			draggable={isDraggable}
			onDragStart={isDraggable ? handleDragStart : undefined}
			onClick={onOpen}
		>
			{icon}
		</HeaderIconButton>
	);
};
