import { BlockConfig } from '@/stores';
import { ChatBubbleOutline } from '@mui/icons-material';

import { buildListener } from '../block-defaults.shared';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { ChatBlockDef, ChatBlock } from './ChatBlock';
import {
    InputSettings,
    QuerySelectionSettings,
} from '@/components/block-settings';

// export the config for the block
export const config: BlockConfig<ChatBlockDef> = {
    widget: 'chat',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        loading: false,
        ask: '',
        history: [],
    },
    listeners: {
        onLoad: [],
        onAsk: [],
    },
    slots: {},
    render: ChatBlock,
    icon: ChatBubbleOutline,
    contentMenu: [
        {
            name: 'General',
            children: [
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
                {
                    description: 'Ask',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Ask" path="ask" />
                    ),
                },
                {
                    description: 'History',
                    render: ({ id }) => (
                        <QuerySelectionSettings
                            id={id}
                            label="History"
                            path="history"
                            queryPath="output"
                        />
                    ),
                },
            ],
        },
        {
            name: 'on Load',
            children: [...buildListener('onLoad')],
        },
        {
            name: 'on Ask',
            children: [...buildListener('onAsk')],
        },
    ],
    styleMenu: [],
};
