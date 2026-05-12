import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import {
	type Block,
	type BlockDef,
	getValueByPath,
	type Paths,
	type PathValue,
} from "@semoss/renderer";
import {
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { Line_Curve_Type, Line_Type } from "../../Visualization.constants";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

interface LineSeriesStyle {
	type?: string;
	width?: number;
}

interface LineSeriesOption {
	smooth?: boolean;
	step?: string | boolean;
	lineStyle?: LineSeriesStyle;
}

interface LineStyleOption {
	series: LineSeriesOption[];
}

export const LineStyling = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		// biome-ignore lint/style/useConst: reassigned
		let [value, setValue] = useState("");
		const [lineCurve, setLineCurve] = useState("");
		const [lineType, setLineType] = useState("");
		const [_lineWidth, setLineWidth] = useState(1);
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
				reInitializeFeatures(data.option as LineStyleOption);
			}
		}, [id]);
		/**
		 * Reinitializes the features when the chart is loaded.
		 * @param options the options passed in when the chart is loaded
		 */
		const reInitializeFeatures = (options: LineStyleOption) => {
			if (Object.hasOwn(options, "series")) {
				const seriesLength = options.series.length;
				for (let i = 0; i < seriesLength; i++) {
					if (Object.hasOwn(options.series[i], "smooth")) {
						setLineCurve("Smooth");
					} else if (Object.hasOwn(options.series[i], "step")) {
						setLineCurve("Step");
					} else {
						setLineCurve("Exact");
					}
					const lineStyle = options.series[i].lineStyle;
					if (lineStyle?.type) {
						if (lineStyle.type === "solid") {
							setLineType("Solid");
						} else if (lineStyle.type === "dashed") {
							setLineType("Dashed");
						} else {
							setLineType("Dotted");
						}
					}
					if (typeof lineStyle?.width === "number") {
						setLineWidth(lineStyle.width);
					}
				}
			}
		};
		/**
		 * Handle the change event for any Title input
		 * @param line the line of the input field
		 * @param inputValue the value of the input field
		 */
		function handleInputChange(line: string, inputValue: string | number) {
			const option = JSON.parse(value);
			if (line === "lineCurve") {
				const dataLength = option.series.length;
				for (let i = 0; i < dataLength; i++) {
					if (inputValue === "Smooth") {
						option.series[i].step = "";
						option.series[i].smooth = true;
					} else if (inputValue === "Exact") {
						option.series[i].smooth = false;
						option.series[i].step = "";
					} else if (inputValue === "Step") {
						option.series[i].step = "start";
					}
				}
				setLineCurve(inputValue as string);
			} else if (line === "lineType") {
				const dataLength = option.series.length;
				for (let i = 0; i < dataLength; i++) {
					if (inputValue === "Solid") {
						option.series[i].lineStyle.type = "solid";
					} else if (inputValue === "Dashed") {
						option.series[i].lineStyle.type = "dashed";
					} else if (inputValue === "Dotted") {
						option.series[i].lineStyle.type = "dotted";
					}
				}
				setLineType(inputValue as string);
			} else if (line === "lineWidth") {
				const dataLength = option.series.length;
				for (let i = 0; i < dataLength; i++) {
					option.series[i].lineStyle.width = inputValue as number;
				}
				setLineWidth(inputValue as number);
			}
			setData(path, option as PathValue<D["data"], typeof path>);
		}
		return (
			<div className="flex flex-col p-2">
				<div className="mt-2 flex flex-col gap-2 px-4 py-2">
					<span className="text-muted-foreground text-sm">
						Select Graph Curve Type
					</span>
					<Select
						value={lineCurve}
						onValueChange={(val) =>
							handleInputChange("lineCurve", val)
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select" />
						</SelectTrigger>
						<SelectContent>
							{Line_Curve_Type.map((label, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								<SelectItem value={label} key={index}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="mt-2 flex flex-col gap-2 px-4 py-2">
					<span className="text-muted-foreground text-sm">
						Select Line Type
					</span>
					<Select
						value={lineType}
						onValueChange={(_val) =>
							handleInputChange("lineType", _val)
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select" />
						</SelectTrigger>
						<SelectContent>
							{Line_Type.map((label, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								<SelectItem value={label} key={index}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="mt-2 flex flex-col gap-2 px-4 py-2">
					<span className="text-muted-foreground text-sm">
						Line Width
					</span>
					{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
					<Input
						id="size"
						name="size"
						value={_lineWidth}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							handleInputChange(
								"lineWidth",
								Number(e.target.value),
							)
						}
					/>
				</div>
			</div>
		);
	},
);
