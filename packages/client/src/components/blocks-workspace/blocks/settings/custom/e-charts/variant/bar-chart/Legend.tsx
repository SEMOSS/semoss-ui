import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
	type BlockDef,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type PathValue,
} from "@semoss/renderer";
import { Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

//Legend component
export const Legend = observer(
	<D extends BlockDef = BlockDef>({ id, path }) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id); //current chart's data option
		const [value, setValue] = useState({});
		const [isLegendShown, setIsLegendShown] = useState<boolean>(false);
		// get the value of the input (wrapped in usememo because of path prop)
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
		//update the value to the most recent value from the state
		useEffect(() => {
			setValue(computedValue);
		}, [computedValue]);
		//retain the legend value from the current state
		// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
		useEffect(() => {
			const option =
				typeof value === "string" ? JSON.parse(value) : value;
			let legendShown = isLegendShown;
			if (Object.hasOwn(option, "legend") && option.legend) {
				legendShown = Object.hasOwn(option.legend, "show")
					? option.legend.show
					: false;
			}
			setIsLegendShown(legendShown);
		}, []);
		//handles legend toggle input changes
		function handleInputChange(_fieldName, newVal) {
			setIsLegendShown((_prevProps) => {
				return newVal;
			});
			let option = typeof value === "string" ? JSON.parse(value) : value;
			if (option.legend) {
				option = {
					...option,
					legend: {
						...option.legend,
						show: !option.legend.show,
					},
				};
			} else {
				option = {
					...option,
					legend: {
						type: "plain",
						show: true,
					},
				};
			}
			option = {
				...option,
				customSettings: {
					...option.customSettings,
					toolsUpdated: true,
				},
			};
			runStateUpdateCustom(option);
		}
		//updating the state of Block with a debounce time
		function runStateUpdateCustom(
			updatedOption: PathValue<D["data"], typeof path>,
		) {
			setTimeout(() => {
				try {
					setData(
						"option",
						updatedOption as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		}
		return (
			<div>
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={isLegendShown}
						onCheckedChange={(checked) => {
							handleInputChange("isLegendShown", checked);
						}}
					/>
					<span className="text-sm">Show Legend</span>
				</div>
			</div>
		);
	},
);
