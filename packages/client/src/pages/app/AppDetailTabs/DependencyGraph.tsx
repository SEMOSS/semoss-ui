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
import { useEffect, useMemo } from "react";
import "@xyflow/react/dist/style.css";
import { Env } from "@semoss/sdk";
import { Box, Chip, Paper, styled, Typography } from "@semoss/ui";
import { PERMISSION_ICONS } from "./dependencies-tab";

interface DependencyNodeData {
	name: string;
	type: string;
	id: string;
	isPublic: boolean;
	isDiscoverable: boolean;
	userPermission: string;
}

const StyledGraphContainer = styled(Paper)(({ theme }) => ({
	height: "600px",
	width: "100%",
	borderRadius: "12px",
	overflow: "hidden",
	border: `1px solid ${theme.palette.divider}`,
}));

const StyledNodeContent = styled(Box)(({ theme }) => ({
	padding: theme.spacing(2),
	borderRadius: "8px",
	border: `2px solid ${theme.palette.primary.main}`,
	backgroundColor: theme.palette.background.paper,
	minWidth: "200px",
	boxShadow: theme.shadows[3],
	"&:hover": {
		boxShadow: theme.shadows[6],
	},
}));

const StyledNodeImage = styled("img")({
	width: "40px",
	height: "40px",
	borderRadius: "6px",
	objectFit: "cover",
	marginBottom: "8px",
});

const StyledNodeHeader = styled(Box)({
	display: "flex",
	alignItems: "center",
	gap: "8px",
	marginBottom: "8px",
});

const StyledNodeTitle = styled(Typography)(({ theme }) => ({
	fontWeight: 600,
	fontSize: "14px",
	color: theme.palette.text.primary,
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
}));

const StyledChipContainer = styled(Box)({
	display: "flex",
	gap: "4px",
	flexWrap: "wrap",
	marginTop: "8px",
});

const StyledLegend = styled(Box)(({ theme }) => ({
	position: "absolute",
	top: theme.spacing(2),
	right: theme.spacing(2),
	backgroundColor: theme.palette.background.paper,
	padding: theme.spacing(1.5),
	borderRadius: "8px",
	boxShadow: theme.shadows[3],
	zIndex: 10,
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
}));

const StyledLegendItem = styled(Box)({
	display: "flex",
	alignItems: "center",
	gap: "8px",
});

const StyledLegendLine = styled("div")<{ dashed?: boolean; color?: string }>(
	({ dashed, color = "#1976d2" }) => ({
		width: "30px",
		height: "2px",
		backgroundColor: dashed ? "transparent" : color,
		border: dashed ? `1px dashed ${color}` : "none",
	}),
);

interface DependencyGraphProps {
	engines: appDependency[];
	topLevelDependencies: string[];
	currentAppId: string;
	currentAppName: string;
}

interface appDependency {
	engine_id: string;
	engine_name: string;
	engine_type: string;
	engine_subtype?: string;
	engine_global?: boolean;
	engine_discoverable?: boolean;
	permission?: number;
	permission_name?: string;
	can_view_dependencies?: boolean;
	dependencies?: string[];
	description?: string;
}

// Custom node component
const DependencyNode = ({ data }: { data: DependencyNodeData }) => {
	const permissionKey = data.userPermission || "NONE";

	return (
		<StyledNodeContent>
			<Handle type="target" position={Position.Left} />
			<Handle type="source" position={Position.Right} />
			<StyledNodeHeader>
				<StyledNodeImage
					src={
						data.type === "PROJECT"
							? `${Env.MODULE}/api/project-${data.id}/projectImage/download`
							: `${Env.MODULE}/api/e-${data.id}/image/download`
					}
					alt={data.name}
				/>
				<Box flex={1}>
					<StyledNodeTitle variant="body2">
						{data.name}
					</StyledNodeTitle>
					<Box
						sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
					>
						{PERMISSION_ICONS[permissionKey]}
						<Typography variant="caption" color="textSecondary">
							{data.userPermission || "NONE"}
						</Typography>
					</Box>
				</Box>
			</StyledNodeHeader>
			<StyledChipContainer>
				<Chip label={data.type} size="small" />
				{data.isPublic && (
					<Chip label="Public" size="small" color="green" />
				)}
				{!data.isPublic && data.isDiscoverable && (
					<Chip label="Discoverable" size="small" color="primary" />
				)}
			</StyledChipContainer>
		</StyledNodeContent>
	);
};

