import {
	FileIcon,
	FolderTreeIcon,
	MonitorXIcon,
	TvMinimalIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { FlexLayout, getFileIconComponent } from "@semoss/shared";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useTabBarScroll } from "@/hooks";
import { EngineFileEditor } from "./engine-file-editor";
import { EngineFileExplorer } from "./engine-file-explorer";
import { EngineMcpEditor } from "./engine-mcp-editor";

const getFileTabIcon = (fileName: string) => {
	const Icon = getFileIconComponent(fileName);
	return <Icon className="size-4" />;
};

interface EngineWorkspaceProps {
	/** Engine to render */
	engine: string;

	/** Model */
	model: FlexLayout.Model;
}

export const EngineWorkspace: React.FC<EngineWorkspaceProps> = observer(
	({ engine, model }) => {
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
						`RenameEngineAsset(engine=["${engine}"], filePath=["${path}"], newValue=["${newPath}"]);`,
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
								component: "engine-file-editor",
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
		}, [pendingRename, engine, model, insight.actions.run]);

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

		useTabBarScroll(containerRef);

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
									if (component === "engine-file-explorer") {
										renderValues.leading = (
											<FolderTreeIcon className="size-4" />
										);
									} else if (
										component === "engine-file-editor"
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
												"engine-file-editor"
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
									if (component === "engine-file-explorer") {
										return (
											<EngineFileExplorer
												key={explorerRefreshKey}
												layout={
													layoutRef.current || null
												}
												node={node}
												engine={engine}
											/>
										);
									} else if (
										component === "engine-file-editor"
									) {
										return (
											<EngineFileEditor
												node={node}
												engine={engine}
											/>
										);
									} else if (
										component === "engine-mcp-editor"
									) {
										return (
											<EngineMcpEditor
												node={node}
												engine={engine}
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
