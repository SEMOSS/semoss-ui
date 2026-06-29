import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BAR_CHART_DATA, LINE_CHART_DATA } from "../../Visualization.constants";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
	chartType: string;
}

interface LineSeries {
	type?: string;
	name?: string;
	data: Array<number | null>;
	toggleTrendLineObject?: boolean;
	sourceObjectIndex?: number;
	smooth?: boolean;
	step?: string | boolean;
	lineStyle?: {
		type?: string;
		width?: number;
	};
	[key: string]: unknown;
}

interface TrendlineOption {
	series: LineSeries[];
	customSettings?: {
		toolsUpdated?: boolean;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

export const ToggleTrendline = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
		chartType,
	}: JsonSettingsProps<D>) => {
		const [toggleTrendlines, setToggleTrendlines] =
			useState<string>("none"); //contains toggle trendlines tool state
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
		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue, data]);
		//handles initial setting of toggle trendlines data
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (BAR_CHART_DATA.JSONVALUE.includes(chartType)) {
				const option = JSON.parse(
					computedValue || "{}",
				) as TrendlineOption;
				const seriesIndex = option.series.findIndex(
					(op: LineSeries) =>
						LINE_CHART_DATA.JSONVALUE.includes(op.type ?? "") &&
						Object.hasOwn(op, "toggleTrendLineObject"),
				);
				if (seriesIndex > -1) {
					const trendLineOptions = option.series[seriesIndex];
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
		function handleToggleTrendLine(val: string) {
			setToggleTrendlines(val);
		}
		//getting the indexes for drawing lines over bar chart
		function getFilteredSeriesIndex(): number[] {
			const index: number[] = [];
			const option = JSON.parse(computedValue || "{}") as TrendlineOption;
			const seriesAvailable = option.series.filter((item: LineSeries) =>
				BAR_CHART_DATA.JSONVALUE.includes(item.type ?? ""),
			);
			seriesAvailable.forEach(
				(_item: LineSeries, seriesIndex: number) => {
					index.push(seriesIndex);
				},
			);
			return index;
		}
		//update chart data when toggle trendlines is changed and execute button is clicked
		function updateChartData(trendLinesSelected: string) {
			let option = JSON.parse(value || "{}") as TrendlineOption;
			const filteredSeries = getFilteredSeriesIndex();
			if (trendLinesSelected !== "none") {
				filteredSeries.forEach((item: number) => {
					const displayPositionIndex: number = item;
					const lineAlreadyExists = option.series.findIndex(
						(opt: LineSeries) =>
							Object.hasOwn(opt, "toggleTrendLineObject") &&
							LINE_CHART_DATA.JSONVALUE.includes(
								opt.type ?? "",
							) &&
							(Object.hasOwn(opt, "sourceObjectIndex")
								? opt.sourceObjectIndex === displayPositionIndex
								: true),
					);
					let trendLinesData: Record<string, unknown> = {};
					if (["smooth", "exact"].includes(trendLinesSelected)) {
						trendLinesData = {
							...trendLinesData,
							smooth: trendLinesSelected === "smooth",
						};
					}
					if (trendLinesSelected.startsWith("step")) {
						trendLinesData = {
							...trendLinesData,
							step: trendLinesSelected.split("_")[1] ?? false,
						};
					}
					if (lineAlreadyExists >= 0 && displayPositionIndex >= 0) {
						option.series[lineAlreadyExists] = {
							...option.series[lineAlreadyExists],
							...trendLinesData,
							data: option.series[displayPositionIndex].data,
						};
					}

					if (displayPositionIndex > -1 && lineAlreadyExists === -1) {
						const toggleLineData = {
							...trendLinesData,
							name: `Trendline: ${option.series[displayPositionIndex].name}`,
							data:
								option.series[displayPositionIndex].data || [],
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

						option.series = [...option.series, toggleLineData];
					}
				});
				option = {
					...option,
					customSettings: {
						...option.customSettings,
						toolsUpdated: true,
					},
				};
				runStateUpdate(option);
			} else {
				const displayPositionData = option.series.filter(
					(item: LineSeries) =>
						item.type === "line" &&
						Object.hasOwn(item, "toggleTrendLineObject"),
				);
				runDisplayPositionData(displayPositionData);
			}
		}
		//setting value of line chart to null when no trendline option is selected
		function runDisplayPositionData(_displayPositionData: LineSeries[]) {
			let option = JSON.parse(value || "{}") as TrendlineOption;
			const seriesOption = option.series;
			seriesOption.forEach(
				(seriesItem: LineSeries, seriesIndex: number) => {
					if (
						seriesItem.type === "line" &&
						Object.hasOwn(seriesItem, "toggleTrendLineObject")
					) {
						const lineData: Array<number | null> = [];
						seriesItem.data.forEach(
							(_seriesData: number | null) => {
								lineData.push(null);
							},
						);
						option.series[seriesIndex].data = lineData;
					}
				},
			);
			option = {
				...option,
				customSettings: {
					...option.customSettings,
					toolsUpdated: true,
				},
			};
			runStateUpdate(option);
			removeLineObject();
		}
		//removing the line object when the series is updated line type and toggleTrendlineObject
		function removeLineObject() {
			setTimeout(() => {
				const option = JSON.parse(value || "{}") as TrendlineOption;
				const displayPositionData = option.series.filter(
					(item: LineSeries) =>
						!(
							item.type === "line" &&
							Object.hasOwn(item, "toggleTrendLineObject")
						),
				);
				option.series = displayPositionData;
				runStateUpdate(option);
			}, 300);
		}
		//running the option update of a chart
		function runStateUpdate(updatedOption: TrendlineOption) {
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
			<div className="flex flex-col">
				<div className="flex flex-col gap-2 px-4 py-2">
					<span className="text-muted-foreground text-sm">
						Trendlines Toggle
					</span>
					<Select
						value={toggleTrendlines}
						onValueChange={handleToggleTrendLine}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="No Trendline" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="none">No Trendline</SelectItem>
							{trendLineOptions.map((trendOption, index) => (
								<SelectItem
									value={trendOption.value}
									// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
									key={index}
								>
									{trendOption.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex justify-center px-4 py-2">
					<Button
						type="button"
						onClick={() => updateChartData(toggleTrendlines)}
					>
						Update TrendLine
					</Button>
				</div>
			</div>
		);
		return <>{trendlineData}</>;
	},
);
