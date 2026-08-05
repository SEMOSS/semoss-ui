import {
	Background,
	Controls,
	type Edge,
	Handle,
	MarkerType,
	type Node,
	type NodeProps,
	Position,
	ReactFlow,
} from "@xyflow/react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import {
	Bot,
	Brain,
	CheckCircle2,
	MessageSquare,
	User,
	Wrench,
	XCircle,
} from "lucide-react";
import {
	Badge,
	Code,
	CodeContainer,
	cn,
	Markdown,
	TreeView,
	TreeViewItem,
	useTheme,
} from "@semoss/ui/next";
import type {
	AgentRunDetail,
	EngineInfo,
	RoomRunDetail,
	SubagentRunNode,
	TranscriptToolCall,
	TranscriptToolResult,
	TreeNodeSpec,
} from "./agent-activity-types";
import {
	formatRunDuration,
	isActiveStatus,
	isFailureStatus,
	toPrettyJson,
	tryParseJson,
} from "./agent-activity-types";

// GRAPH DATA TYPES

type NodeKind = "room" | "run" | "subagent" | "tool";

type ActivityNodeData = {
	kind: NodeKind;
	label: string;
	sublabel?: string;
	status?: string;
	duration?: string | null;
	count?: number;
};

type ActivityFlowNode = Node<ActivityNodeData, "activity">;

interface ToolInvocation {
	call: TranscriptToolCall;
	result?: TranscriptToolResult;
}

type GraphSelection =
	| { kind: "room"; roomId: string; runs: RoomRunDetail[] }
	| { kind: "run"; run: RoomRunDetail }
	| { kind: "subagent"; run: SubagentRunNode }
	| { kind: "subroom"; roomId: string; run: SubagentRunNode }
	| { kind: "tool"; toolName: string; invocations: ToolInvocation[] };

interface LayoutTreeNode {
	id: string;
	data: ActivityNodeData;
	selection: GraphSelection;
	children: LayoutTreeNode[];
	/** Status coloring the edge from this node's parent; undefined = tool gray. */
	edgeStatus?: string;
	x?: number;
	y?: number;
}

// LAYOUT

const NODE_WIDTH = 224;
const COLUMN_GAP = 110;
const ROW_HEIGHT = 92;

const EDGE_COLORS = {
	success: "#16a34a",
	failure: "#dc2626",
	active: "#3b82f6",
	tool: "#9ca3af",
};

/**
 * Tidy left-to-right tree layout: leaves take sequential rows, parents are
 * centered on their children.
 */
const layoutTree = (root: LayoutTreeNode): void => {
	let nextRow = 0;
	const assign = (node: LayoutTreeNode, depth: number) => {
		node.x = depth * (NODE_WIDTH + COLUMN_GAP);
		if (node.children.length === 0) {
			node.y = nextRow * ROW_HEIGHT;
			nextRow += 1;
			return;
		}
		for (const child of node.children) {
			assign(child, depth + 1);
		}
		const first = node.children[0];
		const last = node.children[node.children.length - 1];
		node.y = ((first.y ?? 0) + (last.y ?? 0)) / 2;
	};
	assign(root, 0);
};

const edgeStyleForStatus = (status: string | undefined): Partial<Edge> => {
	if (!status) {
		return {
			style: { stroke: EDGE_COLORS.tool, strokeDasharray: "2 4" },
			markerEnd: {
				type: MarkerType.ArrowClosed,
				color: EDGE_COLORS.tool,
			},
		};
	}
	if (isFailureStatus(status)) {
		return {
			style: { stroke: EDGE_COLORS.failure, strokeDasharray: "6 4" },
			markerEnd: {
				type: MarkerType.ArrowClosed,
				color: EDGE_COLORS.failure,
			},
		};
	}
	if (isActiveStatus(status)) {
		return {
			animated: true,
			style: { stroke: EDGE_COLORS.active, strokeDasharray: "6 4" },
			markerEnd: {
				type: MarkerType.ArrowClosed,
				color: EDGE_COLORS.active,
			},
		};
	}
	return {
		style: { stroke: EDGE_COLORS.success },
		markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLORS.success },
	};
};

