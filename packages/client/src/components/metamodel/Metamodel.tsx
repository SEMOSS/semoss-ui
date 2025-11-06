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
import { Button } from "@semoss/ui";
import { MetamodelContext } from "@/contexts";
import type { Property } from "../import/database/MetamodelTypes";
import Editmetamodel from "./Editmetamodel";
import EditTable from "./Edittable";
import { FloatingEdge } from "./FloatingEdge";
import { MetamodelNode } from "./MetamodelNode";

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

	isAction?: boolean;

	onMetaModelUpdate?: (snapshot: MetamodelNodeType[]) => void;
}
export interface ColumnOption {
	id: string;
	name: string;
}

export const Metamodel = (props: MetamodelProps) => {
	const {
		selectedNode = null,
		onSelectNode = () => null,
		nodes = [],
		edges = [],
		callback,
		isInteractive,
		isAction = false,
		onMetaModelUpdate,
	} = props;

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

	const closeEditModal = useCallback(() => {
		setOpenEditColumnModal(false);
		setColumnToEdit(null);
	}, []);

	const [openEditTableModal, setOpenEditTableModal] = useState(false);
	const [tableToEdit, setTableToEdit] = useState<null | {
		nodeId: string;
		name: string;
	}>(null);
	const [availableColumnNames, setAvailableColumnNames] = useState<
		ColumnOption[]
	>([]);

	const isInitialMount = useRef(true);

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

	const closeEditTableModal = useCallback(() => {
		setOpenEditTableModal(false);
		setTableToEdit(null);
	}, []);

	const openEditTable = useCallback(
		(payload: { nodeId: string; name: string; description?: string }) => {
			setTableToEdit(payload);
			setOpenEditTableModal(true);
		},
		[],
	);

	const getAllColumnNamesFromNodes = useCallback(
		(nodes: MetamodelNodeType[]): ColumnOption[] => {
			const result: ColumnOption[] = [];
			const seen = new Set<string>();

			if (!Array.isArray(nodes)) return result;

			for (const n of nodes) {
				const props = n?.data?.properties || [];

				for (const p of props) {
					const id = p?.id;
					const name = p?.name;
					if (!name && !id) continue;

					const key = id ?? name;

					if (!seen.has(key)) {
						seen.add(key);
						result.push({ id, name });
					}
				}
			}

			return result;
		},
		[],
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

				const newProps = names.map((nm) => {
					const existing = existingProps.find((p) => p.name === nm);
					if (existing) return existing;

					const matchedAvailable =
						Array.isArray(availableColumnNames) &&
						availableColumnNames.find(
							(c) => c.name === nm || c.id === nm,
						);

					let newId =
						matchedAvailable?.id ??
						`${nodeId}.${nm.replace(/\s+/g, "_")}`;

					if (existingProps.some((p) => p.id === newId)) {
						newId = `${newId}_${Date.now()}`;
					}

					return { id: newId, name: nm, type: chosenType };
				});

				const updatedNodeData = {
					properties: newProps,
					description: description !== undefined ? description : "",
					name: alias !== undefined ? alias : node.data?.name,
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

				// Call callbacks synchronously within the state update
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

			// Update flowNodes separately, outside of setData
			setFlowNodes((cur) => {
				if (!Array.isArray(cur)) return cur;

				return cur.map((n) => {
					if (n.id !== nodeId) return n;

					const updatedNodeData = {
						properties: names.map((nm) => {
							const existing = n.data?.properties?.find(
								(p) => p.name === nm,
							);
							if (existing) return existing;

							const matchedAvailable =
								Array.isArray(availableColumnNames) &&
								availableColumnNames.find(
									(c) => c.name === nm || c.id === nm,
								);

							let newId =
								matchedAvailable?.id ??
								`${nodeId}.${nm.replace(/\s+/g, "_")}`;

							if (
								n.data?.properties?.some((p) => p.id === newId)
							) {
								newId = `${newId}_${Date.now()}`;
							}

							return { id: newId, name: nm, type: chosenType };
						}),
						description:
							description !== undefined ? description : "",
						name: alias !== undefined ? alias : n.data?.name,
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
		[availableColumnNames, callback, onMetaModelUpdate],
	);

	const applyColumnEdit = useCallback(
		(payload: {
			name?: string;
			type?: string;
			description?: string;
			logicalNames?: string[];
		}) => {
			if (!columnToEdit) return;

			const { nodeId, columnId } = columnToEdit;
			const newName = (payload.name ?? "").trim();
			const newType = payload.type ?? undefined;
			const newDescription = payload.description;
			const newLogicalNames = Array.isArray(payload.logicalNames)
				? payload.logicalNames
				: undefined;

			const updateProperties = (oldProps: Property[]) => {
				let targetIdx = oldProps.findIndex((p) => p.id === columnId);
				if (targetIdx === -1) {
					targetIdx = oldProps.findIndex((p) => p.name === columnId);
				}
				if (targetIdx === -1) return null;

				const targetProp = oldProps[targetIdx];
				const oldName = targetProp.name;

				const nameUnchanged = !newName || newName === oldName;
				const typeUnchanged =
					newType === undefined || newType === targetProp.type;
				const descUnchanged =
					newDescription === undefined ||
					newDescription === targetProp.description;
				const logicalNamesUnchanged =
					newLogicalNames === undefined ||
					JSON.stringify(newLogicalNames) ===
						JSON.stringify(targetProp.logicalNames || []);

				if (
					nameUnchanged &&
					typeUnchanged &&
					descUnchanged &&
					logicalNamesUnchanged
				) {
					return null;
				}

				const updatedProps = oldProps.map((p, idx) =>
					idx === targetIdx
						? {
								...p,
								name: newName || p.name,
								type: newType ?? p.type,
								description:
									newDescription !== undefined
										? newDescription
										: p.description,
								logicalNames:
									newLogicalNames !== undefined
										? newLogicalNames
										: p.logicalNames,
							}
						: p,
				);

				const dupIdx = updatedProps.findIndex(
					(p, idx) =>
						idx !== targetIdx &&
						p.name === updatedProps[targetIdx].name,
				);

				return dupIdx !== -1
					? updatedProps.filter((_, idx) => idx !== dupIdx)
					: updatedProps;
			};

			setData((prev) => {
				const node = prev.nodes.find((n) => n.id === nodeId);
				if (!node) {
					closeEditModal();
					return prev;
				}

				const oldProps: Property[] = Array.isArray(node.data.properties)
					? node.data.properties
					: [];

				const updatedProps = updateProperties(oldProps);
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

					const updatedProps = updateProperties(oldProps);
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
		[columnToEdit, callback, closeEditModal, onMetaModelUpdate],
	);
	const injectIsAction = useCallback(
		(incomingNodes: MetamodelNodeType[]): MetamodelNodeType[] =>
			incomingNodes.map((n) => ({
				...n,
				data: {
					name: n.data?.name || "",
					properties: n.data?.properties || [],
					...(n.data || {}),
					isAction: !!isAction,
					openEditForColumn: openEditForColumn,
					openEditTable: openEditTable,
				},
			})),
		[isAction, openEditForColumn, openEditTable],
	);

	const nodeIdsEqual = useCallback(
		(a: MetamodelNodeType[] = [], b: MetamodelNodeType[] = []) => {
			if (!Array.isArray(a) || !Array.isArray(b)) return false;
			if (a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++)
				if (a[i].id !== b[i].id) return false;
			return true;
		},
		[],
	);

	const edgeIdsEqual = useCallback((a: Edge[] = [], b: Edge[] = []) => {
		if (!Array.isArray(a) || !Array.isArray(b)) return false;
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++)
			if (
				(a[i].id || `${a[i].source}_${a[i].target}`) !==
				(b[i].id || `${b[i].source}_${b[i].target}`)
			)
				return false;
		return true;
	}, []);

	const initialFlowNodes = useMemo<MetamodelNodeType[]>(
		() => (isAction ? injectIsAction(nodes) : nodes),
		[isAction, nodes, injectIsAction],
	);

	const [flowNodes, setFlowNodes, onFlowNodesChange] =
		useNodesState(initialFlowNodes);
	const [flowEdges, setFlowEdges, onFlowEdgesChange] = useEdgesState(edges);

	useEffect(() => {
		const computed = isAction ? injectIsAction(nodes || []) : nodes || [];

		if (!nodeIdsEqual(flowNodes, computed)) {
			setFlowNodes(computed);
		}

		if (!edgeIdsEqual(flowEdges, edges || [])) {
			setFlowEdges(edges || []);
		}
	}, [
		nodes,
		edges,
		isAction,
		injectIsAction,
		nodeIdsEqual,
		edgeIdsEqual,
		flowNodes,
		flowEdges,
		setFlowNodes,
		setFlowEdges,
	]);

	useEffect(() => {
		if (!isAction) return;

		const incoming = (nodes || []).map((n) => ({
			...n,
		}));

		setData({ nodes: incoming, edges: edges || [] });
		if (!edgeIdsEqual(flowEdges, edges || [])) {
			setFlowEdges(edges || []);
		}
	}, [nodes, edges, isAction, edgeIdsEqual, flowEdges, setFlowEdges]);

	useEffect(() => {
		const columnNames = getAllColumnNamesFromNodes(nodes || []);
		setAvailableColumnNames(columnNames);

		if (isInitialMount.current) {
			const nodeCopy = Array.isArray(nodes)
				? JSON.parse(JSON.stringify(nodes))
				: [];
			const edgesCopy = Array.isArray(edges)
				? JSON.parse(JSON.stringify(edges))
				: [];

			setData({ nodes: nodeCopy, edges: edgesCopy });

			if (onMetaModelUpdate) {
				onMetaModelUpdate(nodeCopy);
			}

			isInitialMount.current = false;
		} else if (isAction) {
			if (!edgeIdsEqual(data.edges, edges || [])) {
				setData((prev) => ({
					...prev,
					edges: edges || [],
				}));
			}

			if (!edgeIdsEqual(flowEdges, edges || [])) {
				setFlowEdges(edges || []);
			}
		}
	}, [
		nodes,
		edges,
		isAction,
		getAllColumnNamesFromNodes,
		onMetaModelUpdate,
		edgeIdsEqual,
		flowEdges,
		setFlowEdges,
		data.edges,
	]);

	const updateData = useCallback((nodeData, action) => {
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
				// temp[node.data.name].push(col.name);
				// if (idx === 0) {
				// no-op to skip pushing in the first column bc nodeProp does not accept the first column !!! Need to figure out why?
				// } else {
				// if (node.data.properties.length <= 1) {
				//     // no-op
				// } else {
				//     temp.push(col.name);
				// }
				// }
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
	return (
		<MetamodelContext.Provider
			value={{
				selectedNodeId: selectedNode ? selectedNode.id : null,
				onSelectNodeId: onSelectNodeId,
				isInteractive: isInteractive,
				updateData: updateData,
			}}
		>
			<ReactFlow
				nodes={flowNodes}
				edges={flowEdges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				onNodesChange={onFlowNodesChange}
				onEdgesChange={onFlowEdgesChange}
				defaultViewport={{ x: 70, y: 50, zoom: 1 }}
			>
				<MiniMap />
				<Controls showInteractive={false} />
			</ReactFlow>

			{callback && (
				<Button
					onClick={() => {
						onSubmit();
					}}
				>
					Apply
				</Button>
			)}

			<Editmetamodel
				open={openEditColumnModal}
				onClose={closeEditModal}
				isEdit={true}
				initialName={columnToEdit?.name ?? ""}
				initialType={columnToEdit?.type ?? ""}
				initialDescription={columnToEdit?.description ?? ""}
				initialLogicalNames={columnToEdit?.logicalNames ?? []}
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
