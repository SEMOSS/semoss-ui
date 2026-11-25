import { Fragment, useId, useState } from "react";
import { cn, Muted } from "@semoss/ui/next";
import { ChildAgentRunCard } from "@/features/runs/components/child-agent-run-card";
import { ToolCallCard } from "@/features/tools/components/tool-call-card";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import {
	completedToolGroups,
	type OwnedMessagePart,
} from "../utils/message-presentation";
import { MessagePart } from "./message-part";
import { MessageToolSummary } from "./message-tool-summary";

/** Finished tool summaries keep each keyed row mounted, preserving UI and focus. */
export function MessageToolActivity({
	items,
	agentName = "",
}: {
	items: OwnedMessagePart[];
	/** For a folded thinking part's run card. */
	agentName?: string;
}) {
	const workbench = useToolWorkbench();
	const regionId = useId();
	const [expandedTools, setExpandedTools] = useState<Set<string>>(
		() => new Set(),
	);
	const [focusedTool, setFocusedTool] = useState<string | null>(null);
	const [openMenus, setOpenMenus] = useState<Set<string>>(() => new Set());
	// Use controller/approval overlays just as the workbench does.
	const tools = items.map((item) =>
		item.part.type === "tool"
			? {
					...item,
					part: {
						...item.part,
						tool:
							workbench.tools[item.part.tool.id] ??
							item.part.tool,
					},
				}
			: item,
	);
	const pinnedIds = new Set<string>();
	for (const { part } of tools) {
		if (part.type !== "tool") continue;
		const displayMode = workbench.getToolDisplayMode(part.tool.id);
		// a found file or email folds too; its Open is in the steps and the answer links it
		if (
			displayMode === "inline" ||
			(displayMode === "workbench" && workbench.isOpen) ||
			(!expandedTools.has(part.tool.id) &&
				(focusedTool === part.tool.id || openMenus.has(part.tool.id)))
		)
			pinnedIds.add(part.tool.id);
	}
	// while the turn works, the latest steps stay in view and the earlier ones fold
	const groups = completedToolGroups(
		isWorking(items) ? tools.slice(0, -LIVE_STEPS) : tools,
		pinnedIds,
	);
	const groupByKey = new Map(
		groups.flatMap((group) =>
			group.map((item) => [item.key, group] as const),
		),
	);

	function toggleGroup(group: OwnedMessagePart[], isOpen: boolean): void {
		setExpandedTools((current) => {
			const next = new Set(current);
			for (const { part } of group) {
				if (part.type === "tool") {
					if (isOpen) next.delete(part.tool.id);
					else next.add(part.tool.id);
				}
			}
			return next;
		});
	}

	const runItems = items.filter((item) => item.part.type === "run");

	return (
		<div
			className="min-w-0"
			data-scroll-anchor={`tools-${items[0]?.key}`}
			onFocusCapture={(event) => {
				const target =
					event.target.closest<HTMLElement>("[data-tool-id]");
				setFocusedTool(target?.dataset.toolId ?? null);
			}}
			onBlurCapture={(event) => {
				if (
					!(event.relatedTarget instanceof Element) ||
					!event.currentTarget.contains(event.relatedTarget)
				)
					setFocusedTool(null);
			}}
		>
			{runItems.length > 0 && (
				<div
					className="overflow-hidden rounded-xl border border-border/60"
					data-scroll-anchor={`runs-${runItems[0]?.key}`}
				>
					<div className="flex items-center gap-2 border-border/60 border-b bg-muted/40 px-3.5 py-2">
						{runItems.some(
							({ part }) =>
								part.type === "run" &&
								part.run.status !== "COMPLETED" &&
								part.run.status !== "FAILED" &&
								part.run.status !== "CANCELLED",
						) && (
							<span
								aria-hidden="true"
								className="size-1.5 shrink-0 animate-pulse rounded-full bg-primary"
							/>
						)}
						<Muted className="font-medium text-xs">
							{runItems.length === 1
								? "1 sub-agent"
								: `${runItems.length} sub-agents`}
						</Muted>
						<span className="text-border/80">·</span>
						<Muted className="text-xs">
							{runStatusSummary(runItems)}
						</Muted>
						<RunStatusDots items={runItems} />
					</div>
					{runItems.map((item) =>
						item.part.type === "run" ? (
							<ChildAgentRunCard
								key={item.key}
								run={item.part.run}
							/>
						) : null,
					)}
				</div>
			)}
			{tools.map((item) => {
				if (item.part.type !== "tool" && item.part.type !== "thinking")
					return null;
				const tool =
					item.part.type === "tool" ? item.part.tool : undefined;
				const group = groupByKey.get(item.key);
				const isExpanded =
					!group ||
					group.some(
						({ part }) =>
							part.type === "tool" &&
							expandedTools.has(part.tool.id),
					);
				const isStart = group?.[0]?.key === item.key;
				return (
					<Fragment key={item.key}>
						{group && isStart && (
							<MessageToolSummary
								items={group}
								isExpanded={isExpanded}
								controls={group
									.map(
										(member) => `${regionId}-${member.key}`,
									)
									.join(" ")}
								onToggle={() => toggleGroup(group, isExpanded)}
							/>
						)}
						<div
							id={`${regionId}-${item.key}`}
							className={cn(
								"grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
								isExpanded
									? "grid-rows-[1fr] opacity-100"
									: "grid-rows-[0fr] opacity-0",
							)}
							inert={!isExpanded}
							aria-hidden={!isExpanded}
						>
							<div className="min-h-0 overflow-hidden">
								<div
									className="py-1"
									data-scroll-anchor={item.key}
								>
									{tool ? (
										<ToolCallCard
											tool={tool}
											createdAt={item.message.createdAt}
											onMenuOpenChange={(isOpen) =>
												setOpenMenus((current) => {
													const next = new Set(
														current,
													);
													if (isOpen)
														next.add(tool.id);
													else next.delete(tool.id);
													return next;
												})
											}
										/>
									) : (
										<MessagePart
											part={item.part}
											role={item.message.role}
											phase={item.message.live?.phase}
											createdAt={item.message.createdAt}
											agentName={agentName}
										/>
									)}
								</div>
							</div>
						</div>
					</Fragment>
				);
			})}
		</div>
	);
}

