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
import { useBlockSettings } from "@/hooks/useBlockSettings";

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
		const initialXAxisNameRef = useRef(data.option.yAxis.name);

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
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
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
					? option[axis].name
					: "";
				if (Object.hasOwn(option[axis], "axisTick")) {
					yAxisStateData.showYAxisLineTicks = Object.hasOwn(
						option[axis].axisTick,
						"show",
					)
						? option[axis].axisTick.show
						: false;
				}
				if (Object.hasOwn(option[axis], "axisLabel")) {
					yAxisStateData.labelFontSize = Object.hasOwn(
						option[axis].axisLabel,
						"fontSize",
					)
						? option[axis].axisLabel.fontSize
						: 12;
					yAxisStateData.rotate = Object.hasOwn(
						option[axis].axisLabel,
						"rotate",
					)
						? option[axis].axisLabel.rotate
						: 0;
				}
				if (option.dataZoom) {
					const yAxisPosition = option.dataZoom.findIndex((opt) =>
						Object.hasOwn(opt, "yAxisIndex"),
					);
					if (yAxisPosition > -1) {
						yAxisStateData.showYAxisZoom = Object.hasOwn(
							option.dataZoom[yAxisPosition],
							"show",
						)
							? option.dataZoom[yAxisPosition].show
							: false;
						console.log(
							"yaxiszoom",
							Object.hasOwn(
								option.dataZoom[yAxisPosition],
								"show",
							),
							option.dataZoom[yAxisPosition].show,
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
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
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
							name: axisData.yaxistitle,
						};
					}
					if (Object.hasOwn(axisData, "yaxisTitleFontSize")) {
						option[axis] = {
							...option[axis],
							nameTextStyle: {
								...option[axis].nameTextStyle,
								fontSize:
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
							nameGap: Number(axisData.axisGap) || undefined,
						};
					}
				} else {
					option.yAxis = {
						...option.yAxis,
						name: "",
					};
				}

				if (Object.hasOwn(axisData, "showYAxisLineTicks")) {
					option[axis] = {
						...option[axis],
						axisTick: {
							...option[axis].axisTick,
							show: axisData.showYAxisLineTicks,
							alignWithLabel: axisData.showYAxisLineTicks,
						},
					};
				}

				if (Object.hasOwn(axisData, "showYAxisLabels")) {
					option[axis] = {
						...option[axis],
						axisLabel: {
							...option[axis].axisLabel,
							show: axisData.showYAxisLabels,
						},
					};
				}

				if (Object.hasOwn(axisData, "labelFontSize")) {
					option[axis] = {
						...option[axis],
						axisLabel: {
							...option[axis].axisLabel,
							show: option[axis].axisLabel.show,
							fontSize:
								Number(axisData.labelFontSize) || undefined,
						},
					};
				}
				if (Object.hasOwn(axisData, "rotate")) {
					option[axis] = {
						...option[axis],
						axisLabel: {
							...option[axis].axisLabel,
							show: option[axis].axisLabel.show,
							rotate: axisData.rotate,
						},
					};
				}
				if (Object.hasOwn(axisData, "showYAxisZoom")) {
					if (option.dataZoom) {
						const xAxisPosition = option.dataZoom.findIndex((opt) =>
							Object.hasOwn(opt, "yAxisIndex"),
						);
						if (xAxisPosition > -1) {
							option.dataZoom[xAxisPosition].show =
								axisData.showYAxisZoom;
						} else {
							option.dataZoom.push({
								type: "slider",
								yAxisIndex: [0],
								show: axisData.showYAxisZoom,
							});
						}
					} else {
						option = {
							...option,
							dataZoom: {
								show: axisData.showYAxisZoom,
								type: "slider",
								yAxisIndex: [0],
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
			<div className="flex flex-col">
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						defaultChecked={!!yaxisState.showAxisTitle}
						onCheckedChange={(checked) =>
							handleInputChange(null, "showAxisTitle", checked)
						}
					/>
					<span className="text-sm">Show Axis Title</span>
				</div>
				{yaxisState.showAxisTitle && (
					<div className="flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Set Axis Title
						</span>
						<Input
							value={yaxisState.yaxistitle}
							onChange={(e) => handleInputChange(e, "yaxistitle")}
						/>
					</div>
				)}
				{yaxisState.showAxisTitle && (
					<div className="flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Edit Axis Title Font Size
						</span>
						<Input
							type="number"
							value={yaxisState.yaxisTitleFontSize}
							onChange={(e) =>
								handleInputChange(e, "yaxisTitleFontSize")
							}
						/>
					</div>
				)}
				{yaxisState.showAxisTitle && (
					<div className="flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Truncate Characters Length(Pixel):
						</span>
						<Input
							type="number"
							value={yaxisState.truncateCharCount}
							onChange={(e) =>
								handleInputChange(e, "truncateCharCount")
							}
						/>
					</div>
				)}
				{yaxisState.showAxisTitle && (
					<div className="flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Axis Gap
						</span>
						<Input
							type="number"
							value={yaxisState.axisGap}
							onChange={(e) => handleInputChange(e, "axisGap")}
						/>
					</div>
				)}

				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						defaultChecked={!!yaxisState.showYAxisLabels}
						onCheckedChange={(checked) =>
							handleInputChange(null, "showYAxisLabels", checked)
						}
					/>
					<span className="text-sm">Show YAxis Labels</span>
				</div>
				{yaxisState.showYAxisLabels && (
					<div className="flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Edit Label Font Size:
						</span>
						<Input
							value={yaxisState.labelFontSize}
							type="number"
							onChange={(e) =>
								handleInputChange(e, "labelFontSize")
							}
						/>
					</div>
				)}
				{yaxisState.showYAxisLabels && (
					<div className="flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Rotate Y-Axis Values:
						</span>
						<Slider
							value={[yaxisState.rotate]}
							min={yaxisState.rotateLabelMinValue}
							max={yaxisState.rotateLabelMaxValue}
							onValueChange={(newValue: number[]) =>
								handleInputChange(null, "rotate", newValue[0])
							}
						/>
						<div className="flex w-full justify-between">
							<span>{yaxisState.rotateLabelMinValue}</span>
							<span>{yaxisState.rotateLabelMaxValue}</span>
						</div>
					</div>
				)}

				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						defaultChecked={!!yaxisState.showYAxisLineTicks}
						onCheckedChange={(checked) =>
							handleInputChange(
								null,
								"showYAxisLineTicks",
								checked,
							)
						}
					/>
					<span className="text-sm">Show YAxis Line Ticks</span>
				</div>

				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={!!yaxisState.showYAxisZoom}
						onCheckedChange={(checked) =>
							handleInputChange(null, "showYAxisZoom", checked)
						}
					/>
					<span className="text-sm">Show / Hide Y-Axis Zoom</span>
				</div>
				<div className="flex justify-end px-4 py-2">
					<Button onClick={resetToInitialState}>Reset</Button>
				</div>
			</div>
		);
		return <>{accordionDetails}</>;
	},
);