// GRAPH BUILDING

const collectToolInvocations = (
	run: AgentRunDetail,
): Map<string, ToolInvocation[]> => {
	const resultByToolCallId = new Map<string, TranscriptToolResult>();
	for (const message of run.messages ?? []) {
		for (const part of message.parts) {
			if (part.type === "TOOL_RESULT" && part.toolResult) {
				resultByToolCallId.set(
					part.toolResult.toolCallId,
					part.toolResult,
				);
			}
		}
	}

	const invocationsByTool = new Map<string, ToolInvocation[]>();
	for (const message of run.messages ?? []) {
		if (!message.visible) {
			continue;
		}
		for (const part of message.parts) {
			if (part.type !== "TOOL_CALL" || !part.toolCall) {
				continue;
			}
			const call = part.toolCall;
			const existing = invocationsByTool.get(call.name) ?? [];
			existing.push({ call, result: resultByToolCallId.get(call.id) });
			invocationsByTool.set(call.name, existing);
		}
	}
	return invocationsByTool;
};

const buildToolTreeNodes = (run: AgentRunDetail): LayoutTreeNode[] =>
	Array.from(collectToolInvocations(run).entries()).map(
		([toolName, invocations]) => ({
			id: `${run.runId}-tool-${toolName}`,
			data: {
				kind: "tool" as const,
				label: toolName,
				count: invocations.length,
				status: invocations.some(
					(inv) => inv.result?.toolStatus === "error",
				)
					? "FAILED"
					: undefined,
			},
			selection: { kind: "tool" as const, toolName, invocations },
			children: [],
		}),
	);

/**
 * A subagent run mirrors the parent structure: the run card points at its own
 * room, which fans out into the tools it called and any nested subagents.
 */
const buildSubagentTreeNode = (
	run: SubagentRunNode,
	engineInfo: Record<string, EngineInfo>,
): LayoutTreeNode => {
	const contents: LayoutTreeNode[] = [
		...buildToolTreeNodes(run),
		...run.children.map((child) =>
			buildSubagentTreeNode(child, engineInfo),
		),
	];

	const roomChildren: LayoutTreeNode[] = run.roomId
		? [
				{
					id: `${run.runId}-room`,
					data: {
						kind: "room" as const,
						label: run.roomName || run.roomId,
						count: contents.length,
					},
					selection: {
						kind: "subroom" as const,
						roomId: run.roomId,
						run,
					},
					children: contents,
					edgeStatus: run.status,
				},
			]
		: contents;

	return {
		id: run.runId,
		data: {
			kind: "subagent",
			label: run.input || run.runId,
			sublabel: engineInfo[run.modelId]?.name ?? run.modelId,
			status: run.status,
			duration: formatRunDuration(run.startedAt, run.completedAt),
		},
		selection: { kind: "subagent", run },
		children: roomChildren,
		edgeStatus: run.status,
	};
};

