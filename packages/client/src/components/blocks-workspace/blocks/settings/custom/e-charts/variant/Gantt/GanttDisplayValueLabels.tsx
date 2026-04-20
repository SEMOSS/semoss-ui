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
import { useBlockSettings } from "@/hooks";

export const GanttDisplayValueLabels = observer(
	<D extends BlockDef = BlockDef>({ id, path }) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id); //block data
		const [displayValueLabelsData, setDisplayValueLabelsData] =
			useState(false); //display value labels state
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null); //timeout ref for setting data
		const displayValueLabelsId = useId();
		//get the computed value of the block data
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
		// retain the values of the display value labels
		// biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
		useEffect(() => {
			const parsedJson = JSON.parse(computedValue);
			if (parsedJson.customSettings?.gantttools?.showDisplayValueLabels) {
				setDisplayValueLabelsData(
					() =>
						parsedJson.customSettings.gantttools
							.showDisplayValueLabels,
				);
			}
		}, []);
		//update fields when display value labels is changed
		function updateFields(checked: boolean) {
			setDisplayValueLabelsData(checked);
			let option = JSON.parse(computedValue);
			option = {
				...option,
				customSettings: {
					...option.customSettings,
					gantttools: {
						...option.customSettings.gantttools,
						showDisplayValueLabels: checked,
					},
				},
			};
			runStateUpdateCustom(option);
		}
		//run state update when display value labels is changed
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
					id={displayValueLabelsId}
					checked={displayValueLabelsData}
					onCheckedChange={(checked) => updateFields(checked)}
				/>
				<label htmlFor={displayValueLabelsId} className="pl-2.5">
					Show Display Value Labels
				</label>
			</div>
		);
	},
);
