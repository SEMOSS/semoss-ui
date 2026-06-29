import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
	type Block,
	type BlockDef,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import {
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { ColorPickerSettings } from "../../../../shared/ColorPickerSettings";
import { LINE_CHART_DATA } from "../../Visualization.constants";

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
//Customize value labels initial value
const INITIAL_VALUE_LABELS:
	| CustomizeValueLabelsKeys[]
	| (() => CustomizeValueLabelsKeys[]) = [];
//Customize value labels component's key properties
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

interface LineSeriesLabelSettings {
	show?: boolean;
	position?: string;
	rotate?: string;
	align?: string;
	fontFamily?: string;
	fontSize?: number;
	fontWeight?: string;
	color?: string;
}

interface LineSeriesOption {
	type?: string;
	label?: LineSeriesLabelSettings;
	[key: string]: unknown;
}

interface LineChartOption {
	series: LineSeriesOption[];
	customSettings?: {
		toolsUpdated?: boolean;
	};
	[key: string]: unknown;
}

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const LineValueLabels = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const [fieldData, setFieldData] =
			useState<CustomizeValueLabelsKeys[]>(INITIAL_VALUE_LABELS);
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [value, setValue] = useState<string | LineChartOption>(
			data.option as LineChartOption,
		);
		const [selectedSeries, setSelectedSeries] = useState<string>("0");
		const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
		const [valueLabelsUpdated, setValueLabelsUpdated] = useState<
			"initial" | "updated"
		>("initial");
		const rotateLabelId = useId();
		const fontSizeId = useId();
		const labelPositionValues: string[] = [
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
		const alignment: string[] = ["left", "center", "right"];
		const fontFamily: string[] = ["sans-serif", "serif", "monospace"];
		const fontWeight: string[] = [
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

		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (valueLabelsUpdated === "updated") {
				updateChartData(fieldData);
			}
		}, [fieldData]);

		const updateFields = (
			fieldName: string,
			fieldValue: string | boolean,
			seriesIndex: string | number,
		): void => {
			if (valueLabelsUpdated === "initial") {
				setValueLabelsUpdated("updated");
			}
			const fieldsData = [...fieldData];
			fieldsData[Number(seriesIndex)] = {
				...fieldsData[Number(seriesIndex)],
				[fieldName]: fieldValue,
			};
			setFieldData(fieldsData);
		};

		function updateChartData(values: CustomizeValueLabelsKeys[]) {
			let opt: LineChartOption =
				typeof value === "string" ? JSON.parse(value) : value;
			const customizeLabelOptionsData: Record<
				string | number,
				Omit<CustomizeValueLabelsKeys, "seriesIndex">
			> = {};
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
								opt.series[idx].label?.color,
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
			const opt: LineChartOption =
				typeof value === "string" ? JSON.parse(value) : value;
			const seriesAvailable = opt.series.filter(
				(item: LineSeriesOption) =>
					LINE_CHART_DATA.JSONVALUE.includes(item.type ?? ""),
			);
			seriesAvailable.forEach((_, seriesIndex: number) => {
				index.push(seriesIndex);
			});
			return index;
		}

		function runStateUpdateCustom(optionUpdated: LineChartOption) {
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

		const fieldSelectedSeries: CustomizeValueLabelsKeys =
			fieldData[parseInt(selectedSeries, 10)] || DEFAULT_VALUE_LABELS;

		return (
			<div className="flex w-full flex-col">
				{/* Series tabs */}
				{fieldData.length > 1 && (
					<div className="flex flex-row gap-1 px-4 py-2">
						{fieldData.map((item, index) => (
							// biome-ignore lint/a11y/useButtonType: handled by caller
							<button
								key={String(item.seriesIndex)}
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
									{labelPositionValues.map((label) => (
										<SelectItem key={label} value={label}>
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
							<Input
								type="number"
								id={rotateLabelId}
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
									{alignment.map((label) => (
										<SelectItem key={label} value={label}>
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
									{fontFamily.map((label) => (
										<SelectItem key={label} value={label}>
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
							<Input
								type="number"
								id={fontSizeId}
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
									{fontWeight.map((label) => (
										<SelectItem key={label} value={label}>
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
