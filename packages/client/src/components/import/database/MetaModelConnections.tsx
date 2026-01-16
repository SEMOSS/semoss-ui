import { Create, FitScreen, TableRows } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import type React from "react";
import {
	useCallback,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	Box,
	Button,
	Checkbox,
	Chip,
	Divider,
	IconButton,
	List,
	Menu,
	Stack,
	styled,
	Table,
	Typography,
} from "@semoss/ui";
import { Metamodel } from "@/components/metamodel";
import CreateConnection from "@/components/metamodel/CreateConnection";
import { Section } from "@/components/ui";
import type {
	Edge,
	FlowData,
	FlowNode,
	MetaModelTypeProps,
	MetamodelNode,
	ParsedResult,
	Property,
} from "./MetamodelTypes";
import {
	createPayloadsFromFlowStates,
	transformMetaToParsed,
} from "./MetamodelUtils";
import { PortalModal } from "./portal";

const StyledPage = styled("div")(() => ({
	position: "relative",
	zIndex: "0",
	padding: "16px",
}));

const StyledMetamodelContainer = styled("section")<{
	showFullScreenModal: boolean;
}>(({ showFullScreenModal }) => ({
	height: showFullScreenModal ? "calc(100vh - 150px)" : "calc(100vh - 360px)",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	transition: "height 0.3s ease",
}));

const StyledTableContainer = styled(Table.Container)(() => ({
	height: "396px",
}));
const StyledOuterContainer = styled(Box)(() => ({
	height: "100%",
	width: "100%",
}));

const StyledInnerContainer = styled(Box)<{
	showFullScreenModal: boolean;
}>(({ showFullScreenModal, theme }) => ({
	position: "relative",
	flex: 1,
	width: "100%",
	backgroundColor: theme.palette.background.paper,
	border: "1px solid white",
	borderRadius: 2,
	transition: "all 220ms ease",
	overflow: "visible",
	margin: "16px 0",
	height: showFullScreenModal ? "100vh" : "auto",
}));

const StyledMenuItem = styled(Menu.Item)(() => ({
	display: "flex",
	alignItems: "center",
	gap: 1,
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
	border: `1px solid ${theme.palette.secondary.border}`,
}));

const StyledList = styled(Box)(() => ({
	maxHeight: 200,
	overflow: "auto",
}));

const StyledHeader = styled(Typography)(({ theme }) => ({
	marginTop: theme.spacing(2),
}));

const StyledMenuContainer = styled(Box)(() => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	padding: "8px 16px",
}));

const StyledMenuHeader = styled(Box)(() => ({
	display: "flex",
	alignItems: "center",
}));

const StyledButton = styled(Button)(() => ({
	textTransform: "none",
	minWidth: "auto",
}));

