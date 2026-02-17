import {
	MonitorXIcon,
	PanelRightIcon,
	TvMinimalIcon,
	XIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import {
	Button,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { ResponseMessageStore, RoomStore, ToolStore } from "@/stores";
import { ToolsView } from "../mcp";

interface RoomInlineToolProps {
	/** Room to render */
	room: RoomStore;

	/** Message to render */
	message: ResponseMessageStore;

	/** Tool to render */
	tool: ToolStore;
}

export const RoomInlineTool: React.FC<RoomInlineToolProps> = observer(
	({ room, message, tool }) => {
		const [isMaximized, setIsMaximized] = useState(false);

		return (
			<div className="relative h-[60vh] w-full overflow-hidden">
				{/* Backdrop for maximized state */}
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
					<div className="flex h-12.5 w-full flex-row items-center justify-end gap-1.5 overflow-hidden border-b border-b-input pr-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									size="icon-sm"
									variant="ghost"
									onClick={(e) => {
										e.stopPropagation();

										// turn off maximized state
										setIsMaximized(false);

										// open the tool
										tool.openTool("sidebar");
									}}
								>
									<PanelRightIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Open in Sidebar</TooltipContent>
						</Tooltip>
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
								{isMaximized ? "Minimize" : "Maximize"}
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
										// turn off maximized state when closing sidebar
										setIsMaximized(false);

										// close the tool
										tool.closeTool();
									}}
								>
									<XIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Close</TooltipContent>
						</Tooltip>
					</div>
					<div className="w-full flex-1 overflow-hidden">
						<ToolsView
							room={room}
							app={tool.json._meta.SMSS_PROJECT_ID}
							message={message.id}
							tool={tool.json}
							toolResponse={
								tool.status === "SUCCESS"
									? tool.response
									: undefined
							}
							toolParameters={tool.parameters}
						/>
					</div>
				</div>
			</div>
		);
	},
);
