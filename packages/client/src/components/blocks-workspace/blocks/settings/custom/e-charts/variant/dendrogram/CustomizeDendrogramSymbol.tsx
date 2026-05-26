import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
	type BlockDef,
	type EchartVisualizationBlockDef,
	getValueByPath,
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

export const CustomizeDendrogramSymbol = observer(
	<_D extends BlockDef = BlockDef>({ id }: { id: string }) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id);
		const [customizeSymbol, setCustomizeSymbol] = useState({
			symbolShape: "circle",
			symbolSize: 12,
			symbolUrl: "",
		});
		const symbolData = [
			{ label: "Circle", value: "circle" },
			{ label: "Rectangle", value: "rect" },
			{ label: "Round Rectagle", value: "roundRect" },
			{ label: "Triangle", value: "triangle" },
			{ label: "Arrow", value: "arrow" },
			{ label: "Pin", value: "pin" },
			{ label: "Diamond", value: "diamond" },
			{ label: "None", value: "none" },
		];
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
		function updateFields(fieldToUpdate: string, fieldUpdatedValue: any) {
			setCustomizeSymbol({
				...customizeSymbol,
				[fieldToUpdate]: fieldUpdatedValue,
			});
		}
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const jsonData = JSON.parse(computedValue);
			// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
			const seriesIndex = jsonData.series.findIndex((item: any) => {
				return item.type === "tree";
			});
			setCustomizeSymbol({
				symbolShape: jsonData.series[seriesIndex].symbol,
				symbolSize: jsonData.series[seriesIndex].symbolSize,
				symbolUrl: jsonData.series[seriesIndex].symbol,
			});
		}, []);
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const jsonData = JSON.parse(computedValue);
			// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
			const seriesIndex = jsonData.series.findIndex((item: any) => {
				return item.type === "tree";
			});
			jsonData.series[seriesIndex] = {
				...jsonData.series[seriesIndex],
				symbol: customizeSymbol.symbolShape,
				symbolSize: customizeSymbol.symbolSize,
				symbolUrl: customizeSymbol.symbolUrl,
			};
			runStateUpdateCustom(jsonData);
		}, [customizeSymbol]);
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		function runStateUpdateCustom(option: any) {
			setTimeout(() => {
				try {
					setData("option", option);
				} catch (err) {
					console.log(err);
				}
			}, 300);
		}

		function _resetToInitialState() {
			setCustomizeSymbol({
				symbolShape: "circle",
				symbolSize: 12,
				symbolUrl: "",
			});
		}

		return (
			<div className="flex flex-col p-2">
				<div className="flex flex-col gap-2 p-2">
					<span className="text-muted-foreground text-sm">
						Symbol Shape
					</span>
					<Select
						value={customizeSymbol.symbolShape}
						onValueChange={(val) =>
							updateFields("symbolShape", val)
						}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select" />
						</SelectTrigger>
						<SelectContent>
							{symbolData.map((item, index) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: no stable key available
								<SelectItem key={index} value={item.value}>
									{item.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-2 p-2">
					<span className="text-muted-foreground text-sm">
						Symbol Size
					</span>
					{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
					<Input
						id="Symbol Size"
						type="number"
						value={customizeSymbol.symbolSize}
						onChange={(_e) =>
							updateFields("symbolSize", _e.target.value)
						}
					/>
				</div>
				<div className="flex justify-end p-2">
					<Button onClick={_resetToInitialState}>Reset</Button>
				</div>
			</div>
		);
	},
);
