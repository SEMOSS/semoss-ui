import {
	BotIcon,
	ChevronRightIcon,
	CircleAlertIcon,
	ClockIcon,
	CopyIcon,
	PaperclipIcon,
	SparklesIcon,
	WrenchIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { useWorkbench } from "@/hooks/use-workbench";
import type {
	BuildAttachment,
	BuildMessage,
	BuildRun,
	BuildTool,
} from "@/stores/workbench";
import {
	isRequestUserInputAction,
	isTerminalAgentRunStatus,
} from "@/stores/workbench";
import {
	formatLongMs,
	formatTime,
	parseTime,
} from "./workbench-assistant-format";
import { WorkbenchAssistantMarkdown } from "./workbench-assistant-markdown";
import { WorkbenchAssistantPendingActions } from "./workbench-assistant-pending-actions";
import { WorkbenchAssistantSubagent } from "./workbench-assistant-subagent";
import { WorkbenchAssistantToolPhase } from "./workbench-assistant-tool-phase";
import { isPendingUserInputTool } from "./workbench-assistant-tools";
import { WorkbenchAssistantUserInputCard } from "./workbench-assistant-user-input-card";

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

interface RailRowProps {
	/** Marker rendered on the timeline rail beside this row */
	marker: ReactNode;
	/** Row content rendered to the right of the rail */
	children: ReactNode;
}

/**
 * One row on the run's timeline rail: a fixed marker column (whose background
 * masks the vertical rail line) beside the row content.
 *
 * @name RailRow
 * @param marker - Marker rendered on the rail beside this row.
 * @param children - Row content rendered to the right of the rail.
 * @return The rail-aligned row.
 */
const RailRow = ({ marker, children }: RailRowProps) => (
	<div className="relative flex gap-3">
		<span className="relative z-10 mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-background">
			{marker}
		</span>
		<div className="min-w-0 flex-1">{children}</div>
	</div>
);

/**
 * The default rail marker: a small neutral dot, used for assistant text and
 * thinking rows.
 *
 * @name DotMarker
 * @return The dot marker.
 */
const DotMarker = () => (
	<span className="size-2 rounded-full bg-muted-foreground/40" />
);

interface FeedItemsProps {
	/** The run whose messages, tools, and child runs are rendered */
	run: BuildRun;
	/** Renders without the timeline rail (nested subagent feeds) */
	nested?: boolean;
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
const FeedItems = ({ run, nested = false }: FeedItemsProps) => {
	const runs = useWorkbench((state) => state.assistant.runs);

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
			// The pending action is authoritative while paused. After a page
			// refresh, durable message reconstruction can label this tool as
			// QUEUED even though its structured input card is already visible.
			if (isPendingUserInputTool(tool, run.pendingActions)) {
				return;
			}
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
	}, [run.childRunIds, run.messages, run.pendingActions, run.tools, runs]);

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
	const showFinal = Boolean(run.finalText) && !finalAlreadyShown;

	const activityKey = (activity: FeedActivity): string =>
		`${activity.kind}-${
			activity.kind === "message"
				? activity.message.id
				: activity.kind === "phase"
					? activity.tools[0].id
					: activity.childRunId
		}`;

	const activityMarker = (activity: FeedActivity): ReactNode => {
		if (activity.kind === "phase") {
			return <WrenchIcon className="size-3.5 text-muted-foreground" />;
		}
		if (activity.kind === "child") {
			return <BotIcon className="size-3.5 text-muted-foreground" />;
		}
		return <DotMarker />;
	};

	const activityContent = (activity: FeedActivity): ReactNode =>
		activity.kind === "message" ? (
			activity.message.kind === "reasoning" ? (
				<ThinkingBlock message={activity.message} />
			) : (
				<div className="min-w-0 text-sm">
					<WorkbenchAssistantMarkdown>
						{activity.message.text}
					</WorkbenchAssistantMarkdown>
				</div>
			)
		) : activity.kind === "phase" ? (
			<WorkbenchAssistantToolPhase tools={activity.tools} />
		) : (
			<WorkbenchAssistantSubagent
				childRunId={activity.childRunId}
				renderFeed={(childRun) => <FeedItems run={childRun} nested />}
			/>
		);

	const pendingBlock = inputRequired ? (
		<div className="flex flex-col gap-2">
			<WorkbenchAssistantPendingActions run={run} />
			{userInputActions.map((action, index) => (
				<WorkbenchAssistantUserInputCard
					key={action.actionId ?? `input-${index}`}
					run={run}
					action={action}
				/>
			))}
		</div>
	) : null;

	const finalBlock = showFinal ? (
		<div className="min-w-0 text-sm">
			<WorkbenchAssistantMarkdown>
				{run.finalText ?? ""}
			</WorkbenchAssistantMarkdown>
		</div>
	) : null;

	const errorBlock =
		run.parentRunId && run.errorMessage ? (
			<Alert variant="destructive" className="w-auto">
				<AlertDescription>
					<span className="wrap-break-word">{run.errorMessage}</span>
				</AlertDescription>
			</Alert>
		) : null;

	const droppedBlock =
		run.droppedEvents > 0 ? (
			<p className="text-muted-foreground text-xs">
				Some live updates were unavailable; this view was reconciled
				from saved messages.
			</p>
		) : null;

	const hasFeedContent =
		feedActivities.length > 0 ||
		Boolean(pendingBlock || finalBlock || errorBlock || droppedBlock);
	if (!hasFeedContent) return null;

	if (nested) {
		return (
			<div className="flex flex-col gap-2">
				{feedActivities.map((activity) => (
					<div key={activityKey(activity)}>
						{activityContent(activity)}
					</div>
				))}
				{pendingBlock}
				{finalBlock}
				{errorBlock}
				{droppedBlock}
			</div>
		);
	}

	return (
		<div className="relative flex flex-col gap-3">
			<span
				aria-hidden
				className="absolute top-2 bottom-2 left-3 w-px bg-border"
			/>
			{feedActivities.map((activity) => (
				<RailRow
					key={activityKey(activity)}
					marker={activityMarker(activity)}
				>
					{activityContent(activity)}
				</RailRow>
			))}
			{pendingBlock ? (
				<RailRow
					marker={
						<CircleAlertIcon className="size-3.5 text-primary" />
					}
				>
					{pendingBlock}
				</RailRow>
			) : null}
			{finalBlock ? (
				<RailRow marker={<DotMarker />}>{finalBlock}</RailRow>
			) : null}
			{errorBlock ? (
				<RailRow marker={<DotMarker />}>{errorBlock}</RailRow>
			) : null}
			{droppedBlock ? (
				<RailRow marker={<DotMarker />}>{droppedBlock}</RailRow>
			) : null}
		</div>
	);
};

