import { styled } from "@mui/material";
import { observer } from "mobx-react-lite";
import type React from "react";
import { createClassFromSpec, type VisualizationSpec } from "react-vega";
import type { FixedVegaChartProps } from "react-vega/lib/createClassFromSpec";
import { useBlock } from "../../../hooks";
import type { BlockComponent } from "../../../store";

const StyledNoDataContainer = styled("div", {
	shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error = false, theme }) => ({
	height: "200px",
	width: "200px",
	color: error ? theme.palette.error.main : "unset",
}));

export interface VegaVisualizationBlockDef {
	widget: "vega";
	data: {
		specJson: VisualizationSpec | string;
		variation?: undefined | string;
	};
	listeners: never;
	slots: never;
}

export const VegaVisualizationBlock: BlockComponent = observer(({ id }) => {
	const { data, attrs } = useBlock<VegaVisualizationBlockDef>(id);

	if (!data.specJson) {
		return (
			<StyledNoDataContainer {...attrs}>
				Add JSON to render your visualization
			</StyledNoDataContainer>
		);
	}
	if (typeof data.specJson === "string") {
		// if it's a string, it's either invalid json or a query output that needs to be parsed
		// try to parse, and show error otherwise
		try {
			const specJson = JSON.parse(data.specJson);

			const Chart = createClassFromSpec({
				spec: specJson,
			}) as unknown as React.FunctionComponent<FixedVegaChartProps>;

			return (
				<div {...attrs}>
					<Chart actions={false} />
				</div>
			);
		} catch (e) {
			return (
				<StyledNoDataContainer error {...attrs}>
					There was an issue parsing your JSON.
				</StyledNoDataContainer>
			);
		}
	} else {
		const Chart = createClassFromSpec({
			spec: data.specJson,
		}) as unknown as React.FunctionComponent<FixedVegaChartProps>;

		return (
			<div {...attrs}>
				<Chart actions={false} />
			</div>
		);
	}
});
