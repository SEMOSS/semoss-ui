import { observer } from "mobx-react-lite";
import type { EchartVisualizationBlockDef } from "@semoss/renderer";
import { Switch } from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";

interface ToggleDataZoomProps {
	id: string;
}

export const ToggleDataZoom = observer(({ id }: ToggleDataZoomProps) => {
	const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);

	const isDataZoomEnabled = data.option?.dataZoom !== undefined;

	const handleToggleDataZoom = (checked: boolean) => {
		if (checked) {
			// Enable dataZoom with slider and inside zoom
			setData("option.dataZoom", [
				{ type: "slider", orient: "horizontal", filterMode: "none" },
				{ type: "inside", orient: "horizontal", filterMode: "none" },
			]);
		} else {
			// Remove dataZoom
			const updatedOption = { ...data.option };
			delete updatedOption.dataZoom;
			setData("option", updatedOption);
		}
	};

	return (
		<div className="flex flex-col gap-3 p-4">
			<div className="flex flex-row items-center justify-between">
				<span className="text-sm">Enable Data Zoom</span>
				<Switch
					checked={isDataZoomEnabled}
					onCheckedChange={handleToggleDataZoom}
				/>
			</div>
			<span className="text-muted-foreground text-xs">
				Enable zoom and pan controls for the chart. Use the slider below
				the chart or mouse wheel/drag to zoom.
			</span>
		</div>
	);
});
