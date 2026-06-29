import { ChevronDown, Info, Plus, X } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Droppable } from "react-beautiful-dnd";
import {
	type BlockDef,
	type EchartVisualizationBlockDef,
	getValueByPath,
	useBlocksPixel,
	useFrameHeaders,
} from "@semoss/renderer";
import { Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { VisualMap } from "../../VisualMap";
import { VisualMapConstant } from "../../VisualMapConstant";

const AGGREGATE_OPTIONS = {
	NUMBER: [
		"Average",
		"Sum",
		"Count",
		"Unique Count",
		"Minimum",
		"Maximum",
		"Median",
	],
	STRING_DATE: ["Count", "Unique Count"],
};

interface ChartColumnOption {
	name: string;
	label: string;
	values?: string[];
	selectors?: string[];
	dataType?: string[];
	multiLabel?: boolean;
	aggregate?: boolean;
}

interface SelectedColumnEntry {
	values: string[];
	dataType: string[];
}

type SelectedColumnsMap = Record<string, SelectedColumnEntry>;

type DropColumnsMap = Record<string, SelectedColumnEntry>;

interface DataTabStylingProps {
	id: string;
	updateFrame: (option: unknown) => void;
	path: string;
	dragdropColumns: DropColumnsMap;
	deleteColumns: (column: string) => void;
	formmattedColumns: (
		columns: ChartColumnOption[],
		variation: string,
	) => void;
	isAdd: (value: boolean, id: string) => void;
	syncHeader: (value: string, frameChanged: boolean) => void;
	chart: ChartColumnOption[];
	storedColumns: ChartColumnOption[];
	visual: (value: boolean) => void;
	selectedItem: (item: unknown) => void;
}

//data tab right section of the echart visualization block
export const DataTabStyling = observer(
	<_D extends BlockDef = BlockDef>({
		id,
		// biome-ignore lint/correctness/noUnusedFunctionParameters: required by interface
		updateFrame,
		path,
		dragdropColumns,
		deleteColumns,
		formmattedColumns,
		isAdd,
		syncHeader,
		chart,
		storedColumns,
		visual,
		selectedItem,
	}: DataTabStylingProps) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [selectedColumns, setSelectedColumns] =
			useState<SelectedColumnsMap>(() => {
				const initialColumns: SelectedColumnsMap = {};
				storedColumns.forEach(
					(item: ChartColumnOption, index: number) => {
						if (item.values && item.values.length > 0) {
							initialColumns[`data-tab-drop-area-${index}`] = {
								values: item.values,
								dataType: item.dataType as string[],
							};
						}
					},
				);
				return initialColumns;
			});
		const [checkedInstruction, setCheckedInstruction] = useState(false);
		const [checkedVisual, setCheckedVisual] = useState(false);
		const [isAddIcon, setIsAddIcon] = useState(false);
		const getFrames = useBlocksPixel<string[]>("GetFrames();", {
			data: [],
		});
		const options = getFrames.status === "SUCCESS" ? getFrames.data : [];
		const [initialVisual, setInitialVisual] = useState(false);
		const [aggregateMenuAnchorEl, setAggregateMenuAnchorEl] =
			useState<HTMLElement | null>(null);
		const [aggregateOptions, setAggregateOptions] = useState<string[]>([]);
		const [aggregateFilterInput, setAggregateFilterInput] = useState("");
		const [tempAggClickData, setTempAggClickData] = useState({
			chartIndex: -1,
			columnIndex: -1,
		});
		const frameHeaders = useFrameHeaders(data.frame?.name);
		const columnsSelector = useMemo(() => {
			return frameHeaders.data.list.map((item) => ({
				name: item.alias,
				selector: item.header,
				width: undefined,
				dataType: item.dataType,
			}));
		}, [frameHeaders]);

		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) return "";
				const v = getValueByPath(data, path);
				if (typeof v === "undefined") return "";
				else if (typeof v === "string") return v;
				return JSON.stringify(v, null, 2);
			});
		}, [data, path]).get();

		const matchedVisualMap = getMatchingVisualMapRow(data);

		type VisualMapEntry = {
			icon: React.ReactNode;
			name: string;
			label: string;
			title?: string;
		};
		function getMatchingVisualMapRow(inputData: { variation?: string }) {
			const matchingRow: Partial<
				Record<keyof typeof VisualMapConstant, VisualMapEntry>
			> = {};

			(
				Object.keys(VisualMapConstant) as Array<
					keyof typeof VisualMapConstant
				>
			).forEach((category) => {
				const items = VisualMapConstant[category];
				const foundItem = items.find(
					(item) =>
						("title" in item &&
							String(item.title) ===
								String(inputData.variation)) ||
						String(item.name) === String(inputData.variation),
				);
				// const foundItem = items.find(
				// 	(item) => String(item?.title) === String(inputData.variation),
				// );
				if (foundItem) {
					matchingRow[category] = foundItem;
				}
			});

			return matchingRow;
		}

		const handleSelectedItem = (item: unknown) => {
			selectedItem(item);
			setSelectedColumns({});
			storedColumns.length = 0;
			// biome-ignore lint/suspicious/useIterableCallbackReturn: echart callback
			Object.keys(dragdropColumns).forEach(
				(key) => delete dragdropColumns[key],
			);
		};

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const updatedColumns = { ...selectedColumns };
			storedColumns.forEach((item: ChartColumnOption, index: number) => {
				const key = `data-tab-drop-area-${index}`;
				if (item.values && item.values.length > 0) {
					updatedColumns[key] = {
						values: item.values,
						dataType: item.dataType as string[],
					};
				}
			});
			if (
				Object.keys(updatedColumns).length > 0 &&
				JSON.stringify(updatedColumns) !==
					JSON.stringify(selectedColumns)
			) {
				setSelectedColumns({ ...updatedColumns });
			}
		}, [JSON.stringify(storedColumns)]);

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const updatedColumns = { ...selectedColumns, ...dragdropColumns };
			chart.forEach((item: ChartColumnOption, index: number) => {
				const key = `data-tab-drop-area-${index}`;
				if (
					!item.multiLabel &&
					updatedColumns[key]?.values?.length > 1
				) {
					updatedColumns[key] = {
						values: [updatedColumns[key]?.values[0]],
						dataType: [updatedColumns[key]?.dataType[0]],
					};
				} else if (item.multiLabel && updatedColumns[key]?.values) {
					const uniqueValues = Array.from(
						new Set(updatedColumns[key].values),
					);
					updatedColumns[key] = {
						...updatedColumns[key],
						values: uniqueValues,
					};
				}
			});
			if (Object.keys(updatedColumns).length > 0) {
				setSelectedColumns({ ...updatedColumns });
			}
		}, [dragdropColumns]);

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (!columnsSelector || columnsSelector.length === 0) return;
			const parsedValue = JSON.parse(computedValue) as {
				customSettings?: {
					columnDetails?: Record<
						string,
						{ name?: string | string[] }
					>;
				};
				xAxis?: { pixelname?: string[] };
				yAxis?: { pixelname?: string[] };
				_state?: {
					fields?: Record<string, string[] | string | undefined>;
				};
				[label: string]: unknown;
			};
			const formattedArray = chart.map((item: ChartColumnOption) => {
				let value: string[] = [];
				if (data.variation === "echart-bar-graph") {
					const axisValue = parsedValue[item.label] as
						| { pixelname?: string[] }
						| undefined;
					value = axisValue?.pixelname ?? [];
				} else if (data.variation === "echart-gantt-chart") {
					const detailValue =
						parsedValue.customSettings?.columnDetails?.[item.label]
							?.name;
					value = detailValue
						? Array.isArray(detailValue)
							? detailValue
							: [detailValue]
						: [];
				} else {
					const fieldValue = parsedValue._state?.fields?.[item.label];
					value = fieldValue
						? Array.isArray(fieldValue)
							? fieldValue
							: [fieldValue]
						: [];
				}
				const selectorsList: string[] = [];
				const dataTypeList: string[] = [];
				value.forEach((col: string) => {
					const selector = columnsSelector.find(
						(column) => column.name === col,
					);
					if (selector) {
						selectorsList.push(selector.selector);
						dataTypeList.push(selector.dataType);
					}
				});
				return {
					name: item.name,
					label: item.label,
					values: value,
					selectors: selectorsList,
					dataType: dataTypeList,
				};
			});
			formmattedColumns(formattedArray, data.variation ?? "");
		}, [columnsSelector.length]);

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (!columnsSelector || columnsSelector.length === 0) return;
			const formattedArray = chart.map(
				(item: ChartColumnOption, index: number) => {
					const key = `data-tab-drop-area-${index}`;
					const value = selectedColumns[key]?.values ?? [];
					const selectorsList: string[] = [];
					const dataTypeList: string[] = [];
					value.forEach((col: string, colIndex: number) => {
						const selector = columnsSelector.find(
							(column) => column.name === col,
						);
						if (selector) {
							selectorsList.push(selector.selector);
							dataTypeList.push(
								selectedColumns[key]?.dataType?.[colIndex] ??
									selector.dataType,
							);
						}
					});
					return {
						name: item.name,
						label: item.label,
						values: selectedColumns[key]?.values ?? [],
						selectors: selectorsList || [],
						dataType: dataTypeList || [],
					};
				},
			);
			formmattedColumns(formattedArray, data.variation ?? "");
		}, [selectedColumns, columnsSelector.length]);

		const handleChangeVisual = (value: boolean) => {
			visual(!value);
			setInitialVisual(!value);
		};

		const handleCloseVisual = () => {
			setInitialVisual(false);
		};

		const onAggregateChange = (selectedAggregate: string) => {
			const key = `data-tab-drop-area-${tempAggClickData.chartIndex}`;
			const targetDataType = [...(selectedColumns[key]?.dataType ?? [])];
			if (targetDataType.length > 0) {
				targetDataType[tempAggClickData.columnIndex] =
					selectedAggregate;
				setSelectedColumns({
					...selectedColumns,
					[key]: {
						...selectedColumns[key],
						dataType: targetDataType,
					},
				});
			}
		};

		const handleAggregateClick = (
			column: string,
			chartIndex: number,
			columnIndex: number,
		) => {
			const isNumberType =
				columnsSelector.find((col) => col.name === column)?.dataType ===
				"NUMBER";
			setAggregateOptions(
				isNumberType
					? AGGREGATE_OPTIONS.NUMBER
					: AGGREGATE_OPTIONS.STRING_DATE,
			);
			setTempAggClickData({ chartIndex, columnIndex });
		};

		// biome-ignore lint/complexity/noUselessLoneBlockStatements: intentional block
		{
			/* Get matched visual label for display */
		}
		const matchedItem = Object.values(matchedVisualMap)[0] as
			| { icon: React.ReactNode; label: string }
			| undefined;

		return (
			<div className="mt-px h-full w-full">
				<span className="relative pl-4 text-[#808080] text-sm">
					Selected Frame
				</span>
				<div className="mt-1 flex w-full justify-center p-2">
					<select
						className="w-full rounded border px-2 py-1 text-sm"
						disabled={getFrames.status !== "SUCCESS"}
						value={data.frame?.name ?? ""}
						onChange={(e) => {
							setData("frame.name", e.target.value);
							setSelectedColumns({});
							syncHeader(e.target.value, true);
							setData("columns", []);
						}}
					>
						<option value="">Select frame</option>
						{options.map((opt) => (
							<option key={opt} value={opt}>
								{opt}
							</option>
						))}
					</select>
				</div>
				<span className="relative pl-4 text-[#808080] text-sm">
					Selected Visual
				</span>
				<button
					type="button"
					className="mt-1 flex w-full cursor-pointer justify-center p-2"
					onClick={() => handleChangeVisual(initialVisual)}
				>
					<div className="flex w-full items-center gap-2 rounded border px-2 py-1 text-sm">
						{matchedItem && (
							<>
								{matchedItem.icon}
								<span>{matchedItem.label}</span>
							</>
						)}
						{!matchedItem && (
							<span className="text-muted-foreground">
								Select visual
							</span>
						)}
					</div>
				</button>
				{/* Visual selector popover */}
				{initialVisual && (
					<div className="fixed inset-0 z-50 flex items-start justify-start pt-[14vh] pl-[51vw]">
						<button
							type="button"
							className="fixed inset-0 bg-transparent"
							onClick={handleCloseVisual}
							aria-label="Close visual selector"
						/>
						<div className="relative z-10 rounded border bg-background shadow-lg">
							<VisualMap
								selectedItem={handleSelectedItem}
								handleClose={handleCloseVisual}
							/>
						</div>
					</div>
				)}
				{/* Drag and Drop Input Fields */}
				{chart.map((item, index) => (
					<div key={`chart-field-${item.name}`} className="mt-2">
						<div className="flex w-full">
							<span className="relative pl-4 text-sm">
								Select {item.name}
							</span>
							<Info className="mt-1 ml-2 h-4 w-4 cursor-pointer text-[#888]" />
						</div>
						<Droppable droppableId={`data-tab-drop-area-${index}`}>
							{(provided) => (
								<div
									ref={provided.innerRef}
									{...provided.droppableProps}
									className="mt-2 ml-3 flex min-h-[50px] w-[95%] items-center justify-center rounded-[10px] border border-[#ccc] border-dashed p-2"
								>
									<span
										className="text-left text-[#aaa] text-sm"
										style={{
											paddingRight: !item.multiLabel
												? "28%"
												: "46%",
										}}
									>
										{item.multiLabel
											? "Drag/add one or more dimensions"
											: "Drag one dimension"}
									</span>
									{item.multiLabel && (
										<Plus
											className="ml-2 h-4 w-4 cursor-pointer text-[#888]"
											onClick={() => {
												isAdd(
													!isAddIcon,
													`data-tab-drop-area-${index}`,
												);
												setIsAddIcon(!isAddIcon);
											}}
										/>
									)}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
						{Object.entries(selectedColumns)
							.filter(
								([key]) =>
									key === `data-tab-drop-area-${index}`,
							)
							.map(([key, columns]) =>
								(columns.values ?? []).map(
									(column: string, colIndex: number) => {
										const refId = `${column + colIndex + index}`;
										const aggregatedColumnName = (
											col: string,
										) => {
											if (!item.aggregate) return col;
											const dataType =
												columns.dataType?.[colIndex];
											if (!dataType) return col;
											if (dataType === "NUMBER")
												return `Average of ${col}`;
											if (dataType === "STRING")
												return `Count of ${col}`;
											return `${dataType} of ${col}`;
										};
										return (
											<div
												key={column}
												id={refId}
												className="mx-3 mt-2 flex items-center justify-between rounded-[34px] bg-[#f0f0f0] px-4 py-2 text-sm"
											>
												<span>
													{aggregatedColumnName(
														column,
													).length > 20 ? (
														<span
															className="cursor-pointer"
															title={aggregatedColumnName(
																column,
															)}
														>
															{aggregatedColumnName(
																column,
															).slice(0, 12) +
																"..."}
														</span>
													) : (
														aggregatedColumnName(
															column,
														)
													)}
												</span>
												<div className="flex items-center gap-1">
													{item.aggregate && (
														<ChevronDown
															className="h-4 w-4 cursor-pointer text-[#888]"
															onClick={() => {
																setAggregateMenuAnchorEl(
																	document.getElementById(
																		refId,
																	),
																);
																handleAggregateClick(
																	column,
																	index,
																	colIndex,
																);
															}}
														/>
													)}
													<X
														className="h-4 w-4 cursor-pointer text-[#888]"
														onClick={() => {
															const updatedColumns =
																{
																	...selectedColumns,
																};
															const filtered =
																updatedColumns[
																	key
																]?.values?.filter(
																	(
																		_: string,
																		i: number,
																	) =>
																		i !==
																		colIndex,
																);
															if (
																filtered?.length ===
																0
															) {
																delete updatedColumns[
																	key
																];
															} else {
																updatedColumns[
																	key
																] = {
																	...updatedColumns[
																		key
																	],
																	values: filtered,
																};
															}
															setSelectedColumns(
																updatedColumns,
															);
															deleteColumns(
																column,
															);
														}}
													/>
												</div>
											</div>
										);
									},
								),
							)}
					</div>
				))}
				<div className="mt-4 ml-2 flex w-full items-center gap-2">
					<Switch
						checked={checkedInstruction}
						onCheckedChange={(checked: boolean) =>
							setCheckedInstruction(checked)
						}
					/>
					<span className="relative mt-1 text-[#808080] text-sm">
						Show All Instruction
					</span>
				</div>
				<div className="mt-4 ml-2 flex w-full items-center gap-2">
					<Switch
						checked={checkedVisual}
						onCheckedChange={(checked: boolean) =>
							setCheckedVisual(checked)
						}
					/>
					<span className="relative mt-1 text-[#808080] text-sm">
						Auto Visualize
					</span>
				</div>
				{/* Aggregate dropdown */}
				{aggregateMenuAnchorEl && (
					<div
						className="fixed z-50"
						style={{
							top: aggregateMenuAnchorEl.getBoundingClientRect()
								.bottom,
							left: aggregateMenuAnchorEl.getBoundingClientRect()
								.left,
							width: aggregateMenuAnchorEl.offsetWidth,
						}}
					>
						<button
							type="button"
							className="fixed inset-0 bg-transparent"
							onClick={() => {
								setAggregateFilterInput("");
								setAggregateMenuAnchorEl(null);
							}}
							aria-label="Close aggregate menu"
						/>
						<div className="relative z-10 rounded border bg-background p-2 shadow-lg">
							<input
								className="mb-1 w-full border-b px-2 py-1 text-sm"
								placeholder="Search"
								value={aggregateFilterInput}
								onChange={(e) =>
									setAggregateFilterInput(e.target.value)
								}
							/>
							<div>
								{(aggregateFilterInput
									? aggregateOptions.filter((item) =>
											item
												.toLowerCase()
												.includes(
													aggregateFilterInput.toLowerCase(),
												),
										)
									: aggregateOptions
								).map((key) => (
									// biome-ignore lint/a11y/useButtonType: handled by caller
									<button
										key={key}
										className="w-full px-2 py-1 text-left text-sm hover:bg-muted"
										onClick={() => {
											let k = key;
											if (k === "Maximum") k = "Max";
											if (k === "Minimum") k = "Min";
											setAggregateMenuAnchorEl(null);
											setAggregateFilterInput("");
											onAggregateChange(k);
										}}
									>
										{key}
									</button>
								))}
							</div>
						</div>
					</div>
				)}
			</div>
		);
	},
);
