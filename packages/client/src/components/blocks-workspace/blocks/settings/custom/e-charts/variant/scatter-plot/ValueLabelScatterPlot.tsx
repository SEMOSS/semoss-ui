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
import {
	Button,
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
import { ColorPickerSettings } from "../../../../shared/ColorPickerSettings";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const ValueLabelScatterPlot = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [value, setValue] = useState("");
		const [showLabel, setShowLabel] = useState(true);
		const [labelPosition, setLabelPosition] = useState("top");
		const [labelRotation, setLabelRotation] = useState(0);
		const [labelFont, setLabelFont] = useState("sans-serif");
		const [labelFontSize, setLabelFontSize] = useState(12);
		const [labelColor, setLabelColor] = useState("#000000");

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
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const reinitializeFeatures = (options: any) => {
			if (Object.hasOwn(options, "xAxis")) {
				if (Object.hasOwn(options, "series")) {
					if (Object.hasOwn(options.series[0], "label")) {
						setLabelPosition(options.series[0].label.position);
						setLabelRotation(options.series[0].label.rotate);
						setLabelFont(options.series[0].label.fontFamily);
						setLabelFontSize(options.series[0].label.fontSize);
						setShowLabel(options.series[0].label.show);
						setLabelColor(options.series[0].label.color);
					}
				}
			}
		};

		const showValueLabel = (checked: boolean) => {
			const parsedValue = JSON.parse(value);
			setShowLabel(checked);
			parsedValue.series[0].label.show = checked;
			setData(path, parsedValue as PathValue<D["data"], typeof path>);
		};

		const handleValuePosition = (val: string) => {
			setLabelPosition(val);
			const option = JSON.parse(value);
			option.series[0].label.position = val;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const handleChangelabelRotation = (newValue: number[]) => {
			const option = JSON.parse(value);
			setLabelRotation(newValue[0]);
			option.series[0].label.rotate = newValue[0];
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const handlelabelFont = (val: string) => {
			setLabelFont(val);
			const option = JSON.parse(value);
			option.series[0].label.fontFamily = val;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const handleLabelSize = (e: React.ChangeEvent<HTMLInputElement>) => {
			const option = JSON.parse(value);
			setLabelFontSize(Number(e.target.value));
			option.series[0].label.fontSize = e.target.value;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		const Reset = () => {
			const option = JSON.parse(value);
			setLabelPosition(option.reset.label.position);
			setLabelRotation(option.reset.label.rotate);
			setLabelFont(option.reset.label.fontFamily);
			setLabelFontSize(option.reset.label.fontSize);
			setShowLabel(option.reset.label.show);
			option.series[0].label.show = option.reset.label.show;
			option.series[0].label.position = option.reset.label.position;
			option.series[0].label.rotate = option.reset.label.rotate;
			option.series[0].label.fontFamily = option.reset.label.fontFamily;
			option.series[0].label.fontSize = option.reset.label.fontSize;
			option.series[0].label.color = option.reset.label.color;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		return (
			<div className="flex flex-col">
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={showLabel}
						onCheckedChange={showValueLabel}
					/>
					<span className="text-sm">Show Labels</span>
				</div>
				{showLabel && (
					<div className="flex flex-col">
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Choose a Position For Value Label
							</span>
							<Select
								value={labelPosition}
								onValueChange={handleValuePosition}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="top">Top</SelectItem>
									<SelectItem value="left">Left</SelectItem>
									<SelectItem value="right">Right</SelectItem>
									<SelectItem value="bottom">
										Bottom
									</SelectItem>
									<SelectItem value="inside">
										Inside
									</SelectItem>
									<SelectItem value="insideLeft">
										Inside Left
									</SelectItem>
									<SelectItem value="insideRight">
										Inside Right
									</SelectItem>
									<SelectItem value="insideBottom">
										Inside Bottom
									</SelectItem>
									<SelectItem value="insideTop">
										Inside Top
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-sm">Rotate Value Label</span>
							<Slider
								min={0}
								max={360}
								value={[labelRotation]}
								onValueChange={handleChangelabelRotation}
							/>
						</div>
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Select Font
							</span>
							<Select
								value={labelFont}
								onValueChange={handlelabelFont}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="sans-serif">
										sans-serif
									</SelectItem>
									<SelectItem value="serif">serif</SelectItem>
									<SelectItem value="monospace">
										monospace
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-2 px-4 py-2">
							<span className="text-muted-foreground text-sm">
								Select Font Size
							</span>
							{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
							// biome-ignore
							{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
							<Input
								id="Select Font Size"
								value={labelFontSize}
								onChange={handleLabelSize}
							/>
						</div>
						<ColorPickerSettings
							id={id}
							path={"option.series.0.label.color"}
							colorValue={labelColor}
							onChange={() => {}}
						/>
					</div>
				)}
				<div className="flex justify-end px-4 py-2">
					<Button onClick={Reset}>Reset</Button>
				</div>
			</div>
		);
	},
);
