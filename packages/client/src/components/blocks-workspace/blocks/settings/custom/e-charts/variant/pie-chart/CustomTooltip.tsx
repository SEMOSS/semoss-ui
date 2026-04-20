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

export const CustomTooltip = observer(
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
		//Reinitialize the feature when the chart is loaded
		const reInitializeFeatures = (options) => {
			if (Object.hasOwn(options, "tooltip")) {
				setShowTooltip(options.tooltip.show);
			}
		};
		//Handle the change event for the toggle switch
		const showTooltip = (checked: boolean) => {
			const option = JSON.parse(value);
			setShowTooltip(checked);
			option.tooltip.show = checked;
			setData(path, option as PathValue<D["data"], typeof path>);
		};
		return (
			<div className="px-4 py-2">
				<div className="flex flex-row items-center gap-2">
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
