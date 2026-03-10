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

// Axis div styling for switch type fields, to show labels and fields in a row
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
// Axis div styling for input type fields, to show labels and fields in a column
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
// Axis div styling for span type fields
const StyledAxisSpan = styled("span")<{
	display?: string;
	justifyContent?: string;
	width?: string;
}>(({ display, justifyContent, width }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	width: width ?? undefined,
}));
// Axis div styling for text fields
const StyledTextField = styled(TextField)(({ theme }) => ({
	width: "100%",
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.primary,
}));

//Changing the X axis styling like title, rotate and changing the labels
export const EditXAxis = observer(
	<D extends BlockDef = BlockDef>({ option, id, path }) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [xAxisDataUpdated, setXAxisDataUpdated] = useState<
			"initial" | "updated"
		>("initial");
		const [value, setValue] = useState(data.option);
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
		// Store the initial value of xAxis.name in a ref to persist it across renders
        const initialXAxisNameRef = useRef(data.option.xAxis["name"]);

        // Use the initial value from the ref
        const storedValue = initialXAxisNameRef.current;
		
		//Initial xaxis state used for restoring
		const INITIAL_XAXIS_STATE = {
			showAxis: true,
			showAxisTitle: true,
			xaxistitle: storedValue,
			xaxisTitleFontSize: 12,
			showXAxisLineTicks: false,
			showXAxisLabels: true,
			labelFontSize: 12,
			rotate: 0,
			rotateLabelMinValue: 0,
			rotateLabelMaxValue: 360,
			showxAxisZoom: false,
			axisGap: 25, // gap between axis and axis title
		};
		const [xaxisState, setXaxisState] = useState(INITIAL_XAXIS_STATE);
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
		//when the computed value is changed, local state is updated
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
		//updating the initial local state, based on the existing state store
		useEffect(() => {
			const axis = "xAxis";
			const xAxisStateData = {
				showAxis: true,
				showAxisTitle: true,
				xaxistitle: data.option[axis]["name"],
				xaxisTitleFontSize: 12,
				showXAxisLineTicks: false,
				showXAxisLabels: true,
				labelFontSize: 12,
				rotate: 0,
				rotateLabelMinValue: 0,
				rotateLabelMaxValue: 360,
				showxAxisZoom: false,
				axisGap: 25, // gap between axis and axis title
			};
			if (Object.hasOwn(option, axis) && option[axis]) {
				xAxisStateData.xaxistitle = Object.hasOwn(option[axis], "name")
					? option[axis]["name"]
					: "";

				if (Object.hasOwn(option[axis], "axisTick")) {
					xAxisStateData.showXAxisLineTicks = Object.hasOwn(
						option[axis]["axisTick"],
						"show",
					)
						? option[axis]["axisTick"].show
						: false;
				}
				if (Object.hasOwn(option[axis], "axisLabel")) {
					xAxisStateData.labelFontSize = Object.hasOwn(
						option[axis]["axisLabel"],
						"fontSize",
					)
						? option[axis]["axisLabel"]["fontSize"]
						: 12;
					xAxisStateData.rotate = Object.hasOwn(
						option[axis]["axisLabel"],
						"rotate",
					)
						? option[axis]["axisLabel"]["rotate"]
						: 0;
				}
			}
			setXaxisState((prevState) => {
				return {
					...prevState,
					...xAxisStateData,
				};
			});
		}, []);
		//when the x axis fields are updated, then the chart data will be updated to store
		useEffect(() => {
			if (xAxisDataUpdated === "updated") {
				updateChartData();
			}
		}, [xaxisState]);
		//when y axis fields are updated, then respective state is updated to trigger the update to store
		function handleInputChange(e, title, directVal = undefined) {
			if (xAxisDataUpdated === "initial") setXAxisDataUpdated("updated");
			if (directVal !== undefined) {
				setXaxisState((prevXaxisState) => {
					return {
						...prevXaxisState,
						[title]: directVal,
					};
				});
			} else {
				setXaxisState((prevXaxisState) => {
					return {
						...prevXaxisState,
						[title]: e.target.value,
					};
				});
			}
		}
		// updating the chart data, when x axis fields are getting updated
		function updateChartData() {
			const axisData = {
				showAxis: xaxisState.showAxis,
				showAxisTitle: xaxisState.showAxisTitle,
				xaxistitle: xaxisState.xaxistitle,
				xaxisTitleFontSize: xaxisState.xaxisTitleFontSize,
				showXAxisLabels: xaxisState.showXAxisLabels,
				labelFontSize: xaxisState.labelFontSize,
				rotate: xaxisState.rotate,
				showXAxisLineTicks: xaxisState.showXAxisLineTicks,
				showxAxisZoom: xaxisState.showxAxisZoom,
				axisGap: xaxisState.axisGap,
			};
			let option = typeof value === "string" ? JSON.parse(value) : value;
			//update the chart data based on the changes in the x axis fields
			let optionUpdated = option;
			if (Object.hasOwn(option, "xAxis") && option["xAxis"]) {
				if (axisData.showAxisTitle) {
					if (Object.hasOwn(axisData, "xaxistitle")) {
						option["xAxis"] = {
							...option["xAxis"],
							["name"]: axisData.xaxistitle,
						};
					}
					if (Object.hasOwn(axisData, "xaxisTitleFontSize")) {
						option["xAxis"] = {
							...option["xAxis"],
							["nameTextStyle"]: {
								...option["xAxis"]["nameTextStyle"],
								["fontSize"]:
									Number(axisData.xaxisTitleFontSize) ||
									undefined,
							},
						};
					}
				} else {
					option["xAxis"] = {
						...option["xAxis"],
						["name"]: "",
					};
				}

				if (Object.hasOwn(axisData, "showXAxisLineTicks")) {
					option["xAxis"] = {
						...option["xAxis"],
						["axisTick"]: {
							...option["xAxis"]["axisTick"],
							["show"]: axisData.showXAxisLineTicks,
							["alignWithLabel"]: axisData.showXAxisLineTicks,
						},
					};
				}

				if (Object.hasOwn(axisData, "showXAxisLabels")) {
					option["xAxis"] = {
						...option["xAxis"],
						["axisLabel"]: {
							...option["xAxis"]["axisLabel"],
							["show"]: axisData.showXAxisLabels,
						},
					};
				}

				if (Object.hasOwn(axisData, "labelFontSize")) {
					option["xAxis"] = {
						...option["xAxis"],
						["axisLabel"]: {
							...option["xAxis"]["axisLabel"],
							["show"]: option["xAxis"]["axisLabel"]["show"],
							["fontSize"]:
								Number(axisData.labelFontSize) || undefined,
						},
					};
				}
				if (Object.hasOwn(axisData, "rotate")) {
					option["xAxis"] = {
						...option["xAxis"],
						["axisLabel"]: {
							...option["xAxis"]["axisLabel"],
							["show"]: option["xAxis"]["axisLabel"]["show"],
							["rotate"]: axisData.rotate,
						},
					};
				}
				if (Object.hasOwn(axisData, "showxAxisZoom")) {
					if (option["dataZoom"]) {
						const xAxisPosition = option["dataZoom"].findIndex(
							(opt) => Object.hasOwn(opt, "xAxisIndex"),
						);
						if (xAxisPosition > -1) {
							option["dataZoom"][xAxisPosition].show =
								axisData.showxAxisZoom;
						} else {
							option["dataZoom"].push({
								type: "slider",
								xAxisIndex: [0],
								show: axisData.showxAxisZoom,
							});
						}
					}
					if (Object.hasOwn(axisData, "axisGap")) {
						option["xAxis"] = {
							...option["xAxis"],
							["nameGap"]: Number(axisData.axisGap) || undefined,
						};
					} else {
						option = {
							...option,
							["dataZoom"]: {
								show: axisData.showxAxisZoom,
								type: "slider",
								xAxisIndex: [0],
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
		//resetting the x axis fields to initial state when reset button is clicked
		function resetToInitialState() {
			setXaxisState(INITIAL_XAXIS_STATE);
		}
		//run state store update, when a change in the fields is detected
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

		const accordionDetails = (
			<StyledAxis>
				<StyledAxisDiv
					display="flex"
					justifyContent="flex-start"
					gap="8px"
				>
					<Switch
						size="small"
						defaultChecked={xaxisState.showAxisTitle ?? undefined}
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
				{xaxisState.showAxisTitle && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="space-around"
					>
						<Typography variant="body2" color="secondary">
							Set Axis Title
						</Typography>
						<StyledTextField
							size="small"
							value={xaxisState.xaxistitle}
							onChange={(e) => handleInputChange(e, "xaxistitle")}
						/>
					</StyledAxisColDiv>
				)}
				{xaxisState.showAxisTitle && (
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
							value={xaxisState.xaxisTitleFontSize}
							onChange={(e) =>
								handleInputChange(e, "xaxisTitleFontSize")
							}
						/>
					</StyledAxisColDiv>
				)}
				{xaxisState.showAxisTitle && (
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
							value={xaxisState.axisGap}
							onChange={(e) => handleInputChange(e, "axisGap")}
						/>
					</StyledAxisColDiv>
				)}
				<StyledAxisDiv display="flex" justifyContent="flex-start">
					<Switch
						size="small"
						defaultChecked={xaxisState.showXAxisLabels ?? undefined}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							handleInputChange(
								e,
								"showXAxisLabels",
								e.target.checked,
							)
						}
						title="Show XAxis Labels"
					/>
					<StyledTypography variant="body2">
						Show XAxis Labels
					</StyledTypography>
				</StyledAxisDiv>
				{xaxisState.showXAxisLabels && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="space-around"
					>
						<Typography variant="body2" color="secondary">
							Edit Label Font Size:
						</Typography>
						<StyledTextField
							size="small"
							value={xaxisState.labelFontSize}
							type="number"
							onChange={(e) =>
								handleInputChange(e, "labelFontSize")
							}
						/>
					</StyledAxisColDiv>
				)}
				{xaxisState.showXAxisLabels && (
					<StyledAxisColDiv
						display="flex"
						justifyContent="space-around"
					>
						<Typography variant="body2" color="secondary">
							Rotate X-Axis Values:
						</Typography>
						<Slider
							size="small"
							aria-label="Always visible"
							value={xaxisState.rotate}
							min={xaxisState.rotateLabelMinValue}
							max={xaxisState.rotateLabelMaxValue}
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
							<span>{xaxisState.rotateLabelMinValue}</span>
							<span>{xaxisState.rotateLabelMaxValue}</span>
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
						defaultChecked={
							xaxisState.showXAxisLineTicks ?? undefined
						}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							handleInputChange(
								e,
								"showXAxisLineTicks",
								e.target.checked,
							)
						}
						title="Show XAxis Line Ticks"
					/>
					<StyledTypography variant="body2">
						Show XAxis Line Ticks
					</StyledTypography>
				</StyledAxisDiv>
				<StyledAxisDiv
					display="flex"
					justifyContent="flex-start"
					gap="8px"
				>
					<Switch
						size="small"
						checked={xaxisState.showxAxisZoom ?? undefined}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							handleInputChange(
								e,
								"showxAxisZoom",
								e.target.checked,
							)
						}
						title="Show / Hide X-Axis Zoom"
					/>
					<StyledTypography variant="body2">
						Show / Hide X-Axis Zoom
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
