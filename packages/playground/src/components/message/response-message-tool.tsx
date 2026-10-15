import {
	CheckIcon,
	ChevronsLeftRightIcon,
	ChevronsRightLeftIcon,
	HammerIcon,
	PanelRightCloseIcon,
	PanelRightOpenIcon,
	XCircleIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useToolView } from "@semoss/shared";
import { Button, cn, Spinner, toast, useIsMobile } from "@semoss/ui/next";
import { ChatToolCard } from "@/features/chat-tools/components/chat-tool-card";
import {
	isChatToolCall,
	isFolderToolCall,
} from "@/features/chat-tools/tools/chat-tool-kind";
import { ComponentToolView } from "@/features/tool-views/component-tool-view";
import { useLoadingMessage } from "@/hooks/use-loading-message";
import { useSidebarPanelActive } from "@/hooks/use-sidebar-panel-active";
import { decideAgentToolAction } from "@/stores/message/agent-harness";
import { ROOM_PANEL_TYPES } from "@/stores/room/room-sidebar";
import type { ToolStore } from "@/stores/tool/tool.store";
import { getToolAppId, isAskExecutionMode } from "@/utility/mcp-utils";
import { ToolsView } from "../mcp/tools-view";
import { RoomInlineTool } from "../room/room-inline-tool";
import { ResponseMessageToolMenu } from "./response-message-tool-menu";
import { ResponseMessageToolStreaming } from "./response-message-tool-streaming";

export interface ResponseMessageToolProps {
	/** Tool activity to display and open. */
	tool: ToolStore;
	/** Show pending decisions in a framed, inline view. */
	isLarge?: boolean;
}

/** A compact tool row with its status and actions always available. */
export const ResponseMessageTool = observer(
	({ tool, isLarge }: ResponseMessageToolProps) => {
		const { t } = useTranslation("tool");
		const { room } = tool;
		const isMobile = useIsMobile();
		const [isCancelling, setIsCancelling] = useState(false);
		const isSidebarActive = useSidebarPanelActive(
			room,
			ROOM_PANEL_TYPES.TOOL,
			{ toolId: tool.id },
		);
		const toolView = useToolView(tool.json._meta?.SMSS_MCP_UI?.resourceURI);
		const { loadingMessage } = useLoadingMessage(
			tool.status === "LOADING",
			tool.json._meta?.SMSS_MCP_UI?.loadingMessage
				? [tool.json._meta.SMSS_MCP_UI.loadingMessage]
				: [],
		);

		// Auto-open is tied to resolution/metadata, not to the user's later close action.
		useEffect(() => {
			if (
				tool.isResolved &&
				tool.display !== "hidden" &&
				tool.json._meta?.SMSS_MCP_UI?.autoOpen === true &&
				!tool.isOpen
			) {
				tool.openTool(isMobile ? "inline" : undefined);
			}
		}, [
			tool,
			tool.isResolved,
			tool.json._meta?.SMSS_MCP_UI?.autoOpen,
			isMobile,
		]);

		if (!tool.isResolved)
			return <ResponseMessageToolStreaming tool={tool} />;
		const message = tool.message;
		if (tool.display === "hidden" || !message) return null;
		const needsDecision =
			Boolean(tool.pendingAction) ||
			(tool.status === "INITIAL" &&
				isAskExecutionMode(tool.json._meta?.SMSS_MCP_EXECUTION));
		const failed = tool.status === "ERROR";
		const cancelled = tool.status === "CANCELLED";
		const running = tool.status === "LOADING";
		const succeeded = tool.status === "SUCCESS";
		const opensInline = isMobile || tool.display === "inline";
		const isActive = opensInline
			? tool.isOpen && tool.display === "inline"
			: isSidebarActive;
		// Agent runs own their cancellation lifecycle. Never write a legacy tool result into an active run.
		const canCancel =
			!succeeded &&
			!failed &&
			!cancelled &&
			(room.mode !== "agent" || Boolean(tool.pendingAction));
		const status = failed
			? t("status.failed")
			: cancelled
				? t("status.cancelled")
				: succeeded
					? t("status.completed")
					: needsDecision
						? t("activity.needsInput")
						: running
							? loadingMessage || t("status.running")
							: t("status.queued");
		const openAction = opensInline
			? isActive
				? t("actions.collapse")
				: t("actions.openInline")
			: isActive
				? t("actions.closeInSidebar")
				: t("actions.openInSidebar");
		const handleCancel = async () => {
			if (isCancelling) return;
			setIsCancelling(true);
			try {
				if (tool.pendingAction)
					await decideAgentToolAction(tool, "reject");
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
		const handleOpen = () => {
			if (isActive) tool.closeTool();
			else tool.openTool(isMobile ? "inline" : undefined);
		};
		// a call that names a component:// view the playground draws shows it
		// in place of its card; work folder calls keep theirs
		const componentView =
			toolView && !isFolderToolCall(tool.json) ? toolView : null;
		// what the call shows if its view fails: the card it has without one
		const fallbackView = !componentView ? null : isChatToolCall(
				tool.json,
			) ? (
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
					failed && "border border-destructive/30",
				)}
			>
				<div className="flex min-w-0 items-center gap-0.5 px-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleOpen}
						className="h-auto min-h-8 min-w-0 flex-1 justify-start gap-2 whitespace-normal px-2 py-1 text-start hover:bg-transparent dark:hover:bg-transparent"
						aria-expanded={isActive}
						aria-label={`${tool.displayName}: ${status}. ${openAction}`}
					>
						<span
							aria-hidden="true"
							className={cn(
								"shrink-0 text-muted-foreground",
								succeeded && "text-success",
								failed && "text-destructive",
							)}
						>
							{running ? (
								<Spinner />
							) : succeeded ? (
								<CheckIcon className="size-4" />
							) : failed || cancelled ? (
								<XCircleIcon className="size-4" />
							) : (
								<HammerIcon className="size-4" />
							)}
						</span>
						<span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
							<span className="min-w-0 max-w-full break-words text-sm">
								{tool.displayName}
							</span>
							<span
								className={cn(
									"min-w-0 max-w-full break-words font-normal text-muted-foreground text-xs",
									failed && "text-destructive",
								)}
							>
								{status}
							</span>
						</span>
						{opensInline ? (
							isActive ? (
								<ChevronsRightLeftIcon
									aria-hidden="true"
									className="size-4 shrink-0 text-muted-foreground"
								/>
							) : (
								<ChevronsLeftRightIcon
									aria-hidden="true"
									className="size-4 shrink-0 text-muted-foreground"
								/>
							)
						) : isActive ? (
							<PanelRightOpenIcon
								aria-hidden="true"
								className="size-4 shrink-0 text-muted-foreground"
							/>
						) : (
							<PanelRightCloseIcon
								aria-hidden="true"
								className="size-4 shrink-0 text-muted-foreground"
							/>
						)}
					</Button>
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
					<ResponseMessageToolMenu
						message={message}
						tool={tool}
						showCancelInMenu={needsDecision && canCancel}
					/>
				</div>
				{isLarge && needsDecision ? (
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
								app={getToolAppId(tool.json._meta)}
								message={message.id}
								toolId={tool.json.id}
							/>
						</div>
					)
				) : (
					tool.isOpen &&
					tool.display === "inline" && (
						<div className="p-2 pt-0">
							{componentView ? (
								<ComponentToolView
									tool={tool}
									view={componentView}
									variant="inline"
									fallback={fallbackView}
								/>
							) : isChatToolCall(tool.json) ? (
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
	},
);
