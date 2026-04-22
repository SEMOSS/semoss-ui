import { observer } from "mobx-react-lite";
import type React from "react";
import { createClassFromSpec, type VisualizationSpec } from "react-vega";
import type { FixedVegaChartProps } from "react-vega/lib/createClassFromSpec";
import { useBlock } from "../../../hooks";
import type { BlockComponent } from "../../../store";

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
			<div {...attrs} className="h-[200px] w-[200px]">
				Add JSON to render your visualization
			</div>
		);
	}

	if (typeof data.specJson === "string") {
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
		} catch {
			return (
				<div
					{...attrs}
					className="h-[200px] w-[200px] text-destructive"
				>
					There was an issue parsing your JSON.
				</div>
			);
		}
	}

	const Chart = createClassFromSpec({
		spec: data.specJson,
	}) as unknown as React.FunctionComponent<FixedVegaChartProps>;

	return (
		<div {...attrs}>
			<Chart actions={false} />
		</div>
	);
});
