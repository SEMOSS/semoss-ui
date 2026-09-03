import {
	Background,
	Controls,
	type Edge,
	Handle,
	type Node,
	type NodeProps,
	Position,
	ReactFlow,
} from "@xyflow/react";
import { Bot, Brain, MessageSquare, User, Wrench } from "lucide-react";
import { useMemo } from "react";
import type { AgentRunItem } from "@semoss/sdk";
import { cn } from "@semoss/ui/next";
import type {
	AutomationAgentRunActivity,
	AutomationAgentRunGraphData,
} from "./agent-run.types";
import { agentRunStatusClass, agentToolLabel } from "./agent-run.utils";

type FlowNodeData = {
	kind: "room" | "run" | AutomationAgentRunActivity["kind"];
	label: string;
	status?: string;
};

type AgentRunFlowNode = Node<FlowNodeData, "agent-run">;

const MAX_LABEL_LENGTH = 80;

const compactLabel = (value: string): string =>
	value.length > MAX_LABEL_LENGTH
		? `${value.slice(0, MAX_LABEL_LENGTH - 1)}…`
		: value;

const textPart = (part: {
	text?: string;
	uiText?: string;
}): string | undefined => part.uiText?.trim() || part.text?.trim();

/**
 * Combines durable transcript content and paused actions into the graph's
 * chronological child nodes.
 */
export const collectAgentRunActivities = ({
	snapshot,
	items,
	messages,
}: AutomationAgentRunGraphData): AutomationAgentRunActivity[] => {
	const activityById = new Map<string, AutomationAgentRunActivity>();
	const add = (activity: AutomationAgentRunActivity) => {
		activityById.set(activity.id, activity);
	};
	const toolResultByCallId = new Map<
		string,
		{ toolStatus?: string; output?: string }
	>();

	for (const message of messages) {
		for (const part of message.parts ?? []) {
			if (
				part.type === "TOOL_RESULT" &&
				part.toolResult?.toolCallId?.trim()
			) {
				toolResultByCallId.set(part.toolResult.toolCallId, {
					toolStatus: part.toolResult.toolStatus,
					output: part.toolResult.output,
				});
			}
		}
	}

	for (const [messageIndex, message] of messages.entries()) {
		if (message.visible === false) {
			continue;
		}
		const messageId = message.messageId ?? `message-${messageIndex}`;
		for (const [index, part] of (message.parts ?? []).entries()) {
			const id = `${messageId}-${index}`;
			if (part.type === "TEXT") {
				const text = textPart(part);
				if (!text) continue;
				const input = message.ornaments?.agentRunRole === "input";
				add({
					id,
					kind: input ? "input" : "message",
					label: compactLabel(text),
					text,
					timestamp: message.dateCreated,
				});
			} else if (part.type === "THINKING" && part.thinking?.trim()) {
				add({
					id,
					kind: "reasoning",
					label: compactLabel(part.thinking),
					text: part.thinking,
					timestamp: message.dateCreated,
				});
			} else if (part.type === "TOOL_CALL" && part.toolCall?.id) {
				const result = toolResultByCallId.get(part.toolCall.id);
				add({
					id: `tool-${part.toolCall.id}`,
					kind: "tool",
					label:
						part.toolCall.title ||
						agentToolLabel(part.toolCall.name),
					status: result?.toolStatus,
					arguments: part.toolCall.arguments ?? {},
					output: result?.output,
					timestamp: message.dateCreated,
				});
			}
		}
	}

	for (const id of items.itemOrder) {
		const item = items.itemsById[id];
		if (!item) continue;
		const activity = activityFromItem(item);
		add(activity);
	}

	for (const action of snapshot.pendingActions) {
		const id = `tool-${action.toolCallId ?? action.actionId}`;
		const current = activityById.get(id);
		add({
			...current,
			id,
			kind: "tool",
			label:
				current?.label ??
				agentToolLabel(action.toolName, action.toolMeta),
			status: "INPUT_REQUIRED",
			arguments: action.editedArgs ?? action.toolArgs ?? {},
		});
	}

	if (
		snapshot.finalText?.trim() &&
		![...activityById.values()].some(
			(activity) =>
				activity.kind === "message" &&
				activity.text === snapshot.finalText,
		)
	) {
		add({
			id: "final-output",
			kind: "message",
			label: compactLabel(snapshot.finalText),
			status: "COMPLETED",
			text: snapshot.finalText,
		});
	}

	return [...activityById.values()].sort((left, right) => {
		const leftTimestamp = left.timestamp
			? Date.parse(left.timestamp)
			: Number.NaN;
		const rightTimestamp = right.timestamp
			? Date.parse(right.timestamp)
			: Number.NaN;
		if (Number.isNaN(leftTimestamp) || Number.isNaN(rightTimestamp)) {
			return 0;
		}
		return leftTimestamp - rightTimestamp;
	});
};

