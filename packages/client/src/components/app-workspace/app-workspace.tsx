import {
	FileArchiveIcon,
	FileAudioIcon,
	FileBadgeIcon,
	FileChartPieIcon,
	FileCodeIcon,
	FileIcon,
	FileJsonIcon,
	FileSpreadsheetIcon,
	FileTerminalIcon,
	FileTextIcon,
	FileTypeIcon,
	FileVideoIcon,
	FolderTreeIcon,
	ImageIcon,
	MonitorXIcon,
	TvMinimalIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";

const getFileTabIcon = (fileName: string) => {
	const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
	if (
		["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "img"].includes(ext)
	)
		return <ImageIcon className="size-4" />;
	if (ext === "pdf") return <FileBadgeIcon className="size-4" />;
	if (["xls", "xlsx", "csv"].includes(ext))
		return <FileSpreadsheetIcon className="size-4" />;
	if (
		[
			"py",
			"js",
			"ts",
			"tsx",
			"jsx",
			"java",
			"cpp",
			"c",
			"go",
			"rs",
		].includes(ext)
	)
		return <FileCodeIcon className="size-4" />;
	if (["sh", "bash", "zsh", "bat", "ps1"].includes(ext))
		return <FileTerminalIcon className="size-4" />;
	if (ext === "json") return <FileJsonIcon className="size-4" />;
	if (["zip", "tar", "gz", "rar", "7z"].includes(ext))
		return <FileArchiveIcon className="size-4" />;
	if (["ppt", "pptx"].includes(ext))
		return <FileChartPieIcon className="size-4" />;
	if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext))
		return <FileAudioIcon className="size-4" />;
	if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext))
		return <FileVideoIcon className="size-4" />;
	if (["html", "xml", "md", "mdx", "rtf"].includes(ext))
		return <FileTypeIcon className="size-4" />;
	if (["doc", "docx", "msg", "txt"].includes(ext))
		return <FileTextIcon className="size-4" />;
	return <FileIcon className="size-4" />;
};

import { useInsight } from "@semoss/sdk/react";
import { FlexLayout } from "@semoss/shared";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { MCPJsonEditor } from "../shared";
import { AppFileEditor } from "./app-file-editor";
import { AppFileExplorer } from "./app-file-explorer";

interface AppWorkspaceProps {
	/** App to render */
	app: string;

	/** Model */
	model: FlexLayout.Model;
}

export const AppWorkspace: React.FC<AppWorkspaceProps> = observer(
	({ app, model }) => {
		const insight = useInsight();
		const layoutRef = useRef<FlexLayout.Layout | null>(null);
		const containerRef = useRef<HTMLDivElement | null>(null);
		const [isMaximized, setIsMaximized] = useState(false);
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
						`RenameAppAsset(project=["${app}"], filePath=["${path}"], newValue=["${newPath}"]);`,
					);
					const tabNode = model.getNodeById(id);
					const tabsetId =
						tabNode instanceof FlexLayout.TabNode
							? (tabNode.getParent()?.getId() ?? "")
							: (model.getActiveTabset()?.getId() ??
								model.getRoot().getChildren()[0]?.getId() ??
								"");
					model.doAction(FlexLayout.Actions.deleteTab(id));
					model.doAction(
						FlexLayout.Actions.addNode(
							{
								id: `ENGINE_FILE--${newPath}`,
								type: "tab",
								name: newName,
								component: "app-file-editor",
								config: { name: newName, path: newPath },
								enableClose: true,
							},
							tabsetId,
							FlexLayout.DockLocation.CENTER,
							-1,
							true,
						),
					);
					setExplorerRefreshKey((k) => k + 1);
				} catch (e) {
					console.error(e);
				} finally {
					setPendingRename(null);
				}
			})();
		}, [pendingRename, app, model, insight.actions.run]);

		useEffect(() => {
			const container = containerRef.current;
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

		useEffect(() => {
			const container = containerRef.current;
			if (!container) return;
			const onWheel = (e: WheelEvent) => {
				if (!(e.target instanceof Element)) return;
				const tabBar = e.target.closest(
					".flexlayout__tabset_tabbar_inner",
				) as HTMLElement | null;
				if (!tabBar || !container.contains(tabBar)) return;
				if (tabBar.scrollWidth <= tabBar.clientWidth) return;
				const delta =
					Math.abs(e.deltaX) > Math.abs(e.deltaY)
						? e.deltaX
						: e.deltaY;
				if (delta === 0) return;
				tabBar.scrollLeft += delta;
				e.preventDefault();
				e.stopPropagation();
			};
			container.addEventListener("wheel", onWheel, {
				capture: true,
				passive: false,
			});
			return () => container.removeEventListener("wheel", onWheel, true);
		}, []);

		return (
			<div
				ref={containerRef}
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
					className={`flex flex-col overflow-hidden rounded-lg border border-border bg-secondary-background shadow-sm transition-all duration-200 ease-in-out ${isMaximized ? "fixed inset-4 z-50" : "h-full w-full"}`}
				>
					<div className="absolute top-0 right-0 z-10 flex h-12.5 flex-row items-center gap-1.5 overflow-hidden pr-2">
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
									? "Minimize Sidebar"
									: "Maximize Sidebar"}
							</TooltipContent>
						</Tooltip>
					</div>
					<div className="w-full flex-1 overflow-hidden rounded-md">
						<div className="flexlayout__theme_smss relative h-full w-full overflow-hidden">
							<FlexLayout.Layout
								ref={layoutRef}
								model={model}
								onTabSetPlaceHolder={() => (
									<div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
										<FileIcon className="size-8 opacity-30" />
										<p className="font-medium text-sm">
											File Viewer
										</p>
										<p className="text-xs opacity-70">
											Select a file from the explorer to
											view
										</p>
									</div>
								)}
								onRenderTab={(node, renderValues) => {
									const component = node.getComponent();
									if (component === "app-file-explorer") {
										renderValues.leading = (
											<FolderTreeIcon className="size-4" />
										);
									} else if (
										component === "app-file-editor"
									) {
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
										const { node: id, text } =
											action.data as {
												node: string;
												text: string;
											};
										const tabNode = model.getNodeById(id);
										if (
											tabNode instanceof
												FlexLayout.TabNode &&
											tabNode.getComponent() ===
												"app-file-editor"
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
									if (component === "app-file-explorer") {
										return (
											<AppFileExplorer
												key={explorerRefreshKey}
												layout={
													layoutRef.current || null
												}
												node={node}
												app={app}
											/>
										);
									} else if (
										component === "app-file-editor"
									) {
										return (
											<AppFileEditor
												node={node}
												app={app}
											/>
										);
									} else if (component === "mcpJsonEditor") {
										const config = node.getConfig() as {
											data: React.ComponentProps<
												typeof MCPJsonEditor
											>["dataMap"];
										};
										return (
											<MCPJsonEditor
												dataMap={{
													...config.data,
													onSave: async (data, path) => {
														try {
															await insight.actions.run(
																`SaveAppAssets(project=["${app}"], filePath=["${path}"], content=["<encode>${JSON.stringify(data, null, 2)}</encode>"]);`,
															);
															toast.success("Tool saved successfully");
														} catch (e) {
															toast.error(`Failed to save Tool: ${e}`);
														}
													},
													resourceId: app,
												}}
											/>
										);
									}

									return null;
								}}
								icons={{
									close: <XIcon className="size-4" />,
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	},
);
