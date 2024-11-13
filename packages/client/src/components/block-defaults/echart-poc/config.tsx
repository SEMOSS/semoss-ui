import { BlockConfig } from '@/stores';
// import {
//     VegaVisualizationBlockDef,
//     VegaVisualizationBlock,
// } from './VegaVisualizationBlock';
import { Insights } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
// import { VegaVisualizationBlockMenu } from './VegaVisualizationBlockMenu';
import {
    EchartVisualizationBlockDef,
    EchartVisualizationBlock,
} from './echartblocks';
import { EchartVisualizationBlockMenu } from './echartblocksmenu';

export const config: BlockConfig<EchartVisualizationBlockDef> = {
    widget: 'echart',
    type: BLOCK_TYPE_CHART,
    data: {
        specJson: '',
        variation: undefined,
        option: undefined,
    },
    listeners: {},
    slots: {},
    render: EchartVisualizationBlock,
    icon: Insights,
    menu: EchartVisualizationBlockMenu,
};