// Define node types
const nodeTypes = {
	dependencyNode: DependencyNode,
};

// Helper function to detect circular dependencies
const detectCircularDependencies = (
	edges: Array<{ source: string; target: string }>,
): Set<string> => {
	// Build adjacency list
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

	// DFS to detect cycles
	const hasCycle = (node: string, path: string[]): boolean => {
		if (visiting.has(node)) {
			// Found a cycle - mark all edges in the cycle
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

	// Check all nodes for cycles
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
	// Create nodes and edges from the flattened engines structure
	const { initialNodes, initialEdges } = useMemo(() => {
		const nodes: Node[] = [];
		const edges: Edge[] = [];

		if (!currentAppId || !currentAppName) {
			return { initialNodes: nodes, initialEdges: edges };
		}

		// Constants for hierarchical tree layout (left to right)
		const LEVEL_SPACING = 350;
		const NODE_SPACING = 180;
		const START_X = 50;

		// Add the current app as the root node (leftmost)
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

		// Build a map of all engines for quick lookup
		const engineMap = new Map<string, appDependency>();
		engines.forEach((engine) => {
			engineMap.set(engine.engine_id, engine);
		});

		// Build dependency tree using BFS to determine levels
		const visited = new Set<string>();
		const nodesByLevel: Map<number, string[]> = new Map();

		// Start with root node
		visited.add(currentAppId);
		nodesByLevel.set(0, [currentAppId]);

		// BFS to assign levels (deduplicate topLevelDependencies to prevent duplicate keys)
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
			const levelNodes = nodesByLevel.get(level);
			if (levelNodes) {
				levelNodes.push(id);
			}

			const engine = engineMap.get(id);
			if (engine?.dependencies) {
				engine.dependencies.forEach((depId) => {
					if (!visited.has(depId)) {
						queue.push({ id: depId, level: level + 1 });
					}
				});
			}
		}

		// Position nodes by level
		nodesByLevel.forEach((nodeIds, level) => {
			if (level === 0) return; // Skip root node (already positioned)

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

		// First, collect all edge relationships to detect circular dependencies
		const edgeRelationships: Array<{ source: string; target: string }> = [];

		// Add edges from root to top-level dependencies
		uniqueTopLevel.forEach((depId) => {
			edgeRelationships.push({ source: currentAppId, target: depId });
		});

		// Add edges for all other dependencies
		engines.forEach((engine) => {
			if (engine.dependencies) {
				engine.dependencies.forEach((depId) => {
					// Skip if this is an edge from current app to a top-level dependency (already added above)
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

		// Detect circular dependencies
		const circularEdges = detectCircularDependencies(edgeRelationships);

		// Create edges from root to top-level dependencies
		uniqueTopLevel.forEach((depId) => {
			const engine = engineMap.get(depId);
			const hasAccessWarning = engine?.can_view_dependencies === false;
			const isCircular = circularEdges.has(`${currentAppId}->${depId}`);

			// Always create the regular edge (blue or orange)
			edges.push({
				id: `edge-${currentAppId}-${depId}`,
				source: currentAppId,
				target: depId,
				type: "smoothstep",
				animated: true,
				markerEnd: {
					type: MarkerType.ArrowClosed,
				},
				style: {
					stroke: hasAccessWarning ? "#ff9800" : "#1976d2",
					strokeWidth: 2,
					strokeDasharray: hasAccessWarning ? "5,5" : undefined,
				},
				label: hasAccessWarning ? "⚠️" : undefined,
			});

			// If circular, add additional purple offset edge
			if (isCircular) {
				edges.push({
					id: `edge-circular-${currentAppId}-${depId}`,
					source: currentAppId,
					target: depId,
					type: "smoothstep",
					animated: true,
					markerEnd: {
						type: MarkerType.ArrowClosed,
					},
					style: {
						stroke: "#9c27b0",
						strokeWidth: 3,
						strokeDasharray: "8,4",
					},
					label: "🔄",
				});
			}
		});

		// Create edges for all dependencies (skip edges from root to top-level deps as they're already created)
		engines.forEach((engine) => {
			if (engine.dependencies) {
				engine.dependencies.forEach((depId) => {
					// Skip if this is an edge from current app to a top-level dependency (already created above)
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

					// Always create the regular edge (blue or orange)
					edges.push({
						id: `edge-${engine.engine_id}-${depId}`,
						source: engine.engine_id,
						target: depId,
						type: "smoothstep",
						animated: true,
						markerEnd: {
							type: MarkerType.ArrowClosed,
						},
						style: {
							stroke: hasAccessWarning ? "#ff9800" : "#1976d2",
							strokeWidth: 2,
							strokeDasharray: hasAccessWarning
								? "5,5"
								: undefined,
						},
						label: hasAccessWarning ? "⚠️" : undefined,
					});

					// If circular, add additional purple offset edge
					if (isCircular) {
						edges.push({
							id: `edge-circular-${engine.engine_id}-${depId}`,
							source: engine.engine_id,
							target: depId,
							type: "smoothstep",
							animated: true,
							markerEnd: {
								type: MarkerType.ArrowClosed,
							},
							style: {
								stroke: "#9c27b0",
								strokeWidth: 3,
								strokeDasharray: "8,4",
							},
							label: "🔄",
						});
					}
				});
			}
		});

		console.log("React Flow Graph Data:", {
			nodeCount: nodes.length,
			edgeCount: edges.length,
			nodeIds: nodes.map((n) => n.id),
			edges: edges.map((e) => ({
				id: e.id,
				source: e.source,
				target: e.target,
			})),
		});

		return { initialNodes: nodes, initialEdges: edges };
	}, [engines, topLevelDependencies, currentAppId, currentAppName]);

	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

	// Update nodes and edges when dependencies change
	useEffect(() => {
		setNodes(initialNodes);
		setEdges(initialEdges);
	}, [initialNodes, initialEdges, setNodes, setEdges]);

	if (!currentAppId || !currentAppName) {
		return (
			<StyledGraphContainer>
				<Box
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						height: "100%",
					}}
				>
					<Typography variant="body1" color="textSecondary">
						Unable to display graph: Missing app information
					</Typography>
				</Box>
			</StyledGraphContainer>
		);
	}

	return (
		<StyledGraphContainer>
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
				fitViewOptions={{
					padding: 0.2,
				}}
			>
				<Background />
				<Controls />
				<MiniMap nodeStrokeWidth={3} zoomable pannable />
				<StyledLegend>
					<Typography variant="caption" fontWeight="bold">
						Legend
					</Typography>
					<StyledLegendItem>
						<StyledLegendLine />
						<Typography variant="caption">Has Access</Typography>
					</StyledLegendItem>
					<StyledLegendItem>
						<StyledLegendLine dashed color="#ff9800" />
						<Typography variant="caption">
							Limited Access ⚠️
						</Typography>
					</StyledLegendItem>
					<StyledLegendItem>
						<StyledLegendLine dashed color="#9c27b0" />
						<Typography variant="caption">
							Circular Dependency 🔄
						</Typography>
					</StyledLegendItem>
				</StyledLegend>
			</ReactFlow>
		</StyledGraphContainer>
	);
};
