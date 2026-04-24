import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import { Slider, Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const StackChartBarStyle = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [value, setValue] = useState("");
		const [barWidth, setBarWidth] = useState(10);
		const [flipAxis, setFlipAxis] = useState(false);
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
			setValue(computedValue);
		}, [computedValue, data]);

		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (Object.hasOwn(data, "option")) {
				reinitializeFeatures(data.option);
			}
		}, [id]);

		/**
		 * Reinitializes the features of the tooltip based on the provided options.
		 * @param options The options to reinitialize the features with.
		 */
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const reinitializeFeatures = (options: any) => {
			if (Object.hasOwn(options, "barWidth")) {
				setBarWidth(options.barWidth);
			}
			if (Object.hasOwn(options, "flipAxis")) {
				setFlipAxis(options.flipAxis);
			}
		};
		// this function is used to set the barWidth of the stack chart
		const stackbarWidth = (newValue: number[]) => {
			const option = JSON.parse(value);
			setBarWidth(newValue[0]);
			option.barWidth = newValue[0];
			setData(path, option as PathValue<D["data"], typeof path>);
		};
		// this function is used to flip the axis of the stack chart
		const flipAxisStack = (checked: boolean) => {
			const option = JSON.parse(value);
			setFlipAxis(checked);
			option.flipAxis = checked;
			if (checked === true) {
				option.xAxis.name = option.yAxis.flipAxisName;
				option.yAxis.name = option.xAxis.flipAxisName;
				option.xAxis.pixelName = option.yAxis.axisName;
				option.yAxis.pixelName = option.xAxis.axisName;
				option.xAxis.type = "value";
				option.yAxis.type = "category";
			} else {
				option.xAxis.name = option.xAxis.flipAxisName;
				option.yAxis.name = option.yAxis.flipAxisName;
				option.xAxis.pixelName = option.xAxis.axisName;
				option.yAxis.pixelName = option.yAxis.axisName;
				option.xAxis.type = "category";
				option.yAxis.type = "value";
			}
			setData(path, option as PathValue<D["data"], typeof path>);
		};
		return (
			<div className="flex flex-col p-2">
				<div className="flex flex-col gap-2 p-2">
					<span className="text-sm">Bar Width</span>
					<Slider
						min={0}
						max={40}
						value={[barWidth]}
						onValueChange={stackbarWidth}
					/>
				</div>
				<div className="ml-1 flex flex-row items-center p-2">
					<Switch
						checked={flipAxis}
						onCheckedChange={flipAxisStack}
					/>
					<span className="pl-2.5 text-sm">Flip Axis</span>
				</div>
			</div>
		);
	},
);