const buildGraph = (
	roomId: string,
	roomName: string | undefined,
	runs: RoomRunDetail[],
	engineInfo: Record<string, EngineInfo>,
): {
	nodes: ActivityFlowNode[];
	edges: Edge[];
	selectionById: Map<string, GraphSelection>;
} => {
	const root: LayoutTreeNode = {
		id: "room-root",
		data: {
			kind: "room",
			label: roomName || roomId,
			count: runs.length,
		},
		selection: { kind: "room", roomId, runs },
		children: runs.map((run) => ({
			id: run.runId,
			data: {
				kind: "run" as const,
				label: run.input || run.runId,
				sublabel: engineInfo[run.modelId]?.name ?? run.modelId,
				status: run.status,
				duration: formatRunDuration(run.startedAt, run.completedAt),
			},
			selection: { kind: "run" as const, run },
			children: [
				...buildToolTreeNodes(run),
				...run.subagents.map((subagent) =>
					buildSubagentTreeNode(subagent, engineInfo),
				),
			],
			edgeStatus: run.status,
		})),
	};

	layoutTree(root);

	const nodes: ActivityFlowNode[] = [];
	const edges: Edge[] = [];
	const selectionById = new Map<string, GraphSelection>();

	const visit = (node: LayoutTreeNode) => {
		nodes.push({
			id: node.id,
			type: "activity",
			position: { x: node.x ?? 0, y: node.y ?? 0 },
			data: node.data,
		});
		selectionById.set(node.id, node.selection);

		for (const child of node.children) {
			edges.push({
				id: `${node.id}->${child.id}`,
				source: node.id,
				target: child.id,
				...edgeStyleForStatus(child.edgeStatus),
			});
			visit(child);
		}
	};
	visit(root);

	return { nodes, edges, selectionById };
};

// CUSTOM NODE

const NODE_KIND_STYLES: Record<NodeKind, string> = {
	room: "border-primary/40 bg-primary/10",
	run: "border-primary/50 bg-card shadow-sm",
	subagent: "border-border bg-card",
	tool: "border-dashed border-border bg-muted/60",
};

const NODE_KIND_ICONS: Record<NodeKind, ReactNode> = {
	room: <MessageSquare className="size-4 shrink-0 text-primary" />,
	run: <Bot className="size-4 shrink-0 text-primary" />,
	subagent: <Bot className="size-4 shrink-0 text-muted-foreground" />,
	tool: <Wrench className="size-4 shrink-0 text-muted-foreground" />,
};

const NODE_KIND_TITLES: Record<NodeKind, string> = {
	room: "Room",
	run: "Agent run",
	subagent: "Sub-agent",
	tool: "Tool",
};

const statusDotClass = (status: string): string => {
	if (isFailureStatus(status)) {
		return "bg-destructive";
	}
	if (isActiveStatus(status)) {
		return "bg-blue-500";
	}
	return "bg-green-600";
};

const ActivityGraphNode = ({ data, selected }: NodeProps<ActivityFlowNode>) => {
	return (
		<div
			className={cn(
				"w-56 rounded-lg border px-3 py-2 transition-shadow",
				NODE_KIND_STYLES[data.kind],
				selected && "ring-2 ring-primary",
			)}
		>
			<Handle
				type="target"
				position={Position.Left}
				isConnectable={false}
				className="!size-1.5 !border-none !bg-border"
			/>
			<div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
				{NODE_KIND_ICONS[data.kind]}
				<span>{NODE_KIND_TITLES[data.kind]}</span>
				{typeof data.count === "number" && (
					<span className="ml-auto rounded-full bg-muted px-1.5 font-medium">
						{data.count}
					</span>
				)}
			</div>
			<p
				className={cn(
					"mt-1 truncate text-xs",
					data.kind === "tool" ? "font-mono" : "font-medium",
				)}
				title={data.label}
			>
				{data.label}
			</p>
			{(data.status || data.duration || data.sublabel) && (
				<div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
					{data.status && (
						<span className="flex items-center gap-1">
							<span
								className={cn(
									"size-1.5 rounded-full",
									statusDotClass(data.status),
								)}
							/>
							{data.status}
						</span>
					)}
					{data.duration && <span>{data.duration}</span>}
					{data.sublabel && (
						<span className="ml-auto max-w-[45%] truncate">
							{data.sublabel}
						</span>
					)}
				</div>
			)}
			<Handle
				type="source"
				position={Position.Right}
				isConnectable={false}
				className="!size-1.5 !border-none !bg-border"
			/>
		</div>
	);
};

const nodeTypes = {
	activity: ActivityGraphNode,
};

