import {
	AcUnit,
	Create,
	FitScreen,
	Refresh,
	TableRows,
} from "@mui/icons-material";
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
	FormControl,
	IconButton,
	List,
	Menu,
	Select,
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
	Property,
} from "./MetamodelTypes";
import {
	attachConnectionsToNodes,
	createEdge,
	createPayloadsFromFlowStates,
	deepClone,
	edgeExists,
	findNodeByNameOrId,
	generateEdgesFromParsed,
	generateNodesFromParsed,
	getAllColumnNamesFromNodes,
	getDataSourceKey,
	getDisplayName,
	getInitialConnections,
	makeEdgeIdFromNodeIds,
	rebuildNodesFromParsed,
	removeEdgesForNode,
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
	height: showFullScreenModal ? "calc(100vh - 150px)" : "calc(100vh - 340px)",
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
	borderRadius: "16px",
	transition: "all 220ms ease",
	overflow: "visible",
	margin: "16px 0",
	height: showFullScreenModal ? "100vh" : "auto",
}));

const StyledMenuItem = styled(Menu.Item)(() => ({
	display: "flex",
	alignItems: "center",
}));

const StyledList = styled(Box)(() => ({
	maxHeight: 200,
	overflow: "auto",
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
	color: "text.secondary",
	marginTop: theme.spacing(1),
	marginBottom: theme.spacing(2),
}));

const StyledHeader = styled(Typography)(({ theme }) => ({
	marginTop: theme.spacing(2),
}));

const StyledMenuContainer = styled(Box)(() => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	padding: "8px 16px",
	width: "360px",
}));

const StyledMenuHeader = styled(Box)(() => ({
	display: "flex",
	alignItems: "center",
	fontSize: "14px",
}));

const OuterBox = styled(Box)(() => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: 2,
}));

const StyledFormControl = styled(FormControl)(() => ({
	display: "flex",
	alignItems: "center",
	width: "100%",
	mb: 2,
}));

const StyledStack = styled(Stack)(() => ({
	display: "flex",
	alignItems: "center",
}));

const StyledIconButton = styled(IconButton)(() => ({
	padding: 0,
}));

const SectionHeader = styled(Section.Header)(() => ({
	marginBottom: 0,
}));

