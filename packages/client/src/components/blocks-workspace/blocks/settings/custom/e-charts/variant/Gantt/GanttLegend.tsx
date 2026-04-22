import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
	type BlockDef,
	type EchartVisualizationBlockDef,
	getValueByPath,
	type PathValue,
} from "@semoss/renderer";
import { Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

export const GanttLegend = observer(
	<D extends BlockDef = BlockDef>({ id, path }) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id); //block data
		const [legendData, setLegendData] = useState(false); //legend component data
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null); //timeout ref for setting data
		const legendId = useId();
		//get the computed value of the block data
		// biome-ignore lint/correctness/useExhaustiveDependencies: "option" is a literal string dependency
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
		}, [data]).get();
		//to retain the values from state
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
		useEffect(() => {
			const parsedJson = JSON.parse(computedValue);
			if (parsedJson.customSettings?.gantttools?.showLegend) {
				setLegendData(
					() => parsedJson.customSettings.gantttools.showLegend,
				);
			}
		}, []);
		//update the fields and also the state when legend fields are changed
		function updateFields(checked: boolean) {
			setLegendData(checked);
			let option = JSON.parse(computedValue);
			option = {
				...option,
				customSettings: {
					...option.customSettings,
					gantttools: {
						...option.customSettings.gantttools,
						showLegend: checked,
					},
				},
			};
			runStateUpdateCustom(option);
		}
		//run the state update when fields in legend are changed
		function runStateUpdateCustom(option) {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
			timeoutRef.current = setTimeout(() => {
				try {
					setData(
						"option",
						option as PathValue<D["data"], typeof path>,
					);
				} catch (e) {
					console.log(e);
				}
			}, 300);
		}
		return (
			<div className="border-[#E6E6E6] border-b p-2">
				<Switch
					id={legendId}
					checked={legendData}
					onCheckedChange={(checked) => updateFields(checked)}
				/>
				<label htmlFor={legendId} className="pl-2.5">
					Show Legend
				</label>
			</div>
		);
	},
);
