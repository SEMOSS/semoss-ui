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
import { Button, Input, Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const YAxisStyling = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [value, setValue] = useState("");
		const [showYAxis, setShowYAxis] = useState(true);
		const [showYAxisTitle, setShowYAxisTitle] = useState(true);
		const [showYAxisTick, setShowYAxisTick] = useState(true);
		const [yAxisTitle, setYAxisTitle] = useState("");
		const [yAxisFont, setYAxisFont] = useState(10);
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
				reInitializeFeatures(data.option);
			}
		}, [id]);
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (Object.hasOwn(data, "option")) {
				retainLocalState(data.option);
			}
		}, [showYAxis]);
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const retainLocalState = (options: any) => {
			setShowYAxis(options.yAxis.show);
			setShowYAxisTitle(options.yAxis.show);
			if (options.reset.yAxis.updatedName === null) {
				setYAxisTitle(options.yAxis.name);
			} else {
				if (Object.hasOwn(options.reset.yAxis, "updatedName")) {
					setYAxisTitle(options.reset.yAxis.updatedName);
					options.yAxis.name = options.reset.yAxis.updatedName;
					setData(path, options as PathValue<D["data"], typeof path>);
				} else {
					const yAxisNames = options._state.fields.yAxis;
					setYAxisTitle(options._state.fields.yAxis.join(","));
					for (let i = 0; i < yAxisNames.length; i++) {
						options.series[i].name = yAxisNames[i];
					}
					options.yAxis.name = yAxisNames;
					setData(path, options as PathValue<D["data"], typeof path>);
				}
			}
			setShowYAxisTick(options.yAxis.axisTick.show);
			setYAxisFont(options.yAxis.nameTextStyle.fontSize);
		};
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const reInitializeFeatures = (options: any) => {
			setShowYAxis(options.yAxis.show);
		};
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		function handleInputChange(title: string, inputValue: any) {
			const option = JSON.parse(value);
			if (title === "showYAxis") {
				option.yAxis.show = inputValue;
				setShowYAxis(inputValue);
			} else if (title === "showYAxisTitle") {
				if (inputValue) {
					const tilteNames =
						option.reset.yAxis.updatedName.split(",");
					option.yAxis.name = tilteNames;
				} else {
					option.yAxis.name = "";
				}
				setShowYAxisTitle(inputValue);
			} else if (title === "yAxisTitle") {
				setYAxisTitle(inputValue);
				const tilteNames = inputValue.split(",");
				option.yAxis.name = tilteNames;
				option.reset.yAxis.updatedName = inputValue;
			} else if (title === "showYAxisTick") {
				option.yAxis.axisTick.show = inputValue;
				setShowYAxisTick(inputValue);
			} else if (title === "yAxisFont") {
				option.yAxis.nameTextStyle.fontSize = inputValue;
				setYAxisFont(inputValue);
			}
			setData(path, option as PathValue<D["data"], typeof path>);
		}

		function handleReset() {
			const option = JSON.parse(value);
			setShowYAxisTick(option.reset.yAxis.axisTick);
			setYAxisFont(option.reset.yAxis.axisLabelFont);
			const yaxisName =
				option._state === undefined
					? ""
					: option._state.fields.yAxis.join(",");
			option.yAxis.name = option._state.fields.yAxis;
			setYAxisTitle(yaxisName);
			option.reset.yAxis.updatedName = yaxisName;
			setShowYAxisTitle(true);
			option.yAxis.axisTick.show = option.reset.yAxis.axisTick;
			option.yAxis.nameTextStyle.fontSize =
				option.reset.yAxis.axisLabelFont;
			setData(path, option as PathValue<D["data"], typeof path>);
		}

		return (
			<div className="flex flex-col">
				<div className="mt-2 flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={!!showYAxis}
						onCheckedChange={(checked: boolean) =>
							handleInputChange("showYAxis", checked)
						}
					/>
					<span className="text-sm">Show Y Axis</span>
				</div>
				{showYAxis && (
					<div className="mt-2 flex flex-row items-center gap-2 px-4 py-2">
						<Switch
							checked={!!showYAxisTitle}
							onCheckedChange={(checked: boolean) =>
								handleInputChange("showYAxisTitle", checked)
							}
						/>
						<span className="text-sm">Show Y Axis Title</span>
					</div>
				)}
				{showYAxis && showYAxisTitle && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Edit Y Axis Title
						</span>
						{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id*/}
						<Input
							id="yAxisTitle"
							name="yAxisTitle"
							value={yAxisTitle}
							onChange={(e) =>
								handleInputChange("yAxisTitle", e.target.value)
							}
						/>
					</div>
				)}
				{showYAxis && (
					<div className="mt-2 flex flex-row items-center gap-2 px-4 py-2">
						<Switch
							checked={!!showYAxisTick}
							onCheckedChange={(checked: boolean) =>
								handleInputChange("showYAxisTick", checked)
							}
						/>
						<span className="text-sm">Show Y Axis Tick</span>
					</div>
				)}
				{showYAxis && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							YAxis Label Font Size
						</span>
						{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id*/}
						<Input
							id="labelfont"
							name="labelfont"
							value={yAxisFont}
							onChange={(e) =>
								handleInputChange("yAxisFont", e.target.value)
							}
						/>
					</div>
				)}
				{showYAxis && (
					<div className="flex justify-end px-4 py-2">
						<Button onClick={handleReset}>Reset</Button>
					</div>
				)}
			</div>
		);
	},
);
