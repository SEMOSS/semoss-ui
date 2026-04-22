import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type EchartVisualizationBlockConfig,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type PathValue,
} from "@semoss/renderer";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BAR_CHART_DATA } from "../../Visualization.constants";

//Initial state of custom value labels as default values for managing and restoring
const DEFAULT_VALUE_LABELS = {
	show: false,
	position: "top",
	rotate: "0",
	alignment: "center",
	font: "sans-serif",
	fontsize: "12",
	fontweight: "normal",
	fontcolour: "#000000",
	seriesIndex: "0",
};

const INITIAL_VALUE_LABELS: CustomizeValueLabelsKeys[] = [];

interface CustomizeValueLabelsKeys {
	show: boolean;
	position: string;
	rotate: string;
	alignment: string;
	font: string;
	fontsize: string;
	fontweight: string;
	fontcolour: string;
	seriesIndex: number | string;
}

export const CustomizeValueLabels = observer(
	// biome-ignore lint/correctness/noUnusedFunctionParameters: required by interface
	<D extends BlockDef = BlockDef>({ option, chartType, id, path }) => {
		const [fieldData, setFieldData] =
			useState<CustomizeValueLabelsKeys[]>(INITIAL_VALUE_LABELS);
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [value, setValue] = useState<
			typeof EchartVisualizationBlockConfig.data.option
		>(data.option);
		const [selectedSeries, _setSelectedSeries] = useState<string>("0");
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
		const [valueLabelsUpdated, setValueLabelsUpdated] = useState<
			"initial" | "updated"
		>("initial");
		const _labelPositionValues: string[] = [
			"top",
			"left",
			"right",
			"bottom",
			"inside",
			"insideLeft",
			"insideRight",
			"insideTop",
			"insideBottom",
			"insideTopLeft",
			"insideBottomLeft",
			"insideTopRight",
			"insideBottomRight",
		];
		const _alignment: string[] = ["left", "center", "right"];
		const _fontFamily: string[] = ["sans-serif", "serif", "monospace"];
		const _fontWeight: string[] = [
			"normal",
			"bold",
			"bolder",
			"lighter",
			"100",
			"200",
			"300",
			"400",
			"500",
			"600",
			"700",
			"800",
			"900",
		];
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const opt = typeof value === "string" ? JSON.parse(value) : value;
			if (opt.series) {
				const seriesData = getFilteredSeriesIndex();
				const fieldsDataToUpdate = seriesData.map((seriesChartData) => {
					if (opt.series[seriesChartData].label === undefined) {
						return {
							...DEFAULT_VALUE_LABELS,
							seriesIndex: seriesChartData,
						};
					} else {
						return {
							show:
								opt.series[seriesChartData].label.show ?? false,
							position:
								opt.series[seriesChartData].label.position ??
								DEFAULT_VALUE_LABELS.position,
							rotate:
								opt.series[seriesChartData].label.rotate ??
								DEFAULT_VALUE_LABELS.rotate,
							alignment:
								opt.series[seriesChartData].label.align ??
								DEFAULT_VALUE_LABELS.alignment,
							font:
								opt.series[seriesChartData].label.fontFamily ??
								DEFAULT_VALUE_LABELS.font,
							fontsize:
								opt.series[seriesChartData].label.fontSize ??
								DEFAULT_VALUE_LABELS.fontsize,
							fontweight:
								opt.series[seriesChartData].label.fontWeight ??
								DEFAULT_VALUE_LABELS.fontweight,
							fontcolour:
								opt.series[seriesChartData].label.color ??
								DEFAULT_VALUE_LABELS.fontcolour,
							seriesIndex: seriesChartData,
						};
					}
				});
				setFieldData(fieldsDataToUpdate);
			}
		}, []);

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
			if (valueLabelsUpdated === "updated") {
				updateChartData(fieldData);
			}
		}, [fieldData]);

		const _updateFields = (
			fieldName: string,
			// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
			fieldValue: any,
			seriesIndex: string | number,
		): void => {
			if (valueLabelsUpdated === "initial")
				setValueLabelsUpdated("updated");
			const fieldsData = [...fieldData];
			fieldsData[Number(seriesIndex)] = {
				...fieldsData[Number(seriesIndex)],
				[fieldName]: fieldValue,
			};
			setFieldData(fieldsData);
		};

		function updateChartData(values: CustomizeValueLabelsKeys[]) {
			let opt = typeof value === "string" ? JSON.parse(value) : value;
			// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
			const customizeLabelOptionsData: Record<string | number, any> = {};
			values.forEach((item) => {
				customizeLabelOptionsData[item.seriesIndex] = {
					show: item.show,
					position: item.position,
					rotate: item.rotate,
					alignment: item.alignment,
					font: item.font,
					fontsize: item.fontsize,
					fontweight: item.fontweight,
					fontcolour: item.fontcolour,
				};
			});
			const filteredSeries: number[] = getFilteredSeriesIndex();
			filteredSeries.forEach((item) => {
				const idx: number = item;
				const showValueLabel: boolean =
					customizeLabelOptionsData[idx].show ?? false;
				if (opt.series[idx]) {
					opt.series[idx] = {
						...opt.series[idx],
						label: {
							...opt.series[idx].label,
							show: showValueLabel,
							position: customizeLabelOptionsData[idx].position,
							rotate: customizeLabelOptionsData[idx].rotate,
							align: customizeLabelOptionsData[idx].alignment,
							fontFamily: customizeLabelOptionsData[idx].font,
							fontSize:
								Number(
									customizeLabelOptionsData[idx].fontsize,
								) || undefined,
							fontWeight:
								customizeLabelOptionsData[idx].fontweight,
							color:
								customizeLabelOptionsData[idx].fontcolour ||
								opt.series[idx].label.color,
						},
					};
				}
			});
			opt = {
				...opt,
				customSettings: {
					toolsUpdated: true,
				},
			};
			runStateUpdateCustom(opt);
		}

		function getFilteredSeriesIndex() {
			const index: number[] = [];
			const opt = typeof value === "string" ? JSON.parse(value) : value;
			const seriesAvailable = opt.series.filter((item) =>
				BAR_CHART_DATA.JSONVALUE.includes(item.type),
			);
			seriesAvailable.forEach((_, seriesIndex) => {
				index.push(seriesIndex);
			});
			return index;
		}

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

		const _fieldSelectedSeries: CustomizeValueLabelsKeys =
			fieldData[parseInt(selectedSeries, 10)] || DEFAULT_VALUE_LABELS;

		return (
			<div className="flex w-full flex-col">
				{/* Series tabs */}
				{fieldData.length > 1 && (
					<div className="flex flex-row gap-1 px-4 py-2">
						{fieldData.map((_, _index) => (
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
				{parseInt(selectedSeries, 10) >= 0 && (
					<div className="flex flex-row items-center gap-2 px-4 py-2">
						<Switch
							checked={!!fieldSelectedSeries?.show}
							onCheckedChange={(checked: boolean) =>
								updateFields("show", checked, selectedSeries)
							}
						/>
						<span className="text-sm">Show Value Labels</span>
					</div>
				)}
				{fieldSelectedSeries?.show && (
					<>
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Position
							</span>
							<Select
								value={fieldSelectedSeries.position ?? ""}
								onValueChange={(val) =>
									updateFields(
										"position",
										val,
										selectedSeries,
									)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select" />
								</SelectTrigger>
								<SelectContent>
									{labelPositionValues.map((label, index) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
										<SelectItem key={index} value={label}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Rotate Label (In Degrees)
							</span>
							{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
							// biome-ignore
							{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
							<Input
								type="number"
								id="rotate-label"
								value={fieldSelectedSeries.rotate ?? ""}
								onChange={(e) =>
									updateFields(
										"rotate",
										e.target.value,
										selectedSeries,
									)
								}
							/>
						</div>
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Select Alignment
							</span>
							<Select
								value={fieldSelectedSeries.alignment ?? ""}
								onValueChange={(val) =>
									updateFields(
										"alignment",
										val,
										selectedSeries,
									)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select Alignment" />
								</SelectTrigger>
								<SelectContent>
									{alignment.map((label, index) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
										<SelectItem key={index} value={label}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Select Font
							</span>
							<Select
								value={fieldSelectedSeries.font ?? ""}
								onValueChange={(val) =>
									updateFields("font", val, selectedSeries)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select Font" />
								</SelectTrigger>
								<SelectContent>
									{fontFamily.map((label, index) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
										<SelectItem key={index} value={label}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Select Font Size (Default: 12)
							</span>
							{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
							// biome-ignore
							{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
							<Input
								type="number"
								id="font-size"
								value={fieldSelectedSeries.fontsize}
								onChange={(e) =>
									updateFields(
										"fontsize",
										e.target.value,
										selectedSeries,
									)
								}
							/>
						</div>
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Select Font Weight
							</span>
							<Select
								value={fieldSelectedSeries.fontweight}
								onValueChange={(val) =>
									updateFields(
										"fontweight",
										val,
										selectedSeries,
									)
								}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select Font Weight" />
								</SelectTrigger>
								<SelectContent>
									{fontWeight.map((label, index) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
										<SelectItem key={index} value={label}>
											{label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<ColorPickerSettings
							id={id}
							path={`option.series.${selectedSeries}.label.color`}
							colorValue={fieldSelectedSeries.fontcolour}
							onChange={(e) =>
								updateFields("fontcolour", e, selectedSeries)
							}
						/>
					</>
				)}
			</div>
		);
	},
);
