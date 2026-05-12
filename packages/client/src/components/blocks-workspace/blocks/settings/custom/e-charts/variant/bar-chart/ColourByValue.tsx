import { Pencil, Trash2 } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type BlockDef,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type PathValue,
} from "@semoss/renderer";
import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import {
	BAR_CHART_DATA,
	ECHART_BAR_COLOUR,
} from "../../Visualization.constants";

export interface ColourByValueProps {
	id: string;
	updateChart: (option: BarChartOption) => void;
	path: string;
}

type AxisValue = string | number;

type XAxisDataEntry = AxisValue | { value: AxisValue };

interface ColourRule {
	column: string;
	columnColour: string;
	columnToColour: string;
	columnComparision: string;
	valuesToColour: string[];
	filterValue: number;
	filterMinValue: number;
	filterMaxValue: number;
	index: number;
	columnName?: string;
	columnNameToColour?: string;
}

interface BarChartSeriesItem {
	name?: string;
	type?: string;
	data: Array<number | null>;
	itemStyle?: {
		color?: (seriesData: EChartColorParams) => string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

interface BarChartOption {
	xAxis: {
		pixelname?: string | string[];
		data: XAxisDataEntry[];
	};
	yAxis: {
		pixelname?: string | string[];
	};
	series: BarChartSeriesItem[];
	customSettings?: {
		appliedColourByValue?: ColourRule[];
		toolsUpdated?: boolean;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

interface EChartColorParams {
	dataIndex: number;
}

const INITIAL_NEW_RULES: ColourRule = {
	column: "",
	columnColour: "#000000",
	columnToColour: "",
	columnComparision: "",
	valuesToColour: [] as string[],
	filterValue: 0,
	filterMinValue: 0,
	filterMaxValue: 0,
	index: -1,
};

const ColourByValue = observer(
	<_D extends BlockDef = BlockDef>({ id, path }: ColourByValueProps) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);

		const [newRules, setNewRules] = useState<ColourRule>(INITIAL_NEW_RULES);
		const [valuesToColour, setValuesToColour] = useState<string[]>([]);
		const [value, setValue] = useState<BarChartOption | string>(
			{} as BarChartOption,
		);
		const [appliedRules, setAppliedRules] = useState<ColourRule[]>([]);
		const [_valuesColourMapping, setValuesColourMapping] = useState<
			Record<string, string>
		>({});

		const functionCallReference = useRef<{
			valuesResetCheck: boolean;
			assignedRules: ColourRule[];
			applyRulesToChart: boolean;
		}>({
			valuesResetCheck: false,
			assignedRules: [],
			applyRulesToChart: false,
		});

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

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			functionCallReference.current.applyRulesToChart = false;
			const option = (
				typeof computedValue === "string"
					? JSON.parse(computedValue)
					: computedValue
			) as BarChartOption;
			if (
				option.customSettings &&
				Object.hasOwn(option, "customSettings") &&
				Object.hasOwn(option.customSettings, "appliedColourByValue")
			) {
				setAppliedRules(
					option.customSettings.appliedColourByValue ?? [],
				);
			}
		}, []);

		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (functionCallReference.current.applyRulesToChart) {
				const option = (
					typeof value === "string" ? JSON.parse(value) : value
				) as BarChartOption;
				let colourObj: Record<number, string> = {};
				let optionUpdated: BarChartOption = option;
				appliedRules.forEach((appliedItem) => {
					const xAxisPosition = getXAxisPositions(appliedItem);
					const filteredSeriesIndex = getFilteredSeriesIndex();
					if (xAxisPosition.length) {
						filteredSeriesIndex.forEach((seriesIndexData) => {
							if (seriesIndexData > -1) {
								const seriesData =
									option.series[seriesIndexData].data;
								seriesData.forEach((_, dataindex) => {
									colourObj = {
										...colourObj,
										[dataindex]: xAxisPosition.includes(
											dataindex,
										)
											? appliedItem.columnColour
											: Object.hasOwn(
														colourObj,
														dataindex,
													)
												? colourObj[dataindex]
												: ECHART_BAR_COLOUR,
									};
								});
								setValuesColourMapping((prev) => ({
									...prev,
									...Object.fromEntries(
										Object.entries(colourObj).map(
											([k, v]) => [String(k), v],
										),
									),
								}));
								if (
									Object.hasOwn(
										option.series[seriesIndexData],
										"itemStyle",
									)
								) {
									option.series[seriesIndexData].itemStyle = {
										...option.series[seriesIndexData]
											.itemStyle,
										color: (sd: EChartColorParams) =>
											updateColorData(sd, colourObj),
									};
								} else {
									option.series[seriesIndexData] = {
										...option.series[seriesIndexData],
										itemStyle: {
											color: (sd: EChartColorParams) =>
												updateColorData(sd, colourObj),
										},
									};
								}
							}
						});
					}
				});
				option.customSettings = {
					...option.customSettings,
					appliedColourByValue: appliedRules,
					toolsUpdated: true,
				};
				optionUpdated = option;
				runStateUpdateCustom(optionUpdated);
				functionCallReference.current.applyRulesToChart = false;
			}
		}, [appliedRules]);

		function getFilteredSeriesIndex() {
			const index: number[] = [];
			const seriesAvailable = (
				data.option as BarChartOption
			).series.filter((item) =>
				BAR_CHART_DATA.JSONVALUE.includes(item.type ?? ""),
			);
			seriesAvailable.forEach((_, seriesIndex) => {
				index.push(seriesIndex);
			});
			return index;
		}

		function runStateUpdateCustom(updatedOption: BarChartOption) {
			setTimeout(() => {
				try {
					setData(
						"option",
						updatedOption as PathValue<BarChartOption, typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		}

		function convertSeriesDataToValue(item: XAxisDataEntry | null): number {
			if (typeof item === "object" && item !== null) {
				const v = item.value;
				if (typeof v === "number") {
					return v;
				}
				const parsedValue = Number(v);
				return Number.isNaN(parsedValue) ? 0 : parsedValue;
			}
			if (typeof item === "number") return item;
			if (item === null) return 0;
			const parsedValue = Number(item);
			return Number.isNaN(parsedValue) ? 0 : parsedValue;
		}

		function updateField<K extends keyof ColourRule>(
			column: K,
			val: ColourRule[K],
		) {
			setNewRules((prev) => ({ ...prev, [column]: val }));
			if (column === "columnToColour" && typeof val === "string") {
				const option = data.option as BarChartOption;
				const jsonPropName = data.columns.find(
					(item) => item.selector === val,
				);
				if (jsonPropName && Object.hasOwn(jsonPropName, "name")) {
					setNewRules((prev) => ({
						...prev,
						columnName: jsonPropName.name,
						columnNameToColour: jsonPropName.name,
					}));
					if (option.xAxis.pixelname === jsonPropName.name) {
						setValuesToColour(
							option.xAxis.data.map((item) =>
								typeof item === "object"
									? String(item.value)
									: String(item),
							),
						);
						const dataArray = option.xAxis.data.map(
							convertSeriesDataToValue,
						);
						setNewRules((prev) => ({
							...prev,
							filterMinValue: Math.min(...dataArray),
							filterMaxValue: Math.max(...dataArray),
						}));
					}
					if (option.yAxis.pixelname === jsonPropName.name) {
						const seriesIndex = option.series.findIndex(
							(series) => series.name === jsonPropName.name,
						);
						if (
							seriesIndex > -1 &&
							Object.hasOwn(option.series[seriesIndex], "data")
						) {
							setValuesToColour(
								option.series[seriesIndex].data.map((item) =>
									String(convertSeriesDataToValue(item)),
								),
							);
							const dataArray = option.series[
								seriesIndex
							].data.map(convertSeriesDataToValue);
							setNewRules((prev) => ({
								...prev,
								filterMinValue: Math.min(...dataArray),
								filterMaxValue: Math.max(...dataArray),
							}));
						}
					}
				}
			}
		}

		function getXAxisPositions(sourceObject: Partial<ColourRule> = {}) {
			const option = (
				typeof value === "string" ? JSON.parse(value) : value
			) as BarChartOption;
			const positions: number[] = [];
			const sourceRule: ColourRule =
				Object.keys(sourceObject).length === 0
					? newRules
					: ({ ...newRules, ...sourceObject } as ColourRule);

			if (sourceRule.columnComparision === "==") {
				sourceRule.valuesToColour.forEach((item) => {
					option.xAxis.data.forEach((itemAvailable, index) => {
						const availableValue =
							typeof itemAvailable === "object"
								? itemAvailable.value
								: itemAvailable;
						if (String(item) === String(availableValue)) {
							positions.push(index);
						}
					});
				});
			}
			if (sourceRule.columnComparision === "!=") {
				const matchedPositions: number[] = [];
				sourceRule.valuesToColour.forEach((item) => {
					option.xAxis.data.forEach((itemAvailable, index) => {
						const availableValue =
							typeof itemAvailable === "object"
								? itemAvailable.value
								: itemAvailable;
						if (String(item) === String(availableValue)) {
							matchedPositions.push(index);
						}
					});
				});
				option.xAxis.data.forEach((_, index) => {
					if (!matchedPositions.includes(index))
						positions.push(index);
				});
			}
			if (sourceRule.columnComparision === "<") {
				option.xAxis.data.forEach((item, index) => {
					const itemValue =
						typeof item === "object"
							? Number(item.value)
							: Number(item);
					if (
						!Number.isNaN(itemValue) &&
						itemValue < sourceRule.filterValue
					) {
						positions.push(index);
					}
				});
			}
			if (sourceRule.columnComparision === ">") {
				option.xAxis.data.forEach((item, index) => {
					const itemValue =
						typeof item === "object"
							? Number(item.value)
							: Number(item);
					if (
						!Number.isNaN(itemValue) &&
						itemValue > sourceRule.filterValue
					) {
						positions.push(index);
					}
				});
			}
			if (sourceRule.columnComparision === "<=") {
				option.xAxis.data.forEach((item, index) => {
					const itemValue =
						typeof item === "object"
							? Number(item.value)
							: Number(item);
					if (
						!Number.isNaN(itemValue) &&
						itemValue <= sourceRule.filterValue
					) {
						positions.push(index);
					}
				});
			}
			if (sourceRule.columnComparision === ">=") {
				option.xAxis.data.forEach((item, index) => {
					const itemValue =
						typeof item === "object"
							? Number(item.value)
							: Number(item);
					if (
						!Number.isNaN(itemValue) &&
						itemValue >= sourceRule.filterValue
					) {
						positions.push(index);
					}
				});
			}
			return positions;
		}

		function updateColorData(
			seriesData: EChartColorParams,
			colourObj: Record<number, string>,
		) {
			if (Object.hasOwn(colourObj, seriesData.dataIndex)) {
				return colourObj[seriesData.dataIndex];
			}
			return ECHART_BAR_COLOUR;
		}

		function updateData() {
			if (newRules.column !== "" && newRules.columnComparision !== "") {
				if (newRules.index === -1) {
					const appliedRulesUpdated = [
						...appliedRules,
						{ ...newRules, index: appliedRules.length },
					];
					functionCallReference.current.applyRulesToChart = true;
					setAppliedRules(appliedRulesUpdated);
				} else {
					const index = newRules.index;
					const updatedRules = [
						...appliedRules.filter((_, i) => i < index),
						newRules,
						...appliedRules.filter((_, i) => i > index),
					];
					functionCallReference.current.applyRulesToChart = true;
					setAppliedRules(updatedRules);
				}
			}
			setNewRules(INITIAL_NEW_RULES);
		}

		const columnComparision = [
			{ name: "is Equal To", value: "==" },
			{ name: "is Not Equal To", value: "!=" },
			{ name: "is Less than", value: "<" },
			{ name: "is greater than", value: ">" },
			{ name: "is Lesser than or Equal to", value: "<=" },
			{ name: "is greater than or Equal to", value: ">=" },
		];

		const conditionForShowingField =
			newRules.columnComparision === "<" ||
			newRules.columnComparision === ">" ||
			newRules.columnComparision === "<=" ||
			newRules.columnComparision === ">=";

		function deleteAssignedRule(_rule: ColourRule, index: number) {
			let assignedRules = appliedRules.filter((_, i) => i !== index);
			assignedRules = assignedRules.map((item, i) => ({
				...item,
				index: i,
			}));
			functionCallReference.current.applyRulesToChart = true;
			setAppliedRules(assignedRules);
		}

		function editAssignedRule(rule: ColourRule, _index: number) {
			setNewRules(rule);
		}

		return (
			<div className="flex w-full flex-col gap-4 p-4">
				<h3 className="font-medium text-sm">Applied Rules</h3>
				<div className="overflow-x-auto">
					<table className="w-full border-collapse text-sm">
						<thead>
							<tr className="border-b">
								<th className="py-1 pr-2 text-left">Column</th>
								<th className="py-1 pr-2 text-left">
									Applied Rule
								</th>
								<th className="py-1 text-left">Action</th>
							</tr>
						</thead>
						<tbody>
							{appliedRules.length === 0 && (
								<tr>
									<td
										colSpan={3}
										className="py-2 text-muted-foreground"
									>
										No Records Found
									</td>
								</tr>
							)}
							{appliedRules.map((rule, index) => (
								<tr key={rule.index} className="border-b">
									<td className="py-1 pr-2">
										{rule.column} {rule.columnToColour}
									</td>
									<td className="py-1 pr-2">{`${rule.column} ${
										rule.columnComparision
									} ${
										rule.columnComparision === "==" ||
										rule.columnComparision === "!="
											? rule.valuesToColour.join(",")
											: rule.filterValue
									}`}</td>
									<td className="py-1">
										<div className="flex gap-2">
											<button
												type="button"
												className="text-muted-foreground hover:text-foreground"
												onClick={() =>
													deleteAssignedRule(
														rule,
														index,
													)
												}
											>
												<Trash2 className="h-4 w-4" />
											</button>
											<button
												type="button"
												className="text-muted-foreground hover:text-foreground"
												onClick={() =>
													editAssignedRule(
														rule,
														index,
													)
												}
											>
												<Pencil className="h-4 w-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<h3 className="font-medium text-sm">New Rule</h3>
				<div className="flex flex-row gap-2">
					<div className="flex-1">
						<Select
							value={newRules.column}
							onValueChange={(val) => updateField("column", val)}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select Column" />
							</SelectTrigger>
							<SelectContent>
								{data.columns?.map((cols, index) => (
									<SelectItem
										// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
										key={index}
										value={cols.selector}
									>
										{cols.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex-1">
						<Input
							name="columnColour"
							type="color"
							value={newRules.columnColour}
							onChange={(e) =>
								updateField("columnColour", e.target.value)
							}
						/>
					</div>
				</div>
				<div className="flex flex-row gap-2">
					<div className="flex-1">
						<Select
							value={newRules.columnToColour}
							onValueChange={(val) =>
								updateField("columnToColour", val)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select Column" />
							</SelectTrigger>
							<SelectContent>
								{data.columns?.map((cols, index) => (
									<SelectItem
										// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
										key={index}
										value={cols.selector}
									>
										{cols.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex-1">
						<Select
							value={newRules.columnComparision}
							onValueChange={(val) =>
								updateField("columnComparision", val)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select Comparison" />
							</SelectTrigger>
							<SelectContent>
								{columnComparision.map((cols, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
									<SelectItem key={index} value={cols.value}>
										{cols.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				{(newRules.columnComparision === "==" ||
					newRules.columnComparision === "!=") && (
					<select
						multiple
						className="min-h-[80px] w-full rounded border px-2 py-1 text-sm"
						value={newRules.valuesToColour}
						onChange={(e) => {
							const selected = Array.from(
								e.target.selectedOptions,
							).map((o) => o.value);
							updateField("valuesToColour", selected);
						}}
					>
						{valuesToColour.length === 0 && (
							<option value="" disabled>
								No Values to display
							</option>
						)}
						{valuesToColour.map((col, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
							<option key={index} value={col}>
								{col}
							</option>
						))}
					</select>
				)}
				{conditionForShowingField && (
					<div className="flex flex-col gap-1">
						<span className="text-muted-foreground text-xs">
							Min: {newRules.filterMinValue} | Max:{" "}
							{newRules.filterMaxValue}
						</span>
						<Input
							name="filterValue"
							type="number"
							value={newRules.filterValue}
							onChange={(e) =>
								updateField(
									"filterValue",
									Number(e.target.value),
								)
							}
							placeholder="Select Value"
						/>
					</div>
				)}
				<div className="flex justify-start">
					<Button onClick={updateData}>Execute</Button>
				</div>
			</div>
		);
	},
);
export default ColourByValue;
