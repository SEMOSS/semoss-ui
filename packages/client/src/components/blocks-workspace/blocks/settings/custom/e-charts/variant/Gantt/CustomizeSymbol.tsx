import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useMemo, useState } from "react";
import {
	type BlockDef,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type PathValue,
} from "@semoss/renderer";
import {
	Button,
	Checkbox,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Slider,
	Switch,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BaseSettingSection } from "../../../../BaseSettingSection";
import { GANTT_CHART } from "../../Visualization.constants";

//Default custom style
const INITIAL_CUSTOM_STYLE = {
	dimension: "",
	symbol: "",
	symbolSize: 5,
	symbolColorSelected: false,
	symbolColor: "",
	dimensionInstance: [] as string[],
};

const MILESTONE_DIMENSION_KEY = "milestone";
const SYMBOL_SIZE_MIN = 1;
const SYMBOL_SIZE_MAX = 40;

type GanttSeriesDataPoint = {
	value?: unknown[];
	mileStoneOriginalDate?: unknown;
};

type GanttSeriesItem = {
	chartrendered?: boolean;
	milestonerendered?: boolean;
	data?: GanttSeriesDataPoint[];
};

const formatDisplayValue = (value: unknown) => {
	const rawValue = String(value ?? "").trim();
	if (!rawValue.length) {
		return "";
	}

	const parsedDate = new Date(rawValue);
	if (Number.isNaN(parsedDate.getTime())) {
		return rawValue;
	}

	return parsedDate.toLocaleDateString();
};

const clampSymbolSize = (value: unknown) => {
	const parsed = Number(value);
	if (Number.isNaN(parsed)) {
		return SYMBOL_SIZE_MIN;
	}

	return Math.min(SYMBOL_SIZE_MAX, Math.max(SYMBOL_SIZE_MIN, parsed));
};

