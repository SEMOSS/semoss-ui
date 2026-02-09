import { Download, Pencil } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@semoss/ui/next";
import { Metamodel } from "@/components/metamodel";
import { Section } from "@/components/ui";
import { useEngine, usePixel, useRootStore } from "@/hooks";
import { SyncChangesModal } from "./sync-changes-modal";

export const EngineMetadataPage = observer(() => {
	const { active } = useEngine();
	const { monolithStore } = useRootStore();

	const [selectedNode, setSelectedNode] = useState(null);
	const [columnPage, setColumnPage] = useState<number>(0);
	const [columnVisibleRows, setColumnVisibleRows] = useState<number>(5);

	const [customNodes, setCustomNodes] = useState(null);
	const [customEdges, setCustomEdges] = useState(null);
	const [relationships, setRelationships] = useState(null);
	const [canSave, setCanSave] = useState(true);
	const navigate = useNavigate();

	const refreshData = (showModal: boolean = false) => {
		const pixel = `ExternalUpdateJdbcTablesAndViews(database=["${active.id}"]);`;
		monolithStore.runQuery(pixel).then((response) => {
			const output = response.pixelReturn?.[0]?.output ?? {};
			setTabledata(output.tables ?? []);
			setViewdata(output.views ?? []);
			if (showModal) {
				setShowSyncModal(true);
			}
		});
	};

	const query = useMemo(() => {
		if (!active?.id) return "";

		return `GetDatabaseMetamodel( database=["${active.id}"], options=["dataTypes","additionalDataTypes","logicalNames","descriptions","positions"]);`;
	}, [active?.id]);

	useEffect(() => {
		if (active?.id) {
			refreshData(false);
		}
	}, [query]);

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
	}>(query);

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
	);

	const defaultNodes = useMemo(() => {
		if (getDatabaseMetamodel.status !== "SUCCESS") return [];
		const { nodes = [], positions = {} } = getDatabaseMetamodel.data;
		return nodes.map((n) => ({
			id: n.conceptualName,
			type: "metamodel",
			data: {
				name: n.conceptualName.replace(/_/g, " "),
				properties: n.propSet.map((p) => ({
					id: `${n.conceptualName}__${p}`,
					name: p.replace(/_/g, " "),
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
	}, [getDatabaseMetamodel.status, getDatabaseMetamodel.data]);

	const defaultEdges = useMemo(() => {
		if (getDatabaseMetamodel.status !== "SUCCESS") return [];
		return getDatabaseMetamodel.data.edges.map((e) => ({
			id: e.relation,
			type: "floating",
			source: e.source,
			target: e.target,
		}));
	}, [getDatabaseMetamodel.status, getDatabaseMetamodel.data]);

	const [showSyncModal, setShowSyncModal] = useState(false);
	const [tabledata, setTabledata] = useState<string[]>([]);
	const [viewdata, setViewdata] = useState<string[]>([]);

	const handleSyncApply = (
		selectedTables: string[],
		selectedViews: string[],
	) => {
		const filters = JSON.stringify([...selectedTables, ...selectedViews]);
		const pixel = `ExternalUpdateJdbcSchema(database=["${active.id}"], filters=${filters});`;

		monolithStore.runQuery(pixel).then((response) => {
			const output = response.pixelReturn[0]?.output;

			if (!output) return;

			const newNodes = output.tables.map((table) => ({
				id: table.table,
				type: "metamodel",
				data: {
					name: table.table.replace(/_/g, " "),
					properties: table.columns.map((col, idx) => ({
						id: `${table.table}__${col}`,
						name: col.replace(/_/g, " "),
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

			const newEdges = (output.relationships || []).map((rel, i) => ({
				id: `${rel.fromTable}-${rel.toTable}-${i}`,
				type: "floating",
				source: rel.fromTable,
				target: rel.toTable,
			}));

			setRelationships(output.relationships);
			setCustomNodes(newNodes);
			setCustomEdges(newEdges);
			setShowSyncModal(false);
			setCanSave(!true);
		});
	};

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

	const printMeta = () => {
		const pixel = `META|DatabaseMetadataToPdf(database=["${active.id}"]);`;
		monolithStore.runQuery(pixel).then((response) => {
			const output = response.pixelReturn[0].output;
			const insightId = response.insightId;
			monolithStore.download(insightId, output);
		});
	};

	/**
	 *
	 * @param data
	 * @desc Needs to be done at top level since this is very similar to other RDBMS dbs
	 */
	const saveDatabase = async (data) => {
		const tables = {};
		const owlPositions = {};

		data.nodes.forEach((node) => {
			const tableInfo = node.data;
			const cols = node.data.properties;
			const firstCol = cols[0].name.replace(/ /g, "_");

			if (!tables[tableInfo.name + "." + firstCol]) {
				const columns = [];

				cols.forEach((col) => {
					columns.push(col.name.replace(/ /g, "_"));
				});

				tables[tableInfo.name + "." + firstCol] = columns;
			}

			if (!owlPositions[node.id]) {
				owlPositions[node.id] = {
					top: node.position.y,
					left: node.position.x,
				};
			}
		});

		const pixel = `RdbmsExternalUpload(database=["${active.id}"], metamodel=[${JSON.stringify({ relationships: relationships, tables: tables })}], existing=[true]); META|SaveOwlPositions(database=["${active.id}"], positionMap=[${JSON.stringify(owlPositions)}]); META|SyncDatabaseWithLocalMaster(database=["${active.id}"])`;

		const resp = await monolithStore.runQuery(pixel);
		const output = resp.pixelReturn[0].output,
			operationType = resp.pixelReturn[0].operationType;

		if (operationType.indexOf("ERROR") > -1) {
			console.warn("RDBMSExternalUpload Reactor bug");
		} else {
			navigate(`/engine/database/${output.database_id}/metamodel`);
			return;
		}
	};

	const onSubmit = () => {
		const payloadObj = {
			metamodel: {
				relation: [],
				nodeProp: {},
			},
			dataTypeMap: {},
			newHeaders: {},
			additionalDataTypes: {},
			descriptionMap: {},
			logicalNamesMap: {},
			position: [{}],
			nodes: customNodes,
		};

		for (const edge of customEdges) {
			const relName = `${edge.source}_${edge.target}`;
			payloadObj.metamodel.relation.push({
				fromTable: edge.source,
				toTable: edge.target,
				relName: relName,
			});
		}

		for (const node of customNodes) {
			for (const col of node.data.properties) {
				payloadObj.dataTypeMap[col.name] = col.type;
			}

			payloadObj.metamodel.nodeProp[node.data.name] = [];
		}

		saveDatabase(payloadObj);
	};

	return (
		<div className="relative z-0">
			<Section>
				<Section.Header
					actions={
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() => refreshData(true)}
								data-testid="engineMetadata-refresh-btn"
							>
								Refresh Data
							</Button>
							<Button
								variant="outline"
								onClick={printMeta}
								data-testid="engineMetadata-print-btn"
							>
								<Download className="mr-2 size-4" />
								Print Metadata
							</Button>
							<Button
								disabled={canSave}
								variant="outline"
								onClick={() => onSubmit()}
								data-testid="engineMetadata-save-btn"
							>
								Save
							</Button>
						</div>
					}
				>
					Metamodel
				</Section.Header>
				<div className="flex flex-col gap-4">
					<section className="h-[55vh] w-full rounded-lg border border-border">
						<Metamodel
							nodes={customNodes ?? defaultNodes}
							edges={customEdges ?? defaultEdges}
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
										<TableHead key={h}>
											{h.replace(/_/g, " ")}
										</TableHead>
									))}
								</TableRow>
							</TableHeader>
							<TableBody>
								{getData.data.data.values.map(
									(row, rowIndex) => (
										<TableRow key={`row-${rowIndex}`}>
											{row.map((val, colIndex) => (
												<TableCell
													key={`val-${rowIndex}-${colIndex}`}
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

			<SyncChangesModal
				open={showSyncModal}
				onClose={() => setShowSyncModal(false)}
				onApply={handleSyncApply}
				tables={tabledata}
				views={viewdata}
			/>
		</div>
	);
});
