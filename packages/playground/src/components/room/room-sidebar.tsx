import {
	FolderTreeIcon,
	HammerIcon,
	MonitorXIcon,
	PanelBottomIcon,
	Settings2Icon,
	TvMinimalIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import {
	FlexLayout,
	getFileIconComponent,
	useTabBarScroll,
} from "@semoss/shared";

const getFileTabIcon = (fileName: string) => {
	const Icon = getFileIconComponent(fileName);
	return <Icon className="size-4 text-foreground" />;
};

import {
	Button,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { RoomStore } from "@/stores";
import { RoomAuditLogReport } from "./room-audit-log-report";
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
	const insight = useInsight();
	const layoutRef = useRef<FlexLayout.Layout | null>(null);
	const sidebarRef = useRef<HTMLDivElement | null>(null);
	const controlsRef = useRef<HTMLDivElement | null>(null);
	const [isMaximized, setIsMaximized] = useState(false);
	const [controlsWidth, setControlsWidth] = useState(85);
	const [explorerRefreshKey, setExplorerRefreshKey] = useState(0);
	const [pendingRename, setPendingRename] = useState<{
		id: string;
		newName: string;
		path: string;
	} | null>(null);

	useEffect(() => {
		if (!pendingRename) return;
		const { id, newName, path } = pendingRename;
		const dir = path.substring(0, path.lastIndexOf("/") + 1);
		const newPath = `${dir}${newName}`;
		(async () => {
			try {
				await insight.actions.run(
					`RenameInsightAsset(filePath=["${path}"], newValue=["${newPath}"]);`,
				);
				room.removeSidebarNode(id);
				room.addSidebarNode(`FILE--${newPath}`, {
					type: "tab",
					name: newName,
					component: "room-file-editor",
					config: { name: newName, path: newPath },
					enableClose: true,
				});
				setExplorerRefreshKey((k) => k + 1);
			} catch (e) {
				console.error(e);
			} finally {
				setPendingRename(null);
			}
		})();
	}, [pendingRename, insight.actions.run, room]);

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

	useTabBarScroll(sidebarRef);

	useEffect(() => {
		const container = sidebarRef.current;
		if (!container) return;
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const added of Array.from(mutation.addedNodes)) {
					if (!(added instanceof HTMLElement)) continue;
					const input = added.classList.contains(
						"flexlayout__tab_button_textbox",
					)
						? (added as HTMLInputElement)
						: (added.querySelector(
								".flexlayout__tab_button_textbox",
							) as HTMLInputElement | null);
					if (!input) continue;
					requestAnimationFrame(() => {
						const dot = input.value.lastIndexOf(".");
						input.setSelectionRange(
							0,
							dot > 0 ? dot : input.value.length,
						);
					});
					return;
				}
			}
		});
		observer.observe(container, { childList: true, subtree: true });
		return () => observer.disconnect();
	}, []);

	/**
	 * Keep tab-strip spacing in sync with the top-right controls width so tabs never hide behind overlay buttons.
	 */
	useEffect(() => {
		const controls = controlsRef.current;
		if (!controls) {
			return;
		}

		const updateControlsWidth = () => {
			const measuredWidth = Math.ceil(
				controls.getBoundingClientRect().width,
			);
			const nextWidth = Math.max(85, measuredWidth + 8);
			setControlsWidth((prev) => (prev === nextWidth ? prev : nextWidth));
		};

		updateControlsWidth();

		if (typeof ResizeObserver === "undefined") {
			return;
		}

		const resizeObserver = new ResizeObserver(() => {
			updateControlsWidth();
		});
		resizeObserver.observe(controls);

		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	return (
		<div
			ref={sidebarRef}
			className="relative h-full w-full overflow-hidden"
		>
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
				<div
					ref={controlsRef}
					className="absolute end-0 top-0 z-10 flex h-12.5 flex-row items-center gap-1.5 overflow-hidden pe-2"
				>
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
					<div
						className="flexlayout__theme_smss relative h-full w-full overflow-hidden"
						style={
							{
								"--room-sidebar-controls-width": `${controlsWidth}px`,
							} as CSSProperties
						}
					>
						<FlexLayout.Layout
							ref={layoutRef}
							model={room.sidebar.model}
							onRenderTab={(node, renderValues) => {
								const component = node.getComponent();
								if (component === "room-tool") {
									renderValues.leading = (
										<HammerIcon className="size-4 text-foreground" />
									);
								} else if (component === "room-configuration") {
									renderValues.leading = (
										<Settings2Icon className="size-4 text-foreground" />
									);
								} else if (component === "room-file-explorer") {
									renderValues.leading = (
										<FolderTreeIcon className="size-4 text-foreground" />
									);
								} else if (component === "room-file-editor") {
									renderValues.leading = getFileTabIcon(
										node.getName(),
									);
								}
							}}
							onAction={(action) => {
								if (
									action.type ===
									FlexLayout.Actions.RENAME_TAB
								) {
									const { node: id, text } = action.data as {
										node: string;
										text: string;
									};
									const tabNode =
										room.sidebar.model.getNodeById(id);
									if (
										tabNode instanceof FlexLayout.TabNode &&
										tabNode.getComponent() ===
											"room-file-editor"
									) {
										const cfg = tabNode.getConfig() as {
											path?: string;
										};
										if (cfg?.path) {
											setPendingRename({
												id,
												newName: text,
												path: cfg.path,
											});
											return undefined;
										}
									}
								}
								return action;
							}}
							factory={(node) => {
								const component = node.getComponent();

								if (component === "room-tool") {
									return <RoomTool node={node} room={room} />;
								} else if (component === "room-file-explorer") {
									return (
										<RoomFileExplorer
											key={explorerRefreshKey}
											layout={layoutRef.current}
											room={room}
											node={node}
										/>
									);
								} else if (component === "room-configuration") {
									return <RoomConfiguration room={room} />;
								} else if (component === "audit-log-report") {
									return <RoomAuditLogReport room={room} />;
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
									<XIcon className="size-4 text-foreground" />
								),
							}}
						/>
					</div>
				</div>
			</div>
		</div>
	);
});
