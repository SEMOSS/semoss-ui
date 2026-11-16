import {
	MonitorXIcon,
	PanelRightIcon,
	TvMinimalIcon,
	XIcon,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { getToolAppId } from "../mcp/mcp-utils";
import { ToolsView } from "../mcp/tools-view";
import type { ResponseMessageStore } from "../messages/response-message.store";
import type { ToolStore } from "../messages/tool.store";
import { useTool } from "../messages/use-tool";
import type { RoomStore } from "../room/room.store";

interface RoomInlineToolProps {
	/** Room to render */
	room: RoomStore;

	/** Message to render */
	message: ResponseMessageStore;

	/** Tool to render */
	tool: ToolStore;
}

export const RoomInlineTool = ({
	room,
	message,
	tool,
}: RoomInlineToolProps) => {
	const { t } = useTranslation("room");
	const { isExpanded, app, toolId } = useTool(tool, (current) => ({
		isExpanded: current.isExpanded,
		app: getToolAppId(current.json._meta),
		toolId: current.json.id,
	}));

	return (
		<div className="relative h-[60vh] w-full overflow-hidden">
			{/* Backdrop for maximized state */}
			<div
				className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 ${
					isExpanded
						? "pointer-events-auto opacity-100"
						: "pointer-events-none hidden opacity-0"
				}`}
			/>

			<div
				className={`flex flex-col overflow-hidden rounded-lg border border-border bg-secondary-background shadow-sm transition-all duration-200 ease-in-out ${isExpanded ? "fixed inset-4 z-50" : "h-full w-full"}`}
			>
				{isExpanded && (
					<div className="flex h-12.5 w-full flex-row items-center justify-end gap-1.5 overflow-hidden border-b border-b-input pe-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									type="button"
									size="icon-sm"
									variant="ghost"
									onClick={(e) => {
										e.stopPropagation();

										// turn off maximized state
										tool.setIsExpanded(false);

										// open the tool
										tool.openTool("sidebar");
									}}
								>
									<PanelRightIcon className="rtl:-scale-x-100" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{t("inlineTool.openInSidebar")}
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon-sm"
									onClick={() => {
										tool.setIsExpanded(!isExpanded);
									}}
								>
									{isExpanded ? (
										<MonitorXIcon />
									) : (
										<TvMinimalIcon />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{isExpanded
									? t("inlineTool.minimize")
									: t("inlineTool.maximize")}
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
										// close the tool (also resets isExpanded via store)
										tool.closeTool();
									}}
								>
									<XIcon />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{t("inlineTool.close")}
							</TooltipContent>
						</Tooltip>
					</div>
				)}
				<div className="w-full flex-1 overflow-hidden">
					<ToolsView
						room={room}
						app={app}
						message={message.id}
						toolId={toolId}
					/>
				</div>
			</div>
		</div>
	);
};
