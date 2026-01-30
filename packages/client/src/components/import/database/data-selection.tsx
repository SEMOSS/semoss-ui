/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
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
import { useEffect, useState } from "react";
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
				existing: fileIdx > 0 ? true : false,
			};
		});

		onImport(tables);
	};

	const isAnyTableNameInvalid = tableNames.some((name) => !name?.trim());

	return (
		<>
			{files.map((parsedData, fileIdx) => (
				<div key={fileName[fileIdx]} className="mb-4">
					{/* Header Section */}
					<div className="mb-2 flex w-full items-center justify-between">
						<div className="flex flex-row items-center gap-2">
							<FileSpreadsheet className="size-6 text-primary" />
							<P className="pl-1 text-foreground">
								{fileName[fileIdx]}
							</P>
						</div>
						<Button
							variant="outline"
							size="default"
							data-testid="collapse-button"
							onClick={() =>
								setCollapseAll((prev) =>
									prev.map((v, i) =>
										i === fileIdx ? !v : v,
									),
								)
							}
							className="min-w-40 gap-2 rounded px-6 py-2 font-semibold capitalize"
						>
							{collapseAll[fileIdx] ? (
								<>
									<FoldVertical className="size-4" />
									Collapse All
								</>
							) : (
								<>
									<UnfoldVertical className="size-4" />
									Expand All
								</>
							)}
						</Button>
					</div>

					{/* Body Section */}
					<div className="mt-0 overflow-hidden rounded-md border border-border bg-card">
						{/* Summary Header */}
						<div
							className="flex cursor-pointer flex-row items-center justify-between rounded-t-md bg-secondary p-4"
							onClick={() =>
								setCollapseAll((prev) =>
									prev.map((v, i) =>
										i === fileIdx ? !v : v,
									),
								)
							}
						>
							<P className="font-medium text-base text-foreground">
								Sheet Name: {fileName[fileIdx]}
							</P>
							{collapseAll[fileIdx] ? (
								<ChevronUp
									className="size-5 transition-transform duration-300"
									data-testid="expand-icon"
								/>
							) : (
								<ChevronDown
									className="size-5 transition-transform duration-300"
									data-testid="expand-icon"
								/>
							)}
						</div>

						<Collapsible open={collapseAll[fileIdx]}>
							<CollapsibleContent>
								<div>
									{/* Table Name Input Section */}
									<div className="flex items-center justify-between p-4">
										<div className="flex flex-row items-start gap-1.5">
											<P className="relative top-3.5 whitespace-nowrap text-base text-foreground">
												Table Name:
											</P>
											<Field className="flex-1">
												<Input
													placeholder="Enter table name"
													value={
														tableNames[fileIdx] ||
														""
													}
													onChange={(e) =>
														handleTableNameChange(
															fileIdx,
															e.target.value,
														)
													}
													data-testid="table-name-input"
													className={
														!tableNames[
															fileIdx
														]?.trim()
															? "border-destructive focus-visible:ring-destructive"
															: ""
													}
												/>
												{!tableNames[
													fileIdx
												]?.trim() && (
													<FieldDescription className="mt-0.5 text-destructive">
														Enter a valid table name
													</FieldDescription>
												)}
											</Field>
										</div>
									</div>

									{/* Table Section */}
									<div className="max-h-[400px] overflow-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="w-[66%]">
														<P className="font-semibold text-foreground text-sm">
															Name
														</P>
													</TableHead>
													<TableHead className="w-[20%]">
														<P className="font-semibold text-foreground text-sm">
															Data Type
														</P>
													</TableHead>
													<TableHead className="w-[7%]" />
													<TableHead className="w-[7%]" />
												</TableRow>
											</TableHeader>

											<TableBody>
												{parsedData.cleanHeaders.map(
													(column, index) => (
														<TableRow
															key={column}
															data-testid={`table-row-${fileIdx}-${index}`}
														>
															{/* Name */}
															<TableCell
																className="py-2 pr-6 pl-4"
																data-testid={`table-cell-name-${fileIdx}-${index}`}
															>
																<Input
																	value={
																		columnMetadataList[
																			fileIdx
																		]?.[
																			column
																		]
																			?.alias ??
																		column
																	}
																	onChange={(
																		e,
																	) =>
																		handleNameChange(
																			fileIdx,
																			index,
																			e
																				.target
																				.value,
																		)
																	}
																	disabled={
																		!rowEditableStateList[
																			fileIdx
																		]?.[
																			index
																		]
																	}
																	data-testid={`column-name-input-${fileIdx}-${index}`}
																	className={
																		!rowEditableStateList[
																			fileIdx
																		]?.[
																			index
																		]
																			? "border-dashed"
																			: ""
																	}
																/>
															</TableCell>

															{/* Data Type */}
															<TableCell
																className="py-2 pr-6 pl-4"
																data-testid={`table-cell-datatype-${fileIdx}-${index}`}
															>
																<P
																	className={`text-sm ${
																		!rowEditableStateList[
																			fileIdx
																		]?.[
																			index
																		]
																			? "text-muted-foreground"
																			: "text-foreground"
																	}`}
																	data-testid={`column-datatype-${fileIdx}-${index}`}
																>
																	{columnMetadataList[
																		fileIdx
																	]?.[column]
																		?.dataType ||
																		"STRING"}
																</P>
															</TableCell>

															{/* Edit */}
															<TableCell
																className="py-2 pr-6 pl-4"
																data-testid={`table-cell-edit-${fileIdx}-${index}`}
															>
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
																>
																	<Edit className="size-4" />
																</Button>
															</TableCell>

															{/* Toggle */}
															<TableCell
																className="py-2 pr-6 pl-4"
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
																>
																	{rowEditableStateList[
																		fileIdx
																	]?.[
																		index
																	] ? (
																		<X
																			className="size-4 text-destructive"
																			data-testid={`toggle-icon-close-${fileIdx}-${index}`}
																		/>
																	) : (
																		<Plus
																			className="size-4 text-primary"
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
								</div>
							</CollapsibleContent>
						</Collapsible>
					</div>
				</div>
			))}

			{/* Footer */}
			<div className="mt-4 mb-6 flex justify-between gap-4">
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
		</>
	);
};

export default DataSelection;
