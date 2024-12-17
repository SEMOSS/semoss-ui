import { BlockConfig } from '@/stores';
import { Insights } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import {
    VisualizationBlock,
    VisualizationBlockDef,
} from './VisualizationBlock';
import { VisualizationBlockMenu } from './VisualizationBlockMenu';

export const config: BlockConfig<VisualizationBlockDef> = {
    widget: 'e-chart',
    type: BLOCK_TYPE_CHART,
    data: {
        option: {},
        variation: '',
        frame: {
            name: '',
        },
        columns: [],
        contextMenu: {
            hideFilter: false,
            hideUnfilter: false,
            hideExclude: false,
        },
    },
    listeners: {},
    slots: {},
    render: VisualizationBlock,
    icon: Insights,
    menu: VisualizationBlockMenu,
};
