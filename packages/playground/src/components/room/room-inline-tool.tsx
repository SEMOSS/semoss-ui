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
import type { ResponseMessageStore, RoomStore } from "@/stores";
import { ToolsView } from "../mcp";

interface RoomInlineToolProps {
	/** Room to render */
	room: RoomStore;

	/** Message to render */
	message: ResponseMessageStore;

	/** Tool to render */
	tool: ResponseMessageStore["tools"][number];
}

export const RoomInlineTool: React.FC<RoomInlineToolProps> = observer(
	({ room, message, tool }) => {
		const [isMaximized, setIsMaximized] = useState(false);

		/**
		 * Constants
		 */
		const nodeId = `message-${message.id}-tool-${tool.id}`;

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
									size="sm"
									variant="ghost"
									className="invisible group-hover/toolcard:visible"
									onClick={(e) => {
										e.stopPropagation();

										// remove from inline
										room.removeInlineTool(nodeId);

										// add to sidebar
										room.addSidebarNode(nodeId, {
											type: "tab",
											name: tool.title,
											component: "room-tool",
											config: {
												app: tool._meta.SMSS_PROJECT_ID,
												tool: {
													message: message.id,
													id: tool.id,
													name: tool.name,
													title: tool.title,
													parameters: tool.parameters,
												},
											},
											enableClose: true,
										});
									}}
								>
									<PanelRightIcon className="size-4" />
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
								{isMaximized
									? "Minimize Tool"
									: "Maximize Tool"}
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
										room.removeInlineTool(nodeId);
									}}
								>
									<XIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Close Sidebar</TooltipContent>
						</Tooltip>
					</div>
					<div className="w-full flex-1 overflow-hidden">
						<ToolsView
							room={room}
							app={tool._meta.SMSS_PROJECT_ID}
							tool={{
								message: message.id,
								id: tool.id,
								name: tool.name,
								parameters: tool.parameters,
							}}
						/>
					</div>
				</div>
			</div>
		);
	},
);
