import { ChevronDown, Search } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { createElement, useEffect, useMemo, useRef, useState } from "react";
import {
	DragDropContext,
	Draggable,
	Droppable,
	type DropResult,
} from "react-beautiful-dnd";
import {
	type BlockDef,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type PathValue,
	useFrameHeaders,
} from "@semoss/renderer";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import NumberIcon from "../../../../../../../assets/block-settings/img/NumberIcon.svg";
import StringIcon from "../../../../../../../assets/block-settings/img/StringIcon.svg";
import { buildListener } from "../../../../block-settings/block-defaults.shared";
import { DataTabStyling } from "./bar-chart/DataTabStyling";
import type { StoredColumn, VisualMapItem } from "./shared/shared-interfaces";

// Chart configuration item
interface ChartConfigItem {
	name: string;
	label: string;
	values?: string[];
	selectors?: string[];
	dataType?: string[];
	multiLabel?: boolean;
	aggregate?: boolean;
}

// Column with selector information
interface ColumnWithSelector {
	name: string;
	selector: string;
	width?: number;
}

// State item for dendrogram
interface DendrogramStateItem {
	name: string;
	selector: string;
	value?: number;
	isFacet?: boolean;
}

// Column item for operations
interface ColumnItem {
	name: string;
	selector: string;
	width: undefined;
	dataType: string;
}

//frame operations component props structure
export interface FrameOperationsProps {
	id: string;
	updateFrame: (option: unknown) => void;
	path: string;
	chart: ChartConfigItem[];
	storedColumns: StoredColumn[];
	handleStoreData: (data: StoredColumn[]) => void;
	selectedItem: (item: VisualMapItem) => void;
}

const COLOUR_PALATTE_DATA = [
	"#5470c6",
	"#91cc75",
	"#fac858",
	"#ee6666",
	"#73c0de",
	"#3ba272",
	"#fc8452",
	"#9a60b4",
	"#ea7ccc",
];

interface AccordionSection {
	[key: string]: {
		expanded: boolean;
		title: string;
	};
}

// Define the type for droppedColumns
interface DroppedColumns {
	[key: string]: {
		values: string[];
		dataType: string[];
	};
}

type ColumnType = {
	name: string;
	selector: string;
	width: undefined;
	dataType: string;
};

