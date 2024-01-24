import { BlockConfig } from '@/stores';

import { QueryBlockDef, QueryBlock } from './QueryBlock';
import { HighlightAlt } from '@mui/icons-material';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { InputSettings } from '@/components/block-settings';

// export the config for the block
export const config: BlockConfig<QueryBlockDef> = {
    widget: 'query',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {},
        queryId: '',
        stepId: '',
    },
    listeners: {},
    slots: {},
    render: QueryBlock,
    icon: HighlightAlt,
    isBlocksMenuEnabled: false,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Query Id',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Query Id"
                            path="queryId"
                        />
                    ),
                },
                {
                    description: 'Step Id',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Step Id" path="stepId" />
                    ),
                },
            ],
        },
    ],
    styleMenu: [],
};
