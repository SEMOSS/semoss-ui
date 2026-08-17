import { Loader2Icon, PaperclipIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { isTerminalAgentRunStatus } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Markdown,
	Spinner,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks/use-workbench";
import type {
	BuildAttachment,
	BuildMessage,
	BuildRun,
	BuildTool,
} from "@/stores/workbench";
import { isRequestUserInputAction } from "@/stores/workbench";
import { parseTime } from "./workbench-chat-format";
import { WorkbenchChatPendingActions } from "./workbench-chat-pending-actions";
import { WorkbenchChatSubagent } from "./workbench-chat-subagent";
import { WorkbenchChatToolPhase } from "./workbench-chat-tool-phase";
import { WorkbenchChatUserInputCard } from "./workbench-chat-user-input-card";

/** A single run event (message, tool call, or child run) before grouping. */
type Activity =
	| {
			kind: "message";
			timestamp: string;
			order: number;
			message: BuildMessage;
	  }
	| { kind: "tool"; timestamp: string; order: number; tool: BuildTool }
	| { kind: "child"; timestamp: string; order: number; childRunId: string };

/** A feed item after consecutive tool calls are grouped into phases. */
type FeedActivity =
	| {
			kind: "message";
			timestamp: string;
			order: number;
			message: BuildMessage;
	  }
	| { kind: "phase"; timestamp: string; order: number; tools: BuildTool[] }
	| { kind: "child"; timestamp: string; order: number; childRunId: string };

interface AttachmentChipsProps {
	/** Files the user attached to the submitted prompt */
	attachments: BuildAttachment[];
}

/**
 * Compact attachment chips rendered above the user bubble text. Renders
 * nothing when the run has no attachments.
 *
 * @name AttachmentChips
 * @param attachments - Files the user attached to the submitted prompt.
 * @return The row of attachment chips, or null when there are none.
 */
const AttachmentChips = ({ attachments }: AttachmentChipsProps) => {
	if (!attachments.length) return null;

	return (
		<div className="mb-2 flex flex-wrap justify-end gap-1">
			{attachments.map((attachment, index) => (
				<span
					key={`${attachment.fileLocation ?? attachment.fileName}-${index}`}
					className="inline-flex max-w-full items-center gap-1 rounded-sm border border-border bg-background/70 px-2 py-1 text-xs"
					title={attachment.fileName}
				>
					<PaperclipIcon className="size-3 shrink-0" />
					<span className="min-w-0 truncate">
						{attachment.fileName}
					</span>
				</span>
			))}
		</div>
	);
};

interface ThinkingBlockProps {
	/** The reasoning message whose text fills the collapsible body */
	message: BuildMessage;
}

/**
 * Collapsed-by-default "Thinking" block for `kind: "reasoning"` messages.
 * Shows a spinner in the trigger while the reasoning is still streaming.
 *
 * @name ThinkingBlock
 * @param message - The reasoning message whose text fills the body.
 * @return The collapsible thinking block.
 */
const ThinkingBlock = ({ message }: ThinkingBlockProps) => {
	const [open, setOpen] = useState(false);

	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className="overflow-hidden rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground text-xs shadow-xs"
		>
			<CollapsibleTrigger className="flex cursor-pointer items-center gap-2 font-medium">
				Thinking
				{!message.completed ? <Spinner className="size-3" /> : null}
			</CollapsibleTrigger>
			<CollapsibleContent>
				<div className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap">
					{message.text}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
};

interface FeedItemsProps {
	/** The run whose messages, tools, and child runs are rendered */
	run: BuildRun;
}

/**
 * Flat sequence of one run's activity: assistant messages, collapsed thinking
 * blocks, tool phases (consecutive tools grouped), delegated subagents, and —
 * while input is required — pending review actions and structured user-input
 * forms. Also used (via the subagent's `renderFeed` prop) for nested child
 * runs, which render items only.
 *
 * @name FeedItems
 * @param run - The run whose messages, tools, and child runs are rendered.
 * @return The ordered activity feed for the run.
 */
const FeedItems = ({ run }: FeedItemsProps) => {
	const runs = useWorkbench((state) => state.chat.runs);

	const activities = useMemo<Activity[]>(() => {
		const items: Activity[] = [];
		run.messages.forEach((message, order) => {
			items.push({
				kind: "message",
				timestamp: message.timestamp,
				order,
				message,
			});
		});
		run.tools.forEach((tool, order) => {
			items.push({
				kind: "tool",
				timestamp: tool.timestamp,
				order: run.messages.length + order,
				tool,
			});
		});
		run.childRunIds.forEach((childRunId, order) => {
			items.push({
				kind: "child",
				timestamp: runs[childRunId]?.dateCreated ?? "",
				order: run.messages.length + run.tools.length + order,
				childRunId,
			});
		});
		return items.sort(
			(a, b) =>
				parseTime(a.timestamp) - parseTime(b.timestamp) ||
				a.order - b.order,
		);
	}, [run.childRunIds, run.messages, run.tools, runs]);

	const feedActivities = useMemo<FeedActivity[]>(() => {
		const feed: FeedActivity[] = [];
		let phaseTools: BuildTool[] = [];
		let phaseTimestamp = "";
		let phaseOrder = 0;

		const flushPhase = () => {
			if (phaseTools.length === 0) return;
			feed.push({
				kind: "phase",
				timestamp: phaseTimestamp,
				order: phaseOrder,
				tools: phaseTools,
			});
			phaseTools = [];
			phaseTimestamp = "";
		};

		for (const activity of activities) {
			if (activity.kind === "tool") {
				if (phaseTools.length === 0) {
					phaseTimestamp = activity.timestamp;
					phaseOrder = activity.order;
				}
				phaseTools.push(activity.tool);
				continue;
			}
			flushPhase();
			feed.push(activity);
		}
		flushPhase();
		return feed;
	}, [activities]);

	const inputRequired = run.status.toUpperCase() === "INPUT_REQUIRED";
	const userInputActions = run.pendingActions.filter(
		isRequestUserInputAction,
	);
	const finalAlreadyShown = run.messages.some(
		(message) =>
			run.finalText && message.text.trim() === run.finalText.trim(),
	);

	return (
		<div className="flex flex-col gap-2">
			{feedActivities.map((activity) => (
				<div
					key={`${activity.kind}-${
						activity.kind === "message"
							? activity.message.id
							: activity.kind === "phase"
								? activity.tools[0].id
								: activity.childRunId
					}`}
				>
					{activity.kind === "message" ? (
						activity.message.kind === "reasoning" ? (
							<ThinkingBlock message={activity.message} />
						) : (
							<div className="min-w-0 text-sm leading-6">
								<Markdown>{activity.message.text}</Markdown>
							</div>
						)
					) : activity.kind === "phase" ? (
						<WorkbenchChatToolPhase tools={activity.tools} />
					) : (
						<WorkbenchChatSubagent
							childRunId={activity.childRunId}
							renderFeed={(childRun) => (
								<FeedItems run={childRun} />
							)}
						/>
					)}
				</div>
			))}

			{inputRequired ? (
				<div className="flex flex-col gap-2">
					<WorkbenchChatPendingActions run={run} />
					{userInputActions.map((action, index) => (
						<WorkbenchChatUserInputCard
							key={action.actionId ?? `input-${index}`}
							run={run}
							action={action}
						/>
					))}
				</div>
			) : null}

			{run.finalText && !finalAlreadyShown ? (
				<div className="min-w-0 text-sm leading-6">
					<Markdown>{run.finalText}</Markdown>
				</div>
			) : null}

			{run.parentRunId && run.errorMessage ? (
				<Alert variant="destructive" className="w-auto">
					<AlertDescription>
						<span className="wrap-break-word">
							{run.errorMessage}
						</span>
					</AlertDescription>
				</Alert>
			) : null}

			{run.droppedEvents > 0 ? (
				<p className="text-muted-foreground text-xs">
					Some live updates were unavailable; this view was reconciled
					from saved messages.
				</p>
			) : null}
		</div>
	);
};

interface WorkbenchChatTurnProps {
	/** ID of the run to render; resolved against the chat slice's run map */
	runId: string;
}

/**
 * One turn of the room conversation, rendered flat like a normal chat: the
 * right-aligned user bubble (with attachment chips), the run's activity in
 * order, an error alert on failure, and a trailing working indicator while
 * the run is still in flight. Renders nothing when the run ID is unknown.
 *
 * @name WorkbenchChatTurn
 * @param runId - ID of the run to render from the chat slice's run map.
 * @return The rendered conversation turn, or null for an unknown run.
 */
export const WorkbenchChatTurn = ({ runId }: WorkbenchChatTurnProps) => {
	const run = useWorkbench((state) => state.chat.runs[runId]);

	if (!run) return null;

	const status = run.status.toUpperCase();
	const failed = ["FAILED", "CANCELLED"].includes(status);
	const working = !isTerminalAgentRunStatus(run.status);

	return (
		<section className="flex flex-col gap-2">
			<div className="ms-auto flex w-full max-w-[85%] flex-col items-end">
				<div className="w-fit max-w-full rounded-lg bg-accent px-4 py-3 leading-normal">
					<AttachmentChips attachments={run.attachments} />
					<p className="wrap-break-word whitespace-pre-wrap text-sm">
						{run.input}
					</p>
				</div>
			</div>

			<FeedItems run={run} />

			{failed && run.errorMessage ? (
				<Alert variant="destructive" className="w-auto">
					<AlertDescription>
						<span className="wrap-break-word">
							{run.errorMessage}
						</span>
					</AlertDescription>
				</Alert>
			) : null}

			{working ? (
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Loader2Icon className="size-4 animate-spin" />
					<span>Working...</span>
				</div>
			) : null}
		</section>
	);
};
