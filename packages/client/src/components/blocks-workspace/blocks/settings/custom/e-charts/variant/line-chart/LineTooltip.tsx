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

export const LineTooltip = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [value, setValue] = useState("");
		const [showTooltips, setShowTooltip] = useState(true);
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
		/**
		 * Reinitializes the tooltip feature when the chart is loaded.
		 * @param options - The options passed in when the chart is loaded.
		 */
		const reInitializeFeatures = (options) => {
			// Check if the options include tooltip settings
			if (Object.hasOwn(options, "tooltip")) {
				// Set the tooltip visibility based on the options
				setShowTooltip(options.tooltip.show);
			}
		};
		/**
		 * Handles the change event for the toggle switch. Updates the state of showTooltips
		 * and sets the tooltip.show property in the chart options.
		 * @param checked - The new checked value
		 */
		const showTooltip = (checked: boolean) => {
			const option = JSON.parse(value);
			// Toggle the state of showTooltips
			setShowTooltip(checked);
			// Update the tooltip.show property in the chart options
			option.tooltip.show = checked;
			// Update the chart options in the data
			setData(path, option as PathValue<D["data"], typeof path>);
		};
		return (
			<div>
				<div className="mt-2 flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={showTooltips}
						onCheckedChange={showTooltip}
					/>
					<span className="text-muted-foreground text-sm">
						Show Tooltip
					</span>
				</div>
			</div>
		);
	},
);
