import { ExpandMore, Search, Sync } from "@mui/icons-material";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { parse } from "path";
import {
	createElement,
	ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import {
	Block,
	type BlockDef,
	type EchartVisualizationBlockDef,
	getValueByPath,
	Paths,
	type PathValue,
	useBlocksPixel,
	useFrameHeaders,
} from "@semoss/renderer";
import {
	Accordion,
	Autocomplete,
	Button,
	Checkbox,
	IconButton,
	InputAdornment,
	Select,
	Stack,
	styled,
	TextField,
	Tooltip,
	Typography,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import NumberIcon from "../../../../../../../assets/block-settings/img/NumberIcon.svg";
import StringIcon from "../../../../../../../assets/block-settings/img/StringIcon.svg";
import { buildListener } from "../../../../block-settings/block-defaults.shared";
import { ListenerSettings } from "../../../ListenerSettings";
import { BAR_CHART_DATA } from "../Visualization.constants";
import { DataTabStyling } from "./bar-chart/DataTabStyling";

//frame operations component props structure
export interface FrameOperationsProps {
	id: string;
	updateFrame: (option) => void;
}
// a styled section to maintain the basic styles for every element in the component
const StyledDropDownSection = styled("div")(() => ({
	display: "flex",
	justifyContent: "space-between", // Ensures space between the two sections
	alignItems: "stretch", // Aligns items vertically in the center
	padding: "0.5rem",
	width: "100%",
	height: "100%",
}));

const StyledSubSection = styled("div")(() => ({
	alignItems: "center",
	padding: "0.5rem",
	width: "40%",
	minHeight: "639px",
	borderRight: "1px solid #ccc",
	"&:last-child": {
		borderRight: "none",
		width: "60%",
	},
}));

const StyledLabelIcon = styled("img")(() => ({
	marginRight: "2px",
}));

const StyledSpanDimension = styled("span")(() => ({
	padding: "0.5rem",
	fontSize: "1rem",
	color: "#808080",
	position: "relative",
}));

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

//data tab left section to show the data tab and the drag area for the selected columns
export const FrameOperations = observer(
	<D extends BlockDef = BlockDef>({
		id,
		updateFrame,
		path,
		chart,
		storedColumns,
		handleStoreData,
		selectedItem,
	}) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [columnsData, setColumnsData] = useState([]);
		const [search, setSearch] = useState("");
		const [isAdd, setIsAdd] = useState(false);
		const [addedColumnName, setAddedColumnName] = useState("");
		const [droppedColumns, setDroppedColumns] = useState<
			Record<string, any>
		>({});
		const [selectedColumn, setSelectedColumn] = useState<string[]>([]);
		const [accordionSection, setAccordionSection] = useState<
			AccordionSection[]
		>([
			{
				["preProcess"]: {
					expanded: true,
					title: "PRE PROCESS",
				},
			},
		]);
		const accordionList = ["preProcess"];
		const [value, setValue] = useState("");
		// get all of the frames
		const getFrames = useBlocksPixel<string[]>("GetFrames();", {
			data: [],
		});
		// track the ref to debounce the input
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
		const [filteredColumns, setFilteredColumns] = useState([]);
		// using frameheaders hook to get the header details for the selected frame
		const frameHeaders = useFrameHeaders(data.frame?.name);
		// fetch custom details about headers like alias, header, etc and assign to the variable for using it whenever required
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

		useEffect(() => {
			const filteredColumnsString = JSON.stringify(filteredColumns);
			const columnsSelectorString = JSON.stringify(columnsSelector);
			if (
				columnsSelector.length > 0 &&
				filteredColumnsString !== columnsSelectorString
			) {
				setFilteredColumns(columnsSelector);
			}
		}, [columnsSelector]);

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
					["xAxis"]: {
						...parsedValue["xAxis"],
						name: [],
						pixelname: [],
						pixelvalue: [],
						pixeldataType: [],
					},
					["yAxis"]: {
						...parsedValue["yAxis"],
						name: [],
						pixelname: [],
						pixelvalue: [],
						pixeldataType: [],
					},
				};
			} else if (data.variation === "echart-pie-chart") {
				const { _state, ...mainParsedData } = parsedValue;
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
					["_state"]: {
						...parsedValue["_state"],
						["dimensions"]: [],
						["facet"]: [],
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
					["_state"]: {
						["fields"]: {},
					},
				};
			} else if (data.variation === "echart-scatter-plots") {
				parsedValue = {
					...parsedValue,
					["_state"]: {
						["fields"]: {},
					},
				};
			} else if (data.variation === "echart-stack-chart") {
				parsedValue = {
					...parsedValue,
					["_state"]: {
						["fields"]: {},
					},
				};
			} else if (data.variation === "echart-word-cloud") {
				parsedValue = {
					...parsedValue,
					["_state"]: {
						["fields"]: {},
					},
				};
			} else {
				//to be used for special case if nothing matches
			}
			//all the stored and dropped columns are resetted to empty
			storedColumns = {};
			setDroppedColumns({});
			try {
				setData("option", parsedValue);
			} catch (e) {
				console.log("error: ", e);
			}
		}

		//additional function to trigger a sync, when a frame is newly selected
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
			setColumnsData((prevColumns) => {
				return columns;
			});
			if (frameChanged) {
				storedColumns = [];
				setSelectedColumn([]);
				resetBlockData();
			}
		}

		// get the value of the input (wrapped in usememo because of path prop)
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
		}, [data["option"]]).get();
		//useeffect to run the operations essential when a block is changed from another
		useEffect(() => {
			let tempStoredColumnsForDropped = {};
			if (data.variation === "echart-bar-graph") {
				const parsedOption = JSON.parse(computedValue) || {};
				if (
					Object.hasOwn(parsedOption, "xAxis") &&
					Object.hasOwn(parsedOption, "yAxis") &&
					Object.hasOwn(parsedOption["xAxis"], "pixelname") &&
					Object.hasOwn(parsedOption["yAxis"], "pixelname")
				) {
					const dataTypeList = {};
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
							dataType: dataTypeList[item.label],
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((preVCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-dendrogram-chart") {
				const parsedOption = JSON.parse(computedValue) || {};
				const dataTypeList = {};
				if (
					Object.hasOwn(parsedOption, "_state") &&
					Object.hasOwn(parsedOption["_state"], "dimensions") &&
					Object.hasOwn(parsedOption["_state"], "facet")
				) {
					["dimensions", "facet"].forEach((item) => {
						dataTypeList[item] = columnsSelector
							.filter((col) =>
								parsedOption["_state"][item].some(
									(stateItem) => stateItem.name === col.name,
								),
							)
							.map((col) => col.dataType);
					});
				}
				const tempStoredColumns = chart.map((item) => {
					return {
						name: item.name,
						label: item.label,
						values: parsedOption["_state"][item.label].map(
							(val) => val.name,
						),
						selectors: parsedOption["_state"][item.label].map(
							(selector) => selector.selector,
						),
						dataType: dataTypeList[item.label],
					};
				});
				tempStoredColumnsForDropped = tempStoredColumns;
				setSelectedColumn((preVCol) => tempStoredColumns);
			}
			if (data.variation === "echart-pie-chart") {
				const parsedOption = JSON.parse(computedValue) || {};
				if (
					Object.hasOwn(parsedOption, "_state") &&
					Object.hasOwn(parsedOption["_state"], "fields") &&
					Object.hasOwn(parsedOption["_state"]["fields"], "Label") &&
					Object.hasOwn(parsedOption["_state"]["fields"], "Value")
				) {
					const dataTypeList = {};
					["Label", "Value"].forEach((item) => {
						const dataTypeKey = item === "Label" ? "labelDataType" : "valueDataType";
						const pixelDataType = parsedOption["_state"]["fields"][dataTypeKey];
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
							values: parsedOption["_state"]["fields"][item.label] || [],
							selectors: parsedOption["_state"]["fields"][item.label] || [],
							dataType: dataTypeList[item.label],
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((preVCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-line-graph") {
				const parsedOption = JSON.parse(computedValue) || {};
				const dataTypeList = {};
				if (
					Object.hasOwn(parsedOption, "_state") &&
					Object.hasOwn(parsedOption["_state"], "fields") &&
					Object.hasOwn(parsedOption["_state"]["fields"], "xAxis") &&
					Object.hasOwn(parsedOption["_state"]["fields"], "yAxis")
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
							values: parsedOption["_state"]["fields"][item.label] || [],
							selectors: parsedOption["_state"]["fields"][item.label] || [],
							dataType: dataTypeList[item.label],
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((prevSelectedCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-world-map-chart") {
				const parsedJson = JSON.parse(computedValue);
				if (
					Object.hasOwn(parsedJson, "_state") &&
					Object.hasOwn(parsedJson["_state"], "fields") &&
					Object.hasOwn(parsedJson["_state"]["fields"], "label") &&
					Object.hasOwn(parsedJson["_state"]["fields"], "Latitude") &&
					Object.hasOwn(parsedJson["_state"]["fields"], "Longitude")
				) {
					const dataTypeList = {};
					const selectorList = [];
					[
						"label",
						"Latitude",
						"Longitude",
						"size",
						"color",
						"tooltip",
					].forEach((item) => {
						const dataTypeKey = `${item}DataType`;
						dataTypeList[item] = parsedJson["_state"]["fields"][dataTypeKey] || 
							columnsSelector
								.filter((col) =>
									parsedJson["_state"]["fields"][item]?.includes(
										col.name,
									),
								)
								.map((col) => col.dataType);
						selectorList.push(
							columnsSelector.find(
								(col) =>
									col.name ===
									parsedJson["_state"]["fields"][item],
							)?.selector || "",
						);
					});
					const tempStoredColumns = chart.map((item, index) => {
						return {
							name: item.name,
							label: item.label,
							values: Object.hasOwn(
								parsedJson["_state"]["fields"],
								item.label,
							)
								? Array.isArray(
										parsedJson["_state"]["fields"][
											item.label
										],
									)
									? parsedJson["_state"]["fields"][item.label]
									: [
											parsedJson["_state"]["fields"][
												item.label
											],
										]
								: [],
							selectors: Array.isArray(selectorList[index])
								? selectorList[index]
								: [selectorList[index]],
							dataType: dataTypeList[item.label],
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((prevSelectedCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-scatter-plots") {
				const parsedOption = JSON.parse(computedValue) || {};
				if (
					Object.hasOwn(parsedOption, "_state") &&
					Object.hasOwn(parsedOption["_state"], "fields") &&
					Object.hasOwn(parsedOption["_state"]["fields"], "label") &&
					Object.hasOwn(parsedOption["_state"]["fields"], "XAxis") &&
					Object.hasOwn(parsedOption["_state"]["fields"], "YAxis")
				) {
					const dataTypeList = {};
					const selectorList = [];
					[
						"label",
						"XAxis",
						"YAxis",
						"size",
						"color",
						"tooltip",
					].forEach((item) => {
						if (!parsedOption["_state"]["fields"][item]) {
							dataTypeList[item] = [];
							return;
						}
						const dataTypeKey = `${item}DataType`;
						dataTypeList[item] = parsedOption["_state"]["fields"][dataTypeKey] || 
							columnsSelector
								.filter((col) =>
									parsedOption["_state"]["fields"][item]?.includes(
										col.name,
									),
								)
								.map((col) => col.dataType);
						selectorList.push(
							columnsSelector.find((col) =>
								parsedOption["_state"]["fields"][item]?.includes(
									col.name,
								),
							)?.selector || "",
						);
					});
					const tempStoredColumns = chart.map((item, index) => {
						return {
							name: item.name,
							label: item.label,
							values:
								parsedOption["_state"]["fields"][item.label] ||
								[],
							selectors: selectorList[index] || [],
							dataType: dataTypeList[item.label],
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((preVCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-stack-chart") {
				const parsedJson = JSON.parse(computedValue);
				if (
					Object.hasOwn(parsedJson, "_state") &&
					Object.hasOwn(parsedJson["_state"], "fields") &&
					Object.hasOwn(parsedJson["_state"]["fields"], "XAxis") &&
					Object.hasOwn(parsedJson["_state"]["fields"], "YAxis")
				) {
					const dataTypeList = [];
					const selectorList = [];
					["XAxis", "YAxis", "category", "tooltip"].forEach(
						(item) => {
						const dataTypeKey = `${item}DataType`;
						dataTypeList[item] = parsedJson["_state"]["fields"][dataTypeKey] || 
							columnsSelector
								.filter((col) =>
									parsedJson["_state"]["fields"][item]?.includes(	
										col.name,
									),
								)
								.map((col) => col.dataType);
							selectorList.push(
								columnsSelector.find((col) =>
									parsedJson["_state"]["fields"][
										item
									]?.includes(col.name),
								)?.selector || "",
							);
						},
					);
					const tempStoredColumns = chart.map((item, index) => {
						return {
							name: item.name,
							label: item.label,
							values:
								parsedJson["_state"]["fields"][item.label] ||
								[],
							selectors: selectorList[index] || [],
							dataType: dataTypeList[item.label],
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((preVCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-gantt-chart") {
				const parsedJson = JSON.parse(computedValue);
				if (
					Object.hasOwn(parsedJson, "customSettings") &&
					Object.hasOwn(
						parsedJson["customSettings"],
						"columnDetails",
					) &&
					Object.hasOwn(
						parsedJson["customSettings"]["columnDetails"],
						"task",
					) &&
					Object.hasOwn(
						parsedJson["customSettings"]["columnDetails"],
						"startdate",
					) &&
					Object.hasOwn(
						parsedJson["customSettings"]["columnDetails"],
						"enddate",
					)
				) {
					const dataTypeList = [];
					const selectorList = [];
					const valueList = [];
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
										parsedJson["customSettings"][
											"columnDetails"
										][item]?.["name"] === col.name,
								)
								.map((col) => col.dataType) || [];
						console.log(
							parsedJson["customSettings"]["columnDetails"][
								item
							]?.["name"],
							columnsSelector.find(
								(col) =>
									parsedJson["customSettings"][
										"columnDetails"
									][item]?.["name"] === col.name,
							)?.selector,
							"selectorData",
						);
						selectorList[item] =
							columnsSelector.find(
								(col) =>
									parsedJson["customSettings"][
										"columnDetails"
									][item]?.["name"] === col.name,
							)?.selector || "";
						valueList[item] =
							parsedJson["customSettings"]["columnDetails"][
								item
							]?.["name"] || [];
					});
					const tempStoredColumns = chart.map((item, index) => {
						return {
							name: item.name,
							label: item.label,
							values: Array.isArray(valueList[item.label])
								? valueList[item.label]
								: [valueList[item.label]],
							selectors: Array.isArray(selectorList[item.label])
								? selectorList[item.label]
								: [selectorList[item.label]],
							dataType: dataTypeList[item.label],
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((preVCol) => tempStoredColumns);
				}
			}
			if (data.variation === "echart-word-cloud") {
				const parsedOption = JSON.parse(computedValue) || {};
				if (
					Object.hasOwn(parsedOption, "_state") &&
					Object.hasOwn(parsedOption["_state"], "fields") &&
					Object.hasOwn(parsedOption["_state"]["fields"], "words") &&
					Object.hasOwn(parsedOption["_state"]["fields"], "size")
				) {
					const dataTypeList = {};
					["words", "size", "tooltip"].forEach((item) => {
						if (parsedOption["_state"]["fields"][item]) {
							dataTypeList[item] = columnsSelector
								.filter((col) =>
									parsedOption["_state"]["fields"][
										item
									]?.includes(col.name),
								)
								.map((col) => col.dataType);
						}
					});
					const tempStoredColumns = chart.map((item) => {
						const fieldValues =
							parsedOption["_state"]["fields"][item.label] || [];
						return {
							name: item.name,
							label: item.label,
							values: fieldValues,
							selectors: fieldValues,
							dataType: dataTypeList[item.label],
						};
					});
					tempStoredColumnsForDropped = tempStoredColumns;
					setSelectedColumn((preVCol) => tempStoredColumns);
				}
			}
			//run the dropped columns update when block is changed
			if (Object.keys(tempStoredColumnsForDropped).length > 0) {
				const dragAndDropColumns = getDraggedColumns(
					tempStoredColumnsForDropped,
					data.variation,
				);
				setDroppedColumns((preVCol) => dragAndDropColumns);
			}
		}, [data.variation, id, filteredColumns]);

		//update the local state value when computed value is getting updated
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);
		// get the dropped columns data for the chart is selected or block is changed
		function getDraggedColumns(tempStoredColumns, chart) {
			const droppedColumnsList = { ...droppedColumns };

			tempStoredColumns.forEach((item, index) => {
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

		const formattedColumns = (columnsValue: any[], variation: any) => {
			// check if the columns value has any values
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
					if (Object.hasOwn(columnsValue[i]["values"], "values")) {
						tempColumns = {
							...columnsValue[i],
							values: columnsValue[i]?.["values"]?.["values"],
						};
					}
				}
				columnsDrop[i] = tempColumns;
			}

			const firstColumn = columnsDrop[0];
			const secondColumn = columnsDrop[1];
			let fieldsData = {
				[firstColumn?.label]: [],
				[secondColumn?.label]: [],
			};
			let selectedValues = {
				[firstColumn?.label]: [],
				[secondColumn?.label]: [],
			};

			const columns = { ...fieldsData };

			if (variation === "echart-bar-graph") {
				let tempVal = JSON.parse(computedValue) || {};
				if (firstColumn?.label) {
					columns[firstColumn?.label] = [
						{
							["name"]: firstColumn?.values || "",
							["selector"]: firstColumn.selectors,
							["width"]: undefined,
							["dataType"]: firstColumn.dataType || "",
						},
					];
					fieldsData = {
						...fieldsData,
						[firstColumn?.label]: columns[firstColumn?.label],
					};
					selectedValues = {
						...selectedValues,
						[firstColumn?.label]:
							columns[firstColumn?.label][0]["selector"],
					};
				}
				if (secondColumn?.label) {
					columns[secondColumn?.label] = [];
					secondColumn.values.forEach((item, index) => {
						columns[secondColumn?.label].push({
							["name"]: secondColumn.values[index] || "",
							["selector"]: secondColumn.selectors[index],
							["width"]: undefined,
							["dataType"]: secondColumn.dataType || "",
						});
					});
					fieldsData = {
						...fieldsData,
						[secondColumn?.label]: columns[secondColumn?.label],
					};
					let LabelData = [];
					columns[secondColumn?.label].forEach(
						(labelItem, labelIndex) => {
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
					const seriesIndex =
						tempVal["series"].findIndex((item) =>
							BAR_CHART_DATA.JSONVALUE?.includes(item.type),
						) || 0;
					let columnsmerged = [];
					if (columns[firstColumn?.label]?.length) {
						tempVal[firstColumn?.label] = {
							...tempVal[firstColumn?.label],
							["name"]:
								columns[firstColumn?.label][0]?.name || [],
							["pixelname"]:
								columns[firstColumn?.label][0]?.name || [],
							["pixelvalue"]:
								columns[firstColumn?.label][0]?.selector || [],
							["pixeldataType"]:
								columns[firstColumn?.label][0]?.dataType || [],
						};
					} else {
						tempVal["xAxis"] = {
							...tempVal["xAxis"],
							["name"]: [],
							["pixelname"]: [],
							["pixelvalue"]: [],
							["pixeldataType"]: [],
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
					const pixelName = [],
						pixelValue = [],
						pixeldataType = [];
					const axisName = [];
					columns[secondColumn?.label].forEach(
						(columItem, columIndex) => {
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
						tempVal[secondColumn?.label] = {
							...tempVal[secondColumn?.label],
							["name"]: axisName || pixelName[0],
							["pixelname"]: pixelName,
							["pixelvalue"]: pixelValue,
							["pixeldataType"]: pixeldataType,
						};
					} else {
						tempVal = {
							...tempVal,
							["yAxis"]: {
								...tempVal["yAxis"],
								["name"]: "",
								["pixelname"]: [],
								["pixelvalue"]: [],
								["pixeldataType"]: [],
							},
						};
					}
					for (
						let i = 0;
						i < columns[secondColumn?.label]?.length;
						i++
					) {
						tempVal["series"][i] = {
							...tempVal["series"][i],
							data: [],
							name: columns[secondColumn?.label][i]?.name,
							type: "bar",
							barWidth: 5,
							["itemStyle"]: {
								["color"]:
									tempVal["color"][i] ??
									COLOUR_PALATTE_DATA[i],
							},
						};
					}
					tempVal = {
						...tempVal,
						["customSettings"]: {
							...tempVal["customSettings"],
							["toolsUpdated"]: false,
						},
					};
					setData("option", tempVal);
					setData("columns", columnsmerged);
				}
			}
			if (variation === "echart-pie-chart") {
				const tempValue = JSON.parse(computedValue);

				tempValue["_state"] = {};
				tempValue["_state"]["fields"] = {};

				tempValue["_state"]["fields"] = {
					...tempValue["_state"]["fields"],
					Value: secondColumn?.values || [],
					valueDataType: secondColumn?.dataType || [],
					Label: firstColumn?.values || [],
					labelDataType: firstColumn?.dataType || [],
				};

				// set the value
				setValue(JSON.stringify(tempValue));
				setData("option", tempValue);
			}
			if (variation === "echart-scatter-plots") {
				const tempValue = JSON.parse(computedValue);

				tempValue["_state"] =
					tempValue["_state"] &&
					Object.keys(tempValue["_state"]).length > 0
						? tempValue["_state"]
						: {};
				if (firstColumn?.values) {
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						label: firstColumn?.values,
						labelDataType: firstColumn?.dataType,
					};

					// Update the series label name
					tempValue["series"][0]["label"]["name"] =
						firstColumn?.values;
				}
				if (secondColumn?.values) {
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						XAxis: secondColumn?.values,
						XAxisDataType: secondColumn?.dataType,
					};
					// Update the series xAxis name
					tempValue["xAxis"]["name"] = secondColumn?.values;
					tempValue["xAxis"]["pixelName"] = secondColumn?.values;
				}
				if (columnsDrop[2]?.values.length > 0) {
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						YAxis: columnsDrop[2]?.values,
						YAxisDataType: columnsDrop[2]?.dataType,
					};

					tempValue["yAxis"]["name"] = columnsDrop[2]?.values;
					tempValue["yAxis"]["pixelName"] = columnsDrop[2]?.values;
				}
				if (columnsDrop[3]?.values.length > 0) {
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						size: columnsDrop[3]?.values,
						sizeDataType: columnsDrop[3]?.dataType,
					};
				}
				if (columnsDrop[4]?.values.length > 0) {
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						color: columnsDrop[4]?.values,
						colorDataType: columnsDrop[4]?.dataType,
					};
				}
				if (columnsDrop[5]?.values.length > 0) {
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
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
					tempValue["_state"] =
						tempValue["_state"] &&
						Object.keys(tempValue["_state"]).length > 0
							? tempValue["_state"]
							: {};
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						XAxis: firstColumn?.values,
						XAxisDataType: firstColumn?.dataType,
					};

					tempValue["xAxis"]["name"] = firstColumn?.values;
					tempValue["xAxis"]["pixelName"] = firstColumn?.values;
					tempValue["xAxis"]["flipAxisName"] = firstColumn?.values;
					tempValue["xAxis"]["axisName"] = firstColumn?.values;
				}
				if (secondColumn?.values) {
					tempValue["_state"] =
						tempValue["_state"] &&
						Object.keys(tempValue["_state"]).length > 0
							? tempValue["_state"]
							: {};
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						YAxis: secondColumn?.values,
						YAxisDataType: secondColumn?.dataType,
					};

					tempValue["yAxis"]["name"] = secondColumn?.values;
					tempValue["yAxis"]["pixelName"] = secondColumn?.values;
					tempValue["yAxis"]["flipAxisName"] = secondColumn?.values;
					tempValue["yAxis"]["axisName"] = secondColumn?.values;
				}
				if (columnsDrop[2]?.values.length > 0) {
					tempValue["_state"] =
						tempValue["_state"] &&
						Object.keys(tempValue["_state"]).length > 0
							? tempValue["_state"]
							: {};
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						category: columnsDrop[2]?.values,
						categoryDataType: columnsDrop[2]?.dataType,
					};
				}
				if (columnsDrop[3]?.values.length > 0) {
					tempValue["_state"] =
						tempValue["_state"] &&
						Object.keys(tempValue["_state"]).length > 0
							? tempValue["_state"]
							: {};
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
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
				tempValue["xAxis"] = {
					...tempValue["xAxis"],
					name: firstColumn?.values,
					dataType: firstColumn?.dataType,
				};
				tempValue["yAxis"] = {
					...tempValue["yAxis"],
					name: secondColumn?.values,
					dataType: secondColumn?.dataType,
				};

				tempValue["_state"] = {};
				tempValue["_state"]["fields"] = {};
				let tempSeries = tempValue["series"] || [];
				tempValue["_state"]["fields"] = {
					...tempValue["_state"]["fields"],
					xAxis: firstColumn?.values,
					xAxisDataType: firstColumn?.dataType,
					yAxis: secondColumn?.values,
					yAxisDataType: secondColumn?.dataType,
					tooltip: columnsDrop[2]?.values
						? columnsDrop[2]?.values
						: [],
				};
				if (secondColumn?.values.length > 1) {
					const seriesListToAdd = [];
					//Adding newly added field to the state
					for (let i = 0; i < secondColumn.values.length; i++) {
						seriesListToAdd[i] = {
							...tempSeries[i],
							name: secondColumn.values[i],
							dataType: secondColumn.dataType[i],
							type: "line",
							data: tempSeries[i]?.data ?? [],
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
				} else {
					//Removing the field from the state if it is not selected
					tempSeries = tempSeries.slice(0, 1);
				}
				tempValue["series"] = tempSeries;
				// set the value
				setValue(JSON.stringify(tempValue));
				setData("option", tempValue);
			}
			if (variation === "echart-world-map-chart") {
				if (firstColumn?.values) {
					const tempValue = JSON.parse(computedValue);

					tempValue["_state"] =
						tempValue["_state"] &&
						Object.keys(tempValue["_state"]).length > 0
							? tempValue["_state"]
							: {};
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						label: firstColumn?.values?.[0],
						labelDataType: firstColumn?.dataType?.[0],
					};

					setValue(JSON.stringify(tempValue));
					setData("option", tempValue);
				}
				if (secondColumn?.values) {
					const tempValue = JSON.parse(computedValue);

					tempValue["_state"] =
						tempValue["_state"] &&
						Object.keys(tempValue["_state"]).length > 0
							? tempValue["_state"]
							: {};
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						Latitude: secondColumn?.values?.[0],
						LatitudeDataType: secondColumn?.dataType?.[0],
					};

					setValue(JSON.stringify(tempValue));
					setData("option", tempValue);
				}
				if (columnsDrop[2]?.values.length > 0) {
					const tempValue = JSON.parse(computedValue);

					tempValue["_state"] =
						tempValue["_state"] &&
						Object.keys(tempValue["_state"]).length > 0
							? tempValue["_state"]
							: {};
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						Longitude: columnsDrop[2]?.values?.[0],
						LongitudeDataType: columnsDrop[2]?.dataType?.[0],
					};

					setValue(JSON.stringify(tempValue));
					setData("option", tempValue);
				}
				if (columnsDrop[3]?.values.length > 0) {
					const tempValue = JSON.parse(computedValue);

					tempValue["_state"] =
						tempValue["_state"] &&
						Object.keys(tempValue["_state"]).length > 0
							? tempValue["_state"]
							: {};
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						size: columnsDrop[3]?.values?.[0],
						sizeDataType: columnsDrop[3]?.dataType?.[0],
					};

					setValue(JSON.stringify(tempValue));
					setData("option", tempValue);
				}
				if (columnsDrop[4]?.values.length > 0) {
					const tempValue = JSON.parse(computedValue);

					tempValue["_state"] =
						tempValue["_state"] &&
						Object.keys(tempValue["_state"]).length > 0
							? tempValue["_state"]
							: {};
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						color: columnsDrop[4]?.values?.[0],
						colorDataType: columnsDrop[4]?.dataType?.[0],
					};

					setValue(JSON.stringify(tempValue));
					setData("option", tempValue);
				}
				if (columnsDrop[5]?.values.length > 0) {
					const tempValue = JSON.parse(computedValue);

					tempValue["_state"] =
						tempValue["_state"] &&
						Object.keys(tempValue["_state"]).length > 0
							? tempValue["_state"]
							: {};
					tempValue["_state"]["fields"] = {
						...tempValue["_state"]["fields"],
						tooltip: columnsDrop[5]?.values?.[0],
						tooltipDataType: columnsDrop[5]?.dataType?.[0],
					};

					setValue(JSON.stringify(tempValue));
					setData("option", tempValue);
				}
			}
			if (variation == "echart-gantt-chart") {
				let columnsToSet = [];
				const columnsObject = {
					tooltip: [],
				};
				const formattedArray = [];

				const tempValue = JSON.parse(computedValue);

				for (let i = 0; i < columnsValue.length; i++) {
					if (columnsValue[i]?.values.length == 1) {
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
					columnsObject["task"] = firstColumn?.values;

					tempValue["customSettings"] =
						tempValue["customSettings"] &&
						Object.keys(tempValue["customSettings"]).length > 0
							? tempValue["customSettings"]
							: {};

					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
						[firstColumn?.label]: {
							name: firstColumn?.values?.[0],
							selector: firstColumn?.selectors?.[0],
						},
					};
				} else {
					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
						[firstColumn?.label]: {
							name: "",
							selector: "",
						},
					};
				}
				if (secondColumn?.values) {
					columnsToSet.push(secondColumn?.values);
					columnsObject["startdate"] = secondColumn?.values;

					tempValue["customSettings"] =
						tempValue["customSettings"] &&
						Object.keys(tempValue["customSettings"]).length > 0
							? tempValue["customSettings"]
							: {};

					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
						[secondColumn?.label]: {
							name: secondColumn?.values?.[0],
							selector: secondColumn?.selectors?.[0],
						},
					};

					// setValue(JSON.stringify(tempValue));
					// setData("option", tempValue);
				} else {
					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
						[secondColumn?.label]: {
							name: "",
							selector: "",
						},
					};
				}
				if (columnsDrop[2]?.values.length > 0) {
					columnsToSet.push(columnsDrop[2]?.values);
					columnsObject["enddate"] = columnsDrop[2]?.values;

					tempValue["customSettings"] =
						tempValue["customSettings"] &&
						Object.keys(tempValue["customSettings"]).length > 0
							? tempValue["customSettings"]
							: {};

					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
						[columnsDrop[2]?.label]: {
							name: columnsDrop[2]?.values?.[0],
							selector: columnsDrop[2]?.selectors?.[0],
						},
					};
				} else {
					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
						[columnsDrop[2]?.label]: {
							name: "",
							selector: "",
						},
					};
				}
				if (columnsDrop[3]?.values.length > 0) {
					columnsToSet.push(columnsDrop[3]?.values);
					columnsObject["taskgroup"] = columnsDrop[3]?.values;

					tempValue["customSettings"] =
						tempValue["customSettings"] &&
						Object.keys(tempValue["customSettings"]).length > 0
							? tempValue["customSettings"]
							: {};

					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
						[columnsDrop[3]?.label]: {
							name: columnsDrop[3]?.values?.[0],
							selector: columnsDrop[3]?.selectors?.[0],
						},
					};
				} else {
					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
						[columnsDrop[3]?.label]: {
							name: "",
							selector: "",
						},
					};
				}
				if (columnsDrop[4]?.values.length > 0) {
					columnsToSet.push(columnsDrop[4]?.values);
					columnsObject["taskprogress"] = columnsDrop[4]?.values;

					tempValue["customSettings"] =
						tempValue["customSettings"] &&
						Object.keys(tempValue["customSettings"]).length > 0
							? tempValue["customSettings"]
							: {};

					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
						[columnsDrop[4]?.label]: {
							name: columnsDrop[4]?.values?.[0],
							selector: columnsDrop[4]?.selectors?.[0],
						},
					};
				} else {
					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
						[columnsDrop[4]?.label]: {
							name: "",
							selector: "",
						},
					};
				}
				if (columnsDrop[5]?.values.length > 0) {
					columnsToSet.push(columnsDrop[5]?.values);
					columnsObject["milestone"] = columnsDrop[5]?.values;

					tempValue["customSettings"] =
						tempValue["customSettings"] &&
						Object.keys(tempValue["customSettings"]).length > 0
							? tempValue["customSettings"]
							: {};

					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
						[columnsDrop[5]?.label]: {
							name: columnsDrop[5]?.values?.[0],
							selector: columnsDrop[5]?.selectors?.[0],
						},
					};

					// setValue(JSON.stringify(tempValue));
					// setData("option", tempValue);
				} else {
					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
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
							...columnsDrop[6]?.values,
						];
					} else {
						columnsToSet.push(columnsDrop[6]?.values);
					}
					columnsObject["tooltip"] = Array.isArray(
						columnsDrop[6]?.values,
					)
						? columnsDrop[6]?.values
						: [columnsDrop[6]?.values];

					tempValue["customSettings"] =
						tempValue["customSettings"] &&
						Object.keys(tempValue["customSettings"]).length > 0
							? tempValue["customSettings"]
							: {};

					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
						[columnsDrop[6]?.label]: {
							name: columnsDrop[6]?.values,
							selector: columnsDrop[6]?.selectors,
						},
					};
				} else {
					tempValue["customSettings"]["columnDetails"] = {
						...tempValue["customSettings"]["columnDetails"],
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
				const tooltipIndexToSet = tooltip.reduce((acc, item) => {
					columnsToSet.forEach((colSetItem, colSetIndex) => {
						if (colSetItem?.includes(item)) {
							acc = [...acc, colSetIndex];
						}
					});
					return acc;
				}, []);

				if (columnsIndexToSet) {
					tempValue["customSettings"]["columnIndexDetails"] = {
						...tempValue["customSettings"]["columnIndexDetails"],
						...columnsIndexToSet,
						...{ tooltip: tooltipIndexToSet },
					};

					setValue(JSON.stringify(tempValue));
					setData("option", tempValue);
				}
				setData("columns", formattedArray);
			}
			if (variation === "echart-word-cloud") {
				const fieldsData = {};
				const parsedJson = JSON.parse(computedValue) || {};

				// Initialize _state if it doesn't exist
				if (!parsedJson._state) {
					parsedJson._state = { fields: {} };
				}
				if (!parsedJson._state.fields) {
					parsedJson._state.fields = {};
				}

				// Process each column type (words, size, tooltip)
				columnsValue.forEach((column, index) => {
					if (column?.values?.values?.length > 0) {
						const columnValues = column.values.values;

						// Store simple arrays like other chart types, not objects
						fieldsData[column.label] = columnValues;
					} else {
						// Empty field for this column type
						fieldsData[column.label] = [];
					}
				});

				// Update the parsed JSON with the new fields data
				parsedJson._state.fields = {
					...parsedJson._state.fields,
					...fieldsData,
				};

				setValue(JSON.stringify(parsedJson));
				setData("option", parsedJson);
			}
			if (variation == "echart-dendrogram-chart") {
				let columnsToPush = [];
				let dimensionElement = columnsValue.find(
					(element) => element.label === "dimensions",
				);
				let facetElement = columnsValue.find(
					(element) => element.label === "facet",
				);
				dimensionElement = {
					...dimensionElement,
					["values"]: dimensionElement["values"]?.["values"] || [],
				};
				facetElement = {
					...facetElement,
					["values"]: facetElement["values"]?.["values"] || [],
				};
				let parsedJson = JSON.parse(computedValue) || {};
				if (
					dimensionElement.label === "dimensions" &&
					dimensionElement.values.length
				) {
					dimensionElement.selectors.forEach((item, index) => {
						if (!item || !dimensionElement.values[index]) return;
						columnsToPush = [
							...columnsToPush,
							{
								name: dimensionElement.values[index],
								selector: item,
							},
						];
					});
					setData("columns", columnsToPush);
					parsedJson = {
						...parsedJson,
						["_state"]: {
							...parsedJson["_state"],
							["dimensions"]: columnsToPush,
						},
					};
					setData("option", parsedJson);
				} else {
					parsedJson = {
						...parsedJson,
						["_state"]: {
							...parsedJson["_state"],
							["dimensions"]: [],
						},
					};
					setData("columns", []);
					setData("option", parsedJson);
				}
				if (
					facetElement.label === "facet" &&
					facetElement.values.length
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
						["_state"]: {
							...parsedJson["_state"],
							["facet"]: [
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
						["_state"]: {
							...parsedJson["_state"],
							["facet"]: [],
						},
					};
					setData("facet.facetSelected", []);
					setData("option", parsedJson);
				}
			}

			const checkAggregate = (functionName) =>
				({ NUMBER: "Average", STRING: "Count" })[functionName] ||
				functionName;
			const formatAggregates = () => {
				const formattedAggregates = {};
				columnsValue.forEach((column, columnIndex) => {
					const valueMap = {};
					if (
						Object.hasOwn(column, "values") &&
						Object.hasOwn(column["values"], "values")
					) {
						const columnValues = column?.values?.values || [];
						columnValues.forEach((value, valueIndex) => {
							valueMap[value] = chart[columnIndex]?.aggregate
								? checkAggregate(
										column?.values?.dataType[valueIndex],
									)
								: "";
						});
						formattedAggregates[column.label] = valueMap;
					}
				});
				return formattedAggregates;
			};
			setData("aggregate", formatAggregates());
		};
		function dispatchData(option) {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			timeoutRef.current = setTimeout(() => {
				try {
					// set the value
					setData("option", option as PathValue<any, typeof path>);
				} catch (e) {
					console.log(e);
				}
			}, 100);
		}
		function getColumnIndexToSetData(columnsObject, columnsToSet) {
			const colIndex = {};
			Object.keys(columnsObject).forEach((key) => {
				if (
					typeof columnsObject[key] === "object" &&
					Array.isArray(columnsObject[key])
				) {
					// Find the index of the first matching value in columnsToSet
					colIndex[key] = columnsToSet.findIndex(
						(colSetItem) => colSetItem[0] === columnsObject[key][0],
					);
				} else {
					// Handle non-array values if needed (not applicable in your example)
					colIndex[key] = -1; // Default to -1 if no match is found
				}
			});
			return colIndex;
		}
		const handleDragEnd = (result) => {
			if (!result.destination) return;

			const { source, destination, draggableId } = result;
			const dropId = destination.droppableId;

			const updated = { ...droppedColumns };
			if (!updated[dropId])
				updated[dropId] = { values: [], dataType: [] };
			const dropCol = filteredColumns.find(
				(col) => col?.name === draggableId,
			);
			updated[dropId] = {
				...updated[dropId],
				values: [...updated[dropId]?.values, draggableId],
				dataType: [...updated[dropId]?.dataType, dropCol?.dataType],
			};
			setDroppedColumns(updated);
		};
		const deleteDroppedColumn = (columnName: string) => {
			setDroppedColumns((prev) => {
				const updated = { ...prev };
				for (const key in updated) {
					const index = updated[key]["values"].indexOf(columnName);
					if (index !== -1) {
						updated[key] = {
							...updated[key],
							values: updated[key]["values"].filter((_, i) => i !== index),
							dataType: updated[key]["dataType"].filter((_, i) => i !== index),
						};
					}
				}
				return updated;
			});
		};
		const onClickAdd = (value: boolean, id: any) => {
			setIsAdd(value);
			setAddedColumnName(id);
		};
		const renderElement = [...buildListener("preProcess")];

		const renderAccordion = (
			<>
				{accordionSection.map((item, index) => (
					<Accordion
						key={item[accordionList[index]].title}
						expanded={item[accordionList[index]].expanded}
						onChange={(e) => {
							const accordionSectionToUp = accordionSection;
							const indexToUpdate =
								accordionSectionToUp.findIndex((accordItem) =>
									Object.hasOwn(
										accordItem,
										accordionList[index],
									),
								);
							accordionSectionToUp[indexToUpdate][
								accordionList[index]
							] = {
								...accordionSectionToUp[indexToUpdate][
									accordionList[index]
								],
								expanded:
									!accordionSectionToUp[indexToUpdate][
										accordionList[index]
									].expanded,
							};
							setAccordionSection((prevAccordionSection) => {
								return [...accordionSectionToUp];
							});
						}}
						sx={{
							width: "100%",
						}}
					>
						<Accordion.Trigger expandIcon={<ExpandMore />}>
							<Typography variant="body2">
								{item[accordionList[index]].title}
							</Typography>
						</Accordion.Trigger>

						<Accordion.Content>
							<Stack direction="column" spacing={1}>
								{renderElement.map((c, cIdx) => {
									return createElement(c.render, {
										key: cIdx,
										id: id,
									});
								})}
							</Stack>
						</Accordion.Content>
					</Accordion>
				))}
			</>
		);

		const handleChangeVisual = (value: boolean) => {
			const tempValue = JSON.parse(computedValue);

			tempValue["visual"] =
				tempValue["visual"] &&
				Object.keys(tempValue["visual"]).length > 0
					? tempValue["visual"]
					: {};
			tempValue["visual"] = value;

			setValue(JSON.stringify(tempValue));
			setData("option", tempValue);
		};
		const handleSelectedItem = (item: any) => {
			selectedItem(item);
			setSelectedColumn([]);
		};
		return (
			<>
				<DragDropContext onDragEnd={handleDragEnd}>
					<StyledDropDownSection>
						<StyledSubSection>
							<StyledSpanDimension>Dimension</StyledSpanDimension>
							<Stack paddingTop={2} width={"95%"}>
								<TextField
									placeholder="Search"
									size="small"
									sx={{
										"& .MuiOutlinedInput-root": {
											borderRadius: "7px",
										},
									}}
									value={search}
									onChange={(e) =>
										handleSearch(e.target.value)
									}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<Search />
											</InputAdornment>
										),
										endAdornment: (
											<InputAdornment position="end">
												<IconButton
													size="small"
													// onClick={(e) =>
													//     setMenuAnchorEl(e.currentTarget)
													// }
												></IconButton>
											</InputAdornment>
										),
									}}
								/>
							</Stack>
							<Droppable droppableId="column-list">
								{(provided) => (
									<div
										ref={provided.innerRef}
										{...provided.droppableProps}
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
														style={{
															display: "flex",
															alignItems:
																"center",
															justifyContent:
																"space-between",
															gap: "12px",
															padding: "8px",
															marginBottom: "8px",
															marginTop: "2px",
															background:
																snapshot.isDragging
																	? "#f0f0f0"
																	: "#fff",
															borderRadius: "4px",
															maxWidth: "100%",
															boxShadow:
																snapshot.isDragging
																	? "0 2px 5px rgba(0,0,0,0.2)"
																	: "none",
															...provided
																.draggableProps
																.style,
														}}
													>
														<div
															style={{
																flex: "0 0 auto",
																display: "flex",
																alignItems:
																	"center",
															}}
														>
															{col.dataType ===
															"STRING" ? (
																<StyledLabelIcon
																	src={String(
																		StringIcon,
																	)}
																/>
															) : (
																<StyledLabelIcon
																	src={String(
																		NumberIcon,
																	)}
																/>
															)}
														</div>
														<div
															style={{
																flex: "1 1 auto",
																display: "flex",
																alignItems:
																	"center",
															}}
														>
															{col.name.length >
															7 ? (
																<Tooltip
																	title={
																		col.name
																	}
																>
																	<span
																		style={{
																			lineHeight:
																				"1.5",
																		}}
																	>
																		{col.name.slice(
																			0,
																			7,
																		)}
																		...
																	</span>
																</Tooltip>
															) : (
																<span
																	style={{
																		lineHeight:
																			"1.5",
																	}}
																>
																	{col.name}
																</span>
															)}
														</div>
														{isAdd && (
															<div
																style={{
																	flex: "1 1 auto",
																	display:
																		"flex",
																	justifyContent:
																		"flex-end",
																}}
															>
																<Checkbox
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
																					(
																						e.target as HTMLInputElement
																					)
																						.checked
																				) {
																					// Add the column name if checked
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
																					// Remove the column name if unchecked
																					if (
																						updated[
																							addedColumnName
																						]
																					) {
																						const index =
																							updated[
																								addedColumnName
																							][
																								"values"
																							].indexOf(
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
																						// If the array becomes empty, you can optionally delete the key
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
						</StyledSubSection>
						<StyledSubSection>
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
							></DataTabStyling>
						</StyledSubSection>
					</StyledDropDownSection>
					<StyledDropDownSection>
						{renderAccordion}
					</StyledDropDownSection>
				</DragDropContext>
			</>
		);
	},
);
