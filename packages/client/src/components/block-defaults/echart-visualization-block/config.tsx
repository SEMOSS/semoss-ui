import { BlockConfig } from '@/stores';

import { Insights } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import {
    EchartVisualizationBlock,
    EChartVisualizationBlockDef,
} from './EChartVisualizationBlock';
import { EChartVisualizationBlockMenu } from './EChartVisualizationBlockMenu';
export const config: BlockConfig<EChartVisualizationBlockDef> = {
    widget: 'e-chart',
    type: BLOCK_TYPE_CHART,
    data: {
        option: {},
        variation: '',
        frame: {
            name: '',
        },
        columns: [],
    },
    listeners: {},
    slots: {},
    render: EchartVisualizationBlock,
    icon: Insights,
    menu: EChartVisualizationBlockMenu,
};
