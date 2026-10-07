import {
	ArrowUpRight,
	Check,
	ChevronDown,
	CircleX,
	Hourglass,
	Mail,
} from "lucide-react";
import { useContext, useId, useMemo, useRef, useState } from "react";
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
import { composeDraftId } from "@/features/thread-assistant/thread-draft-proposal";
import { useEditorEmail } from "@/features/work-thread/use-editor-email";
import { WorkEmailContext } from "@/features/work-thread/work-email.context";
import { toolCardTriggerId } from "../tool-workbench.constants";
import { useToolWorkbench } from "../tool-workbench.context";
import {
	emailDraftToolPreview,
	isEmailDraftTool,
} from "../utils/email-draft-tool";
import { getToolComponent, TOOL_COMPONENTS } from "../utils/tool-components";
import {
	getToolDisplayLocation,
	getToolLoadingMessage,
} from "../utils/tool-metadata";
import { EmailDraftCard } from "./email-draft-card";
import { EmailSendActions } from "./email-send-actions";
import { MemoryToolCard, parseMemoryResult } from "./memory-tool-card";
import { ToolCallMenu } from "./tool-call-menu";
import { ToolFailureTooltip } from "./tool-failure-tooltip";
import { ToolInline } from "./tool-inline";

const COMPOSE_STATUS: Partial<Record<ConversationTool["status"], string>> = {
	QUEUED: "Writing",
	RUNNING: "Writing",
	COMPLETED: "In your email editor",
	FAILED: "Needs attention",
};

const SEND_STATUS: Record<ConversationTool["status"], string> = {
	INPUT_REQUIRED: "Ready to send",
	QUEUED: "Sending",
	RUNNING: "Sending",
	COMPLETED: "Sent",
	FAILED: "Not sent",
	REJECTED: "Not sent",
	CANCELLED: "Not sent",
};

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

interface ToolCallCardProps {
	tool: ConversationTool;
	/** Timestamp of the source message, including folded continuations. */
	createdAt?: string;
	/** Keep contextual controls mounted and visible while their portal is open. */
	onMenuOpenChange?: (isOpen: boolean) => void;
}

/** Playground-style tool card; a finished Remember or Forget shows what changed in memory instead. */
export function ToolCallCard(props: ToolCallCardProps) {
	const { tool } = props;
	// a call first seen before it finished ran while this page was open
	const sawRunning = useRef(tool.status !== "COMPLETED");
	const memoryResult = useMemo(
		() =>
			tool.status === "COMPLETED" &&
			getToolComponent(tool) === TOOL_COMPONENTS.memory
				? parseMemoryResult(tool.output)
				: null,
		[tool],
	);
	if (memoryResult)
		return (
			<MemoryToolCard
				tool={tool}
				result={memoryResult}
				isLive={sawRunning.current}
			/>
		);
	return <GenericToolCallCard {...props} />;
}

