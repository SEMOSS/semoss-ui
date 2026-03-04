import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type BlockDef,
	type Block,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type PathValue,
	type Paths,
} from "@semoss/renderer";
import { Button, Select, styled, Typography } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import { BAR_CHART_DATA, LINE_CHART_DATA } from "../../Visualization.constants";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	path: Paths<Block<D>["data"], 4>;

	chartType: string;
}

//styled select field with width to 100%
const StyledSelect = styled(Select)(() => ({
	width: "100%",
}));

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

const StyledAxis = styled("div")<{
	display?: string;
	justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
	display: display ?? undefined,
	justifyContent: justifyContent ?? undefined,
	flexDirection: "row",
}));

export const ToggleTrendline = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
		chartType,
	}: JsonSettingsProps<D>) => {
		const [toggleTrendlines, setToggleTrendlines] = useState<string>(""); //contains toggle trendlines tool state
		const { data, setData } = useBlockSettings<D>(id); //chart block data and setdata
		const [value, setValue] = useState("");
		//different trendlines option to draw lines over bar graph in different format
		const trendLineOptions = [
			{ label: "Smooth", value: "smooth" },
			{ label: "Exact", value: "exact" },
			{ label: "Step(Start)", value: "step_start" },
			{ label: "Step(Middle)", value: "step_middle" },
			{ label: "Step(End)", value: "step_end" },
		];
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
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
		//update the value, when data is changed
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue, data]);
		//handles initial setting of toggle trendlines data
		useEffect(() => {
			if (BAR_CHART_DATA.JSONVALUE.includes(chartType)) {
				const seriesIndex = data.option["series"].findIndex(
					(op) =>
						LINE_CHART_DATA.JSONVALUE.includes(op.type) &&
						Object.hasOwn(op, "toggleTrendLineObject"),
				);
				if (seriesIndex > -1) {
					const trendLineOptions = data.option["series"][seriesIndex];
					if (trendLineOptions.smooth) {
						setToggleTrendlines("smooth");
					}
					if (
						trendLineOptions.smooth === false &&
						(!Object.hasOwn(trendLineOptions, "step") ||
							trendLineOptions.step === false)
					) {
						setToggleTrendlines("exact");
					}
					if (
						Object.hasOwn(trendLineOptions, "step") &&
						trendLineOptions.step !== false
					) {
						if (trendLineOptions.step === "start") {
							setToggleTrendlines("step_start");
						} else if (trendLineOptions.step === "middle") {
							setToggleTrendlines("step_middle");
						} else {
							setToggleTrendlines("step_end");
						}
					}
				}
			}
		}, []);
		// when toggle trendline option is changed, below method will be called
		function handleToggleTrendLine(e) {
			setToggleTrendlines((prevTrendLine) => {
				return e.target.value;
			});
		}
		//getting the indexes for drawing lines over bar chart
		function getFilteredSeriesIndex(): number[] {
			const index: number[] = [];
			const seriesAvailable: any[] = data.option["series"].filter(
				(item) => BAR_CHART_DATA.JSONVALUE.includes(item.type),
			);
			seriesAvailable.forEach((item, seriesIndex) => {
				index.push(seriesIndex);
			});
			return index;
		}
		//update chart data when toggle trendlines is changed and execute button is clicked
		function updateChartData(trendLinesSelected: string) {
			let option = typeof value === "string" ? JSON.parse(value) : value;
			let optionUpdated = option;
			const filteredSeries = getFilteredSeriesIndex();
			if (trendLinesSelected != "") {
				filteredSeries.forEach((item) => {
					const displayPositionIndex: number = item;
					const lineAlreadyExists = option["series"].findIndex(
						(opt) =>
							Object.hasOwn(opt, "toggleTrendLineObject") &&
							LINE_CHART_DATA.JSONVALUE.includes(opt.type) &&
							(Object.hasOwn(opt, "sourceObjectIndex")
								? opt.sourceObjectIndex === displayPositionIndex
								: true),
					);
					let trendLinesData = {};
					if (["smooth", "exact"].includes(trendLinesSelected)) {
						trendLinesData = {
							...trendLinesData,
							["smooth"]:
								trendLinesSelected === "smooth" ? true : false,
						};
					}
					if (trendLinesSelected.startsWith("step")) {
						trendLinesData = {
							...trendLinesData,
							["step"]: trendLinesSelected.split("_")[1] ?? false,
						};
					}
					if (lineAlreadyExists >= 0 && displayPositionIndex >= 0) {
						option["series"][lineAlreadyExists] = {
							...option["series"][lineAlreadyExists],
							...trendLinesData,
							["data"]:
								option["series"][displayPositionIndex]["data"],
						};
					}

					if (displayPositionIndex > -1 && lineAlreadyExists == -1) {
						const toggleLineData = {
							...trendLinesData,
							name: `Trendline: ${option["series"][displayPositionIndex]["name"]}`,
							data:
								option["series"][displayPositionIndex][
									"data"
								] || [],
							type: "line",
							toggleTrendLineObject: true,
							sourceObjectIndex: displayPositionIndex,
							symbol: "circle",
							symbolSize: 6,
							zLevel: 10,
							z: 1,
							clip: false,
							lineStyle: {
								type: "dashed",
								width: 2,
							},
						};

						option["series"] = [
							...option["series"],
							toggleLineData,
						];
					}
				});
				option = {
					...option,
					["customSettings"]: {
						...option["customSettings"],
						["toolsUpdated"]: true,
					},
				};
				runStateUpdate(option);
			} else {
				const displayPositionData = option["series"].filter(
					(item) =>
						item.type === "line" &&
						Object.hasOwn(item, "toggleTrendLineObject"),
				);
				runDisplayPositionData(displayPositionData);
			}
			optionUpdated = option;
		}
		//setting value of line chart to null when no trendline option is selected
		function runDisplayPositionData(displayPositionData) {
			let option = typeof value === "string" ? JSON.parse(value) : value;
			const seriesOption = option["series"];
			seriesOption.forEach((seriesItem, seriesIndex) => {
				if (
					seriesItem.type === "line" &&
					Object.hasOwn(seriesItem, "toggleTrendLineObject")
				) {
					const lineData = [];
					seriesItem["data"].forEach((seriesData) => {
						lineData.push(null);
					});
					option["series"][seriesIndex]["data"] = lineData;
				}
			});
			option = {
				...option,
				["customSettings"]: {
					...option["customSettings"],
					["toolsUpdated"]: true,
				},
			};
			runStateUpdate(option);
			removeLineObject();
		}
		//removing the line object when the series is updated line type and toggleTrendlineObject
		function removeLineObject() {
			setTimeout(() => {
				const option =
					typeof value === "string" ? JSON.parse(value) : value;
				const displayPositionData = option["series"].filter(
					(item) =>
						!(
							item.type === "line" &&
							Object.hasOwn(item, "toggleTrendLineObject")
						),
				);
				option["series"] = displayPositionData;
				runStateUpdate(option);
			}, 300);
		}
		//running the option update of a chart
		function runStateUpdate(updatedOption) {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			timeoutRef.current = setTimeout(() => {
				try {
					setData(
						path,
						updatedOption as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		}
		const trendlineData = (
			<StyledAxis>
				<StyledAxisColDiv display="flex" justifyContent="flex-start">
					<Typography variant="body2" color="secondary">
						Trendlines Toggle
					</Typography>
					<StyledSelect
						size="small"
						onChange={handleToggleTrendLine}
						id="showTrendLine"
						label="Trendline Toggle"
						value={toggleTrendlines}
					>
						<Select.Item value={""} key="-1">
							No Trendline
						</Select.Item>
						{trendLineOptions.map((trendOption, index) => {
							return (
								<Select.Item
									value={trendOption.value}
									key={index}
								>
									{trendOption.label}
								</Select.Item>
							);
						})}
					</StyledSelect>
				</StyledAxisColDiv>
				<StyledAxisDiv justifyContent="center" display="flex">
					<Button
						type="button"
						color="primary"
						onClick={() => updateChartData(toggleTrendlines)}
					>
						Update TrendLine
					</Button>
				</StyledAxisDiv>
			</StyledAxis>
		);
		return <>{trendlineData}</>;
	},
);
