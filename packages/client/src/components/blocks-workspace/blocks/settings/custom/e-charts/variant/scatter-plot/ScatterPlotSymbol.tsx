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
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const ScatterPlotSymbol = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [value, setValue] = useState("");
		const [symbolShape, setSymbolShape] = useState("circle");
		const [symbolSize, setSymbolSize] = useState(15);
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
		 * Reinitializes the features of the scatter plot based on the provided options.
		 * @param options The options to reinitialize the features with.
		 */
		const reinitializeFeatures = (options) => {
			if (Object.hasOwn(options, "series")) {
				if (Object.hasOwn(options.series[0], "symbol")) {
					setSymbolShape(options.series[0].symbol);
				}
				if (Object.hasOwn(options.series[0], "symbolSize")) {
					setSymbolSize(options.series[0].symbolSize);
				}
			}
		};
		/**
		 * Handles the change event of the symbol shape select box.
		 * @param val The new value.
		 */
		const handleSymbolShape = (val: string) => {
			setSymbolShape(val);
			const option = JSON.parse(value);
			option.series[0].symbol = val;
			setData(path, option as PathValue<D["data"], typeof path>);
		};
		/**
		 * Handles the change event for the symbol size input.
		 * @param e The event that triggered this function.
		 */
		const handleChangeSymbolSize = (e) => {
			const option = JSON.parse(value);
			setSymbolSize(e.target.value);
			option.series[0].symbolSize = e.target.value;
			setData(path, option as PathValue<D["data"], typeof path>);
		};
		return (
			<div className="flex flex-col">
				<div className="flex flex-col gap-2 px-4 py-2">
					<span className="text-muted-foreground text-sm">
						Symbol Shape
					</span>
					<Select
						value={symbolShape}
						onValueChange={handleSymbolShape}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="circle">Circle</SelectItem>
							<SelectItem value="rect">Rectangle</SelectItem>
							<SelectItem value="roundRect">
								Round Rectangle
							</SelectItem>
							<SelectItem value="triangle">traingle</SelectItem>
							<SelectItem value="arrow">Arrow</SelectItem>
							<SelectItem value="pin">Pin</SelectItem>
							<SelectItem value="diamond">Diamond</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2 px-4 py-2">
					<span className="text-muted-foreground text-sm">
						Symbol Size
					</span>
					{/* biome-ignore lint/suspicious/noCommentText: JSX comment in text node */}
					{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id*/}
					<Input
						id="Symbol Size"
						value={symbolSize}
						onChange={handleChangeSymbolSize}
					/>
				</div>
			</div>
		);
	},
);
