import { MonitorXIcon, TvMinimalIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { Workbench, WorkbenchProvider } from "@semoss/workbench";
import { RoomProvider } from "@/contexts";
import { ROOM_SIDEBAR_LAYOUT, type RoomStore } from "@/stores";
import { ROOM_PANEL_COMPONENTS } from "./panels";

interface RoomSidebarProps {
	/** Room to render */
	room: RoomStore;
}

/**
 * The room's right-hand panel: a workbench dock holding tools, subagents, the
 * room's configuration and activity log, and the shared file panels.
 *
 * Close and maximize sit in this header rather than in the dock's tab strip —
 * they act on the sidebar container, not on any panel. The one control that
 * genuinely belongs to a panel, "open inline", is registered by the tool panel
 * itself.
 *
 * The dock store belongs to the room, not to this component: panels are opened
 * while the sidebar is closed, and this whole subtree unmounts when it is.
 */
export const RoomSidebar: React.FC<RoomSidebarProps> = observer(({ room }) => {
	const { t } = useTranslation("sidebar");
	const isMaximized = room.sidebar.isMaximized;

	return (
		<div className="relative h-full w-full overflow-hidden">
			<div
				className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 ${
					isMaximized
						? "pointer-events-auto opacity-100"
						: "pointer-events-none hidden opacity-0"
				}`}
			/>
			<div
				className={`flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-all duration-200 ease-in-out ${isMaximized ? "fixed inset-4 z-50" : "h-full w-full"}`}
			>
				<div className="flex flex-none items-center justify-end gap-1 px-1 py-1">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={
									isMaximized
										? t("actions.minimize")
										: t("actions.maximize")
								}
								onClick={() =>
									room.setSidebarMaximized(!isMaximized)
								}
							>
								{isMaximized ? (
									<MonitorXIcon />
								) : (
									<TvMinimalIcon />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{isMaximized
								? t("actions.minimize")
								: t("actions.maximize")}
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={t("actions.close")}
								onClick={() => room.closeSidebar()}
							>
								<XIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t("actions.close")}</TooltipContent>
					</Tooltip>
				</div>
				<div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-md">
					<RoomProvider room={room}>
						<WorkbenchProvider store={room.workbench}>
							<Workbench
								components={ROOM_PANEL_COMPONENTS}
								layout={ROOM_SIDEBAR_LAYOUT}
							/>
						</WorkbenchProvider>
					</RoomProvider>
				</div>
			</div>
		</div>
	);
});
