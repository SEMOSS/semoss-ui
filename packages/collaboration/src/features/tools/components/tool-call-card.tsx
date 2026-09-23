import {
	Check,
	ChevronDown,
	ChevronRight,
	CircleX,
	Hammer,
	Hourglass,
} from "lucide-react";
import { cn, Spinner, useIsMobile } from "@semoss/ui/next";
import {
	DelegationSubmitApproval,
	isDelegationSubmit,
} from "@/features/delegations/components/delegation-submit-approval";
import type { ConversationTool } from "@/features/messages/types/message";
import { toolCardTriggerId } from "../tool-workbench.constants";
import { useToolWorkbench } from "../tool-workbench.context";
import {
	getToolDisplayLocation,
	getToolLoadingMessage,
} from "../utils/tool-metadata";
import { ToolCallMenu } from "./tool-call-menu";
import { ToolInline } from "./tool-inline";

function statusDetails(status: ConversationTool["status"]) {
	switch (status) {
		case "COMPLETED":
			return {
				icon: Check,
				label: "Completed",
				iconClassName: "bg-primary/10 text-primary",
			};
		case "FAILED":
		case "REJECTED":
		case "CANCELLED":
			return {
				icon: CircleX,
				label: status.toLowerCase(),
				iconClassName: "bg-muted text-muted-foreground",
			};
		case "INPUT_REQUIRED":
			return {
				icon: Hourglass,
				label: "Waiting for approval",
				iconClassName: "bg-warning/10 text-warning",
			};
		case "RUNNING":
		case "QUEUED":
			return {
				icon: null,
				label: status === "RUNNING" ? "Running" : "Queued",
				iconClassName: "bg-muted text-muted-foreground",
			};
	}
}

const SUBMIT_LABELS: Partial<Record<ConversationTool["status"], string>> = {
	INPUT_REQUIRED: "Review before sending",
	COMPLETED: "Sent",
	REJECTED: "Not sent",
};

/** Playground-style tool card with one movable inline/workbench detail view. */
export function ToolCallCard({ tool }: { tool: ConversationTool }) {
	const isMobile = useIsMobile();
	const {
		openInline,
		openWorkbench,
		closeTool,
		isToolInline,
		activeToolId,
		isOpen,
		pendingApprovals,
	} = useToolWorkbench();
	const isSubmit = isDelegationSubmit(tool);
	const statusLabel =
		tool.statusLabel ?? (isSubmit ? SUBMIT_LABELS[tool.status] : undefined);
	const details = {
		...statusDetails(tool.status),
		...(statusLabel && { label: statusLabel }),
	};
	const title = isSubmit ? "Answer to requester" : tool.title;
	const submitApproval = isSubmit
		? pendingApprovals.find((approval) => approval.toolId === tool.id)
		: undefined;
	const Icon = details.icon;
	const isInline = isToolInline(tool.id);
	const isInWorkbench = isOpen && activeToolId === tool.id;
	const isActive = isInline || isInWorkbench;
	const displayLocation = getToolDisplayLocation(tool);
	if (displayLocation === "hidden") return null;

	return (
		<div
			className={cn(
				"overflow-hidden rounded-lg border bg-sidebar transition-colors",
				isActive && "border-primary",
			)}
		>
			<div className="flex items-center gap-1 p-1">
				<button
					id={toolCardTriggerId(tool.id)}
					type="button"
					className="flex min-w-0 flex-1 items-center gap-2 rounded-md p-1 text-start hover:bg-accent"
					onClick={() => {
						if (isInline) closeTool(tool.id);
						else if (isMobile || displayLocation === "inline")
							openInline(tool.id);
						else openWorkbench(tool.id);
					}}
					aria-expanded={isInline}
					aria-label={`${title} details`}
				>
					<span
						className={cn(
							"flex size-8 shrink-0 items-center justify-center rounded-sm",
							details.iconClassName,
						)}
					>
						{Icon ? (
							<Icon aria-hidden="true" className="size-4" />
						) : tool.status === "RUNNING" ||
							tool.status === "QUEUED" ? (
							<Spinner
								aria-hidden="true"
								className="size-4 motion-reduce:animate-none"
							/>
						) : (
							<Hammer aria-hidden="true" className="size-4" />
						)}
					</span>
					<span className="min-w-0 flex-1">
						<span className="block truncate font-medium text-xs">
							{title}
						</span>
						<span className="block truncate text-muted-foreground text-xs">
							{tool.description ??
								(tool.status === "RUNNING"
									? getToolLoadingMessage(tool)
									: details.label)}
						</span>
					</span>
					{isInline ? (
						<ChevronDown
							aria-hidden="true"
							className="size-4 shrink-0 text-muted-foreground"
						/>
					) : (
						<ChevronRight
							aria-hidden="true"
							className="size-4 shrink-0 text-muted-foreground"
						/>
					)}
				</button>
				<ToolCallMenu toolId={tool.id} />
			</div>
			{isInline &&
				(submitApproval ? (
					<DelegationSubmitApproval
						tool={tool}
						action={submitApproval}
					/>
				) : (
					<ToolInline toolId={tool.id} />
				))}
		</div>
	);
}
