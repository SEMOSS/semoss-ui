import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import {
    buildTextAlignSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { LinkBlockDef, LinkBlock } from './LinkBlock';
import { Link } from '@mui/icons-material';
import { BLOCK_TYPE_ACTION } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<LinkBlockDef> = {
    widget: 'link',
    type: BLOCK_TYPE_ACTION,
    data: {
        style: {
            padding: '4px',
            whiteSpace: 'pre-line',
            textOverflow: 'ellipsis',
        },
        href: '',
        text: 'Insert text',
    },
    listeners: {},
    slots: {},
    render: LinkBlock,
    icon: Link,
    isBlocksMenuEnabled: true,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Destination',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Destination"
                            path="href"
                        />
                    ),
                },
                {
                    description: 'Text',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Text" path="text" />
                    ),
                },
            ],
        },
    ],
    styleMenu: [buildTypographySection(), buildTextAlignSection()],
};
