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

export const GanttGroupView = observer(
	<D extends BlockDef = BlockDef>({ id, path }) => {
		const { data, setData } =
			useBlockSettings<EchartVisualizationBlockDef>(id); // block data
		const [groupViewData, setGroupViewData] = useState(false); // groupview component state
		const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null); //timeout ref for setting data
		const groupViewId = useId();
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
			if (parsedJson.customSettings?.gantttools?.showGroupView) {
				setGroupViewData(
					() => parsedJson.customSettings.gantttools.showGroupView,
				);
			}
		}, []);
		//update the fields and also the state when group view fields are changed
		function updateFields(checked: boolean) {
			setGroupViewData(checked);
			let option = JSON.parse(computedValue);
			option = {
				...option,
				customSettings: {
					...option.customSettings,
					gantttools: {
						...option.customSettings.gantttools,
						showGroupView: checked,
					},
				},
			};
			runStateUpdateCustom(option);
		}
		//run the state update when group view fields are changed
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
					id={groupViewId}
					checked={groupViewData}
					onCheckedChange={(checked) => updateFields(checked)}
				/>
				<label htmlFor={groupViewId} className="pl-2.5">
					Show Group View
				</label>
			</div>
		);
	},
);
