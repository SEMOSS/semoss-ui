import { observer } from "mobx-react-lite";
import type { PathValue } from "@semoss/renderer";

interface BarChartStyle {
	barwidth: number;
	minBarWidth: number;
	maxBarWidth: number;
	barColour: string;
}

const _CUSTOM_BAR_CHART_STYLES = {
	barwidth: 10,
	minBarWidth: 1,
	maxBarWidth: 45,
	barColour: "#5470c6",
};

const _INITIAL_BAR_CHART_STYLES: BarChartStyle[] = [];

export const VisualizationStyles = observer(
	<D extends BlockDef = BlockDef>({
		// biome-ignore lint/correctness/noUnusedFunctionParameters: required by interface
		updateChart,
		// biome-ignore lint/correctness/noUnusedFunctionParameters: required by interface
		chartType,
		option,
		id,
		path,
	}) => {
		const [styleData, setStyleData] = useState<BarChartStyle[]>(
			INITIAL_BAR_CHART_STYLES,
		);
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [value, setValue] = useState<
			typeof EchartVisualizationBlockConfig.data.option
		>(data.option);
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
		const [stylesUpdated, setStylesUpdated] = useState<
			"initial" | "updated"
		>("initial");
		const [selectedSeries, setSelectedSeries] = useState<string>("0");

		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) return "";
				const v = getValueByPath(data, path);
				if (typeof v === "undefined") return "";
				else if (typeof v === "string") return v;
				return JSON.stringify(v, null, 2);
			});
		}, [data, path]).get();

		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const barChartData = option.series.filter((item) =>
				BAR_CHART_DATA.JSONVALUE.includes(item.type),
			);
			if (barChartData.length) {
				const barStyleData: BarChartStyle[] = barChartData.map(
					(item) => ({
						barwidth: item?.barWidth ?? 10,
						barColour: item.itemStyle?.color ?? "#5470c6",
						minBarWidth: 1,
						maxBarWidth: 45,
					}),
				);
				setStyleData(barStyleData);
			}
		}, []);

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (stylesUpdated === "updated") {
				updateChartData(styleData, selectedSeries);
			}
		}, [styleData]);

		function _getFilteredSeriesIndex(): number[] {
			const index: number[] = [];
			const seriesAvailable = data.option.series.filter((item) =>
				BAR_CHART_DATA.JSONVALUE.includes(item.type),
			);
			seriesAvailable.forEach((_, seriesIndex) => {
				index.push(seriesIndex);
			});
			return index;
		}

		function handleInputChange(newValue: number, seriesIndex = "0") {
			if (stylesUpdated === "initial") setStylesUpdated("updated");
			const currentStyle = [...styleData];
			currentStyle[Number(seriesIndex)] = {
				...currentStyle[Number(seriesIndex)],
				barwidth: newValue,
			};
			setStyleData(currentStyle);
		}

		function handleBarColourChange(colourValue: string, seriesIndex = "0") {
			if (stylesUpdated === "initial") setStylesUpdated("updated");
			const currentStyle = [...styleData];
			currentStyle[Number(seriesIndex)] = {
				...currentStyle[Number(seriesIndex)],
				barColour: colourValue,
			};
			setStyleData(currentStyle);
		}

		function updateChartData(
			barData: BarChartStyle[],
			_selectedSeries: string,
		) {
			let opt = typeof value === "string" ? JSON.parse(value) : value;
			barData.forEach((barDataSegment, barDataIndex) => {
				const barWidth: number = barDataSegment.barwidth;
				const barColour: string = barDataSegment.barColour;
				if (opt.series) {
					const barChartDataIndex = barDataIndex;
					if (barChartDataIndex > -1) {
						if (barWidth !== undefined && barWidth > 0) {
							opt.series[barChartDataIndex] = {
								...opt.series[barChartDataIndex],
								barWidth: barWidth,
							};
						}
						if (barColour !== undefined) {
							if (opt.series[barChartDataIndex].itemStyle) {
								opt.series[barChartDataIndex] = {
									...opt.series[barChartDataIndex],
									itemStyle: {
										...opt.series[barChartDataIndex]
											.itemStyle,
										color: barColour,
									},
								};
							} else {
								opt.series[barChartDataIndex] = {
									...opt.series[barChartDataIndex],
									itemStyle: {
										color: barColour,
									},
								};
							}
						}
					}
				}
			});
			opt = {
				...opt,
				çustomSettings: {
					...opt.çustomSettings,
					toolsUpdated: true,
				},
			};
			runStateUpdateCustom(opt);
		}

		function runStateUpdateCustom(
			option: typeof EchartVisualizationBlockConfig.data.option,
		) {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			timeoutRef.current = setTimeout(() => {
				try {
					setData(
						"option",
						option as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		}

		const currentSeriesColor =
			styleData[Number(selectedSeries)]?.barColour || "#5470c6";

		return (
			<div className="flex w-full flex-col p-4">
				{/* Series tabs */}
				{styleData.length > 1 && (
					<div className="flex flex-row gap-1 py-2">
						{styleData.map((_, _index) => (
							// biome-ignore lint/a11y/useButtonType: handled by caller
							<button
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								key={`series${index}`}
								className={`rounded border px-3 py-1 text-sm ${
									selectedSeries === `${index}`
										? "border-primary bg-primary text-primary-foreground"
										: "border-border"
								}`}
								onClick={() => setSelectedSeries(`${index}`)}
							>
								{`Series ${index + 1}`}
							</button>
						))}
					</div>
				)}
				{styleData[Number(selectedSeries)] && (
					<>
						<div className="flex flex-col gap-2 py-2">
							{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
							{/* biome-ignore lint/a11y/noLabelWithoutControl: label paired with adjacent control*/}
							<label className="text-muted-foreground text-sm">
								Bar Width
							</label>
							<Slider
								value={[
									styleData[Number(selectedSeries)].barwidth,
								]}
								min={
									styleData[Number(selectedSeries)]
										.minBarWidth
								}
								max={
									styleData[Number(selectedSeries)]
										.maxBarWidth
								}
								onValueChange={(v: number[]) =>
									handleInputChange(v[0], selectedSeries)
								}
							/>
						</div>
						<ColorPickerSettings
							id={id}
							path={`option.series.${selectedSeries}.itemStyle.color`}
							colorValue={currentSeriesColor}
							onChange={(e) =>
								handleBarColourChange(e, selectedSeries)
							}
						/>
					</>
				)}
			</div>
		);
	},
);
