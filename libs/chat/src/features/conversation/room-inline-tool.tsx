import {
	MonitorXIcon,
	PanelRightIcon,
	TvMinimalIcon,
	XIcon,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	getToolAppId,
	type ResponseMessageStore,
	type ToolCallStore,
} from "@semoss/sdk";
import { useToolSelector } from "@semoss/sdk/react";
import {
	Button,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { ToolsView } from "../../components/mcp/tools-view";
import type { RoomUiStore } from "../workbench/room-ui.store";

interface RoomInlineToolProps {
	/** Room to render */
	room: RoomUiStore;

	/** Message to render */
	message: ResponseMessageStore;

	/** Tool to render */
	tool: ToolCallStore;
}

export const RoomInlineTool: React.FC<RoomInlineToolProps> = ({
	room,
	message,
	tool,
}) => {
	const { t } = useTranslation("room");
	const { isExpanded, appId, toolId } = useToolSelector(
		tool,
		(call) => ({
			isExpanded: call.isExpanded,
			appId: getToolAppId(call.json._meta),
			toolId: call.json.id,
		}),
		{ isExpanded: false, appId: "", toolId: "" },
	);

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
						app={appId}
						message={message.id}
						toolId={toolId}
					/>
				</div>
			</div>
		</div>
	);
};
