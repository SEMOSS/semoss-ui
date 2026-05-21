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
import { useBlockSettings } from "@/hooks/useBlockSettings";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const TooltipScatterPlot = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [value, setValue] = useState("");
		const [showTooltips, setShowTooltip] = useState<boolean>(true);
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
			if (Object.hasOwn(options, "tooltip")) {
				// Set the showTooltips state to the value of the show property of the tooltip object
				setShowTooltip(options.tooltip.show);
			}
		};
		/**
		 * Handles the switch change event for the tooltip by toggling the showTooltips state and updating the tooltip options in the data.
		 * @param checked The new checked value.
		 */
		const showTooltip = (checked: boolean) => {
			const option = JSON.parse(value);
			setShowTooltip(checked);
			option.tooltip.show = checked;
			setData(path, option as PathValue<D["data"], typeof path>);
		};
		return (
			<div>
				<div className="flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={showTooltips}
						onCheckedChange={showTooltip}
					/>
					<span className="text-sm">Show Tooltip</span>
				</div>
			</div>
		);
	},
);
