import { SettingsIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import type { DragEvent } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Separator,
} from "@semoss/ui/next";
import { writeSpawnDragSpec } from "@semoss/workbench";
import { HeaderIconButton } from "@/features/room-header/header-icon-button";
import type { RoomStore } from "@/stores/room/room.store";
import { useRoomActionItems } from "../room-actions/use-room-action-items";
import {
	type NewRoomWorkbenchPanels,
	useWorkbenchPanels,
	type WorkbenchPanelOption,
} from "./use-workbench-panels";
import { WorkbenchPanelIcon } from "./workbench-panel-icon";

interface RoomWorkbenchRailProps {
	/** The room whose Workspace the rail opens panels in. */
	room: RoomStore;
	/** A new chat's own panel actions, which prepare its room, until its first message. */
	newRoomPanels?: NewRoomWorkbenchPanels;
	/** Which way a label or menu opens: into the dock, or below the mobile toolbar. */
	side: "right" | "bottom";
}

/**
 * The Workspace's rail, on the dock's left edge: the room's cog menu, then one
 * icon per panel the room can open — Files, Settings, the activity log, and
 * each connector viewer the chat can show — with its label on hover.
 *
 * It is the host's own chrome in a border slot, not a set of docked panels:
 * the dock's own rails carry no panels at all, so everything opens in the main
 * tab area. A click goes through the option's `onOpen` → `selectPanel`, which
 * selects the panel when it is already open anywhere in the dock and adds a
 * tab beside the others when it is not.
 *
 * An icon is also a drag source: dropping one on the dock opens it where it
 * lands (`writeSpawnDragSpec`, resolved by the shell's drag layer), so a panel
 * can be dropped into the centre, or beside another as a split. A drag always
 * spawns a *new* view — that is the dock's contract for a drag, and what makes
 * dropping Files beside an open Files useful. A new chat's rail does not drag:
 * its panels have to prepare the draft's room first, which only `onOpen` does.
 */
export const RoomWorkbenchRail = observer(
	({ room, newRoomPanels, side }: RoomWorkbenchRailProps) => {
		const { t } = useTranslation(["room", "sidebar"]);
		const items = useRoomActionItems().filter(
			(item) => item.id !== "rename",
		);

		const panels = useWorkbenchPanels(room, newRoomPanels);
		const handleDragStart = (
			event: DragEvent<HTMLElement>,
			panel: WorkbenchPanelOption,
		): void => {
			// the dock asks for `copy` on a spawn drop; anything the source does
			// not allow resolves the drag to "none" and never fires `drop`
			event.dataTransfer.effectAllowed = "copy";
			writeSpawnDragSpec(event.dataTransfer, {
				type: panel.panelType,
				config: panel.panelConfig,
				name: panel.label,
			});
		};

		return (
			<>
				{items.length > 0 && (
					<>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<HeaderIconButton
									label={t("sidebar:actions.roomActions")}
									tooltipSide={side}
								>
									<SettingsIcon
										aria-hidden="true"
										className="size-4"
									/>
								</HeaderIconButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								side={side}
								align="start"
								className="w-56"
							>
								{items.map((item) => (
									<DropdownMenuItem
										key={item.id}
										variant={
											item.isDestructive
												? "destructive"
												: "default"
										}
										className="gap-2.5 max-md:min-h-11"
										onSelect={item.onSelect}
									>
										<item.icon
											aria-hidden="true"
											className={cn(
												item.isActive &&
													"fill-current text-foreground",
											)}
										/>
										{item.label}
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
						<Separator
							orientation={
								side === "bottom" ? "vertical" : "horizontal"
							}
							className={cn(
								"flex-none",
								side === "bottom" ? "mx-0.5 h-5" : "my-0.5 w-5",
							)}
						/>
					</>
				)}

				{panels.map((panel) => {
					const isDraggable = !newRoomPanels && !panel.isDisabled;
					return (
						<HeaderIconButton
							key={panel.id}
							label={
								panel.isLoading
									? t("studio.preparingWorkspace")
									: panel.label
							}
							tooltipSide={side}
							disabled={panel.isDisabled}
							draggable={isDraggable}
							onDragStart={
								isDraggable
									? (event) => handleDragStart(event, panel)
									: undefined
							}
							onClick={() => panel.onOpen()}
						>
							<WorkbenchPanelIcon
								place={panel}
								className="size-4 shrink-0"
							/>
						</HeaderIconButton>
					);
				})}
			</>
		);
	},
);
