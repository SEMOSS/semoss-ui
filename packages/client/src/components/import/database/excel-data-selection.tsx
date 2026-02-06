/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
import {
	ChevronDown,
	ChevronUp,
	Edit,
	FileSpreadsheet,
	Plus,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	Field,
	FieldLabel,
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
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import ColumnEditModal from "./column-edit-modal";

interface ParsedResult {
	headers: string[];
	dataTypes: Record<string, string>;
	cleanHeaders: string[];
}
interface ExcelDataSelectionProps {
	files: ParsedResult[];
	fileName: string[];
	onImport: (payload: Record<string, unknown>[]) => void;
	onCancel: () => void;
}

interface ColumnMetadata {
	alias?: string;
	dataType?: string;
	format?: string;
	description?: string;
	logicalName?: string[];
}

const ExcelDataSelection = ({
	files,
	fileName,
	onImport,
	onCancel,
}: ExcelDataSelectionProps) => {
	const [tableStates, setTableStates] = useState<
		Record<
			string,
			{
				rowEditableState: Record<number, boolean>;
				columnMetadata: Record<string, ColumnMetadata>;
				collapseAll: boolean;
				cleanHeaders?: string[];
				dataTypes?: Record<string, string>;
				tableName?: string;
			}
		>
	>({});

	const [openModal, setOpenModal] = useState(false);
	const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
	const [selectedSheetKey, setSelectedSheetKey] = useState<string | null>(
		null,
	);
	const [selectedRangeOption, setSelectedRangeOption] = useState<
		Record<string, "actual" | "custom">
	>({});
	const [customRangeValues, setCustomRangeValues] = useState<
		Record<string, string>
	>({});
	const [editedRanges, setEditedRanges] = useState<Record<string, string>>(
		{},
	);

	const { monolithStore } = useRootStore();

	const handlePreviewRange = async (
		filePath: string,
		sheetKey: string,
		sheetName: string,
		customRangeValues: string,
	) => {
		setEditedRanges((prev) => ({
			...prev,
			[sheetKey]: customRangeValues,
		}));
		setSelectedRangeOption((prev) => ({
			...prev,
			[sheetKey]: "actual",
		}));

		try {
			const pixelExpression = `META|PredictExcelRangeMetadata(filePath=["${filePath}"], sheetName=["${sheetName}"], sheetRange=["${customRangeValues}"]);`;
			const response = await monolithStore.runQuery(pixelExpression);

			const result: ParsedResult = response.pixelReturn[0]
				.output as ParsedResult;

			if (!result?.cleanHeaders || !result?.dataTypes) {
				return;
			}

			const newColumnMetadata = Object.fromEntries(
				result.cleanHeaders.map((header: string) => [
					header,
					{
						alias: header,
						dataType: result.dataTypes?.[header] || "STRING",
						format: "",
						description: "",
						logicalName: [],
					},
				]),
			);

			const newRowEditableState = Object.fromEntries(
				result.cleanHeaders.map((_: string, index: number) => [
					index,
					true,
				]),
			);
			setTableStates((prev) => ({
				...prev,
				[sheetKey]: {
					rowEditableState: newRowEditableState,
					columnMetadata: newColumnMetadata,
					collapseAll: true,
					cleanHeaders: result.cleanHeaders,
					dataTypes: result.dataTypes,
				},
			}));
		} catch (err) {
			console.error("Error fetching range metadata:", err);
		}
	};

	// Setter for column metadata
	const setColumnMetadata = (
		updater: (
			prev: Record<string, ColumnMetadata>,
		) => Record<string, ColumnMetadata>,
	) => {
		if (!selectedSheetKey) return;
		setTableStates((prev) => ({
			...prev,
			[selectedSheetKey]: {
				...prev[selectedSheetKey],
				columnMetadata: updater(prev[selectedSheetKey].columnMetadata),
			},
		}));
	};

	useEffect(() => {
		const newTableStates: typeof tableStates = {};
		files.forEach((file, fileIndex) => {
			const sheetNames = Object.keys(file || {});
			sheetNames.forEach((sheetName) => {
				const range = Object.keys(file[sheetName])[0];
				const parsedData =
					tableStates[`${fileIndex}-${sheetName}`]?.cleanHeaders &&
					tableStates[`${fileIndex}-${sheetName}`]?.dataTypes
						? {
								cleanHeaders:
									tableStates[`${fileIndex}-${sheetName}`]
										.cleanHeaders!,
								dataTypes:
									tableStates[`${fileIndex}-${sheetName}`]
										.dataTypes!,
							}
						: file[sheetName][range];
				if (!parsedData) return;

				newTableStates[`${fileIndex}-${sheetName}`] = {
					rowEditableState: Object.fromEntries(
						parsedData.cleanHeaders.map((_, index) => [
							index,
							true,
						]),
					),
					columnMetadata: Object.fromEntries(
						parsedData.cleanHeaders.map((header) => [
							header,
							{
								alias: header,
								dataType:
									parsedData.dataTypes?.[header] || "String",
								format: "",
								description: "",
								logicalName: [],
							},
						]),
					),
					collapseAll: true,
					cleanHeaders: parsedData.cleanHeaders,
					dataTypes: parsedData.dataTypes || {},
					tableName: sheetName,
				};
			});
		});
		setTableStates(newTableStates);
	}, [files]);

	const toggleRowEditState = (sheetKey: string, index: number) => {
		setTableStates((prev) => ({
			...prev,
			[sheetKey]: {
				...prev[sheetKey],
				rowEditableState: {
					...prev[sheetKey].rowEditableState,
					[index]: !prev[sheetKey].rowEditableState[index],
				},
			},
		}));
	};

	const handleOpenModal = (sheetKey: string, column: string) => {
		setSelectedSheetKey(sheetKey);
		setSelectedColumn(column);
		setOpenModal(true);
	};

	const handleNameChange = (
		sheetKey: string,
		column: string,
		newValue: string,
	) => {
		setTableStates((prev) => ({
			...prev,
			[sheetKey]: {
				...prev[sheetKey],
				columnMetadata: {
					...prev[sheetKey].columnMetadata,
					[column]: {
						...prev[sheetKey].columnMetadata[column],
						alias: newValue,
					},
				},
			},
		}));
	};

	const handleTableNameChange = (sheetKey: string, newValue: string) => {
		setTableStates((prev) => ({
			...prev,
			[sheetKey]: {
				...prev[sheetKey],
				tableName: newValue,
			},
		}));
	};

	const toggleCollapse = (sheetKey: string) => {
		setTableStates((prev) => ({
			...prev,
			[sheetKey]: {
				...prev[sheetKey],
				collapseAll: !prev[sheetKey].collapseAll,
			},
		}));
	};

	const handleSelectAllToggle = (sheetKey: string) => {
		const areAllSelected = Object.values(
			tableStates[sheetKey].rowEditableState,
		).every((row) => row);
		const newState = Object.fromEntries(
			Object.keys(tableStates[sheetKey].rowEditableState).map((key) => [
				Number(key),
				!areAllSelected,
			]),
		);
		setTableStates((prev) => ({
			...prev,
			[sheetKey]: { ...prev[sheetKey], rowEditableState: newState },
		}));
	};

	// Checks if range2 is smaller than range1
	function isSmallerRange(actualRange: string, typedRange: string): boolean {
		const parseRange = (range: string) => {
			const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i.exec(range);
			if (!match) return null;
			const [, startCol, startRow, endCol, endRow] = match;
			return {
				startCol: startCol.toUpperCase(),
				endCol: endCol.toUpperCase(),
				startRow: parseInt(startRow, 10),
				endRow: parseInt(endRow, 10),
			};
		};

		const actual = parseRange(actualRange);
		const typed = parseRange(typedRange);

		if (!actual || !typed) return false;

		// Convert column letters to numbers for comparison
		const colToNumber = (col: string) => {
			let num = 0;
			for (let i = 0; i < col.length; i++) {
				num = num * 26 + (col.charCodeAt(i) - 64);
			}
			return num;
		};

		const actualStartColNum = colToNumber(actual.startCol);
		const actualEndColNum = colToNumber(actual.endCol);
		const typedStartColNum = colToNumber(typed.startCol);
		const typedEndColNum = colToNumber(typed.endCol);

		// Check for inverted range
		if (
			typedStartColNum > typedEndColNum ||
			typed.startRow > typed.endRow
		) {
			return false;
		}

		// Check if typed range is fully inside actual range
		const isInside =
			typedStartColNum >= actualStartColNum &&
			typedEndColNum <= actualEndColNum &&
			typed.startRow >= actual.startRow &&
			typed.endRow <= actual.endRow;

		return isInside;
	}

	const handleImport = () => {
		const payloadArray = files.map((file, fileIndex) => {
			const dataTypeMap: Record<
				string,
				Record<string, Record<string, string>>
			> = {};
			const newHeaders: Record<
				string,
				Record<string, Record<string, string>>
			> = {};
			const additionalDataTypes: Record<
				string,
				Record<string, Record<string, string>>
			> = {};
			const descriptionMap: Record<
				string,
				Record<string, Record<string, string>>
			> = {};
			const logicalNamesMap: Record<
				string,
				Record<string, Record<string, string[]>>
			> = {};

			const tables: Record<string, Record<string, string>> = {};

			const sheetNames = Object.keys(file || {});
			sheetNames.forEach((sheetName) => {
				const range = Object.keys(file[sheetName])[0];
				const sheetKey = `${fileIndex}-${sheetName}`;
				const parsedData = file[sheetName][range];
				const state = tableStates[sheetKey];
				if (!parsedData || !state) return;

				const editedRange = editedRanges[sheetKey] ?? range;
				const tableName = state.tableName?.trim() || sheetName;

				tables[sheetName] = { [editedRange]: tableName };

				dataTypeMap[sheetName] = { [editedRange]: {} };
				newHeaders[sheetName] = {};
				additionalDataTypes[sheetName] = { [editedRange]: {} };

				descriptionMap[sheetName] = { [editedRange]: {} };
				logicalNamesMap[sheetName] = { [editedRange]: {} };

				state.cleanHeaders?.forEach((header, index) => {
					if (!state.rowEditableState[index]) return;
					const alias = state.columnMetadata[header]?.alias || header;

					dataTypeMap[sheetName][editedRange][alias] =
						state.columnMetadata[header]?.dataType || "STRING";

					if (alias !== header) {
						if (!newHeaders[sheetName][editedRange])
							newHeaders[sheetName][editedRange] = {};
						newHeaders[sheetName][editedRange][alias] = header;
					}

					if (state.columnMetadata[header]?.format) {
						additionalDataTypes[sheetName][editedRange][alias] =
							state.columnMetadata[header]?.format!;
					}

					if (state.columnMetadata[header]?.description) {
						descriptionMap[sheetName][editedRange][alias] =
							state.columnMetadata[header]?.description!;
					}

					if (
						Array.isArray(
							state.columnMetadata[header]?.logicalName,
						) &&
						state.columnMetadata[header]!.logicalName!.length > 0
					) {
						logicalNamesMap[sheetName][editedRange][alias] =
							state.columnMetadata[header]!.logicalName!;
					}
				});
			});

			return {
				filePath: [fileName[fileIndex]],
				dataTypeMap,
				newHeaders,
				additionalDataTypes,
				descriptionMap: [descriptionMap],
				logicalNamesMap: [logicalNamesMap],
				tables: [tables],
				existing: fileIndex > 0 ? true : false,
			};
		});

		onImport(payloadArray);
	};

	return (
		<TooltipProvider>
			<div>
				{files.map((file, fileIndex) => (
					<div key={fileName[fileIndex]}>
						{/* Header Section */}
						<div className="mb-2 flex w-full items-center justify-between">
							<div className="flex flex-row items-center gap-2">
								<FileSpreadsheet className="size-6 text-primary" />
								<P className="pl-1 text-foreground">
									{fileName[fileIndex]}
								</P>
							</div>
						</div>

						{Object.keys(file || {}).map((sheetName) => {
							const range = Object.keys(file[sheetName])[0];
							const sheetKey = `${fileIndex}-${sheetName}`;
							const state = tableStates[sheetKey];

							// Use updated data from state if available
							const parsedData =
								state?.cleanHeaders && state?.dataTypes
									? {
											cleanHeaders: state.cleanHeaders,
											dataTypes: state.dataTypes,
										}
									: file[sheetName][range];

							if (!state || !parsedData) return null;

							const currentValue =
								editedRanges[sheetKey] ?? range;
							const optionValue =
								selectedRangeOption[sheetKey] ??
								(currentValue === range ? "actual" : "custom");
							const customValue =
								customRangeValues[sheetKey] ?? currentValue;

							const isValidFormat =
								/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i.test(
									customValue,
								);
							const isSameRange =
								customValue.toUpperCase() ===
								range.toUpperCase();
							const showError =
								optionValue === "custom" &&
								(!isValidFormat ||
									(!isSmallerRange(range, customValue) &&
										!isSameRange));

							const errorText = !isValidFormat
								? "Invalid format. Use A1:H51 style."
								: isSameRange
									? "Range must differ from the actual range."
									: !isSmallerRange(range, customValue)
										? `Range must be smaller than the actual range. Actual range: ${range}.`
										: "";

							const userTyped = customValue.trim().length > 0;
							const isSmaller =
								isValidFormat &&
								isSmallerRange(range, customValue);
							const enablePreview =
								userTyped &&
								isValidFormat &&
								(isSameRange || isSmaller);

							return (
								<div
									key={sheetKey}
									className="mt-0 mb-4 overflow-hidden rounded-md border border-border bg-card"
								>
									{/* Summary Header */}
									<div
										className="flex cursor-pointer flex-row items-center justify-between rounded-t-md bg-secondary p-4"
										onClick={() => toggleCollapse(sheetKey)}
										data-testid={`sheet-header-${sheetKey}`}
									>
										<P className="font-medium text-base text-foreground">
											Sheet Name: {sheetName}
										</P>
										{state.collapseAll ? (
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

									<Collapsible open={state.collapseAll}>
										<CollapsibleContent>
											<div>
												{/* Table Name Section */}
												<div className="flex items-center justify-between p-4">
													<div className="flex flex-row items-center gap-2">
														<P className="whitespace-nowrap font-medium text-base text-foreground">
															Table Name:
														</P>
														<Input
															value={
																state.tableName ??
																sheetName
															}
															onChange={(e) =>
																handleTableNameChange(
																	sheetKey,
																	e.target
																		.value,
																)
															}
															className="w-[220px]"
															data-testid="table-name-input"
														/>
													</div>

													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															handleSelectAllToggle(
																sheetKey,
															)
														}
														className="font-semibold capitalize"
														data-testid="select-all-button"
													>
														{Object.values(
															state.rowEditableState,
														).every((v) => v)
															? "Unselect All"
															: "Select All"}
													</Button>
												</div>

												{/* Range Selection Section */}
												<div className="px-4 pb-4">
													<div className="flex flex-col gap-2">
														<Field>
															<FieldLabel
																htmlFor={`${sheetKey}-range-select`}
															>
																Select Range
															</FieldLabel>
															<Select
																value={
																	optionValue
																}
																onValueChange={(
																	value,
																) => {
																	if (
																		value ===
																		"custom"
																	) {
																		setSelectedRangeOption(
																			(
																				prev,
																			) => ({
																				...prev,
																				[sheetKey]:
																					"custom",
																			}),
																		);
																		setCustomRangeValues(
																			(
																				prev,
																			) => ({
																				...prev,
																				[sheetKey]:
																					"",
																			}),
																		);
																	} else {
																		setSelectedRangeOption(
																			(
																				prev,
																			) => ({
																				...prev,
																				[sheetKey]:
																					"actual",
																			}),
																		);
																		setEditedRanges(
																			(
																				prev,
																			) => ({
																				...prev,
																				[sheetKey]:
																					range,
																			}),
																		);
																		setCustomRangeValues(
																			(
																				prev,
																			) => ({
																				...prev,
																				[sheetKey]:
																					"",
																			}),
																		);
																		handlePreviewRange(
																			fileName[
																				fileIndex
																			],
																			sheetKey,
																			sheetName,
																			range,
																		);
																	}
																}}
															>
																<SelectTrigger
																	id={`${sheetKey}-range-select`}
																	className="w-full"
																	data-testid={`range-select-${sheetKey}`}
																>
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="actual">
																		{editedRanges[
																			sheetKey
																		] ||
																			range}
																	</SelectItem>
																	<SelectItem value="custom">
																		Custom
																		Range
																	</SelectItem>
																</SelectContent>
															</Select>
														</Field>

														{/* Custom Range Input */}
														{optionValue ===
															"custom" && (
															<div className="mt-2 flex flex-col gap-2">
																<P className="font-medium text-base text-foreground">
																	Custom Range
																</P>
																<div className="flex flex-row items-center gap-2">
																	<Input
																		value={
																			customValue
																		}
																		onChange={(
																			e,
																		) =>
																			setCustomRangeValues(
																				(
																					prev,
																				) => ({
																					...prev,
																					[sheetKey]:
																						e.target.value
																							.toUpperCase()
																							.replace(
																								/\s+/g,
																								"",
																							),
																				}),
																			)
																		}
																		placeholder="Enter range (e.g. A1:G20)"
																		className={
																			showError
																				? "border-destructive focus-visible:ring-destructive"
																				: ""
																		}
																		data-testid={`custom-range-input-${sheetKey}`}
																	/>

																	{!enablePreview ? (
																		<Tooltip>
																			<TooltipTrigger
																				asChild
																			>
																				<span>
																					<Button
																						variant="outline"
																						disabled
																						data-testid={`preview-button-disabled-${sheetKey}`}
																					>
																						Preview
																					</Button>
																				</span>
																			</TooltipTrigger>
																			<TooltipContent>
																				<P className="text-sm">
																					{!isValidFormat
																						? "Invalid format (e.g. A1:H51)"
																						: "Range must be smaller or equal to the actual range"}
																				</P>
																			</TooltipContent>
																		</Tooltip>
																	) : (
																		<Button
																			variant="outline"
																			onClick={() =>
																				handlePreviewRange(
																					fileName[
																						fileIndex
																					],
																					sheetKey,
																					sheetName,
																					customValue,
																				)
																			}
																			data-testid={`preview-button-${sheetKey}`}
																		>
																			Preview
																		</Button>
																	)}
																</div>

																{showError && (
																	<P className="text-destructive text-xs">
																		{
																			errorText
																		}
																	</P>
																)}
															</div>
														)}
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
																		Data
																		Type
																	</P>
																</TableHead>
																<TableHead className="w-[7%]" />
																<TableHead className="w-[7%]" />
															</TableRow>
														</TableHeader>

														<TableBody>
															{state.cleanHeaders?.map(
																(
																	column,
																	index,
																) => (
																	<TableRow
																		key={
																			column
																		}
																		data-testid={`column-row-${column}-${index}`}
																	>
																		{/* Name */}
																		<TableCell className="py-2 pr-6 pl-4">
																			<Input
																				value={
																					state
																						.columnMetadata[
																						column
																					]
																						?.alias ??
																					column
																				}
																				onChange={(
																					e,
																				) =>
																					handleNameChange(
																						sheetKey,
																						column,
																						e
																							.target
																							.value,
																					)
																				}
																				disabled={
																					!state
																						.rowEditableState[
																						index
																					]
																				}
																				className={
																					!state
																						.rowEditableState[
																						index
																					]
																						? "border-dashed"
																						: ""
																				}
																				data-testid={`column-name-input-${column}-${index}`}
																			/>
																		</TableCell>

																		{/* Data Type */}
																		<TableCell className="py-2 pr-6 pl-4">
																			<P
																				className={`text-sm ${
																					!state
																						.rowEditableState[
																						index
																					]
																						? "text-muted-foreground"
																						: "text-foreground"
																				}`}
																				data-testid={`column-datatype-${column}-${index}`}
																			>
																				{state
																					.columnMetadata[
																					column
																				]
																					?.dataType ||
																					"STRING"}
																			</P>
																		</TableCell>

																		{/* Edit */}
																		<TableCell className="py-2 pr-6 pl-4">
																			<Button
																				variant="ghost"
																				size="icon"
																				onClick={() =>
																					handleOpenModal(
																						sheetKey,
																						column,
																					)
																				}
																				disabled={
																					!state
																						.rowEditableState[
																						index
																					]
																				}
																				data-testid={`edit-button-${column}-${index}`}
																			>
																				<Edit className="size-4" />
																			</Button>
																		</TableCell>

																		{/* Toggle */}
																		<TableCell className="py-2 pr-6 pl-4">
																			<Button
																				variant="ghost"
																				size="icon"
																				onClick={() =>
																					toggleRowEditState(
																						sheetKey,
																						index,
																					)
																				}
																				data-testid={`toggle-editable-button-${column}-${index}`}
																			>
																				{state
																					.rowEditableState[
																					index
																				] ? (
																					<X className="size-4 text-destructive" />
																				) : (
																					<Plus className="size-4 text-primary" />
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
							);
						})}
					</div>
				))}

				{/* Footer */}
				<div className="mt-4 mb-6 flex justify-between gap-4">
					<Button
						variant="outline"
						onClick={onCancel}
						data-testid="excel-cancel-button"
					>
						Back
					</Button>
					<Button
						variant="default"
						onClick={handleImport}
						data-testid="excel-import-button"
					>
						Import
					</Button>
				</div>

				{/* Modal */}
				<ColumnEditModal
					open={openModal}
					onClose={() => setOpenModal(false)}
					selectedColumn={selectedColumn}
					columnMetadata={
						selectedSheetKey
							? (tableStates[selectedSheetKey]?.columnMetadata ??
								{})
							: {}
					}
					setColumnMetadata={setColumnMetadata}
				/>
			</div>
		</TooltipProvider>
	);
};

export default ExcelDataSelection;
