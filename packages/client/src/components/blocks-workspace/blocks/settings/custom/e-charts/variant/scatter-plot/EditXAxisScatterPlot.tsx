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

export const EditXAxisScatterPlot = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [showXaxis, setShowXaxis] = useState(true);
		const [value, setValue] = useState("");
		const [showXaxisTitle, setShowXaxisTitle] = useState(true);
		const [xaxisTitle, setXaxisTitle] = useState("");
		const [fontSizeXAxis, setFontSizeXAxis] = useState(12);
		const [fontSizeXAxisLabel, setFontSizeXAxisLabel] = useState(11);
		const [rotateXaxis, setRotateXaxis] = useState(0);
		const [showXaxisTick, setShowXaxisTick] = useState(false);
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
			if (Object.hasOwn(options, "xAxis")) {
				if (options.xAxis && Object.hasOwn(options.xAxis, "show")) {
					setShowXaxis(options.xAxis.show);
				}
				if (options.xAxis && Object.hasOwn(options.xAxis, "name")) {
					setShowXaxisTitle(options.xAxis.name !== "");
				}
				if (
					options.xAxis?.axisTick &&
					Object.hasOwn(options.xAxis.axisTick, "show")
				) {
					setShowXaxisTick(options.xAxis.axisTick.show);
				}
				if (options.xAxis?.axisLabel) {
					setRotateXaxis(options.xAxis.axisLabel.rotate);
					setShowAxisLabel(options.xAxis.axisLabel.show);
					setFontSizeXAxisLabel(options.xAxis.axisLabel.fontSize);
				}
				if (
					options.xAxis?.nameTextStyle &&
					Object.hasOwn(options.xAxis.nameTextStyle, "fontSize")
				) {
					setFontSizeXAxis(options.xAxis.nameTextStyle.fontSize);
				}
			}
		};
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			if (Object.hasOwn(data, "option")) {
				retainXAxisTitle(data.option);
			}
		}, [data.option.xAxis.name]);

		const retainXAxisTitle = (options) => {
			if (Object.hasOwn(options, "xAxis")) {
				if (options.xAxis && Object.hasOwn(options.xAxis, "name")) {
					setXaxisTitle(data.option.xAxis.name);
				}
			}
		};

		const showXAxis = (checked: boolean) => {
			const option = JSON.parse(value);
			setShowXaxis(checked);
			option.xAxis.show = checked;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const showXAxisTitle = (checked: boolean) => {
			const option = JSON.parse(value);
			setShowXaxisTitle(checked);
			option.xAxis.name =
				option.xAxis.name === "" ? option.xAxis.pixelName : "";
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const handleXaxisTitleChange = (e) => {
			setXaxisTitle(e.target.value);
			const option = JSON.parse(value);
			option.xAxis.name = e.target.value;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const handleChangeXAxisFontSize = (e) => {
			const option = JSON.parse(value);
			setFontSizeXAxis(e.target.value);
			option.xAxis.nameTextStyle.fontSize = e.target.value;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const handleChangeXAxisLabelFontSize = (e) => {
			const option = JSON.parse(value);
			setFontSizeXAxisLabel(e.target.value);
			option.xAxis.axisLabel.fontSize = e.target.value;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const rotateXAxis = (newValue: number[]) => {
			const option = JSON.parse(value);
			setRotateXaxis(newValue[0]);
			option.xAxis.axisLabel.rotate = newValue[0];
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const showXAxisTick = (checked: boolean) => {
			const option = JSON.parse(value);
			setShowXaxisTick(checked);
			option.xAxis.axisTick.show = checked;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const showXAxisLabel = (checked: boolean) => {
			const option = JSON.parse(value);
			setShowAxisLabel(checked);
			option.xAxis.axisLabel.show = checked;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const Reset = () => {
			const option = JSON.parse(value);
			setShowXaxis(option.reset.axis.xaxis.show);
			setShowXaxisTitle(true);
			setXaxisTitle(option.xAxis.pixelName);
			setFontSizeXAxis(option.reset.axis.xaxis.nameTextStyle.fontSize);
			setFontSizeXAxisLabel(option.reset.axis.xaxis.axisLabel.fontSize);
			setRotateXaxis(option.reset.axis.xaxis.axisLabel.rotate);
			setShowXaxisTick(option.reset.axis.xaxis.axisTick.show);
			setShowAxisLabel(option.reset.axis.xaxis.axisLabel.show);
			option.xAxis.show = option.reset.axis.xaxis.show;
			option.xAxis.name = option.xAxis.pixelName;
			option.xAxis.nameTextStyle.fontSize =
				option.reset.axis.xaxis.nameTextStyle.fontSize;
			option.xAxis.axisLabel.fontSize =
				option.reset.axis.xaxis.axisLabel.fontSize;
			option.xAxis.axisLabel.rotate =
				option.reset.axis.xaxis.axisLabel.rotate;
			option.xAxis.axisTick.show = option.reset.axis.xaxis.axisTick.show;
			option.xAxis.axisLabel.show =
				option.reset.axis.xaxis.axisLabel.show;
			setData(path, option as PathValue<D["data"], typeof path>);
		};
		return (
			<div className="flex flex-col">
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch checked={showXaxis} onCheckedChange={showXAxis} />
					<span className="text-sm">Show/Hide Axis</span>
				</div>
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={showXaxisTitle}
						onCheckedChange={showXAxisTitle}
					/>
					<span className="text-sm">Show Axis Title</span>
				</div>
				{showXaxisTitle && (
					<div className="flex flex-col">
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Set X Axis Title
							</span>
							{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
							// biome-ignore
							{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
							<Input
								id="xaxis-title"
								value={xaxisTitle}
								onChange={handleXaxisTitleChange}
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
								value={fontSizeXAxis}
								onChange={handleChangeXAxisFontSize}
							/>
						</div>
					</div>
				)}

				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={showAxisLabel}
						onCheckedChange={showXAxisLabel}
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
								id="xaxis-label-font-size"
								type="number"
								value={fontSizeXAxisLabel}
								onChange={handleChangeXAxisLabelFontSize}
							/>
						</div>
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-sm">Rotate Labels</span>
							<Slider
								min={0}
								max={360}
								value={[rotateXaxis]}
								onValueChange={rotateXAxis}
							/>
						</div>
					</div>
				)}
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={showXaxisTick}
						onCheckedChange={showXAxisTick}
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
