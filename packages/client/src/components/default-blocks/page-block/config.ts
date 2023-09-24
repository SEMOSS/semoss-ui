import { BlockConfig } from '@/stores';
import { JsonSettings } from '@/components/default-settings';

import { PageBlockDef, PageBlock } from './PageBlock';

// export the config for the block
export const config: BlockConfig<PageBlockDef> = {
    widget: 'page',
    data: {
        style: {},
    },
    listeners: {},
    slots: {
        content: [],
    },
    render: PageBlock,
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
