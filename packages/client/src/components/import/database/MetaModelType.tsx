import {
	AcUnit,
	Create,
	FitScreen,
	Refresh,
	TableRows,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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

const StyledPage = styled("div")(() => ({
	position: "relative",
	zIndex: "0",
	padding: "16px",
}));

const StyledMetamodelContainer = styled("section")<{ isFullHeight: boolean }>(
	({ isFullHeight }) => ({
		height: "calc(100vh - 360px)",
		width: "100%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		transition: "height 0.3s ease",
	}),
);

const StyledTableContainer = styled(Table.Container)(() => ({
	height: "396px",
}));
const StyledOuterContainer = styled(Box)(() => ({
	height: "100%",
	width: "100%",
}));

const StyledInnerContainer = styled(Box)(({ theme }) => ({
	position: "relative",
	flex: 1,
	width: "100%",
	backgroundColor: theme.palette.background.paper,
	border: "1px solid white",
	borderRadius: 2,
	transition: "all 220ms ease",
	overflow: "visible",
	margin: "16px 0",
}));

const StyledMenuItem = styled(Menu.Item)(() => ({
	display: "flex",
	alignItems: "center",
	gap: 1,
}));

const StyledIcon = styled(IconButton)(({ theme }) => ({
	border: `1px solid ${theme.palette.secondary.disabled}`,
	borderRadius: "12px",
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
	border: `1px solid ${theme.palette.secondary.border}`,
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
}));

const StyledMenuHeader = styled(Box)(() => ({
	display: "flex",
	alignItems: "center",
}));

const StyledButton = styled(Button)(() => ({
	textTransform: "none",
	minWidth: "auto",
}));

interface InputNode {
	id: string;
	type?: string;
	data: {
		name: string;
		properties: Property[];
		description?: string;
	};
	position: { x: number; y: number };
}

interface InputEdge {
	id: string;
	type: string;
	source: string;
	target: string;
}

interface InputMeta {
	nodes?: InputNode[];
	edges?: InputEdge[];
}

interface ParsedResult {
	positions: Record<string, { left: number; top: number }>;
	relation: { relName: string; fromTable: string; toTable: string }[];
	nodeProp: Record<string, string[]>;
	dataTypes?: Record<string, string>;
	additionalDataTypes?: Record<string, string>;
	logicalNames?: Record<string, string[]>;
	description?: Record<string, string>;
}

export interface Property {
	id: string;
	name: string;
	type: string;
	description?: string;
	logicalNames?: string[];
	isPrimary?: boolean;
}
interface MetaModelTypeProps {
	parsedData?: ParsedResult[];
	onImport?: (parsed: unknown) => void | Promise<void>;
	onCancel: () => void;
}

type MetamodelNode = {
	id: string;
	type?: string;
	data: {
		name: string;
		properties: Property[];
	};
	position: { x: number; y: number };
	hidden?: boolean;
	description?: string;
	connections?: Edge[];
};

type Edge = {
	id: string;
	source: string;
	target: string;
	type: string;
};
type FlowNode = {
	id: string;
	type?: string;
	data: {
		name: string;
		properties: Property[];
		[key: string]: unknown;
	};
	position: { x: number; y: number };
	[key: string]: unknown;
};

type FlowData = { nodes: (MetamodelNode | FlowNode)[]; edges: Edge[] };

export interface NodeData {
	name?: string;
	properties?: Property[];
	description?: string;
}

export interface MetaNode {
	id: string;
	type?: string;
	data?: NodeData;
	position?: { x?: number; y?: number };
}

export interface RelationItem {
	relName: string;
	fromTable: string;
	toTable: string;
}

export function getPrimaryProp(props?: Property[]): Property | null {
	if (!Array.isArray(props)) return null;
	const found = props.find((p) => Boolean(p && p.isPrimary));
	return found ?? null;
}

export function getNonPrimaryProps<T extends Property>(props?: T[]): T[] {
	if (!Array.isArray(props)) return [];
	return props.filter((p) => !p?.isPrimary);
}

export const MetaModelType = observer(
	({ parsedData, onImport, onCancel }: MetaModelTypeProps) => {
		const parsed = parsedData?.[0];

		const [selectedNode, setSelectedNode] =
			useState<React.ComponentProps<typeof Metamodel>["selectedNode"]>(
				null,
			);
		const [columnPage, setColumnPage] = useState<number>(0);
		const [columnVisibleRows, setColumnVisibleRows] = useState<number>(5);
		const [counter, setCounter] = useState(0);
		const [openCreateConnectionModal, setopenCreateConnectionModal] =
			useState(false);
		const [isFullHeight, setIsFullHeight] = useState(false);
		const [flow, setFlow] = useState<FlowData>({
			nodes: [],
			edges: [],
		});
		const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
		const [anchorNodesMenu, setAnchorNodesMenu] =
			useState<HTMLElement | null>(null);

		const closecreateConnectionModal = () => {
			setopenCreateConnectionModal(false);
		};

		const nodes = useMemo(() => {
			if (!parsed?.positions) return [];

			return Object.keys(parsed.positions).map((nodeName) => {
				const position = parsed.positions[nodeName];
				const isIndexNode = nodeName.toLowerCase() === "index";

				const extraProps = parsed.nodeProp?.[nodeName] ?? [];
				const propertiesList = isIndexNode
					? extraProps
					: [nodeName, ...extraProps];

				return {
					id: nodeName,
					type: "metamodel",
					data: {
						name: nodeName.replace(/_/g, " "),
						properties: propertiesList.map((prop, idx) => ({
							id: `${nodeName}__${prop}`,
							name: prop.replace(/_/g, " "),
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
				id: rel.relName,
				type: "floating",
				source: rel.fromTable,
				target: rel.toTable,
			}));
		}, [parsed]);

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

		const handleToggleSelectNode = (nodeId: string) => {
			const isSelected = selectedNodeIds.includes(nodeId);
			const nextSelected = isSelected
				? selectedNodeIds.filter((id) => id !== nodeId)
				: [...selectedNodeIds, nodeId];

			const nextSelectedSet = new Set(nextSelected);
			const prevNodes = Array.isArray(flow.nodes) ? flow.nodes : [];

			let newEdges: Edge[] = (flow.edges ?? []).filter(
				(e) =>
					nextSelectedSet.has(e.source) &&
					nextSelectedSet.has(e.target),
			);

			if (!isSelected) {
				const candidateEdges = (edges ?? []).filter(
					(e) =>
						nextSelectedSet.has(e.source) &&
						nextSelectedSet.has(e.target) &&
						!newEdges.some((ne) => ne.id === e.id),
				);

				if (candidateEdges.length > 0) {
					newEdges = [...newEdges, ...candidateEdges];
				}
			}

			const attached = attachConnectionsToNodes(prevNodes, newEdges);

			setFlow((prev) => ({
				...prev,
				nodes: attached,
				edges: newEdges,
			}));

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

		const handleRefreshMetamodel = () => {
			try {
				const rebuiltNodes = (nodes ?? []).map((n) =>
					JSON.parse(JSON.stringify(n)),
				) as (MetamodelNode | FlowNode)[];

				const rebuiltEdges = JSON.parse(
					JSON.stringify(edges ?? []),
				) as Edge[];

				const nodesWithConnections = attachConnectionsToNodes(
					rebuiltNodes,
					rebuiltEdges,
				);

				setFlow({
					nodes: nodesWithConnections,
					edges: rebuiltEdges,
				});

				setSelectedNodeIds(nodesWithConnections.map((n) => n.id));

				setCounter((prev) => prev + 1);
			} catch (err) {
				console.warn("Refresh failed, keeping previous flow:", err);
				setCounter((prev) => prev + 1);
			}
		};

		const toggleHeight = () => {
			setIsFullHeight((prev) => !prev);
		};

		const makeEdgeIdFromNodeIds = (sourceId: string, targetId: string) =>
			`${sourceId}_${targetId}`.replace(/\s+/g, "_");

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

			const newEdgeId = `${sourceNode.id}_${targetNode.id}`.replace(
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

			const next: FlowData = { ...flow, edges: [...flow.edges, newEdge] };

			const edgesCopy: Edge[] = JSON.parse(JSON.stringify(next.edges));
			const nodesForSnapshot: (MetamodelNode | FlowNode)[] =
				next.nodes ?? [];

			const attachedNodes = attachConnectionsToNodes(
				nodesForSnapshot,
				edgesCopy,
			);

			setFlow({ nodes: attachedNodes, edges: edgesCopy });
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

			const next: FlowData = { ...flow, edges: newEdges };

			const edgesCopy: Edge[] = JSON.parse(JSON.stringify(next.edges));
			const nodesForSnapshot: (MetamodelNode | FlowNode)[] =
				next.nodes ?? [];

			const attachedNodes = attachConnectionsToNodes(
				nodesForSnapshot,
				edgesCopy,
			);

			setFlow({ nodes: attachedNodes, edges: edgesCopy });
		};

		const handleDeleteConnection = (id: string) => {
			const next: FlowData = {
				...flow,
				edges: flow.edges.filter((e) => e.id !== id),
			};

			const edgesCopy: Edge[] = JSON.parse(JSON.stringify(next.edges));
			const nodesForSnapshot: (MetamodelNode | FlowNode)[] =
				next.nodes ?? [];

			const attachedNodes = attachConnectionsToNodes(
				nodesForSnapshot,
				edgesCopy,
			);

			setFlow({ nodes: attachedNodes, edges: edgesCopy });
		};

		const nodesForMetamodel = useMemo(() => {
			const canonical = nodes ?? [];
			const flowNodes = flow?.nodes ?? [];
			const normalize = (n: MetamodelNode | FlowNode) => ({
				...n,
				data: {
					name: n.data?.name ?? n.id,
					properties: Array.isArray(n.data?.properties)
						? n.data!.properties.map((p) => ({
								...p,
								type: typeof p.type === "string" ? p.type : "",
							}))
						: [],
					...(n.data ?? {}),
				},
			});

			if (!selectedNodeIds || selectedNodeIds.length === 0) return [];
			const flowMap = new Map(flowNodes.map((x) => [x.id, x]));

			const canonicalMap = new Map(canonical.map((x) => [x.id, x]));

			const result: (MetamodelNode | FlowNode)[] = selectedNodeIds.map(
				(id) => {
					const fn = flowMap.get(id);
					if (fn) return normalize(fn);

					const cn = canonicalMap.get(id);
					if (cn) return normalize(cn);

					return normalize({
						id,
						type: "metamodel",
						data: { name: id, properties: [] },
						position: { x: 0, y: 0 },
					} as MetamodelNode);
				},
			);

			return result;
		}, [
			JSON.stringify(selectedNodeIds ?? []),
			JSON.stringify(flow?.nodes?.map((n) => n.id) ?? []),
			JSON.stringify(nodes?.map((n) => n.id) ?? []),
			counter,
		]);

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
		const handleSave = () => {
			const payload = transformMetaToParsed(flow);

			if (!payload || Object.keys(payload.nodeProp ?? {}).length === 0) {
				console.warn("No metamodel data to save.");
				return;
			}

			onImport?.(payload);
		};

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

		const handleClearConnections = () => {
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
		};

		const handleSelectAll = (isChecked: boolean) => {
			if (isChecked) {
				setSelectedNodeIds((nodes ?? []).map((n) => n.id));
				const restored = attachConnectionsToNodes(
					JSON.parse(JSON.stringify(nodes ?? [])),
					flow.edges ?? [],
				);
				setFlow((prev) => ({ ...prev, nodes: restored }));
			} else {
				handleClearConnections();
				setSelectedNodeIds([]);
			}
		};

		return (
			<StyledOuterContainer>
				<StyledHeader variant="h5">Define Metamodal</StyledHeader>
				<StyledTypography variant="body2" fontWeight="regular">
					{" "}
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
					do eiusmod tempor incididunt ut labore et dolore magna
					aliqua. Ut enim ad minim veniam, quis nostrud exercitation
					ullamco laboris nisi ut aliquip ex ea commodo consequat.
				</StyledTypography>
				<StyledInnerContainer>
					<StyledPage>
						<Section>
							<Section.Header
								actions={
									<Stack direction="row" spacing={1}>
										<IconButton
											onClick={() => toggleHeight()}
											data-testid="engineMetadata-refresh-btn"
										>
											<FitScreen />
										</IconButton>

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
															e.target.checked,
														)
													}
													checked={
														Array.isArray(nodes) &&
														nodes.length > 0 &&
														selectedNodeIds.length ===
															nodes.length
													}
												/>
												<List.ItemText primary="Select All" />
											</StyledMenuItem>

											<StyledList>
												{(nodes ?? []).map((n) => (
													<StyledMenuItem key={n.id}>
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

										<StyledIcon
											data-testid={
												"engineMetadata-refresh-btn"
											}
											onClick={handleRefreshMetamodel}
										>
											<Refresh />
										</StyledIcon>
										<Button
											startIcon={<AcUnit />}
											variant="outlined"
											data-testid={
												"engineMetadata-print-btn"
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
										>
											Save
										</Button>
										<Button
											variant="outlined"
											color="secondary"
											onClick={onCancel}
										>
											Cancel
										</Button>
									</Stack>
								}
							></Section.Header>

							<Stack spacing={2}>
								<StyledMetamodelContainer
									isFullHeight={isFullHeight}
								>
									<Metamodel
										key={`metamodel-${counter}`}
										nodes={nodesForMetamodel}
										edges={edgesForMetamodel}
										selectedNode={selectedNode}
										onSelectNode={(n) => setSelectedNode(n)}
										isInteractive={true}
										isAction={true}
										onMetaModelUpdate={(
											snapshot: MetamodelNode[],
										) => {
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
										}}
									/>
								</StyledMetamodelContainer>
							</Stack>
						</Section>

						{selectedNode && (
							<>
								<Section>
									<Section.Header>Description</Section.Header>
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
													<Table.Cell> </Table.Cell>
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
															key={property.id}
														>
															<Table.Cell>
																<IconButton
																	disabled
																>
																	<Create />
																</IconButton>
															</Table.Cell>
															<Table.Cell>
																{property.name}
															</Table.Cell>
															<Table.Cell>
																{property.type}
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
															selectedNode.data
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
															setColumnPage(0);
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
						onClose={closecreateConnectionModal}
						onCreateConnection={handleCreateConnection}
						nodes={createConnectionNodes}
						initialConnections={edgesForMetamodel.map((e) => {
							const sourceNode = flow.nodes.find(
								(n) => n.id === e.source,
							);
							const targetNode = flow.nodes.find(
								(n) => n.id === e.target,
							);

							const parentTable =
								sourceNode?.data?.name ?? e.source;
							const childTable =
								targetNode?.data?.name ?? e.target;

							return {
								id: e.id,
								parentTable,
								childTable,
							};
						})}
						onEditConnection={handleEditConnection}
						onDeleteConnection={handleDeleteConnection}
					/>
				</StyledInnerContainer>
			</StyledOuterContainer>
		);
	},
);

/**
 * Determine the effective name for a node.
 * - If a primary property exists, sync node.data.name with that property's name and return it.
 * - Otherwise return node.data.name (if present) or node.id.
 */
export function defineName(node: MetaNode): string {
	const props: Property[] = Array.isArray(node.data?.properties)
		? node.data!.properties
		: [];

	const primary = getPrimaryProp(props);

	if (primary && typeof primary.name === "string" && primary.name.trim()) {
		if (!node.data) {
			node.data = { name: primary.name };
		} else {
			node.data.name = primary.name;
		}
		return primary.name;
	}

	if (typeof node.data?.name === "string" && node.data.name.trim()) {
		return node.data.name;
	}

	return node.id;
}

export function transformMetaToParsed(input: InputMeta): ParsedResult {
	const nodes: MetaNode[] = input.nodes ?? [];
	const edges: Edge[] = input.edges ?? [];

	const positions: Record<string, { left: number; top: number }> = {};
	const relation: RelationItem[] = [];
	const nodeProp: Record<string, string[]> = {};
	const dataTypes: Record<string, string> = {};
	const additionalDataTypes: Record<string, string> = {};
	const logicalNames: Record<string, string[]> = {};
	const description: Record<string, string> = {};

	const idToEffectiveName: Record<string, string> = {};

	for (const node of nodes) {
		const nodeId = node.id;
		const pos = node.position ?? { x: 0, y: 0 };
		positions[nodeId] = {
			left: Number(pos.x) || 0,
			top: Number(pos.y) || 0,
		};

		const props: Property[] = Array.isArray(node.data?.properties)
			? node.data.properties
			: [];

		const effectiveName = defineName(node);
		idToEffectiveName[nodeId] = effectiveName;

		const nonPrimary = getNonPrimaryProps(props);
		nodeProp[effectiveName] =
			nonPrimary.length > 0 ? nonPrimary.map((p) => p.name) : [];

		if (
			typeof node.data?.description === "string" &&
			node.data.description.trim().length > 0
		) {
			description[effectiveName] = node.data.description;
		}

		for (const prop of props) {
			const colName = prop.name;

			if (typeof prop.type === "string" && !(colName in dataTypes)) {
				dataTypes[colName] = prop.type;
			} else if (
				typeof prop.type === "string" &&
				colName in dataTypes &&
				dataTypes[colName] !== prop.type
			) {
				additionalDataTypes[`${effectiveName}%${colName}`] = prop.type;
			}

			if (
				typeof prop.description === "string" &&
				prop.description.trim()
			) {
				description[`${effectiveName}%${colName}`] = prop.description;
			}

			if (
				Array.isArray(prop.logicalNames) &&
				prop.logicalNames.length > 0
			) {
				if (!Array.isArray(logicalNames[effectiveName])) {
					logicalNames[effectiveName] = [];
				}
				for (const ln of prop.logicalNames) {
					if (
						typeof ln === "string" &&
						ln.trim().length > 0 &&
						!logicalNames[effectiveName].includes(ln)
					) {
						logicalNames[effectiveName].push(ln);
					}
				}
			}
		}
	}

	for (const e of edges) {
		relation.push({
			relName: e.id,
			fromTable: idToEffectiveName[e.source] ?? e.source,
			toTable: idToEffectiveName[e.target] ?? e.target,
		});
	}

	const result: ParsedResult = {
		positions,
		relation,
		nodeProp,
	};

	if (Object.keys(dataTypes).length > 0) result.dataTypes = dataTypes;
	if (Object.keys(additionalDataTypes).length > 0)
		result.additionalDataTypes = additionalDataTypes;
	if (Object.keys(logicalNames).length > 0)
		result.logicalNames = logicalNames;
	if (Object.keys(description).length > 0) result.description = description;

	return result;
}
