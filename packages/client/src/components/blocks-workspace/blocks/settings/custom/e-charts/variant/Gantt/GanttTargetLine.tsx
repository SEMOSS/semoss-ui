import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type BlockDef,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type PathValue,
} from "@semoss/renderer";
import { Button, Input, Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

// biome-ignore lint/correctness/noUnusedVariables: used in JSX or callback
interface GanttTargetLineProps {
	id: string;
}
//initial target line data
const INITIAL_TARGET_LINE = {
	targetdate: "",
	targetlabel: "",
	targetcolor: "#FF0000",
	showTodayDate: false,
};
export const GanttTargetLine = observer(
	<D extends BlockDef = BlockDef>({ id, path }) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id); //block data
		const [targetLineData, setTargetLineData] =
			useState(INITIAL_TARGET_LINE); //target line data
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
		const timeoutRef = useRef(null); //timeout ref for setting data
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const option = JSON.parse(computedValue);
			if (option.customSettings?.gantttools) {
				const gantttool = option.customSettings?.gantttools;
				const targetLineDataTemp = targetLineData;
				if (gantttool?.targetLineColor) {
					targetLineDataTemp.targetcolor = gantttool.targetLineColor;
				}
				if (gantttool?.targetLineName) {
					targetLineDataTemp.targetlabel = gantttool.targetLineName;
				}
				if (gantttool?.targetDate) {
					targetLineDataTemp.targetdate = gantttool.targetDate;
				}
				if (gantttool?.showTodayDate) {
					targetLineDataTemp.showTodayDate = gantttool.showTodayDate;
				}
				setTargetLineData((prevTargetLineData) => {
					return {
						...prevTargetLineData,
						...targetLineData,
					};
				});
			}
		}, []);
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		function updateFields(e: any, field = "", directVal: any = undefined) {
			if (field !== "") {
				setTargetLineData((prevTargetLineData) => {
					return {
						...prevTargetLineData,
						[field]:
							directVal !== undefined
								? directVal
								: e.target.value,
					};
				});
			}
		}
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			updateChartData();
		}, [targetLineData]);
		//update the chart data to state by making needed changes
		function updateChartData() {
			let option = JSON.parse(computedValue);
			if (targetLineData.targetdate !== "") {
				const date = targetLineData.targetdate;
				const seriesIndex = option.series.findIndex(
					(optItem) => optItem.name === "targetDateSegment",
				);
				if (seriesIndex > -1) {
					option.series[seriesIndex] = {
						...option.series[seriesIndex],
						data: [
							{
								name: "targetDateSegment",
								value: [new Date(date).getTime()],
							},
						],
					};
				} else {
					const optionToUpdate = {
						type: "custom",
						name: "targetDateSegment",
						data: [
							{
								name: "targetDateSegment",
								value: [new Date(date).getTime()],
							},
						], // Set the date for the vertical line
					};
					option = {
						...option,
						series: [...option.series, optionToUpdate],
					};
				}
			} else {
				let seriesData = option.series;
				seriesData = seriesData.filter(
					(item) => item.name !== "targetDateSegment",
				);
				option.series = seriesData;
			}
			if (targetLineData.targetlabel !== "") {
				option.customSettings = {
					...option.customSettings,
					gantttools: {
						...option.customSettings.gantttools,
						targetLineName: targetLineData.targetlabel,
					},
				};
			}
			if (targetLineData.targetcolor !== "") {
				option.customSettings = {
					...option.customSettings,
					gantttools: {
						...option.customSettings.gantttools,
						targetLineColor: targetLineData.targetcolor,
					},
				};
			}
			if (Object.hasOwn(targetLineData, "targetdate")) {
				option.customSettings = {
					...option.customSettings,
					gantttools: {
						...option.customSettings.gantttools,
						targetDate: targetLineData.targetdate,
					},
				};
			}
			if (Object.hasOwn(targetLineData, "showTodayDate")) {
				option.customSettings = {
					...option.customSettings,
					gantttools: {
						...option.customSettings.gantttools,
						showTodayDate: targetLineData.showTodayDate,
					},
				};
			}

			runUpdateCustom(option);
		}
		//run the state updates when needed changes in option is done
		function runUpdateCustom(option) {
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
		//reset the target line data to initial state
		function resetToInitialState() {
			setTargetLineData({
				targetdate: "",
				targetlabel: "",
				targetcolor: "#FF0000",
				showTodayDate: false,
			});
		}
		//timezone based changes for date
		function convertTimeZone(date) {
			const dateConvertedToTimeZone = new Date(date)
				.toISOString()
				.split("T")[0];

			return (
				new Date(dateConvertedToTimeZone).getFullYear() +
				"-" +
				(new Date(dateConvertedToTimeZone).getMonth() + 1 < 10
					? `0${new Date(dateConvertedToTimeZone).getMonth() + 1}`
					: new Date(dateConvertedToTimeZone).getMonth() + 1) +
				"-" +
				(new Date(dateConvertedToTimeZone).getDate() < 10
					? `0${new Date(dateConvertedToTimeZone).getDate()}`
					: new Date(dateConvertedToTimeZone).getDate())
			);
		}
		return (
			<div className="flex flex-col border-[#E6E6E6] border-b p-3">
				<div className="flex flex-row items-center gap-2 py-2">
					<Switch
						checked={targetLineData.showTodayDate}
						onCheckedChange={(checked: boolean) => {
							updateFields(null, "showTodayDate", checked);
							updateFields(
								{
									target: {
										value: checked
											? convertTimeZone(new Date())
											: "",
									},
								},
								"targetdate",
							);
						}}
					/>
					<span className="pl-2.5 text-sm">Show Today Date</span>
				</div>
				<div className="flex flex-col gap-2 py-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label className="text-muted-foreground text-sm">
						Select Target Date
					</label>
					<Input
						type="date"
						value={targetLineData.targetdate}
						onChange={(e) => updateFields(e, "targetdate")}
					/>
				</div>
				<div className="flex flex-col gap-2 py-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label className="text-muted-foreground text-sm">
						Enter Target Label
					</label>
					<Input
						type="text"
						value={targetLineData.targetlabel}
						onChange={(e) => updateFields(e, "targetlabel")}
					/>
				</div>
				<div className="flex flex-col gap-2 py-2">
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label className="text-muted-foreground text-sm">
						Select Line/Label Color
					</label>
					<Input
						type="color"
						value={targetLineData.targetcolor}
						onChange={(e) => updateFields(e, "targetcolor")}
					/>
				</div>
				<div className="flex justify-end pt-2">
					<Button onClick={resetToInitialState}>Reset</Button>
				</div>
			</div>
		);
	},
);
