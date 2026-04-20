import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { getValueByPath } from "@semoss/renderer";
import { Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

interface LegendDendrogramProps {
	id: string;
}

export const LegendDendrogram = observer(({ id }: LegendDendrogramProps) => {
	const { data, setData } = useBlockSettings(id);
	const [legend, setLegend] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
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
	}, [data, "option"]).get();
	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
	useEffect(() => {
		let option =
			typeof computedValue === "string"
				? JSON.parse(computedValue)
				: computedValue;
		option = {
			...option,
			legend: {
				...option.legend,
				show: legend,
			},
		};
		runStateUpdate(option);
	}, [legend]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
	useEffect(() => {
		const option =
			typeof computedValue === "string"
				? JSON.parse(computedValue)
				: computedValue;
		const legendData = option.legend?.show || false;
		setLegend(legendData);
	}, []);
	function runStateUpdate(option) {
		setTimeout(() => {
			try {
				setData("option", option);
			} catch (e) {
				console.log(e);
			}
		}, 300);
	}

	return (
		<div className="flex flex-row p-2">
			<div className="ml-0.5 inline-flex w-full justify-around p-2">
				<Switch
					checked={legend ?? undefined}
					onCheckedChange={(checked) => setLegend(checked)}
				/>
				<span className="w-full pl-5 text-sm">Show Legend</span>
			</div>
		</div>
	);
});
