import { ArrowDropDown } from "@mui/icons-material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Droppable } from "react-beautiful-dnd";
import {
	type BlockDef,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type PathValue,
	useBlocksPixel,
	useFrameHeaders,
} from "@semoss/renderer";
import {
	Autocomplete,
	Menu,
	Popover,
	Switch,
	styled,
	TextField,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
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
//styled components for the data tab
const StyledMain = styled("div")(() => ({
	width: "100%",
	height: "100%",
	marginTop: "1px",
}));
//styled span of frame for the frame and visual selection
const StyledSpanFrame = styled("span")(() => ({
	fontSize: "1rem",
	color: "#808080",
	paddingLeft: "16px",
	position: "relative",
}));
//styled span of label for the frame and visual selection
const StyledSpanLabel = styled("span")(() => ({
	fontSize: "1rem",
	paddingLeft: "16px",
	position: "relative",
}));
//styled section for the frame and visual selection
const StyledSubSection = styled("div")(() => ({
	display: "flex",
	justifyContent: "center",
	padding: "0.5rem",
	width: "100%",
	marginTop: "5px",
}));
//styled droppable area of the frame and visual selection
const StyledDroppable = styled("div")(() => ({
	marginTop: "8px",
}));
//styled label area  of the frame and visual selection
const StyledLabelSection = styled("div")(() => ({
	display: "flex",
	width: "100%",
}));
//styled section for the label of the frame and visual selection
const StyledSwitchSection = styled("div")(() => ({
	display: "flex",
	marginTop: "15px",
	marginLeft: "10px",
	width: "100%",
	alignItems: "center",
	gap: "8px",
}));
//styled label for the constants
const StyledSpanSwitch = styled("span")(() => ({
	fontSize: "1rem",
	color: "#808080",
	marginTop: "5px",
	position: "relative",
}));
//droppable item styling
const DropContainer = styled("div")(() => ({
	padding: "8px",
	minHeight: "50px",
	border: "1px dashed #ccc",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	width: "95%",
	borderRadius: "10px",
	marginLeft: "12px",
	marginTop: "8px",
}));

const StyledMainTextField = styled("div")(() => ({
	display: "flex",
	alignItems: "center",
}));

const StyledMainTextFieldIcon = styled("div")(() => ({
	display: "flex",
	alignItems: "center",
}));

const StyledMainTextFieldSpan = styled("span")(() => ({
	marginLeft: "10px",
	display: "flex",
	alignItems: "center",
}));

const StyledDropContainerSpan = styled("span")(
	({ multiLabel }: { multiLabel: boolean }) => ({
		color: "#aaa",
		fontSize: "0.9rem",
		textAlign: "left",
		paddingRight: !multiLabel ? "28%" : "46%",
	}),
);

const StyledMainReturnDiv = styled("div")(() => ({
	padding: "4px 8px",
	margin: "4px 0",
	backgroundColor: "#f0f0f0",
	height: "4%",
	width: "95%",
	borderRadius: "34px",
	marginLeft: "13px",
	marginTop: "8px",
	textAlign: "left",
	paddingLeft: "16px",
	paddingTop: "8px",
	fontSize: "1rem",
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
}));

const StyledInfoOutlinedIcon = styled(InfoOutlinedIcon)(() => ({
	color: "#888",
	marginLeft: "8px",
	cursor: "pointer",
	fontSize: "18px",
	marginTop: "2px",
}));

const StyledAddOutlinedIcon = styled(AddOutlinedIcon)(() => ({
	color: "#888",
	marginLeft: "8px",
	cursor: "pointer",
	fontSize: "18px",
}));

const StyledArrowDropDown = styled(ArrowDropDown)(() => ({
	color: "#888",
	cursor: "pointer",
}));

const StyledCloseOutlinedIcon = styled(CloseOutlinedIcon)(() => ({
	color: "#888",
	cursor: "pointer",
}));

//data tab right section of the echart visualization block
export const DataTabStyling = observer(
	<D extends BlockDef = BlockDef>({
		id,
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
	}) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [selectedColumns, setSelectedColumns] = useState<
			Record<string, Record<string, unknown>>
		>(() => {
			return storedColumns || {}; // Initialize with storedColumns if available
		});
		const [checkedInstruction, setCheckedInstruction] = useState(false);
		const [checkedVisual, setCheckedVisual] = useState(false);
		const [isAddIcon, setIsAddIcon] = useState(false);
		const getFrames = useBlocksPixel<string[]>("GetFrames();", {
			data: [],
		});
		const options = getFrames.status === "SUCCESS" ? getFrames.data : [];
		const [initialVisual, setInitialVisual] = useState(false);
		const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(
			null,
		);
		const [aggregateMenuAnchorEl, setAggregateMenuAnchorEl] =
			useState<null | HTMLElement>(null);
		const [aggregateOptions, setAggregateOptions] = useState([]);
		const [aggregateFilterInput, setAggregateFilterInput] = useState("");
		const [tempAggClickData, setTempAggClickData] = useState({
			chartIndex: -1,
			columnIndex: -1,
		});
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

		// get the value of the input (wrapped in usememo because of path prop)
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}
				const v = getValueByPath(data, path);
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}
				return JSON.stringify(v, null, 2);
			});
		}, [data, path]).get();

		const matchedVisualMap = getMatchingVisualMapRow(data);

		function getMatchingVisualMapRow(data) {
			const matchingRow = {};

			// Iterate over each category in VisualMapConstant
			Object.keys(VisualMapConstant).forEach((category) => {
				const items = VisualMapConstant[category];

				// Find the row where the name matches data.option["title"]["text"]
				const foundItem = items.find((item) => {
					return String(item.title) === String(data.variation);
				});

				if (foundItem) {
					matchingRow[category] = foundItem;
				}
			});

			return matchingRow;
		}

		const handleSelectedItem = (item) => {
			selectedItem(item);
			setSelectedColumns({});
			storedColumns.length = 0; // Clear the storedColumns array
			Object.keys(dragdropColumns).forEach((key) => {
				delete dragdropColumns[key];
			});
		};

		useEffect(() => {
			const updatedColumns = { ...selectedColumns };
			storedColumns.forEach((item, index) => {
				const key = `data-tab-drop-area-${index}`;
				if (item.values && item.values.length > 0) {
					updatedColumns[key] = {
						values: item.values,
						dataType: item.dataType,
					};
				}
			});
			if (Object.keys(updatedColumns).length > 0) {
				if (
					JSON.stringify(updatedColumns) !==
					JSON.stringify(selectedColumns)
				) {
					setSelectedColumns({ ...updatedColumns });
				}
			}
		}, [JSON.stringify(storedColumns)]);

		useEffect(() => {
			const updatedColumns = { ...selectedColumns, ...dragdropColumns };

			chart.forEach((item, index) => {
				const key = `data-tab-drop-area-${index}`;
				if (
					!item.multiLabel &&
					updatedColumns[key]?.values?.length > 1
				) {
					// Restrict to only one value if multiLabel is false
					updatedColumns[key] = {
						values: [updatedColumns[key]?.values[0]],
						dataType: [updatedColumns[key]?.dataType[0]],
					};
				}
			});
			if (Object.keys(updatedColumns).length > 0) {
				setSelectedColumns({ ...updatedColumns });
			}
		}, [dragdropColumns]);

		useEffect(() => {
			if (!columnsSelector || columnsSelector.length === 0) {
				return;
			}
			const parsedValue = JSON.parse(computedValue);
			const formattedArray = chart.map((item, index) => {
				let value: string | string[] | undefined;
				if (data.variation === "echart-bar-graph") {
					value = parsedValue[chart[index].label]?.pixelname;
				} else if (data.variation === "echart-gantt-chart") {
					value =
						parsedValue["customSettings"]?.["columnDetails"]?.[
							chart[index].label
						]?.name;
				} else {
					value =
						parsedValue["_state"]?.["fields"]?.[chart[index].label];
				}
				value = value ? (Array.isArray(value) ? value : [value]) : [];
				const selectorsList = [];
				const dataTypeList = [];
				const valueList = [];
				(Array.isArray(value) ? value : []).forEach((col) => {
					const selector = columnsSelector.find(
						(column) => column.name === col,
					);
					if (selector) {
						selectorsList.push(selector.selector);
						dataTypeList.push(selector.dataType);
						valueList.push(selector.name);
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
			formmattedColumns(formattedArray, data.variation);
		}, [columnsSelector.length]);

		useEffect(() => {
			if (!columnsSelector || columnsSelector.length === 0) {
				return;
			}
			const formattedArray = chart.map((item, index) => {
				const key = `data-tab-drop-area-${index}`;
				const value = selectedColumns[key]?.values ?? [];
				const selectorsList = [];
				const dataTypeList = [];
				const valueList = [];

				(Array.isArray(value) ? value : []).forEach((col) => {
					const selector = columnsSelector.find(
						(column) => column.name === col,
					);
					if (selector) {
						selectorsList.push(selector.selector);
						dataTypeList.push(selector.dataType);
						valueList.push(selector.name);
					}
				});
				return {
					name: item.name,
					label: item.label,
					values: selectedColumns[key] || [],
					selectors: selectorsList || [],
					dataType: dataTypeList || [],
				};
			});
			formmattedColumns(formattedArray, data.variation);
		}, [selectedColumns, columnsSelector.length]);

		const handleChangeVisual = (
			value: boolean,
			e: React.MouseEvent<HTMLElement>,
		) => {
			visual(!value);
			setInitialVisual(!value);
			setMenuAnchorEl(e.currentTarget);
		};
		const handleCloseVisual = () => {
			setInitialVisual(false);
			setMenuAnchorEl(null);
		};

		const onAggregateChange = (selectedAggregate: string) => {
			const targetDataType =
				selectedColumns[
					`data-tab-drop-area-${tempAggClickData.chartIndex}`
				]?.dataType;
			if (Array.isArray(targetDataType) && targetDataType.length > 0) {
				targetDataType[tempAggClickData.columnIndex] =
					selectedAggregate;
				setSelectedColumns({
					...selectedColumns,
					[`data-tab-drop-area-${tempAggClickData.chartIndex}`]: {
						...selectedColumns[
							`data-tab-drop-area-${tempAggClickData.chartIndex}`
						],
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
			setTempAggClickData({
				chartIndex,
				columnIndex,
			});
		};

		return (
			<StyledMain>
				<StyledSpanFrame>Selected Frame</StyledSpanFrame>
				<StyledSubSection>
					<Autocomplete
						fullWidth
						//id="Echart-Frame"
						multiple={false}
						disabled={getFrames.status !== "SUCCESS"}
						value={data.frame?.name}
						options={options}
						getOptionLabel={(option) => option}
						onChange={(_, value) => {
							setData(
								"frame.name",
								value as PathValue<D["data"]>,
							);
							setSelectedColumns({});
							syncHeader(value, true); //resets selected columns, stored columns, and block's field data in frameoperations
							setData("columns", [] as PathValue<D["data"]>); // Reset columns when frame changes
						}}
						freeSolo={false}
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder="Select frame"
								size="small"
								variant="outlined"
							/>
						)}
					/>
				</StyledSubSection>
				<StyledSpanFrame>Selected Visual</StyledSpanFrame>
				<StyledSubSection
					onClick={(e) => handleChangeVisual(initialVisual, e)}
				>
					<Autocomplete
						fullWidth
						//id="Echart-Visuals"
						multiple={false}
						disabled={getFrames.status !== "SUCCESS"}
						options={[]} // No options to display in the dropdown
						disablePortal
						PopperComponent={() => null}
						freeSolo={false}
						renderInput={(params) => {
							// Extract the first matching item from matchedVisualMap
							const matchedItem = Object.values(
								matchedVisualMap,
							)[0] as
								| { icon: React.ReactNode; label: string }
								| undefined; // Assuming only one match exists

							return (
								<TextField
									{...params}
									size="small"
									variant="outlined"
									InputProps={{
										...params.InputProps,
										startAdornment: matchedItem ? (
											<StyledMainTextField>
												<StyledMainTextFieldIcon>
													{matchedItem.icon}
												</StyledMainTextFieldIcon>
												<StyledMainTextFieldSpan>
													{matchedItem.label}
												</StyledMainTextFieldSpan>
											</StyledMainTextField>
										) : null,
									}}
								/>
							);
						}}
					/>
				</StyledSubSection>

				{/* Drag and Drop Input Field */}
				{chart.map((item, index) => (
					<StyledDroppable key={item.label || item.name}>
						<StyledLabelSection>
							<StyledSpanLabel>
								Select {item.name}
							</StyledSpanLabel>
							<StyledInfoOutlinedIcon />
						</StyledLabelSection>

						<Droppable droppableId={`data-tab-drop-area-${index}`}>
							{(provided) => (
								<DropContainer
									ref={provided.innerRef}
									{...provided.droppableProps}
								>
									<StyledDropContainerSpan
										multiLabel={item.multiLabel}
									>
										{item.multiLabel
											? "Drag/add one or more dimensions"
											: "Drag one dimension"}
									</StyledDropContainerSpan>
									{item.multiLabel && (
										<StyledAddOutlinedIcon
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
								</DropContainer>
							)}
						</Droppable>
						{Object.entries(selectedColumns)
							.filter(
								([key]) =>
									key === `data-tab-drop-area-${index}`,
							)
							.map(([key, columns]) =>
								(Array.isArray(columns["values"])
									? columns["values"]
									: []
								).map((column, colIndex) => {
									const refId =
										column + colIndex + index + "";
									const aggregatedColumnName = (
										col: string,
									) => {
										if (!item.aggregate) return col;
										if (
											columns["dataType"][colIndex] ===
											"NUMBER"
										)
											return `Average of ${col}`;
										if (
											columns["dataType"][colIndex] ===
											"STRING"
										)
											return `Count of ${col}`;
										return (
											columns["dataType"][colIndex] +
											" of " +
											col
										);
									};
									return (
										<StyledMainReturnDiv
											key={column}
											id={refId}
										>
											<span>
												{aggregatedColumnName(column)}
											</span>
											<div>
												{item.aggregate && (
													<StyledArrowDropDown
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

												<StyledCloseOutlinedIcon
													onClick={() => {
														// Remove the column from dragdropColumns
														const updatedColumns = {
															...selectedColumns,
														};
														const currentValues =
															Array.isArray(
																updatedColumns[
																	key
																]?.values,
															)
																? updatedColumns[
																		key
																	]?.values
																: [];
														updatedColumns[key] = {
															...updatedColumns[
																key
															],
															values: currentValues.filter(
																(_, i) =>
																	i !==
																	colIndex,
															),
														};
														const values =
															updatedColumns[key]
																?.values;
														if (
															Array.isArray(
																values,
															) &&
															values.length === 0
														) {
															delete updatedColumns[
																key
															];
														}
														setSelectedColumns(
															updatedColumns,
														);
														deleteColumns(
															column,
															key,
														);
													}}
												/>
											</div>
										</StyledMainReturnDiv>
									);
								}),
							)}
					</StyledDroppable>
				))}
				<StyledSwitchSection>
					<Switch
						checked={checkedInstruction}
						onChange={(
							event: React.ChangeEvent<HTMLInputElement>,
						) => setCheckedInstruction(event.target.checked)}
						size="small"
						inputProps={{ "aria-label": "controlled" }}
					/>
					<StyledSpanSwitch>Show All Instruction</StyledSpanSwitch>
				</StyledSwitchSection>
				<StyledSwitchSection>
					<Switch
						checked={checkedVisual}
						onChange={(
							event: React.ChangeEvent<HTMLInputElement>,
						) => setCheckedVisual(event.target.checked)}
						size="small"
						inputProps={{ "aria-label": "controlled" }}
					/>
					<StyledSpanSwitch>Auto Visualize</StyledSpanSwitch>
				</StyledSwitchSection>
				<div>
					<Popover
						id={"visual-popover"}
						open={initialVisual}
						onClose={() => {
							setInitialVisual(false);
						}}
						anchorEl={menuAnchorEl}
						anchorReference="anchorPosition" // <-- THIS is the key
						anchorPosition={{
							top: window.innerHeight * 0.14,
							left: window.innerWidth * 0.51,
						}}
					>
						<VisualMap
							selectedItem={handleSelectedItem}
							handleClose={handleCloseVisual}
						/>
					</Popover>
				</div>
				<div>
					<Popover
						id={"instruction-popover"}
						open={Boolean(aggregateMenuAnchorEl)}
						onClose={() => {
							setAggregateFilterInput("");
							setAggregateMenuAnchorEl(null);
						}}
						anchorEl={aggregateMenuAnchorEl}
						anchorOrigin={{
							vertical: "bottom",
							horizontal: "left",
						}}
						transformOrigin={{
							vertical: "top",
							horizontal: "left",
						}}
						sx={{
							"& .MuiPaper-root": {
								padding: "0.5rem",
								borderRadius: "8px",
								width: aggregateMenuAnchorEl?.offsetWidth,
							},
						}}
					>
						<TextField
							placeholder="Search"
							variant="standard"
							size="small"
							fullWidth
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
								<Menu.Item
									key={key}
									value={key}
									onClick={() => {
										if (key === "Maximum") key = "Max";
										if (key === "Minimum") key = "Min";
										setAggregateMenuAnchorEl(null);
										onAggregateChange(key);
									}}
								>
									{key}
								</Menu.Item>
							))}
						</div>
					</Popover>
				</div>
			</StyledMain>
		);
	},
);
