import {
	Alert,
	AlertDescription,
	Badge,
	Button,
	cn,
	H4,
	Muted,
	P,
	Spinner,
} from "@semoss/ui/next";
import { threadFromMessages } from "@/features/messages/utils/thread-items";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { useRunDetail } from "../api/use-run-detail";
import { ChildAgentRunCard } from "./child-agent-run-card";
import { RunInspectorMessage } from "./run-inspector-message";

/** Durable run details shared by inline child runs and the workbench inspector. */
export function RunDetails({
	runId,
	isActive,
	isInline = false,
}: {
	/** Original run identity, including nested children. */
	runId: string;
	/** Read only while the owning disclosure or workbench panel is visible. */
	isActive: boolean;
	/** The inline card already supplies the run identity and parent context. */
	isInline?: boolean;
}) {
	const { insightId, openRun, pendingApprovals, openWorkbench } =
		useToolWorkbench();
	const detail = useRunDetail(insightId, runId, isActive);
	const run = detail.run;
	return (
		<section
			className={cn(
				"min-w-0 space-y-4",
				isInline
					? "wrap-anywhere border-border/50 border-t p-3"
					: "size-full overflow-auto p-4",
			)}
			aria-label="Agent run details"
		>
			{detail.isLoading && (
				<Spinner
					aria-label="Loading run"
					className="motion-reduce:animate-none"
				/>
			)}
			{detail.error && (
				<Alert variant="destructive">
					<AlertDescription>
						{detail.error}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={detail.retry}
						>
							Retry
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{run && (
				<>
					{!isInline && (
						<div className="flex flex-wrap items-center justify-between gap-2">
							<H4>
								{run.workspaceName ||
									run.executorLabel ||
									"Agent run"}
							</H4>
							<Badge
								variant={
									run.status === "FAILED"
										? "destructive"
										: "outline"
								}
							>
								{run.status.toLowerCase().replaceAll("_", " ")}
							</Badge>
						</div>
					)}
					<div className="space-y-1">
						<Muted className="block break-all text-xs">
							Run {run.runId}
						</Muted>
						{run.startedAt && (
							<Muted className="block text-xs">
								Started: {run.startedAt}
								{run.completedAt
									? ` · Finished: ${run.completedAt}`
									: ""}
							</Muted>
						)}
					</div>
					{!isInline && run.parentRunId && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => openRun(run.parentRunId ?? "")}
						>
							Inspect parent run
						</Button>
					)}
					{run.input && (
						<div>
							<H4>Task</H4>
							<P className="whitespace-pre-wrap break-words text-sm">
								{run.input}
							</P>
						</div>
					)}
					{run.errorMessage && (
						<Alert variant="destructive">
							<AlertDescription>
								{run.errorMessage}
							</AlertDescription>
						</Alert>
					)}
					{pendingApprovals
						.filter((action) => action.runId === run.runId)
						.map((action) => (
							<Button
								key={action.actionId ?? action.toolId}
								type="button"
								variant="outline"
								onClick={() => openWorkbench(action.toolId)}
							>
								{action.requiresResponse
									? "Answer questions"
									: `Review ${action.toolName}`}
							</Button>
						))}
					{detail.children.length > 0 && (
						<div className="space-y-3">
							<H4>Child runs</H4>
							{detail.children.map((child) => (
								<ChildAgentRunCard
									key={child.runId}
									run={{ ...child, parentRunId: run.runId }}
								/>
							))}
						</div>
					)}
					<div className="space-y-3">
						<H4>Conversation</H4>
						{threadFromMessages(run.messages ?? []).map(
							(message) => (
								<RunInspectorMessage
									key={message.id}
									message={message}
								/>
							),
						)}
						{!run.messages?.length && (
							<P className="wrap-anywhere whitespace-pre-wrap text-sm">
								{run.finalText || "No saved messages yet."}
							</P>
						)}
					</div>
				</>
			)}
		</section>
	);
}
