import { BlockConfig, BlockJSON } from '@/stores';
import { FileCopyOutlined } from '@mui/icons-material';

import {
    buildLayoutSection,
    buildColorSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { PageBlockDef, PageBlock } from './PageBlock';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { SelectInputSettings } from '@/components/block-settings/shared/SelectInputSettings';
import { BorderSettings } from '@/components/block-settings';

import { config as HeaderBlockConfig } from '@/components/block-defaults/header-block';
import { config as BodyBlockConfig } from '@/components/block-defaults/body-block';
import { config as FooterBlockConfig } from '@/components/block-defaults/footer-block';

// export the config for the block
export const config: BlockConfig<PageBlockDef> = {
    widget: 'page',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            display: 'flex',
            gap: '2rem',
            alignItems: 'start',
        },
    },
    listeners: {},
    slots: {
        content: [
            {
                widget: HeaderBlockConfig.widget,
                data: HeaderBlockConfig.data,
                listeners: HeaderBlockConfig.listeners,
                slots: (HeaderBlockConfig.slots || {}) as BlockJSON['slots'],
            },
            {
                widget: BodyBlockConfig.widget,
                data: BodyBlockConfig.data,
                listeners: BodyBlockConfig.listeners,
                slots: (BodyBlockConfig.slots || {}) as BlockJSON['slots'],
            },
            {
                widget: FooterBlockConfig.widget,
                data: FooterBlockConfig.data,
                listeners: FooterBlockConfig.listeners,
                slots: (FooterBlockConfig.slots || {}) as BlockJSON['slots'],
            },
        ],
    },
    render: PageBlock,
    icon: FileCopyOutlined,
    contentMenu: [],
    styleMenu: [
        buildLayoutSection(),
        // root pages don't get margin for spacing
        {
            name: 'Spacing',
            children: [
                {
                    description: 'Padding',
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            path="style.padding"
                            label="Padding"
                            options={[
                                {
                                    value: '1rem',
                                    display: 'Small',
                                },
                                {
                                    value: '2rem',
                                    display: 'Medium',
                                },
                                {
                                    value: '3rem',
                                    display: 'Large',
                                },
                                {
                                    value: '4rem',
                                    display: 'X-Large',
                                },
                            ]}
                            allowUnset
                        />
                    ),
                },
            ],
        },
        buildColorSection(),
        {
            name: 'Border',
            children: [
                {
                    description: 'Border',
                    render: ({ id }) => (
                        <BorderSettings id={id} path="style.border" />
                    ),
                },
            ],
        },
        buildTypographySection(),
    ],
};