export const CustomizeSymbol = observer(
	<D extends BlockDef = BlockDef>({
		id,
		path,
	}: {
		id: string;
		path: string;
	}) => {
		const fixedDimensionId = useId();
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [customizeSymbolData, setCustomizeSymbolData] =
			useState(INITIAL_CUSTOM_STYLE);
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const [appliedSymbolData, setAppliedSymbolData] = useState<any[]>([]);
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const [dimensionList, setDimensionList] = useState<any[]>([]);
		const [dimensionInstance, setDimensionInstance] = useState<
			// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
			Record<string, any[]>
		>({
			startdate: [],
			enddate: [],
			milestone: [],
		});
		const [editingInstanceIndex, setEditingInstanceIndex] = useState(-1);

		const symbolList = [
			{ label: "Circle", value: "circle" },
			{ label: "Empty Circle", value: "emptycircle" },
			{ label: "Rectangle", value: "rectangle" },
			{ label: "Round Rectangle", value: "roundrectangle" },
			{ label: "Triangle", value: "triangle" },
			{ label: "Diamond", value: "diamond" },
			{ label: "Pin", value: "pin" },
			{ label: "Arrow", value: "arrow" },
		];
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		const computedValue = useMemo(() => {
			return computed(() => {
				if (!data) {
					return "";
				}
				const v = getValueByPath(data, "option");
				if (typeof v === "undefined") {
					return "";
				} else if (typeof v === "string") {
					return v;
				}
				return JSON.stringify(v, null, 2);
			});
		}, [data, "option"]).get();
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const option = JSON.parse(computedValue);
			const optionSeries = (option.series || []) as GanttSeriesItem[];
			const columnDetails = option.customSettings?.columnDetails;
			if (columnDetails) {
				// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
				let startDate: any = {};
				// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
				let endDate: any = {};
				// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
				let milestone: any = {};
				startDate = {
					...columnDetails.startdate,
					currentKey: "startdate",
				};
				endDate = {
					...columnDetails.enddate,
					currentKey: "enddate",
				};
				milestone = Object.hasOwn(columnDetails, "milestone")
					? {
							...columnDetails.milestone,
							currentKey: "milestone",
						}
					: {};
				const finalData = [];
				if (Object.keys(startDate).length) finalData.push(startDate);
				if (Object.keys(endDate).length) finalData.push(endDate);
				if (Object.keys(milestone).length) finalData.push(milestone);
				setDimensionList([...finalData]);
			}
			const existingOption = option.customSettings.gantttools;
			const existingOptionList = { ...customizeSymbolData };
			if (existingOption?.dimension)
				existingOptionList.dimension = existingOption.dimension;
			if (existingOption?.symbol)
				existingOptionList.symbol = existingOption.symbol;
			if (existingOption?.symbolSize)
				existingOptionList.symbolSize = clampSymbolSize(
					existingOption.symbolSize,
				);
			if (existingOption?.symbolColor)
				existingOptionList.symbolColor = existingOption.symbolColor;
			if (existingOption?.symbolColorSelected)
				existingOptionList.symbolColorSelected =
					existingOption.symbolColorSelected;
			setCustomizeSymbolData((prev) => ({
				...prev,
				...existingOptionList,
			}));

			const seriesIndex = optionSeries.findIndex((item) =>
				Object.hasOwn(item, "chartrendered"),
			);
			const mileStoneIndex = optionSeries.findIndex((item) =>
				Object.hasOwn(item, "milestonerendered"),
			);
			// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
			let startDateData: any[] = [];
			// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
			let endDateData: any[] = [];
			// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
			let mileStone: any[] = [];
			if (seriesIndex >= 0) {
				startDateData =
					optionSeries[seriesIndex]?.data?.map(
						(item) => item.value?.[0],
					) || [];
				endDateData =
					optionSeries[seriesIndex]?.data?.map(
						(item) => item.value?.[2],
					) || [];
				mileStone =
					optionSeries[mileStoneIndex]?.data?.map(
						(item) => item.mileStoneOriginalDate,
					) || [];
				setDimensionInstance({
					startdate: startDateData,
					enddate: endDateData,
					milestone: mileStone,
				});
			}
			const customizeSettings =
				option.customSettings.gantttools?.customizeSymbol || [];
			setAppliedSymbolData(customizeSettings);
		}, []);
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		function updateFields(field: string, directValue: any) {
			if (field === "symbolSize") {
				const clampedSize = clampSymbolSize(directValue);
				setCustomizeSymbolData((prevSymbolData) => ({
					...prevSymbolData,
					[field]: clampedSize,
				}));
				return;
			}

			setCustomizeSymbolData((prevSymbolData) => ({
				...prevSymbolData,
				[field]: directValue,
			}));
		}

		const dimensionListUpdated = Array.from(
			new Map(
				dimensionList
					.map((item) => ({
						label: item.name,
						currentKey: item.currentKey,
						value:
							typeof item.selector === "string"
								? item.selector.trim()
								: "",
					}))
					.filter((item) => item.value.length > 0)
					.map((item) => [item.value, item]),
			),
			([, value]) => value,
		);

		const milestoneDimension = dimensionListUpdated.find(
			(item) => item.currentKey === MILESTONE_DIMENSION_KEY,
		);
		const milestoneDimensionSelector = milestoneDimension?.value || "";
		const milestoneDimensionLabel =
			milestoneDimension?.label || "MILESTONE";

		const milestoneValues = Array.from(
			new Set(
				(dimensionInstance[MILESTONE_DIMENSION_KEY] || [])
					.map((item) => String(item ?? "").trim())
					.filter((item) => item.length > 0),
			),
		);

		const hasMilestoneMapped = milestoneDimensionSelector.length > 0;

		useEffect(() => {
			if (!hasMilestoneMapped) {
				return;
			}

			if (customizeSymbolData.dimension !== milestoneDimensionSelector) {
				setCustomizeSymbolData((prev) => ({
					...prev,
					dimension: milestoneDimensionSelector,
				}));
			}
		}, [
			hasMilestoneMapped,
			milestoneDimensionSelector,
			customizeSymbolData.dimension,
		]);

		const showSymbolColor = !!customizeSymbolData.symbolColorSelected;
		const allMilestonesSelected =
			milestoneValues.length > 0 &&
			customizeSymbolData.dimensionInstance.length ===
				milestoneValues.length;
		const someMilestonesSelected =
			customizeSymbolData.dimensionInstance.length > 0 &&
			!allMilestonesSelected;
		const canExecute =
			hasMilestoneMapped &&
			milestoneValues.length > 0 &&
			customizeSymbolData.dimensionInstance.length > 0 &&
			customizeSymbolData.symbol.length > 0;

		function toggleMilestoneValue(value: string, checked: boolean) {
			if (checked) {
				const updatedValues = Array.from(
					new Set([...customizeSymbolData.dimensionInstance, value]),
				);
				updateFields("dimensionInstance", updatedValues);
				return;
			}

			const updatedValues = customizeSymbolData.dimensionInstance.filter(
				(item) => item !== value,
			);
			updateFields("dimensionInstance", updatedValues);
		}

		function toggleSelectAllMilestones(checked: boolean) {
			if (checked) {
				updateFields("dimensionInstance", milestoneValues);
				return;
			}

			updateFields("dimensionInstance", []);
		}

		function updateChartData() {
			if (!canExecute) {
				return;
			}
			const option = JSON.parse(computedValue);
			const symbolSizeToSave = clampSymbolSize(
				customizeSymbolData.symbolSize,
			);
			if (editingInstanceIndex === -1) {
				option.customSettings = {
					...option.customSettings,
					gantttools: {
						...option.customSettings.gantttools,
						customizeSymbol: option.customSettings.gantttools
							?.customizeSymbol
							? [
									...option.customSettings.gantttools
										.customizeSymbol,
									{
										dimension: milestoneDimensionSelector,
										symbol: customizeSymbolData.symbol,
										symbolSize: symbolSizeToSave,
										symbolColor:
											customizeSymbolData.symbolColor ||
											GANTT_CHART.MILESTONE_COLOR,
										symbolColorSelected:
											customizeSymbolData.symbolColorSelected,
										dimensionSelected:
											MILESTONE_DIMENSION_KEY,
										dimensionValues:
											customizeSymbolData.dimensionInstance,
									},
								]
							: [
									{
										dimension: milestoneDimensionSelector,
										symbol: customizeSymbolData.symbol,
										symbolSize: symbolSizeToSave,
										symbolColor:
											customizeSymbolData.symbolColor ||
											GANTT_CHART.MILESTONE_COLOR,
										symbolColorSelected:
											customizeSymbolData.symbolColorSelected,
										dimensionSelected:
											MILESTONE_DIMENSION_KEY,
										dimensionValues:
											customizeSymbolData.dimensionInstance,
									},
								],
					},
				};
			} else {
				if (
					Object.hasOwn(
						option.customSettings.gantttools,
						"customizeSymbol",
					)
				) {
					if (
						option.customSettings.gantttools.customizeSymbol?.[
							editingInstanceIndex
						]
					) {
						option.customSettings.gantttools.customizeSymbol[
							editingInstanceIndex
						] = {
							dimension: milestoneDimensionSelector,
							symbol: customizeSymbolData.symbol,
							symbolSize: symbolSizeToSave,
							symbolColor:
								customizeSymbolData.symbolColor ||
								GANTT_CHART.MILESTONE_COLOR,
							symbolColorSelected:
								customizeSymbolData.symbolColorSelected,
							dimensionSelected: MILESTONE_DIMENSION_KEY,
							dimensionValues:
								customizeSymbolData.dimensionInstance,
						};
					}
				}
			}
			setTimeout(() => {
				try {
					setData(
						"option",
						option as PathValue<D["data"], typeof path>,
					);
					const appliedSymbolDataList = [...appliedSymbolData];
					if (
						editingInstanceIndex > -1 &&
						appliedSymbolDataList?.[editingInstanceIndex]
					) {
						appliedSymbolDataList[editingInstanceIndex] = {
							dimension: milestoneDimensionSelector,
							symbol: customizeSymbolData.symbol,
							symbolSize: symbolSizeToSave,
							symbolColor:
								customizeSymbolData.symbolColor ||
								GANTT_CHART.MILESTONE_COLOR,
							symbolColorSelected:
								customizeSymbolData.symbolColorSelected,
							dimensionSelected: MILESTONE_DIMENSION_KEY,
							dimensionValues:
								customizeSymbolData.dimensionInstance,
						};
					} else {
						appliedSymbolDataList.push({
							dimension: milestoneDimensionSelector,
							symbol: customizeSymbolData.symbol,
							symbolSize: symbolSizeToSave,
							symbolColor:
								customizeSymbolData.symbolColor ||
								GANTT_CHART.MILESTONE_COLOR,
							symbolColorSelected:
								customizeSymbolData.symbolColorSelected,
							dimensionSelected: MILESTONE_DIMENSION_KEY,
							dimensionValues:
								customizeSymbolData.dimensionInstance,
						});
					}
					setAppliedSymbolData(appliedSymbolDataList);
					setCustomizeSymbolData({
						...INITIAL_CUSTOM_STYLE,
						dimension: milestoneDimensionSelector,
					});
				} catch (_e) {}
			}, 300);
		}

		function deleteAppliedData(index: number) {
			const option = JSON.parse(computedValue);
			const updatedAppliedData = appliedSymbolData.filter(
				(_, itemIndex) => itemIndex !== index,
			);
			setAppliedSymbolData(updatedAppliedData);
			if (option.customSettings.gantttools?.customizeSymbol) {
				option.customSettings.gantttools.customizeSymbol =
					option.customSettings.gantttools.customizeSymbol.filter(
						(_item: unknown, filterindex: number) =>
							filterindex !== index,
					);
				setTimeout(() => {
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
		}

		function applyToCurrentCustom(index: number) {
			if (appliedSymbolData?.[index]) {
				setCustomizeSymbolData({
					...appliedSymbolData[index],
					dimension: milestoneDimensionSelector,
					dimensionSelected: MILESTONE_DIMENSION_KEY,
					symbolSize: clampSymbolSize(
						appliedSymbolData[index].symbolSize,
					),
					dimensionInstance: appliedSymbolData[index].dimensionValues,
				});
				setEditingInstanceIndex(index);
			}
		}

		function resetToInitialState() {
			setCustomizeSymbolData({
				dimension: milestoneDimensionSelector,
				symbol: "",
				symbolSize: 5,
				symbolColorSelected: false,
				symbolColor: "",
				dimensionInstance: [],
			});
			setEditingInstanceIndex(-1);
			setAppliedSymbolData([]);
			const option = JSON.parse(computedValue);
			if (option.customSettings.gantttools?.customizeSymbol) {
				option.customSettings.gantttools.customizeSymbol = [];
				setTimeout(() => {
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
		}

		const updatedInstances = appliedSymbolData.map((item, index) => ({
			label: `Instances of ${milestoneDimensionLabel}`,
			itemData: index,
			itemColor: item.symbolColor,
			itemKey: `${item.dimension}-${index}`,
		}));

		return (
			<div className="flex flex-col border-[#E6E6E6] border-b p-2">
				<div className="flex flex-col gap-2 p-2">
					<label
						className="text-muted-foreground text-sm"
						htmlFor="applied-custom-style"
					>
						Applied (Add Multiple Symbol)
					</label>
					{updatedInstances.length > 0 ? (
						<div className="flex flex-wrap gap-1 rounded-lg border border-gray-400 p-2">
							{updatedInstances.map((item) => (
								// biome-ignore lint/a11y/noStaticElementInteractions: visual item
								// biome-ignore lint/a11y/useKeyWithClickEvents: visual item
								<div
									key={item.itemKey}
									className="flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-sm"
									onClick={() =>
										applyToCurrentCustom(item.itemData)
									}
								>
									<span
										className="h-3 w-3 shrink-0 rounded-full"
										style={{
											backgroundColor:
												item.itemColor ?? "",
										}}
									/>
									<span>{item.label}</span>
									{/* biome-ignore lint/a11y/useButtonType: handled by caller*/}
									<button
										className="ml-1 text-muted-foreground hover:text-foreground"
										onClick={(e) => {
											e.stopPropagation();
											deleteAppliedData(item.itemData);
										}}
									>
										×
									</button>
								</div>
							))}
						</div>
					) : (
						<Input placeholder="No Symbol Applied" disabled />
					)}
				</div>
				<div className="flex flex-col gap-2 p-2">
					<label
						className="text-muted-foreground text-sm"
						htmlFor={fixedDimensionId}
					>
						Dimension
					</label>
					<Input id={fixedDimensionId} value="Milestone" disabled />
				</div>
				{hasMilestoneMapped ? (
					<div className="flex flex-col gap-2 p-2">
						<BaseSettingSection
							label={`Instance for ${milestoneDimensionLabel}`}
							contentClassName="w-full"
						>
							{milestoneValues.length > 0 ? (
								<div className="space-y-2 rounded border p-2">
									<div className="flex items-center gap-2 border-b pb-2">
										<Checkbox
											checked={
												allMilestonesSelected
													? true
													: someMilestonesSelected
														? "indeterminate"
														: false
											}
											onCheckedChange={(checked) =>
												toggleSelectAllMilestones(
													checked === true,
												)
											}
										/>
										<span className="text-sm">
											{allMilestonesSelected
												? "Deselect All"
												: "Select All"}
										</span>
									</div>
									<div className="max-h-44 space-y-2 overflow-auto pr-1">
										{milestoneValues.map((item) => {
											const isSelected =
												customizeSymbolData.dimensionInstance.includes(
													item,
												);

											return (
												<div
													key={item}
													className="flex items-center gap-2"
												>
													<Checkbox
														checked={isSelected}
														onCheckedChange={(
															checked,
														) =>
															toggleMilestoneValue(
																item,
																checked ===
																	true,
															)
														}
													/>
													<span className="text-sm">
														{formatDisplayValue(
															item,
														)}
													</span>
												</div>
											);
										})}
									</div>
								</div>
							) : (
								<p className="text-muted-foreground text-sm">
									No milestone values found in the chart data.
								</p>
							)}
						</BaseSettingSection>
					</div>
				) : (
					<div className="flex flex-col gap-2 p-2">
						<Input
							value="Map a field to Milestone in the data drop area to enable symbol customization."
							disabled
						/>
					</div>
				)}
				<div className="flex flex-col gap-2 p-2">
					<label
						className="text-muted-foreground text-sm"
						htmlFor="symbol"
					>
						Select a Symbol
					</label>
					<Select
						value={customizeSymbolData.symbol}
						onValueChange={(val) => updateFields("symbol", val)}
					>
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id*/}
						<SelectTrigger className="w-full" id="symbol-field">
							<SelectValue placeholder="Select Symbol" />
						</SelectTrigger>
						<SelectContent>
							{symbolList.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2 p-2">
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label className="text-muted-foreground text-sm">
						Select Symbol Size:
					</label>
					<Slider
						value={[customizeSymbolData.symbolSize]}
						min={SYMBOL_SIZE_MIN}
						max={SYMBOL_SIZE_MAX}
						onValueChange={(_v: number[]) =>
							updateFields("symbolSize", _v[0])
						}
					/>
				</div>
				<div className="flex flex-row items-center gap-2 p-2">
					<Switch
						checked={!!customizeSymbolData.symbolColorSelected}
						onCheckedChange={(_checked: boolean) =>
							updateFields("symbolColorSelected", _checked)
						}
					/>
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label className="pl-2 text-sm">Select Symbol Color</label>
				</div>
				{showSymbolColor && (
					<div className="flex flex-col gap-2 p-2">
						{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
						<label className="text-muted-foreground text-sm">
							Symbol Color
						</label>
						<Input
							type="color"
							value={customizeSymbolData.symbolColor}
							onChange={(e) =>
								updateFields("symbolColor", e.target.value)
							}
						/>
					</div>
				)}
				<div className="flex justify-end gap-2 p-2">
					<Button variant="ghost" onClick={resetToInitialState}>
						Reset
					</Button>
					<Button
						onClick={() => updateChartData()}
						disabled={!canExecute}
					>
						Execute
					</Button>
				</div>
			</div>
		);
	},
);
