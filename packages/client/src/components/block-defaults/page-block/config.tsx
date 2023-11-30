import { BlockConfig } from '@/stores';
import { FileCopyOutlined } from '@mui/icons-material';

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildStyleSection,
    buildTypographySection,
} from '../block-defaults.shared';

import { PageBlockDef, PageBlock } from './PageBlock';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { SpacingSettings } from '@/components/block-settings/SpacingSettings';

// export the config for the block
export const config: BlockConfig<PageBlockDef> = {
    widget: 'page',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            display: 'flex',
            gap: '2em',
            alignItems: 'start',
        },
    },
    listeners: {},
    slots: {
        content: [],
    },
    render: PageBlock,
    icon: FileCopyOutlined,
    menu: [
        buildLayoutSection(),
        // root pages don't get margin for spacing
        {
            name: 'Spacing',
            children: [
                {
                    description: 'Padding',
                    render: ({ id }) => (
                        <SpacingSettings
                            id={id}
                            label="Padding"
                            path="style.padding"
                        />
                    ),
                },
            ],
        },
        buildDimensionsSection(),
        buildStyleSection(),
        buildTypographySection(),
    ],
};
