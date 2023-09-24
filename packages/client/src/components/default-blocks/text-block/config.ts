import { BlockConfig } from '@/stores';
import { JsonSettings } from '@/components/default-settings';

import { TextBlockDef, TextBlock } from './TextBlock';

// export the config for the block
export const config: BlockConfig<TextBlockDef> = {
    widget: 'text',
    data: {
        style: {},
        text: 'Hello world',
    },
    listeners: {},
    slots: {
        test: [],
    },
    render: TextBlock,
    menu: [
        {
            name: 'Editor',
            children: [
                {
                    description: 'Default editor to edit the underlying json',
                    render: JsonSettings,
                },
            ],
        },
    ],
};
