import { observer } from "mobx-react-lite";
import type { EchartVisualizationBlockDef } from "@semoss/renderer";
import { Stack, Switch, styled, Typography } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";

const StyledToggleContainer = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	padding: "16px",
	gap: "12px",
}));

interface ToggleDataZoomProps {
	id: string;
}

export const ToggleDataZoom = observer(({ id }: ToggleDataZoomProps) => {
	const { data, setData } = useBlockSettings<EchartVisualizationBlockDef>(id);

	const isDataZoomEnabled = data.option?.dataZoom !== undefined;

	const handleToggleDataZoom = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const enabled = event.target.checked;

		if (enabled) {
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
		<StyledToggleContainer>
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
			>
				<Typography variant="body1">Enable Data Zoom</Typography>
				<Switch
					checked={isDataZoomEnabled}
					onChange={handleToggleDataZoom}
				/>
			</Stack>
			<Typography variant="caption" color="textSecondary">
				Enable zoom and pan controls for the chart. Use the slider below
				the chart or mouse wheel/drag to zoom.
			</Typography>
		</StyledToggleContainer>
	);
});