//data tab left section to show the data tab and the drag area for the selected columns
export const FrameOperations = observer(
	<_D extends BlockDef = BlockDef>({
		id,
		updateFrame,
		path,
		chart,
		storedColumns,
		handleStoreData,
		selectedItem,
	}: FrameOperationsProps) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [_columnsData, setColumnsData] = useState<ColumnType[]>([]);
		const [search, setSearch] = useState("");
		const [isAdd, setIsAdd] = useState(false);
		const [addedColumnName, setAddedColumnName] = useState("");
		const [droppedColumns, setDroppedColumns] = useState<
			// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
			Record<string, any>
		>({});
		// biome-ignore lint/suspicious/noExplicitAny: temp store for chart columns with dynamic fields
		const [selectedColumn, setSelectedColumn] = useState<any[]>([]);
		const [accordionSection, setAccordionSection] = useState<
			AccordionSection[]
		>([
			{
				preProcess: {
					expanded: true,
					title: "PRE PROCESS",
				},
			},
		]);
		const accordionList = ["preProcess"];
		const [_value, setValue] = useState("");
		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
		const [filteredColumns, setFilteredColumns] = useState<ColumnType[]>(
			[],
		);
		const frameHeaders = useFrameHeaders(data.frame?.name);
		const columnsSelector = useMemo(() => {
			return frameHeaders.data.list.map((item) => {
				return {
					name: item.alias,
					selector: item.header,
					width: undefined,
					dataType: item.dataType,
				};
			});
		}, [frameHeaders]);
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const filteredColumnsString = JSON.stringify(filteredColumns);
			const columnsSelectorString = JSON.stringify(columnsSelector);
			if (
				columnsSelector.length > 0 &&
				filteredColumnsString !== columnsSelectorString &&
				!search
			) {
				setFilteredColumns(columnsSelector);
			}
		}, [columnsSelector, search]);
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			setDroppedColumns({});
		}, [data.variation]);

		const handleSearch = (searchValue: string) => {
			setSearch(searchValue); // Update the search state
			const lowerCaseSearch = searchValue.toLowerCase();
			const filtered = columnsSelector.filter((col) =>
				col.name.toLowerCase().includes(lowerCaseSearch),
			);
			setFilteredColumns(filtered); // Update the filtered columns
		};
		//Resets the block data related to fields so the frame change operation removes all data related to old frame
		function resetBlockData() {
			let parsedValue = JSON.parse(computedValue) || {};
			if (data.variation === "echart-bar-graph") {
				parsedValue = {
					...parsedValue,
					xAxis: {
						...parsedValue.xAxis,
						name: [],
						pixelname: [],
						pixelvalue: [],
						pixeldataType: [],
					},
					yAxis: {
						...parsedValue.yAxis,
						name: [],
						pixelname: [],
						pixelvalue: [],
						pixeldataType: [],
					},
				};
			} else if (data.variation === "echart-pie-chart") {
				const { ...mainParsedData } = parsedValue;
				parsedValue = {
					...mainParsedData,
				};
			} else if (data.variation === "echart-gantt-chart") {
				parsedValue = {
					...parsedValue,
					customSettings: {
						columnDetails: {
							task: {
								name: "",
								selector: "",
							},
						},
						columnIndexDetails: {},
					},
				};
			} else if (data.variation === "echart-dendrogram-chart") {
				parsedValue = {
					...parsedValue,
					state: {
						...parsedValue.state,
						dimensions: [],
						facet: [],
					},
				};
			} else if (data.variation === "echart-line-graph") {
				const { _state, ...mainParsedData } = parsedValue;
				parsedValue = {
					...mainParsedData,
				};
			} else if (data.variation === "echart-world-map-chart") {
				parsedValue = {
					...parsedValue,
					state: {
						fields: {},
					},
				};
			} else if (data.variation === "echart-scatter-plots") {
				parsedValue = {
					...parsedValue,
					state: {
						fields: {},
					},
				};
			} else if (data.variation === "echart-stack-chart") {
				parsedValue = {
					...parsedValue,
					state: {
						fields: {},
					},
				};
			} else if (data.variation === "echart-word-cloud") {
				parsedValue = {
					...parsedValue,
					state: {
						fields: {},
					},
				};
			} else {
				//to be used for special case if nothing matches
			}
			//all the stored and dropped columns are resetted to empty
			storedColumns = [];
			setDroppedColumns({});
			try {
				setData("option", parsedValue);
			} catch (e) {
				console.log("error: ", e);
			}
		}
		// biome-ignore lint/suspicious/noExplicitAny: echart event type
		function syncHeaders(value: any, frameChanged: boolean) {
			if (!value) return;
			const columns = frameHeaders.data.list.map((item) => {
				return {
					name: item.alias,
					selector: item.header,
					width: undefined,
					dataType: item.dataType,
				};
			});
			setColumnsData((_prevColumns) => {
				return columns;
			});
			if (frameChanged) {
				storedColumns = [];
				setSelectedColumn([]);
				resetBlockData();
			}
		}
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}
				const v = getValueByPath(data, "option");
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}
				return JSON.stringify(v, null, 2);
			});
		}, [data.option]).get();
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			// Normalize dataType values from saved charts (convert single-letter codes to full aggregate names)
			const normalizeDataType = (dataType: string): string => {
				const typeMap: Record<string, string> = {
					N: "Average",
					S: "Count",
					A: "Average",
					C: "Count",
					NUMBER: "Average",
					STRING: "Count",
				};
				return typeMap[dataType] || dataType;
			};

			let tempStoredColumnsForDropped: StoredColumn[] = [];
			if (data.variation === "echart-bar-graph") {
				const parsedOption = JSON.parse(computedValue) || {};
				if (
					Object.hasOwn(parsedOption, "xAxis") &&
					Object.hasOwn(parsedOption, "yAxis") &&
					Object.hasOwn(parsedOption.xAxis, "pixelname") &&
					Object.hasOwn(parsedOption.yAxis, "pixelname")
				) {
					const dataTypeList: Record<string, string[]> = {};
					["xAxis", "yAxis"].forEach((item) => {
						const pixelDataType = parsedOption[item].pixeldataType;
						if (Array.isArray(pixelDataType)) {
							dataTypeList[item] = pixelDataType.flat();
						} else if (pixelDataType) {
							dataTypeList[item] = [pixelDataType];
						} else {
							dataTypeList[item] = [];
						}
					});
					const tempStoredColumns = chart.map((item) => {
						return {
							name: item.name,
							label: item.label,
							values: parsedOption[item.label].pixelname,
							selectors: parsedOption[item.label].pixelvalue,
							dataType:
								dataTypeList[item.label].map(normalizeDataType),
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((_preVCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-dendrogram-chart") {
				const parsedOption = JSON.parse(computedValue) || {};
				const dataTypeList: Record<string, string[]> = {};
				if (
					Object.hasOwn(parsedOption, "state") &&
					Object.hasOwn(parsedOption.state, "dimensions") &&
					Object.hasOwn(parsedOption.state, "facet")
				) {
					["dimensions", "facet"].forEach((item) => {
						dataTypeList[item] = columnsSelector
							.filter((col) =>
								parsedOption.state[item].some(
									(stateItem: DendrogramStateItem) =>
										stateItem.name === col.name,
								),
							)
							.map((col) => col.dataType);
					});
					const tempStoredColumns = chart.map((item) => {
						return {
							name: item.name,
							label: item.label,
							values: parsedOption.state[item.label].map(
								(val: DendrogramStateItem) => val.name,
							),
							selectors: parsedOption.state[item.label].map(
								(selector: DendrogramStateItem) =>
									selector.selector,
							),
							dataType: dataTypeList[item.label],
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((_preVCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-pie-chart") {
				const parsedOption = JSON.parse(computedValue) || {};
				if (
					Object.hasOwn(parsedOption, "state") &&
					Object.hasOwn(parsedOption.state, "fields") &&
					Object.hasOwn(parsedOption.state.fields, "Label") &&
					Object.hasOwn(parsedOption.state.fields, "Value")
				) {
					const dataTypeList: Record<string, string[]> = {};
					["Label", "Value"].forEach((item) => {
						const dataTypeKey =
							item === "Label"
								? "labelDataType"
								: "valueDataType";
						const pixelDataType =
							parsedOption.state.fields[dataTypeKey];
						if (Array.isArray(pixelDataType)) {
							dataTypeList[item] = pixelDataType.flat();
						} else if (pixelDataType) {
							dataTypeList[item] = [pixelDataType];
						} else {
							dataTypeList[item] = [];
						}
					});
					const tempStoredColumns = chart.map((item) => {
						return {
							name: item.name,
							label: item.label,
							values: parsedOption.state.fields[item.label] || [],
							selectors:
								parsedOption.state.fields[item.label] || [],
							dataType: (dataTypeList[item.label] || []).map(
								normalizeDataType,
							),
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((_preVCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-line-graph") {
				const parsedOption = JSON.parse(computedValue) || {};
				const dataTypeList: Record<string, string[]> = {};
				if (
					Object.hasOwn(parsedOption, "_state") &&
					Object.hasOwn(parsedOption._state, "fields") &&
					Object.hasOwn(parsedOption._state.fields, "xAxis") &&
					Object.hasOwn(parsedOption._state.fields, "yAxis")
				) {
					["xAxis", "yAxis"].forEach((item) => {
						const pixelDataType = parsedOption[item].dataType;
						if (Array.isArray(pixelDataType)) {
							dataTypeList[item] = pixelDataType.flat();
						} else if (pixelDataType) {
							dataTypeList[item] = [pixelDataType];
						} else {
							dataTypeList[item] = [];
						}
					});
					const tempStoredColumns = chart.map((item) => {
						return {
							name: item.name,
							label: item.label,
							values:
								parsedOption._state.fields[item.label] || [],
							selectors:
								parsedOption._state.fields[item.label] || [],
							dataType: (dataTypeList[item.label] || []).map(
								normalizeDataType,
							),
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((_prevSelectedCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-world-map-chart") {
				const parsedJson = JSON.parse(computedValue);
				if (
					Object.hasOwn(parsedJson, "state") &&
					Object.hasOwn(parsedJson.state, "fields") &&
					Object.hasOwn(parsedJson.state.fields, "label") &&
					Object.hasOwn(parsedJson.state.fields, "Latitude") &&
					Object.hasOwn(parsedJson.state.fields, "Longitude")
				) {
					const dataTypeList: Record<string, string[]> = {};
					const selectorList: string[] = [];
					[
						"label",
						"Latitude",
						"Longitude",
						"size",
						"color",
						"tooltip",
					].forEach((item) => {
						const dataTypeKey = `${item}DataType`;
						const rawDataType =
							parsedJson.state.fields[dataTypeKey];
						// Ensure dataType is always an array
						dataTypeList[item] = rawDataType
							? Array.isArray(rawDataType)
								? rawDataType
								: [rawDataType]
							: columnsSelector
									.filter((col) =>
										parsedJson.state.fields[item]?.includes(
											col.name,
										),
									)
									.map((col) => col.dataType);
						selectorList.push(
							columnsSelector.find(
								(col) =>
									col.name === parsedJson.state.fields[item],
							)?.selector || "",
						);
					});
					const tempStoredColumns = chart.map((item, index) => {
						return {
							name: item.name,
							label: item.label,
							values: Object.hasOwn(
								parsedJson.state.fields,
								item.label,
							)
								? Array.isArray(
										parsedJson.state.fields[item.label],
									)
									? parsedJson.state.fields[item.label]
									: [parsedJson.state.fields[item.label]]
								: [],
							// selectors: Array.isArray(selectorList[index])
							// 	? selectorList[index]
							// 	: [selectorList[index]],
							selectors: [selectorList[index]],
							dataType: (dataTypeList[item.label] || []).map(
								normalizeDataType,
							),
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((_prevSelectedCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-scatter-plots") {
				const parsedOption = JSON.parse(computedValue) || {};
				if (
					Object.hasOwn(parsedOption, "state") &&
					Object.hasOwn(parsedOption.state, "fields") &&
					Object.hasOwn(parsedOption.state.fields, "label") &&
					Object.hasOwn(parsedOption.state.fields, "XAxis") &&
					Object.hasOwn(parsedOption.state.fields, "YAxis")
				) {
					const dataTypeList: Record<string, string[]> = {};
					const selectorList: string[] = [];
					[
						"label",
						"XAxis",
						"YAxis",
						"size",
						"color",
						"tooltip",
					].forEach((item) => {
						if (!parsedOption.state.fields[item]) {
							dataTypeList[item] = [];
							return;
						}
						const dataTypeKey = `${item}DataType`;
						const rawDataType =
							parsedOption.state.fields[dataTypeKey];
						// Ensure dataType is always an array
						dataTypeList[item] = rawDataType
							? Array.isArray(rawDataType)
								? rawDataType
								: [rawDataType]
							: columnsSelector
									.filter((col) =>
										parsedOption.state.fields[
											item
										]?.includes(col.name),
									)
									.map((col) => col.dataType);
						selectorList.push(
							columnsSelector.find((col) =>
								parsedOption.state.fields[item]?.includes(
									col.name,
								),
							)?.selector || "",
						);
					});
					const tempStoredColumns = chart.map((item, index) => {
						return {
							name: item.name,
							label: item.label,
							values: parsedOption.state.fields[item.label] || [],
							selectors: selectorList[index]
								? [selectorList[index]]
								: [],
							dataType: (dataTypeList[item.label] || []).map(
								normalizeDataType,
							),
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((_preVCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-stack-chart") {
				const parsedJson = JSON.parse(computedValue);
				if (
					Object.hasOwn(parsedJson, "state") &&
					Object.hasOwn(parsedJson.state, "fields") &&
					Object.hasOwn(parsedJson.state.fields, "XAxis") &&
					Object.hasOwn(parsedJson.state.fields, "YAxis")
				) {
					const dataTypeList: Record<string, string[]> = {};
					const selectorList: string[] = [];
					["XAxis", "YAxis", "category", "tooltip"].forEach(
						(item) => {
							const dataTypeKey = `${item}DataType`;
							const rawDataType =
								parsedJson.state.fields[dataTypeKey];
							// Ensure dataType is always an array
							dataTypeList[item] = rawDataType
								? Array.isArray(rawDataType)
									? rawDataType
									: [rawDataType]
								: columnsSelector
										.filter((col) =>
											parsedJson.state.fields[
												item
											]?.includes(col.name),
										)
										.map((col) => col.dataType);
							selectorList.push(
								columnsSelector.find((col) =>
									parsedJson.state.fields[item]?.includes(
										col.name,
									),
								)?.selector || "",
							);
						},
					);
					const tempStoredColumns = chart.map((item, index) => {
						return {
							name: item.name,
							label: item.label,
							values: parsedJson.state.fields[item.label] || [],
							selectors: selectorList[index]
								? [selectorList[index]]
								: [],
							dataType: (dataTypeList[item.label] || []).map(
								normalizeDataType,
							),
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((_preVCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-gantt-chart") {
				const parsedJson = JSON.parse(computedValue);
				if (
					Object.hasOwn(parsedJson, "customSettings") &&
					Object.hasOwn(parsedJson.customSettings, "columnDetails") &&
					Object.hasOwn(
						parsedJson.customSettings.columnDetails,
						"task",
					) &&
					Object.hasOwn(
						parsedJson.customSettings.columnDetails,
						"startdate",
					) &&
					Object.hasOwn(
						parsedJson.customSettings.columnDetails,
						"enddate",
					)
				) {
					const dataTypeList: Record<string, string[]> = {};
					const selectorList: Record<string, string> = {};
					const valueList: Record<string, string> = {};
					[
						"task",
						"startdate",
						"enddate",
						"taskgroup",
						"tooltip",
						"taskprogress",
						"milestone",
					].forEach((item) => {
						dataTypeList[item] =
							columnsSelector
								.filter(
									(col) =>
										parsedJson.customSettings.columnDetails[
											item
										]?.name === col.name,
								)
								.map((col) => col.dataType) || [];
						selectorList[item] =
							columnsSelector.find(
								(col) =>
									parsedJson.customSettings.columnDetails[
										item
									]?.name === col.name,
							)?.selector || "";
						valueList[item] =
							parsedJson.customSettings.columnDetails[item]
								?.name || [];
					});
					const tempStoredColumns = chart.map((item, _index) => {
						return {
							name: item.name,
							label: item.label,
							// values: Array.isArray(valueList[item.label])
							// 	? valueList[item.label]
							// 	: [valueList[item.label]],
							// selectors: Array.isArray(selectorList[item.label])
							// 	? selectorList[item.label]
							// 	: [selectorList[item.label]],
							values: [valueList[item.label]],
							selectors: [selectorList[item.label]],
							dataType: (dataTypeList[item.label] || []).map(
								normalizeDataType,
							),
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((_preVCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-word-cloud") {
				const parsedOption = JSON.parse(computedValue) || {};
				if (
					Object.hasOwn(parsedOption, "state") &&
					Object.hasOwn(parsedOption.state, "fields") &&
					Object.hasOwn(parsedOption.state.fields, "words") &&
					Object.hasOwn(parsedOption.state.fields, "size")
				) {
					const dataTypeList: Record<string, string[]> = {};
					["words", "size", "tooltip"].forEach((item) => {
						if (parsedOption.state.fields[item]) {
							dataTypeList[item] = columnsSelector
								.filter((col) =>
									parsedOption.state.fields[item]?.includes(
										col.name,
									),
								)
								.map((col) => col.dataType);
						}
					});
					const tempStoredColumns = chart.map((item) => {
						const fieldValues =
							parsedOption.state.fields[item.label] || [];
						return {
							name: item.name,
							label: item.label,
							values: fieldValues,
							selectors: fieldValues,
							dataType: (dataTypeList[item.label] || []).map(
								normalizeDataType,
							),
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((_preVCol) => tempStoredColumns);
				}
			}
			//run the dropped columns update when block is changed
			if (Object.keys(tempStoredColumnsForDropped).length > 0) {
				const dragAndDropColumns = getDraggedColumns(
					tempStoredColumnsForDropped,
					data.variation,
				);
				setDroppedColumns((_preVCol) => dragAndDropColumns);
			}
		}, [data.variation, id]);
		// }, [data.variation, id]);

		//update the local state value when computed value is getting updated
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);
		function getDraggedColumns(
			tempStoredColumns: StoredColumn[],
			_variation: string | undefined,
		) {
			const droppedColumnsList = { ...droppedColumns };

			tempStoredColumns.forEach((item: StoredColumn, index: number) => {
				const key = `data-tab-drop-area-${index}`;
				if (item.values && item.values.length > 0) {
					droppedColumnsList[key] = {
						values: item.values,
						dataType: item.dataType,
					};
				}
			});

			return droppedColumnsList;
		}
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const formattedColumns = (columnsValue: any[], variation: any) => {
			const hasValues = columnsValue.some(
				(item) => item?.values && item?.values.length > 0,
			);
			if (hasValues) {
				setSelectedColumn(columnsValue);
				handleStoreData(columnsValue);
			}

			const columnsDrop = [];
			for (let i = 0; i < columnsValue.length; i++) {
				let tempColumns = null;
				if (Object.hasOwn(columnsValue[i], "values")) {
					tempColumns = columnsValue[i];
					if (Object.hasOwn(columnsValue[i].values, "values")) {
						tempColumns = {
							...columnsValue[i],
							values: columnsValue[i]?.values?.values,
						};
					}
				}
				columnsDrop[i] = tempColumns;
			}

			const firstColumn = columnsDrop[0];
			const secondColumn = columnsDrop[1];
			let fieldsData: Record<string, ColumnItem[]> = {
				[firstColumn?.label]: [],
				[secondColumn?.label]: [],
			};
			let selectedValues: Record<string, string[]> = {
				[firstColumn?.label]: [],
				[secondColumn?.label]: [],
			};

			const columns: Record<string, ColumnItem[]> = { ...fieldsData };

			if (variation === "echart-bar-graph") {
				let tempVal = JSON.parse(computedValue) || {};
				if (firstColumn?.label) {
					columns[firstColumn?.label] = [
						{
							name: firstColumn?.values || "",
							selector: firstColumn.selectors,
							width: undefined,
							dataType: firstColumn.dataType || "",
						},
					];
					fieldsData = {
						...fieldsData,
						[firstColumn?.label]: columns[firstColumn?.label],
					};
					selectedValues = {
						...selectedValues,
						[firstColumn?.label]:
							columns[firstColumn?.label][0].selector,
					};
				}
				if (secondColumn?.label) {
					columns[secondColumn?.label] = [];
					secondColumn.values.forEach(
						(_item: unknown, index: number) => {
							columns[secondColumn?.label].push({
								name: secondColumn.values[index] || "",
								selector: secondColumn.selectors[index],
								width: undefined,
								dataType: secondColumn.dataType || "",
							});
						},
					);
					fieldsData = {
						...fieldsData,
						[secondColumn?.label]: columns[secondColumn?.label],
					};
					let LabelData: string[] = [];
					columns[secondColumn?.label].forEach(
						(labelItem: ColumnItem, _labelIndex: number) => {
							LabelData = [...LabelData, labelItem.selector];
						},
					);
					selectedValues = {
						...selectedValues,
						[secondColumn?.label]: LabelData,
					};
				}

				if (
					columns[firstColumn?.label] &&
					columns[secondColumn?.label]
				) {
					// const _seriesIndex =
					// 	tempVal.series.findIndex((item: any) =>
					// 		BAR_CHART_DATA.JSONVALUE?.includes(item.type),
					// 	) || 0;
					let columnsmerged: ColumnWithSelector[] = [];
					if (columns[firstColumn?.label]?.length) {
						// Extract column name - handle both string and array formats
						const columnName = columns[firstColumn?.label][0]?.name;
						const extractedName = Array.isArray(columnName)
							? columnName[0]
							: columnName;

						tempVal[firstColumn?.label] = {
							...tempVal[firstColumn?.label],
							name: extractedName || [],
							pixelname:
								columns[firstColumn?.label][0]?.name || [],
							pixelvalue:
								columns[firstColumn?.label][0]?.selector || [],
							pixeldataType:
								columns[firstColumn?.label][0]?.dataType || [],
						};
					} else {
						tempVal.xAxis = {
							...tempVal.xAxis,
							name: [],
							pixelname: [],
							pixelvalue: [],
							pixeldataType: [],
						};
					}

					columnsmerged = [
						{
							name: columns[firstColumn?.label][0]?.name || "",
							selector:
								columns[firstColumn?.label][0]?.selector[0] ||
								"",
						},
					];
					const pixelName: string[] = [];
					const pixelValue: string[] = [];
					const pixeldataType: string[] = [];
					const axisName: string[] = [];
					columns[secondColumn?.label].forEach(
						(columItem: ColumnItem, _columIndex: number) => {
							pixelName.push(columItem?.name);
							axisName.push(columItem?.name);
							pixelValue.push(columItem?.selector);
							pixeldataType.push(columItem?.dataType);
							columnsmerged.push({
								name: columItem?.name,
								selector: columItem?.selector,
							});
						},
					);
					if (columns[secondColumn?.label]?.length) {
						// For Y-axis, extract first series name as string (not array)
						const firstSeriesName = axisName[0] || pixelName[0];
						const extractedYName = Array.isArray(firstSeriesName)
							? firstSeriesName[0]
							: firstSeriesName;

						tempVal[secondColumn?.label] = {
							...tempVal[secondColumn?.label],
							name: extractedYName || pixelName[0],
							pixelname: pixelName,
							pixelvalue: pixelValue,
							pixeldataType: pixeldataType,
						};
					} else {
						tempVal = {
							...tempVal,
							yAxis: {
								...tempVal.yAxis,
								name: "",
								pixelname: [],
								pixelvalue: [],
								pixeldataType: [],
							},
						};
					}
					for (
						let i = 0;
						i < columns[secondColumn?.label]?.length;
						i++
					) {
						const existingSeries = tempVal.series[i] || {};
						// Don't preserve trendline-specific properties for data series
						const { _toggleTrendLineObject, ...baseSeriesProps } =
							existingSeries;

						tempVal.series[i] = {
							...baseSeriesProps,
							data: [],
							name: columns[secondColumn?.label][i]?.name,
							type: "bar",
							barWidth: 5,
							itemStyle: {
								color:
									tempVal.color[i] ?? COLOUR_PALATTE_DATA[i],
							},
						};
					}
					tempVal = {
						...tempVal,
						customSettings: {
							...tempVal.customSettings,
							toolsUpdated: false,
						},
					};
					setData("option", tempVal);
					setData("columns", columnsmerged);
				}
			}
			if (variation === "echart-pie-chart") {
				const tempValue = JSON.parse(computedValue);

				tempValue.state = {};
				tempValue.state.fields = {};

				tempValue.state.fields = {
					...tempValue.state.fields,
					Value: secondColumn?.values || [],
					valueDataType: secondColumn?.dataType || [],
					Label: firstColumn?.values || [],
					labelDataType: firstColumn?.dataType || [],
				};
				setValue(JSON.stringify(tempValue));
				setData("option", tempValue);
			}
			if (variation === "echart-scatter-plots") {
				const tempValue = JSON.parse(computedValue);

				tempValue.state =
					tempValue.state && Object.keys(tempValue.state).length > 0
						? tempValue.state
						: {};
				if (firstColumn?.values) {
					tempValue.state.fields = {
						...tempValue.state.fields,
						label: firstColumn?.values,
						labelDataType: firstColumn?.dataType,
					};
					tempValue.series[0].label.name = firstColumn?.values;
				}
				if (secondColumn?.values) {
					tempValue.state.fields = {
						...tempValue.state.fields,
						XAxis: secondColumn?.values,
						XAxisDataType: secondColumn?.dataType,
					};
					tempValue.xAxis.name = secondColumn?.values;
					tempValue.xAxis.pixelName = secondColumn?.values;
				}
				if (columnsDrop[2]?.values.length > 0) {
					tempValue.state.fields = {
						...tempValue.state.fields,
						YAxis: columnsDrop[2]?.values,
						YAxisDataType: columnsDrop[2]?.dataType,
					};

					tempValue.yAxis.name = columnsDrop[2]?.values;
					tempValue.yAxis.pixelName = columnsDrop[2]?.values;
				}
				if (columnsDrop[3]?.values.length > 0) {
					tempValue.state.fields = {
						...tempValue.state.fields,
						size: columnsDrop[3]?.values,
						sizeDataType: columnsDrop[3]?.dataType,
					};
				}
				if (columnsDrop[4]?.values.length > 0) {
					tempValue.state.fields = {
						...tempValue.state.fields,
						color: columnsDrop[4]?.values,
						colorDataType: columnsDrop[4]?.dataType,
					};
				}
				if (columnsDrop[5]?.values.length > 0) {
					tempValue.state.fields = {
						...tempValue.state.fields,
						tooltip: columnsDrop[5]?.values,
						tooltipDataType: columnsDrop[5]?.dataType,
					};
				}
				setValue(JSON.stringify(tempValue));
				setData("option", tempValue);
			}
			if (variation === "echart-stack-chart") {
				const tempValue = JSON.parse(computedValue);
				if (firstColumn?.values) {
					tempValue.state =
						tempValue.state &&
						Object.keys(tempValue.state).length > 0
							? tempValue.state
							: {};
					tempValue.state.fields = {
						...tempValue.state.fields,
						XAxis: firstColumn?.values,
						XAxisDataType: firstColumn?.dataType,
					};

					tempValue.xAxis.name = firstColumn?.values;
					tempValue.xAxis.pixelName = firstColumn?.values;
					tempValue.xAxis.flipAxisName = firstColumn?.values;
					tempValue.xAxis.axisName = firstColumn?.values;
				}
				if (secondColumn?.values) {
					tempValue.state =
						tempValue.state &&
						Object.keys(tempValue.state).length > 0
							? tempValue.state
							: {};
					tempValue.state.fields = {
						...tempValue.state.fields,
						YAxis: secondColumn?.values,
						YAxisDataType: secondColumn?.dataType,
					};

					tempValue.yAxis.name = secondColumn?.values;
					tempValue.yAxis.pixelName = secondColumn?.values;
					tempValue.yAxis.flipAxisName = secondColumn?.values;
					tempValue.yAxis.axisName = secondColumn?.values;
				}
				if (columnsDrop[2]?.values.length > 0) {
					tempValue.state =
						tempValue.state &&
						Object.keys(tempValue.state).length > 0
							? tempValue.state
							: {};
					tempValue.state.fields = {
						...tempValue.state.fields,
						category: columnsDrop[2]?.values,
						categoryDataType: columnsDrop[2]?.dataType,
					};
				}
				if (columnsDrop[3]?.values.length > 0) {
					tempValue.state =
						tempValue.state &&
						Object.keys(tempValue.state).length > 0
							? tempValue.state
							: {};
					tempValue.state.fields = {
						...tempValue.state.fields,
						tooltip: columnsDrop[3]?.values,
						tooltipDataType: columnsDrop[3]?.dataType,
					};
				}
				setValue(JSON.stringify(tempValue));
				setData("option", tempValue);
			}
			if (
				variation === "echart-line-graph" &&
				firstColumn !== null &&
				secondColumn !== null
			) {
				const tempValue = JSON.parse(computedValue);
				const hasXAxisValues = (firstColumn?.values?.length ?? 0) > 0;
				const hasYAxisValues = (secondColumn?.values?.length ?? 0) > 0;
				tempValue.xAxis = {
					...tempValue.xAxis,
					name: firstColumn?.values?.[0] || "",
					dataType: firstColumn?.dataType,
					data: hasXAxisValues ? tempValue.xAxis?.data || [] : [],
				};
				tempValue.yAxis = {
					...tempValue.yAxis,
					name: secondColumn?.values?.[0] || "",
					dataType: secondColumn?.dataType,
				};

				tempValue._state = tempValue._state || {};
				tempValue._state.fields = {};
				let tempSeries = tempValue.series || [];
				tempValue._state.fields = {
					...tempValue._state.fields,
					xAxis: firstColumn?.values || [],
					xAxisDataType: firstColumn?.dataType || [],
					yAxis: secondColumn?.values || [],
					yAxisDataType: secondColumn?.dataType || [],
					tooltip: columnsDrop[2]?.values
						? columnsDrop[2]?.values
						: [],
				};
				if (!hasXAxisValues || !hasYAxisValues) {
					tempSeries = [];
				} else {
					const seriesListToAdd = [];
					for (let i = 0; i < secondColumn.values.length; i++) {
						seriesListToAdd[i] = {
							...tempSeries[i],
							name: secondColumn.values[i],
							dataType: secondColumn.dataType[i],
							type: "line",
							data: [],
							lineStyle: {
								...tempSeries[i]?.lineStyle,
								type: tempSeries[i]?.lineStyle?.type ?? "solid",
								width: tempSeries[i]?.lineStyle?.width ?? 1,
							},
							label: {
								...tempSeries[i]?.label,
								show: tempSeries[i]?.label?.show ?? true,
								position:
									tempSeries[i]?.label?.position ?? "top",
								rotate: tempSeries[i]?.label?.rotate ?? 45,
								fontSize: tempSeries[i]?.label?.fontSize ?? 12,
								color: tempSeries[i]?.label?.color ?? "#000000",
							},
						};
					}
					tempSeries = seriesListToAdd;
				}
				tempValue.series = tempSeries;
				setValue(JSON.stringify(tempValue));
				setData("option", tempValue);
			}
			if (variation === "echart-world-map-chart") {
				const tempValue = JSON.parse(computedValue);
				if (firstColumn?.values) {
					tempValue.state =
						tempValue.state &&
						Object.keys(tempValue.state).length > 0
							? tempValue.state
							: {};
					tempValue.series[0].label.name = firstColumn?.values;

					tempValue.state.fields = {
						...tempValue.state.fields,
						label: firstColumn?.values?.[0],
						labelDataType: firstColumn?.dataType?.[0],
					};
				}
				if (secondColumn?.values) {
					tempValue.state =
						tempValue.state &&
						Object.keys(tempValue.state).length > 0
							? tempValue.state
							: {};
					tempValue.state.fields = {
						...tempValue.state.fields,
						Latitude: secondColumn?.values?.[0],
						LatitudeDataType: secondColumn?.dataType?.[0],
					};
				}
				if (columnsDrop[2]?.values.length > 0) {
					tempValue.state =
						tempValue.state &&
						Object.keys(tempValue.state).length > 0
							? tempValue.state
							: {};
					tempValue.state.fields = {
						...tempValue.state.fields,
						Longitude: columnsDrop[2]?.values?.[0],
						LongitudeDataType: columnsDrop[2]?.dataType?.[0],
					};
				}
				if (columnsDrop[3]?.values.length > 0) {
					tempValue.state =
						tempValue.state &&
						Object.keys(tempValue.state).length > 0
							? tempValue.state
							: {};
					tempValue.state.fields = {
						...tempValue.state.fields,
						size: columnsDrop[3]?.values?.[0],
						sizeDataType: columnsDrop[3]?.dataType?.[0],
					};
				}
				if (columnsDrop[4]?.values.length > 0) {
					tempValue.state =
						tempValue.state &&
						Object.keys(tempValue.state).length > 0
							? tempValue.state
							: {};
					tempValue.state.fields = {
						...tempValue.state.fields,
						color: columnsDrop[4]?.values?.[0],
						colorDataType: columnsDrop[4]?.dataType?.[0],
					};
				}
				if (columnsDrop[5]?.values.length > 0) {
					tempValue.state =
						tempValue.state &&
						Object.keys(tempValue.state).length > 0
							? tempValue.state
							: {};
					tempValue.state.fields = {
						...tempValue.state.fields,
						tooltip: columnsDrop[5]?.values?.[0],
						tooltipDataType: columnsDrop[5]?.dataType?.[0],
					};
				}
				setValue(JSON.stringify(tempValue));
				setData("option", tempValue);
			}
			if (variation === "echart-gantt-chart") {
				let columnsToSet: (string | string[])[] = [];
				const columnsObject: Record<string, string[]> = {
					tooltip: [],
				};
				const formattedArray: ColumnWithSelector[] = [];
				const tempValue = JSON.parse(computedValue);

				for (let i = 0; i < columnsValue.length; i++) {
					if (columnsValue[i]?.values.length === 1) {
						if (
							formattedArray.some(
								(item) =>
									item.name === columnsValue[i]?.values?.[0],
							)
						)
							continue;
						formattedArray.push({
							name: columnsValue[i]?.values?.[0] || "",
							selector: columnsValue[i]?.selectors?.[0] || "",
							width: columnsValue[i]?.width?.[0] || undefined,
						});
					} else {
						for (
							let j = 0;
							j < columnsValue[i]?.values.length;
							j++
						) {
							if (
								formattedArray.some(
									(item) =>
										item.name ===
										columnsValue[i]?.values?.[j],
								)
							)
								continue;
							formattedArray.push({
								name: columnsValue[i]?.values?.[j] || "",
								selector: columnsValue[i]?.selectors?.[j] || "",
								width: columnsValue[i]?.width?.[j] || undefined,
							});
						}
					}
				}
				if (firstColumn?.values) {
					columnsToSet.push(firstColumn?.values);
					columnsObject.task = firstColumn?.values;

					tempValue.customSettings =
						tempValue.customSettings &&
						Object.keys(tempValue.customSettings).length > 0
							? tempValue.customSettings
							: {};

					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[firstColumn?.label]: {
							name: firstColumn?.values?.[0],
							selector: firstColumn?.selectors?.[0],
						},
					};
				} else {
					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[firstColumn?.label]: {
							name: "",
							selector: "",
						},
					};
				}
				if (secondColumn?.values) {
					columnsToSet.push(secondColumn?.values);
					columnsObject.startdate = secondColumn?.values;

					tempValue.customSettings =
						tempValue.customSettings &&
						Object.keys(tempValue.customSettings).length > 0
							? tempValue.customSettings
							: {};

					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[secondColumn?.label]: {
							name: secondColumn?.values?.[0],
							selector: secondColumn?.selectors?.[0],
						},
					};
				} else {
					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[secondColumn?.label]: {
							name: "",
							selector: "",
						},
					};
				}
				if (columnsDrop[2]?.values.length > 0) {
					columnsToSet.push(columnsDrop[2]?.values);
					columnsObject.enddate = columnsDrop[2]?.values;

					tempValue.customSettings =
						tempValue.customSettings &&
						Object.keys(tempValue.customSettings).length > 0
							? tempValue.customSettings
							: {};

					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[columnsDrop[2]?.label]: {
							name: columnsDrop[2]?.values?.[0],
							selector: columnsDrop[2]?.selectors?.[0],
						},
					};
				} else {
					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[columnsDrop[2]?.label]: {
							name: "",
							selector: "",
						},
					};
				}
				if (columnsDrop[3]?.values.length > 0) {
					columnsToSet.push(columnsDrop[3]?.values);
					columnsObject.taskgroup = columnsDrop[3]?.values;

					tempValue.customSettings =
						tempValue.customSettings &&
						Object.keys(tempValue.customSettings).length > 0
							? tempValue.customSettings
							: {};

					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[columnsDrop[3]?.label]: {
							name: columnsDrop[3]?.values?.[0],
							selector: columnsDrop[3]?.selectors?.[0],
						},
					};
				} else {
					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[columnsDrop[3]?.label]: {
							name: "",
							selector: "",
						},
					};
				}
				if (columnsDrop[4]?.values.length > 0) {
					columnsToSet.push(columnsDrop[4]?.values);
					columnsObject.taskprogress = columnsDrop[4]?.values;

					tempValue.customSettings =
						tempValue.customSettings &&
						Object.keys(tempValue.customSettings).length > 0
							? tempValue.customSettings
							: {};

					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[columnsDrop[4]?.label]: {
							name: columnsDrop[4]?.values?.[0],
							selector: columnsDrop[4]?.selectors?.[0],
						},
					};
				} else {
					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[columnsDrop[4]?.label]: {
							name: "",
							selector: "",
						},
					};
				}
				if (columnsDrop[5]?.values.length > 0) {
					columnsToSet.push(columnsDrop[5]?.values);
					columnsObject.milestone = columnsDrop[5]?.values;

					tempValue.customSettings =
						tempValue.customSettings &&
						Object.keys(tempValue.customSettings).length > 0
							? tempValue.customSettings
							: {};

					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[columnsDrop[5]?.label]: {
							name: columnsDrop[5]?.values?.[0],
							selector: columnsDrop[5]?.selectors?.[0],
						},
					};
				} else {
					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[columnsDrop[5]?.label]: {
							name: "",
							selector: "",
						},
					};
				}
				if (columnsDrop[6]?.values.length > 0) {
					if (Array.isArray(columnsDrop[6]?.values)) {
						columnsToSet = [
							...columnsToSet,
							// biome-ignore lint/correctness/noUnsafeOptionalChaining: guarded at runtime
							...columnsDrop[6]?.values,
						];
					} else {
						columnsToSet.push(columnsDrop[6]?.values);
					}
					columnsObject.tooltip = Array.isArray(
						columnsDrop[6]?.values,
					)
						? columnsDrop[6]?.values
						: [columnsDrop[6]?.values];

					tempValue.customSettings =
						tempValue.customSettings &&
						Object.keys(tempValue.customSettings).length > 0
							? tempValue.customSettings
							: {};

					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[columnsDrop[6]?.label]: {
							name: columnsDrop[6]?.values,
							selector: columnsDrop[6]?.selectors,
						},
					};
				} else {
					tempValue.customSettings.columnDetails = {
						...tempValue.customSettings.columnDetails,
						[columnsDrop[6]?.label]: {
							name: "",
							selector: "",
						},
					};
				}
				setValue(JSON.stringify(tempValue));
				setData("option", tempValue);

				const tempDataSet = new Set(columnsToSet);
				columnsToSet = Array.from(tempDataSet);
				const { tooltip, ...columnsObj } = columnsObject;
				const columnsIndexToSet = getColumnIndexToSetData(
					columnsObj,
					columnsToSet,
				);
				const tooltipIndexToSet = tooltip.reduce(
					(acc: number[], item: string) => {
						columnsToSet.forEach((colSetItem, colSetIndex) => {
							if (colSetItem?.includes(item)) {
								// biome-ignore lint/performance/noAccumulatingSpread: small array
								acc = [...acc, colSetIndex];
							}
						});
						return acc;
					},
					[],
				);

				if (columnsIndexToSet) {
					tempValue.customSettings.columnIndexDetails = {
						...tempValue.customSettings.columnIndexDetails,
						...columnsIndexToSet,
						...{ tooltip: tooltipIndexToSet },
					};

					setValue(JSON.stringify(tempValue));
					setData("option", tempValue);
				}
				setData("columns", formattedArray);
			}
			if (variation === "echart-word-cloud") {
				const fieldsData: Record<string, string[]> = {};
				const parsedJson = JSON.parse(computedValue) || {};
				if (!parsedJson.state) {
					parsedJson.state = { fields: {} };
				}
				if (!parsedJson.state.fields) {
					parsedJson.state.fields = {};
				}
				columnsValue.forEach((column: StoredColumn, _index: number) => {
					if (column?.values?.values?.length > 0) {
						const columnValues = column.values;
						fieldsData[column.label] = columnValues;
					} else {
						fieldsData[column.label] = [];
					}
				});
				parsedJson.state.fields = {
					...parsedJson.state.fields,
					...fieldsData,
				};

				setValue(JSON.stringify(parsedJson));
				setData("option", parsedJson);
			}
			if (variation === "echart-dendrogram-chart") {
				let columnsToPush: DendrogramStateItem[] = [];
				let dimensionElement = columnsValue.find(
					(element) => element.label === "dimensions",
				);
				let facetElement = columnsValue.find(
					(element) => element.label === "facet",
				);
				// Ensure we have the proper structure - values should be a direct array
				if (dimensionElement) {
					dimensionElement = {
						...dimensionElement,
						values: dimensionElement?.values || [],
						selectors: dimensionElement?.selectors || [],
					};
				}
				if (facetElement) {
					facetElement = {
						...facetElement,
						values: facetElement?.values || [],
						selectors: facetElement?.selectors || [],
					};
				}
				let parsedJson = JSON.parse(computedValue) || {};
				if (
					dimensionElement?.label === "dimensions" &&
					dimensionElement?.values?.length
				) {
					dimensionElement.selectors.forEach(
						(item: string, index: number) => {
							if (!item || !dimensionElement.values[index])
								return;
							columnsToPush = [
								...columnsToPush,
								{
									name: dimensionElement.values[index],
									selector: item,
								},
							];
						},
					);
					setData("columns", columnsToPush);
					parsedJson = {
						...parsedJson,
						state: {
							...parsedJson.state,
							dimensions: columnsToPush,
						},
					};
					setData("option", parsedJson);
				} else {
					parsedJson = {
						...parsedJson,
						state: {
							...parsedJson.state,
							dimensions: [],
						},
					};
					setData("columns", []);
					setData("option", parsedJson);
				}
				if (
					facetElement?.label === "facet" &&
					facetElement?.values?.length
				) {
					if (!facetElement.values[0] || !facetElement.selectors[0])
						return;

					setData("facet.facetSelected", [
						{
							name: facetElement.values[0],
							selector: facetElement.selectors[0],
							value: 0,
						},
					]);

					columnsToPush = [
						...columnsToPush,
						{
							name: facetElement.values[0],
							selector: facetElement.selectors[0],
							value: 0,
							isFacet: true,
						},
					];
					setData("columns", columnsToPush);
					parsedJson = {
						...parsedJson,
						state: {
							...parsedJson.state,
							facet: [
								{
									name: facetElement.values[0],
									selector: facetElement.selectors[0],
									value: 0,
								},
							],
						},
					};
					setData("option", parsedJson);
				} else {
					parsedJson = {
						...parsedJson,
						state: {
							...parsedJson.state,
							facet: [],
						},
					};
					setData("facet.facetSelected", []);
					setData("option", parsedJson);
				}
			}

			// Valid aggregate function names that should be preserved
			const VALID_AGGREGATES = [
				"Sum",
				"Average",
				"Count",
				"Unique Count",
				"Min",
				"Max",
				"Minimum",
				"Maximum",
				"Median",
			];

			const checkAggregate = (dataTypeOrAggregate: string) => {
				// If it's already a valid aggregate function, preserve it
				if (VALID_AGGREGATES.includes(dataTypeOrAggregate)) {
					return dataTypeOrAggregate;
				}
				// Otherwise, map data type codes to default aggregates
				const typeMap: Record<string, string> = {
					NUMBER: "Average",
					STRING: "Count",
					N: "Average",
					S: "Count",
				};
				return typeMap[dataTypeOrAggregate] || "";
			};
			const formatAggregates = () => {
				const formattedAggregates: Record<
					string,
					Record<string, string>
				> = {};

				columnsValue.forEach((column, columnIndex) => {
					const valueMap: Record<string, string> = {};

					const columnValues = Array.isArray(column?.values)
						? column.values
						: (column?.values?.values ?? []);

					const columnDataTypes = Array.isArray(column?.dataType)
						? column.dataType
						: (column?.values?.dataType ?? []);

					columnValues.forEach(
						(value: string, valueIndex: number) => {
							valueMap[value] = chart[columnIndex]?.aggregate
								? checkAggregate(
										columnDataTypes[valueIndex] ?? "",
									)
								: "";
						},
					);

					if (column.label && columnValues.length > 0) {
						formattedAggregates[column.label] = valueMap;
					}
				});

				return formattedAggregates;
			};
			setData("aggregate", formatAggregates());
		};
		function _dispatchData(option: Record<string, unknown>) {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
			const _newTimeout = setTimeout(() => {
				try {
					// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
					setData("option", option as PathValue<any, typeof path>);
				} catch (e) {
					console.log(e);
				}
			}, 100);
		}
		function getColumnIndexToSetData(
			columnsObject: Record<string, unknown>,
			columnsToSet: (string | string[])[],
		) {
			const colIndex: Record<string, number> = {};
			Object.keys(columnsObject).forEach((key) => {
				if (
					typeof columnsObject[key] === "object" &&
					Array.isArray(columnsObject[key])
				) {
					colIndex[key] = columnsToSet.findIndex((colSetItem) => {
						const firstItem = Array.isArray(colSetItem)
							? colSetItem[0]
							: colSetItem;
						return (
							firstItem === (columnsObject[key] as unknown[])[0]
						);
					});
				} else {
					colIndex[key] = -1; // Default to -1 if no match is found
				}
			});
			return colIndex;
		}
		const handleDragEnd = (result: DropResult) => {
			if (!result.destination) return;
			// biome-ignore lint/correctness/noUnusedVariables: used in JSX or callback
			const { source, destination, draggableId } = result;
			const dropId = destination.droppableId;

			const updated = { ...droppedColumns };
			if (!updated[dropId])
				updated[dropId] = { values: [], dataType: [] };

			const dropCol = filteredColumns.find(
				(col) => col?.name === draggableId,
			);
			const dropIndex = parseInt(dropId.split("-").pop() as string, 10);
			const isMultiLabel = chart[dropIndex]?.multiLabel;
			if (isMultiLabel) {
				if (!updated[dropId].values.includes(draggableId)) {
					updated[dropId] = {
						...updated[dropId],
						// biome-ignore lint/correctness/noUnsafeOptionalChaining: guarded at runtime
						values: [...updated[dropId]?.values, draggableId],
						dataType: [
							// biome-ignore lint/correctness/noUnsafeOptionalChaining: guarded at runtime
							...updated[dropId]?.dataType,
							dropCol?.dataType,
						],
					};
				}
			} else if (updated[dropId]?.values.length === 0) {
				updated[dropId] = {
					...updated[dropId],
					values: [draggableId],
					dataType: [dropCol?.dataType],
				};
			}

			setDroppedColumns(updated);
		};
		const deleteDroppedColumn = (columnName: string) => {
			setDroppedColumns((prev: DroppedColumns) => {
				const updated: DroppedColumns = { ...prev };
				for (const key in updated) {
					const index = updated[key].values.indexOf(columnName);
					if (index !== -1) {
						updated[key] = {
							...updated[key],
							values: updated[key].values.filter(
								(_, i) => i !== index,
							),
							dataType: updated[key].dataType.filter(
								(_, i) => i !== index,
							),
						};
					}
				}
				return updated;
			});
		};
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const onClickAdd = (value: boolean, id: any) => {
			setIsAdd(value);
			setAddedColumnName(id);
		};
		const renderElement = [...buildListener("preProcess")];

		const renderAccordion = (
			<>
				{accordionSection.map((item, index) => {
					const sectionKey = accordionList[index];
					const section = item[sectionKey];
					return (
						<div
							key={section.title}
							className="mb-1 w-full rounded border"
						>
							<button
								type="button"
								className="flex w-full items-center justify-between px-4 py-2 font-medium text-sm hover:bg-muted"
								onClick={() => {
									const accordionSectionToUp = [
										...accordionSection,
									];
									const indexToUpdate =
										accordionSectionToUp.findIndex(
											(accordItem) =>
												Object.hasOwn(
													accordItem,
													sectionKey,
												),
										);
									accordionSectionToUp[indexToUpdate] = {
										...accordionSectionToUp[indexToUpdate],
										[sectionKey]: {
											...accordionSectionToUp[
												indexToUpdate
											][sectionKey],
											expanded:
												!accordionSectionToUp[
													indexToUpdate
												][sectionKey].expanded,
										},
									};
									setAccordionSection(accordionSectionToUp);
								}}
							>
								<span>{section.title}</span>
								<ChevronDown
									className={`h-4 w-4 transition-transform ${section.expanded ? "rotate-180" : ""}`}
								/>
							</button>
							{section.expanded && (
								<div className="flex flex-col gap-1 px-4 py-2">
									{renderElement.map((c, cIdx) => {
										return createElement(c.render, {
											key: cIdx,
											id: id,
										});
									})}
								</div>
							)}
						</div>
					);
				})}
			</>
		);

		const handleChangeVisual = (value: boolean) => {
			const tempValue = JSON.parse(computedValue);

			tempValue.visual =
				tempValue.visual && Object.keys(tempValue.visual).length > 0
					? tempValue.visual
					: {};
			tempValue.visual = value;

			setValue(JSON.stringify(tempValue));
			setData("option", tempValue);
		};
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const handleSelectedItem = (item: any) => {
			selectedItem(item);
			setSelectedColumn([]);
		};
		return (
			<DragDropContext onDragEnd={handleDragEnd}>
				{/* Main two-column layout */}
				<div className="flex h-full w-full items-stretch justify-between p-2">
					{/* Left: Dimension panel */}
					<div className="flex min-h-[639px] w-[40%] flex-col items-center border-[#ccc] border-r p-2">
						<span className="relative self-start p-2 text-[#808080] text-sm">
							Dimension
						</span>
						<div className="w-[95%] pt-2">
							<div className="relative">
								<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-4 w-4 text-muted-foreground" />
								<input
									className="w-full rounded border py-1 pr-2 pl-8 text-sm"
									placeholder="Search"
									value={search}
									onChange={(e) =>
										handleSearch(e.target.value)
									}
								/>
							</div>
						</div>
						<Droppable droppableId="column-list">
							{(provided) => (
								<div
									ref={provided.innerRef}
									{...provided.droppableProps}
									className="w-full"
								>
									{filteredColumns.map((col, index) => (
										<Draggable
											key={col.name}
											draggableId={col.name}
											index={index}
										>
											{(provided, snapshot) => (
												<div
													ref={provided.innerRef}
													{...provided.draggableProps}
													{...provided.dragHandleProps}
													className={`mt-0.5 mb-2 flex max-w-full items-center justify-between gap-3 rounded p-2 ${snapshot.isDragging ? "bg-[#f0f0f0] shadow-md" : "bg-white"}`}
													style={{
														...provided
															.draggableProps
															.style,
													}}
												>
													<div className="flex flex-none items-center">
														{col.dataType ===
														"STRING" ? (
															// biome-ignore lint/a11y/useAltText: decorative image
															<img
																src={String(
																	StringIcon,
																)}
																className="mr-0.5"
															/>
														) : (
															// biome-ignore lint/a11y/useAltText: decorative image
															<img
																src={String(
																	NumberIcon,
																)}
																className="mr-0.5"
															/>
														)}
													</div>
													<div className="flex flex-1 items-center">
														{col.name.length > 7 ? (
															<span
																className="leading-6"
																title={col.name}
															>
																{col.name.slice(
																	0,
																	7,
																)}
																...
															</span>
														) : (
															<span className="leading-6">
																{col.name}
															</span>
														)}
													</div>
													{isAdd && (
														<div className="flex flex-1 justify-end">
															<input
																type="checkbox"
																className="cursor-pointer"
																onChange={(
																	e,
																) => {
																	setDroppedColumns(
																		(
																			prev,
																		) => {
																			const updated =
																				{
																					...prev,
																				};
																			if (
																				e
																					.target
																					.checked
																			) {
																				if (
																					!updated[
																						addedColumnName
																					]
																				)
																					updated[
																						addedColumnName
																					] =
																						{
																							values: [],
																							dataType:
																								[],
																						};
																				updated[
																					addedColumnName
																				] =
																					{
																						values: [
																							...updated[
																								addedColumnName
																							]
																								.values,
																							col.name,
																						],
																						dataType:
																							[
																								...updated[
																									addedColumnName
																								]
																									.dataType,
																								col.dataType,
																							],
																					};
																			} else {
																				if (
																					updated[
																						addedColumnName
																					]
																				) {
																					const index =
																						updated[
																							addedColumnName
																						].values.indexOf(
																							col.name,
																						);
																					updated[
																						addedColumnName
																					] =
																						updated[
																							addedColumnName
																						].values.splice(
																							index,
																							1,
																						);
																					if (
																						updated[
																							addedColumnName
																						]
																							?.values
																							?.length ===
																						0
																					) {
																						delete updated[
																							addedColumnName
																						];
																					}
																				}
																			}
																			return updated;
																		},
																	);
																}}
															/>
														</div>
													)}
												</div>
											)}
										</Draggable>
									))}
									{provided.placeholder}
								</div>
							)}
						</Droppable>
					</div>
					{/* Right: DataTabStyling panel */}
					<div className="flex min-h-[639px] w-[60%] flex-col items-center p-2">
						<DataTabStyling
							id={id}
							updateFrame={updateFrame}
							syncHeader={syncHeaders}
							path="option"
							dragdropColumns={droppedColumns}
							deleteColumns={deleteDroppedColumn}
							formmattedColumns={formattedColumns}
							isAdd={onClickAdd}
							chart={chart}
							storedColumns={selectedColumn}
							visual={handleChangeVisual}
							selectedItem={handleSelectedItem}
						/>
					</div>
				</div>
				{/* Accordion section */}
				<div className="flex h-full w-full items-stretch justify-between p-2">
					{renderAccordion}
				</div>
			</DragDropContext>
		);
	},
);
