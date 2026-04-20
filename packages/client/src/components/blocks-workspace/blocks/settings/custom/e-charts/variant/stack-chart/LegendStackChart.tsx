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
import { Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const LegendStackChart = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [value, setValue] = useState("");
		const [legend, setShowLegend] = useState<boolean>(true);
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
		 * Reinitializes the features of the tooltip based on the provided options.
		 * @param options The options to reinitialize the features with.
		 */
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const reinitializeFeatures = (options: any) => {
			if (Object.hasOwn(options, "legend")) {
				// Set the showTooltips state to the value of the show property of the tooltip object
				setShowLegend(options.legend.show);
			}
		};
		/**
		 * Handles the switch change event for the tooltip by toggling the showTooltips state and updating the tooltip options in the data.
		 * @param checked The new checked value.
		 */
		const showLegend = (checked: boolean) => {
			const option = JSON.parse(value);
			setShowLegend(checked);
			option.legend.show = checked;
			setData(path, option as PathValue<D["data"], typeof path>);
		};
		return (
			<div className="flex flex-row p-2">
				<div className="ml-1 flex flex-row items-center p-2">
					<Switch checked={legend} onCheckedChange={showLegend} />
					<span className="pl-2.5 text-sm">Show Legend</span>
				</div>
			</div>
		);
	},
);