/** Playground-style tool card with one movable inline/workbench detail view. */
function GenericToolCallCard({
	tool,
	createdAt,
	onMenuOpenChange,
}: ToolCallCardProps) {
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
		onRejectTool,
	} = useToolWorkbench();
	const isSubmit = isDelegationSubmit(tool);
	const isRequest = isDelegationRequest(tool);
	const workEmail = useContext(WorkEmailContext);
	const component = getToolComponent(tool);
	// Work also opens reply and forward drafts in its email panel
	const isEmailDraft =
		component === TOOL_COMPONENTS.emailDraft ||
		(Boolean(workEmail) && isEmailDraftTool(tool));
	const isEmailSend = component === TOOL_COMPONENTS.emailSend;
	// ComposeEmail writes into Work's email editor; the card reopens that editor
	const isEmailCompose = component === TOOL_COMPONENTS.emailCompose;
	const isWorkDraft = (isEmailDraft || isEmailCompose) && Boolean(workEmail);
	// SendEmail on the open email waits for Send in that editor or on this card
	const sendDraft =
		isEmailSend && workEmail
			? workEmail.composer
					.getSnapshot()
					.emailDrafts.find(
						(item) =>
							item.seed.id ===
							asString(tool.arguments.openEmailId),
					)
			: undefined;
	const draftPreview = isWorkDraft ? emailDraftToolPreview(tool) : null;
	// a compose card names what its editor holds, not what the model guessed
	const editorEmail = useEditorEmail(
		isEmailCompose ? workEmail?.composer : undefined,
		asString(tool.arguments.openEmailId) || composeDraftId(tool.id),
	);
	const composeKind =
		editorEmail?.mode ??
		(asString(tool.arguments.replyTo)
			? "reply"
			: asString(tool.arguments.forward)
				? "forward"
				: "new");
	const draftLabel =
		isEmailCompose && composeKind === "reply"
			? "Reply"
			: isEmailCompose && composeKind === "forward"
				? "Forward"
				: "Email draft";
	const draftTo = editorEmail
		? editorEmail.to
		: isEmailCompose && composeKind === "reply"
			? ""
			: draftPreview?.to;
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
			: draftPreview
				? (editorEmail?.subject ?? draftPreview.subject)
				: tool.title;
	const heading = isWorkDraft
		? title
			? `${draftLabel} \u00b7 ${title}`
			: draftLabel
		: title;
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
	const Icon = isWorkDraft || sendDraft ? Mail : details.icon;
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
		(sendDraft ? SEND_STATUS[tool.status] : undefined) ??
		(isEmailCompose && draftPreview
			? COMPOSE_STATUS[tool.status]
			: undefined) ??
		draftPreview?.status ??
		(isSubmit || isRequest
			? (tool.statusLabel ?? outcome ?? details.label)
			: tool.status === "RUNNING"
				? getToolLoadingMessage(tool)
				: details.label);

	return (
		<Collapsible
			open={
				!isWorkDraft &&
				!sendDraft &&
				(isInline || isEmailDraft || isEmailSend || isEmailCompose)
			}
			data-tool-id={tool.id}
			className={cn(
				"group/tool min-w-0 rounded-xl border border-border/60 transition-colors duration-150 motion-reduce:transition-none",
				workEmail ? "bg-background" : "bg-muted/20",
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
						onClick={(event) => {
							if (sendDraft && workEmail) {
								workEmail.composer.requestEmailDraft(
									sendDraft.seed,
								);
								return;
							}
							if (isEmailCompose && workEmail) {
								const editorId =
									asString(tool.arguments.openEmailId) ||
									composeDraftId(tool.id);
								const draft = workEmail.composer
									.getSnapshot()
									.emailDrafts.find(
										(item) => item.seed.id === editorId,
									);
								if (draft)
									workEmail.composer.requestEmailDraft(
										draft.seed,
									);
								return;
							}
							if (isWorkDraft && workEmail) {
								workEmail.openEmail(
									tool.id,
									"tool",
									event.currentTarget,
								);
								return;
							}
							if (isInline) closeTool(tool.id);
							else if (opensInline) openInline(tool.id);
							else openWorkbench(tool.id);
						}}
						aria-expanded={
							!isWorkDraft && opensInline ? isInline : undefined
						}
						aria-controls={isInline ? detailId : undefined}
						aria-label={
							isWorkDraft || sendDraft
								? `Open email draft: ${title || draftLabel}`
								: `${title} details${opensInline ? "" : " in workbench"}${tool.status === "FAILED" ? " - failed" : ""}`
						}
						{...(tool.status !== "FAILED"
							? { "aria-describedby": statusId }
							: {})}
					>
						<span
							className={cn(
								"flex size-4 shrink-0 items-center justify-center",
								details.iconClassName,
								workEmail && "size-8 rounded-lg bg-muted",
								workEmail &&
									tool.status === "COMPLETED" &&
									"bg-success/10 text-success",
								workEmail &&
									tool.status === "FAILED" &&
									"bg-destructive/10 text-destructive",
								workEmail &&
									tool.status === "INPUT_REQUIRED" &&
									"bg-warning/10 text-warning",
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
								{heading}
							</Muted>
							{draftPreview && draftTo && (
								<Muted className="w-full truncate text-xs">
									To {draftTo}
								</Muted>
							)}
							<Muted
								id={statusId}
								className={cn(
									"wrap-anywhere text-xs",
									workEmail &&
										tool.status === "COMPLETED" &&
										"text-success",
									tool.status === "FAILED" &&
										"text-destructive",
									tool.status === "INPUT_REQUIRED" &&
										"text-warning",
								)}
							>
								{status}
							</Muted>
						</span>
						{isWorkDraft ? (
							<ArrowUpRight
								aria-hidden="true"
								className="size-4 shrink-0 text-muted-foreground"
							/>
						) : opensInline ? (
							<ChevronDown
								aria-hidden="true"
								className={cn(
									"size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
									isInline && "rotate-180",
								)}
							/>
						) : (
							<Muted className="shrink-0 text-xs">Details</Muted>
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
				{!isWorkDraft && !sendDraft && (
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
				)}
			</div>
			{sendDraft && pendingApproval && workEmail && (
				<EmailSendActions
					draft={sendDraft}
					onSend={() => workEmail.composer.requestSend(sendDraft)}
					onReject={() => onRejectTool(pendingApproval)}
				/>
			)}
			<CollapsibleContent
				id={detailId}
				className="overflow-hidden duration-200 ease-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down motion-reduce:animate-none"
			>
				{approval && isRequest ? (
					<DelegationRequestApproval tool={tool} action={approval} />
				) : approval ? (
					<DelegationSubmitApproval tool={tool} action={approval} />
				) : isEmailDraft || isEmailSend || isEmailCompose ? (
					<EmailDraftCard
						tool={tool}
						mode={
							isEmailSend
								? "send"
								: isEmailCompose
									? "compose"
									: "draft"
						}
					/>
				) : (
					<ToolInline toolId={tool.id} />
				)}
			</CollapsibleContent>
		</Collapsible>
	);
}
