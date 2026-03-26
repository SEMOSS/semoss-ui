import {
	Controls,
	type Edge,
	MiniMap,
	type Node,
	ReactFlow,
	type ReactFlowInstance,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";
import { Button, Input } from "@semoss/ui/next";
import { MetamodelContext } from "@/contexts";
import type { ColumnOption, Property } from "../import/database/MetamodelTypes";
import {
	createPropertiesFromNames,
	edgeIdsEqual,
	nodeIdsEqual,
	updateColumnProperties,
} from "../import/database/MetamodelUtils";
import { Editmetamodel } from "./edit-meta-model";
import EditTable from "./edit-table";
import { FloatingEdge } from "./floating-edge";
import { MetamodelNode } from "./meta-model-node";

// TYPES & CONSTANTS

const edgeTypes = {
	floating: FloatingEdge,
};

const nodeTypes = {
	metamodel: MetamodelNode,
};

const normalizeSearchValue = (value: string) =>
	value.toLowerCase().replace(/[\s_]+/g, "");

type SearchMatch = {
	nodeId: string;
	columnIndex: number | null;
};

const getSearchMatchKey = (match: SearchMatch | null) =>
	match ? `${match.nodeId}:${match.columnIndex ?? "table"}` : null;

export type MetamodelNodeType = Node<
	React.ComponentProps<typeof MetamodelNode>["data"]
>;

interface MetamodelProps {
	nodes?: MetamodelNodeType[];
	edges?: Edge[];
	selectedNode?: MetamodelNodeType | null;
	onSelectNode?: (selected: MetamodelNodeType | null) => void;
	callback?: (data) => void;
	isInteractive?: boolean;
	isEditable?: boolean;
	onMetaModelUpdate?: (snapshot: MetamodelNodeType[]) => void;
	dataSourceId?: number | string;
	resetKey?: number;
	columnOptions?: ColumnOption[];
	autoFocusSelectedNode?: boolean;
	highlightSearchTerm?: string;
	showSearch?: boolean;
	searchValue?: string;
	onSearchValueChange?: (value: string) => void;
	onSearchMatchChange?: (match: SearchMatch | null) => void;
	searchInputTestId?: string;
	onViewColumnMetadata?: (payload: {
		nodeId: string;
		tableName: string;
		columnId: string;
		name: string;
		type: string;
		physicalType?: string;
		description?: string;
		logicalNames?: string[];
	}) => void;
}

// COMPONENT

export const Metamodel = (props: MetamodelProps) => {
	const {
		selectedNode = null,
		onSelectNode = () => null,
		nodes = [],
		edges = [],
		callback,
		isInteractive,
		isEditable = false,
		onMetaModelUpdate,
		dataSourceId,
		resetKey,
		columnOptions,
		autoFocusSelectedNode = false,
		highlightSearchTerm,
		showSearch = true,
		searchValue,
		onSearchValueChange,
		onSearchMatchChange,
		searchInputTestId = "metamodel-search-input",
		onViewColumnMetadata,
	} = props;

	// STATE

	const [data, setData] = useState<{
		nodes: MetamodelNodeType[];
		edges: Edge[];
	}>({
		nodes: nodes ?? [],
		edges: edges ?? [],
	});

	const [openEditColumnModal, setOpenEditColumnModal] = useState(false);
	const [columnToEdit, setColumnToEdit] = useState<{
		nodeId: string;
		columnId: string;
		name: string;
		type: string;
		description?: string;
		logicalNames?: string[];
	} | null>(null);

	const existingColumnNames = useMemo(() => {
		if (!columnToEdit) return [];
		const node = data.nodes.find((n) => n.id === columnToEdit.nodeId);
		if (!node) return [];
		return (node.data?.properties || [])
			.filter((prop) => prop.id !== columnToEdit.columnId)
			.map((prop) => prop.name.toLowerCase());
	}, [columnToEdit, data.nodes]);

	const [openEditTableModal, setOpenEditTableModal] = useState(false);
	const [tableToEdit, setTableToEdit] = useState<null | {
		nodeId: string;
		name: string;
	}>(null);
	const [availableColumnNames, setAvailableColumnNames] = useState<
		ColumnOption[]
	>([]);
	const [internalSearchTerm, setInternalSearchTerm] = useState("");
	const [searchMatchIndex, setSearchMatchIndex] = useState(0);

	// REFS

	const isInitialMount = useRef<Record<string | number, boolean>>({});
	const resetKeyRef = useRef<number | null>(null);
	const currentDataSourceRef = useRef<string | number | null>(null);
	const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
	const lastFocusedSearchMatchRef = useRef<string | null>(null);
	const lastEmittedSearchMatchRef = useRef<string | null>(null);
	const lastPropsRef = useRef<{ nodes: MetamodelNodeType[]; edges: Edge[] }>({
		nodes: [],
		edges: [],
	});

	// MODAL HANDLERS

	const openEditForColumn = useCallback(
		(payload: {
			nodeId: string;
			columnId: string;
			name: string;
			type: string;
			description?: string;
			logicalNames?: string[];
		}) => {
			setColumnToEdit(payload);
			setOpenEditColumnModal(true);
		},
		[],
	);

	const closeEditModal = useCallback(() => {
		setOpenEditColumnModal(false);
		setColumnToEdit(null);
	}, []);

	const openEditTable = useCallback(
		(payload: { nodeId: string; name: string; description?: string }) => {
			setTableToEdit(payload);
			setOpenEditTableModal(true);
		},
		[],
	);

	const closeEditTableModal = useCallback(() => {
		setOpenEditTableModal(false);
		setTableToEdit(null);
	}, []);

	// MEMOIZED VALUES

	const injectIsAction = useCallback(
		(incomingNodes: MetamodelNodeType[]): MetamodelNodeType[] =>
			incomingNodes.map((n) => ({
				...n,
				data: {
					name: n.data?.name || "",
					properties: n.data?.properties || [],
					...(n.data || {}),
					isEditable: !!isEditable,
					openEditForColumn: openEditForColumn,
					openEditTable: openEditTable,
					openViewColumnMetadata: onViewColumnMetadata,
				},
			})),
		[isEditable, onViewColumnMetadata, openEditForColumn, openEditTable],
	);

	const initialFlowNodes = useMemo<MetamodelNodeType[]>(
		() => injectIsAction(nodes),
		[nodes, injectIsAction],
	);

	// CUSTOM HOOKS

	const [flowNodes, setFlowNodes, onFlowNodesChange] =
		useNodesState(initialFlowNodes);
	const [flowEdges, setFlowEdges, onFlowEdgesChange] = useEdgesState(edges);

	const effectiveSearchTerm =
		searchValue ?? highlightSearchTerm ?? internalSearchTerm;
	const normalizedSearchTerm = normalizeSearchValue(
		effectiveSearchTerm.trim(),
	);
	const searchMatches = useMemo<SearchMatch[]>(() => {
		if (!normalizedSearchTerm || flowNodes.length === 0) {
			return [];
		}

		const matches: SearchMatch[] = [];
		for (const node of flowNodes) {
			if (
				normalizeSearchValue(node.data?.name || "").includes(
					normalizedSearchTerm,
				)
			) {
				matches.push({ nodeId: node.id, columnIndex: null });
			}

			const properties = node.data?.properties || [];
			properties.forEach((property, index) => {
				if (
					normalizeSearchValue(property?.name || "").includes(
						normalizedSearchTerm,
					)
				) {
					matches.push({
						nodeId: node.id,
						columnIndex: index,
					});
				}
			});
		}

		return matches;
	}, [flowNodes, normalizedSearchTerm]);

	const activeSearchMatch =
		searchMatches.length > 0
			? searchMatches[
					Math.min(searchMatchIndex, searchMatches.length - 1)
				]
			: null;
	const activeSearchMatchKey = getSearchMatchKey(activeSearchMatch);

	// DATA MUTATION HANDLERS

	const applyColumnEdit = useCallback(
		(payload: {
			name?: string;
			type?: string;
			description?: string;
			logicalNames?: string[];
		}) => {
			if (!columnToEdit) return;

			const { nodeId, columnId } = columnToEdit;

			setData((prev) => {
				const node = prev.nodes.find((n) => n.id === nodeId);
				if (!node) {
					closeEditModal();
					return prev;
				}

				const oldProps: Property[] = Array.isArray(node.data.properties)
					? node.data.properties
					: [];

				const updatedProps = updateColumnProperties(
					oldProps,
					columnId,
					payload,
				);
				if (!updatedProps) {
					closeEditModal();
					return prev;
				}

				const newNodes = prev.nodes.map((n) =>
					n.id === nodeId
						? {
								...n,
								data: {
									...n.data,
									properties: updatedProps,
								},
							}
						: n,
				);

				if (callback) {
					callback({ nodes: newNodes, edges: prev.edges });
				}

				if (onMetaModelUpdate) {
					try {
						onMetaModelUpdate(JSON.parse(JSON.stringify(newNodes)));
					} catch {
						onMetaModelUpdate(newNodes);
					}
				}
				closeEditModal();
				return { ...prev, nodes: newNodes };
			});

			setFlowNodes((cur) => {
				if (!Array.isArray(cur)) return cur;

				return cur.map((n) => {
					if (n.id !== nodeId) return n;

					const oldProps: Property[] = Array.isArray(
						n.data?.properties,
					)
						? n.data.properties
						: [];

					const updatedProps = updateColumnProperties(
						oldProps,
						columnId,
						payload,
					);
					if (!updatedProps) return n;

					return {
						...n,
						data: {
							...n.data,
							properties: updatedProps,
						},
					};
				});
			});
		},
		[
			columnToEdit,
			callback,
			closeEditModal,
			onMetaModelUpdate,
			setFlowNodes,
		],
	);

	const applyReplaceColumnsForNode = useCallback(
		(
			nodeId: string,
			payload: {
				names: string[];
				type?: string;
				description?: string;
				alias?: string;
			},
		) => {
			if (!nodeId) return;

			const names = Array.isArray(payload.names)
				? payload.names.map((s) => (s || "").trim()).filter(Boolean)
				: [];
			const chosenType = payload.type ?? "varchar";
			const { description, alias } = payload;

			setData((prev) => {
				const node = prev.nodes.find((n) => n.id === nodeId);
				if (!node) return prev;

				const existingProps = node.data?.properties || [];

				const newProps = createPropertiesFromNames(
					nodeId,
					names,
					existingProps,
					availableColumnNames,
					chosenType,
				);

				const updatedNodeData = {
					properties: newProps,
					description: description !== null ? description : "",
					name: alias !== null ? alias : node.data?.name,
				};

				const newNodes = prev.nodes.map((n) =>
					n.id === nodeId
						? {
								...n,
								data: {
									...n.data,
									...updatedNodeData,
								},
							}
						: n,
				);

				if (callback) {
					callback({ nodes: newNodes, edges: prev.edges });
				}

				if (onMetaModelUpdate) {
					try {
						onMetaModelUpdate(JSON.parse(JSON.stringify(newNodes)));
					} catch {
						onMetaModelUpdate(newNodes);
					}
				}

				return { ...prev, nodes: newNodes };
			});

			setFlowNodes((cur) => {
				if (!Array.isArray(cur)) return cur;

				return cur.map((n) => {
					if (n.id !== nodeId) return n;

					const existingProps = n.data?.properties || [];

					const newProps = createPropertiesFromNames(
						nodeId,
						names,
						existingProps,
						availableColumnNames,
						chosenType,
					);

					const updatedNodeData = {
						properties: newProps,
						description: description !== null ? description : "",
						name: alias !== null ? alias : n.data?.name,
					};

					return {
						...n,
						data: {
							...n.data,
							...updatedNodeData,
						},
					};
				});
			});
		},
		[availableColumnNames, callback, onMetaModelUpdate, setFlowNodes],
	);

	const updateData = useCallback((nodeData, action: string) => {
		setData((prev) => {
			const temp = { ...prev };

			if (action === "COLUMN_NAME_CHANGE") {
				for (const node of temp.nodes) {
					if (node.id === nodeData.table.id) {
						for (const col of node.data.properties) {
							if (col.name === nodeData.prevName) {
								col.name = nodeData.newName;
								col.id = nodeData.newName;
							}
						}
					}
				}
				return { ...temp };
			}
			if (action === "COLUMN_TYPE_CHANGE") {
				// handle column type change
			}
			if (action === "COLUMN_DESCRIPTION_CHANGE") {
				// handle column type change
			}
			if (action === "COLUMN_LOGICAL_NAME_CHANGE") {
				// handle column type change
			}

			if (action === "TABLE_NAME_CHANGE") {
				// handle table name change
			}
			if (action === "TABLE_DESCRIPTION_CHANGE") {
				// handle table relationship change
			}
			if (action === "TABLE_RELATIONSHIP_CHANGE") {
				// handle table relationship change
			}
			if (action === "TABLE_POSITION_CHANGE") {
				// handle table relationship change
			}

			return prev;
		});
	}, []);

	// ACTION HANDLERS

	const onSubmit = useCallback(() => {
		const payloadObj = {
			metamodel: { relation: [], nodeProp: {} },
			dataTypeMap: {},
			newHeaders: {},
			additionalDataTypes: {},
			descriptionMap: {},
			logicalNamesMap: {},
			position: [{}],
			nodes: data.nodes,
		};

		for (const edge of data.edges) {
			const relName = `${edge.source}_${edge.target}`;
			payloadObj.metamodel.relation.push({
				fromTable: edge.source,
				toTable: edge.target,
				relName: relName,
			});
		}

		for (const node of data.nodes) {
			for (const col of node.data.properties) {
				payloadObj.dataTypeMap[col.name] = col.type;
			}
			payloadObj.metamodel.nodeProp[node.data.name] = [];
		}

		callback(payloadObj);
	}, [data, callback]);

	const onSelectNodeId = useCallback(
		(id) => {
			let node = null;

			if (id) {
				for (
					let nodeIdx = 0, nodeLen = nodes.length;
					nodeIdx < nodeLen;
					nodeIdx++
				) {
					const n = nodes[nodeIdx];
					if (id === n.id) {
						node = n;
						break;
					}
				}
			}
			onSelectNode(node);
		},
		[nodes, onSelectNode],
	);

	useEffect(() => {
		if (
			resetKeyRef.current !== undefined &&
			resetKeyRef.current !== resetKey
		) {
			const sourceKey = String(dataSourceId ?? "default");
			isInitialMount.current[sourceKey] = false;
		}
		resetKeyRef.current = resetKey;
	}, [resetKey, dataSourceId]);

	useEffect(() => {
		if (!isEditable) {
			const processedNodes = injectIsAction(nodes || []);
			setData({ nodes: processedNodes, edges: edges || [] });
			setFlowNodes(processedNodes);
			setFlowEdges(edges || []);
			return;
		}

		const sourceKey =
			dataSourceId !== undefined ? String(dataSourceId) : "default";

		const dataSourceChanged =
			currentDataSourceRef.current !== undefined &&
			currentDataSourceRef.current !== sourceKey;

		const nodesStr = JSON.stringify(
			nodes?.map((n) => ({
				id: n.id,
				dataLen: n.data?.properties?.length,
			})),
		);
		const edgesStr = JSON.stringify(
			edges?.map((e) => ({
				id: e.id,
				source: e.source,
				target: e.target,
			})),
		);
		const lastNodesStr = JSON.stringify(
			lastPropsRef.current.nodes?.map((n) => ({
				id: n.id,
				dataLen: n.data?.properties?.length,
			})),
		);
		const lastEdgesStr = JSON.stringify(
			lastPropsRef.current.edges?.map((e) => ({
				id: e.id,
				source: e.source,
				target: e.target,
			})),
		);

		const propsChanged =
			nodesStr !== lastNodesStr || edgesStr !== lastEdgesStr;

		if (dataSourceChanged) {
			currentDataSourceRef.current = sourceKey;
			isInitialMount.current[sourceKey] = false;
		} else {
			currentDataSourceRef.current = sourceKey;
		}

		if (
			!isInitialMount.current[sourceKey] ||
			(dataSourceChanged && propsChanged)
		) {
			const nodeCopy =
				Array.isArray(nodes) && nodes.length > 0
					? JSON.parse(JSON.stringify(nodes))
					: [];
			const edgesCopy =
				Array.isArray(edges) && edges.length > 0
					? JSON.parse(JSON.stringify(edges))
					: [];

			const processedNodes = injectIsAction(nodeCopy);

			setData({ nodes: processedNodes, edges: edgesCopy });
			setFlowNodes(processedNodes);
			setFlowEdges(edgesCopy);

			lastPropsRef.current = { nodes: nodeCopy, edges: edgesCopy };

			if (onMetaModelUpdate && processedNodes.length > 0) {
				onMetaModelUpdate(processedNodes);
			}

			isInitialMount.current[sourceKey] = true;
		} else if (propsChanged) {
			const computed = injectIsAction(nodes || []);
			if (!nodeIdsEqual(flowNodes, computed)) {
				setFlowNodes(computed);
				setData((prev) => ({
					...prev,
					nodes: computed,
				}));
			}

			if (!edgeIdsEqual(data.edges, edges || [])) {
				setData((prev) => ({
					...prev,
					edges: edges || [],
				}));
				setFlowEdges(edges || []);
			}

			lastPropsRef.current = { nodes: nodes || [], edges: edges || [] };
		}
	}, [
		nodes,
		edges,
		isEditable,
		dataSourceId,
		injectIsAction,
		flowNodes,
		setFlowNodes,
		setFlowEdges,
		onMetaModelUpdate,
		data.edges,
	]);

	useEffect(() => {
		if (isEditable) {
			setAvailableColumnNames(columnOptions || []);
		} else {
			setAvailableColumnNames([]);
		}
	}, [columnOptions, isEditable]);

	useEffect(() => {
		if (searchMatchIndex < searchMatches.length) {
			return;
		}

		setSearchMatchIndex(0);
	}, [searchMatchIndex, searchMatches.length]);

	useEffect(() => {
		if (lastEmittedSearchMatchRef.current !== activeSearchMatchKey) {
			lastEmittedSearchMatchRef.current = activeSearchMatchKey;
			onSearchMatchChange?.(activeSearchMatch);
		}
	}, [activeSearchMatch, activeSearchMatchKey, onSearchMatchChange]);

	useEffect(() => {
		if (!activeSearchMatch || !activeSearchMatchKey) {
			lastFocusedSearchMatchRef.current = null;
			return;
		}

		if (lastFocusedSearchMatchRef.current === activeSearchMatchKey) {
			return;
		}
		lastFocusedSearchMatchRef.current = activeSearchMatchKey;

		onSelectNodeId(activeSearchMatch.nodeId);

		const flowInstance = flowInstanceRef.current;
		if (!flowInstance) {
			return;
		}

		const matchedNode = flowNodes.find(
			(n) => n.id === activeSearchMatch.nodeId,
		);
		if (!matchedNode) {
			return;
		}

		flowInstance.setCenter(
			matchedNode.position.x + 180,
			matchedNode.position.y + 120,
			{
				duration: 120,
				zoom: flowInstance.getZoom(),
			},
		);
	}, [activeSearchMatch, activeSearchMatchKey, flowNodes, onSelectNodeId]);

	useEffect(() => {
		if (!autoFocusSelectedNode || !selectedNode?.id) {
			return;
		}

		const flowInstance = flowInstanceRef.current;
		if (!flowInstance) {
			return;
		}

		const selectedFlowNode = flowNodes.find(
			(n) => n.id === selectedNode.id,
		);
		if (!selectedFlowNode) {
			return;
		}

		flowInstance.setCenter(
			selectedFlowNode.position.x + 180,
			selectedFlowNode.position.y + 120,
			{
				duration: 120,
				zoom: flowInstance.getZoom(),
			},
		);
	}, [autoFocusSelectedNode, selectedNode?.id, flowNodes]);

	return (
		<MetamodelContext.Provider
			value={{
				selectedNodeId: selectedNode ? selectedNode.id : null,
				onSelectNodeId: onSelectNodeId,
				searchTerm: effectiveSearchTerm,
				isInteractive: isInteractive,
				updateData: updateData,
			}}
		>
			<div className="relative h-full w-full">
				{showSearch ? (
					<div className="absolute top-3 left-3 z-20 w-[min(32rem,calc(100%-1.5rem))]">
						<Input
							value={effectiveSearchTerm}
							onChange={(e) => {
								const value = e.target.value;
								if (onSearchValueChange) {
									onSearchValueChange(value);
								} else {
									setInternalSearchTerm(value);
								}
								setSearchMatchIndex(0);
							}}
							onKeyDown={(e) => {
								if (
									e.key !== "Enter" ||
									searchMatches.length === 0
								) {
									return;
								}

								e.preventDefault();
								setSearchMatchIndex((current) => {
									if (e.shiftKey) {
										return (
											(current -
												1 +
												searchMatches.length) %
											searchMatches.length
										);
									}

									return (current + 1) % searchMatches.length;
								});
							}}
							className="bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85"
							placeholder="Search table or column..."
							data-testid={searchInputTestId}
						/>
					</div>
				) : null}
				<ReactFlow
					nodes={flowNodes}
					edges={flowEdges}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					onInit={(instance) => {
						flowInstanceRef.current = instance;
					}}
					fitView={true}
					onNodesChange={onFlowNodesChange}
					onEdgesChange={onFlowEdgesChange}
					defaultViewport={{ x: 70, y: 50, zoom: 1 }}
				>
					<MiniMap pannable zoomable />
					<Controls showInteractive={false} />
				</ReactFlow>

				{callback && (
					<div className="absolute bottom-4 left-4 z-10">
						<Button
							onClick={onSubmit}
							data-testid="metamodel-apply-btn"
							variant="default"
							className="shadow-lg"
						>
							Apply
						</Button>
					</div>
				)}
			</div>

			<Editmetamodel
				open={openEditColumnModal}
				onClose={closeEditModal}
				isEdit={true}
				initialName={columnToEdit?.name ?? ""}
				initialType={columnToEdit?.type ?? ""}
				initialDescription={columnToEdit?.description ?? ""}
				initialLogicalNames={columnToEdit?.logicalNames ?? []}
				existingColumnNames={existingColumnNames}
				onSave={(p) =>
					applyColumnEdit(
						p as {
							name?: string;
							type?: string;
							description?: string;
							logicalNames?: string[];
						},
					)
				}
			/>

			<EditTable
				open={openEditTableModal}
				onClose={closeEditTableModal}
				node={
					tableToEdit
						? data.nodes.find((n) => n.id === tableToEdit.nodeId)
						: null
				}
				columnOptions={availableColumnNames}
				initialAlias={
					tableToEdit
						? (data.nodes.find((n) => n.id === tableToEdit.nodeId)
								?.data?.name ?? "")
						: ""
				}
				onSave={({ nodeId, names, description, alias }) => {
					applyReplaceColumnsForNode(nodeId, {
						names,
						description,
						alias,
					});
					closeEditTableModal();
				}}
			/>
		</MetamodelContext.Provider>
	);
};

export default Metamodel;
