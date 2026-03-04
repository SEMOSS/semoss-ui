import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
	type BlockDef,
	type EchartVisualizationBlockConfig,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type PathValue,
} from "@semoss/renderer";
import {
	Button,
	Slider,
	Switch,
	styled,
	TextField,
	Typography,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";

//Axis div for switch type fields
const StyledAxisDiv = styled("div")<{
	display?: string;
	justifyContent?: string;
	gap?: string;
}>(({ theme, display, justifyContent, gap }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "row",
	padding: "8px 16px",
	alignItems: "center",
	gap: gap ?? undefined,
}));

const StyledAxis = styled("div")<{
	display?: string;
	justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "row",
}));

//Axis div for input type fields with label
const StyledAxisColDiv = styled("div")<{
	display?: string;
	justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "column",
	padding: "8px 16px",
	gap: "8px",
}));

//Axis div for span type elements
const StyledAxisSpan = styled("span")<{
	display?: string;
	justifyContent?: string;
	width?: string;
}>(({ display, justifyContent, width }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	width: width ?? undefined,
}));

//text field styling to have 100% width
const StyledTextField = styled(TextField)(({ theme }) => ({
	width: "100%",
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.primary,
}));

//Changing the Y axis styling like title, rotate and changing the labels
export const EditYAxis = observer(
	<D extends BlockDef = BlockDef>({ option, id, path }) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [yAxisDataUpdated, setYAxisDataUpdated] = useState<
			"initial" | "updated"
		>("initial");
		const [value, setValue] = useState(data.option);
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
		// Store the initial value of yAxis.name in a ref to persist it across renders
		const initialXAxisNameRef = useRef(data.option.yAxis["name"]);

		// Use the initial value from the ref
		const storedValue = initialXAxisNameRef.current;
		//Initial y axis state for maintaining, restoring y axis fields
		const INITIAL_YAXIS_STATE = {
			showAxis: true,
			yaxistitle: storedValue, 
			showAxisTitle: true, 
			yaxisTitleFontSize: 12,
			showYAxisLineTicks: false, 
			showYAxisLabels: true,
			labelFontSize: 12, 
			rotate: 0, 
			rotateLabelMinValue: 0,
			rotateLabelMaxValue: 360,
			showYAxisZoom: true,
			truncateCharCount: 0,
			axisGap: 25,
		};

		const [yaxisState, setYaxisState] = useState(INITIAL_YAXIS_STATE);
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
		//update the value when computed value is updated
		useEffect(() => {
			try {
				setValue(
					typeof computedValue === "string"
						? JSON.parse(computedValue)
						: computedValue,
				);
			} catch {
				setValue({});
			}
		}, [computedValue]);
		//updating initial state of y axis fields, when the component is mounted
		useEffect(() => {
			const axis = "yAxis";
			const yAxisStateData = {
				showAxis: true,
				showAxisTitle: true,
				yaxistitle: "",
				yaxisTitleFontSize: 12,
				showYAxisLineTicks: false,
				showYAxisLabels: true,
				labelFontSize: 12,
				rotate: 0,
				rotateLabelMinValue: 0,
				rotateLabelMaxValue: 360,
				showYAxisZoom: true,
				truncateCharCount: 0,
				axisGap: 25,
			};
			if (Object.hasOwn(option, axis) && option[axis]) {
				yAxisStateData.yaxistitle = Object.hasOwn(option[axis], "name")
					? option[axis]["name"]
					: "";
				if (Object.hasOwn(option[axis], "axisTick")) {
					yAxisStateData.showYAxisLineTicks = Object.hasOwn(
						option[axis]["axisTick"],
						"show",
					)
						? option[axis]["axisTick"].show
						: false;
				}
				if (Object.hasOwn(option[axis], "axisLabel")) {
					yAxisStateData.labelFontSize = Object.hasOwn(
						option[axis]["axisLabel"],
						"fontSize",
					)
						? option[axis]["axisLabel"]["fontSize"]
						: 12;
					yAxisStateData.rotate = Object.hasOwn(
						option[axis]["axisLabel"],
						"rotate",
					)
						? option[axis]["axisLabel"]["rotate"]
						: 0;
				}
				if (option["dataZoom"]) {
					const yAxisPosition = option["dataZoom"].findIndex((opt) =>
						Object.hasOwn(opt, "yAxisIndex"),
					);
					if (yAxisPosition > -1) {
						yAxisStateData.showYAxisZoom = Object.hasOwn(
							option["dataZoom"][yAxisPosition],
							"show",
						)
							? option["dataZoom"][yAxisPosition].show
							: false;
						console.log(
							"yaxiszoom",
							Object.hasOwn(
								option["dataZoom"][yAxisPosition],
								"show",
							),
							option["dataZoom"][yAxisPosition].show,
							false,
						);
					}
				}
			}
			setYaxisState((prevState) => {
				return {
					...prevState,
					...yAxisStateData,
				};
			});
		}, []);
		//updating the chart data, when any of the yaxis fields in this component is changed
		useEffect(() => {
			if (yAxisDataUpdated === "updated") {
				updateChartData();
			}
		}, [yaxisState]);
		//reset the y axis component to initial state for restoring
		function resetToInitialState() {
			setYaxisState(INITIAL_YAXIS_STATE);
		}
		//updating the chart data to state, when any of the y axis field is updated
		function updateChartData() {
			const axis = "yAxis"; //an axis pointer, either x or y axis
			const axisData = {
				showAxis: yaxisState.showAxis,
				showAxisTitle: yaxisState.showAxisTitle,
				yaxistitle: yaxisState.yaxistitle,
				yaxisTitleFontSize: yaxisState.yaxisTitleFontSize,
				showYAxisLabels: yaxisState.showYAxisLabels,
				labelFontSize: yaxisState.labelFontSize,
				rotate: yaxisState.rotate,
				showYAxisLineTicks: yaxisState.showYAxisLineTicks,
				showYAxisZoom: yaxisState.showYAxisZoom,
				truncateCharCount: yaxisState.truncateCharCount,
				axisGap: yaxisState.axisGap,
			};
			let option = typeof value === "string" ? JSON.parse(value) : value;
			let optionUpdated = option;
			//when a property is available, the respective values in the option is updated and state is also updated
			if (Object.hasOwn(option, axis) && option[axis]) {
				if (axisData.showAxisTitle) {
					if (Object.hasOwn(axisData, "yaxistitle")) {
						option[axis] = {
							...option[axis],
							["name"]: axisData.yaxistitle,
						};
					}
					if (Object.hasOwn(axisData, "yaxisTitleFontSize")) {
						option[axis] = {
							...option[axis],
							["nameTextStyle"]: {
								...option[axis]["nameTextStyle"],
								["fontSize"]:
									Number(axisData.yaxisTitleFontSize) ||
									undefined,
							},
						};
					}
					if (Object.hasOwn(axisData, "truncateCharCount")) {
						option[axis] = {
							...option[axis],
							nameTruncate: {
								...option[axis]?.nameTruncate,
								maxWidth:
									Number(axisData.truncateCharCount) ||
									undefined,
							},
						};
					}
					if (Object.hasOwn(axisData, "axisGap")) {
						option[axis] = {
							...option[axis],
							["nameGap"]: Number(axisData.axisGap) || undefined,
						};
					}
				} else {
					option["yAxis"] = {
						...option["yAxis"],
						["name"]: "",
					};
				}

				if (Object.hasOwn(axisData, "showYAxisLineTicks")) {
					option[axis] = {
						...option[axis],
						["axisTick"]: {
							...option[axis]["axisTick"],
							["show"]: axisData.showYAxisLineTicks,
							["alignWithLabel"]: axisData.showYAxisLineTicks,
						},
					};
				}

				if (Object.hasOwn(axisData, "showYAxisLabels")) {
					option[axis] = {
						...option[axis],
						["axisLabel"]: {
							...option[axis]["axisLabel"],
							["show"]: axisData.showYAxisLabels,
						},
					};
				}

				if (Object.hasOwn(axisData, "labelFontSize")) {
					option[axis] = {
						...option[axis],
						["axisLabel"]: {
							...option[axis]["axisLabel"],
							["show"]: option[axis]["axisLabel"]["show"],
							["fontSize"]:
								Number(axisData.labelFontSize) || undefined,
						},
					};
				}
				if (Object.hasOwn(axisData, "rotate")) {
					option[axis] = {
						...option[axis],
						["axisLabel"]: {
							...option[axis]["axisLabel"],
							["show"]: option[axis]["axisLabel"]["show"],
							["rotate"]: axisData.rotate,
						},
					};
				}
				if (Object.hasOwn(axisData, "showYAxisZoom")) {
					if (option["dataZoom"]) {
						const xAxisPosition = option["dataZoom"].findIndex(
							(opt) => Object.hasOwn(opt, "yAxisIndex"),
						);
						if (xAxisPosition > -1) {
							option["dataZoom"][xAxisPosition].show =
								axisData.showYAxisZoom;
						} else {
							option["dataZoom"].push({
								type: "slider",
								yAxisIndex: [0],
								show: axisData.showYAxisZoom,
							});
						}
					} else {
						option = {
							...option,
							["dataZoom"]: {
								show: axisData.showYAxisZoom,
								type: "slider",
								yAxisIndex: [0],
							},
						};
					}
				}
				option = {
					...option,
					["customSettings"]: {
						...option["customSettings"],
						["toolsUpdated"]: true,
					},
				};
				optionUpdated = option;
				runStateUpdateCustom(optionUpdated);
			}
		}
		//updating the state, after y axis fields are updated
		function runStateUpdateCustom(
			optionUpdated: typeof EchartVisualizationBlockConfig.data.option,
		) {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			timeoutRef.current = setTimeout(() => {
				try {
					setData(
						"option",
						optionUpdated as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		}
		//updating y axis state, when y axis fields are changed
		function handleInputChange(e, title, directVal = undefined) {
			if (yAxisDataUpdated === "initial") setYAxisDataUpdated("updated");
			if (directVal !== undefined) {
				setYaxisState((prevXaxisState) => {
					return {
						...prevXaxisState,
						[title]: directVal,
					};
				});
			} else {
				setYaxisState((prevXaxisState) => {
					return {
						...prevXaxisState,
						[title]: e.target.value,
					};
				});
			}
		}
		// component html data
		const accordionDetails = (
			<StyledAxis>
				<StyledAxisDiv
					display="flex"
					justifyContent="flex-start"
					gap="8px"
				>
					<Switch
						size="small"
						defaultChecked={yaxisState.showAxisTitle ?? undefined}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							handleInputChange(
								e,
								"showAxisTitle",
								e.target.checked,
							)
						}
						title="Show Axis Title"
					/>
					<StyledTypography variant="body2">
						Show Axis Title
					</StyledTypography>
				</StyledAxisDiv>
				{yaxisState.showAxisTitle && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="flex-start"
					>
						<Typography variant="body2" color="secondary">
							Set Axis Title
						</Typography>
						<StyledTextField
							size="small"
							value={yaxisState.yaxistitle}
							onChange={(e) => handleInputChange(e, "yaxistitle")}
						/>
					</StyledAxisColDiv>
				)}
				{yaxisState.showAxisTitle && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="space-around"
					>
						<Typography variant="body2" color="secondary">
							Edit Axis Title Font Size
						</Typography>
						<TextField
							size="small"
							type="number"
							value={yaxisState.yaxisTitleFontSize}
							onChange={(e) =>
								handleInputChange(e, "yaxisTitleFontSize")
							}
						/>
					</StyledAxisColDiv>
				)}
				{yaxisState.showAxisTitle && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="space-around"
					>
						<Typography variant="body2" color="secondary">
							Truncate Characters Length(Pixel):
						</Typography>
						<TextField
							size="small"
							type="number"
							value={yaxisState.truncateCharCount}
							onChange={(e) =>
								handleInputChange(e, "truncateCharCount")
							}
						/>
					</StyledAxisColDiv>
				)}
				{yaxisState.showAxisTitle && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="space-around"
					>
						<Typography variant="body2" color="secondary">
							Axis Gap
						</Typography>
						<TextField
							size="small"
							type="number"
							value={yaxisState.axisGap}
							onChange={(e) => handleInputChange(e, "axisGap")}
						/>
					</StyledAxisColDiv>
				)}

				<StyledAxisDiv
					display="flex"
					justifyContent="flex-start"
					gap="8px"
				>
					<Switch
						size="small"
						defaultChecked={yaxisState.showYAxisLabels ?? undefined}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							handleInputChange(
								e,
								"showYAxisLabels",
								e.target.checked,
							)
						}
						title="Show YAxis Labels"
					/>
					<StyledTypography variant="body2">
						Show YAxis Labels
					</StyledTypography>
				</StyledAxisDiv>
				{yaxisState.showYAxisLabels && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="space-around"
					>
						<Typography variant="body2" color="secondary">
							Edit Label Font Size:
						</Typography>
						<StyledTextField
							size="small"
							value={yaxisState.labelFontSize}
							type="number"
							onChange={(e) =>
								handleInputChange(e, "labelFontSize")
							}
						/>
					</StyledAxisColDiv>
				)}
				{yaxisState.showYAxisLabels && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="space-between"
					>
						<Typography variant="body2">
							Rotate Y-Axis Values:
						</Typography>
						<Slider
							size="small"
							aria-label="Always visible"
							value={yaxisState.rotate}
							min={yaxisState.rotateLabelMinValue}
							max={yaxisState.rotateLabelMaxValue}
							valueLabelDisplay="on"
							onChange={(event, newValue) =>
								handleInputChange(event, "rotate", newValue)
							}
						/>
						<StyledAxisSpan
							display="flex"
							width="100%"
							justifyContent="space-between"
						>
							<span>{yaxisState.rotateLabelMinValue}</span>
							<span>{yaxisState.rotateLabelMaxValue}</span>
						</StyledAxisSpan>
					</StyledAxisColDiv>
				)}

				<StyledAxisDiv
					display="flex"
					justifyContent="flex-start"
					gap="8px"
				>
					<Switch
						size="small"
						defaultChecked={yaxisState.showYAxisLineTicks}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							handleInputChange(
								e,
								"showYAxisLineTicks",
								e.target.checked,
							)
						}
						title="Show YAxis Line Ticks"
					/>
					<StyledTypography variant="body2">
						Show YAxis Line Ticks
					</StyledTypography>
				</StyledAxisDiv>

				<StyledAxisDiv
					display="flex"
					justifyContent="flex-start"
					gap="8px"
				>
					<Switch
						size="small"
						checked={yaxisState.showYAxisZoom ?? undefined}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							handleInputChange(
								e,
								"showYAxisZoom",
								e.target.checked,
							)
						}
						title="Show / Hide Y-Axis Zoom"
					/>
					<StyledTypography variant="body2">
						Show / Hide Y-Axis Zoom
					</StyledTypography>
				</StyledAxisDiv>
				<StyledAxisDiv justifyContent="end" display="flex">
					<Button
						color="primary"
						variant="contained"
						onClick={resetToInitialState}
					>
						Reset
					</Button>
				</StyledAxisDiv>
			</StyledAxis>
		);
		return <>{accordionDetails}</>;
	},
);