/** Display name for the assistant in run headers. */
const ASSISTANT_LABEL = "Assistant";

interface RunHeaderProps {
	/** The run whose identity, status, and duration are rendered */
	run: BuildRun;
}

/**
 * The run's header row: assistant icon and name, a status label colored by
 * outcome, and the run duration — ticking each second while the run is still
 * working, frozen at the recorded duration once it ends.
 *
 * @name RunHeader
 * @param run - The run whose identity, status, and duration are rendered.
 * @return The run header row.
 */
const RunHeader = ({ run }: RunHeaderProps) => {
	const status = run.status.toUpperCase();
	const working =
		!isTerminalAgentRunStatus(run.status) && status !== "INPUT_REQUIRED";

	const [nowMs, setNowMs] = useState(() => Date.now());
	useEffect(() => {
		if (!working) return;
		const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, [working]);

	const startMs = parseTime(run.startedAt || run.dateCreated);
	const endMs = working ? nowMs : parseTime(run.completedAt);
	const durationMs = startMs > 0 && endMs > startMs ? endMs - startMs : 0;

	const meta = working
		? { label: "Working", className: "text-muted-foreground" }
		: status === "INPUT_REQUIRED"
			? { label: "Needs input", className: "text-primary" }
			: status === "COMPLETED"
				? { label: "Completed", className: "text-success" }
				: status === "CANCELLED"
					? { label: "Cancelled", className: "text-muted-foreground" }
					: { label: "Failed", className: "text-destructive" };

	return (
		<div className="flex items-center gap-2 text-sm">
			<span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
				<SparklesIcon className="size-3.5" />
			</span>
			<span className="font-semibold">{ASSISTANT_LABEL}</span>
			<span className="text-muted-foreground">·</span>
			<span className={cn("font-medium", meta.className)}>
				{meta.label}
			</span>
			{working ? <Spinner className="size-3" /> : null}
			{durationMs >= 1000 ? (
				<span className="flex items-center gap-1 text-muted-foreground text-xs">
					<ClockIcon className="size-3.5" />
					{formatLongMs(durationMs)}
				</span>
			) : null}
		</div>
	);
};

interface RunFailureDetailsProps {
	/** The failed run whose identifiers are rendered */
	run: BuildRun;
}

/**
 * Collapsed-by-default diagnostic rows under a failure alert — run/room ids,
 * status, and model — with a copy action so the user can hand the details to
 * whoever debugs the backend.
 *
 * @name RunFailureDetails
 * @param run - The failed run whose identifiers are rendered.
 * @return The collapsible details block.
 */
const RunFailureDetails = ({ run }: RunFailureDetailsProps) => {
	const [open, setOpen] = useState(false);

	const rows: [string, string][] = [
		["Status", run.status],
		["Run ID", run.runId],
		["Room ID", run.roomId],
	];
	if (run.modelId) rows.push(["Model", run.modelId]);

	const copyDetails = async () => {
		const text = [
			...rows.map(([label, value]) => `${label}: ${value}`),
			`Error: ${run.errorMessage ?? ""}`,
		].join("\n");
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Run details copied.");
		} catch {
			toast.error("Unable to copy run details.");
		}
	};

	return (
		<Collapsible open={open} onOpenChange={setOpen} className="mt-2">
			<CollapsibleTrigger className="flex cursor-pointer items-center gap-1 font-medium text-xs">
				<ChevronRightIcon
					className={cn(
						"size-3 transition-transform",
						open && "rotate-90",
					)}
				/>
				Run details
			</CollapsibleTrigger>
			<CollapsibleContent>
				<dl className="mt-1 flex flex-col gap-0.5 font-mono text-xs">
					{rows.map(([label, value]) => (
						<div key={label} className="flex gap-2">
							<dt className="shrink-0 opacity-70">{label}:</dt>
							<dd className="min-w-0 break-all">{value}</dd>
						</div>
					))}
				</dl>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="mt-1 h-6 gap-1 px-1.5 text-xs"
					onClick={() => void copyDetails()}
				>
					<CopyIcon className="size-3" />
					Copy details
				</Button>
			</CollapsibleContent>
		</Collapsible>
	);
};

