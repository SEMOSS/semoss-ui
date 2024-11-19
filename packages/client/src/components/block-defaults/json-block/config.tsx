import { CSSProperties } from 'react';
import { BlockConfig } from '@/stores';
import {
    QuerySelectionSettings,
    InputSettings,
    SelectInputSettings,
    QueryInputSettings,
} from '@/components/block-settings';

import {
    buildDimensionsSection,
    buildListener,
} from '../block-defaults.shared';

import { JsonBlockDef, JsonBlock } from './JsonBlock';
import { IntegrationInstructions } from '@mui/icons-material';
import { BLOCK_TYPE_ACTION } from '../block-defaults.constants';

export const DefaultStyles: CSSProperties = {};

// export the config for the block
export const config: BlockConfig<JsonBlockDef> = {
    widget: 'JSON',
    type: BLOCK_TYPE_ACTION,
    data: {
        text: {},
        loading: false,
        disabled: false,
    },
    listeners: {
        onClick: [],
    },
    slots: {},
    render: JsonBlock,
    icon: IntegrationInstructions,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Text',
                    render: ({ id }) => (
                        <QueryInputSettings id={id} label="Text" path="text" />
                    ),
                },
                {
                    description: 'Loading',
                    render: ({ id }) => (
                        <QuerySelectionSettings
                            id={id}
                            label="Loading"
                            path="loading"
                            queryPath="isLoading"
                        />
                    ),
                },
            ],
        },
        {
            name: 'on Click',
            children: [...buildListener('onClick')],
        },
    ],
    styleMenu: [],
};