const LIVE_STEPS = 2;

const SETTLED = new Set(["completed", "failed", "cancelled"]);

function runCounts(items: OwnedMessagePart[]) {
	const counts = { done: 0, running: 0, waiting: 0, failed: 0 };
	for (const { part } of items) {
		if (part.type !== "run") continue;
		const s = part.run.status;
		if (s === "COMPLETED") counts.done++;
		else if (s === "INPUT_REQUIRED") counts.waiting++;
		else if (s === "FAILED" || s === "CANCELLED") counts.failed++;
		else counts.running++;
	}
	return counts;
}

function runStatusSummary(items: OwnedMessagePart[]): string {
	const counts = runCounts(items);
	const parts: string[] = [];
	if (counts.done) parts.push(`${counts.done} done`);
	if (counts.running) parts.push(`${counts.running} running`);
	if (counts.waiting) parts.push(`${counts.waiting} waiting for you`);
	if (counts.failed) parts.push(`${counts.failed} failed`);
	return parts.join(" · ") || "complete";
}

function RunStatusDots({ items }: { items: OwnedMessagePart[] }) {
	const { done, running, waiting, failed } = runCounts(items);
	return (
		<span aria-hidden="true" className="ml-auto flex items-center gap-1">
			{done > 0 && <span className="size-1.5 rounded-full bg-success" />}
			{running > 0 && (
				<span className="size-1.5 animate-pulse rounded-full bg-primary" />
			)}
			{waiting > 0 && (
				<span className="size-1.5 animate-pulse rounded-full bg-warning" />
			)}
			{failed > 0 && (
				<span className="size-1.5 rounded-full bg-destructive" />
			)}
		</span>
	);
}

function isWorking(items: OwnedMessagePart[]): boolean {
	const message = items.at(-1)?.message;
	const phase = message?.live?.phase;
	if (!phase || SETTLED.has(phase)) return false;
	return !message.parts.some(
		(part) =>
			part.type === "text" && part.state === "active" && part.text.trim(),
	);
}
