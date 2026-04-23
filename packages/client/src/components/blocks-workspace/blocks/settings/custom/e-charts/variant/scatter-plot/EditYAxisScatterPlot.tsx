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
import { Button, Input, Slider, Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const EditYAxisScatterPlot = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [showYaxis, setShowYaxis] = useState(true);
		const [value, setValue] = useState("");
		const [showYaxisTitle, setShowYaxisTitle] = useState(true);
		const [yaxisTitle, setYaxisTitle] = useState("");
		const [fontSizeYAxis, setFontSizeYAxis] = useState(12);
		const [fontSizeYAxisLabel, setFontSizeYAxisLabel] = useState(11);
		const [rotateYaxis, setRotateYaxis] = useState(0);
		const [showYaxisTick, setShowYaxisTick] = useState(false);
		const [showAxisLabel, setShowAxisLabel] = useState(true);
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

		const reinitializeFeatures = (options) => {
			if (Object.hasOwn(options, "yAxis")) {
				if (options.yAxis && Object.hasOwn(options.yAxis, "show")) {
					setShowYaxis(options.yAxis.show);
				}
				if (
					options.yAxis?.axisTick &&
					Object.hasOwn(options.yAxis.axisTick, "show")
				) {
					setShowYaxisTick(options.yAxis.axisTick.show);
				}
				if (options.yAxis?.axisLabel) {
					setRotateYaxis(options.yAxis.axisLabel.rotate);
					setShowAxisLabel(options.yAxis.axisLabel.show);
					setFontSizeYAxisLabel(options.yAxis.axisLabel.fontSize);
				}
				if (
					options.yAxis?.nameTextStyle &&
					Object.hasOwn(options.yAxis.nameTextStyle, "fontSize")
				) {
					setFontSizeYAxis(options.yAxis.nameTextStyle.fontSize);
				}
			}
		};
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (Object.hasOwn(data, "option")) {
				retainYAxisTitle(data.option);
			}
		}, [data.option.yAxis.name]);

		const retainYAxisTitle = (options) => {
			if (Object.hasOwn(options, "yAxis")) {
				if (options.yAxis && Object.hasOwn(options.yAxis, "name")) {
					setYaxisTitle(data.option.yAxis.name);
				}
			}
		};

		const showYAxis = (checked: boolean) => {
			const option = JSON.parse(value);
			setShowYaxis(checked);
			option.yAxis.show = checked;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const showYAxisTitle = (checked: boolean) => {
			const option = JSON.parse(value);
			setShowYaxisTitle(checked);
			option.yAxis.name =
				option.yAxis.name === "" ? option.yAxis.pixelName : "";
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const handleYaxisTitleChange = (e) => {
			setYaxisTitle(e.target.value);
			const option = JSON.parse(value);
			option.yAxis.name = e.target.value;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const handleChangeYAxisFontSize = (e) => {
			const option = JSON.parse(value);
			setFontSizeYAxis(e.target.valueAsNumber);
			option.yAxis.nameTextStyle.fontSize = e.target.valueAsNumber;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const handleChangeYAxisLabelFontSize = (e) => {
			const option = JSON.parse(value);
			setFontSizeYAxisLabel(e.target.value);
			option.yAxis.axisLabel.fontSize = e.target.value;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const rotateYAxis = (newValue: number[]) => {
			const option = JSON.parse(value);
			setRotateYaxis(newValue[0]);
			option.yAxis.axisLabel.rotate = newValue[0];
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const showYAxisTick = (checked: boolean) => {
			const option = JSON.parse(value);
			setShowYaxisTick(checked);
			option.yAxis.axisTick.show = checked;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const showYAxisLabel = (checked: boolean) => {
			const option = JSON.parse(value);
			setShowAxisLabel(checked);
			option.yAxis.axisLabel.show = checked;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const Reset = () => {
			const option = JSON.parse(value);
			setShowYaxis(option.reset.axis.yaxis.show);
			setShowYaxisTitle(true);
			setYaxisTitle(option.yAxis.pixelName);
			setFontSizeYAxis(option.reset.axis.yaxis.nameTextStyle.fontSize);
			setFontSizeYAxisLabel(option.reset.axis.yaxis.axisLabel.fontSize);
			setRotateYaxis(option.reset.axis.yaxis.axisLabel.rotate);
			setShowYaxisTick(option.reset.axis.yaxis.axisTick.show);
			setShowAxisLabel(option.reset.axis.yaxis.axisLabel.show);
			option.yAxis.show = option.reset.axis.yaxis.show;
			option.yAxis.name = option.yAxis.pixelName;
			option.yAxis.nameTextStyle.fontSize =
				option.reset.axis.yaxis.nameTextStyle.fontSize;
			option.yAxis.axisLabel.fontSize =
				option.reset.axis.yaxis.axisLabel.fontSize;
			option.yAxis.axisLabel.rotate =
				option.reset.axis.yaxis.axisLabel.rotate;
			option.yAxis.axisTick.show = option.reset.axis.yaxis.axisTick.show;
			option.yAxis.axisLabel.show =
				option.reset.axis.yaxis.axisLabel.show;
			setData(path, option as PathValue<D["data"], typeof path>);
		};
		return (
			<div className="flex flex-col">
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch checked={showYaxis} onCheckedChange={showYAxis} />
					<span className="text-sm">Show/Hide Axis</span>
				</div>
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={showYaxisTitle}
						onCheckedChange={showYAxisTitle}
					/>
					<span className="text-sm">Show Axis Title</span>
				</div>
				{showYaxisTitle && (
					<div className="flex flex-col">
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Set Y Axis Title
							</span>
							{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
							// biome-ignore
							{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
							<Input
								id="xaxis-title"
								value={yaxisTitle}
								onChange={handleYaxisTitleChange}
							/>
						</div>
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Edit Axis Title Font Size
							</span>
							{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
							// biome-ignore
							{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
							<Input
								id="xaxis-edit-title-font-size"
								type="number"
								value={fontSizeYAxis}
								onChange={handleChangeYAxisFontSize}
							/>
						</div>
					</div>
				)}
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={showAxisLabel}
						onCheckedChange={showYAxisLabel}
					/>
					<span className="text-sm">Show Labels</span>
				</div>
				{showAxisLabel && (
					<div className="flex flex-col">
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Edit Label Font Size
							</span>
							{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
							// biome-ignore
							{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
							<Input
								id="yaxis-label-font-size"
								type="number"
								value={fontSizeYAxisLabel}
								onChange={handleChangeYAxisLabelFontSize}
							/>
						</div>
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-sm">Rotate Labels</span>
							<Slider
								min={0}
								max={360}
								value={[rotateYaxis]}
								onValueChange={rotateYAxis}
							/>
						</div>
					</div>
				)}
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={showYaxisTick}
						onCheckedChange={showYAxisTick}
					/>
					<span className="text-sm">Show Axis Line Ticks</span>
				</div>
				<div className="flex justify-end px-4 py-2">
					<Button onClick={Reset}>Reset</Button>
				</div>
			</div>
		);
	},
);
