import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	type BlockDef,
	getValueByPath,
	type PathValue,
} from "@semoss/renderer";
import { Button, Input, Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";
import { ColorPickerSettings } from "../../../../shared/ColorPickerSettings";

// biome-ignore lint/correctness/noUnusedVariables: used in JSX or callback
interface LabelsDendrogramProps {
	id: string;
	// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
	path: any;
}

export const LabelsDendrogram = observer(
	<D extends BlockDef = BlockDef>({ id, path }) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [seriesIndexData, setSeriesIndexData] = useState(
			"option.series.0.label.color",
		);
		const [labelsData, setLabelsData] = useState({
			showLabels: false,
			labelFontColor: "#000000",
			labelFontSize: 12,
		});
		const [labelsUpdated, setLabelsUpdated] = useState(false);
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
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
		function updateFields(fieldsName: string, fieldsValue: any) {
			setLabelsUpdated(true);
			setLabelsData({
				...labelsData,
				[fieldsName]: fieldsValue,
			});
		}
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (!labelsUpdated) return;
			const option: PathValue<D["data"], typeof path> =
				typeof computedValue === "string"
					? JSON.parse(computedValue)
					: computedValue;
			const seriesIndex = option.series.findIndex(
				(item) => item.type === "tree" && item.data.length > 0,
			);
			option.series[seriesIndex] = {
				...option.series[seriesIndex],
				label: {
					...option.series[seriesIndex].label,
					fontSize: labelsData.labelFontSize,
					show: labelsData.showLabels,
				},
			};
			runStateUpdateCustom(option);
		}, [labelsData]);
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const option: PathValue<D["data"], typeof path> =
				typeof computedValue === "string"
					? JSON.parse(computedValue)
					: computedValue;
			const seriesIndex = option.series.findIndex(
				(item) => item.type === "tree" && item.data.length > 0,
			);
			const labelsDataList = labelsData;
			labelsDataList.showLabels = option.series[seriesIndex].label.show;
			labelsDataList.labelFontColor =
				option.series[seriesIndex].label.color;
			labelsDataList.labelFontSize = Number(
				option.series[seriesIndex].label.fontSize,
			);
			setLabelsUpdated(false);
			setLabelsData({ ...labelsDataList });
			setSeriesIndexData(`option.series.${seriesIndex}.label.color`);
		}, []);
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		function runStateUpdateCustom(option: any) {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			timeoutRef.current = setTimeout(() => {
				try {
					setData(path, option);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		}

		function resetToInitialState() {
			setLabelsData({
				showLabels: false,
				labelFontColor: "#000000",
				labelFontSize: 18,
			});
		}

		const showLabelsEnabled = labelsData.showLabels;
		return (
			<div className="flex flex-col p-2">
				<div className="flex flex-row items-center gap-2 p-2">
					<Switch
						checked={showLabelsEnabled}
						onCheckedChange={(checked: boolean) =>
							updateFields("showLabels", checked)
						}
					/>
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/a11y/noLabelWithoutControl: label */}
					<label className="pl-2 text-sm">Show Labels</label>
				</div>
				{showLabelsEnabled && (
					<div className="flex flex-col gap-2 p-2">
						<ColorPickerSettings
							id={id}
							path={seriesIndexData}
							colorValue={labelsData.labelFontColor}
							onChange={() => {}}
						/>
					</div>
				)}
				{showLabelsEnabled && (
					<div className="flex flex-col gap-2 p-2">
						<label
							className="text-muted-foreground text-sm"
							htmlFor="label-font-size"
						>
							Label Font Size:
						</label>
						{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id*/}
						<Input
							id="label-font-size"
							type="number"
							value={labelsData.labelFontSize}
							onChange={(e) =>
								updateFields("labelFontSize", e.target.value)
							}
						/>
					</div>
				)}
				<div className="flex justify-end p-2">
					<Button onClick={resetToInitialState}>Reset</Button>
				</div>
			</div>
		);
	},
);
