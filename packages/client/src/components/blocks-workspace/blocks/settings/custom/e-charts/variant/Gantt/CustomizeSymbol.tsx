import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
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
import { useBlockSettings } from "@/hooks";
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

export const CustomizeSymbol = observer(
	<D extends BlockDef = BlockDef>({ id, path }) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [customizeSymbolData, setCustomizeSymbolData] =
			useState(INITIAL_CUSTOM_STYLE);
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const [appliedSymbolData, setAppliedSymbolData] = useState<any[]>([]);
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const [dimensionList, setDimensionList] = useState<any[]>([]);
		const [dimensionSelected, setDimensionSelected] = useState("");
		const [dimensionInstance, setDimensionInstance] = useState<
			// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
			Record<string, any[]>
		>({
			startdate: [],
			enddate: [],
			milestone: [],
		});
		const [editingInstanceIndex, setEditingInstanceIndex] = useState(-1);

		const _symbolList = [
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
				existingOptionList.symbolSize = existingOption.symbolSize;
			if (existingOption?.symbolColor)
				existingOptionList.symbolColor = existingOption.symbolColor;
			if (existingOption?.symbolColorSelected)
				existingOptionList.symbolColorSelected =
					existingOption.symbolColorSelected;
			setCustomizeSymbolData((prev) => ({
				...prev,
				...existingOptionList,
			}));

			const seriesIndex = option.series.findIndex((item) =>
				Object.hasOwn(item, "chartrendered"),
			);
			const mileStoneIndex = option.series.findIndex((item) =>
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
					option.series[seriesIndex]?.data?.map(
						(item) => item.value[0],
					) || [];
				endDateData =
					option.series[seriesIndex]?.data?.map(
						(item) => item.value[2],
					) || [];
				mileStone =
					option.series[mileStoneIndex]?.data?.map(
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
		function _updateFields(field: string, directValue: any) {
			setCustomizeSymbolData((prevSymbolData) => ({
				...prevSymbolData,
				[field]: directValue,
			}));
			if (field === "dimension") {
				const dimensionSelectedItem = dimensionList.find(
					(item) => item.selector === directValue,
				);
				if (
					dimensionSelectedItem &&
					Object.hasOwn(dimensionSelectedItem, "currentKey")
				) {
					setDimensionSelected(dimensionSelectedItem.currentKey);
				}
			}
		}

		const _dimensionListUpdated = dimensionList.map((item) => ({
			label: item.name,
			value: item.selector,
		}));

		const _showSymbolColor = !!customizeSymbolData.symbolColorSelected;
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const _dimensionInstanceToRender: any[] =
			dimensionInstance[dimensionSelected]?.map((item) => item) || [];

		const _dimensionNameSelected =
			dimensionList.find(
				(item) => item.selector === customizeSymbolData.dimension,
			)?.name || customizeSymbolData.dimension;

		function _updateChartData() {
			const option = JSON.parse(computedValue);
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
										dimension:
											customizeSymbolData.dimension,
										symbol: customizeSymbolData.symbol,
										symbolSize:
											customizeSymbolData.symbolSize,
										symbolColor:
											customizeSymbolData.symbolColor ||
											GANTT_CHART.MILESTONE_COLOR,
										symbolColorSelected:
											customizeSymbolData.symbolColorSelected,
										dimensionSelected: dimensionSelected,
										dimensionValues:
											customizeSymbolData.dimensionInstance,
									},
								]
							: [
									{
										dimension:
											customizeSymbolData.dimension,
										symbol: customizeSymbolData.symbol,
										symbolSize:
											customizeSymbolData.symbolSize,
										symbolColor:
											customizeSymbolData.symbolColor ||
											GANTT_CHART.MILESTONE_COLOR,
										symbolColorSelected:
											customizeSymbolData.symbolColorSelected,
										dimensionSelected: dimensionSelected,
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
							dimension: customizeSymbolData.dimension,
							symbol: customizeSymbolData.symbol,
							symbolSize: customizeSymbolData.symbolSize,
							symbolColor:
								customizeSymbolData.symbolColor ||
								GANTT_CHART.MILESTONE_COLOR,
							symbolColorSelected:
								customizeSymbolData.symbolColorSelected,
							dimensionSelected: dimensionSelected,
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
							dimension: customizeSymbolData.dimension,
							symbol: customizeSymbolData.symbol,
							symbolSize: customizeSymbolData.symbolSize,
							symbolColor:
								customizeSymbolData.symbolColor ||
								GANTT_CHART.MILESTONE_COLOR,
							symbolColorSelected:
								customizeSymbolData.symbolColorSelected,
							dimensionSelected: dimensionSelected,
							dimensionValues:
								customizeSymbolData.dimensionInstance,
						};
					} else {
						appliedSymbolDataList.push({
							dimension: customizeSymbolData.dimension,
							symbol: customizeSymbolData.symbol,
							symbolSize: customizeSymbolData.symbolSize,
							symbolColor:
								customizeSymbolData.symbolColor ||
								GANTT_CHART.MILESTONE_COLOR,
							symbolColorSelected:
								customizeSymbolData.symbolColorSelected,
							dimensionSelected: dimensionSelected,
							dimensionValues:
								customizeSymbolData.dimensionInstance,
						});
					}
					setAppliedSymbolData(appliedSymbolDataList);
					setCustomizeSymbolData(INITIAL_CUSTOM_STYLE);
				} catch (_e) {}
			}, 300);
		}

		function _deleteAppliedData(index: number) {
			const option = JSON.parse(computedValue);
			const updatedAppliedData = appliedSymbolData.filter(
				(_, itemIndex) => itemIndex !== index,
			);
			setAppliedSymbolData(updatedAppliedData);
			if (option.customSettings.gantttools?.customizeSymbol) {
				option.customSettings.gantttools.customizeSymbol =
					option.customSettings.gantttools.customizeSymbol.filter(
						(_, filterindex) => filterindex !== index,
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

		function _applyToCurrentCustom(index: number) {
			if (appliedSymbolData?.[index]) {
				setCustomizeSymbolData({
					...appliedSymbolData[index],
					dimensionInstance: appliedSymbolData[index].dimensionValues,
				});
				setEditingInstanceIndex(index);
			}
		}

		function _resetToInitialState() {
			setCustomizeSymbolData({
				dimension: "",
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
			label:
				"Instances of " +
				(dimensionList.find(
					(dimItem) => dimItem.selector === item.dimension,
				)?.name || item),
			itemData: index,
			itemColor: item.symbolColor,
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
							{updatedInstances.map((item, index) => (
								// biome-ignore lint/a11y/noStaticElementInteractions: visual item
								// biome-ignore lint/a11y/useKeyWithClickEvents: visual item
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
									key={index}
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
				{dimensionListUpdated.length > 0 && (
					<div className="flex flex-col gap-2 p-2">
						<label
							className="text-muted-foreground text-sm"
							htmlFor="dimension"
						>
							Select Dimension
						</label>
						<Select
							value={customizeSymbolData.dimension}
							onValueChange={(val) =>
								updateFields("dimension", val)
							}
						>
							{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
							// biome-ignore
							lint/correctness/useUniqueElementIds: component
							instance ids
							{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
							<SelectTrigger
								className="w-full"
								id="dimension-field"
							>
								<SelectValue placeholder="Select Dimension Field" />
							</SelectTrigger>
							<SelectContent>
								{dimensionListUpdated.map((item, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
									<SelectItem key={index} value={item.value}>
										{item.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
				{customizeSymbolData.dimension && (
					<div className="flex flex-col gap-2 p-2">
						<BaseSettingSection
							label={`Instance for ${dimensionNameSelected}`}
						>
							<select
								multiple
								className="min-h-[80px] w-full rounded border px-2 py-1 text-sm"
								value={customizeSymbolData.dimensionInstance}
								onChange={(e) => {
									const selected = Array.from(
										e.target.selectedOptions,
									).map((opt) => opt.value);
									updateFields("dimensionInstance", selected);
								}}
							>
								{dimensionInstanceToRender.map(
									(item, index) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
										<option key={index} value={item}>
											{item}
										</option>
									),
								)}
							</select>
						</BaseSettingSection>
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
							{symbolList.map((item, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								<SelectItem key={index} value={item.value}>
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
						min={1}
						max={360}
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
					<Button onClick={() => updateChartData()}>Execute</Button>
				</div>
			</div>
		);
	},
);