const activityFromItem = (item: AgentRunItem): AutomationAgentRunActivity => {
	if (item.kind === "message") {
		return {
			id: `item-${item.id}`,
			kind: "message",
			label: compactLabel(item.text || "Assistant message"),
			text: item.text,
		};
	}
	if (item.kind === "reasoning") {
		return {
			id: `item-${item.id}`,
			kind: "reasoning",
			label: compactLabel(item.summary || "Reasoning"),
			text: item.summary,
		};
	}
	if (item.kind === "tool") {
		return {
			id: `tool-${item.id}`,
			kind: "tool",
			label: item.title || agentToolLabel(item.name, item.metadata),
			status: item.status,
			arguments: item.arguments,
			output: item.output,
			error: item.error,
		};
	}
	return {
		id: `subagent-${item.id}`,
		kind: "subagent",
		label: compactLabel(item.alias || item.childRunId),
		status: item.status,
		text: item.resultPreview,
		error: item.error,
	};
};

const iconForKind = (kind: FlowNodeData["kind"]) => {
	switch (kind) {
		case "room":
			return MessageSquare;
		case "input":
			return User;
		case "reasoning":
			return Brain;
		case "tool":
			return Wrench;
		default:
			return Bot;
	}
};

const AgentRunGraphNode = ({ data, selected }: NodeProps<AgentRunFlowNode>) => {
	const Icon = iconForKind(data.kind);
	return (
		<div
			className={cn(
				"w-52 rounded-lg border bg-card px-3 py-2 shadow-sm",
				data.status && agentRunStatusClass(data.status),
				selected && "ring-2 ring-ring ring-ring/50",
			)}
		>
			<Handle
				type="target"
				position={Position.Left}
				isConnectable={false}
				className="!size-1.5 !border-none !bg-border"
			/>
			<div className="flex items-center gap-2 text-muted-foreground text-xs">
				<Icon className="size-4 shrink-0" aria-hidden />
				<span className="truncate capitalize">
					{data.kind === "subagent" ? "Sub-agent" : data.kind}
				</span>
			</div>
			<p className="mt-1 truncate font-medium text-sm" title={data.label}>
				{data.label}
			</p>
			{data.status ? (
				<span className="mt-1 block truncate text-xs">
					{data.status.replace(/_/g, " ").toLowerCase()}
				</span>
			) : null}
			<Handle
				type="source"
				position={Position.Right}
				isConnectable={false}
				className="!size-1.5 !border-none !bg-border"
			/>
		</div>
	);
};

const nodeTypes = { "agent-run": AgentRunGraphNode };

interface AgentRunGraphProps extends AutomationAgentRunGraphData {
	selectedId: string;
	onSelect: (id: string) => void;
}

/** Automation-local room → run → activity graph for one durable agent run. */
export function AgentRunGraph({
	snapshot,
	items,
	messages,
	selectedId,
	onSelect,
}: AgentRunGraphProps) {
	const activities = useMemo(
		() =>
			collectAgentRunActivities({
				snapshot,
				items,
				messages,
			}),
		[snapshot, items, messages],
	);
	const { nodes, edges } = useMemo(() => {
		const root: AgentRunFlowNode = {
			id: "room",
			type: "agent-run",
			position: { x: 0, y: 0 },
			data: { kind: "room", label: snapshot.roomId },
			selected: selectedId === "room",
		};
		const run: AgentRunFlowNode = {
			id: "run",
			type: "agent-run",
			position: { x: 260, y: 0 },
			data: {
				kind: "run",
				label: snapshot.runId,
				status: snapshot.status,
			},
			selected: selectedId === "run",
		};
		const activityNodes: AgentRunFlowNode[] = activities.map(
			(activity, index) => ({
				id: activity.id,
				type: "agent-run",
				position: { x: 520, y: index * 100 },
				data: {
					kind: activity.kind,
					label: activity.label,
					status: activity.status,
				},
				selected: selectedId === activity.id,
			}),
		);
		const nextEdges: Edge[] = [
			{
				id: "room-run",
				source: root.id,
				target: run.id,
				className: "stroke-border",
			},
			...activityNodes.map((node) => ({
				id: `run-${node.id}`,
				source: run.id,
				target: node.id,
				className: "stroke-border",
			})),
		];
		return { nodes: [root, run, ...activityNodes], edges: nextEdges };
	}, [
		activities,
		selectedId,
		snapshot.roomId,
		snapshot.runId,
		snapshot.status,
	]);

	return (
		<section
			className="h-96 overflow-hidden rounded-lg border border-border"
			aria-label="Agent run activity graph"
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				fitView
				fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
				nodesConnectable={false}
				nodesDraggable={false}
				edgesFocusable={false}
				proOptions={{ hideAttribution: true }}
				onNodeClick={(_event, node) => onSelect(node.id)}
				onPaneClick={() => onSelect("run")}
			>
				<Background gap={16} className="bg-muted/20" />
				<Controls
					showInteractive={false}
					className="border-border bg-card text-foreground shadow-sm"
				/>
			</ReactFlow>
		</section>
	);
}
