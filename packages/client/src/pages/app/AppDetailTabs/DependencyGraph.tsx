import {
	Background,
	Controls,
	type Edge,
	Handle,
	MarkerType,
	MiniMap,
	type Node,
	Position,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useEffect, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import { Env } from "@semoss/sdk";
import { Badge } from "@semoss/ui/next";
import type { appDependency } from "@/components/app";
import { PERMISSION_ICONS } from "./dependencies-tab";

interface DependencyNodeData {
	name: string;
	type: string;
	id: string;
	isPublic: boolean;
	isDiscoverable: boolean;
	userPermission: string;
}

interface DependencyGraphProps {
	engines: appDependency[];
	topLevelDependencies: string[];
	currentAppId: string;
	currentAppName: string;
}

const DependencyNode = ({ data }: { data: DependencyNodeData }) => {
	const permissionKey =
		(data.userPermission as keyof typeof PERMISSION_ICONS) || "NONE";

	return (
		<div className="min-w-[200px] rounded-lg border-2 border-primary bg-background p-3 shadow-md hover:shadow-lg">
			<Handle type="target" position={Position.Left} />
			<Handle type="source" position={Position.Right} />
			<div className="mb-2 flex items-center gap-2">
				<img
					src={
						data.type === "PROJECT"
							? `${Env.MODULE}/api/project-${data.id}/projectImage/download`
							: `${Env.MODULE}/api/e-${data.id}/image/download`
					}
					alt={data.name}
					className="size-10 shrink-0 rounded-md object-cover"
				/>
				<div className="min-w-0 flex-1">
					<p className="truncate font-semibold text-foreground text-sm">
						{data.name}
					</p>
					<div className="flex items-center gap-1">
						{PERMISSION_ICONS[permissionKey]}
						<span className="text-muted-foreground text-xs">
							{data.userPermission || "NONE"}
						</span>
					</div>
				</div>
			</div>
			<div className="flex flex-wrap gap-1">
				<Badge variant="outline">{data.type}</Badge>
				{data.isPublic && <Badge variant="outline">Public</Badge>}
				{!data.isPublic && data.isDiscoverable && (
					<Badge variant="outline">Discoverable</Badge>
				)}
			</div>
		</div>
	);
};

const nodeTypes = {
	dependencyNode: DependencyNode,
};

const detectCircularDependencies = (
	edges: Array<{ source: string; target: string }>,
): Set<string> => {
	const adjList = new Map<string, string[]>();
	edges.forEach(({ source, target }) => {
		if (!adjList.has(source)) {
			adjList.set(source, []);
		}
		adjList.get(source)?.push(target);
	});

	const circularEdges = new Set<string>();
	const visiting = new Set<string>();
	const visited = new Set<string>();

	const hasCycle = (node: string, path: string[]): boolean => {
		if (visiting.has(node)) {
			const cycleStartIndex = path.indexOf(node);
			for (let i = cycleStartIndex; i < path.length; i++) {
				const source = path[i];
				const target = i < path.length - 1 ? path[i + 1] : node;
				circularEdges.add(`${source}->${target}`);
			}
			return true;
		}

		if (visited.has(node)) {
			return false;
		}

		visiting.add(node);
		path.push(node);

		const neighbors = adjList.get(node) || [];
		for (const neighbor of neighbors) {
			hasCycle(neighbor, path);
		}

		path.pop();
		visiting.delete(node);
		visited.add(node);

		return false;
	};

	adjList.forEach((_, node) => {
		if (!visited.has(node)) {
			hasCycle(node, []);
		}
	});

	return circularEdges;
};

export const DependencyGraph = ({
	engines,
	topLevelDependencies,
	currentAppId,
	currentAppName,
}: DependencyGraphProps) => {
	const { initialNodes, initialEdges } = useMemo(() => {
		const nodes: Node[] = [];
		const edges: Edge[] = [];

		if (!currentAppId || !currentAppName) {
			return { initialNodes: nodes, initialEdges: edges };
		}

		const LEVEL_SPACING = 350;
		const NODE_SPACING = 180;
		const START_X = 50;

		nodes.push({
			id: currentAppId,
			type: "dependencyNode",
			position: { x: START_X, y: 0 },
			data: {
				name: currentAppName,
				type: "PROJECT",
				id: currentAppId,
				isPublic: false,
				isDiscoverable: false,
				userPermission: "OWNER",
			},
			sourcePosition: Position.Right,
			targetPosition: Position.Left,
			style: {
				border: "3px solid #1976d2",
				backgroundColor: "#e3f2fd",
			},
		});

		const engineMap = new Map<string, appDependency>();
		engines.forEach((engine) => {
			engineMap.set(engine.engine_id, engine);
		});

		const visited = new Set<string>();
		const nodesByLevel: Map<number, string[]> = new Map();

		visited.add(currentAppId);
		nodesByLevel.set(0, [currentAppId]);

		const uniqueTopLevel = [...new Set(topLevelDependencies)];
		const queue: Array<{ id: string; level: number }> = uniqueTopLevel.map(
			(id) => ({ id, level: 1 }),
		);

		while (queue.length > 0) {
			const item = queue.shift();
			if (!item) continue;
			const { id, level } = item;

			if (visited.has(id)) continue;
			visited.add(id);

			if (!nodesByLevel.has(level)) {
				nodesByLevel.set(level, []);
			}
			nodesByLevel.get(level)?.push(id);

			const engine = engineMap.get(id);
			if (engine?.dependencies) {
				engine.dependencies.forEach((depId) => {
					if (!visited.has(depId)) {
						queue.push({ id: depId, level: level + 1 });
					}
				});
			}
		}

		nodesByLevel.forEach((nodeIds, level) => {
			if (level === 0) return;

			const x = START_X + level * LEVEL_SPACING;
			const totalHeight = (nodeIds.length - 1) * NODE_SPACING;
			const startY = -totalHeight / 2;

			nodeIds.forEach((nodeId, index) => {
				const y = startY + index * NODE_SPACING;
				const engine = engineMap.get(nodeId);

				if (engine) {
					nodes.push({
						id: nodeId,
						type: "dependencyNode",
						position: { x, y },
						sourcePosition: Position.Right,
						targetPosition: Position.Left,
						data: {
							name: engine.engine_name,
							type: engine.engine_type,
							id: engine.engine_id,
							isPublic: engine.engine_global || false,
							isDiscoverable: engine.engine_discoverable || false,
							userPermission: engine.permission_name || "",
						},
					});
				}
			});
		});

		const edgeRelationships: Array<{ source: string; target: string }> = [];

		uniqueTopLevel.forEach((depId) => {
			edgeRelationships.push({ source: currentAppId, target: depId });
		});

		engines.forEach((engine) => {
			if (engine.dependencies) {
				engine.dependencies.forEach((depId) => {
					if (
						engine.engine_id === currentAppId &&
						uniqueTopLevel.includes(depId)
					) {
						return;
					}
					edgeRelationships.push({
						source: engine.engine_id,
						target: depId,
					});
				});
			}
		});

		const circularEdges = detectCircularDependencies(edgeRelationships);

		uniqueTopLevel.forEach((depId) => {
			const engine = engineMap.get(depId);
			const hasAccessWarning = engine?.can_view_dependencies === false;
			const isCircular = circularEdges.has(`${currentAppId}->${depId}`);

			edges.push({
				id: `edge-${currentAppId}-${depId}`,
				source: currentAppId,
				target: depId,
				type: "smoothstep",
				markerEnd: { type: MarkerType.ArrowClosed },
				style: {
					stroke: hasAccessWarning ? "#f97316" : "#2563eb",
					strokeWidth: 2,
					strokeDasharray: hasAccessWarning ? "5,5" : undefined,
				},
				label: hasAccessWarning ? "⚠️" : undefined,
			});

			if (isCircular) {
				edges.push({
					id: `edge-circular-${currentAppId}-${depId}`,
					source: currentAppId,
					target: depId,
					type: "smoothstep",
					markerEnd: { type: MarkerType.ArrowClosed },
					style: {
						stroke: "#9333ea",
						strokeWidth: 3,
						strokeDasharray: "8,4",
					},
					label: "🔄",
				});
			}
		});

		engines.forEach((engine) => {
			if (engine.dependencies) {
				engine.dependencies.forEach((depId) => {
					if (
						engine.engine_id === currentAppId &&
						uniqueTopLevel.includes(depId)
					) {
						return;
					}

					const targetEngine = engineMap.get(depId);
					const hasAccessWarning =
						targetEngine?.can_view_dependencies === false;
					const isCircular = circularEdges.has(
						`${engine.engine_id}->${depId}`,
					);

					edges.push({
						id: `edge-${engine.engine_id}-${depId}`,
						source: engine.engine_id,
						target: depId,
						type: "smoothstep",
						markerEnd: { type: MarkerType.ArrowClosed },
						style: {
							stroke: hasAccessWarning ? "#f97316" : "#2563eb",
							strokeWidth: 2,
							strokeDasharray: hasAccessWarning
								? "5,5"
								: undefined,
						},
						label: hasAccessWarning ? "⚠️" : undefined,
					});

					if (isCircular) {
						edges.push({
							id: `edge-circular-${engine.engine_id}-${depId}`,
							source: engine.engine_id,
							target: depId,
							type: "smoothstep",
							markerEnd: { type: MarkerType.ArrowClosed },
							style: {
								stroke: "#9333ea",
								strokeWidth: 3,
								strokeDasharray: "8,4",
							},
							label: "🔄",
						});
					}
				});
			}
		});

		return { initialNodes: nodes, initialEdges: edges };
	}, [engines, topLevelDependencies, currentAppId, currentAppName]);

	const [show, setShow] = useState({
		hasAccess: true,
		limitedAccess: true,
		circular: true,
	});
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	useEffect(() => {
		setNodes(initialNodes);
		setEdges(
			initialEdges.filter((e) => {
				if (e.id.includes("edge-circular-")) return show.circular;
				if ((e.style as { stroke?: string })?.stroke === "#f97316")
					return show.limitedAccess;
				return show.hasAccess;
			}),
		);
	}, [initialNodes, initialEdges, show, setNodes, setEdges]);

	if (!currentAppId || !currentAppName) {
		return (
			<div className="flex h-[600px] w-full items-center justify-center rounded-xl border border-border">
				<p className="text-muted-foreground text-sm">
					Unable to display graph: Missing app information
				</p>
			</div>
		);
	}

	return (
		<div className="relative h-[600px] w-full overflow-hidden rounded-xl border border-border">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				nodeTypes={nodeTypes}
				fitView
				minZoom={0.3}
				maxZoom={1.5}
				attributionPosition="bottom-left"
				fitViewOptions={{ padding: 0.2 }}
			>
				<Background />
				<Controls />
				<MiniMap nodeStrokeWidth={3} zoomable pannable />
				<div className="absolute top-3 right-3 z-10 flex flex-col gap-2 rounded-lg border border-border bg-background p-3 shadow-md">
					<span className="font-semibold text-xs">Legend</span>
					{(
						[
							{
								key: "hasAccess",
								color: "bg-blue-600",
								label: "Has Access",
							},
							{
								key: "limitedAccess",
								color: "border border-orange-500 border-dashed",
								label: "Limited Access ⚠️",
							},
							{
								key: "circular",
								color: "border border-purple-600 border-dashed",
								label: "Circular Dependency 🔄",
							},
						] as const
					).map(({ key, color, label }) => (
						<button
							key={key}
							type="button"
							onClick={() =>
								setShow((s) => ({ ...s, [key]: !s[key] }))
							}
							className={`flex items-center gap-2 rounded px-1 py-0.5 text-left transition-opacity hover:bg-muted ${show[key] ? "" : "opacity-40"}`}
						>
							<div className={`h-0.5 w-8 shrink-0 ${color}`} />
							<span className="text-muted-foreground text-xs">
								{label}
							</span>
						</button>
					))}
				</div>
			</ReactFlow>
		</div>
	);
};
