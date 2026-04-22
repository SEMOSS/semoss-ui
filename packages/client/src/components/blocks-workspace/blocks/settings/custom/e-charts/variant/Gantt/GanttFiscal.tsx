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
	Switch,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

//Initial fiscal axis state
const INITIAL_FISCAL_AXIS = {
	enableFiscalAxis: false,
	fiscalYearStart: "",
	fiscalBackGroundColor: "#0471f0",
};

export const GanttFiscal = observer(
	<D extends BlockDef = BlockDef>({ id, path }) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id); //block data
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null); //timeout ref to update state
		//month data to select the fiscal year start month
		const monthData = [
			{
				label: "January",
				value: "Jan",
				monthDigit: "00",
			},
			{
				label: "February",
				value: "Feb",
				monthDigit: "01",
			},
			{
				label: "March",
				value: "Mar",
				monthDigit: "02",
			},
			{
				label: "April",
				value: "Apr",
				monthDigit: "03",
			},
			{
				label: "May",
				value: "May",
				monthDigit: "04",
			},
			{
				label: "June",
				value: "Jun",
				monthDigit: "05",
			},
			{
				label: "July",
				value: "Jul",
				monthDigit: "06",
			},
			{
				label: "Augest",
				value: "Aug",
				monthDigit: "07",
			},
			{
				label: "September",
				value: "Sep",
				monthDigit: "08",
			},
			{
				label: "October",
				value: "Oct",
				monthDigit: "09",
			},
			{
				label: "November",
				value: "Nov",
				monthDigit: "10",
			},
			{
				label: "December",
				value: "Dec",
				monthDigit: "11",
			},
		];
		const [fiscalData, setFiscalData] = useState(INITIAL_FISCAL_AXIS); //fiscal data state
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
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		function updateData(field: string, directVal: any) {
			setFiscalData((prevFiscalData) => {
				return {
					...prevFiscalData,
					[field]: directVal,
				};
			});
		}
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const option = JSON.parse(computedValue);
			const fiscalDataForUpdate = fiscalData;
			if (option.customSettings?.gantttools?.enableFiscalAxis) {
				fiscalDataForUpdate.enableFiscalAxis =
					option.customSettings?.gantttools?.enableFiscalAxis;
			}
			if (option.customSettings?.gantttools?.fiscalYearStart) {
				fiscalDataForUpdate.fiscalYearStart =
					option.customSettings?.gantttools?.fiscalYearStart;
			}
			if (option.customSettings?.gantttools?.fiscalYearStart) {
				fiscalDataForUpdate.fiscalBackGroundColor =
					option.customSettings?.gantttools?.fiscalAxisBackgroundColor;
			}
			setFiscalData((prevFiscalData) => {
				return {
					...prevFiscalData,
					...fiscalDataForUpdate,
				};
			});
		}, []);
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			let option = JSON.parse(computedValue);
			option = {
				...option,
				customSettings: {
					...option.customSettings,
					gantttools: {
						...option.customSettings.gantttools,
						enableFiscalAxis: fiscalData.enableFiscalAxis,
						fiscalYearStart: fiscalData.fiscalYearStart,
						fiscalAxisBackgroundColor:
							fiscalData.fiscalBackGroundColor,
					},
				},
			};
			if (fiscalData.fiscalYearStart !== "") {
				const seriesIndex = option.series.findIndex((item) =>
					Object.hasOwn(item, "chartrendered"),
				);

				let seriesStartData = option.series[seriesIndex].data.map(
					(item) =>
						new Date(item.value[0]).toISOString().split("T")[0],
				);
				let seriesEndData = option.series[seriesIndex].data.map(
					(item) =>
						new Date(item.value[2]).toISOString().split("T")[0],
				);
				seriesStartData = seriesStartData.sort(
					(a, b) => new Date(a).getTime() - new Date(b).getTime(),
				);
				seriesEndData = seriesEndData.sort(
					(a, b) => new Date(a).getTime() - new Date(b).getTime(),
				);
				const monthDigit =
					monthData.find(
						(item) => item.value === fiscalData.fiscalYearStart,
					).monthDigit || "-1";
				const monthYear =
					seriesStartData
						.find(
							(item) =>
								new Date(item).getMonth() ===
								parseInt(monthDigit, 10),
						)
						?.split("-")?.[0] || "";
				if (monthYear !== "") {
					option.customSettings.gantttools = {
						...option.customSettings.gantttools,
						fiscalYearValue: monthYear,
					};
				} else {
					option.customSettings.gantttools = {
						...option.customSettings.gantttools,
						fiscalYearValue: seriesStartData[0].split("-")[0],
					};
				}
			}
			runStateUpdate(option);
		}, [fiscalData]);
		//reset the fiscal data to initial state
		function resetToInitialState() {
			setFiscalData({
				enableFiscalAxis: false,
				fiscalYearStart: "",
				fiscalBackGroundColor: "#0471f0",
			});
		}
		//run the state update when fiscal data is changed
		function runStateUpdate(option) {
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
				} catch (_e) {}
			}, 300);
		}

		return (
			<div className="flex flex-col border-[#E6E6E6] border-b p-3">
				<div className="flex flex-row items-center gap-2 py-2">
					<Switch
						checked={fiscalData.enableFiscalAxis}
						onCheckedChange={(checked: boolean) => {
							updateData("enableFiscalAxis", checked);
						}}
					/>
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label className="pl-2.5 text-sm">Enable Fiscal Axis</label>
				</div>
				<div className="flex flex-col gap-2 py-2">
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label className="text-muted-foreground text-sm">
						Fiscal Year Start
					</label>
					<Select
						value={fiscalData.fiscalYearStart}
						onValueChange={(val) =>
							updateData("fiscalYearStart", val)
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select Month" />
						</SelectTrigger>
						<SelectContent>
							{monthData.map((item) => (
								<SelectItem key={item.value} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2 py-2">
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label className="text-muted-foreground text-sm">
						Input a color Hex Code for Axis If Desired
					</label>
					<Input
						type="color"
						value={fiscalData.fiscalBackGroundColor}
						onChange={(e) =>
							updateData("fiscalBackGroundColor", e.target.value)
						}
					/>
				</div>
				<div className="flex justify-end pt-2">
					<Button onClick={resetToInitialState}>Reset</Button>
				</div>
			</div>
		);
	},
);
