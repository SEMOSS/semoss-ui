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
import { Input } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
	id: string;
	path: Paths<Block<D>["data"], 4>;
}

export const MapMarkerSize = observer(
	<D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
		const { data, setData } = useBlockSettings<D>(id);
		const [value, setValue] = useState("");
		const [markerSize, setMarkerSize] = useState(5);
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
		// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
		const reinitializeFeatures = (options: any) => {
			if (Object.hasOwn(options, "series")) {
				if (Object.hasOwn(options.series[0], "symbolSize")) {
					setMarkerSize(options.series[0].symbolSize);
				}
			}
		};

		const handleChangeSymbolSize = (
			e: React.ChangeEvent<HTMLInputElement>,
		) => {
			const option = JSON.parse(value);
			setMarkerSize(Number(e.target.value));
			option.series[0].symbolSize = e.target.value;
			option.symbolSize = e.target.value;
			setData(path, option as PathValue<D["data"], typeof path>);
		};

		return (
			<div className="flex flex-col gap-2 p-2">
				<span className="text-muted-foreground text-sm">
					Marker Size
				</span>
				{/* biome-ignore lint/correctness/useUniqueElementIds: component-scoped id */}
				<Input
					id="Symbol Size"
					value={markerSize}
					onChange={handleChangeSymbolSize}
				/>
			</div>
		);
	},
);
