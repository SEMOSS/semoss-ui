/** biome-ignore-all lint/a11y/noStaticElementInteractions: TODO */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: TODO */
import {
	ChevronDown,
	ChevronUp,
	Edit,
	FileSpreadsheet,
	FoldVertical,
	Plus,
	UnfoldVertical,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DataTypeIcon } from "@semoss/shared";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	Field,
	FieldDescription,
	Input,
	P,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";
import ColumnEditModal from "./column-edit-modal";

interface ParsedResult {
	headers: string[];
	dataTypes: Record<string, string>;
	cleanHeaders: string[];
}
interface DataSelectionProps {
	files: ParsedResult[];
	fileName: string[];
	tableName: string[];
	onImport: (payload: Record<string, unknown>[]) => Promise<void>;
	onCancel: () => void;
}

interface ColumnMetadata {
	alias?: string;
	dataType?: string;
	format?: string;
	description?: string;
	logicalName?: string[];
}

const DataSelection = ({
	files,
	fileName,
	tableName,
	onImport,
	onCancel,
}: DataSelectionProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [openModal, setOpenModal] = useState(false);
	const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
	const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(
		null,
	);

	const [columnMetadataList, setColumnMetadataList] = useState<
		Record<string, ColumnMetadata>[]
	>([]);
	const [collapseAll, setCollapseAll] = useState<boolean[]>(
		files.map(() => true),
	);
	const [rowEditableStateList, setRowEditableStateList] = useState<
		Record<number, boolean>[]
	>([]);
	const [tableNames, setTableNames] = useState<string[]>(tableName);

	// Comprehensive scroll to top on component mount
	useEffect(() => {
		// Scroll window
		window.scrollTo(0, 0);

		// Scroll document body
		document.body.scrollTop = 0;
		document.documentElement.scrollTop = 0;

		// Scroll container ref if exists
		if (containerRef.current) {
			containerRef.current.scrollIntoView({
				behavior: "auto",
				block: "start",
			});
		}

		// Find and scroll all parent scrollable containers
		const scrollableParents = [];
		let parent = containerRef.current?.parentElement;

		while (parent) {
			const hasOverflow = getComputedStyle(parent).overflow;
			const hasOverflowY = getComputedStyle(parent).overflowY;

			if (
				hasOverflow === "auto" ||
				hasOverflow === "scroll" ||
				hasOverflowY === "auto" ||
				hasOverflowY === "scroll"
			) {
				scrollableParents.push(parent);
			}
			parent = parent.parentElement;
		}

		scrollableParents.forEach((element) => {
			element.scrollTop = 0;
		});
	}, []);

	// Initialize column metadata and row states for each file
	useEffect(() => {
		const metaList = files.map((parsedData) =>
			Object.fromEntries(
				parsedData.cleanHeaders.map((header) => [
					header,
					{
						alias: header,
						dataType: parsedData.dataTypes?.[header] || "String",
						format: "",
						description: "",
						logicalName: [],
					},
				]),
			),
		);
		setColumnMetadataList(metaList);

		const rowStateList = files.map((parsedData) =>
			Object.fromEntries(
				parsedData.cleanHeaders.map((_, index) => [index, true]),
			),
		);
		setRowEditableStateList(rowStateList);
	}, [files]);

	const handleNameChange = (
		fileIdx: number,
		index: number,
		newValue: string,
	) => {
		const column = files[fileIdx].cleanHeaders[index];
		setColumnMetadataList((prev) => {
			const clone = [...prev];
			clone[fileIdx] = {
				...clone[fileIdx],
				[column]: { ...clone[fileIdx][column], alias: newValue },
			};
			return clone;
		});
	};

	const toggleRowEditState = (fileIdx: number, index: number) => {
		setRowEditableStateList((prev) => {
			const clone = [...prev];
			clone[fileIdx] = {
				...clone[fileIdx],
				[index]: !clone[fileIdx][index],
			};
			return clone;
		});
	};

	const handleOpenModal = (fileIdx: number, column: string) => {
		setSelectedColumn(column);
		setSelectedFileIndex(fileIdx);
		setOpenModal(true);
	};

	const handleTableNameChange = (index: number, newValue: string) => {
		setTableNames((prev) => {
			const updated = [...prev];
			updated[index] = newValue;
			return updated;
		});
	};

	const handleImport = () => {
		const tables = files.map((parsedData, fileIdx) => {
			const originalHeaders = parsedData.cleanHeaders;
			const metadata = columnMetadataList[fileIdx];
			const rowState = rowEditableStateList[fileIdx];

			const activeHeaders = originalHeaders.filter(
				(_, index) => rowState[index],
			);

			const dataTypeMap: Record<string, string> = {};
			const newHeaders: Record<string, string> = {};
			const descriptionMap: Record<string, string> = {};
			const logicalNamesMap: Record<string, string[]> = {};
			const additionalDataTypes: Record<string, string> = {};

			activeHeaders.forEach((original) => {
				const userMeta = metadata[original] || {};
				const updated = userMeta.alias || original;
				const dataType =
					userMeta.dataType || parsedData.dataTypes[original];

				dataTypeMap[updated] = dataType;

				if (userMeta.alias && userMeta.alias !== original) {
					newHeaders[updated] = original;
				}
				if (userMeta.description) {
					descriptionMap[updated] = userMeta.description;
				}
				if (
					Array.isArray(userMeta.logicalName) &&
					userMeta.logicalName.length > 0
				) {
					logicalNamesMap[updated] = userMeta.logicalName;
				}
				if (userMeta.format) {
					additionalDataTypes[updated] = userMeta.format;
				}
			});

			return {
				fileName: fileName[fileIdx],
				table: tableNames[fileIdx],
				filePath: [fileName[fileIdx]],
				dataTypeMap,
				newHeaders,
				descriptionMap,
				logicalNamesMap,
				additionalDataTypes,
				existing: fileIdx > 0,
			};
		});

		onImport(tables);
	};

	const isAnyTableNameInvalid = tableNames.some((name) => !name?.trim());

	return (
		<div ref={containerRef}>
			<P className="mt-4 font-semibold text-xl">Configure Columns</P>
			<P className="mt-2 mb-4 font-normal text-muted-foreground">
				Review and adjust column names and data types before importing
				your data.
			</P>
			{files.map((parsedData, fileIdx) => (
				<div key={fileName[fileIdx]} className="mb-3">
					<div className="overflow-hidden rounded-md border border-border bg-card">
						{/* Summary Header */}
						<div
							className="flex cursor-pointer flex-row items-center justify-between bg-secondary px-3 py-2"
							onClick={() =>
								setCollapseAll((prev) =>
									prev.map((v, i) =>
										i === fileIdx ? !v : v,
									),
								)
							}
						>
							<div className="flex items-center gap-2">
								<FileSpreadsheet className="size-4 text-primary" />
								<P className="font-medium text-foreground text-sm">
									{fileName[fileIdx]}
								</P>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									data-testid="collapse-button"
									onClick={(e) => {
										e.stopPropagation();
										setCollapseAll((prev) =>
											prev.map((v, i) =>
												i === fileIdx ? !v : v,
											),
										);
									}}
									className="h-7 gap-1.5 px-2 text-xs"
								>
									{collapseAll[fileIdx] ? (
										<>
											<FoldVertical className="size-3" />
											Collapse
										</>
									) : (
										<>
											<UnfoldVertical className="size-3" />
											Expand
										</>
									)}
								</Button>
								{collapseAll[fileIdx] ? (
									<ChevronUp className="size-4 text-muted-foreground" />
								) : (
									<ChevronDown className="size-4 text-muted-foreground" />
								)}
							</div>
						</div>

						<Collapsible open={collapseAll[fileIdx]}>
							<CollapsibleContent>
								{/* Table Name */}
								<div className="flex items-center gap-2 border-border border-b px-3 py-2">
									<P className="shrink-0 text-foreground text-sm">
										Table Name:
									</P>
									<Field className="flex-1">
										<Input
											placeholder="Enter table name"
											value={tableNames[fileIdx] || ""}
											onChange={(e) =>
												handleTableNameChange(
													fileIdx,
													e.target.value,
												)
											}
											data-testid="table-name-input"
											className={`h-7 text-sm ${!tableNames[fileIdx]?.trim() ? "border-destructive focus-visible:ring-destructive" : ""}`}
										/>
										{!tableNames[fileIdx]?.trim() && (
											<FieldDescription className="mt-0.5 text-destructive text-xs">
												Enter a valid table name
											</FieldDescription>
										)}
									</Field>
								</div>

								{/* Table */}
								<div className="max-h-[400px] overflow-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="py-2 pl-3">
													<P className="font-semibold text-foreground text-xs uppercase tracking-wide">
														Name
													</P>
												</TableHead>
												<TableHead className="w-px py-2 text-center">
													<P className="font-semibold text-foreground text-xs uppercase tracking-wide">
														Data Type
													</P>
												</TableHead>
												<TableHead className="w-9 py-2" />
											</TableRow>
										</TableHeader>
										<TableBody>
											{parsedData.cleanHeaders.map(
												(column, index) => (
													<TableRow
														key={column}
														data-testid={`table-row-${fileIdx}-${index}`}
													>
														<TableCell
															className="py-1.5 pr-2 pl-3"
															data-testid={`table-cell-name-${fileIdx}-${index}`}
														>
															<Input
																value={
																	columnMetadataList[
																		fileIdx
																	]?.[column]
																		?.alias ??
																	column
																}
																onChange={(e) =>
																	handleNameChange(
																		fileIdx,
																		index,
																		e.target
																			.value,
																	)
																}
																disabled={
																	!rowEditableStateList[
																		fileIdx
																	]?.[index]
																}
																data-testid={`column-name-input-${fileIdx}-${index}`}
																className={`h-7 text-sm ${!rowEditableStateList[fileIdx]?.[index] ? "border-dashed" : ""}`}
															/>
														</TableCell>
														<TableCell
															className="py-1.5 pr-1"
															data-testid={`table-cell-datatype-${fileIdx}-${index}`}
														>
															<div className="flex items-center justify-center gap-1">
																<TooltipProvider>
																	<Tooltip>
																		<TooltipTrigger
																			asChild
																		>
																			<span
																				className={
																					!rowEditableStateList[
																						fileIdx
																					]?.[
																						index
																					]
																						? "opacity-50"
																						: ""
																				}
																				data-testid={`column-datatype-${fileIdx}-${index}`}
																			>
																				<DataTypeIcon
																					type={
																						columnMetadataList[
																							fileIdx
																						]?.[
																							column
																						]
																							?.dataType ||
																						"STRING"
																					}
																					className="size-3.5"
																				/>
																			</span>
																		</TooltipTrigger>
																		<TooltipContent>
																			{columnMetadataList[
																				fileIdx
																			]?.[
																				column
																			]
																				?.dataType ||
																				"STRING"}
																		</TooltipContent>
																	</Tooltip>
																</TooltipProvider>
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() =>
																		handleOpenModal(
																			fileIdx,
																			column,
																		)
																	}
																	disabled={
																		!rowEditableStateList[
																			fileIdx
																		]?.[
																			index
																		]
																	}
																	data-testid={`edit-button-${fileIdx}-${index}`}
																	className="size-7"
																>
																	<Edit className="size-3.5" />
																</Button>
															</div>
														</TableCell>
														<TableCell
															className="w-9 py-1.5 pr-2 pl-0"
															data-testid={`table-cell-toggle-${fileIdx}-${index}`}
														>
															<Button
																variant="ghost"
																size="icon"
																onClick={() =>
																	toggleRowEditState(
																		fileIdx,
																		index,
																	)
																}
																data-testid={`toggle-button-${fileIdx}-${index}`}
																className="size-7"
															>
																{rowEditableStateList[
																	fileIdx
																]?.[index] ? (
																	<X
																		className="size-3.5 text-destructive"
																		data-testid={`toggle-icon-close-${fileIdx}-${index}`}
																	/>
																) : (
																	<Plus
																		className="size-3.5 text-primary"
																		data-testid={`toggle-icon-add-${fileIdx}-${index}`}
																	/>
																)}
															</Button>
														</TableCell>
													</TableRow>
												),
											)}
										</TableBody>
									</Table>
								</div>
							</CollapsibleContent>
						</Collapsible>
					</div>
				</div>
			))}

			{/* Footer */}
			<div className="mt-3 mb-6 flex justify-between gap-4">
				<Button
					variant="outline"
					onClick={onCancel}
					data-testid="back-button"
				>
					Back
				</Button>
				<Button
					variant="default"
					onClick={handleImport}
					disabled={isAnyTableNameInvalid}
					data-testid="import-button"
				>
					Import
				</Button>
			</div>

			{/* Modal */}
			{selectedFileIndex !== null && (
				<ColumnEditModal
					open={openModal}
					onClose={() => setOpenModal(false)}
					selectedColumn={selectedColumn}
					columnMetadata={columnMetadataList[selectedFileIndex]}
					setColumnMetadata={(updated) =>
						setColumnMetadataList((prev) => {
							const clone = [...prev];
							clone[selectedFileIndex] =
								typeof updated === "function"
									? updated(clone[selectedFileIndex])
									: updated;
							return clone;
						})
					}
				/>
			)}
		</div>
	);
};

export default DataSelection;
