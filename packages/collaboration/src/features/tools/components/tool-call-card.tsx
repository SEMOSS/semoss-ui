import {
	Check,
	ChevronDown,
	CircleX,
	Hourglass,
	PanelRightOpen,
} from "lucide-react";
import { useId, useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	cn,
	Muted,
	Spinner,
	useIsMobile,
} from "@semoss/ui/next";
import { asString } from "@semoss/utility";
import {
	DelegationRequestApproval,
	isDelegationRequest,
} from "@/features/delegations/components/delegation-request-approval";
import {
	DelegationSubmitApproval,
	delegationRequester,
	isDelegationSubmit,
} from "@/features/delegations/components/delegation-submit-approval";
import { WithdrawDelegation } from "@/features/delegations/components/withdraw-delegation";
import type { ConversationTool } from "@/features/messages/types/message";
import { toolCardTriggerId } from "../tool-workbench.constants";
import { useToolWorkbench } from "../tool-workbench.context";
import {
	getToolDisplayLocation,
	getToolLoadingMessage,
} from "../utils/tool-metadata";
import { ToolCallMenu } from "./tool-call-menu";
import { ToolFailureTooltip } from "./tool-failure-tooltip";
import { ToolInline } from "./tool-inline";

function statusDetails(status: ConversationTool["status"]) {
	switch (status) {
		case "COMPLETED":
			return {
				icon: Check,
				label: "Completed",
				iconClassName: "text-muted-foreground",
			};
		case "FAILED":
			return {
				icon: CircleX,
				label: "Failed",
				iconClassName: "text-destructive",
			};
		case "REJECTED":
		case "CANCELLED":
			return {
				icon: CircleX,
				label: status === "REJECTED" ? "Rejected" : "Cancelled",
				iconClassName: "text-muted-foreground",
			};
		case "INPUT_REQUIRED":
			return {
				icon: Hourglass,
				label: "Waiting for approval",
				iconClassName: "text-warning",
			};
		case "RUNNING":
		case "QUEUED":
			return {
				icon: null,
				label: status === "RUNNING" ? "Running" : "Queued",
				iconClassName: "text-muted-foreground",
			};
	}
}

const SUBMIT_LABELS: Partial<Record<ConversationTool["status"], string>> = {
	INPUT_REQUIRED: "Review before sending",
	COMPLETED: "Sent",
	REJECTED: "Not sent",
};

/** One string field of a JSON tool result, if present. */
function resultField(
	output: string | undefined,
	key: string,
): string | undefined {
	if (!output) return undefined;
	try {
		const parsed: unknown = JSON.parse(output);
		return parsed && typeof parsed === "object" && key in parsed
			? asString((parsed as Record<string, unknown>)[key]) || undefined
			: undefined;
	} catch {
		return undefined;
	}
}

