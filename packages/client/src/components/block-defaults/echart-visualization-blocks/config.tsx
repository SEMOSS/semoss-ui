import { BlockConfig } from '@/stores';
import { Insights } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import {
    EchartVisualizationBlock,
    EchartVisualizationBlockDef,
} from './EchartVisualizationBlock';
import { EchartVisualizationBlockMenu } from './EchartVisualizationBlockMenu';

export const config: BlockConfig<EchartVisualizationBlockDef> = {
    widget: 'e-chart',
    type: BLOCK_TYPE_CHART,
    data: {
        style: {
            height: 500,
            width: 400,
        },
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
    render: EchartVisualizationBlock,
    icon: Insights,
    contentMenu: [
        {
            name: 'Settings',
            children: [
                {
                    description: 'Columns',
                    render: ({ id }) => (
                        <EchartVisualizationBlockMenu id={id} />
                    ),
                },
            ],
        },
    ],
};
