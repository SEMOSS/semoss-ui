import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
	type EchartVisualizationBlockDef,
	getValueByPath,
} from "@semoss/renderer";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";

interface ChangeOrientationProps {
	id: string;
}

export const ChangeOrientation = observer(({ id }: ChangeOrientationProps) => {
	const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);
	const [orientationData, setOrientationData] = useState("LR");

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
		const option =
			typeof computedValue === "string"
				? JSON.parse(computedValue)
				: computedValue;
		const seriesIndex = option.series.findIndex(
			(item) => item.type === "tree",
		);

		const orientation =
			option.series[seriesIndex].orient || orientationData;
		setOrientationData(orientation);
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: TODO
	useEffect(() => {
		if (orientationData !== "") {
			const option =
				typeof computedValue === "string"
					? JSON.parse(computedValue)
					: computedValue;
			const seriesIndex = option.series.findIndex(
				(item) => item.type === "tree",
			);
			option.series[seriesIndex].orient = orientationData;
			runStateUpdate(option);
		}
	}, [orientationData]);

	// biome-ignore lint/suspicious/noExplicitAny: echart/gantt type
	function runStateUpdate(option: any) {
		setTimeout(() => {
			try {
				setData("option", option);
			} catch (e) {
				console.log(e);
			}
		}, 300);
	}

	function resetToInitialState() {
		setOrientationData("LR");
	}

	return (
		<div className="flex flex-col p-2">
			<div className="flex flex-col gap-2 p-2">
				<span className="text-muted-foreground text-sm">
					Select Orientation
				</span>
				<Select
					value={orientationData}
					onValueChange={(val) => setOrientationData(val)}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="LR">Horizontal</SelectItem>
						<SelectItem value="TB">Vertical</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="flex justify-end p-2">
				<Button onClick={resetToInitialState}>Reset</Button>
			</div>
		</div>
	);
});