/** Playground-style tool card with one movable inline/workbench detail view. */
export function ToolCallCard({
	tool,
	createdAt,
	onMenuOpenChange,
}: {
	tool: ConversationTool;
	/** Timestamp of the source message, including folded continuations. */
	createdAt?: string;
	/** Keep contextual controls mounted and visible while their portal is open. */
	onMenuOpenChange?: (isOpen: boolean) => void;
}) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const detailId = useId();
	const statusId = useId();
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
	const isRequest = isDelegationRequest(tool);
	const pendingApproval = pendingApprovals.find(
		(item) => item.toolId === tool.id,
	);
	const statusLabel =
		tool.statusLabel ??
		(isSubmit || isRequest ? SUBMIT_LABELS[tool.status] : undefined) ??
		(pendingApproval?.requiresResponse ? "Needs your input" : undefined);
	const details = {
		...statusDetails(tool.status),
		...(statusLabel && { label: statusLabel }),
	};
	const title = isSubmit
		? `Answer to ${delegationRequester(tool) ?? "requester"}`
		: isRequest
			? `New request to ${resultField(tool.output, "assignee") ?? (asString(tool.arguments.assignee) || "a person")}`
			: tool.title;
	// Delegation tools return a plain-language summary of what happened; their
	// description is written for the model, so it is never shown.
	const outcome =
		isSubmit || isRequest ? resultField(tool.output, "message") : undefined;
	// Delegation steps are confirmed in the card rather than the generic panel.
	const approval =
		isSubmit || isRequest
			? pendingApprovals.find((item) => item.toolId === tool.id)
			: undefined;
	// Sent and not answered yet: the requester can take it back.
	const waitingRunId =
		isRequest && !approval && tool.status === "INPUT_REQUIRED"
			? resultField(tool.output, "runId")
			: undefined;
	const Icon = details.icon;
	const isInline = isToolInline(tool.id);
	const isInWorkbench = isOpen && activeToolId === tool.id;
	const isActive = isInline || isInWorkbench;
	const displayLocation = getToolDisplayLocation(tool);
	const opensInline =
		isInline ||
		isMobile ||
		displayLocation === "inline" ||
		displayLocation === "hidden";
	if (
		displayLocation === "hidden" &&
		!pendingApprovals.some((action) => action.toolId === tool.id)
	)
		return null;

	const status =
		isSubmit || isRequest
			? (tool.statusLabel ?? outcome ?? details.label)
			: tool.status === "RUNNING"
				? getToolLoadingMessage(tool)
				: details.label;

	return (
		<Collapsible
			open={isInline}
			data-tool-id={tool.id}
			className={cn(
				"group/tool min-w-0 rounded-xl border border-border/60 bg-muted/20 transition-colors duration-150 motion-reduce:transition-none",
				isActive && "border-primary/50 bg-background",
			)}
		>
			<div className="flex min-h-10 items-center gap-1 pe-1">
				<ToolFailureTooltip tools={[tool]}>
					<Button
						id={toolCardTriggerId(tool.id)}
						data-preserve-reading-position
						type="button"
						variant="ghost"
						className="h-auto min-h-10 min-w-0 flex-1 justify-start gap-2 whitespace-normal rounded-xl px-3 py-2 text-start"
						onClick={() => {
							if (isInline) closeTool(tool.id);
							else if (opensInline) openInline(tool.id);
							else openWorkbench(tool.id);
						}}
						aria-expanded={opensInline ? isInline : undefined}
						aria-controls={isInline ? detailId : undefined}
						aria-label={`${title} details${opensInline ? "" : " in workbench"}${tool.status === "FAILED" ? " — failed" : ""}`}
						{...(tool.status !== "FAILED"
							? { "aria-describedby": statusId }
							: {})}
					>
						<span
							className={cn(
								"flex size-4 shrink-0 items-center justify-center",
								details.iconClassName,
							)}
						>
							{Icon ? (
								<Icon aria-hidden="true" className="size-4" />
							) : (
								<Spinner
									aria-hidden="true"
									className="size-4 motion-reduce:animate-none"
								/>
							)}
						</span>
						<span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
							<Muted className="wrap-anywhere font-medium text-foreground text-sm">
								{title}
							</Muted>
							<Muted
								id={statusId}
								className={cn(
									"wrap-anywhere text-xs",
									tool.status === "FAILED" &&
										"text-destructive",
									tool.status === "INPUT_REQUIRED" &&
										"text-warning",
								)}
							>
								{status}
							</Muted>
						</span>
						{opensInline ? (
							<ChevronDown
								aria-hidden="true"
								className={cn(
									"size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
									isInline && "rotate-180",
								)}
							/>
						) : (
							<PanelRightOpen
								aria-hidden="true"
								className="size-4 shrink-0 text-muted-foreground"
							/>
						)}
					</Button>
				</ToolFailureTooltip>
				{waitingRunId && (
					<WithdrawDelegation
						runId={waitingRunId}
						assignee={
							resultField(tool.output, "assignee") ?? "They"
						}
					/>
				)}
				<div
					className="pointer-events-none flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 ease-out group-focus-within/tool:pointer-events-auto group-focus-within/tool:opacity-100 group-focus-within/tool:duration-0 group-hover/tool:pointer-events-auto group-hover/tool:opacity-100 data-[menu-open=true]:pointer-events-auto data-[menu-open=true]:opacity-100 motion-reduce:transition-none [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100 [@media(pointer:coarse)]:pointer-events-auto [@media(pointer:coarse)]:opacity-100"
					data-menu-open={isMenuOpen}
				>
					<ToolCallMenu
						toolId={tool.id}
						createdAt={createdAt}
						onOpenChange={(open) => {
							setIsMenuOpen(open);
							onMenuOpenChange?.(open);
						}}
					/>
				</div>
			</div>
			<CollapsibleContent
				id={detailId}
				className="overflow-hidden duration-200 ease-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none"
			>
				{approval && isRequest ? (
					<DelegationRequestApproval tool={tool} action={approval} />
				) : approval ? (
					<DelegationSubmitApproval tool={tool} action={approval} />
				) : (
					<ToolInline toolId={tool.id} />
				)}
			</CollapsibleContent>
		</Collapsible>
	);
}
