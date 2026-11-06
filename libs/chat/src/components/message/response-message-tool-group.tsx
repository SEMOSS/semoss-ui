import {
	CheckIcon,
	ChevronDownIcon,
	CircleAlertIcon,
	WrenchIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { isAskExecutionMode, type ToolCallStore } from "@semoss/sdk";
import { useToolsSelector } from "@semoss/sdk/react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Muted,
	Spinner,
} from "@semoss/ui/next";
import { ResponseMessageTool } from "./response-message-tool";

export interface ResponseMessageToolGroupProps {
	/** Consecutive tools in transcript order. */
	tools: ToolCallStore[];
}

/**
 * Whether a call waits on the user: an agent run's pending decision, or a
 * chat call that asks and has not run.
 *
 * @param tool - The call.
 * @returns True while it waits.
 */
const needsDecision = (tool: ToolCallStore): boolean =>
	Boolean(tool.pendingAction) ||
	(tool.isResolved &&
		tool.status === "INITIAL" &&
		isAskExecutionMode(tool.json._meta?.SMSS_MCP_EXECUTION));

/** Standalone tools, or grouped activity with independently visible decisions. */
export const ResponseMessageToolGroup = ({
	tools,
}: ResponseMessageToolGroupProps) => {
	const { t } = useTranslation("tool");
	const [manualOpen, setManualOpen] = useState<boolean | null>(null);
	const {
		visibleTools,
		pending,
		activity,
		isRunning,
		failedCount,
		completedCount,
		hasCancelled,
	} = useToolsSelector(tools, (calls) => {
		const visible = calls.filter((tool) => tool.display !== "hidden");
		const decided = visible.filter((tool) => !needsDecision(tool));
		return {
			visibleTools: visible,
			pending: visible.filter(needsDecision),
			activity: decided,
			isRunning: visible.some(
				(tool) =>
					!tool.isResolved ||
					tool.status === "LOADING" ||
					tool.status === "INITIAL",
			),
			failedCount: decided.filter((tool) => tool.status === "ERROR")
				.length,
			completedCount: decided.filter((tool) => tool.status === "SUCCESS")
				.length,
			hasCancelled: visible.some((tool) => tool.status === "CANCELLED"),
		};
	});
	// a failed step is routine in an agent run; only call the group failed
	// when nothing in it worked
	const hasError = failedCount > 0 && completedCount === 0;
	const hasPartialError = failedCount > 0 && completedCount > 0;

	const isOpen = manualOpen ?? (isRunning || hasError || pending.length > 0);
	const status = pending.length
		? "waitingForInput"
		: isRunning
			? "running"
			: hasError
				? "failed"
				: hasCancelled
					? "cancelled"
					: "completed";
	const firstTool = visibleTools[0];
	if (!firstTool) return null;
	if (visibleTools.length === 1) {
		return (
			<ResponseMessageTool
				tool={firstTool}
				isLarge={needsDecision(firstTool)}
			/>
		);
	}
	// every call is waiting on the user, so there is no activity to summarize
	if (!activity.length) {
		return (
			<div className="flex min-w-0 flex-col gap-2">
				{pending.map((tool) => (
					<ResponseMessageTool key={tool.id} tool={tool} isLarge />
				))}
			</div>
		);
	}
	return (
		<div className="flex min-w-0 flex-col gap-2">
			<Collapsible
				open={isOpen}
				onOpenChange={setManualOpen}
				className="overflow-hidden rounded-lg border bg-accent/40 dark:bg-accent/20"
			>
				<CollapsibleTrigger asChild>
					<Button
						variant="ghost"
						size="sm"
						className="h-auto min-h-8 w-full justify-start gap-2 rounded-none px-2 py-1 text-start"
					>
						{hasError || pending.length ? (
							<CircleAlertIcon
								aria-hidden="true"
								className={
									hasError
										? "text-destructive"
										: "text-warning"
								}
							/>
						) : isRunning ? (
							<Spinner />
						) : hasCancelled ? (
							<WrenchIcon aria-hidden="true" />
						) : (
							<CheckIcon
								aria-hidden="true"
								className="text-success"
							/>
						)}
						<span className="min-w-0 flex-1 whitespace-normal break-words">
							{isOpen
								? t("activity.steps", {
										count: visibleTools.length,
									})
								: t("group.labelClosed", {
										toolName: firstTool.displayName,
										count: visibleTools.length - 1,
									})}
						</span>
						<Muted className="whitespace-normal text-xs">
							{hasPartialError && status === "completed"
								? [
										t("group.summaryCompleted", {
											count: completedCount,
										}),
										t("group.summaryError", {
											count: failedCount,
										}),
									].join(", ")
								: t(`status.${status}`)}
						</Muted>
						<ChevronDownIcon
							aria-hidden="true"
							className={cn(
								"transition-transform motion-reduce:transition-none",
								isOpen && "rotate-180",
							)}
						/>
					</Button>
				</CollapsibleTrigger>
				<CollapsibleContent
					forceMount
					className="border-t p-1 data-[state=closed]:hidden"
				>
					<div className="flex flex-col gap-0.5">
						{activity.map((tool) => (
							<ResponseMessageTool key={tool.id} tool={tool} />
						))}
					</div>
				</CollapsibleContent>
			</Collapsible>
			{pending.map((tool) => (
				<ResponseMessageTool key={tool.id} tool={tool} isLarge />
			))}
		</div>
	);
};