export const MetaModelConnections = observer(
	({
		parsedData,
		onImport,
		onCancel,
		onImportConnections,
	}: MetaModelTypeProps) => {
		const parsed = parsedData?.[0];
		console.log("MetaModelType parsedData:", parsedData);
		const portalContentId = useId();
		const [selectedNode, setSelectedNode] =
			useState<React.ComponentProps<typeof Metamodel>["selectedNode"]>(
				null,
			);
		const [columnPage, setColumnPage] = useState<number>(0);
		const [columnVisibleRows, setColumnVisibleRows] = useState<number>(5);
		// const [counter, setCounter] = useState(0);
		const [openCreateConnectionModal, setopenCreateConnectionModal] =
			useState(false);
		const [flow, setFlow] = useState<FlowData>({
			nodes: [],
			edges: [],
		});
		const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
		const [anchorNodesMenu, setAnchorNodesMenu] =
			useState<HTMLElement | null>(null);
		const [showFullScreenModal, setShowFullScreenModal] = useState(false);
		const portalHostRef = useRef<HTMLDivElement | null>(null);
		const originalParentRef = useRef<HTMLElement | null>(null);
		const originalNextSiblingRef = useRef<Node | null>(null);

		const nodes = useMemo(() => {
			if (!parsed?.positions) return [];

			return Object.keys(parsed.positions).map((nodeName) => {
				const position = parsed.positions[nodeName];

				const extraProps = parsed.nodeProp?.[nodeName] ?? [];
				const propertiesList = extraProps;

				return {
					id: nodeName,
					type: "metamodel",
					data: {
						name: nodeName?.replace(/_/g, " "),
						properties: propertiesList.map((prop, idx) => ({
							id: `${nodeName}__${prop}`,
							name: prop?.replace(/_/g, " "),
							type:
								parsed.dataTypes?.[prop] ??
								parsed.additionalDataTypes?.[prop] ??
								"",
							isPrimary: idx === 0,
						})),
					},
					position: {
						x: position.left,
						y: position.top,
					},
				};
			});
		}, [parsed]);

		const edges = useMemo(() => {
			if (!parsed?.relation) return [];
			return parsed.relation.map((rel) => ({
				id: rel.fromTable + "." + rel.toCol,
				type: "floating",
				source: rel.fromTable,
				target: rel.toTable,
			}));
		}, [parsed]);

		useEffect(() => {
			const host = portalHostRef.current;
			if (!host) return;

			const modalContent = document.getElementById(portalContentId);
			if (showFullScreenModal && modalContent) {
				originalParentRef.current = host.parentElement;
				originalNextSiblingRef.current = host.nextSibling;
				try {
					modalContent.appendChild(host);
				} catch (err) {
					console.warn("Failed to move host into modal content", err);
				}
			} else {
				const origParent = originalParentRef.current;
				const nextSibling = originalNextSiblingRef.current;
				if (origParent) {
					try {
						if (
							nextSibling &&
							nextSibling.parentNode === origParent
						) {
							origParent.insertBefore(host, nextSibling);
						} else {
							origParent.appendChild(host);
						}
					} catch (err) {
						console.warn(
							"Failed to restore host to original parent",
							err,
						);
					}
					originalParentRef.current = null;
					originalNextSiblingRef.current = null;
				}
			}

			return () => {
				const origParent = originalParentRef.current;
				if (origParent && host) {
					try {
						origParent.appendChild(host);
					} catch {}
				}
			};
		}, [showFullScreenModal, portalContentId]);

		useEffect(() => {
			if (nodes.length > 0) {
				const initial: FlowData = {
					nodes: nodes as FlowNode[],
					edges: edges as Edge[],
				};
				setFlow(initial);
			}
		}, [nodes, edges]);

		const didInitRef = useRef(false);
		useEffect(() => {
			if (!flow?.nodes || flow.nodes.length === 0) return;
			if (!didInitRef.current) {
				setSelectedNodeIds(flow.nodes.map((n) => n.id));
				didInitRef.current = true;
			}
		}, [flow.nodes]);

		const columnRows = useMemo(() => {
			if (!selectedNode?.data?.properties?.length) return [];
			return selectedNode.data.properties.slice(
				columnPage * columnVisibleRows,
				(columnPage + 1) * columnVisibleRows,
			);
		}, [selectedNode, columnPage, columnVisibleRows]);

		const description = selectedNode?.id || "";
		const logicalNames =
			selectedNode?.data?.properties?.map(
				(p: { name: string }): string => p.name,
			) || [];

		const handleNodesMenuOpen = (e: React.MouseEvent<HTMLElement>) =>
			setAnchorNodesMenu(e.currentTarget);
		const handleNodesMenuClose = () => setAnchorNodesMenu(null);

		const attachConnectionsToNodes = (
			nodesInput: (MetamodelNode | FlowNode)[],
			edgesInput: Edge[],
		) => {
			return (nodesInput ?? []).map((n) => {
				const nodeId = n.id;
				const nodeConnections = (edgesInput ?? []).filter(
					(e) => e.source === nodeId || e.target === nodeId,
				);
				return {
					...n,
					connections: nodeConnections.map((e) => ({ ...e })),
				} as MetamodelNode & { connections?: Edge[] };
			});
		};

		const handleSelectAll = (isChecked: boolean) => {
			if (isChecked) {
				setSelectedNodeIds((nodes ?? []).map((n) => n.id));
				const restored = attachConnectionsToNodes(
					JSON.parse(JSON.stringify(nodes ?? [])),
					edges ?? [],
				);
				setFlow({ nodes: restored, edges: edges ?? [] });
			} else {
				setSelectedNodeIds([]);
				setFlow({ nodes: [], edges: [] });
			}
		};

		const handleToggleSelectNode = (nodeId: string) => {
			const isSelected = selectedNodeIds.includes(nodeId);
			const nextSelected = isSelected
				? selectedNodeIds.filter((id) => id !== nodeId)
				: [...selectedNodeIds, nodeId];

			const initialMap = new Map((nodes ?? []).map((n) => [n.id, n]));
			const prevNodes = Array.isArray(flow.nodes) ? flow.nodes : [];
			const prevEdges = Array.isArray(flow.edges) ? flow.edges : [];

			let newNodes: typeof prevNodes;
			let newEdges: Edge[];

			if (isSelected) {
				newNodes = prevNodes.filter((n) => n.id !== nodeId);
				newEdges = prevEdges.filter(
					(e) => e.source !== nodeId && e.target !== nodeId,
				);
			} else {
				const exists = prevNodes.some((n) => n.id === nodeId);
				if (!exists) {
					const canonical = initialMap.get(nodeId);
					const nodeToAdd = canonical
						? JSON.parse(JSON.stringify(canonical))
						: {
								id: nodeId,
								type: "metamodel",
								data: { name: nodeId, properties: [] },
								position: { x: 0, y: 0 },
							};
					newNodes = [...prevNodes, nodeToAdd];
				} else {
					newNodes = prevNodes;
				}
				newEdges = prevEdges;
			}

			const attachedNodes = attachConnectionsToNodes(newNodes, newEdges);
			setFlow({ nodes: attachedNodes, edges: newEdges });
			setSelectedNodeIds(nextSelected);
		};

		const handleClearAll = () => {
			setSelectedNodeIds([]);

			const newEdges: Edge[] = [];

			const prevNodes: (MetamodelNode | FlowNode)[] = Array.isArray(
				flow.nodes,
			)
				? flow.nodes
				: [];

			const attached = attachConnectionsToNodes(prevNodes, newEdges);

			setFlow((prev) => ({
				...prev,
				edges: newEdges,
				nodes: attached,
			}));

			handleNodesMenuClose();
		};

		const makeEdgeIdFromNodeIds = useCallback(
			(sourceId: string, targetId: string) =>
				`${sourceId}_${targetId}`?.replace(/\s+/g, "_"),
			[],
		);

		const getInitialConnections = () => {
			return edgesForMetamodel.map((e) => {
				const sourceNode = flow.nodes.find((n) => n.id === e.source);
				const targetNode = flow.nodes.find((n) => n.id === e.target);
				const parentTable = sourceNode?.data?.name ?? e.source;
				const childTable = targetNode?.data?.name ?? e.target;
				return {
					id: e.id,
					parentTable,
					childTable,
				};
			});
		};
		const handleCreateConnection = ({
			parentTable,
			childTable,
		}: {
			parentTable: string;
			childTable: string;
		}) => {
			const sourceNode = flow.nodes.find(
				(n) => n.data?.name === parentTable || n.id === parentTable,
			);
			const targetNode = flow.nodes.find(
				(n) => n.data?.name === childTable || n.id === childTable,
			);
			if (!sourceNode || !targetNode) {
				console.warn("Source or target node not found");
				return;
			}
			const newEdgeId = `${sourceNode.id}_${targetNode.id}`?.replace(
				/\s+/g,
				"_",
			);
			if (flow.edges.some((e) => e.id === newEdgeId)) {
				console.warn("Edge already exists");
				return;
			}
			const newEdge: Edge = {
				id: newEdgeId,
				source: sourceNode.id,
				target: targetNode.id,
				type: "floating",
			};

			setFlow((prev) => ({
				...prev,
				edges: [...prev.edges, newEdge],
			}));
		};

		const handleEditConnection = (updated: {
			id?: string;
			parentTable: string;
			childTable: string;
		}) => {
			const nodesMap = new Map(
				flow.nodes.map((n) => [n.data?.name, n.id]),
			);
			const newSourceId =
				nodesMap.get(updated.parentTable) ?? updated.parentTable;
			const newTargetId =
				nodesMap.get(updated.childTable) ?? updated.childTable;
			const newId = makeEdgeIdFromNodeIds(newSourceId, newTargetId);
			const providedId = updated.id ?? null;
			const idxById = providedId
				? flow.edges.findIndex((e) => e.id === providedId)
				: -1;
			let newEdges: Edge[] = [...flow.edges];

			if (idxById !== -1) {
				const existing = flow.edges[idxById];
				newEdges[idxById] = {
					...existing,
					id: newId,
					source: newSourceId,
					target: newTargetId,
				};
			} else {
				const idxByProps = newEdges.findIndex(
					(e) => e.source === newSourceId && e.target === newTargetId,
				);
				if (idxByProps !== -1) {
					const existing = newEdges[idxByProps];
					newEdges[idxByProps] = {
						...existing,
						id: newId,
						source: newSourceId,
						target: newTargetId,
					};
				} else {
					newEdges = [
						...newEdges,
						{
							id: newId,
							source: newSourceId,
							target: newTargetId,
							type: "floating",
						},
					];
				}
			}

			setFlow((prev) => ({ ...prev, edges: newEdges }));
		};

		const handleDeleteConnection = (id: string) => {
			const newEdges = flow.edges.filter((e) => e.id !== id);

			const attachedNodes = attachConnectionsToNodes(
				flow.nodes,
				newEdges,
			);

			setFlow({ nodes: attachedNodes, edges: newEdges });
		};

		const edgesForMetamodel = useMemo(() => {
			const allEdges = flow?.edges ?? [];

			if (!selectedNodeIds || selectedNodeIds.length === 0) return [];

			const selectedSet = new Set(selectedNodeIds);

			return allEdges.filter(
				(e) => selectedSet.has(e.source) || selectedSet.has(e.target),
			);
		}, [
			JSON.stringify(flow?.edges ?? []),
			JSON.stringify(selectedNodeIds ?? []),
		]);

		const handleMetaModelUpdate = (snapshot: MetamodelNode[]) => {
			try {
				const nodesCopy = JSON.parse(
					JSON.stringify(snapshot),
				) as MetamodelNode[];
				setFlow((prev) => ({
					...prev,
					nodes: nodesCopy,
				}));
			} catch {
				setFlow((prev) => ({
					...prev,
					nodes: snapshot,
				}));
			}
		};

		const handleImportConnections = useCallback(() => {
			const updatedParsedData: ParsedResult[] = [parsedData[0]];
			updatedParsedData[0] = {
				...parsedData[0],
				relation: parsedData[0].relation.map((r) => ({
					...r,
					relName: `${r.fromCol}.${r.toCol}`,
				})),
			};
			const payloads = createPayloadsFromFlowStates(
				updatedParsedData,
				flow,
				transformMetaToParsed,
			);
			onImportConnections?.(payloads);
		}, [parsedData, flow, onImportConnections]);

		const createConnectionNodes = useMemo(() => {
			const source = flow?.nodes ?? nodes;

			return (source || []).map((n) => ({
				id: n.id,
				type: (n.type as string) || "metamodel",
				data: {
					name: n.data?.name ?? n.id,
					properties: Array.isArray(n.data?.properties)
						? n.data.properties.map((p) => ({
								id: p.id,
								name: p.name,
								type: p.type ?? "",
							}))
						: [],
				},
				position: n.position
					? { x: n.position.x, y: n.position.y }
					: { x: 0.0, y: 0.0 },
			})) as {
				id: string;
				type: string;
				data: {
					name: string;
					properties: { id: string; name: string; type: string }[];
				};
				position: { x: number; y: number };
			}[];
		}, [flow, nodes]);

		return (
			<StyledOuterContainer>
				<StyledHeader variant="h5">Define Metamodal</StyledHeader>
				<div ref={portalHostRef}>
					<StyledInnerContainer
						showFullScreenModal={showFullScreenModal}
					>
						<StyledPage>
							<Section>
								<Section.Header
									actions={
										<Stack direction="row" spacing={1}>
											{!showFullScreenModal && (
												<IconButton
													onClick={() =>
														setShowFullScreenModal(
															true,
														)
													}
													data-testid="engineMetadata-refresh-btn"
												>
													<FitScreen />
												</IconButton>
											)}

											<IconButton
												onClick={handleNodesMenuOpen}
												title="Select tables"
											>
												<TableRows />
											</IconButton>

											<Menu
												anchorEl={anchorNodesMenu}
												open={Boolean(anchorNodesMenu)}
												onClose={handleNodesMenuClose}
											>
												<StyledMenuContainer>
													<StyledMenuHeader>
														Tables
													</StyledMenuHeader>

													<StyledButton
														size="small"
														variant="text"
														onClick={handleClearAll}
													>
														Clear
													</StyledButton>
												</StyledMenuContainer>

												<Divider />
												<StyledMenuItem>
													<Checkbox
														onChange={(
															e: React.ChangeEvent<HTMLInputElement>,
														) =>
															handleSelectAll(
																e.target
																	.checked,
															)
														}
														checked={
															Array.isArray(
																nodes,
															) &&
															nodes.length > 0 &&
															selectedNodeIds.length ===
																nodes.length
														}
													/>
													<List.ItemText primary="Select All" />
												</StyledMenuItem>

												<StyledList>
													{(nodes ?? []).map((n) => (
														<StyledMenuItem
															key={n.id}
														>
															<Checkbox
																onChange={() =>
																	handleToggleSelectNode(
																		n.id,
																	)
																}
																checked={selectedNodeIds.includes(
																	n.id,
																)}
															/>
															<List.ItemText
																primary={
																	n.data.name
																}
															/>
														</StyledMenuItem>
													))}
												</StyledList>
											</Menu>

											<StyledDivider />
										</Stack>
									}
								></Section.Header>

								<Stack spacing={2}>
									<StyledMetamodelContainer
										showFullScreenModal={
											showFullScreenModal
										}
									>
										<Metamodel
											//key={`metamodel-${counter}`}
											nodes={flow.nodes}
											edges={flow.edges}
											selectedNode={selectedNode}
											onSelectNode={(n) =>
												setSelectedNode(n)
											}
											isInteractive={true}
											isEditable={true}
											onMetaModelUpdate={
												handleMetaModelUpdate
											}
										/>
									</StyledMetamodelContainer>
								</Stack>
							</Section>

							{selectedNode && (
								<>
									<Section>
										<Section.Header>
											Description
										</Section.Header>
										<Typography variant="body2">
											{description}
										</Typography>
									</Section>

									<Section>
										<Section.Header>
											Logical Names
										</Section.Header>
										<Stack
											direction="row"
											spacing={1}
											flexWrap="wrap"
										>
											{logicalNames.map((logicalName) => (
												<Chip
													key={logicalName}
													label={logicalName}
													color="primary"
													size="small"
												/>
											))}
										</Stack>
									</Section>

									<Section>
										<Section.Header>Columns</Section.Header>
										<StyledTableContainer>
											<Table stickyHeader>
												<Table.Head>
													<Table.Row>
														<Table.Cell>
															{" "}
														</Table.Cell>
														<Table.Cell>
															Name
														</Table.Cell>
														<Table.Cell>
															Type
														</Table.Cell>
													</Table.Row>
												</Table.Head>
												<Table.Body>
													{columnRows.map(
														(
															property: Property,
															idx: number,
														) => (
															<Table.Row
																key={
																	property.id
																}
															>
																<Table.Cell>
																	<IconButton
																		disabled
																	>
																		<Create />
																	</IconButton>
																</Table.Cell>
																<Table.Cell>
																	{
																		property.name
																	}
																</Table.Cell>
																<Table.Cell>
																	{
																		property.type
																	}
																</Table.Cell>
															</Table.Row>
														),
													)}
												</Table.Body>
												<Table.Footer>
													<Table.Row>
														<Table.Pagination
															page={columnPage}
															rowsPerPage={
																columnVisibleRows
															}
															count={
																selectedNode
																	.data
																	.properties
																	.length
															}
															rowsPerPageOptions={[
																5, 10, 25,
															]}
															onPageChange={(
																e,
																newPage,
															) =>
																setColumnPage(
																	newPage,
																)
															}
															onRowsPerPageChange={(
																e,
															) => {
																setColumnVisibleRows(
																	Number(
																		e.target
																			.value,
																	),
																);
																setColumnPage(
																	0,
																);
															}}
														/>
													</Table.Row>
												</Table.Footer>
											</Table>
										</StyledTableContainer>
									</Section>
								</>
							)}
						</StyledPage>
						<CreateConnection
							open={openCreateConnectionModal}
							onClose={() => setopenCreateConnectionModal(false)}
							onCreateConnection={handleCreateConnection}
							nodes={createConnectionNodes}
							initialConnections={getInitialConnections()}
							onEditConnection={handleEditConnection}
							onDeleteConnection={handleDeleteConnection}
						/>
					</StyledInnerContainer>
				</div>
				<PortalModal
					open={showFullScreenModal}
					onClose={() => setShowFullScreenModal(false)}
					contentId={portalContentId}
				/>
				<Stack direction="row" spacing={2} justifyContent="flex-end">
					<Button
						variant="outlined"
						onClick={handleImportConnections}
					>
						Import
					</Button>
					{!showFullScreenModal && (
						<Button
							variant="outlined"
							color="secondary"
							onClick={onCancel}
						>
							Cancel
						</Button>
					)}
				</Stack>
			</StyledOuterContainer>
		);
	},
);
