import {
	CheckIcon,
	ChevronDownIcon,
	HammerIcon,
	PanelRightIcon,
	XCircleIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useLoadingMessage, useToolView } from "@semoss/shared";
import {
	Button,
	cn,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useIsMobile,
} from "@semoss/ui/next";
import { ROOM_PANEL_TYPES } from "../../room/store/room-sidebar";
import { useRoomSelector } from "../../room/store/use-room-selector";
import {
	isChatToolCall,
	isFolderToolCall,
} from "../../tools/default-tools/chat-tool-kind";
import { getToolAppId, isAskExecutionMode } from "../../tools/mcp/mcp-utils";
import { ChatToolCard } from "../../tools/settings/chat-tool-card";
import { ComponentToolView } from "../../tools/views/component-tool-view";
import { ToolsView } from "../../tools/views/tools-view";
import { useSidebarPanelActive } from "../../workbench/rail/use-sidebar-panel-active";
import { decideAgentToolAction } from "../store/agent-harness";
import type { ToolStore } from "../store/tool.store";
import { ResponseMessageToolMenu } from "./response-message-tool-menu";
import { ResponseMessageToolStreaming } from "./response-message-tool-streaming";
import { RoomInlineTool } from "./room-inline-tool";

/** Props for {@link ResponseMessageTool}. */
interface ResponseMessageToolProps {
	/** Tool activity to display and open. */
	tool: ToolStore;
	/** Frame pending decisions when they are shown inline. */
	isLarge?: boolean;
}

