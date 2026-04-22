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

export const LineLegend = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [value, setValue] = useState("");
		const [showLegend, setShowLegend] = useState(true);
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
			if (Object.hasOwn(options, "legend")) {
				setShowLegend(options.legend.show);
			}
		};
		//Handle the change event for the toggle switch
		const handleLegend = (checked: boolean) => {
			const option = JSON.parse(value);
			setShowLegend(checked);
			option.legend.show = checked;
			setData(path, option as PathValue<D["data"], typeof path>);
		};
		return (
			<div>
				<div className="mt-2 flex flex-row items-center gap-2 px-4 py-2">
					<Switch
						checked={showLegend}
						onCheckedChange={handleLegend}
					/>
					<span className="text-muted-foreground text-sm">
						Show Legend
					</span>
				</div>
			</div>
		);
	},
);