interface WorkbenchAssistantTurnProps {
	/** ID of the run to render; resolved against the assistant slice's run map */
	runId: string;
}

/**
 * One turn of the room conversation, rendered flat like a normal assistant: the
 * right-aligned user bubble (with attachment chips), the run's activity in
 * order, an error alert on failure, and a trailing working indicator while
 * the run is still in flight. Renders nothing when the run ID is unknown.
 *
 * @name WorkbenchAssistantTurn
 * @param runId - ID of the run to render from the assistant slice's run map.
 * @return The rendered conversation turn, or null for an unknown run.
 */
export const WorkbenchAssistantTurn = ({
	runId,
}: WorkbenchAssistantTurnProps) => {
	const run = useWorkbench((state) => state.assistant.runs[runId]);

	if (!run) return null;

	const status = run.status.toUpperCase();
	const failed = ["FAILED", "CANCELLED"].includes(status);
	const submittedAt = formatTime(run.dateCreated);

	return (
		<section className="flex flex-col gap-3">
			<div className="ms-auto flex w-full max-w-[85%] flex-col items-end gap-1">
				<span className="text-muted-foreground text-xs">
					You{submittedAt ? ` · ${submittedAt}` : ""}
				</span>
				<div className="w-fit max-w-full rounded-2xl bg-accent px-4 py-3 leading-normal">
					<AttachmentChips attachments={run.attachments} />
					<p className="wrap-break-word whitespace-pre-wrap text-sm">
						{run.input}
					</p>
				</div>
			</div>

			<RunHeader run={run} />

			<FeedItems run={run} />

			{failed && run.errorMessage ? (
				<Alert variant="destructive" className="w-auto">
					<AlertDescription>
						<span className="wrap-break-word">
							{run.errorMessage}
						</span>
						<RunFailureDetails run={run} />
					</AlertDescription>
				</Alert>
			) : null}
		</section>
	);
};