// DETAIL PANEL

const CodeBlock = ({
	code,
	language,
	fill = false,
}: {
	code: string;
	language: "json" | "text";
	/**
	 * When true the block sizes to its content but may shrink (and scroll)
	 * to fit its flex container instead of capping at max-h-64 - lets a lone
	 * block use the panel's full height before scrolling.
	 */
	fill?: boolean;
}) => (
	<CodeContainer
		className={cn(
			"overflow-auto bg-muted text-xs",
			fill ? "min-h-0" : "max-h-64",
		)}
	>
		<Code code={code} language={language} />
	</CodeContainer>
);

/**
 * Builds the transcript subtree for a run: You -> Assistant (thinking/text/
 * tool calls with paired results) -> ... -> Final answer, per the
 * semoss-transcript-schema turn order. Tool results are matched to calls by
 * toolCallId (never by array position), and `visible: false` relay turns are
 * skipped.
 */
const buildTranscriptStepNodes = (run: AgentRunDetail): TreeNodeSpec[] => {
	const resultByToolCallId = new Map<string, TranscriptToolResult>();
	for (const message of run.messages ?? []) {
		for (const part of message.parts) {
			if (part.type === "TOOL_RESULT" && part.toolResult) {
				resultByToolCallId.set(
					part.toolResult.toolCallId,
					part.toolResult,
				);
			}
		}
	}

	const stepNodes: TreeNodeSpec[] = [];

	for (const message of run.messages ?? []) {
		if (!message.visible) {
			continue;
		}
		const role = message.ornaments?.agentRunRole;

		if (role === "input") {
			const textPart = message.parts.find((part) => part.type === "TEXT");
			stepNodes.push({
				id: message.messageId,
				leadingIcon: <User className="size-3.5" />,
				label: <span className="font-medium text-sm">You</span>,
				children: [
					{
						id: `${message.messageId}-text`,
						label: (
							<Markdown className="text-sm">
								{textPart?.uiText ?? textPart?.text ?? ""}
							</Markdown>
						),
					},
				],
			});
			continue;
		}

		if (role === "assistant_tool") {
			const children: TreeNodeSpec[] = [];

			const thinkingPart = message.parts.find(
				(part) => part.type === "THINKING",
			);
			if (thinkingPart?.thinking) {
				children.push({
					id: `${message.messageId}-thinking`,
					leadingIcon: <Brain className="size-3.5" />,
					label: (
						<span className="text-muted-foreground text-xs italic">
							Thinking
						</span>
					),
					children: [
						{
							id: `${message.messageId}-thinking-body`,
							label: (
								<p className="whitespace-pre-wrap text-muted-foreground text-xs">
									{thinkingPart.thinking}
								</p>
							),
						},
					],
				});
			}

			const textPart = message.parts.find((part) => part.type === "TEXT");
			if (textPart?.text) {
				children.push({
					id: `${message.messageId}-text`,
					label: (
						<Markdown className="text-sm">{textPart.text}</Markdown>
					),
				});
			}

			for (const part of message.parts) {
				if (part.type !== "TOOL_CALL" || !part.toolCall) {
					continue;
				}
				const call = part.toolCall;
				const result = resultByToolCallId.get(call.id);
				const callChildren: TreeNodeSpec[] = [
					{
						id: `${call.id}-args`,
						label: (
							<CodeBlock
								code={toPrettyJson(call.arguments)}
								language="json"
							/>
						),
					},
				];

				if (result) {
					const parsedOutput = tryParseJson(result.output);
					callChildren.push({
						id: `${call.id}-result`,
						leadingIcon:
							result.toolStatus === "error" ? (
								<XCircle className="size-3.5 text-destructive" />
							) : (
								<CheckCircle2 className="size-3.5 text-green-600" />
							),
						label: (
							<span className="text-muted-foreground text-xs">
								Result
							</span>
						),
						children: [
							{
								id: `${call.id}-result-body`,
								label: (
									<CodeBlock
										code={
											parsedOutput !== undefined
												? toPrettyJson(parsedOutput)
												: result.output
										}
										language={
											parsedOutput !== undefined
												? "json"
												: "text"
										}
									/>
								),
							},
						],
					});
				}

				children.push({
					id: call.id,
					leadingIcon: <Wrench className="size-3.5" />,
					label: (
						<span className="font-mono text-xs">{call.name}</span>
					),
					children: callChildren,
				});
			}

			stepNodes.push({
				id: message.messageId,
				leadingIcon: <Bot className="size-3.5" />,
				label: <span className="font-medium text-sm">Assistant</span>,
				children,
			});
			continue;
		}

		if (role === "final_output") {
			const textPart = message.parts.find((part) => part.type === "TEXT");
			stepNodes.push({
				id: message.messageId,
				leadingIcon: (
					<CheckCircle2 className="size-3.5 text-green-600" />
				),
				label: (
					<span className="font-medium text-sm">Final answer</span>
				),
				children: [
					{
						id: `${message.messageId}-text`,
						label: (
							<Markdown className="text-sm">
								{textPart?.text ?? ""}
							</Markdown>
						),
					},
				],
			});
		}
	}

	return stepNodes;
};

