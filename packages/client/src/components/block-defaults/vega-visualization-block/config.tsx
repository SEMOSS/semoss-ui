import { BlockConfig } from '@/stores';

import {
    VegaVisualizationBlockDef,
    VegaVisualizationBlock,
} from './VegaVisualizationBlock';
import { Insights } from '@mui/icons-material';
import { BLOCK_TYPE_CHART } from '../block-defaults.constants';
import { QueryInputSettings } from '@/components/block-settings';

// export the config for the block
export const config: BlockConfig<VegaVisualizationBlockDef> = {
    widget: 'vega',
    type: BLOCK_TYPE_CHART,
    data: {
        specJson: '',
        data: '',
    },
    listeners: {},
    slots: {},
    render: VegaVisualizationBlock,
    icon: Insights,
    isBlocksMenuEnabled: false,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'JSON Specification',
                    render: ({ id }) => (
                        <QueryInputSettings
                            id={id}
                            label="JSON"
                            path="specJson"
                        />
                    ),
                },
                {
                    description: 'Data',
                    render: ({ id }) => (
                        <QueryInputSettings id={id} label="JSON" path="data" />
                    ),
                },
            ],
        },
    ],
    styleMenu: [],
};
