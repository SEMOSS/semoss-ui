import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type BlockDef,
	type EchartVisualizationBlockConfig,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type PathValue,
} from "@semoss/renderer";
import { Button, Input, Slider, Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

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
		const initialXAxisNameRef = useRef(data.option.xAxis.name);

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
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const axis = "xAxis";
			const xAxisStateData = {
				showAxis: true,
				showAxisTitle: true,
				xaxistitle: data.option[axis].name,
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
					? option[axis].name
					: "";

				if (Object.hasOwn(option[axis], "axisTick")) {
					xAxisStateData.showXAxisLineTicks = Object.hasOwn(
						option[axis].axisTick,
						"show",
					)
						? option[axis].axisTick.show
						: false;
				}
				if (Object.hasOwn(option[axis], "axisLabel")) {
					xAxisStateData.labelFontSize = Object.hasOwn(
						option[axis].axisLabel,
						"fontSize",
					)
						? option[axis].axisLabel.fontSize
						: 12;
					xAxisStateData.rotate = Object.hasOwn(
						option[axis].axisLabel,
						"rotate",
					)
						? option[axis].axisLabel.rotate
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
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
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
			if (Object.hasOwn(option, "xAxis") && option.xAxis) {
				if (axisData.showAxisTitle) {
					if (Object.hasOwn(axisData, "xaxistitle")) {
						option.xAxis = {
							...option.xAxis,
							name: axisData.xaxistitle,
						};
					}
					if (Object.hasOwn(axisData, "xaxisTitleFontSize")) {
						option.xAxis = {
							...option.xAxis,
							nameTextStyle: {
								...option.xAxis.nameTextStyle,
								fontSize:
									Number(axisData.xaxisTitleFontSize) ||
									undefined,
							},
						};
					}
				} else {
					option.xAxis = {
						...option.xAxis,
						name: "",
					};
				}

				if (Object.hasOwn(axisData, "showXAxisLineTicks")) {
					option.xAxis = {
						...option.xAxis,
						axisTick: {
							...option.xAxis.axisTick,
							show: axisData.showXAxisLineTicks,
							alignWithLabel: axisData.showXAxisLineTicks,
						},
					};
				}

				if (Object.hasOwn(axisData, "showXAxisLabels")) {
					option.xAxis = {
						...option.xAxis,
						axisLabel: {
							...option.xAxis.axisLabel,
							show: axisData.showXAxisLabels,
						},
					};
				}

				if (Object.hasOwn(axisData, "labelFontSize")) {
					option.xAxis = {
						...option.xAxis,
						axisLabel: {
							...option.xAxis.axisLabel,
							show: option.xAxis.axisLabel.show,
							fontSize:
								Number(axisData.labelFontSize) || undefined,
						},
					};
				}
				if (Object.hasOwn(axisData, "rotate")) {
					option.xAxis = {
						...option.xAxis,
						axisLabel: {
							...option.xAxis.axisLabel,
							show: option.xAxis.axisLabel.show,
							rotate: axisData.rotate,
						},
					};
				}
				if (Object.hasOwn(axisData, "showxAxisZoom")) {
					if (option.dataZoom) {
						const xAxisPosition = option.dataZoom.findIndex((opt) =>
							Object.hasOwn(opt, "xAxisIndex"),
						);
						if (xAxisPosition > -1) {
							option.dataZoom[xAxisPosition].show =
								axisData.showxAxisZoom;
						} else {
							option.dataZoom.push({
								type: "slider",
								xAxisIndex: [0],
								show: axisData.showxAxisZoom,
							});
						}
					}
					if (Object.hasOwn(axisData, "axisGap")) {
						option.xAxis = {
							...option.xAxis,
							nameGap: Number(axisData.axisGap) || undefined,
						};
					} else {
						option = {
							...option,
							dataZoom: {
								show: axisData.showxAxisZoom,
								type: "slider",
								xAxisIndex: [0],
							},
						};
					}
				}
				option = {
					...option,
					customSettings: {
						...option.customSettings,
						toolsUpdated: true,
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
			<div className="flex flex-col">
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						defaultChecked={!!xaxisState.showAxisTitle}
						onCheckedChange={(checked) =>
							handleInputChange(null, "showAxisTitle", checked)
						}
					/>
					<span className="text-sm">Show Axis Title</span>
				</div>
				{xaxisState.showAxisTitle && (
					<div className="flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Set Axis Title
						</span>
						<Input
							value={xaxisState.xaxistitle}
							onChange={(e) => handleInputChange(e, "xaxistitle")}
						/>
					</div>
				)}
				{xaxisState.showAxisTitle && (
					<div className="flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Edit Axis Title Font Size
						</span>
						<Input
							type="number"
							value={xaxisState.xaxisTitleFontSize}
							onChange={(e) =>
								handleInputChange(e, "xaxisTitleFontSize")
							}
						/>
					</div>
				)}
				{xaxisState.showAxisTitle && (
					<div className="flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Axis Gap
						</span>
						<Input
							type="number"
							value={xaxisState.axisGap}
							onChange={(e) => handleInputChange(e, "axisGap")}
						/>
					</div>
				)}
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						defaultChecked={!!xaxisState.showXAxisLabels}
						onCheckedChange={(checked) =>
							handleInputChange(null, "showXAxisLabels", checked)
						}
					/>
					<span className="text-sm">Show XAxis Labels</span>
				</div>
				{xaxisState.showXAxisLabels && (
					<div className="flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Edit Label Font Size:
						</span>
						<Input
							value={xaxisState.labelFontSize}
							type="number"
							onChange={(e) =>
								handleInputChange(e, "labelFontSize")
							}
						/>
					</div>
				)}
				{xaxisState.showXAxisLabels && (
					<div className="flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Rotate X-Axis Values:
						</span>
						<Slider
							value={[xaxisState.rotate]}
							min={xaxisState.rotateLabelMinValue}
							max={xaxisState.rotateLabelMaxValue}
							onValueChange={(newValue: number[]) =>
								handleInputChange(null, "rotate", newValue[0])
							}
						/>
						<div className="flex w-full justify-between">
							<span>{xaxisState.rotateLabelMinValue}</span>
							<span>{xaxisState.rotateLabelMaxValue}</span>
						</div>
					</div>
				)}

				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						defaultChecked={!!xaxisState.showXAxisLineTicks}
						onCheckedChange={(checked) =>
							handleInputChange(
								null,
								"showXAxisLineTicks",
								checked,
							)
						}
					/>
					<span className="text-sm">Show XAxis Line Ticks</span>
				</div>
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={!!xaxisState.showxAxisZoom}
						onCheckedChange={(checked) =>
							handleInputChange(null, "showxAxisZoom", checked)
						}
					/>
					<span className="text-sm">Show / Hide X-Axis Zoom</span>
				</div>
				<div className="flex justify-end px-4 py-2">
					<Button onClick={resetToInitialState}>Reset</Button>
				</div>
			</div>
		);
		return <>{accordionDetails}</>;
	},
);
