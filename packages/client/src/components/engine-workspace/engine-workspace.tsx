import {
	FileIcon,
	FolderTreeIcon,
	MonitorXIcon,
	TvMinimalIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useRef, useState } from "react";
import { FlexLayout } from "@semoss/shared";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { EngineFileEditor } from "./engine-file-editor";
import { EngineFileExplorer } from "./engine-file-explorer";
import { EngineMcpEditor } from "./engine-mcp-editor";

const DEFAULT_BORDER_SIZE = 300;

interface EngineWorkspaceProps {
	/** Engine to render */
	engine: string;
}

export const EngineWorkspace: React.FC<EngineWorkspaceProps> = observer(
	({ engine }) => {
		const layoutRef = useRef<FlexLayout.Layout | null>(null);
		const [isMaximized, setIsMaximized] = useState(false);

		const model = useMemo(() => {
			return FlexLayout.Model.fromJson({
				global: {},
				borders: [
					{
						type: "border",
						location: "left",
						size: DEFAULT_BORDER_SIZE,
						selected: 0,
						children: [
							{
								type: "tab",
								id: "ENGINE_FILE_EXPLORER",
								name: "File Explorer",
								component: "engine-file-explorer",
								config: {},
								helpText: "File Explorer",
								enableClose: false,
							},
						],
					},
				],
				layout: {
					type: "row",
					weight: 0,
					children: [],
				},
			});
		}, []);

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
								onRenderTab={(node, renderValues) => {
									const component = node.getComponent();
									if (component === "engine-file-explorer") {
										renderValues.leading = (
											<FolderTreeIcon className="size-4" />
										);
									} else if (
										component === "engine-file-editor"
									) {
										renderValues.leading = (
											<FileIcon className="size-4" />
										);
									}
								}}
								factory={(node) => {
									const component = node.getComponent();
									if (component === "engine-file-explorer") {
										return (
											<EngineFileExplorer
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
