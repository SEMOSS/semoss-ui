import { MonitorXIcon, TvMinimalIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	type FileExplorerHost,
	FileExplorerHostProvider,
} from "@semoss/panels";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { Workbench, WorkbenchProvider } from "@semoss/workbench";
import { RoomProvider } from "@/contexts";
import { normalizeFolderPath } from "@/features/teamwork/folders/folder-path";
import { ROOM_SIDEBAR_LAYOUT, type RoomStore } from "@/stores";

interface RoomSidebarProps {
	/** Room to render */
	room: RoomStore;
}

/**
 * The room's right-hand panel: a workbench dock holding tools, subagents, the
 * room's configuration and activity log, and the shared file panels.
 *
 * Close and maximize sit in the dock's top rail rather than in a panel's tab
 * strip — they act on the sidebar container, not on any panel. The one
 * control that genuinely belongs to a panel, "open inline", is registered by
 * the tool panel itself.
 *
 * The dock store belongs to the room, not to this component: panels are opened
 * while the sidebar is closed, and this whole subtree unmounts when it is.
 */
export const RoomSidebar: React.FC<RoomSidebarProps> = observer(({ room }) => {
	const { t } = useTranslation(["sidebar", "connectors"]);
	const isMaximized = room.sidebar.isMaximized;

	// Chat Files' right-click menu ends with Add to Context, which queues the
	// file for the next message as the connector viewers do
	const explorerHost = useMemo<FileExplorerHost>(
		() => ({
			secondaryActions: (item) =>
				item.type === "directory"
					? []
					: [
							{
								name: t("connectors:actions.addToContext"),
								placement: "end",
								action: async () => {
									room.teamwork.addContextItem({
										path: normalizeFolderPath(item.path),
										name: item.name,
									});
								},
							},
						],
		}),
		[room, t],
	);

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
				className={`flex flex-col overflow-hidden transition-all duration-200 ease-in-out ${isMaximized ? "fixed inset-4 z-50 rounded-lg border border-border bg-background shadow-sm" : "h-full w-full"}`}
			>
				<RoomProvider room={room}>
					<WorkbenchProvider store={room.workbench}>
						<FileExplorerHostProvider host={explorerHost}>
							<Workbench
								snapshot={ROOM_SIDEBAR_LAYOUT}
								borderSlots={{
									top: {
										after: (
											<>
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="ghost"
															size="icon-sm"
															className="flex-none text-muted-foreground"
															aria-label={
																isMaximized
																	? t(
																			"actions.minimize",
																		)
																	: t(
																			"actions.maximize",
																		)
															}
															onClick={() =>
																room.setSidebarMaximized(
																	!isMaximized,
																)
															}
														>
															{isMaximized ? (
																<MonitorXIcon className="size-3.5" />
															) : (
																<TvMinimalIcon className="size-3.5" />
															)}
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														{isMaximized
															? t(
																	"actions.minimize",
																)
															: t(
																	"actions.maximize",
																)}
													</TooltipContent>
												</Tooltip>
												{isMaximized ? null : (
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant="ghost"
																size="icon-sm"
																className="flex-none text-muted-foreground"
																aria-label={t(
																	"actions.close",
																)}
																onClick={() =>
																	room.closeSidebar()
																}
															>
																<XIcon className="size-3.5" />
															</Button>
														</TooltipTrigger>
														<TooltipContent>
															{t("actions.close")}
														</TooltipContent>
													</Tooltip>
												)}
											</>
										),
									},
								}}
							/>
						</FileExplorerHostProvider>
					</WorkbenchProvider>
				</RoomProvider>
			</div>
		</div>
	);
});