const renderTreeNodes = (nodes: TreeNodeSpec[]): ReactNode =>
	nodes.map((node) => (
		<TreeViewItem
			key={node.id}
			id={node.id}
			label={node.label}
			item={node}
			leadingIcon={node.leadingIcon}
		>
			{node.children ? renderTreeNodes(node.children) : null}
		</TreeViewItem>
	));

const StatusBadge = ({ status }: { status: string }) => (
	<Badge variant={isFailureStatus(status) ? "destructive" : "secondary"}>
		{status}
	</Badge>
);

const MetaRow = ({ label, value }: { label: string; value?: string | null }) =>
	value ? (
		<div className="flex justify-between gap-4 text-xs">
			<span className="shrink-0 text-muted-foreground">{label}</span>
			<span className="truncate font-mono" title={value}>
				{value}
			</span>
		</div>
	) : null;

const RunDetailPanel = ({
	run,
	title,
	engineInfo,
}: {
	run: AgentRunDetail;
	title: string;
	engineInfo: Record<string, EngineInfo>;
}) => {
	const stepNodes = useMemo(() => buildTranscriptStepNodes(run), [run]);
	const [expanded, setExpanded] = useState<string[]>([]);

	useEffect(() => {
		setExpanded(stepNodes.map((node) => node.id));
	}, [stepNodes]);

	const info = engineInfo[run.modelId];

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between gap-2">
				<h6 className="font-semibold text-sm">{title}</h6>
				<StatusBadge status={run.status} />
			</div>
			<div className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-3">
				<MetaRow label="Run ID" value={run.runId} />
				<MetaRow label="Room" value={run.roomName || run.roomId} />
				<MetaRow label="Model" value={info?.name ?? run.modelId} />
				<MetaRow label="Harness" value={run.harnessType} />
				<MetaRow
					label="Duration"
					value={formatRunDuration(run.startedAt, run.completedAt)}
				/>
				<MetaRow label="Started" value={run.startedAt} />
			</div>
			{run.errorMessage && (
				<div>
					<p className="mb-1 flex items-center gap-1 font-medium text-destructive text-xs">
						<XCircle className="size-3.5" />
						Error
					</p>
					<p className="whitespace-pre-wrap text-destructive text-xs">
						{run.errorMessage}
					</p>
				</div>
			)}
			{stepNodes.length > 0 ? (
				<TreeView expanded={expanded} onExpandChange={setExpanded}>
					{renderTreeNodes(stepNodes)}
				</TreeView>
			) : (
				<>
					{run.input && (
						<div>
							<p className="mb-1 font-medium text-muted-foreground text-xs">
								Input
							</p>
							<Markdown className="text-sm">{run.input}</Markdown>
						</div>
					)}
					{run.finalText && (
						<div>
							<p className="mb-1 flex items-center gap-1 font-medium text-muted-foreground text-xs">
								<CheckCircle2 className="size-3.5 text-green-600" />
								Final answer
							</p>
							<Markdown className="text-sm">
								{run.finalText}
							</Markdown>
						</div>
					)}
					{!run.input && !run.finalText && (
						<p className="text-muted-foreground text-sm">
							No transcript available for this run.
						</p>
					)}
				</>
			)}
		</div>
	);
};

