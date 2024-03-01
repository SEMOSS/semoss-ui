import { BlockConfig } from '@/stores';
import {
    VegaVisualizationBlockDef,
    VegaVisualizationBlock,
} from './VegaVisualizationBlock';
import { Insights } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import { VegaVisualizationBlockMenu } from './VegaVisualizationBlockMenu';

export const config: BlockConfig<VegaVisualizationBlockDef> = {
    widget: 'vega',
    type: BLOCK_TYPE_CHART,
    data: {
        specJson: '',
        variation: undefined,
    },
    listeners: {},
    slots: {},
    render: VegaVisualizationBlock,
    icon: Insights,
    menu: VegaVisualizationBlockMenu,
};
