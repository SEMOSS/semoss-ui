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
import { FontFamily, Pie_Alignment } from "../../Visualization.constants";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const PieValueLabel = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		// biome-ignore lint/style/useConst: reassigned
		let [value, setValue] = useState("");
		const [showValueLabel, setShowValueLabel] = useState(true);
		const [valueLabel, setvalueLabel] = useState({
			position: "outside",
			size: 8,
			lineLength: 8,
			family: "",
			rotate: 0,
			rotateLabelMinValue: 0,
			rotateLabelMaxValue: 360,
			color: "#000000",
		});

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
		}, [showValueLabel]);
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const retainLocalState = (options: any) => {
			setvalueLabel((prev) => ({
				...prev,
				position: options.series[0].label.position,
				size: options.series[0].label.fontSize,
				lineLength: options.series[0].labelLine.length,
				family: options.series[0].label.fontFamily,
				rotate: options.series[0].label.rotate,
			}));
		};
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const reInitializeFeatures = (options: any) => {
			setShowValueLabel(options.series[0].label.show ?? true);
		};
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		function handleInputChange(title: string, inputValue: any) {
			const option = JSON.parse(value);
			if (title === "showValueLabel") {
				option.series[0].label.show = inputValue;
				setShowValueLabel(inputValue);
			} else if (title === "labelPosition") {
				option.series[0].label.position = inputValue;
				setvalueLabel((prev) => ({ ...prev, position: inputValue }));
			} else if (title === "labelRotate") {
				option.series[0].label.rotate = inputValue;
				setvalueLabel((prev) => ({ ...prev, rotate: inputValue }));
			} else if (title === "labelSize") {
				option.series[0].label.fontSize = inputValue;
				setvalueLabel((prev) => ({ ...prev, size: inputValue }));
			} else if (title === "labelLength") {
				option.series[0].labelLine.length = inputValue;
				setvalueLabel((prev) => ({ ...prev, lineLength: inputValue }));
			} else if (title === "labelFamily") {
				option.series[0].label.fontFamily = inputValue;
				setvalueLabel((prev) => ({ ...prev, family: inputValue }));
			}
			setData(path, option as PathValue<D["data"], typeof path>);
		}

		function _handleReset() {
			const option = JSON.parse(value);
			option.series[0].label.show = option.reset.label.show;
			option.series[0].label.position = option.reset.label.position;
			option.series[0].label.rotate = option.reset.label.rotate;
			option.series[0].label.fontSize = option.reset.label.fontSize;
			option.series[0].labelLine.length = option.reset.labelLine.length;
			option.series[0].label.fontFamily = option.reset.label.fontFamily;
			option.series[0].label.color = option.reset.label.color;
			setData(path, option as PathValue<D["data"], typeof path>);
			retainLocalState(option);
		}

		return (
			<div className="flex flex-col">
				<div className="mt-2 flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={!!showValueLabel}
						onCheckedChange={(checked: boolean) =>
							handleInputChange("showValueLabel", checked)
						}
					/>
					<span className="text-sm">Show Value Label</span>
				</div>
				{showValueLabel && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Choose a position for Value Label
						</span>
						<Select
							value={valueLabel?.position}
							onValueChange={(val) =>
								handleInputChange("labelPosition", val)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								{Pie_Alignment.map((label, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
									<SelectItem key={index} value={label}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
				{showValueLabel && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Rotate Value Label:
						</span>
						<Slider
							value={[valueLabel.rotate]}
							min={valueLabel.rotateLabelMinValue}
							max={valueLabel.rotateLabelMaxValue}
							onValueChange={(v: number[]) =>
								handleInputChange("labelRotate", v[0])
							}
						/>
						<div className="flex justify-between text-xs">
							<span>{valueLabel.rotateLabelMinValue}</span>
							<span>{valueLabel.rotateLabelMaxValue}</span>
						</div>
					</div>
				)}
				{showValueLabel && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Value Label Size
						</span>
						{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id*/}
						<Input
							id="size"
							name="size"
							value={valueLabel?.size}
							onChange={(e) =>
								handleInputChange("labelSize", e.target.value)
							}
						/>
					</div>
				)}
				{showValueLabel && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Value Label Line Length
						</span>
						{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
						{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id*/}
						<Input
							id="length"
							name="length"
							value={valueLabel?.lineLength}
							onChange={(e) =>
								handleInputChange("labelLength", e.target.value)
							}
						/>
					</div>
				)}
				{showValueLabel && (
					<div className="mb-2 flex flex-col gap-2 px-4 py-2">
						<span className="text-muted-foreground text-sm">
							Select Font Family
						</span>
						<Select
							value={valueLabel?.family}
							onValueChange={(val) =>
								handleInputChange("labelFamily", val)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select" />
							</SelectTrigger>
							<SelectContent>
								{FontFamily.map((label, index) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
									<SelectItem key={index} value={label}>
										{label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
				{showValueLabel && (
					<ColorPickerSettings
						id={id}
						path="option.series.0.label.color"
						colorValue={valueLabel.color}
						onChange={(e) => handleInputChange("color", e)}
					/>
				)}
				{showValueLabel && (
					<div className="flex justify-end px-4 py-2">
						<Button onClick={handleReset}>Reset</Button>
					</div>
				)}
			</div>
		);
	},
);
