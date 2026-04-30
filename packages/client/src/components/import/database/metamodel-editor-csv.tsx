/** biome-ignore-all lint/correctness/useUniqueElementIds: IDs are generated from dynamic schema/table metadata */
import {
	Maximize2,
	RefreshCw,
	Search,
	Snowflake,
	Table as TableIcon,
} from "lucide-react";
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
	Button,
	Checkbox,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Input,
	Label,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
} from "@semoss/ui/next";
import { Metamodel } from "@/components/metamodel";
import CreateConnection from "@/components/metamodel/create-connection";
import { Section } from "@/components/ui";
import type {
	Edge,
	FlowData,
	FlowNode,
	MetaModelTypeProps,
	MetamodelNode,
} from "./metamodel-types";
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
} from "./metamodel-utils";
import { PortalModal } from "./portal";

export const MetaModelType = observer(
	({ parsedData, onImport, onCancel, isRdf = false }: MetaModelTypeProps) => {
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
		const [counter, setCounter] = useState(0);
		const [openCreateConnectionModal, setopenCreateConnectionModal] =
			useState(false);
		const [anchorNodesMenu, setAnchorNodesMenu] = useState(false);
		const [showFullScreenModal, setShowFullScreenModal] = useState(false);
		const [metaModelSearchTerm, setMetaModelSearchTerm] = useState("");

		// Refs
		const portalHostRef = useRef<HTMLDivElement | null>(null);
		const originalParentRef = useRef<HTMLElement | null>(null);
		const originalNextSiblingRef = useRef<Node | null>(null);
		const didInitRef = useRef<Record<number, boolean>>({});
		const selectAllCheckboxRef = useRef<HTMLButtonElement>(null);

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
			(newIndex: string) => {
				const indexNum = Number(newIndex);
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

				setSelectedDataIndex(indexNum);
				setSelectedNode(null);
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

				setFlowStates((prev) => {
					const existingState = prev[selectedDataIndex];

					if (
						existingState &&
						(existingState.nodes?.length > 0 ||
							existingState.edges?.length > 0)
					) {
						return prev;
					}

					return {
						...prev,
						[selectedDataIndex]: initial,
					};
				});
			}
		}, [nodes, edges, selectedDataIndex]);

		useEffect(() => {
			if (!flow?.nodes || flow.nodes.length === 0) return;

			if (!didInitRef.current[selectedDataIndex]) {
				updateSelectedNodeIds(flow.nodes.map((n) => n.id));
				didInitRef.current[selectedDataIndex] = true;
			}
		}, [flow.nodes, selectedDataIndex, updateSelectedNodeIds]);

		useEffect(() => {
			if (selectAllCheckboxRef.current) {
				const checkbox = selectAllCheckboxRef.current.querySelector(
					'input[type="checkbox"]',
				);
				if (checkbox) {
					const isIndeterminate =
						Array.isArray(nodes) &&
						nodes.length > 0 &&
						selectedNodeIds.length > 0 &&
						selectedNodeIds.length < nodes.length;

					(checkbox as HTMLInputElement).indeterminate =
						isIndeterminate;
				}
			}
		}, [nodes, selectedNodeIds]);

		useEffect(() => {
			if (!showFullScreenModal) return;

			const interval = setInterval(() => {
				// Find all portal content and force high z-index
				const portals = document.querySelectorAll(
					'[data-radix-select-content], [data-radix-dropdown-menu-content], [data-radix-dialog-content], [data-radix-popper-content-wrapper], [role="dialog"], [role="listbox"]',
				);

				portals.forEach((portal) => {
					(portal as HTMLElement).style.zIndex = "9999";
				});
			}, 100);

			return () => clearInterval(interval);
		}, [showFullScreenModal]);

		// RENDER
		return (
			<div className="h-full w-full">
				<P className="mt-4 font-semibold text-xl">Define Metamodel</P>
				<P className="mt-2 mb-4 font-normal text-muted-foreground">
					Review and adjust the suggested metamodel for your data. You
					can rename nodes, add or remove relationships, and
					reorganize the graph before importing.
				</P>
				{parsedData && parsedData.length > 0 && (
					<div className="mb-3 flex items-center gap-2">
						<span className="shrink-0 text-muted-foreground text-sm">
							Viewing:
						</span>
						<Select
							value={String(selectedDataIndex)}
							onValueChange={handleDataSourceChange}
						>
							<SelectTrigger className="w-auto">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{parsedData.map((data, index) => (
									<SelectItem
										key={getDataSourceKey(data, index)}
										value={String(index)}
										data-testid={`engineMetadata-datasource-${index}-btn`}
									>
										{getDisplayName(data)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
				<div ref={portalHostRef}>
					<div
						className={`relative flex-1 overflow-visible rounded-2xl border border-border bg-card transition-all duration-200 ease-in ${
							showFullScreenModal ? "h-screen" : "h-auto"
						}`}
					>
						<div className="relative z-0 p-4">
							<Section>
								<div className="mb-3 flex items-center gap-2">
									<div className="relative flex-1">
										<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
										<Input
											placeholder="Search"
											value={metaModelSearchTerm}
											onChange={(e) =>
												setMetaModelSearchTerm(
													e.target.value,
												)
											}
											className="h-9 pl-9"
											data-testid="metaModelType-search-input"
										/>
									</div>
									<div className="flex items-center gap-2">
										{!showFullScreenModal && (
											<Button
												variant="ghost"
												size="icon"
												onClick={() =>
													setShowFullScreenModal(true)
												}
												data-testid="engineMetadata-fullscreen-btn"
												title="Full Screen"
												className="p-0"
											>
												<Maximize2 className="size-4" />
											</Button>
										)}
										<DropdownMenu
											open={anchorNodesMenu}
											onOpenChange={setAnchorNodesMenu}
										>
											<DropdownMenuTrigger asChild>
												<Button
													variant="ghost"
													size="icon"
													title="Select tables"
													data-testid="engineMetadata-tablelist-btn"
													className="p-0"
												>
													<TableIcon className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent
												align="end"
												className="w-[360px]"
											>
												<div className="flex items-center justify-between px-4 py-2">
													<P className="text-sm">
														Tables
													</P>
												</div>
												<Separator className="my-1" />
												<DropdownMenuItem
													onSelect={(e) =>
														e.preventDefault()
													}
													className="flex items-center gap-2"
												>
													<Checkbox
														ref={
															selectAllCheckboxRef
														}
														id="select-all-nodes"
														checked={
															Array.isArray(
																nodes,
															) &&
															nodes.length > 0 &&
															selectedNodeIds.length ===
																nodes.length
														}
														onCheckedChange={(
															checked,
														) =>
															handleSelectAll(
																checked as boolean,
															)
														}
														className="[&[data-state=checked]_svg]:text-white [&_svg]:text-white"
													/>
													<Label
														htmlFor="select-all-nodes"
														className="cursor-pointer font-normal"
													>
														Select All
													</Label>
												</DropdownMenuItem>
												<div className="max-h-[200px] overflow-auto">
													{(nodes ?? []).map((n) => (
														<DropdownMenuItem
															key={n.id}
															onSelect={(e) =>
																e.preventDefault()
															}
															className="flex items-center gap-2"
															data-testid={`engineMetadata-table-${n.id}-btn`}
														>
															<Checkbox
																id={`node-${n.id}`}
																checked={selectedNodeIds.includes(
																	n.id,
																)}
																onCheckedChange={() =>
																	handleToggleSelectNode(
																		n.id,
																	)
																}
																className="[&[data-state=checked]_svg]:text-white [&_svg]:text-white"
															/>
															<Label
																htmlFor={`node-${n.id}`}
																className="cursor-pointer font-normal"
															>
																{n.data.name}
															</Label>
														</DropdownMenuItem>
													))}
												</div>
											</DropdownMenuContent>
										</DropdownMenu>
										<Button
											variant="ghost"
											size="icon"
											data-testid="engineMetadata-refresh-btn"
											title="Reset"
											onClick={handleRefreshMetamodel}
											className="p-0"
										>
											<RefreshCw className="size-4" />
										</Button>
										<Button
											variant="outline"
											data-testid="engineMetadata-createrelationship-btn"
											onClick={() =>
												setopenCreateConnectionModal(
													true,
												)
											}
											className="gap-2"
										>
											<Snowflake className="size-4" />
											Create Relationship
										</Button>
									</div>
								</div>
								<div className="flex flex-col gap-4">
									<section
										className={`flex items-center justify-center transition-[height] duration-300 ease-in ${
											showFullScreenModal
												? "h-[calc(100vh-150px)]"
												: "h-[calc(100vh-340px)]"
										}`}
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
											showSearch={false}
											searchValue={metaModelSearchTerm}
											onSearchValueChange={
												setMetaModelSearchTerm
											}
										/>
									</section>
								</div>
							</Section>
						</div>
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
							isRdf={isRdf}
						/>
					</div>
				</div>
				<PortalModal
					open={showFullScreenModal}
					onClose={() => setShowFullScreenModal(false)}
					contentId={portalContentId}
				/>
				{!showFullScreenModal && (
					<div className="mt-4 flex justify-end gap-3 border-border border-t pt-4 pb-6">
						<Button
							variant="outline"
							onClick={onCancel}
							data-testid="engineMetadata-cancel-btn"
						>
							Cancel
						</Button>
						<Button
							variant="default"
							onClick={handleSave}
							data-testid="engineMetadata-save-btn"
						>
							Import
						</Button>
					</div>
				)}
			</div>
		);
	},
);
