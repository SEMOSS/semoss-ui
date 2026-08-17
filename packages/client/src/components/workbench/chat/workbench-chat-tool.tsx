import {
	CheckIcon,
	HammerIcon,
	Loader2Icon,
	PlayIcon,
	XIcon,
} from "lucide-react";
import type React from "react";
import { Button, cn } from "@semoss/ui/next";
import type { WorkbenchChatToolState } from "./workbench-chat.reducer";

interface WorkbenchChatToolProps {
	tool: WorkbenchChatToolState;
	onRun: (toolId: string) => void;
	onCancel: (toolId: string) => void;
}

/** Render one MCP tool invocation and its execution controls. */
export const WorkbenchChatTool: React.FC<WorkbenchChatToolProps> = ({
	tool,
	onRun,
	onCancel,
}) => {
	const displayName =
		tool.call.title ||
		tool.call._meta?.SMSS_ORIGINAL_TOOL_NAME ||
		tool.call.original_name ||
		tool.call.name ||
		"Tool";
	const isAskTool =
		tool.call._meta?.SMSS_MCP_EXECUTION === "ask" &&
		tool.status === "initial";

	const statusContent = (() => {
		switch (tool.status) {
			case "running":
				return {
					icon: <Loader2Icon className="size-4 animate-spin" />,
					label: "Running",
					iconClassName: "bg-muted text-muted-foreground",
					labelClassName: "text-muted-foreground",
				};
			case "success":
				return {
					icon: <CheckIcon className="size-4" />,
					label: "Complete",
					iconClassName: "bg-primary/10 text-primary",
					labelClassName: "text-primary",
				};
			case "error":
				return {
					icon: <XIcon className="size-4" />,
					label: "Failed",
					iconClassName: "bg-destructive/10 text-destructive",
					labelClassName: "text-destructive",
				};
			case "cancelled":
				return {
					icon: <XIcon className="size-4" />,
					label: "Cancelled",
					iconClassName: "bg-muted text-muted-foreground",
					labelClassName: "text-muted-foreground",
				};
			case "disabled":
				return {
					icon: <CheckIcon className="size-4" />,
					label: "Handled by model",
					iconClassName: "bg-muted text-muted-foreground",
					labelClassName: "text-muted-foreground",
				};
			default:
				return {
					icon: <HammerIcon className="size-4" />,
					label: isAskTool ? "Approval required" : "Queued",
					iconClassName: isAskTool
						? "bg-primary/10 text-primary"
						: "bg-muted text-muted-foreground",
					labelClassName: "text-muted-foreground",
				};
		}
	})();

	return (
		<div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-sidebar">
			<div className="flex min-w-0 items-center gap-2 p-2">
				<div
					className={cn(
						"flex size-7 shrink-0 items-center justify-center rounded-sm",
						statusContent.iconClassName,
					)}
					aria-hidden
				>
					{statusContent.icon}
				</div>
				<div className="min-w-0 flex-1">
					<p
						className="truncate font-medium text-sm"
						title={displayName}
					>
						{displayName}
					</p>
					<p className={cn("text-xs", statusContent.labelClassName)}>
						{statusContent.label}
					</p>
				</div>
				{isAskTool ? (
					<div className="flex shrink-0 items-center gap-1">
						<Button
							type="button"
							size="icon-sm"
							variant="ghost"
							aria-label={`Cancel ${displayName}`}
							onClick={() => onCancel(tool.call.id)}
						>
							<XIcon />
						</Button>
						<Button
							type="button"
							size="icon-sm"
							aria-label={`Run ${displayName}`}
							onClick={() => onRun(tool.call.id)}
						>
							<PlayIcon />
						</Button>
					</div>
				) : null}
			</div>
			{tool.response && tool.status !== "success" ? (
				<p className="wrap-break-word border-border border-t bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
					{tool.response}
				</p>
			) : null}
		</div>
	);
};