/** A compact tool row with its status and actions always available. */
export const ResponseMessageTool = ({
	tool,
	isLarge,
}: ResponseMessageToolProps) => {
	const { t } = useTranslation("tool");
	const { room } = tool;
	const isMobile = useIsMobile();
	const [isCancelling, setIsCancelling] = useState(false);
	const [isDecisionCollapsed, setIsDecisionCollapsed] = useState(false);
	const isSidebarActive = useSidebarPanelActive(room, ROOM_PANEL_TYPES.TOOL, {
		toolId: tool.id,
	});
	// the call's json reads the room's options too, and its cancel the
	// run mode; a decorated call's json is a new object on every read, so
	// select its values
	const {
		resourceURI,
		loadingMessageText,
		autoOpen,
		execution,
		isFolder,
		isChatTool,
		appId,
		jsonId,
		isResolved,
		display,
		isOpen,
		message,
		hasPendingAction,
		toolStatus,
		displayName,
		isAgentRoom,
	} = useRoomSelector(room, (current) => {
		const json = tool.json;
		const ui = json._meta?.SMSS_MCP_UI;
		return {
			resourceURI: ui?.resourceURI,
			loadingMessageText: ui?.loadingMessage,
			autoOpen: ui?.autoOpen,
			execution: json._meta?.SMSS_MCP_EXECUTION,
			isFolder: isFolderToolCall(json),
			isChatTool: isChatToolCall(json),
			appId: getToolAppId(json._meta),
			jsonId: json.id,
			isResolved: tool.isResolved,
			display: tool.display,
			isOpen: tool.isOpen,
			message: tool.message,
			hasPendingAction: Boolean(tool.pendingAction),
			toolStatus: tool.status,
			displayName: tool.displayName,
			isAgentRoom: current.mode === "agent",
		};
	});
	const toolView = useToolView(resourceURI);
	const { loadingMessage } = useLoadingMessage(
		toolStatus === "LOADING",
		loadingMessageText ? [loadingMessageText] : [],
	);

	// Auto-open is tied to resolution/metadata, not to the user's later close action.
	useEffect(() => {
		if (
			isResolved &&
			tool.display !== "hidden" &&
			autoOpen === true &&
			!tool.isOpen
		) {
			tool.openTool(isMobile ? "inline" : undefined);
		}
	}, [tool, isResolved, autoOpen, isMobile]);

	if (!isResolved) return <ResponseMessageToolStreaming tool={tool} />;
	if (display === "hidden" || !message) return null;
	const needsDecision =
		hasPendingAction ||
		(toolStatus === "INITIAL" && isAskExecutionMode(execution));
	const isOpenInSidebar = isOpen && display === "sidebar";
	// Keep pending decisions inline until their tool is opened in the sidebar.
	const shouldShowInlineDecision = Boolean(
		isLarge && needsDecision && !isOpenInSidebar,
	);
	const isFailed = toolStatus === "ERROR";
	const isCancelled = toolStatus === "CANCELLED";
	const isRunning = toolStatus === "LOADING";
	const isSucceeded = toolStatus === "SUCCESS";
	// the arrow shows or hides the tool in the chat; the sidebar button moves it out and back
	const isOpenInline = isOpen && display === "inline";
	const shouldShowDecision = shouldShowInlineDecision && !isDecisionCollapsed;
	const isExpanded = isOpenInline || shouldShowDecision;
	const isActive = isExpanded || (isOpenInSidebar && isSidebarActive);
	// mobile keeps tools inline, but a tool already in the drawer can come back
	const canUseSidebar = !isMobile || isOpenInSidebar;
	// Agent runs own their cancellation lifecycle. Never write a legacy tool result into an active run.
	const canCancel =
		!isSucceeded &&
		!isFailed &&
		!isCancelled &&
		(!isAgentRoom || hasPendingAction);
	const status = isFailed
		? t("status.failed")
		: isCancelled
			? t("status.cancelled")
			: isSucceeded
				? t("status.completed")
				: needsDecision
					? t("activity.needsInput")
					: isRunning
						? loadingMessage || t("status.running")
						: t("status.queued");
	const openAction = isExpanded
		? t("actions.collapse")
		: t("actions.openInline");
	const sidebarAction = isOpenInSidebar
		? t("actions.openInline")
		: t("actions.openInSidebar");
	/** Reject the run's pending action, or save the chat call as cancelled, then close it. */
	const handleCancel = async () => {
		if (isCancelling) return;
		setIsCancelling(true);
		try {
			if (tool.pendingAction) await decideAgentToolAction(tool, "reject");
			else await message.saveToolExecution(tool, "", "cancelled", {});
			tool.closeTool();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: t("activity.cancelError"),
			);
		} finally {
			setIsCancelling(false);
		}
	};
	/** Show or hide the call in the conversation. */
	const handleToggle = () => {
		if (isExpanded) {
			setIsDecisionCollapsed(true);
			if (isOpenInline) tool.closeTool();
			return;
		}
		setIsDecisionCollapsed(false);
		// a pending decision already renders inline once it is uncollapsed
		if (!shouldShowInlineDecision) tool.openTool("inline");
	};
	/** Move the call into the sidebar, or back into the conversation. */
	const handleSidebar = () => {
		if (isOpenInSidebar) {
			setIsDecisionCollapsed(false);
			tool.openTool("inline");
		} else {
			tool.openTool("sidebar");
		}
	};
	// a call that names a component:// view the playground draws shows it
	// in place of its card; work folder calls keep theirs
	const componentView = toolView && !isFolder ? toolView : null;
	// what the call shows if its view fails: the card it has without one
	const fallbackView = !componentView ? null : isChatTool ? (
		<ChatToolCard tool={tool} variant="inline" />
	) : (
		<RoomInlineTool room={room} message={message} tool={tool} />
	);
	return (
		<div
			className={cn(
				"min-w-0 rounded-lg bg-accent/60 transition-colors hover:bg-accent dark:bg-accent/30 dark:hover:bg-accent/50",
				isLarge && "border",
				isActive &&
					"bg-accent hover:bg-accent dark:bg-accent/70 dark:hover:bg-accent/70",
			)}
		>
			<div className="flex min-w-0 items-center gap-0.5 px-1">
				<Button
					variant="ghost"
					size="sm"
					onClick={handleToggle}
					className="h-auto min-h-8 min-w-0 flex-1 justify-start gap-2 whitespace-normal px-2 py-1 text-start hover:bg-transparent dark:hover:bg-transparent"
					aria-expanded={isExpanded}
					aria-label={`${displayName}: ${status}. ${openAction}`}
				>
					<span
						aria-hidden="true"
						className={cn(
							"shrink-0 text-muted-foreground",
							isSucceeded && "text-success",
							isFailed && "text-destructive/60",
						)}
					>
						{isRunning ? (
							<Spinner />
						) : isSucceeded ? (
							<CheckIcon className="size-4" />
						) : isFailed || isCancelled ? (
							<XCircleIcon className="size-4" />
						) : (
							<HammerIcon className="size-4" />
						)}
					</span>
					<span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
						<span className="min-w-0 max-w-full break-words text-sm">
							{displayName}
						</span>
						<span className="min-w-0 max-w-full break-words font-normal text-muted-foreground text-xs">
							{status}
						</span>
					</span>
					<ChevronDownIcon
						aria-hidden="true"
						className={cn(
							"size-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
							isExpanded && "rotate-180",
						)}
					/>
				</Button>
				{canUseSidebar && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								className="shrink-0 text-muted-foreground"
								aria-label={sidebarAction}
								aria-pressed={isOpenInSidebar}
								onClick={handleSidebar}
							>
								<PanelRightIcon aria-hidden="true" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{sidebarAction}</TooltipContent>
					</Tooltip>
				)}
				{canCancel && !needsDecision && (
					<Button
						variant="ghost"
						size="sm"
						disabled={isCancelling}
						onClick={handleCancel}
					>
						{t("actions.cancel")}
					</Button>
				)}
				{needsDecision && canCancel && (
					<ResponseMessageToolMenu
						message={message}
						tool={tool}
						shouldShowCancel
					/>
				)}
			</div>
			{shouldShowDecision ? (
				componentView ? (
					<div className="min-w-0 border-t p-2">
						<ComponentToolView
							tool={tool}
							view={componentView}
							variant="inline"
							fallback={fallbackView}
						/>
					</div>
				) : (
					<div className="h-80 min-w-0 overflow-auto border-t">
						<ToolsView
							room={room}
							app={appId}
							message={message.id}
							toolId={jsonId}
						/>
					</div>
				)
			) : (
				isOpenInline && (
					<div className="p-2 pt-0">
						{componentView ? (
							<ComponentToolView
								tool={tool}
								view={componentView}
								variant="inline"
								fallback={fallbackView}
							/>
						) : isChatTool ? (
							<ChatToolCard tool={tool} variant="inline" />
						) : (
							<RoomInlineTool
								room={room}
								message={message}
								tool={tool}
							/>
						)}
					</div>
				)
			)}
		</div>
	);
};
