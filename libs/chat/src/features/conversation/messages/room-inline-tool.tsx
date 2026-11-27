import {
	MonitorXIcon,
	PanelRightIcon,
	TvMinimalIcon,
	XIcon,
} from "lucide-react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	cn,
	Separator,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { ResponseMessageStore } from "../../room/store/response-message.store";
import type { RoomStore } from "../../room/store/room.store";
import type { ToolStore } from "../../room/store/tool.store";
import { useTool } from "../../room/store/use-tool";
import { getToolAppId } from "../../tools/mcp/mcp-utils";
import { ToolsView } from "../../tools/views/tools-view";
import { TooltipButton } from "../tooltip-button";

/** Props for {@link RoomInlineTool}. */
interface RoomInlineToolProps {
	/** The room the tool call belongs to. */
	room: RoomStore;

	/** The response that made the call. */
	message: ResponseMessageStore;

	/** The tool call to show. */
	tool: ToolStore;

	/**
	 * How it sits in the conversation: a pending decision fills a box under
	 * its row, an open call is a panel of its own. Only the styling changes,
	 * so a framed page keeps its state when its call is decided.
	 */
	variant?: "decision" | "open";
}

/**
 * A tool call's view opened inline in the conversation. Maximized, it covers
 * the page with controls to move it to the Workspace, restore it, or close it.
 */
export const RoomInlineTool = ({
	room,
	message,
	tool,
	variant = "open",
}: RoomInlineToolProps) => {
	const { t } = useTranslation("room");
	const { isExpanded, app, toolId } = useTool(tool, (current) => ({
		isExpanded: current.isExpanded,
		app: getToolAppId(current.json._meta),
		toolId: current.json.id,
	}));
	const isPanel = isExpanded || variant === "open";

	return (
		<div
			className={cn(
				"relative w-full overflow-hidden",
				variant === "decision" ? "h-80" : "h-[60vh]",
			)}
		>
			{/* Backdrop for maximized state */}
			<div
				className={cn(
					"fixed inset-0 z-50 bg-black/50 transition-opacity duration-200",
					isExpanded
						? "pointer-events-auto opacity-100"
						: "pointer-events-none hidden opacity-0",
				)}
			/>

			<div
				className={cn(
					"flex flex-col overflow-hidden transition-all duration-200 ease-in-out",
					isPanel &&
						"rounded-lg border border-border bg-secondary-background shadow-sm",
					isExpanded ? "fixed inset-4 z-50" : "h-full w-full",
				)}
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
						<TooltipButton
							variant="ghost"
							size="icon-sm"
							onClick={() => {
								tool.setIsExpanded(!isExpanded);
							}}
							tooltip={
								isExpanded
									? t("inlineTool.minimize")
									: t("inlineTool.maximize")
							}
						>
							{isExpanded ? <MonitorXIcon /> : <TvMinimalIcon />}
						</TooltipButton>
						<Separator
							orientation="vertical"
							style={{ height: "17px" }}
						/>

						<TooltipButton
							variant="ghost"
							size="icon-sm"
							onClick={() => {
								// close the tool (also resets isExpanded via store)
								tool.closeTool();
							}}
							tooltip={t("inlineTool.close")}
						>
							<XIcon />
						</TooltipButton>
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
