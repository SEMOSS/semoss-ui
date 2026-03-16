import {
	CheckIcon,
	HammerIcon,
	MoreHorizontalIcon,
	XCircleIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "@semoss/i18n";
import { Button, cn, Spinner } from "@semoss/ui/next";
import { useLoadingMessage } from "@/hooks";
import type { ResponseMessageStore, ToolStore } from "@/stores";

interface ResponseMessageToolProps {
	/** Message to render */
	message: ResponseMessageStore;

	/** Tool to render */
	tool: ToolStore;
}

export const ResponseMessageTool: React.FC<ResponseMessageToolProps> = observer(
	({ message, tool }) => {
		const { t } = useTranslation("chat");
		const { room } = message;

		const { loadingMessage: toolExecutionMessage } = useLoadingMessage(
			tool.status === "LOADING",
			tool.json._meta.SMSS_MCP_UI?.loadingMessage
				? [tool.json._meta.SMSS_MCP_UI.loadingMessage]
				: [],
		);

		// this will render the component whenever the sidebar model changes
		room.sidebar.counter;

		// TODO: if the plan is executing, only the execution step is enabled
		let isDisabled = false;
		if (room.mode === "executing") {
			isDisabled =
				room.plan?.step?.details.stepType !== "tool_call" ||
				room.plan?.step?.details.tool_name !== tool.json.name ||
				room.plan?.step?.details._meta.SMSS_PROJECT_ID !==
					tool.json._meta.SMSS_PROJECT_ID;
		}

		let isActive = false;
		if (tool.display === "sidebar" && tool.isOpen && room.sidebar.isOpen) {
			isActive = true;
		} else if (tool.display === "inline" && tool.isOpen) {
			isActive = true;
		}

		// Don't render if hidden
		if (tool.display === "hidden") {
			return null;
		}

		// Determine display variant
		type Variant =
			| "complete"
			| "ready"
			| "loading"
			| "error"
			| "queued"
			| "cancelled";
		let variant: Variant;
		if (tool.status === "ERROR") {
			variant = "error";
		} else if (tool.status === "CANCELLED") {
			variant = "cancelled";
		} else if (tool.status === "SUCCESS" || tool.response) {
			variant = "complete";
		} else if (tool.status === "LOADING") {
			variant = "loading";
		} else if (tool.json._meta.SMSS_MCP_EXECUTION === "ask") {
			variant = "ready";
		} else {
			variant = "queued";
		}

		// Subtext line beneath the tool title
		const subtext =
			variant === "loading"
				? toolExecutionMessage
				: variant === "queued"
					? t("tool.queued")
					: variant === "cancelled"
						? t("tool.cancelled")
						: tool.json.description;

		// Icon
		let icon: React.ReactNode;
		if (variant === "loading") {
			icon = <Spinner />;
		} else if (variant === "complete") {
			icon = <CheckIcon className="size-5" />;
		} else if (variant === "cancelled") {
			icon = <XCircleIcon className="size-5" />;
		} else {
			icon = <HammerIcon className="size-5" />;
		}

		const isPrimaryIcon = variant === "complete" || variant === "ready";
		const isDimmed = variant === "error" || variant === "cancelled";

		return (
			<div
				className={cn(
					"flex items-center gap-3 rounded-lg border border-border p-2",
					isDisabled && "opacity-50",
					variant === "complete" ? "bg-sidebar" : "bg-background",
					!isDisabled && isActive && "border-primary",
				)}
			>
				{/* Clickable section: icon + text */}
				<button
					type="button"
					disabled={isDisabled}
					className={cn(
						"flex min-w-0 flex-1 items-center gap-3 text-left",
						isDisabled ? "cursor-not-allowed" : "cursor-pointer",
					)}
					onClick={() => tool.openTool()}
				>
					<div
						className={cn(
							"flex size-9 shrink-0 items-center justify-center rounded-sm",
							isPrimaryIcon
								? "bg-primary/10 text-primary"
								: "bg-muted text-muted-foreground",
							isDimmed && "opacity-50",
						)}
					>
						{icon}
					</div>
					<div
						className={cn(
							"flex min-w-0 flex-1 flex-col",
							isDimmed && "opacity-50",
						)}
					>
						<span
							className="truncate font-medium text-foreground text-sm"
							title={tool.json.title}
						>
							{tool.json.title}
						</span>
						{subtext && (
							<span
								className="truncate text-muted-foreground text-sm"
								title={subtext}
							>
								{subtext}
							</span>
						)}
					</div>
				</button>

				{/* Right-side actions */}
				{variant === "loading" && (
					<Button
						type="button"
						size="sm"
						variant="secondary"
						className="shrink-0"
						onClick={(e) => {
							e.stopPropagation();
							message.saveToolExecution(
								tool,
								"",
								"cancelled",
								{},
							);
							tool.closeTool();
						}}
					>
						{t("tool.cancel")}
					</Button>
				)}
				{variant === "error" && (
					<Button
						type="button"
						size="sm"
						variant="destructive"
						className="shrink-0"
					>
						<XCircleIcon className="size-4" />
						{t("tool.failedToExecute")}
					</Button>
				)}
				{variant === "ready" && (
					<Button
						type="button"
						size="icon"
						variant="ghost"
						className="shrink-0"
						onClick={(e) => {
							e.stopPropagation();
							tool.openTool();
						}}
					>
						<MoreHorizontalIcon className="size-4" />
					</Button>
				)}
			</div>
		);
	},
);
