import {
	FileIcon,
	FolderTreeIcon,
	MonitorXIcon,
	TvMinimalIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useRef, useState } from "react";
import { FlexLayout } from "@semoss/shared";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
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
		const layoutRef = useRef<FlexLayout.Layout | null>(null);
		const [isMaximized, setIsMaximized] = useState(false);

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
										renderValues.leading = (
											<FileIcon className="size-4" />
										);
									}
								}}
								factory={(node) => {
									const component = node.getComponent();
									if (component === "app-file-explorer") {
										return (
											<AppFileExplorer
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
												dataMap={config.data}
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