const SubroomDetailPanel = ({
	roomId,
	run,
}: {
	roomId: string;
	run: SubagentRunNode;
}) => (
	<div className="flex flex-col gap-3">
		<h6 className="font-semibold text-sm">Sub-agent room</h6>
		<div className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-3">
			<MetaRow label="Name" value={run.roomName} />
			<MetaRow label="Room ID" value={roomId} />
			<MetaRow label="Sub-agent run" value={run.runId} />
			<MetaRow
				label="Tools used"
				value={String(collectToolInvocations(run).size)}
			/>
			<MetaRow
				label="Nested sub-agents"
				value={String(run.children.length)}
			/>
		</div>
		<p className="text-muted-foreground text-xs">
			Room the sub-agent ran in. Click its tool or sub-agent nodes to
			inspect them.
		</p>
	</div>
);

const ToolDetailPanel = ({
	toolName,
	invocations,
}: {
	toolName: string;
	invocations: ToolInvocation[];
}) => {
	// A lone invocation gets the panel's full height before scrolling instead
	// of capping its code blocks while whitespace sits below them.
	const single = invocations.length === 1;

	return (
		<div className={cn("flex flex-col gap-3", single && "h-full")}>
			<div className="flex shrink-0 items-center justify-between gap-2">
				<h6 className="font-mono font-semibold text-sm">{toolName}</h6>
				<Badge variant="secondary">
					{invocations.length}{" "}
					{invocations.length === 1 ? "call" : "calls"}
				</Badge>
			</div>
			{invocations.map(({ call, result }, idx) => {
				const parsedOutput = result
					? tryParseJson(result.output)
					: undefined;
				return (
					<div
						key={call.id}
						className={cn(
							"flex flex-col gap-2 rounded-lg border p-3",
							single && "min-h-0",
						)}
					>
						<div className="flex shrink-0 items-center justify-between gap-2">
							<span className="font-medium text-muted-foreground text-xs">
								Call {idx + 1}
							</span>
							{result &&
								(result.toolStatus === "error" ? (
									<XCircle className="size-3.5 text-destructive" />
								) : (
									<CheckCircle2 className="size-3.5 text-green-600" />
								))}
						</div>
						<CodeBlock
							code={toPrettyJson(call.arguments)}
							language="json"
							fill={single}
						/>
						{result && (
							<CodeBlock
								code={
									parsedOutput !== undefined
										? toPrettyJson(parsedOutput)
										: result.output
								}
								language={
									parsedOutput !== undefined ? "json" : "text"
								}
								fill={single}
							/>
						)}
					</div>
				);
			})}
		</div>
	);
};

const RoomDetailPanel = ({
	roomId,
	roomName,
	runs,
}: {
	roomId: string;
	roomName?: string;
	runs: RoomRunDetail[];
}) => (
	<div className="flex flex-col gap-3">
		<h6 className="font-semibold text-sm">Room</h6>
		<div className="flex flex-col gap-1 rounded-lg border bg-muted/40 p-3">
			<MetaRow label="Name" value={roomName} />
			<MetaRow label="Room ID" value={roomId} />
			<MetaRow label="Runs" value={String(runs.length)} />
			<MetaRow
				label="Sub-agents"
				value={String(
					runs.reduce(
						(total, run) => total + run.subagents.length,
						0,
					),
				)}
			/>
		</div>
		<p className="text-muted-foreground text-xs">
			Click an agent run, sub-agent, or tool node to inspect it.
		</p>
	</div>
);

