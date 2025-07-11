import { BlockConfig } from "../../../store";
import {
    VegaVisualizationBlockDef,
    VegaVisualizationBlock,
} from "./VegaVisualizationBlock";
import { BLOCK_TYPE_CHART } from "../block-defaults.constants";

export const config: BlockConfig<VegaVisualizationBlockDef> = {
    widget: "vega",
    type: BLOCK_TYPE_CHART,
    data: {
        specJson: "",
        variation: undefined,
    },
    listeners: {},
    slots: {},
    render: VegaVisualizationBlock,
};
