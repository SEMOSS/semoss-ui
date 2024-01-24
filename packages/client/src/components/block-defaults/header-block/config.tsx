import { BlockConfig } from '@/stores';
import { BorderTop } from '@mui/icons-material';

import {
    buildLayoutSection,
    buildColorSection,
    buildTypographySection,
    buildDimensionsSection,
} from '../block-defaults.shared';

import { HeaderBlockDef, HeaderBlock } from './HeaderBlock';
import { BLOCK_TYPE_LAYOUT } from '../block-defaults.constants';
import { SelectInputSettings } from '@/components/block-settings/shared/SelectInputSettings';
import { BorderSettings, SizeSettings } from '@/components/block-settings';

// export the config for the block
export const config: BlockConfig<HeaderBlockDef> = {
    widget: 'header',
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            height: '10%',
        },
    },
    listeners: {},
    slots: {
        content: [],
    },
    render: HeaderBlock,
    icon: BorderTop,
    isBlocksMenuEnabled: true,
    contentMenu: [],
    styleMenu: [
        buildDimensionsSection(),
        buildLayoutSection(),
        // root headers don't get margin for spacing
        {
            name: 'Spacing',
            children: [
                {
                    description: 'Padding',
                    render: ({ id }) => (
                        <SizeSettings
                            id={id}
                            label="Padding"
                            path="style.padding"
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
