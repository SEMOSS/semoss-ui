import {
	Controls,
	type Edge,
	MiniMap,
	type Node,
	ReactFlow,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import "@xyflow/react/dist/style.css";
import { Button } from "@semoss/ui";
import { MetamodelContext } from "@/contexts";
import type { Property } from "../import/database/MetaModelType";
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

	const [data, setData] = useState<{ nodes; edges }>({
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
	const [availableColumnNames, setAvailableColumnNames] = useState<string[]>(
		[],
	);
	const [localNodesData, setLocalNodesData] = useState<MetamodelNodeType[]>(
		[],
	);
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
		(payload: { nodeId: string; name: string }) => {
			setTableToEdit(payload);
			setOpenEditTableModal(true);
		},
		[],
	);

	const getAllColumnNamesFromNodes = (nodes) => {
		const result = [];
		if (!Array.isArray(nodes)) return result;
		for (const n of nodes) {
			const props = n?.data?.properties || [];
			for (const p of props) {
				const name = p?.name;
				if (!name) continue;
				if (!result.includes(name)) result.push(name);
			}
		}
		return result;
	};

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

			const node = data.nodes.find((n) => n.id === nodeId);
			const existingProps = node?.data?.properties || [];

			const newProps = names.map((nm) => {
				const existing = existingProps.find((p) => p.name === nm);
				if (existing) return existing;
				let newId = `${nodeId}.${nm.replace(/\s+/g, "_")}`;
				if (existingProps.some((p) => p.id === newId)) {
					newId = `${newId}_${Date.now()}`;
				}
				return { id: newId, name: nm, type: chosenType };
			});

			const newlyCreatedNames = newProps
				.map((p) => p.name)
				.filter((n) => n && !availableColumnNames.includes(n));
			if (newlyCreatedNames.length > 0) {
				setAvailableColumnNames((prev) =>
					Array.from(new Set([...prev, ...newlyCreatedNames])),
				);
			}

			setData((prev) => {
				const newNodes = prev.nodes.map((n) =>
					n.id === nodeId
						? {
								...n,
								data: {
									...n.data,
									properties: newProps,
									description:
										description !== undefined
											? description
											: n.data?.description,
									name:
										alias !== undefined
											? alias
											: n.data?.name,
								},
							}
						: n,
				);
				return { ...prev, nodes: newNodes };
			});

			setFlowNodes((cur) =>
				Array.isArray(cur)
					? cur.map((n) =>
							n.id === nodeId
								? {
										...n,
										data: {
											...n.data,
											properties: newProps,
											description:
												description !== undefined
													? description
													: n.id,
											name:
												alias !== undefined
													? alias
													: n.data?.name,
										},
									}
								: n,
						)
					: cur,
			);

			setLocalNodesData((prev) => {
				const newMetadata = prev.map((n) =>
					n.id === nodeId
						? {
								...n,
								data: {
									...n.data,
									properties: newProps,
									description:
										description !== undefined
											? description
											: n.id,
									name:
										alias !== undefined
											? alias
											: n.data?.name,
								},
							}
						: n,
				);
				onMetaModelUpdate?.(newMetadata);
				return newMetadata;
			});

			if (callback) {
				const cur = data || { nodes: [], edges: [] };
				const newNodes = cur.nodes.map((n) =>
					n.id === nodeId
						? {
								...n,
								data: {
									...n.data,
									properties: newProps,
									description:
										description !== undefined
											? description
											: n.data?.description,
									name:
										alias !== undefined
											? alias
											: n.data?.name,
								},
							}
						: n,
				);
				callback({ nodes: newNodes, edges: cur.edges });
			}
		},
		[data, callback, availableColumnNames, props],
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

			const node = data.nodes.find((n) => n.id === nodeId);
			if (!node) {
				closeEditModal();
				return;
			}

			const oldProps: Property[] = Array.isArray(node.data.properties)
				? node.data.properties
				: [];

			let targetIdx = oldProps.findIndex((p) => p.id === columnId);
			if (targetIdx === -1) {
				targetIdx = oldProps.findIndex((p) => p.name === columnId);
			}
			if (targetIdx === -1) {
				closeEditModal();
				return;
			}

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
				closeEditModal();
				return;
			}

			const updatedProps = oldProps.map((p, idx) =>
				idx === targetIdx
					? {
							...p,
							id: p.id,
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
			let updatedPropsForSave = updatedProps;
			if (dupIdx !== -1) {
				updatedPropsForSave = updatedProps.filter(
					(_, idx) => idx !== dupIdx,
				);
			}

			setData((prev) => {
				const newNodes = prev.nodes.map((n) =>
					n.id === nodeId
						? {
								...n,
								data: {
									...n.data,
									properties: updatedPropsForSave,
								},
							}
						: n,
				);
				return { ...prev, nodes: newNodes };
			});

			setFlowNodes((cur) =>
				(cur || []).map((n) =>
					n.id === nodeId
						? {
								...n,
								data: {
									...n.data,
									properties: updatedPropsForSave,
								},
							}
						: n,
				),
			);

			setLocalNodesData((prev) => {
				const newSnapshot = (prev || []).map((n) =>
					n.id === nodeId
						? {
								...n,
								data: {
									...n.data,
									properties: updatedPropsForSave,
								},
							}
						: n,
				);
				try {
					props.onMetaModelUpdate?.(
						JSON.parse(JSON.stringify(newSnapshot)),
					);
				} catch {
					props.onMetaModelUpdate?.(newSnapshot);
				}
				return newSnapshot;
			});

			if (callback) {
				const cur = data || { nodes: [], edges: [] };
				const newNodes = cur.nodes.map((n) =>
					n.id === nodeId
						? {
								...n,
								data: {
									...n.data,
									properties: updatedPropsForSave,
								},
							}
						: n,
				);
				callback({ nodes: newNodes, edges: cur.edges });
			}

			closeEditModal();
		},
		[columnToEdit, data, callback, closeEditModal, props],
	);

	const injectIsAction = useCallback(
		(incomingNodes): MetamodelNodeType[] =>
			incomingNodes.map((n) => ({
				...n,
				data: {
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
	}, [nodes, edges, isAction, injectIsAction, nodeIdsEqual, edgeIdsEqual]);

	useEffect(() => {
		if (!isAction) return;

		const incoming = (nodes || []).map((n) => ({
			...n,
		}));

		setData({ nodes: incoming, edges: edges || [] });
		if (!edgeIdsEqual(flowEdges, edges || [])) {
			setFlowEdges(edges || []);
		}
	}, [nodes, edges, isAction, injectIsAction]);

	useEffect(() => {
		if (typeof props.onMetaModelUpdate === "function") {
			try {
				const cloned = JSON.parse(JSON.stringify(localNodesData));
				props.onMetaModelUpdate(cloned);
			} catch {
				props.onMetaModelUpdate(localNodesData);
			}
		}
	}, [localNodesData]);

	useEffect(() => {
		setAvailableColumnNames(
			getAllColumnNamesFromNodes(nodes || []).flatMap((n) =>
				(n.data?.properties || []).map((p) => p.name),
			),
		);
		setLocalNodesData(
			Array.isArray(nodes) ? JSON.parse(JSON.stringify(nodes)) : [],
		);
		if (props.onMetaModelUpdate) {
			props.onMetaModelUpdate(
				Array.isArray(nodes) ? JSON.parse(JSON.stringify(nodes)) : [],
			);
		}
	}, [nodes]);

	const updateData = (nodeData, action) => {
		const temp = data;
		if (action === "COLUMN_NAME_CHANGE") {
			for (const node of temp.nodes) {
				if (node.id === nodeData.table.id) {
					for (const col of node.data.properties) {
						if (col.name === nodeData.prevName) {
							col.name = nodeData.newName;
							col.id = nodeData.newName;
							setData({ ...temp });
						}
					}
				}
			}
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
		// if action === 'column data type change'
	};

	const onSubmit = () => {
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

		// callback(payloadObj);
		callback(payloadObj);
	};

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
		[nodes],
	);

	useEffect(() => {
		const fromNodes = getAllColumnNamesFromNodes(nodes || []);
		setAvailableColumnNames((prev) => {
			const merged = Array.from(new Set([...prev, ...fromNodes]));
			return merged;
		});
	}, [nodes]);

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
				initialDescription={
					tableToEdit
						? (data.nodes.find((n) => n.id === tableToEdit.nodeId)
								?.data?.description ?? "")
						: ""
				}
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