export const MetaModelType = observer(
	({ parsedData, onImport, onCancel }: MetaModelTypeProps) => {
		// State
		const [selectedDataIndex, setSelectedDataIndex] = useState<number>(0);
		const [flowStates, setFlowStates] = useState<Record<number, FlowData>>(
			{},
		);
		const [selectedNodeIdsMap, setSelectedNodeIdsMap] = useState<
			Record<number, string[]>
		>({});
		const [selectedNode, setSelectedNode] =
			useState<React.ComponentProps<typeof Metamodel>["selectedNode"]>(
				null,
			);
		const [columnPage, setColumnPage] = useState<number>(0);
		const [columnVisibleRows, setColumnVisibleRows] = useState<number>(5);
		const [counter, setCounter] = useState(0);
		const [openCreateConnectionModal, setopenCreateConnectionModal] =
			useState(false);
		const [anchorNodesMenu, setAnchorNodesMenu] =
			useState<HTMLElement | null>(null);
		const [showFullScreenModal, setShowFullScreenModal] = useState(false);

		// Refs
		const portalHostRef = useRef<HTMLDivElement | null>(null);
		const originalParentRef = useRef<HTMLElement | null>(null);
		const originalNextSiblingRef = useRef<Node | null>(null);
		const didInitRef = useRef<Record<number, boolean>>({});

		// Derived Values
		const parsed = parsedData?.[selectedDataIndex];
		const portalContentId = useId();
		const flow = flowStates[selectedDataIndex] || { nodes: [], edges: [] };
		const selectedNodeIds = selectedNodeIdsMap[selectedDataIndex] || [];

		// Memos
		const nodes = useMemo(() => {
			return generateNodesFromParsed(parsed);
		}, [parsed]);

		const edges = useMemo(() => {
			return generateEdgesFromParsed(parsed);
		}, [parsed]);

		const columnOptions = useMemo(() => {
			return getAllColumnNamesFromNodes(nodes);
		}, [nodes]);

		const columnRows = useMemo(() => {
			if (!selectedNode?.data?.properties?.length) return [];
			return selectedNode.data.properties.slice(
				columnPage * columnVisibleRows,
				(columnPage + 1) * columnVisibleRows,
			);
		}, [selectedNode, columnPage, columnVisibleRows]);

		const edgesForMetamodel = useMemo(() => {
			const allEdges = flow?.edges ?? [];

			if (!selectedNodeIds || selectedNodeIds.length === 0) {
				return allEdges;
			}

			const selectedSet = new Set(selectedNodeIds);

			return allEdges.filter(
				(e) => selectedSet.has(e.source) || selectedSet.has(e.target),
			);
		}, [flow?.edges, selectedNodeIds]);

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

		const description = selectedNode?.id || "";
		const logicalNames =
			selectedNode?.data?.properties?.map(
				(p: { name: string }): string => p.name,
			) || [];

		// Callbacks

		const updateFlow = useCallback(
			(updater: FlowData | ((prev: FlowData) => FlowData)) => {
				setFlowStates((prev) => {
					const currentFlow = prev[selectedDataIndex] || {
						nodes: [],
						edges: [],
					};
					const newFlow =
						typeof updater === "function"
							? updater(currentFlow)
							: updater;
					return {
						...prev,
						[selectedDataIndex]: newFlow,
					};
				});
			},
			[selectedDataIndex],
		);

		const updateSelectedNodeIds = useCallback(
			(updater: string[] | ((prev: string[]) => string[])) => {
				setSelectedNodeIdsMap((prev) => {
					const current = prev[selectedDataIndex] || [];
					const newIds =
						typeof updater === "function"
							? updater(current)
							: updater;
					return {
						...prev,
						[selectedDataIndex]: newIds,
					};
				});
			},
			[selectedDataIndex],
		);

		// Handlers
		const handleNodesMenuOpen = useCallback(
			(e: React.MouseEvent<HTMLElement>) =>
				setAnchorNodesMenu(e.currentTarget),
			[],
		);

		const handleNodesMenuClose = useCallback(
			() => setAnchorNodesMenu(null),
			[],
		);

		const handleSelectAll = useCallback(
			(isChecked: boolean) => {
				if (isChecked) {
					updateSelectedNodeIds((nodes ?? []).map((n) => n.id));
					const restored = attachConnectionsToNodes(
						deepClone(nodes ?? []),
						edges ?? [],
					);
					updateFlow({ nodes: restored, edges: edges ?? [] });
				} else {
					updateSelectedNodeIds([]);
					updateFlow({ nodes: [], edges: [] });
				}
			},
			[updateSelectedNodeIds, nodes, edges, updateFlow],
		);

		const handleToggleSelectNode = useCallback(
			(nodeId: string) => {
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
					newEdges = removeEdgesForNode(prevEdges, nodeId);
				} else {
					const exists = prevNodes.some((n) => n.id === nodeId);
					if (!exists) {
						const canonical = initialMap.get(nodeId);
						const nodeToAdd = canonical
							? deepClone(canonical)
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

				const attachedNodes = attachConnectionsToNodes(
					newNodes,
					newEdges,
				);
				updateFlow({ nodes: attachedNodes, edges: newEdges });
				updateSelectedNodeIds(nextSelected);
			},
			[
				selectedNodeIds,
				nodes,
				flow.nodes,
				flow.edges,
				updateFlow,
				updateSelectedNodeIds,
			],
		);

		const handleCreateConnection = useCallback(
			({
				parentTable,
				childTable,
			}: {
				parentTable: string;
				childTable: string;
			}) => {
				const sourceNode = findNodeByNameOrId(flow.nodes, parentTable);
				const targetNode = findNodeByNameOrId(flow.nodes, childTable);

				if (!sourceNode || !targetNode) {
					return;
				}

				if (edgeExists(flow.edges, sourceNode.id, targetNode.id)) {
					return;
				}

				const newEdge = createEdge(sourceNode.id, targetNode.id);

				updateFlow((prev) => ({
					...prev,
					edges: [...prev.edges, newEdge],
				}));
			},
			[flow.nodes, flow.edges, updateFlow],
		);

		const handleEditConnection = useCallback(
			(updated: {
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
						(e) =>
							e.source === newSourceId &&
							e.target === newTargetId,
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
							createEdge(newSourceId, newTargetId),
						];
					}
				}

				updateFlow((prev) => ({ ...prev, edges: newEdges }));
			},
			[flow.nodes, flow.edges, updateFlow],
		);

		const handleDeleteConnection = useCallback(
			(id: string) => {
				const newEdges = flow.edges.filter((e) => e.id !== id);

				const attachedNodes = attachConnectionsToNodes(
					flow.nodes,
					newEdges,
				);

				updateFlow({ nodes: attachedNodes, edges: newEdges });
			},
			[flow.edges, flow.nodes, updateFlow],
		);

		const handleRefreshMetamodel = useCallback(() => {
			try {
				const originalParsed = parsedData?.[selectedDataIndex];

				if (!originalParsed) {
					return;
				}

				const rebuiltNodes = rebuildNodesFromParsed(originalParsed);
				const rebuiltEdges = generateEdgesFromParsed(originalParsed);

				const nodesWithConnections = attachConnectionsToNodes(
					rebuiltNodes,
					rebuiltEdges,
				);
				const resetFlow = {
					nodes: nodesWithConnections,
					edges: rebuiltEdges,
				};

				setFlowStates((prev) => ({
					...prev,
					[selectedDataIndex]: resetFlow,
				}));

				updateFlow(resetFlow);
				updateSelectedNodeIds(nodesWithConnections.map((n) => n.id));
				setCounter((prev) => prev + 1);
			} catch (err) {
				console.warn("Refresh failed, keeping previous flow:", err);
				setCounter((prev) => prev + 1);
			}
		}, [parsedData, selectedDataIndex, updateFlow, updateSelectedNodeIds]);

		const handleMetaModelUpdate = useCallback(
			(snapshot: MetamodelNode[]) => {
				const nodesCopy = deepClone(snapshot);

				updateFlow((prev) => {
					const updated = {
						...prev,
						nodes: nodesCopy,
					};

					setFlowStates((prevStates) => ({
						...prevStates,
						[selectedDataIndex]: updated,
					}));

					return updated;
				});
			},
			[selectedDataIndex, updateFlow],
		);

		const handleDataSourceChange = useCallback(
			(newIndex: number) => {
				setFlowStates((prev) => {
					const savedState = {
						...prev,
						[selectedDataIndex]: {
							nodes: flow.nodes || [],
							edges: flow.edges || [],
						},
					};
					return savedState;
				});

				setSelectedDataIndex(newIndex);
				setSelectedNode(null);
				setColumnPage(0);
			},
			[selectedDataIndex, flow.nodes, flow.edges],
		);

		const handleSave = useCallback(() => {
			const payloads = createPayloadsFromFlowStates(
				parsedData,
				flowStates,
				transformMetaToParsed,
			);
			onImport?.(payloads);
		}, [parsedData, flowStates, onImport]);

		// EFFECTS
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
					} catch {
						console.warn(
							"Failed to restore host to original parent",
						);
					}
				}
			};
		}, [showFullScreenModal, portalContentId]);

		useEffect(() => {
			if (nodes.length > 0) {
				const initial: FlowData = {
					nodes: nodes as FlowNode[],
					edges: edges as Edge[],
				};

				const existingState = flowStates[selectedDataIndex];

				if (
					existingState &&
					(existingState.nodes?.length > 0 ||
						existingState.edges?.length > 0)
				) {
					updateFlow(existingState);
				} else {
					updateFlow(initial);

					setFlowStates((prev) => ({
						...prev,
						[selectedDataIndex]: initial,
					}));
				}
			}
		}, [nodes, edges, selectedDataIndex]);

		useEffect(() => {
			if (!flow?.nodes || flow.nodes.length === 0) return;

			if (!didInitRef.current[selectedDataIndex]) {
				updateSelectedNodeIds(flow.nodes.map((n) => n.id));
				didInitRef.current[selectedDataIndex] = true;
			}
		}, [flow.nodes, selectedDataIndex, updateSelectedNodeIds]);

		// RENDER
		return (
			<StyledOuterContainer>
				<StyledHeader variant="h5">Define Metamodal</StyledHeader>
				<StyledTypography variant="body2" fontWeight="regular">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
					do eiusmod tempor incididunt ut labore et dolore magna
					aliqua. Ut enim ad minim veniam, quis nostrud exercitation
					ullamco laboris nisi ut aliquip ex ea commodo consequat.
				</StyledTypography>
				<div ref={portalHostRef}>
					<StyledInnerContainer
						showFullScreenModal={showFullScreenModal}
					>
						<StyledPage>
							<Section>
								<OuterBox>
									{parsedData && parsedData.length > 0 && (
										<StyledFormControl>
											<Select
												fullWidth
												value={selectedDataIndex}
												onChange={(e) =>
													handleDataSourceChange(
														Number(e.target.value),
													)
												}
												size="small"
											>
												{parsedData.map(
													(data, index) => (
														<Menu.Item
															key={getDataSourceKey(
																data,
																index,
															)}
															value={index}
															data-testid={`engineMetadata-datasource-${index}-btn`}
														>
															{getDisplayName(
																data,
															)}
														</Menu.Item>
													),
												)}
											</Select>
										</StyledFormControl>
									)}
									<SectionHeader
										actions={
											<StyledStack
												direction="row"
												spacing={2}
											>
												{!showFullScreenModal && (
													<StyledIconButton
														onClick={() =>
															setShowFullScreenModal(
																true,
															)
														}
														data-testid="engineMetadata-fullscreen-btn"
														title="Full Screen"
													>
														<FitScreen />
													</StyledIconButton>
												)}

												<StyledIconButton
													onClick={
														handleNodesMenuOpen
													}
													title="Select tables"
													data-testid="engineMetadata-tablelist-btn"
												>
													<TableRows />
												</StyledIconButton>

												<Menu
													anchorEl={anchorNodesMenu}
													open={Boolean(
														anchorNodesMenu,
													)}
													onClose={
														handleNodesMenuClose
													}
												>
													<StyledMenuContainer>
														<StyledMenuHeader>
															Tables
														</StyledMenuHeader>
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
																nodes.length >
																	0 &&
																selectedNodeIds.length ===
																	nodes.length
															}
															checkboxProps={{
																size: "small",
																indeterminate:
																	Array.isArray(
																		nodes,
																	) &&
																	nodes.length >
																		0 &&
																	selectedNodeIds.length >
																		0 &&
																	selectedNodeIds.length <
																		nodes.length,
															}}
														/>
														<List.ItemText primary="Select All" />
													</StyledMenuItem>

													<StyledList>
														{(nodes ?? []).map(
															(n) => (
																<StyledMenuItem
																	key={n.id}
																	data-testid={`engineMetadata-table-${n.id}-btn`}
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
																		checkboxProps={{
																			size: "small",
																		}}
																	/>
																	<List.ItemText
																		primary={
																			n
																				.data
																				.name
																		}
																	/>
																</StyledMenuItem>
															),
														)}
													</StyledList>
												</Menu>

												<StyledIconButton
													data-testid={
														"engineMetadata-refresh-btn"
													}
													title="Reset"
													onClick={
														handleRefreshMetamodel
													}
												>
													<Refresh />
												</StyledIconButton>
												<Button
													startIcon={<AcUnit />}
													variant="outlined"
													data-testid={
														"engineMetadata-createrelationship-btn"
													}
													onClick={() =>
														setopenCreateConnectionModal(
															true,
														)
													}
												>
													Create Relationship
												</Button>
												<Button
													variant="outlined"
													onClick={handleSave}
													data-testid={
														"engineMetadata-save-btn"
													}
												>
													Save
												</Button>
												{!showFullScreenModal && (
													<Button
														variant="outlined"
														color="secondary"
														onClick={onCancel}
														data-testid={
															"engineMetadata-cancel-btn"
														}
													>
														Cancel
													</Button>
												)}
											</StyledStack>
										}
									></SectionHeader>
								</OuterBox>
								<Stack spacing={2}>
									<StyledMetamodelContainer
										showFullScreenModal={
											showFullScreenModal
										}
									>
										<Metamodel
											key={`metamodel-${selectedDataIndex}-${counter}`}
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
											dataSourceId={selectedDataIndex}
											resetKey={counter}
											columnOptions={columnOptions}
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
													data-testid={`logicalName-${logicalName}`}
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
							initialConnections={getInitialConnections(
								edgesForMetamodel,
								flow.nodes,
							)}
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
			</StyledOuterContainer>
		);
	},
);
