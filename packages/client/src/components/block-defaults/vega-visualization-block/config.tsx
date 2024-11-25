import { BlockConfig } from '@/stores';
import {
    VegaVisualizationBlockDef,
    VegaVisualizationBlock,
} from './VegaVisualizationBlock';
import { Insights } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import { VegaVisualizationBlockMenu } from './VegaVisualizationBlockMenu';
import { VegaVisualizationBlockSettings } from './VegaVisualizationBlockSettings';

export const config: BlockConfig<VegaVisualizationBlockDef> = {
    widget: 'vega',
    type: BLOCK_TYPE_CHART,
    data: {
        frame: {
            name: '',
        },
        axis: {
            x: '',
            y: '',
        },
        specJson: '',
        variation: undefined,
    },
    listeners: {
        onBrush: [],
    },
    slots: {},
    render: VegaVisualizationBlock,
    icon: Insights,
    contentMenu: [
        {
            name: 'Viz Settings',
            children: [
                {
                    description: 'Frame',
                    render: ({ id }) => (
                        <VegaVisualizationBlockSettings id={id} />
                    ),
                },
                {
                    description: 'JSON specification',
                    render: ({ id }) => <VegaVisualizationBlockMenu id={id} />,
                },
            ],
        },
    ],
};
