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
import { useBlockSettings } from "@/hooks";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const XAxisStyling = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [value, setValue] = useState("");
		const [showXAxis, setShowXAxis] = useState(true);
		const [showXAxisTitle, setShowXAxisTitle] = useState(true);
		const [showXAxisTick, setShowXAxisTick] = useState(true);
		const [xAxisTitle, setXAxisTitle] = useState(data.option?.xAxis.name);
		const [xAxisFont, setXAxisFont] = useState(10);
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
		}, [showXAxis]);
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const retainLocalState = (options: any) => {
			setShowXAxis(options.xAxis.show);
			setShowXAxisTitle(options.xAxis.name !== "");
			if (options.reset.xAxis.updatedName === null) {
				setXAxisTitle(options.xAxis.name);
			} else {
				if (Object.hasOwn(options.reset.xAxis, "updatedName")) {
					setXAxisTitle(options.reset.xAxis.updatedName);
					options.xAxis.name = options.reset.xAxis.updatedName;
					setData(path, options as PathValue<D["data"], typeof path>);
				} else {
					setXAxisTitle(options._state.fields.xAxis[0]);
					options.xAxis.name = options._state.fields.xAxis[0];
				}
			}
			setShowXAxisTick(options.xAxis.axisTick.show);
			setXAxisFont(options.xAxis.nameTextStyle.fontSize);
		};
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const reInitializeFeatures = (options: any) => {
			setShowXAxis(options.xAxis.show);
		};
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		function handleInputChange(title: string, inputValue: any) {
			const option = JSON.parse(value);
			switch (title) {
				case "showXAxis":
					option.xAxis.show = inputValue;
					setShowXAxis(inputValue);
					break;
				case "showXAxisTitle":
					if (inputValue) {
						option.xAxis.name = xAxisTitle;
						option.reset.xAxis.updatedName = xAxisTitle;
					} else {
						option.xAxis.name = "";
					}
					setShowXAxisTitle(inputValue);
					break;
				case "xAxisTitle":
					option.xAxis.name = inputValue;
					option.reset.xAxis.updatedName = inputValue;
					setXAxisTitle(inputValue);
					break;
				case "showXAxisTick":
					option.xAxis.axisTick.show = inputValue;
					setShowXAxisTick(inputValue);
					break;
				case "xAxisFont":
					option.xAxis.nameTextStyle.fontSize = inputValue;
					setXAxisFont(inputValue);
					break;
			}
			setData(path, option as PathValue<D["data"], typeof path>);
		}

		function handleReset() {
			const option = JSON.parse(value);
			const xaxisName =
				option._state === undefined
					? ""
					: option._state.fields.xAxis[0];
			setShowXAxisTick(option.reset.xAxis.axisTick);
			setXAxisFont(option.reset.xAxis.axisLabelFont);
			setXAxisTitle(xaxisName);
			setShowXAxisTitle(true);
			option.xAxis.axisTick.show = option.reset.xAxis.axisTick;
			option.xAxis.nameTextStyle.fontSize =
				option.reset.xAxis.axisLabelFont;
			option.xAxis.name = xaxisName;
			option.reset.xAxis.updatedName = xaxisName;
			setData(path, option as PathValue<D["data"], typeof path>);
		}

		return (
			<div className="flex flex-col">
				<div className="mt-2 flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={!!showXAxis}
						onCheckedChange={(checked: boolean) =>
							handleInputChange("showXAxis", checked)
						}
					/>
					<span className="text-sm">Show X Axis</span>
				</div>
				{showXAxis && (
					<div className="mt-2 flex flex-row items-center gap-2 px-4 py-2">
						<Switch
							checked={!!showXAxisTitle}
							onCheckedChange={(checked: boolean) =>
								handleInputChange("showXAxisTitle", checked)
							}
						/>
						<span className="text-sm">Show X Axis Title</span>
					</div>
				)}
				{showXAxis && showXAxisTitle && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Edit X Axis Title
						</span>
						{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id*/}
						<Input
							id="xAxisTitle"
							name="xAxisTitle"
							value={xAxisTitle}
							onChange={(e) =>
								handleInputChange("xAxisTitle", e.target.value)
							}
						/>
					</div>
				)}
				{showXAxis && (
					<div className="mt-2 flex flex-row items-center gap-2 px-4 py-2">
						<Switch
							checked={!!showXAxisTick}
							onCheckedChange={(checked: boolean) =>
								handleInputChange("showXAxisTick", checked)
							}
						/>
						<span className="text-sm">Show X Axis Tick</span>
					</div>
				)}
				{showXAxis && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							XAxis Label Font Size
						</span>
						{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id*/}
						<Input
							id="labelfont"
							name="labelfont"
							value={xAxisFont}
							onChange={(e) =>
								handleInputChange("xAxisFont", e.target.value)
							}
						/>
					</div>
				)}
				{showXAxis && (
					<div className="flex justify-end px-4 py-2">
						<Button onClick={handleReset}>Reset</Button>
					</div>
				)}
			</div>
		);
	},
);
