import {
	FileIcon,
	FolderTreeIcon,
	HammerIcon,
	MonitorXIcon,
	PanelBottomIcon,
	Settings2Icon,
	TvMinimalIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { FlexLayout } from "@semoss/shared";
import {
	Button,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
import { RoomConfiguration } from "./room-configuration";
import { RoomFileEditor } from "./room-file-editor";
import { RoomFileExplorer } from "./room-file-explorer";
import { RoomTool } from "./room-tool";

interface RoomSidebarProps {
	/** Room to render */
	room: RoomStore;
}

export const RoomSidebar: React.FC<RoomSidebarProps> = observer(({ room }) => {
	const { t } = useTranslation("sidebar");
	const layoutRef = useRef<FlexLayout.Layout | null>(null);
	const [isMaximized, setIsMaximized] = useState(false);

	// this will render the component whenever the sidebar model changes
	room.sidebar.counter;

	// get the node and do a type check
	let activeNode: FlexLayout.TabNode | null = null;
	const node = room.sidebar.model.getActiveTabset()?.getSelectedNode();
	if (node instanceof FlexLayout.TabNode) {
		activeNode = node;
	}

	let activeTool = null;
	if (activeNode) {
		if (activeNode.getComponent() === "room-tool") {
			activeTool = room.getToolByNodeId(activeNode.getId());
		}
	}

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
				<div className="absolute top-0 right-0 z-10 flex h-12.5 flex-row items-center gap-1.5 overflow-hidden pr-2">
					{activeTool && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									size="icon-sm"
									variant="ghost"
									onClick={(e) => {
										e.stopPropagation();

										if (!activeTool) {
											return;
										}

										// turn off maximized state
										setIsMaximized(false);

										// add to inline
										activeTool.openTool("inline");
									}}
								>
									<PanelBottomIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{t("actions.openInline")}
							</TooltipContent>
						</Tooltip>
					)}

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => {
									setIsMaximized(!isMaximized);
								}}
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
					<Separator
						orientation="vertical"
						style={{ height: "17px" }}
					/>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => {
									// turn off maximized state
									setIsMaximized(false);

									// close sidebar
									room.closeSidebar();
								}}
							>
								<XIcon />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t("actions.close")}</TooltipContent>
					</Tooltip>
				</div>
				<div className="w-full flex-1 overflow-hidden rounded-md">
					<div className="flexlayout__theme_smss relative h-full w-full overflow-hidden">
						<FlexLayout.Layout
							ref={layoutRef}
							model={room.sidebar.model}
							onRenderTab={(node, renderValues) => {
								const component = node.getComponent();
								const iconStyle = {
									color: "var(--foreground)",
								};
								if (component === "room-tool") {
									renderValues.leading = (
										<HammerIcon
											className="size-4"
											style={iconStyle}
										/>
									);
								} else if (component === "room-configuration") {
									renderValues.leading = (
										<Settings2Icon
											className="size-4"
											style={iconStyle}
										/>
									);
								} else if (component === "room-file-explorer") {
									renderValues.leading = (
										<FolderTreeIcon
											className="size-4"
											style={iconStyle}
										/>
									);
								} else if (component === "room-file-editor") {
									renderValues.leading = (
										<FileIcon
											className="size-4"
											style={iconStyle}
										/>
									);
								}
								renderValues.content = (
									<span className="text-foreground">
										{node.getName()}
									</span>
								);
							}}
							factory={(node) => {
								const component = node.getComponent();

								if (component === "room-tool") {
									return <RoomTool node={node} room={room} />;
								} else if (component === "room-file-explorer") {
									return (
										<RoomFileExplorer
											layout={layoutRef.current}
											room={room}
										/>
									);
								} else if (component === "room-configuration") {
									return <RoomConfiguration room={room} />;
								} else if (component === "room-file-editor") {
									return (
										<RoomFileEditor
											node={node}
											room={room}
										/>
									);
								}

								return null;
							}}
							icons={{
								close: (
									<XIcon
										className="size-4"
										style={{ color: "var(--foreground)" }}
									/>
								),
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
});
