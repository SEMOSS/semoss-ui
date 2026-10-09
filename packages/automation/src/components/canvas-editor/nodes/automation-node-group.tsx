import { Handle, type NodeProps, Position } from "@xyflow/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@semoss/ui/next";
import type { AutomationNode } from "../../../domain/automation.types";
import type { AutomationNodeGroup } from "../../../domain/automation-workflow.types";
import { getWorkflowNodeDisplay } from "../../../domain/automation-workflow-display";

export interface AutomationNodeGroupData extends Record<string, unknown> {
	group: AutomationNodeGroup;
	collapsed: boolean;
	members: AutomationNode[];
	memberCount: number;
	ports: Array<{
		id: string;
		type: "source" | "target";
		position: number;
	}>;
	onToggle: (groupId: string) => void;
	onSelect: (groupId: string) => void;
}

/** Visual-only frame behind the workflow nodes in a user-defined group. */
export function AutomationNodeGroupFrame({ data }: NodeProps) {
	const {
		group,
		collapsed,
		members,
		memberCount,
		ports,
		onToggle,
		onSelect,
	} = data as AutomationNodeGroupData;
	return (
		<div
			data-group-id={group.id}
			className={`pointer-events-none relative h-full w-full rounded-xl border-2 ${collapsed ? "border-border border-dashed bg-muted/30" : "border-primary/40 bg-primary/5"}`}
		>
			{collapsed &&
				ports.map((port) => (
					<Handle
						key={port.id}
						id={port.id}
						type={port.type}
						position={
							port.type === "source"
								? Position.Right
								: Position.Left
						}
						isConnectable={false}
						style={{ top: `${port.position}%` }}
						className="pointer-events-auto size-2! border-2! border-background! bg-muted-foreground/60!"
					/>
				))}
			<header className="-top-4 pointer-events-auto absolute left-4 flex w-max max-w-[calc(100vw-2rem)] items-center gap-1 rounded-md border bg-background px-2 py-1 shadow-sm">
				<button
					type="button"
					className="max-w-48 shrink-0 truncate px-1 text-left font-semibold text-sm"
					onClick={(event) => {
						event.stopPropagation();
						onSelect(group.id);
					}}
				>
					{group.name}
				</button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-7 px-2 text-xs"
					onClick={(event) => {
						event.stopPropagation();
						onToggle(group.id);
					}}
					aria-expanded={!collapsed}
				>
					{collapsed ? (
						<ChevronRight className="mr-1 size-3.5" aria-hidden />
					) : (
						<ChevronDown className="mr-1 size-3.5" aria-hidden />
					)}
					{collapsed ? "Expand" : "Collapse"}
				</Button>
			</header>
			{collapsed && (
				<div className="pointer-events-none absolute inset-x-2 top-7 space-y-1 p-1">
					{members.map((member, index) => {
						const display = member.workflowType
							? getWorkflowNodeDisplay(member.workflowType)
							: null;
						const Icon = display?.icon;
						return (
							<div
								key={member.id}
								className="flex min-h-8 items-center gap-2 rounded-md border bg-background px-2 py-1"
							>
								<span className="flex size-6 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
									{Icon && (
										<Icon
											className={`size-3.5 ${display?.color ?? ""}`}
											aria-hidden
										/>
									)}
								</span>
								<span className="min-w-0 flex-1 truncate text-xs">
									{member.label}
								</span>
								<span className="text-muted-foreground text-xs">
									{index + 1}
								</span>
							</div>
						);
					})}
					{memberCount > members.length && (
						<p className="py-1 text-center text-muted-foreground text-xs">
							+{memberCount - members.length} more
						</p>
					)}
				</div>
			)}
			{!collapsed && group.description && (
				<p className="pointer-events-none absolute right-3 bottom-2 left-3 truncate text-muted-foreground text-xs">
					{group.description}
				</p>
			)}
		</div>
	);
}