const LEGEND_ITEMS: { label: string; className: string }[] = [
	{ label: "Success", className: "border-t-2 border-[#16a34a]" },
	{ label: "Failed", className: "border-t-2 border-[#dc2626] border-dashed" },
	{
		label: "Running",
		className: "border-t-2 border-[#3b82f6] border-dashed",
	},
	{
		label: "Tool call",
		className: "border-t-2 border-[#9ca3af] border-dotted",
	},
];

// COMPONENT

interface AgentRunGraphProps {
	roomId: string;
	roomName?: string;
	runs: RoomRunDetail[];
	/** Model engine id -> display info resolved via GetEngineMetadata. */
	engineInfo?: Record<string, EngineInfo>;
}

/**
 * Node-graph view of a room's agent activity: room -> agent runs -> tool
 * calls and (recursive) sub-agent runs, with a detail panel for the selected
 * node. Render with key={roomId} so selection resets when the room changes.
 */
export const AgentRunGraph = ({
	roomId,
	roomName,
	runs,
	engineInfo = {},
}: AgentRunGraphProps) => {
	const { resolvedTheme } = useTheme();
	const isDarkTheme = resolvedTheme === "dark";

	const { nodes, edges, selectionById } = useMemo(
		() => buildGraph(roomId, roomName, runs, engineInfo),
		[roomId, roomName, runs, engineInfo],
	);

	const [selectedNodeId, setSelectedNodeId] = useState<string>("room-root");
	const selection = selectionById.get(selectedNodeId) ?? null;

	return (
		<div className="flex h-[600px] overflow-hidden rounded-xl border">
			<div className="relative min-w-0 flex-1">
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					colorMode={isDarkTheme ? "dark" : "light"}
					fitView={true}
					fitViewOptions={{ maxZoom: 1, padding: 0.15 }}
					nodesConnectable={false}
					edgesFocusable={false}
					proOptions={{ hideAttribution: true }}
					onNodeClick={(_event, node) => setSelectedNodeId(node.id)}
					onPaneClick={() => setSelectedNodeId("room-root")}
				>
					<Background gap={16} />
					<Controls
						showInteractive={false}
						className="rounded-md border border-border bg-card text-foreground shadow-sm"
					/>
				</ReactFlow>
				<div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5 rounded-md border bg-card/95 p-2 shadow-sm backdrop-blur">
					{LEGEND_ITEMS.map((item) => (
						<div
							key={item.label}
							className="flex items-center gap-2 text-[10px] text-muted-foreground"
						>
							<span className={cn("w-6", item.className)} />
							{item.label}
						</div>
					))}
				</div>
			</div>
			<div className="w-[380px] shrink-0 overflow-y-auto border-l bg-background p-4">
				{selection?.kind === "run" && (
					<RunDetailPanel
						run={selection.run}
						title="Agent run"
						engineInfo={engineInfo}
					/>
				)}
				{selection?.kind === "subagent" && (
					<RunDetailPanel
						run={selection.run}
						title="Sub-agent run"
						engineInfo={engineInfo}
					/>
				)}
				{selection?.kind === "subroom" && (
					<SubroomDetailPanel
						roomId={selection.roomId}
						run={selection.run}
					/>
				)}
				{selection?.kind === "tool" && (
					<ToolDetailPanel
						toolName={selection.toolName}
						invocations={selection.invocations}
					/>
				)}
				{(!selection || selection.kind === "room") && (
					<RoomDetailPanel
						roomId={roomId}
						roomName={roomName}
						runs={runs}
					/>
				)}
			</div>
		</div>
	);
};
