import {
	Controls,
	type Edge,
	MiniMap,
	type Node,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";
import { Button } from "@semoss/ui/next";
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

	// REFS

	const isInitialMount = useRef<Record<string | number, boolean>>({});
	const resetKeyRef = useRef<number | null>(null);
	const currentDataSourceRef = useRef<string | number | null>(null);
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
				},
			})),
		[isEditable, openEditForColumn, openEditTable],
	);

	const initialFlowNodes = useMemo<MetamodelNodeType[]>(
		() => (isEditable ? injectIsAction(nodes) : nodes),
		[isEditable, nodes, injectIsAction],
	);

	// CUSTOM HOOKS

	const [flowNodes, setFlowNodes, onFlowNodesChange] =
		useNodesState(initialFlowNodes);
	const [flowEdges, setFlowEdges, onFlowEdgesChange] = useEdgesState(edges);

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
			setData({ nodes: nodes || [], edges: edges || [] });
			setFlowNodes(nodes || []);
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
		onMetaModelUpdate,
		data.edges,
		flowNodes,
		setFlowNodes,
		setFlowEdges,
	]);

	useEffect(() => {
		if (isEditable) {
			setAvailableColumnNames(columnOptions || []);
		} else {
			setAvailableColumnNames([]);
		}
	}, [columnOptions, isEditable]);

	return (
		<MetamodelContext.Provider
			value={{
				selectedNodeId: selectedNode ? selectedNode.id : null,
				onSelectNodeId: onSelectNodeId,
				isInteractive: isInteractive,
				updateData: updateData,
			}}
		>
			<div className="relative h-full w-full">
				<ReactFlow
					nodes={flowNodes}
					edges={flowEdges}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					fitView={true}
					onNodesChange={onFlowNodesChange}
					onEdgesChange={onFlowEdgesChange}
					defaultViewport={{ x: 70, y: 50, zoom: 1 }}
				>
					<MiniMap />
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
