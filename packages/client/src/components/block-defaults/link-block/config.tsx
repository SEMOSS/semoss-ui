import { BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';

import {
    buildListener,
    buildSpacingSection,
    buildDimensionsSection,
    buildColorSection,
    buildTypographySection,
    buildBorderSection,
} from '../block-defaults.shared';

import { LinkBlockDef, LinkBlock } from './LinkBlock';
import { Link } from '@mui/icons-material';
import { BLOCK_TYPE_ACTION } from '../block-defaults.constants';

// export the config for the block
export const config: BlockConfig<LinkBlockDef> = {
    widget: 'link',
    type: BLOCK_TYPE_ACTION,
    data: {
        style: {},
        label: 'Example Link',
        route: '',
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: LinkBlock,
    icon: Link,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Label',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
                {
                    description: 'Route',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Route" path="route" />
                    ),
                },
            ],
        },
    ],
    styleMenu: [
        buildSpacingSection(),
        buildDimensionsSection(),
        buildColorSection(),
        buildBorderSection(),
        buildTypographySection(),
    ],
};
