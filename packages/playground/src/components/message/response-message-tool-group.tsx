import {
	CheckIcon,
	ChevronDownIcon,
	CircleAlertIcon,
	WrenchIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	cn,
	Muted,
	Spinner,
} from "@semoss/ui/next";
import type { ToolStore } from "@/stores/tool/tool.store";
import { isAskExecutionMode } from "@/utility/mcp-utils";
import { ResponseMessageTool } from "./response-message-tool";

export interface ResponseMessageToolGroupProps {
	/** Consecutive tools in transcript order. */
	tools: ToolStore[];
}

/** Standalone tools, or grouped activity with independently visible decisions. */
export const ResponseMessageToolGroup = observer(
	({ tools }: ResponseMessageToolGroupProps) => {
		const { t } = useTranslation("tool");
		const [manualOpen, setManualOpen] = useState<boolean | null>(null);
		const visibleTools = tools.filter((tool) => tool.display !== "hidden");
		const needsDecision = (tool: ToolStore): boolean =>
			Boolean(tool.pendingAction) ||
			(tool.isResolved &&
				tool.status === "INITIAL" &&
				isAskExecutionMode(tool.json._meta?.SMSS_MCP_EXECUTION));
		const pending = visibleTools.filter(needsDecision);
		const activity = visibleTools.filter((tool) => !needsDecision(tool));
		const isRunning = visibleTools.some(
			(tool) =>
				!tool.isResolved ||
				tool.status === "LOADING" ||
				tool.status === "INITIAL",
		);
		const hasError = visibleTools.some((tool) => tool.status === "ERROR");
		const hasCancelled = visibleTools.some(
			(tool) => tool.status === "CANCELLED",
		);
		const isOpen =
			manualOpen ?? (isRunning || hasError || pending.length > 0);
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
		return (
			<div className="flex min-w-0 flex-col gap-2">
				<Collapsible
					open={isOpen}
					onOpenChange={setManualOpen}
					className="overflow-hidden rounded-lg border bg-background"
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
								{t(`status.${status}`)}
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
								<ResponseMessageTool
									key={tool.id}
									tool={tool}
								/>
							))}
						</div>
					</CollapsibleContent>
				</Collapsible>
				{pending.map((tool) => (
					<ResponseMessageTool key={tool.id} tool={tool} isLarge />
				))}
			</div>
		);
	},
);
