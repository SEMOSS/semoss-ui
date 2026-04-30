/** biome-ignore-all lint/correctness/useUniqueElementIds: IDs are generated from dynamic schema/table metadata */
import { Maximize2, Table as TableIcon } from "lucide-react";
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
	ParsedResult,
} from "./metamodel-types";
import {
	createPayloadsFromFlowStates,
	transformMetaToParsed,
} from "./metamodel-utils";
import { PortalModal } from "./portal";

export const MetaModelConnections = observer(
	({ parsedData, onCancel, onImportConnections }: MetaModelTypeProps) => {
		const parsed = parsedData?.[0];
		console.log("MetaModelType parsedData:", parsedData);
		const portalContentId = useId();
		const [selectedNode, setSelectedNode] =
			useState<React.ComponentProps<typeof Metamodel>["selectedNode"]>(
				null,
			);
		const [openCreateConnectionModal, setopenCreateConnectionModal] =
			useState(false);
		const [flow, setFlow] = useState<FlowData>({
			nodes: [],
			edges: [],
		});
		const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
		const [anchorNodesMenu, setAnchorNodesMenu] = useState(false);
		const [showFullScreenModal, setShowFullScreenModal] = useState(false);
		const [metaModelSearchTerm, setMetaModelSearchTerm] = useState("");
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
							rawType: parsed.physicalTypes?.[prop],
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
				id: `${rel.fromTable}.${rel.toCol}`,
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
			setFlow({ nodes: [], edges: [] });
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
		}, [flow?.edges, selectedNodeIds]);

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
			<div className="h-full w-full">
				<P className="mt-4 font-semibold text-xl">Define Metamodel</P>
				<P className="mt-2 mb-4 font-normal text-muted-foreground">
					Review and adjust the suggested metamodel for your database.
					You can rename nodes, add or remove relationships, and
					reorganize the graph before importing.
				</P>
				<div ref={portalHostRef}>
					<div
						className={`relative flex-1 overflow-visible rounded-2xl border border-border bg-card transition-all duration-200 ease-in ${
							showFullScreenModal ? "h-screen" : "h-auto"
						}`}
					>
						<div className="relative z-0 p-4">
							<Section>
								<div className="mb-4 flex w-full items-center gap-2">
									<Input
										value={metaModelSearchTerm}
										onChange={(e) =>
											setMetaModelSearchTerm(
												e.target.value,
											)
										}
										className="flex-1"
										placeholder="Search table or column..."
										data-testid="metaModelConnections-search-input"
									/>
									{!showFullScreenModal && (
										<Button
											variant="ghost"
											size="icon"
											onClick={() =>
												setShowFullScreenModal(true)
											}
											data-testid="engineMetadata-refresh-btn"
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
												data-testid="select-tables-dropdown"
											>
												<TableIcon className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent
											align="end"
											className="w-64"
										>
											{/* Header with Clear button */}
											<div className="flex items-center justify-between px-4 py-2">
												<P className="font-medium">
													Tables
												</P>
												<Button
													variant="ghost"
													size="sm"
													onClick={handleClearAll}
													className="h-auto px-2 py-1 text-xs"
												>
													Clear
												</Button>
											</div>

											<Separator className="my-1" />

											{/* Select All */}
											<DropdownMenuItem
												onSelect={(e) =>
													e.preventDefault()
												}
												className="flex items-center gap-2"
											>
												<Checkbox
													id="select-all-nodes"
													checked={
														Array.isArray(nodes) &&
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
												/>
												<Label
													htmlFor="select-all-nodes"
													className="cursor-pointer font-normal"
												>
													Select All
												</Label>
											</DropdownMenuItem>

											{/* Scrollable list */}
											<div className="max-h-[200px] overflow-auto">
												{(nodes ?? []).map((n) => (
													<DropdownMenuItem
														key={n.id}
														onSelect={(e) =>
															e.preventDefault()
														}
														className="flex items-center gap-2"
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
									<Separator
										orientation="vertical"
										className="h-6"
									/>
								</div>

								<div className="flex flex-col gap-4">
									<section
										className={`flex items-center justify-center transition-[height] duration-300 ease-in ${
											showFullScreenModal
												? "h-[calc(100vh-150px)]"
												: "h-[calc(100vh-360px)]"
										}`}
									>
										<Metamodel
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
							initialConnections={getInitialConnections()}
							onEditConnection={handleEditConnection}
							onDeleteConnection={handleDeleteConnection}
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
						<Button variant="outline" onClick={onCancel}>
							Cancel
						</Button>
						<Button
							variant="default"
							onClick={handleImportConnections}
						>
							Import
						</Button>
					</div>
				)}
			</div>
		);
	},
);
