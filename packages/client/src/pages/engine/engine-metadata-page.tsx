import { DownloadIcon, Pencil, RefreshCwIcon, SaveIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { download, usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	P,
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

export const EngineMetadataPage = observer(() => {
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
				}[];
			};
			position: {
				x: number;
				y: number;
			};
		}[]
	>([]);
	const [edges, setEdges] = useState<
		{ id: string; type: "floating"; source: string; target: string }[]
	>([]);

	const [selectedNode, setSelectedNode] = useState(null);
	const [columnPage, setColumnPage] = useState<number>(0);
	const [columnVisibleRows, setColumnVisibleRows] = useState<number>(5);

	const getDatabaseMetamodel = usePixel<{
		dataTypes: Record<string, "INT" | "DOUBLE" | "STRING">;
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
		additionalDataTypes: Record<string, "INT" | "FLOAT" | "VARCHAR(2000)">;
	}>(
		active.id
			? `GetDatabaseMetamodel( database=["${active.id}"], options=["dataTypes","additionalDataTypes","logicalNames","descriptions","positions"]);`
			: "",
		{
			onSuccess({ nodes, edges, positions }) {
				// update the nodes
				const n = nodes.map((n) => ({
					id: n.conceptualName,
					type: "metamodel" as const,
					data: {
						name: n.conceptualName,
						properties: n.propSet.map((p) => ({
							id: `${n.conceptualName}__${p}`,
							name: p,
							type: "",
						})),
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
				const e = edges.map((e) => ({
					id: e.relation,
					type: "floating" as const,
					source: e.source,
					target: e.target,
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
				}"]) | Select(${selectedNode.data.properties
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

	const columnRows = useMemo(() => {
		if (!selectedNode?.data?.properties?.length) return [];
		return selectedNode.data.properties.slice(
			columnPage * columnVisibleRows,
			(columnPage + 1) * columnVisibleRows,
		);
	}, [selectedNode, columnPage, columnVisibleRows]);

	const description = selectedNode?.id
		? (getDatabaseMetamodel.data?.descriptions?.[selectedNode.id] ?? "")
		: "";

	const logical = selectedNode?.id
		? (getDatabaseMetamodel.data?.logicalNames?.[selectedNode.id] ?? [])
		: [];

	// get the concepts
	const concepts = nodes.map((n) => n.id);

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

			const newEdges = output.relationships.map((rel, i) => ({
				id: `${rel.fromTable}-${rel.toTable}-${i}`,
				type: "floating" as const,
				source: rel.fromTable,
				target: rel.toTable,
			}));

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
				relationships.push({
					fromTable: edge.source,
					toTable: edge.target,
					relName: `${edge.source}_${edge.target}`,
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
				`RdbmsExternalUpload(database=["${active.id}"], metamodel=[${JSON.stringify({ relationships: relationships, tables: tables })}], existing=[true]); META|SaveOwlPositions(database=["${active.id}"], positionMap=[${JSON.stringify(positions)}]); META|SyncDatabaseWithLocalMaster(database=["${active.id}"])`,
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
				<div className="flex flex-col gap-4">
					<section className="h-[55vh] w-full rounded-lg border border-border">
						<Metamodel
							nodes={nodes}
							edges={edges}
							selectedNode={selectedNode}
							onSelectNode={setSelectedNode}
							isInteractive={true}
						/>
					</section>
				</div>
			</Section>

			{selectedNode && (
				<>
					<Section>
						<Section.Header>Description</Section.Header>
						<P className="text-foreground text-sm">{description}</P>
					</Section>

					<Section>
						<Section.Header>Logical Names</Section.Header>
						<div className="flex flex-wrap gap-2">
							{logical.map((name) => (
								<Badge
									key={name}
									variant="default"
									className="text-xs"
									data-testid={`logical-name-${name}`}
								>
									{name}
								</Badge>
							))}
						</div>
					</Section>

					<Section>
						<Section.Header>Columns</Section.Header>
						<div className="h-[396px] overflow-auto rounded-md border border-border">
							<Table>
								<TableHeader className="sticky top-0 bg-background">
									<TableRow>
										<TableHead className="w-12" />
										<TableHead>Name</TableHead>
										<TableHead>Description</TableHead>
										<TableHead>Logical Names</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{columnRows.map((property) => {
										const desc =
											getDatabaseMetamodel.data
												?.descriptions?.[property.id] ||
											"";
										const logic =
											getDatabaseMetamodel.data
												?.logicalNames?.[property.id] ||
											[];
										return (
											<TableRow
												key={`${property}--${property.id}`}
												data-testid={`column-row-${property.id}`}
											>
												<TableCell>
													<Button
														variant="ghost"
														size="icon"
														disabled
														className="h-8 w-8"
													>
														<Pencil className="size-4" />
													</Button>
												</TableCell>
												<TableCell className="font-medium">
													{property.name}
												</TableCell>
												<TableCell>
													<P className="text-muted-foreground text-xs">
														{desc}
													</P>
												</TableCell>
												<TableCell>
													<div className="flex flex-wrap gap-1">
														{logic.map((ln) => (
															<Badge
																key={ln}
																variant="default"
																className="text-xs"
															>
																{ln}
															</Badge>
														))}
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
						{/* Pagination */}
						<div className="mt-2 flex items-center justify-end gap-4">
							<div className="flex items-center gap-2">
								<P className="text-muted-foreground text-sm">
									Rows per page:
								</P>
								<select
									value={columnVisibleRows}
									onChange={(e) =>
										setColumnVisibleRows(
											Number(e.target.value),
										)
									}
									className="rounded-md border border-border bg-background px-2 py-1 text-sm"
								>
									<option value={7}>7</option>
									<option value={10}>10</option>
									<option value={25}>25</option>
								</select>
							</div>
							<P className="text-muted-foreground text-sm">
								{columnPage * columnVisibleRows + 1}-
								{Math.min(
									(columnPage + 1) * columnVisibleRows,
									selectedNode?.data?.properties?.length || 0,
								)}{" "}
								of {selectedNode?.data?.properties?.length || 0}
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
								>
									‹
								</Button>
								<Button
									variant="outline"
									size="icon"
									className="h-8 w-8"
									onClick={() =>
										setColumnPage(columnPage + 1)
									}
									disabled={
										(columnPage + 1) * columnVisibleRows >=
										(selectedNode?.data?.properties
											?.length || 0)
									}
								>
									›
								</Button>
							</div>
						</div>
					</Section>
				</>
			)}

			{selectedNode && getData.status === "SUCCESS" && (
				<Section>
					<Section.Header>Data</Section.Header>
					<div className="h-[396px] overflow-auto rounded-md border border-border">
						<Table>
							<TableHeader className="sticky top-0 bg-background">
								<TableRow>
									{getData.data.data.headers.map((h) => (
										<TableHead key={h}>{h}</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{getData.data.data.values.map(
									(row, rowIndex) => (
										<TableRow
											key={`row-${
												// biome-ignore lint/suspicious/noArrayIndexKey: TODO: Fix
												rowIndex
											}`}
										>
											{row.map((val, colIndex) => (
												<TableCell
													key={`val-${rowIndex}-${
														// biome-ignore lint/suspicious/noArrayIndexKey:TODO: Fix
														colIndex
													}`}
												>
													{val}
												</TableCell>
											))}
										</TableRow>
									),
								)}
							</TableBody>
						</Table>
					</div>
				</Section>
			)}

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
