import {
	ChevronLeft,
	ChevronRight,
	DownloadIcon,
	Pencil,
	RefreshCwIcon,
	SaveIcon,
	Search,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { download, usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Card,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { SyncExternalDatabaseOverlay } from "@/components/database";
import { Metamodel } from "@/components/metamodel";
import { Section } from "@/components/ui";
import { useEngine, useRootStore } from "@/hooks";
import { useQueryResults } from "@/hooks/useDatabaseQueryResults";

const normalizeSearchValue = (value: string) =>
	value.toLowerCase().replace(/[\s_]+/g, "");

type SearchMatch = {
	nodeId: string;
	columnIndex: number | null;
};

type SupportedDataType =
	| "BOOLEAN"
	| "INT"
	| "DOUBLE"
	| "STRING"
	| "DATE"
	| "TIMESTAMP";

type ColumnDetails = {
	tableName: string;
	columnId: string;
	columnName: string;
	physicalType: string;
	description: string;
	logicalNames: string[];
};

const normalizeSupportedDataType = (value?: string): SupportedDataType | "" => {
	if (!value) {
		return "";
	}

	switch (value.toUpperCase()) {
		case "BOOLEAN":
		case "BOOL":
			return "BOOLEAN";
		case "INT":
		case "INTEGER":
		case "BIGINT":
		case "SMALLINT":
			return "INT";
		case "DOUBLE":
		case "FLOAT":
		case "NUMERIC":
		case "DECIMAL":
			return "DOUBLE";
		case "STRING":
		case "VARCHAR":
		case "CHAR":
		case "TEXT":
			return "STRING";
		case "DATE":
			return "DATE";
		case "TIMESTAMP":
		case "DATETIME":
			return "TIMESTAMP";
		default:
			return "";
	}
};

const normalizePhysicalTypeKey = (value: string) =>
	value.toLowerCase().replace(/[^a-z0-9]/g, "");

const resolvePhysicalType = (
	physicalTypes: Record<string, string> | undefined,
	tableName: string,
	columnName: string,
	propertyId?: string,
) => {
	if (!physicalTypes) {
		return "";
	}

	const table = tableName.trim();
	const column = columnName.trim();
	const basePropertyId = propertyId ?? `${table}__${column}`;
	const candidates = [
		basePropertyId,
		`${table}__${column}`,
		`${table}.${column}`,
		basePropertyId.toLowerCase(),
		basePropertyId.toUpperCase(),
		`${table.toLowerCase()}__${column.toLowerCase()}`,
		`${table.toLowerCase()}.${column.toLowerCase()}`,
		`${table.toUpperCase()}__${column.toUpperCase()}`,
		`${table.toUpperCase()}.${column.toUpperCase()}`,
	];

	for (const candidate of candidates) {
		if (candidate in physicalTypes) {
			return physicalTypes[candidate] ?? "";
		}
	}

	const normalizedNeedle = normalizePhysicalTypeKey(`${table}${column}`);
	for (const [key, value] of Object.entries(physicalTypes)) {
		if (normalizePhysicalTypeKey(key) === normalizedNeedle) {
			return value ?? "";
		}
	}

	return "";
};

export const EngineMetadataPage = observer(() => {
	type MetadataEdge = {
		id: string;
		type: "floating";
		source: string;
		target: string;
		relName?: string;
	};

	const { active } = useEngine();
	const { configStore } = useRootStore();

	const [isModified, setIsModified] = useState(false);
	const [nodes, setNodes] = useState<
		{
			id: string;
			type: "metamodel";
			data: {
				name: string;
				properties: {
					id: string;
					name: string;
					type: string;
					physicalType?: string;
					description?: string;
					logicalNames?: string[];
				}[];
			};
			position: {
				x: number;
				y: number;
			};
		}[]
	>([]);
	const [edges, setEdges] = useState<MetadataEdge[]>([]);

	const [selectedNode, setSelectedNode] = useState(null);
	const [columnPage, setColumnPage] = useState<number>(0);
	const [columnVisibleRows, setColumnVisibleRows] = useState<number>(10);
	const [columnSearch, setColumnSearch] = useState("");
	const [metadataSearch, setMetadataSearch] = useState("");
	const [activeSearchMatch, setActiveSearchMatch] =
		useState<SearchMatch | null>(null);
	const [openColumnDetails, setOpenColumnDetails] = useState(false);
	const [selectedColumnDetails, setSelectedColumnDetails] =
		useState<ColumnDetails | null>(null);

	const renderQueryResults = useQueryResults();

	const getDatabaseMetamodel = usePixel<{
		dataTypes: Record<string, string>;
		logicalNames: Record<string, string[]>;
		nodes: { propSet: string[]; conceptualName: string }[];
		edges: {
			sourceColumn?: string;
			targetColumn?: string;
			relation: string;
			source: string;
			target: string;
		}[];
		physicalTypes: Record<string, string>;
		positions: Record<
			string,
			{
				top: number;
				left: number;
			}
		>;
		descriptions: Record<string, string>;
		additionalDataTypes: Record<string, string>;
	}>(
		active.id
			? `GetDatabaseMetamodel( database=["${active.id}"], options=["dataTypes","physicalTypes","additionalDataTypes","logicalNames","descriptions","positions"]);`
			: "",
		{
			onSuccess({
				nodes,
				edges,
				positions,
				dataTypes,
				additionalDataTypes,
				logicalNames,
				descriptions,
				physicalTypes = {},
			}) {
				// update the nodes
				const n = nodes.map((n) => ({
					id: n.conceptualName,
					type: "metamodel" as const,
					data: {
						name: n.conceptualName,
						properties: n.propSet.map((p) => {
							const propertyId = `${n.conceptualName}__${p}`;
							const normalizedDataType =
								normalizeSupportedDataType(
									dataTypes[propertyId],
								) ||
								normalizeSupportedDataType(
									additionalDataTypes[propertyId],
								);

							return {
								id: propertyId,
								name: p,
								type: normalizedDataType,
								physicalType: resolvePhysicalType(
									physicalTypes,
									n.conceptualName,
									p,
									propertyId,
								),
								description: descriptions[propertyId] ?? "",
								logicalNames: logicalNames[propertyId] ?? [],
							};
						}),
					},
					position: positions[n.conceptualName]
						? {
								x: positions[n.conceptualName].left,
								y: positions[n.conceptualName].top,
							}
						: { x: 0, y: 0 },
				}));

				setNodes(n);

				// update the edges
				const e = edges.map((e, i) => ({
					id: `${e.relation}-${i}`,
					type: "floating" as const,
					source: e.source,
					target: e.target,
					relName: e.relation,
				}));

				setEdges(e);
			},
		},
		configStore.store.insightID,
	);

	// get the data if a table is selected
	const getData = usePixel<{
		data: {
			values: (string | number | boolean)[][];
			headers: string[];
		};
		headerInfo: {
			dataType: string;
			additionalDataType: string;
			alias: string;
			header: string;
			type: string;
			derived: boolean;
		}[];
		numCollected: number;
	}>(
		selectedNode && selectedNode.data.properties.length > 0
			? `Database(database=["${
					active.id
				}"]) | Distinct(false) | Select(${selectedNode.data.properties
					.map((p) => p.id)
					.join(", ")}) | Collect(100);`
			: "",
		{
			data: {
				data: {
					values: [],
					headers: [],
				},
				headerInfo: [],
				numCollected: 0,
			},
		},
		configStore.store.insightID,
	);

	const [showSyncDatabase, setShowSyncDatabase] = useState(false);

	const filteredColumns = useMemo(() => {
		if (!selectedNode?.data?.properties?.length) {
			return [];
		}

		const normalizedColumnSearch = normalizeSearchValue(
			columnSearch.trim(),
		);
		if (!normalizedColumnSearch) {
			return selectedNode.data.properties;
		}

		return selectedNode.data.properties.filter((property) =>
			normalizeSearchValue(property.name).includes(
				normalizedColumnSearch,
			),
		);
	}, [selectedNode, columnSearch]);

	const columnRows = useMemo(() => {
		return filteredColumns.slice(
			columnPage * columnVisibleRows,
			(columnPage + 1) * columnVisibleRows,
		);
	}, [filteredColumns, columnPage, columnVisibleRows]);
	const totalColumns = filteredColumns.length;
	const visibleColumnStart =
		totalColumns === 0 ? 0 : columnPage * columnVisibleRows + 1;
	const visibleColumnEnd = Math.min(
		(columnPage + 1) * columnVisibleRows,
		totalColumns,
	);
	const columnTableViewportClass =
		columnVisibleRows >= 50
			? "max-h-[560px]"
			: columnVisibleRows >= 25
				? "max-h-[440px]"
				: "max-h-[320px]";

	const description = selectedNode?.id
		? (getDatabaseMetamodel.data?.descriptions?.[selectedNode.id] ?? "")
		: "";

	const logical = selectedNode?.id
		? (getDatabaseMetamodel.data?.logicalNames?.[selectedNode.id] ?? [])
		: [];

	// get the concepts
	const concepts = nodes.map((n) => n.id);
	const normalizedMetadataSearch = normalizeSearchValue(
		metadataSearch.trim(),
	);
	const normalizedColumnSearch = normalizeSearchValue(columnSearch.trim());

	useEffect(() => {
		if (!activeSearchMatch) {
			return;
		}

		if (activeSearchMatch.columnIndex !== null) {
			setColumnPage(
				Math.floor(activeSearchMatch.columnIndex / columnVisibleRows),
			);
		} else {
			setColumnPage(0);
		}
	}, [activeSearchMatch, columnVisibleRows]);

	useEffect(() => {
		const maxPage = Math.max(
			0,
			Math.ceil(totalColumns / columnVisibleRows) - 1,
		);
		if (columnPage > maxPage) {
			setColumnPage(maxPage);
		}
	}, [columnPage, columnVisibleRows, totalColumns]);

	const openColumnDetailsModal = (details: ColumnDetails) => {
		setSelectedColumnDetails(details);
		setOpenColumnDetails(true);
	};

	const closeColumnDetailsModal = () => {
		setOpenColumnDetails(false);
		setSelectedColumnDetails(null);
	};

	const metadataPreviewData = useMemo(
		() =>
			selectedNode && getData.status === "SUCCESS"
				? {
						output: {
							data: {
								headers: getData.data.data.headers || [],
								values: getData.data.data.values || [],
							},
						},
						queryType: "SELECT" as const,
						timeToRun: 0,
						numCollected: getData.data.numCollected || 0,
					}
				: null,
		[
			selectedNode,
			getData.status,
			getData.data.data.headers,
			getData.data.data.values,
			getData.data.numCollected,
		],
	);

	/**
	 * Sync the metamodel with the database, given the tables and views to sync
	 * @param tables
	 * @param views
	 */
	const syncDatabase = async (tables: string[], views: string[]) => {
		try {
			console.log(tables, views);
			// create the filters
			const filters = JSON.stringify([...tables, ...views]);

			// run it
			const { errors, pixelReturn } = await configStore.runPixel<
				[
					{
						positions: Record<
							string,
							{
								top: number;
								left: number;
							}
						>;
						tables: {
							table: string;
							raw_type: string[];
							columns: string[];
							type: string[];
							isPrimKey: boolean[];
						}[];
						relationships: {
							fromTable: string;
							toTable: string;
							relName?: string;
							relation?: string;
							fromCol?: string;
							toCol?: string;
							sourceColumn?: string;
							targetColumn?: string;
						}[];
					},
				]
			>(
				`ExternalUpdateJdbcSchema(database=["${active.id}"], filters=${filters});`,
			);

			if (errors.length > 0) {
				throw new Error(errors.join(""));
			}

			const output = pixelReturn[0]?.output;

			const newNodes = output.tables.map((table) => ({
				id: table.table,
				type: "metamodel" as const,
				data: {
					name: table.table,
					properties: table.columns.map((col, idx) => ({
						id: `${table.table}__${col}`,
						name: col,
						type: table.type?.[idx] || "",
					})),
				},
				position: output.positions?.[table.table]
					? {
							x: output.positions[table.table].left,
							y: output.positions[table.table].top,
						}
					: { x: 0, y: 0 },
			}));

			const existingRelationshipNamesByPair = edges.reduce(
				(acc, edge) => {
					const key = `${edge.source}->${edge.target}`;
					const existing = acc.get(key) || [];
					if (edge.relName) {
						existing.push(edge.relName);
					}
					acc.set(key, existing);
					return acc;
				},
				new Map<string, string[]>(),
			);

			const newEdges = output.relationships.map((rel, i) => {
				const pairKey = `${rel.fromTable}->${rel.toTable}`;
				const preservedRelName = existingRelationshipNamesByPair
					.get(pairKey)
					?.shift();
				const relName =
					rel.relName ??
					rel.relation ??
					(rel.fromCol && rel.toCol
						? `${rel.fromCol}.${rel.toCol}`
						: undefined) ??
					(rel.sourceColumn && rel.targetColumn
						? `${rel.sourceColumn}.${rel.targetColumn}`
						: undefined) ??
					preservedRelName ??
					`${rel.fromTable}_${rel.toTable}`;

				return {
					id: `${relName}-${i}`,
					type: "floating" as const,
					source: rel.fromTable,
					target: rel.toTable,
					relName: relName,
				};
			});

			setNodes(newNodes);
			setEdges(newEdges);

			// set as modified
			setIsModified(true);
		} catch (e) {
			toast.error(
				`
Failed to sync with database changes. Please try again. 
				
Error ${e.message || "Unknown error"}				
				`,
			);
		}
	};

	/**
	 * Download teh database metadata as a PDF
	 */
	const downloadDatabaseMetadata = async () => {
		try {
			// run it
			const { errors, pixelReturn, insightId } =
				await configStore.runPixel<[string]>(
					`DatabaseMetadataToPdf(database=["${active.id}"]);`,
				);

			if (errors.length > 0) {
				throw new Error(errors.join(""));
			}

			const output = pixelReturn[0]?.output;

			// download the file
			download(insightId, output);
		} catch (e) {
			toast.error(
				`
Error downloading PDF. Please try again.
				
Error ${e.message || "Unknown error"}				
				`,
			);
		}
	};

	/**
	 * Save the changes
	 */
	const saveDatabase = async () => {
		try {
			const relationships = [];
			for (const edge of edges) {
				const relName = edge.relName || `${edge.source}_${edge.target}`;

				relationships.push({
					fromTable: edge.source,
					toTable: edge.target,
					relName: relName,
				});
			}

			const tables = {};
			const positions = {};
			for (const node of nodes) {
				if (!positions[node.id]) {
					positions[node.id] = {
						top: node.position.y,
						left: node.position.x,
					};
				}

				const tableKey = `${node.data.name}.${node.data.properties[0].name}`;
				if (!tables[tableKey]) {
					tables[tableKey] = node.data.properties.map((col) => {
						return col.name;
					});
				}
			}

			const { errors } = await configStore.runPixel(
				`RdbmsExternalUpload(database=["${active.id}"], metamodel=[${JSON.stringify({ relationships: relationships, tables: tables })}], existing=[true]); META|SaveOwlPositions(database=["${active.id}"], positionMap=[${JSON.stringify(positions)}]); META|SyncDatabaseWithLocalMaster(database=["${active.id}"]);`,
			);

			if (errors.length > 0) {
				throw new Error(errors.join(""));
			}

			// refresh it
			getDatabaseMetamodel.refresh();

			// throw a success
			toast.success("Successfully saved changes.");
		} catch (e) {
			toast.error(
				`
Failed to sync with database changes. Please try again. 
				
Error ${e.message || "Unknown error"}				
				`,
			);
		}
	};

	return (
		<div className="relative z-0">
			<Section>
				<Section.Header
					actions={
						<div className="flex gap-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="sm"
										disabled={!active?.id}
										variant="outline"
										onClick={() =>
											setShowSyncDatabase(true)
										}
										data-testid="engineMetadata-refresh-btn"
									>
										<RefreshCwIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									Sync the metamodel with the database
								</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="sm"
										disabled={!active?.id}
										variant="outline"
										onClick={() =>
											downloadDatabaseMetadata()
										}
										data-testid="engineMetadata-print-btn"
									>
										<DownloadIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									Download the metadata
								</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										size="sm"
										disabled={!active?.id || !isModified}
										variant="outline"
										onClick={() => saveDatabase()}
										data-testid="engineMetadata-save-btn"
									>
										<SaveIcon />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									Save changes to the metamodel
								</TooltipContent>
							</Tooltip>
						</div>
					}
				>
					Metamodel
				</Section.Header>
				<div className="flex flex-col">
					<section className="relative h-[55vh] w-full overflow-hidden rounded-lg border border-border">
						<Metamodel
							nodes={nodes}
							edges={edges}
							selectedNode={selectedNode}
							onSelectNode={(node) => {
								setSelectedNode(node);
								setColumnPage(0);
							}}
							onViewColumnMetadata={(payload) =>
								openColumnDetailsModal({
									tableName: payload.tableName,
									columnId: payload.columnId,
									columnName: payload.name,
									physicalType:
										payload.physicalType ||
										resolvePhysicalType(
											getDatabaseMetamodel.data
												?.physicalTypes,
											payload.tableName,
											payload.name,
											payload.columnId,
										),
									description: payload.description ?? "",
									logicalNames: payload.logicalNames ?? [],
								})
							}
							isInteractive={true}
							showSearch={true}
							searchValue={metadataSearch}
							onSearchValueChange={setMetadataSearch}
							onSearchMatchChange={setActiveSearchMatch}
							searchInputTestId="engineMetadata-search-input"
						/>
					</section>
				</div>
			</Section>

			{selectedNode && (
				<Section>
					<Section.Header>Table Details</Section.Header>
					<div className="grid gap-3 xl:grid-cols-12">
						<Card className="flex h-fit flex-col gap-0 self-start overflow-hidden rounded-xl border border-border/70 bg-card py-0 shadow-sm xl:col-span-6">
							<div className="space-y-4 border-border/60 border-b p-4">
								<div className="space-y-2">
									<P className="font-medium text-foreground text-sm">
										Logical Names
									</P>
									<div className="flex min-h-11 flex-wrap content-start gap-2 rounded-lg border border-border/50 bg-muted/20 p-2.5">
										{logical.length > 0 ? (
											logical.map((name) => (
												<Badge
													key={name}
													variant="default"
													className="text-xs"
													data-testid={`logical-name-${name}`}
												>
													{name}
												</Badge>
											))
										) : (
											<P className="text-muted-foreground text-sm">
												No logical names provided.
											</P>
										)}
									</div>
								</div>
								<div className="space-y-2">
									<P className="font-medium text-foreground text-sm">
										Description
									</P>
									<div className="min-h-11 rounded-lg border border-border/50 bg-muted/20 p-2.5">
										<P className="text-muted-foreground text-sm">
											{description ||
												"No description provided."}
										</P>
									</div>
								</div>
							</div>

							<div className="flex items-center justify-between border-border/60 border-t px-4 py-2">
								<div className="space-y-1">
									<P className="font-semibold text-base text-foreground">
										Columns
									</P>
									<P className="text-muted-foreground text-xs">
										Review column metadata and open details.
									</P>
								</div>
								<Badge variant="secondary" className="text-xs">
									{totalColumns} total
								</Badge>
							</div>
							<div className="border-border/50 border-t px-4 py-1.5">
								<div className="relative max-w-xs">
									<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 text-muted-foreground" />
									<Input
										value={columnSearch}
										onChange={(event) => {
											setColumnSearch(event.target.value);
											setColumnPage(0);
										}}
										placeholder="Search column names..."
										className="h-8 pl-8"
										data-testid="engineMetadata-column-search-input"
									/>
								</div>
							</div>
							<div className="overflow-hidden px-4 pb-1.5">
								<div
									className={`min-h-[120px] overflow-auto rounded-lg border border-border/60 bg-background ${columnTableViewportClass}`}
								>
									<Table className="text-sm">
										<TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
											<TableRow>
												<TableHead className="h-10 w-12 px-2" />
												<TableHead className="h-10 min-w-[220px] px-3 font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
													Name
												</TableHead>
												<TableHead className="h-10 min-w-[220px] px-3 font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
													Logical Names
												</TableHead>
												<TableHead className="h-10 min-w-[260px] px-3 font-semibold text-[11px] text-muted-foreground uppercase tracking-wide">
													Description
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{columnRows.length === 0 && (
												<TableRow>
													<TableCell
														colSpan={4}
														className="py-8 text-center text-muted-foreground text-sm"
													>
														No columns found.
													</TableCell>
												</TableRow>
											)}
											{columnRows.map((property) => {
												const isMetadataMatch =
													normalizedMetadataSearch.length >
														0 &&
													normalizeSearchValue(
														property.name,
													).includes(
														normalizedMetadataSearch,
													);
												const isColumnSearchMatch =
													normalizedColumnSearch.length >
														0 &&
													normalizeSearchValue(
														property.name,
													).includes(
														normalizedColumnSearch,
													);
												const isActiveMatch =
													activeSearchMatch?.columnIndex !==
														null &&
													selectedNode?.id ===
														activeSearchMatch?.nodeId &&
													selectedNode.data
														.properties[
														activeSearchMatch
															.columnIndex
													]?.id === property.id;
												const desc =
													getDatabaseMetamodel.data
														?.descriptions?.[
														property.id
													] || "";
												const logic =
													getDatabaseMetamodel.data
														?.logicalNames?.[
														property.id
													] || [];
												const columnType =
													property.type ||
													normalizeSupportedDataType(
														property.physicalType,
													) ||
													"UNKNOWN";

												return (
													<TableRow
														key={property.id}
														className={
															isActiveMatch
																? "border-border/60 bg-primary/15 ring-1 ring-primary/30"
																: isMetadataMatch ||
																		isColumnSearchMatch
																	? "border-border/50 bg-primary/10"
																	: "border-border/50 hover:bg-muted/40"
														}
														data-testid={`column-row-${property.id}`}
													>
														<TableCell className="w-12 px-2 align-top">
															<Button
																variant="ghost"
																size="icon"
																className="h-8 w-8"
																onClick={() => {
																	if (
																		!selectedNode
																	) {
																		return;
																	}
																	openColumnDetailsModal(
																		{
																			tableName:
																				selectedNode
																					.data
																					.name,
																			columnId:
																				property.id,
																			columnName:
																				property.name,
																			physicalType:
																				property.physicalType ||
																				resolvePhysicalType(
																					getDatabaseMetamodel
																						.data
																						?.physicalTypes,
																					selectedNode
																						.data
																						.name,
																					property.name,
																					property.id,
																				),
																			description:
																				desc,
																			logicalNames:
																				logic,
																		},
																	);
																}}
																data-testid={`column-row-${property.id}-metadata-btn`}
															>
																<Pencil className="size-4" />
															</Button>
														</TableCell>
														<TableCell className="min-w-[220px] px-3 py-2.5 align-top">
															<div className="flex flex-wrap items-center gap-2">
																<span
																	className={
																		isMetadataMatch ||
																		isColumnSearchMatch
																			? "rounded bg-yellow-200 px-1 py-0.5 font-medium text-[13px] text-foreground leading-5"
																			: "font-medium text-[13px] text-foreground leading-5"
																	}
																>
																	{
																		property.name
																	}
																</span>
																<Badge
																	variant="outline"
																	className="h-5 rounded-sm px-1.5 font-medium text-[10px] text-muted-foreground uppercase tracking-wide"
																>
																	{columnType}
																</Badge>
															</div>
														</TableCell>
														<TableCell className="min-w-[220px] px-3 py-2.5 align-top">
															<div className="flex flex-wrap gap-1.5">
																{logic.length >
																0 ? (
																	logic.map(
																		(
																			ln,
																		) => (
																			<Badge
																				key={
																					ln
																				}
																				variant="secondary"
																				className="h-5 rounded-sm px-1.5 font-medium text-[10px]"
																			>
																				{
																					ln
																				}
																			</Badge>
																		),
																	)
																) : (
																	<span className="text-muted-foreground text-xs">
																		-
																	</span>
																)}
															</div>
														</TableCell>
														<TableCell className="min-w-[260px] px-3 py-2.5 align-top">
															<P className="max-w-[420px] break-words text-muted-foreground text-xs leading-5">
																{desc || "-"}
															</P>
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							</div>
							<div className="flex flex-wrap items-center justify-between gap-3 border-border/60 border-t px-4 py-1.5">
								<div className="flex items-center gap-2">
									<P className="text-muted-foreground text-sm">
										Rows per page:
									</P>
									<Select
										value={String(columnVisibleRows)}
										onValueChange={(value) => {
											setColumnVisibleRows(Number(value));
											setColumnPage(0);
										}}
									>
										<SelectTrigger className="h-8 w-[88px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="10">
												10
											</SelectItem>
											<SelectItem value="25">
												25
											</SelectItem>
											<SelectItem value="50">
												50
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="flex items-center gap-4">
									<P className="text-muted-foreground text-sm">
										{visibleColumnStart}-{visibleColumnEnd}{" "}
										of {totalColumns}
									</P>
									<div className="flex gap-1">
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8"
											onClick={() =>
												setColumnPage(
													Math.max(0, columnPage - 1),
												)
											}
											disabled={columnPage === 0}
											aria-label="Previous page"
										>
											<ChevronLeft className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8"
											onClick={() =>
												setColumnPage(columnPage + 1)
											}
											disabled={
												(columnPage + 1) *
													columnVisibleRows >=
												totalColumns
											}
											aria-label="Next page"
										>
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</div>
						</Card>

						<Card className="flex h-[560px] flex-col gap-0 overflow-hidden rounded-xl border border-border/70 bg-card py-0 shadow-sm xl:col-span-6">
							<div className="space-y-1 border-border/60 border-b px-4 py-3">
								<P className="font-medium text-foreground text-sm">
									Data
								</P>
								<P className="text-muted-foreground text-xs">
									Preview up to 100 rows from the selected
									table.
								</P>
							</div>
							<div className="min-h-0 flex-1 overflow-hidden">
								{getData.status === "SUCCESS" &&
								metadataPreviewData ? (
									renderQueryResults(
										metadataPreviewData,
										100,
										true,
									)
								) : getData.status === "LOADING" ? (
									<div className="flex h-full items-center justify-center p-8">
										<P className="text-muted-foreground text-sm">
											Loading data preview...
										</P>
									</div>
								) : getData.status === "ERROR" ? (
									<div className="flex h-full items-center justify-center p-8">
										<P className="text-muted-foreground text-sm">
											Unable to load data preview.
										</P>
									</div>
								) : (
									<div className="flex h-full items-center justify-center p-8">
										<P className="text-muted-foreground text-sm">
											Select a table to view data.
										</P>
									</div>
								)}
							</div>
						</Card>
					</div>
				</Section>
			)}

			<Dialog
				open={openColumnDetails}
				onOpenChange={(open) => {
					if (!open) {
						closeColumnDetailsModal();
					}
				}}
			>
				<DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-xl">
					<DialogHeader>
						<DialogTitle>Column Metadata</DialogTitle>
						<DialogDescription>
							View logical names and description.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 overflow-y-auto pr-1">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="outline">
								Table:{" "}
								{selectedColumnDetails?.tableName ?? "N/A"}
							</Badge>
							<Badge variant="outline">
								Column:{" "}
								{selectedColumnDetails?.columnName ?? "N/A"}
							</Badge>
							<Badge variant="outline">
								Physical Type:{" "}
								{selectedColumnDetails?.physicalType || "N/A"}
							</Badge>
						</div>

						<div className="space-y-2 rounded-md border border-border p-3">
							<div className="space-y-1">
								<P className="font-medium text-foreground text-sm">
									Logical Names
								</P>
								<div className="flex flex-wrap gap-1">
									{selectedColumnDetails?.logicalNames
										?.length ? (
										selectedColumnDetails.logicalNames.map(
											(name) => (
												<Badge
													key={name}
													variant="default"
													className="text-xs"
												>
													{name}
												</Badge>
											),
										)
									) : (
										<P className="text-muted-foreground text-sm">
											No logical names provided.
										</P>
									)}
								</div>
							</div>

							<div className="space-y-1">
								<P className="font-medium text-foreground text-sm">
									Description
								</P>
								<P className="text-muted-foreground text-sm">
									{selectedColumnDetails?.description ||
										"No description provided."}
								</P>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={closeColumnDetailsModal}
							data-testid="column-details-close-btn"
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{active?.id && (
				<SyncExternalDatabaseOverlay
					engine={active.id}
					tables={concepts} // for RDBMS, tables and views are the same in terms of metadata, so we can just pass the concepts as both
					views={concepts} // for RDBMS, tables and views are the same in terms of metadata, so we can just pass the concepts as both
					open={showSyncDatabase}
					onClose={async (success, data) => {
						if (success) {
							await syncDatabase(data.tables, data.views);
						}

						// close it
						setShowSyncDatabase(false);
					}}
				/>
			)}
		</div>
	);
});
