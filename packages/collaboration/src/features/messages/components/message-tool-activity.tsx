import { Fragment, useId, useState } from "react";
import { cn } from "@semoss/ui/next";
import { ToolCallCard } from "@/features/tools/components/tool-call-card";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import {
	completedToolGroups,
	type OwnedMessagePart,
} from "../utils/message-presentation";
import { MessagePart } from "./message-part";
import { MessageToolSummary } from "./message-tool-summary";
import {
	isSubAgentTool,
	SubAgentBatchSummary,
} from "./sub-agent-batch-summary";

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
	const resolved = items.map((item) =>
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
	// Sub-agent spawn/wait/status calls fold into one batch line instead of a row
	// of orchestration tool cards; everything else renders as before.
	const subAgentTools = resolved.flatMap(({ part }) =>
		part.type === "tool" && isSubAgentTool(part.tool) ? [part.tool] : [],
	);
	const tools = resolved.filter(
		({ part }) => !(part.type === "tool" && isSubAgentTool(part.tool)),
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
			{subAgentTools.length > 0 && (
				<SubAgentBatchSummary tools={subAgentTools} />
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

function isWorking(items: OwnedMessagePart[]): boolean {
	const message = items.at(-1)?.message;
	const phase = message?.live?.phase;
	if (!phase || SETTLED.has(phase)) return false;
	return !message.parts.some(
		(part) =>
			part.type === "text" && part.state === "active" && part.text.trim(),
	);
}
